import { GenerationError, generateText } from '../ai/gemini.js'
import { buildGroundedUserTurn, GROUNDED_SYSTEM_INSTRUCTION, UNKNOWN_ANSWER } from '../ai/prompts.js'
import { env } from '../config/env.js'
import { Conversation, Message } from '../models/index.js'
import { HttpError } from '../utils/httpError.js'
import { logger } from '../utils/logger.js'
import { EmbeddingError } from './embedding.service.js'
import { searchSimilarChunks } from './retrieval.service.js'

const RETRIEVAL_LIMIT = 5
const HISTORY_MESSAGES = 10 // recent messages of this conversation sent as chat history
const DEFAULT_TITLE = 'New conversation'
const EXCERPT_LENGTH = 300
const ERROR_ANSWER = 'Sorry — I couldn’t generate an answer this time. Please try again.'

const FILE_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/markdown': 'md',
  'text/plain': 'txt',
}

// ---------------------------------------------------------------- responses

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

export function toMessageResponse(message) {
  return {
    id: message._id.toString(),
    conversationId: message.conversationId.toString(),
    role: message.role,
    status: message.status,
    content: message.content,
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
    createdAt: message.createdAt,
  }
}

// ---------------------------------------------------------------- conversations

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
  return { conversation: toConversationResponse(conversation), messages: messages.map(toMessageResponse) }
}

// ---------------------------------------------------------------- grounded answering

const isUnknownAnswer = (text) => /^\s*i\s+don['’]?t\s+know\b/i.test(text)

/*
 * Keeps only the sources the answer actually cites, renumbered 1..n in order of first use,
 * and rewrites the [n] markers to match. Markers for sources that weren't provided are dropped.
 * If the answer cites nothing, every source given to the model is listed.
 */
function buildCitations(rawAnswer, sources) {
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
  const used = order.length ? order : sources.map((_, i) => i + 1)
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

// Earlier user/assistant exchanges of this conversation, as Gemini chat turns.
// Failed answers (and the questions they belong to) are left out.
function historyTurns(messages) {
  const turns = []
  for (let i = 0; i < messages.length - 1; i++) {
    const [question, reply] = [messages[i], messages[i + 1]]
    if (question.role === 'user' && reply.role === 'assistant' && reply.status !== 'error') {
      turns.push({ role: 'user', parts: [{ text: question.content }] }, { role: 'model', parts: [{ text: reply.content }] })
      i++
    }
  }
  return turns
}

/*
 * The RAG flow for one question. workspaceId comes from the verified conversation, and
 * retrieval filters by it inside $vectorSearch (retrieval.service.js).
 * Returns { status: 'answer' | 'unknown', content, citations }.
 */
async function answerQuestion({ workspaceId, question, history }) {
  const results = await searchSimilarChunks({ workspaceId, query: question, limit: RETRIEVAL_LIMIT })
  const sources = results.filter((result) => result.score >= env.ragMinScore)
  if (sources.length === 0) return { status: 'unknown', content: UNKNOWN_ANSWER, citations: [] }

  const answer = await generateText({
    systemInstruction: GROUNDED_SYSTEM_INSTRUCTION,
    contents: [...historyTurns(history), { role: 'user', parts: [{ text: buildGroundedUserTurn(sources, question) }] }],
  })
  if (isUnknownAnswer(answer)) return { status: 'unknown', content: UNKNOWN_ANSWER, citations: [] }
  return { status: 'answer', ...buildCitations(answer, sources) }
}

// Safe HTTP error for a failed answer; details stay in the server log.
function toAnswerError(error) {
  if (error instanceof GenerationError) return new HttpError(502, error.userMessage)
  if (error instanceof EmbeddingError) return new HttpError(error.retryable ? 503 : 502, error.userMessage)
  if (error instanceof HttpError) return error
  logger.error('[chat] answering failed:', error.message)
  return new HttpError(500, 'Something went wrong while answering. Try again.')
}

/*
 * Answers `question`, saves the assistant message (status answer | unknown | error) and bumps
 * the conversation. On failure an error message is saved, then a safe HTTP error is thrown.
 */
async function respond(conversation, question, history) {
  let result
  let failure = null
  try {
    result = await answerQuestion({ workspaceId: conversation.workspaceId, question, history })
  } catch (error) {
    failure = toAnswerError(error)
    result = { status: 'error', content: ERROR_ANSWER, citations: [] }
  }

  const assistantMessage = await Message.create({
    conversationId: conversation._id,
    workspaceId: conversation.workspaceId,
    role: 'assistant',
    ...result,
  })
  await Conversation.updateOne({ _id: conversation._id }, { $currentDate: { updatedAt: true } })

  if (failure) throw failure
  return assistantMessage
}

export async function sendMessage({ workspaceId, userId, conversationId, content }) {
  const conversation = await findConversation(workspaceId, userId, conversationId)
  const history = (await Message.find({ conversationId: conversation._id }).sort({ createdAt: -1, _id: -1 }).limit(HISTORY_MESSAGES)).reverse()

  const userMessage = await Message.create({
    conversationId: conversation._id,
    workspaceId: conversation.workspaceId,
    role: 'user',
    content,
  })
  // Name untitled conversations after their first question.
  if (!conversation.title || conversation.title === DEFAULT_TITLE) {
    const title = content.length > 60 ? `${content.slice(0, 57).trimEnd()}…` : content
    await Conversation.updateOne({ _id: conversation._id }, { $set: { title } })
  }

  const assistantMessage = await respond(conversation, content, history)
  return { userMessage: toMessageResponse(userMessage), assistantMessage: toMessageResponse(assistantMessage) }
}

/*
 * Re-answers the latest question when its answer failed. The failed assistant message is
 * replaced; the user's message is reused, not duplicated.
 */
export async function retryLastMessage({ workspaceId, userId, conversationId }) {
  const conversation = await findConversation(workspaceId, userId, conversationId)
  const [last, previous] = await Message.find({ conversationId: conversation._id }).sort({ createdAt: -1, _id: -1 }).limit(2)
  if (last?.role !== 'assistant' || last.status !== 'error' || previous?.role !== 'user') {
    throw new HttpError(409, 'There is no failed answer to retry')
  }
  // Atomic: a second concurrent retry finds nothing to delete and stops here.
  const removed = await Message.findOneAndDelete({ _id: last._id, status: 'error' })
  if (!removed) throw new HttpError(409, 'There is no failed answer to retry')

  const history = (
    await Message.find({ conversationId: conversation._id, _id: { $ne: previous._id } })
      .sort({ createdAt: -1, _id: -1 })
      .limit(HISTORY_MESSAGES)
  ).reverse()
  const assistantMessage = await respond(conversation, previous.content, history)
  return { userMessage: toMessageResponse(previous), assistantMessage: toMessageResponse(assistantMessage) }
}
