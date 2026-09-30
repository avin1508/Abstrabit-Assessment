import { MOCK_CONVERSATIONS } from '../data/mockConversations.js'
import { MOCK_MESSAGES } from '../data/mockMessages.js'
import { KNOWLEDGE } from '../data/mockAnswers.js'
import { store } from '../store/index.js'
import { plainText } from '../utils/chatText.js'
import { getWorkspaceDocumentsSync } from './documentService.js'
import { createToolRun, executeToolRun, getToolRunSync, onToolRunFinished, resumeInFlightRuns } from './toolService.js'
import { inDays } from '../data/mockTime.js'

/*
 * Mock chat service. Stands in for:
 *   GET  /api/workspaces/:workspaceId/conversations
 *   GET  /api/workspaces/:workspaceId/conversations/:id
 *   POST /api/workspaces/:workspaceId/conversations/:id/messages   (streamed)
 *
 * sendMessage/retryMessage report progress through `onEvent`, the way a streaming (SSE)
 * backend would:
 *   { type: 'conversation', conversation }          new conversation created
 *   { type: 'messages', conversationId, messages }  full message list after each change
 *
 * No AI runs here: answers come from KNOWLEDGE (mockAnswers.js), matched per workspace.
 */

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const now = () => new Date().toISOString()
const newId = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

// Every citation is stamped with the workspace of the answer it belongs to.
const stampCitations = (citations, workspaceId) => citations?.map((citation) => ({ ...citation, workspaceId }))

const messages = MOCK_MESSAGES.map((message) => ({
  ...message,
  ...(message.citations && { citations: stampCitations(message.citations, message.workspaceId) }),
}))
const conversations = MOCK_CONVERSATIONS.map((conversation) => {
  const own = messages.filter((message) => message.conversationId === conversation.id)
  return { ...conversation, updatedAt: own.length ? own[own.length - 1].createdAt : conversation.createdAt }
})

// ------------------------------------------------------------------ helpers

// Real workspaces come from the Redux store; this mock chat service only needs the name.
function getWorkspace(workspaceId) {
  const workspace = store.getState().workspace.workspaces.find((candidate) => candidate.id === workspaceId)
  if (!workspace) throw new Error('Workspace not found.')
  return workspace
}

function findConversation(workspaceId, conversationId) {
  const conversation = conversations.find((candidate) => candidate.id === conversationId)
  // Same error whether it doesn't exist or belongs to another workspace.
  if (!conversation || conversation.workspaceId !== workspaceId) throw new Error('Conversation not found.')
  return conversation
}

const messagesOf = (conversationId) => messages.filter((message) => message.conversationId === conversationId)

function toPublic(message) {
  const copy = { ...message }
  if (message.citations) copy.citations = message.citations.map((citation) => ({ ...citation }))
  if (message.role === 'tool') copy.run = getToolRunSync(message.toolRunId)
  return copy
}

function summarize(conversation) {
  const own = messagesOf(conversation.id)
  const chat = own.filter((message) => message.role !== 'tool')
  const last = chat[chat.length - 1]
  const lastAnswer = [...own].reverse().find((message) => message.role === 'assistant' && message.state !== 'thinking')

  let lastText = ''
  if (last?.role === 'user') lastText = last.text
  else if (last?.state === 'thinking') lastText = 'Thinking…'
  else if (last?.state === 'error') lastText = 'Response failed — try again'
  else if (last) lastText = plainText(last.text)

  return {
    id: conversation.id,
    workspaceId: conversation.workspaceId,
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    messageCount: chat.length,
    sourceCount: lastAnswer?.citations?.length ?? 0,
    lastMessage: { role: last?.role ?? 'user', text: lastText, grounded: lastAnswer?.state !== 'unknown' },
  }
}

function addMessage(conversation, fields, { before } = {}) {
  const message = { id: newId('msg'), workspaceId: conversation.workspaceId, conversationId: conversation.id, createdAt: now(), ...fields }
  if (before) messages.splice(messages.indexOf(before), 0, message)
  else messages.push(message)
  conversation.updatedAt = message.createdAt
  return message
}

function emitMessages(conversation, onEvent) {
  onEvent({ type: 'messages', conversationId: conversation.id, messages: messagesOf(conversation.id).map(toPublic) })
}

function toTitle(text) {
  const clean = text.trim().replace(/\s+/g, ' ').replace(/[?.!]+$/, '')
  const title = clean.length > 52 ? `${clean.slice(0, 50).trimEnd()}…` : clean
  return title.charAt(0).toUpperCase() + title.slice(1)
}

// ------------------------------------------------------------------ mock "model"

// Follow-ups that reshape the previous answer instead of searching again.
const REWRITE = /^(thanks|thank you)\b|\b(rephrase|shorter|make (that|it)|one sentence|summari[sz]e (that|this)|tl;?dr)\b/i
const ERROR = /simulate (an )?error/i
const TASK = /(?:create|add|make|open)\s+(?:a\s+)?(?:new\s+)?task\s+(?:to|for)\s+(.+)|remind me to\s+(.+)/i
const SUMMARY = /\b(?:send|post|share|notify)\b.*?(#[\w-]+)/i

function firstSentence(text) {
  const match = /^.+?[.!?](\s|$)/.exec(text)
  return (match ? match[0] : text).trim()
}

const lastCitedAnswer = (conversation) =>
  [...messagesOf(conversation.id)].reverse().find((message) => message.state === 'answer' && message.citations?.length)

// The mock "model" decides to call a tool. Arguments mirror the backend tool schemas.
function detectToolCall(text, conversation) {
  const task = TASK.exec(text)
  if (task) {
    const raw = (task[1] ?? task[2]).trim().replace(/[.!?]+$/, '')
    const title = raw.charAt(0).toUpperCase() + raw.slice(1)
    return { tool: 'create_task', args: { title, dueDate: inDays(3) } }
  }
  const summary = SUMMARY.exec(text)
  if (summary) {
    const previous = lastCitedAnswer(conversation)
    return {
      tool: 'send_summary',
      args: { channel: summary[1], summary: previous ? firstSentence(plainText(previous.text)) : 'Summary of this conversation.' },
    }
  }
  return null
}

function resolveIntent(workspace, conversation, text) {
  if (ERROR.test(text)) return { type: 'error' }

  const toolCall = detectToolCall(text, conversation)
  if (toolCall) return { type: 'tool', ...toolCall }

  if (REWRITE.test(text.trim())) {
    const previous = lastCitedAnswer(conversation)
    return {
      type: 'rewrite',
      text: previous
        ? `Short version: ${firstSentence(plainText(previous.text))}`
        : 'There isn’t an earlier answer in this conversation to rephrase yet. Ask a question about this workspace’s documents first.',
    }
  }

  const indexed = getWorkspaceDocumentsSync(workspace.id).filter((document) => document.status === 'indexed')
  const unknown = {
    type: 'unknown',
    searched: indexed.length,
    text: indexed.length
      ? `I don’t know based on the documents available in ${workspace.name}. I couldn’t find enough information in this workspace’s knowledge to answer this confidently.`
      : `I don’t know — ${workspace.name} doesn’t have any indexed documents yet, so there’s nothing to ground an answer in. Upload documents first, then ask again.`,
  }

  const entry = KNOWLEDGE.find(
    (candidate) =>
      candidate.workspaceId === workspace.id &&
      candidate.match.test(text) &&
      (!candidate.requires || candidate.requires.test(text)) &&
      (!candidate.exclude || !candidate.exclude.test(text)),
  )
  if (!entry) return unknown

  // Only cite documents that are still indexed in this workspace (they may have been deleted).
  const available = new Set(indexed.map((document) => document.id))
  const citations = stampCitations(
    entry.answer.citations.filter((citation) => available.has(citation.documentId)),
    workspace.id,
  )
  if (citations.length === 0) return unknown

  return { type: 'answer', text: entry.answer.text, citations, retrieved: citations.length + 3 }
}

function toolConfirmation(workspace, run) {
  if (run.status === 'blocked') {
    return `I couldn’t run \`${run.tool}\` — your role in ${workspace.name} is **${workspace.role}**, and ${run.error.replace(/^Viewers/, 'viewers').replace(/ in .+$/, '')}. Ask a workspace admin for access.`
  }
  if (run.status === 'failed') return `The \`${run.tool}\` call failed: ${run.error} Nothing was changed.`
  if (run.tool === 'create_task') {
    return `Done — I created the task **${run.args.title}** in ${workspace.name}. You’ll find it on the Tasks page.`
  }
  return `Sent the summary to **${run.args.channel}**.`
}

async function respond(workspace, conversation, text, pending, onEvent, { allowError, author }) {
  const started = Date.now()
  const update = (patch) => {
    Object.assign(pending, patch)
    conversation.updatedAt = now()
    emitMessages(conversation, onEvent)
  }

  let intent = resolveIntent(workspace, conversation, text)
  if (intent.type === 'error' && !allowError) {
    intent = {
      type: 'rewrite',
      text: 'This retry succeeded. The earlier failure was simulated to demonstrate the error state — ask a question about this workspace’s documents to get a grounded answer.',
    }
  }

  if (intent.type === 'rewrite') {
    update({ phase: 'writing', phaseDetail: 'Using the conversation so far — no new search' })
    await delay(900)
    update({ state: 'answer', phase: null, phaseDetail: null, text: intent.text, citations: [], meta: { mode: 'rewrite', latencyMs: Date.now() - started } })
    return
  }

  await delay(900)

  if (intent.type === 'error') {
    update({ state: 'error', phase: null, error: 'The model request timed out after 30 s. No answer was generated.' })
    return
  }

  if (intent.type === 'tool') {
    update({ phase: 'tool', phaseDetail: intent.tool })
    const run = createToolRun({
      workspaceId: workspace.id,
      conversationId: conversation.id,
      tool: intent.tool,
      args: intent.args,
      triggeredBy: author,
    })
    addMessage(conversation, { role: 'tool', toolRunId: run.id }, { before: pending })
    emitMessages(conversation, onEvent)
    await delay(1600)
    const finished = executeToolRun(run.id)
    update({ phase: 'writing', phaseDetail: null })
    await delay(700)
    update({ state: 'answer', phase: null, text: toolConfirmation(workspace, finished), citations: [], meta: { mode: 'tool', latencyMs: Date.now() - started } })
    return
  }

  if (intent.type === 'unknown') {
    update({ phase: 'reading', phaseDetail: `Checked ${intent.searched} documents — nothing relevant enough` })
    await delay(1000)
    update({ state: 'unknown', phase: null, phaseDetail: null, text: intent.text, citations: [], meta: { searchedDocuments: intent.searched, latencyMs: Date.now() - started } })
    return
  }

  const documentCount = new Set(intent.citations.map((citation) => citation.documentId)).size
  update({ phase: 'reading', phaseDetail: `${intent.retrieved} passages from ${documentCount} ${documentCount === 1 ? 'document' : 'documents'}` })
  await delay(1000)
  update({ phase: 'writing', phaseDetail: null })
  await delay(800)
  update({
    state: 'answer',
    phase: null,
    text: intent.text,
    citations: intent.citations,
    meta: { retrieved: intent.retrieved, latencyMs: Date.now() - started },
  })
}

/*
 * When a seeded in-flight tool call finishes in the background, post the assistant's confirmation.
 * Live turns are skipped: their tool message is followed by the pending assistant message,
 * which respond() finalizes itself.
 */
onToolRunFinished((run) => {
  const conversation = conversations.find((candidate) => candidate.id === run.conversationId)
  if (!conversation) return
  const own = messagesOf(conversation.id)
  if (own[own.length - 1]?.toolRunId !== run.id) return
  addMessage(conversation, {
    role: 'assistant',
    state: 'answer',
    text: toolConfirmation(getWorkspace(run.workspaceId), run),
    citations: [],
    meta: { mode: 'tool', latencyMs: run.durationMs ?? 1200 },
  })
})

// ------------------------------------------------------------------ public API

// Synchronous accessor for other mock services (dashboard). Not part of the API surface.
export function getConversationSummariesSync(workspaceId) {
  return conversations
    .filter((conversation) => conversation.workspaceId === workspaceId)
    .map(summarize)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

// What the assistant can draw on in this workspace.
export async function getAssistantContext(workspaceId) {
  await delay(200)
  const indexedDocuments = getWorkspaceDocumentsSync(workspaceId).filter((document) => document.status === 'indexed').length
  return { indexedDocuments }
}

export async function listConversations(workspaceId) {
  await delay(300)
  return getConversationSummariesSync(workspaceId)
}

export async function getConversation(workspaceId, conversationId) {
  await delay(250)
  getWorkspace(workspaceId)
  const conversation = findConversation(workspaceId, conversationId)
  resumeInFlightRuns(workspaceId)
  return { conversation: summarize(conversation), messages: messagesOf(conversation.id).map(toPublic) }
}

export async function sendMessage(workspaceId, { conversationId, text, author }, { onEvent = () => {} } = {}) {
  await delay(150)
  const workspace = getWorkspace(workspaceId)

  let conversation
  if (conversationId) {
    conversation = findConversation(workspaceId, conversationId)
  } else {
    conversation = { id: newId('conv'), workspaceId, title: toTitle(text), createdAt: now(), updatedAt: now() }
    conversations.unshift(conversation)
    onEvent({ type: 'conversation', conversation: summarize(conversation) })
  }

  addMessage(conversation, { role: 'user', text, author })
  const pending = addMessage(conversation, { role: 'assistant', state: 'thinking', phase: 'searching' })
  emitMessages(conversation, onEvent)

  await respond(workspace, conversation, text, pending, onEvent, { allowError: true, author })
  return { conversationId: conversation.id }
}

// Regenerates a failed assistant message in place, answering the user message before it.
export async function retryMessage(workspaceId, conversationId, messageId, { onEvent = () => {} } = {}) {
  await delay(150)
  const workspace = getWorkspace(workspaceId)
  const conversation = findConversation(workspaceId, conversationId)
  const own = messagesOf(conversation.id)
  const failed = own.find((message) => message.id === messageId)
  if (!failed || failed.state !== 'error') throw new Error('Only failed responses can be retried.')

  const question = own.slice(0, own.indexOf(failed)).reverse().find((message) => message.role === 'user')
  Object.assign(failed, { state: 'thinking', phase: 'searching', error: null, createdAt: now() })
  emitMessages(conversation, onEvent)

  await respond(workspace, conversation, question?.text ?? '', failed, onEvent, { allowError: false, author: question?.author })
}
