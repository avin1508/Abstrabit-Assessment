import api from './axios.js'
import { CONVERSATION_ENDPOINTS } from './endpoints.js'
import { toDateOnly } from '../utils/format.js'

// Conversation routes are workspace-scoped: the backend verifies the signed-in user owns
// the workspace in this header, and that the conversation belongs to both.
const inWorkspace = (workspaceId) => ({ headers: { 'X-Workspace-Id': workspaceId } })

/*
 * Backend message -> the shape the chat components read.
 * `workspaceId` is the workspace the request was made in (backend-verified); the chat UI uses
 * it to drop anything that doesn't belong to the active workspace.
 * Assistant states come straight from the backend: answer | unknown | error.
 */
export function toChatMessage(message, workspaceId) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    workspaceId,
    role: message.role,
    text: message.content ?? '',
    state: message.role === 'assistant' ? message.status : undefined,
    error: message.status === 'error' ? message.content : null,
    // Tool messages carry the logged tool call, in the shape ToolActivity reads.
    ...(message.role === 'tool' && { run: toToolRun(message.toolCall) }),
    citations: (message.citations ?? []).map((citation) => ({
      index: citation.index,
      documentId: citation.documentId,
      chunkId: citation.chunkId,
      documentName: citation.documentName,
      type: citation.fileType,
      pageNumber: citation.pageNumber,
      location: citation.location,
      excerpt: citation.excerpt,
      workspaceId,
    })),
    createdAt: message.createdAt,
  }
}

function toToolRun(toolCall) {
  if (!toolCall) return null
  return {
    id: toolCall.id,
    tool: toolCall.toolName,
    args: toolCall.arguments?.dueDate ? { ...toolCall.arguments, dueDate: toDateOnly(toolCall.arguments.dueDate) } : (toolCall.arguments ?? {}),
    status: toolCall.status, // success | failed
    result: toolCall.result,
    error: toolCall.errorMessage,
    durationMs: toolCall.durationMs,
    createdAt: toolCall.createdAt,
  }
}

// Backend conversation -> sidebar item ({ lastMessage } is filled in once messages are known).
const toConversation = ({ id, workspaceId, title, createdAt, updatedAt }) => ({ id, workspaceId, title, createdAt, updatedAt })

export async function listConversationsRequest(workspaceId) {
  const response = await api.get(CONVERSATION_ENDPOINTS.LIST, inWorkspace(workspaceId))
  return response.data.data.conversations.map(toConversation)
}

export async function createConversationRequest(workspaceId, title) {
  const response = await api.post(CONVERSATION_ENDPOINTS.CREATE, title ? { title } : {}, inWorkspace(workspaceId))
  return toConversation(response.data.data.conversation)
}

export async function getConversationRequest(workspaceId, conversationId) {
  const response = await api.get(CONVERSATION_ENDPOINTS.GET(conversationId), inWorkspace(workspaceId))
  const { conversation, messages } = response.data.data
  return { conversation: toConversation(conversation), messages: messages.map((m) => toChatMessage(m, workspaceId)) }
}

// Returns { userMessage, toolMessages, assistantMessage } (assistant status: answer | unknown).
export async function sendMessageRequest(workspaceId, conversationId, content) {
  const response = await api.post(CONVERSATION_ENDPOINTS.MESSAGES(conversationId), { content }, {
    ...inWorkspace(workspaceId),
    timeout: 60_000, // retrieval + generation can take a while
  })
  const { userMessage, toolMessages = [], assistantMessage } = response.data.data
  return {
    userMessage: toChatMessage(userMessage, workspaceId),
    toolMessages: toolMessages.map((message) => toChatMessage(message, workspaceId)),
    assistantMessage: toChatMessage(assistantMessage, workspaceId),
  }
}

export async function retryMessageRequest(workspaceId, conversationId) {
  // No body: `null` would be sent as the JSON text "null", which the backend rejects.
  const response = await api.post(CONVERSATION_ENDPOINTS.RETRY(conversationId), undefined, {
    ...inWorkspace(workspaceId),
    timeout: 60_000,
  })
  const { userMessage, toolMessages = [], assistantMessage } = response.data.data
  return {
    userMessage: toChatMessage(userMessage, workspaceId),
    toolMessages: toolMessages.map((message) => toChatMessage(message, workspaceId)),
    assistantMessage: toChatMessage(assistantMessage, workspaceId),
  }
}
