import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getErrorMessage } from '../../api/axios.js'
import {
  createConversationRequest,
  getConversationRequest,
  listConversationsRequest,
  retryMessageRequest,
  sendMessageRequest,
} from '../../api/conversation.api.js'
import { plainText } from '../../utils/chatText.js'
import { logout } from './authSlice.js'

/*
 * Chat state for the active workspace (workspaceSlice.activeWorkspaceId is passed to every
 * thunk; no workspace id is stored here). resetChat() clears everything when the workspace
 * changes; request ids make sure late responses for an old workspace or thread are ignored.
 */
const initialState = {
  conversations: [],
  listStatus: 'idle', // idle | loading | ready | error
  // The open conversation and its messages.
  thread: { conversationId: null, status: 'idle', messages: [] }, // status: idle | loading | ready | error
  sending: false,
  retrying: false,
  error: null,
  listRequestId: null,
  threadRequestId: null,
}

const toRejection = (error) => ({ message: getErrorMessage(error), status: error?.response?.status ?? null })

export const fetchConversations = createAsyncThunk('conversation/fetchConversations', async ({ workspaceId }, { rejectWithValue }) => {
  try {
    return await listConversationsRequest(workspaceId)
  } catch (error) {
    return rejectWithValue(toRejection(error))
  }
})

export const createConversation = createAsyncThunk('conversation/createConversation', async ({ workspaceId, title }, { rejectWithValue }) => {
  try {
    return await createConversationRequest(workspaceId, title)
  } catch (error) {
    return rejectWithValue(toRejection(error))
  }
})

export const fetchConversation = createAsyncThunk(
  'conversation/fetchConversation',
  async ({ workspaceId, conversationId }, { rejectWithValue }) => {
    try {
      return await getConversationRequest(workspaceId, conversationId)
    } catch (error) {
      return rejectWithValue(toRejection(error))
    }
  },
)

// On failure the backend may already have saved the question and an error answer, so the
// thread is reloaded from the server and returned with the rejection.
async function reloadAfterFailure(workspaceId, conversationId, error, rejectWithValue) {
  const rejection = toRejection(error)
  try {
    const { messages } = await getConversationRequest(workspaceId, conversationId)
    return rejectWithValue({ ...rejection, messages })
  } catch {
    return rejectWithValue(rejection)
  }
}

export const sendMessage = createAsyncThunk(
  'conversation/sendMessage',
  async ({ workspaceId, conversationId, content }, { rejectWithValue }) => {
    try {
      return await sendMessageRequest(workspaceId, conversationId, content)
    } catch (error) {
      return reloadAfterFailure(workspaceId, conversationId, error, rejectWithValue)
    }
  },
  // One request at a time: repeated clicks don't send duplicates.
  { condition: (_, { getState }) => !getState().conversation.sending && !getState().conversation.retrying },
)

export const retryMessage = createAsyncThunk(
  'conversation/retryMessage',
  async ({ workspaceId, conversationId }, { rejectWithValue }) => {
    try {
      return await retryMessageRequest(workspaceId, conversationId)
    } catch (error) {
      return reloadAfterFailure(workspaceId, conversationId, error, rejectWithValue)
    }
  },
  { condition: (_, { getState }) => !getState().conversation.sending && !getState().conversation.retrying },
)

// Sidebar preview of a conversation's latest message (the list API doesn't include one).
function lastMessageOf(messages) {
  const chat = messages.filter((message) => message.role !== 'tool' && !message.pending)
  const last = chat[chat.length - 1]
  if (!last) return undefined
  const lastAnswer = [...chat].reverse().find((message) => message.role === 'assistant')
  let text = plainText(last.text)
  if (last.role === 'assistant' && last.state === 'error') text = 'Response failed — try again'
  return { role: last.role, text, grounded: lastAnswer?.state !== 'unknown' }
}

// Keeps the open conversation's sidebar entry in step with its messages.
function syncConversation(state, conversationId, { bump = false } = {}) {
  const index = state.conversations.findIndex((conversation) => conversation.id === conversationId)
  if (index === -1) return
  const conversation = { ...state.conversations[index], lastMessage: lastMessageOf(state.thread.messages) }
  if (bump) {
    conversation.updatedAt = new Date().toISOString()
    state.conversations.splice(index, 1)
    state.conversations.unshift(conversation)
  } else {
    state.conversations[index] = conversation
  }
}

const isOpen = (state, conversationId) => state.thread.conversationId === conversationId

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    // Called when the active workspace changes (and on leaving chat): nothing carries over.
    resetChat: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state, action) => {
        state.listRequestId = action.meta.requestId
        state.listStatus = state.conversations.length ? 'ready' : 'loading'
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return
        // Keep previews already computed for loaded conversations.
        const previews = new Map(state.conversations.map((conversation) => [conversation.id, conversation.lastMessage]))
        state.conversations = action.payload.map((conversation) => ({ ...conversation, lastMessage: previews.get(conversation.id) }))
        state.listStatus = 'ready'
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return
        state.listStatus = 'error'
        state.error = action.payload?.message ?? null
      })

      .addCase(createConversation.fulfilled, (state, action) => {
        state.conversations.unshift(action.payload)
        state.thread = { conversationId: action.payload.id, status: 'ready', messages: [] }
        state.threadRequestId = null
      })

      .addCase(fetchConversation.pending, (state, action) => {
        const { conversationId } = action.meta.arg
        state.threadRequestId = action.meta.requestId
        if (!isOpen(state, conversationId)) state.thread = { conversationId, status: 'loading', messages: [] }
      })
      .addCase(fetchConversation.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.threadRequestId) return
        const { conversation, messages } = action.payload
        state.thread = { conversationId: conversation.id, status: 'ready', messages }
        syncConversation(state, conversation.id)
      })
      .addCase(fetchConversation.rejected, (state, action) => {
        if (action.meta.requestId !== state.threadRequestId) return
        state.thread = { ...state.thread, status: 'error' }
        state.error = action.payload?.message ?? null
      })

      // While waiting: the question plus the existing "thinking" placeholder (replaced by the reply).
      .addCase(sendMessage.pending, (state, action) => {
        const { conversationId, content, workspaceId } = action.meta.arg
        state.sending = true
        state.error = null
        if (!isOpen(state, conversationId)) return
        const at = new Date().toISOString()
        const base = { conversationId, workspaceId, pending: true, createdAt: at, citations: [] }
        state.thread.messages.push(
          { ...base, id: `pending-user-${action.meta.requestId}`, role: 'user', text: content },
          { ...base, id: `pending-assistant-${action.meta.requestId}`, role: 'assistant', state: 'thinking', phase: 'searching', text: '' },
        )
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sending = false
        const { conversationId } = action.meta.arg
        if (!isOpen(state, conversationId)) return
        state.thread.messages = [
          ...state.thread.messages.filter((message) => !message.pending),
          action.payload.userMessage,
          ...action.payload.toolMessages,
          action.payload.assistantMessage,
        ]
        syncConversation(state, conversationId, { bump: true })
      })
      .addCase(sendMessage.rejected, (state, action) => {
        // Skipped by the condition (another request running): leave that request's state alone.
        if (action.meta.condition) return
        state.sending = false
        const { conversationId } = action.meta.arg
        state.error = action.payload?.message ?? null
        if (!isOpen(state, conversationId)) return
        state.thread.messages = action.payload?.messages ?? state.thread.messages.filter((message) => !message.pending)
        syncConversation(state, conversationId, { bump: Boolean(action.payload?.messages) })
      })

      // Retry: the failed answer shows the "thinking" placeholder until the new one arrives.
      .addCase(retryMessage.pending, (state, action) => {
        state.retrying = true
        state.error = null
        if (!isOpen(state, action.meta.arg.conversationId)) return
        const last = state.thread.messages[state.thread.messages.length - 1]
        if (last?.role === 'assistant' && last.state === 'error') Object.assign(last, { state: 'thinking', phase: 'searching', error: null })
      })
      .addCase(retryMessage.fulfilled, (state, action) => {
        state.retrying = false
        const { conversationId } = action.meta.arg
        if (!isOpen(state, conversationId)) return
        const messages = state.thread.messages
        if (messages[messages.length - 1]?.role === 'assistant') messages.pop()
        messages.push(...action.payload.toolMessages, action.payload.assistantMessage)
        syncConversation(state, conversationId, { bump: true })
      })
      .addCase(retryMessage.rejected, (state, action) => {
        if (action.meta.condition) return
        state.retrying = false
        const { conversationId } = action.meta.arg
        state.error = action.payload?.message ?? null
        if (!isOpen(state, conversationId)) return
        if (action.payload?.messages) state.thread.messages = action.payload.messages
        else {
          const last = state.thread.messages[state.thread.messages.length - 1]
          if (last?.state === 'thinking') Object.assign(last, { state: 'error', phase: null, error: action.payload?.message ?? null })
        }
        syncConversation(state, conversationId)
      })

      .addCase(logout, () => initialState)
  },
})

export const { resetChat } = conversationSlice.actions
export default conversationSlice.reducer
