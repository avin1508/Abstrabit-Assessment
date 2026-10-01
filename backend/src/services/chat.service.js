import { GenerationError, generateChatTurn } from '../ai/gemini.js'
import { buildGroundedUserTurn, buildSystemInstruction, UNKNOWN_ANSWER } from '../ai/prompts.js'
import { TOOL_DECLARATIONS } from '../ai/tools.js'
import { env } from '../config/env.js'
import { Conversation, Message, ToolCall } from '../models/index.js'
import { HttpError } from '../utils/httpError.js'
import { logger } from '../utils/logger.js'
import { EmbeddingError } from './embedding.service.js'
import { searchSimilarChunks } from './retrieval.service.js'
import { executeToolCall, toToolCallResponse } from './tool.service.js'

const RETRIEVAL_LIMIT = 5
const HISTORY_MESSAGES = 10
const MAX_TOOL_ROUNDS = 3
const MAX_CALLS_PER_ROUND = 3
const DEFAULT_TITLE = 'New conversation'
const EXCERPT_LENGTH = 300
const ERROR_ANSWER = 'Sorry — I couldn’t generate an answer this time. Please try again.'

const FILE_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/markdown': 'md',
  'text/plain': 'txt',
}

export function toConversationResponse(conversation) {
  return {
    id: conversation._id.toString(),
    workspaceId: conversation.workspaceId.toString(),
    userId: conversation.userId.toString(),
    title: conversation.title || DEFAULT_TITLE,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  }
}

export function toMessageResponse(message, toolCall = null) {
  return {
    id: message._id.toString(),
    conversationId: message.conversationId.toString(),
    role: message.role,
    status: message.status,
    content: message.content ?? '',
    citations: (message.citations ?? []).map((citation) => ({
      index: citation.index,
      documentId: citation.documentId.toString(),
      chunkId: citation.chunkId.toString(),
      documentName: citation.documentName,
      fileType: citation.fileType,
      pageNumber: citation.pageNumber,
      location: citation.location,
      excerpt: citation.excerpt,
    })),
    toolCallId: message.toolCallId ? message.toolCallId.toString() : null,
    ...(message.role === 'tool' && { toolCall: toolCall ? toToolCallResponse(toolCall) : null }),
    createdAt: message.createdAt,
  }
}

async function toMessageResponses(messages) {
  const ids = messages.filter((message) => message.toolCallId).map((message) => message.toolCallId)
  const toolCalls = ids.length ? await ToolCall.find({ _id: { $in: ids } }) : []
  const byId = new Map(toolCalls.map((toolCall) => [toolCall._id.toString(), toolCall]))
  return messages.map((message) => toMessageResponse(message, byId.get(message.toolCallId?.toString())))
}

// A conversation is visible only to its user, inside its (already verified) workspace.
async function findConversation(workspaceId, userId, conversationId) {
  const conversation = await Conversation.findOne({ _id: conversationId, workspaceId, userId })
  if (!conversation) throw new HttpError(404, 'Conversation not found')
  return conversation
}

const messagesOf = (conversationId) => Message.find({ conversationId }).sort({ createdAt: 1, _id: 1 })

export async function createConversation(workspaceId, userId, { title }) {
  const conversation = await Conversation.create({ workspaceId, userId, title: title || DEFAULT_TITLE })
  return toConversationResponse(conversation)
}

export async function listConversations(workspaceId, userId) {
  const conversations = await Conversation.find({ workspaceId, userId }).sort({ updatedAt: -1 })
  return conversations.map(toConversationResponse)
}

export async function getConversation(workspaceId, userId, conversationId) {
  const conversation = await findConversation(workspaceId, userId, conversationId)
  const messages = await messagesOf(conversation._id)
  return { conversation: toConversationResponse(conversation), messages: await toMessageResponses(messages) }
}

const isUnknownAnswer = (text) => /^\s*i\s+don['’]?t\s+know\b/i.test(text)

function buildCitations(rawAnswer, sources, { citeAllIfUnmarked = true } = {}) {
  // Accept the forms models use — [1], [Source 1], [1, 2], [Sources 1 and 2] — as [1][2].
  const answer = rawAnswer.replace(
    /\[\s*(?:sources?\s*)?(\d+(?:\s*(?:,|and|&)\s*(?:source\s*)?\d+)*)\s*\]/gi,
    (_, list) => list.split(/\s*(?:,|and|&)\s*(?:source\s*)?/i).map((n) => `[${n.trim()}]`).join(''),
  )
  const order = []
  for (const [, n] of answer.matchAll(/\[(\d+)\]/g)) {
    const index = Number(n)
    if (index >= 1 && index <= sources.length && !order.includes(index)) order.push(index)
  }
  // Nothing cited: list every source for a normal answer, but none for a tool
  // confirmation (it isn't based on the documents).
  const used = order.length || !citeAllIfUnmarked ? order : sources.map((_, i) => i + 1)
  const renumber = new Map(order.map((original, i) => [original, i + 1]))
  const content = answer
    .replace(/\[(\d+)\]/g, (marker, n) => (renumber.has(Number(n)) ? `[${renumber.get(Number(n))}]` : ''))
    .replace(/[ \t]+([.,;:])/g, '$1')
    .trim()

  const citations = used.map((original, i) => {
    const source = sources[original - 1]
    return {
      index: i + 1,
      documentId: source.documentId,
      chunkId: source.chunkId,
      documentName: source.documentName,
      fileType: FILE_TYPES[source.mimeType] ?? null,
      pageNumber: source.pageNumber ?? null,
      location: source.pageNumber ? `Page ${source.pageNumber}` : `Chunk ${source.chunkIndex + 1}`,
      excerpt: source.content.length > EXCERPT_LENGTH ? `${source.content.slice(0, EXCERPT_LENGTH).trimEnd()}…` : source.content,
    }
  })
  return { content, citations }
}

// Earlier user/assistant exchanges of this conversation, as Gemini chat turns. Tool messages
// are skipped (their outcome is in the assistant's reply); failed answers and the questions
// they belong to are left out.
function historyTurns(messages) {
  const chat = messages.filter((message) => message.role !== 'tool')
  const turns = []
  for (let i = 0; i < chat.length - 1; i++) {
    const [question, reply] = [chat[i], chat[i + 1]]
    if (question.role === 'user' && reply.role === 'assistant' && reply.status !== 'error') {
      turns.push({ role: 'user', parts: [{ text: question.content }] }, { role: 'model', parts: [{ text: reply.content }] })
      i++
    }
  }
  return turns
}

const stableKey = (name, args) =>
  `${name}:${JSON.stringify(args && typeof args === 'object' ? Object.fromEntries(Object.entries(args).sort()) : args)}`

// Used when the model runs a tool but then returns no text.
function describeOutcome(responses) {
  return responses
    .map(({ name, response }) =>
      response.success
        ? name === 'create_task'
          ? `Created the task “${response.title}”.`
          : 'Sent the summary.'
        : `I couldn’t complete ${name}: ${response.error}`,
    )
    .join(' ')
}

export async function runToolLoop({ systemInstruction, contents, context, generate = generateChatTurn }) {
  const toolCalls = []
  const outcomes = []
  // The model sometimes repeats the same call in one turn; run it once.
  const seen = new Map()
  let model
  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const lastRound = round === MAX_TOOL_ROUNDS
      const turn = await generate({ systemInstruction, contents, tools: TOOL_DECLARATIONS, toolsDisabled: lastRound, model })
      model = turn.model
      if (!turn.functionCalls?.length || lastRound) {
        return { text: turn.text || describeOutcome(outcomes), toolCalls }
      }

      contents.push(turn.content ?? { role: 'model', parts: turn.functionCalls.map((call) => ({ functionCall: call })) })
      const parts = []
      for (const [i, call] of turn.functionCalls.entries()) {
        let response
        if (i >= MAX_CALLS_PER_ROUND) {
          response = { success: false, error: 'Too many tool calls at once; this one was not run.' }
        } else {
          const key = stableKey(call.name, call.args)
          response = seen.get(key)
          if (!response) {
            const outcome = await executeToolCall({ name: call.name, args: call.args, context })
            if (outcome.toolCall) toolCalls.push(outcome.toolCall)
            response = outcome.response
            seen.set(key, response)
            outcomes.push({ name: call.name, response })
          }
        }
        parts.push({ functionResponse: { ...(call.id && { id: call.id }), name: call.name, response } })
      }
      contents.push({ role: 'user', parts })
    }
  } catch (error) {
    // If an action already ran, the user gets a factual confirmation built from the tool
    // results rather than an error (which would invite repeating the action).
    if (outcomes.length) {
      logger.warn('[chat] reply after tool call failed; using the tool results instead')
      return { text: describeOutcome(outcomes), toolCalls }
    }
    // Attach what already ran so the UI still shows those actions after a failure.
    error.toolCalls = toolCalls
    throw error
  }
}

async function answerQuestion({ conversation, userId, question, history, since }) {
  const workspaceId = conversation.workspaceId
  const results = await searchSimilarChunks({ workspaceId, query: question, limit: RETRIEVAL_LIMIT })
  const sources = results.filter((result) => result.score >= env.ragMinScore)

  const { text, toolCalls } = await runToolLoop({
    systemInstruction: buildSystemInstruction(),
    contents: [...historyTurns(history), { role: 'user', parts: [{ text: buildGroundedUserTurn(sources, question) }] }],
    context: { workspaceId, userId, conversationId: conversation._id, since },
  })

  // No evidence and no action taken: answer "I don't know." instead of guessing.
  if (!toolCalls.length && (sources.length === 0 || isUnknownAnswer(text))) {
    return { status: 'unknown', content: UNKNOWN_ANSWER, citations: [], toolCalls }
  }
  return { status: 'answer', ...buildCitations(text, sources, { citeAllIfUnmarked: !toolCalls.length }), toolCalls }
}

// Real error details stay in the server log.
function toAnswerError(error) {
  if (error instanceof GenerationError) return new HttpError(502, error.userMessage)
  if (error instanceof EmbeddingError) return new HttpError(error.retryable ? 503 : 502, error.userMessage)
  if (error instanceof HttpError) return error
  logger.error('[chat] answering failed:', error.message)
  return new HttpError(500, 'Something went wrong while answering. Try again.')
}

async function respond({ conversation, userId, question, history, since }) {
  let result
  let failure = null
  try {
    result = await answerQuestion({ conversation, userId, question, history, since })
  } catch (error) {
    failure = toAnswerError(error)
    result = { status: 'error', content: ERROR_ANSWER, citations: [], toolCalls: error.toolCalls ?? [] }
  }

  const base = { conversationId: conversation._id, workspaceId: conversation.workspaceId }
  const toolMessages = []
  for (const toolCall of result.toolCalls) {
    const message = await Message.create({ ...base, role: 'tool', toolCallId: toolCall._id })
    toolMessages.push(toMessageResponse(message, toolCall))
  }
  const assistantMessage = await Message.create({
    ...base,
    role: 'assistant',
    status: result.status,
    content: result.content,
    citations: result.citations,
  })
  await Conversation.updateOne({ _id: conversation._id }, { $currentDate: { updatedAt: true } })

  if (failure) throw failure
  return { toolMessages, assistantMessage: toMessageResponse(assistantMessage) }
}

const recentMessages = async (conversationId, filter = {}) =>
  (await Message.find({ conversationId, ...filter }).sort({ createdAt: -1, _id: -1 }).limit(HISTORY_MESSAGES)).reverse()

export async function sendMessage({ workspaceId, userId, conversationId, content }) {
  const conversation = await findConversation(workspaceId, userId, conversationId)
  const history = await recentMessages(conversation._id)

  const userMessage = await Message.create({
    conversationId: conversation._id,
    workspaceId: conversation.workspaceId,
    role: 'user',
    content,
  })
  if (!conversation.title || conversation.title === DEFAULT_TITLE) {
    const title = content.length > 60 ? `${content.slice(0, 57).trimEnd()}…` : content
    await Conversation.updateOne({ _id: conversation._id }, { $set: { title } })
  }

  const { toolMessages, assistantMessage } = await respond({
    conversation,
    userId,
    question: content,
    history,
    since: userMessage.createdAt,
  })
  return { userMessage: toMessageResponse(userMessage), toolMessages, assistantMessage }
}

// Tools that already succeeded for this question aren't run again (see tool.service.js).
export async function retryLastMessage({ workspaceId, userId, conversationId }) {
  const conversation = await findConversation(workspaceId, userId, conversationId)
  const [last] = await Message.find({ conversationId: conversation._id }).sort({ createdAt: -1, _id: -1 }).limit(1)
  const [question] = await Message.find({ conversationId: conversation._id, role: 'user' }).sort({ createdAt: -1, _id: -1 }).limit(1)
  if (last?.role !== 'assistant' || last.status !== 'error' || !question) {
    throw new HttpError(409, 'There is no failed answer to retry')
  }
  // Atomic: a second concurrent retry finds nothing to delete and stops here.
  const removed = await Message.findOneAndDelete({ _id: last._id, status: 'error' })
  if (!removed) throw new HttpError(409, 'There is no failed answer to retry')

  const history = await recentMessages(conversation._id, { createdAt: { $lt: question.createdAt } })
  const { toolMessages, assistantMessage } = await respond({
    conversation,
    userId,
    question: question.content,
    history,
    since: question.createdAt,
  })
  return { userMessage: toMessageResponse(question), toolMessages, assistantMessage }
}
