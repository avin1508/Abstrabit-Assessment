import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getErrorMessage } from '../../api/axios.js'
import { listToolCallsRequest } from '../../api/toolCall.api.js'
import { logout } from './authSlice.js'

export const TOOL_CALL_PAGE_SIZE = 10

const initialState = {
  items: [],
  // Workspace the list belongs to, so a response for a previous workspace is never shown.
  workspaceId: null,
  pagination: { page: 1, limit: TOOL_CALL_PAGE_SIZE, total: 0, totalPages: 0 },
  statusCounts: { success: 0, failed: 0 },
  loading: false,
  error: null,
  listRequestId: null,
  listQuery: null,
}

export const fetchToolCalls = createAsyncThunk(
  'toolCall/fetchToolCalls',
  async ({ workspaceId, page = 1, limit = TOOL_CALL_PAGE_SIZE }, { rejectWithValue }) => {
    try {
      return await listToolCallsRequest(workspaceId, { page, limit })
    } catch (error) {
      return rejectWithValue({ message: getErrorMessage(error) })
    }
  },
  {
    // Don't request the same page twice at once.
    condition: ({ workspaceId, page = 1 }, { getState }) => {
      const { loading, listQuery } = getState().toolCall
      return !(loading && listQuery?.workspaceId === workspaceId && listQuery.page === page)
    },
  },
)

const toolCallSlice = createSlice({
  name: 'toolCall',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchToolCalls.pending, (state, action) => {
        if (action.meta.arg.workspaceId !== state.workspaceId) {
          state.items = []
          state.pagination = { ...initialState.pagination }
          state.statusCounts = { ...initialState.statusCounts }
          state.workspaceId = action.meta.arg.workspaceId
        }
        state.listRequestId = action.meta.requestId
        state.listQuery = { workspaceId: action.meta.arg.workspaceId, page: action.meta.arg.page ?? 1 }
        state.loading = true
        state.error = null
      })
      .addCase(fetchToolCalls.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return
        state.items = action.payload.items
        state.pagination = action.payload.pagination
        state.statusCounts = action.payload.statusCounts
        state.loading = false
      })
      .addCase(fetchToolCalls.rejected, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return
        state.loading = false
        state.error = action.payload?.message ?? 'Couldn’t load tool logs.'
      })
      .addCase(logout, () => initialState)
  },
})

export default toolCallSlice.reducer
