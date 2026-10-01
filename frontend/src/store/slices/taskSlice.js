import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getErrorMessage } from '../../api/axios.js'
import { listTasksRequest, updateTaskStatusRequest } from '../../api/task.api.js'
import { logout } from './authSlice.js'

export const TASK_PAGE_SIZE = 10

const initialState = {
  // The current page of the active workspace's tasks.
  items: [],
  // Workspace the list belongs to, so a response for a previous workspace is never shown.
  workspaceId: null,
  pagination: { page: 1, limit: TASK_PAGE_SIZE, total: 0, totalPages: 0 },
  loading: false,
  error: null,
  // Tasks with a status change in flight (one request per task at a time).
  updatingIds: [],
  listRequestId: null,
  // { workspaceId, page } of the list request in flight.
  listQuery: null,
}

const toRejection = (error) => ({ message: getErrorMessage(error) })

// Callers pass workspaceSlice.activeWorkspaceId (via useWorkspace's activeWorkspace.id).
export const fetchTasks = createAsyncThunk(
  'task/fetchTasks',
  async ({ workspaceId, page = 1, limit = TASK_PAGE_SIZE }, { rejectWithValue }) => {
    try {
      return await listTasksRequest(workspaceId, { page, limit })
    } catch (error) {
      return rejectWithValue(toRejection(error))
    }
  },
  {
    // The same page for the same workspace is never requested twice at once.
    condition: ({ workspaceId, page = 1 }, { getState }) => {
      const { loading, listQuery } = getState().task
      return !(loading && listQuery?.workspaceId === workspaceId && listQuery.page === page)
    },
  },
)

export const updateTaskStatus = createAsyncThunk(
  'task/updateTaskStatus',
  async ({ workspaceId, taskId, status }, { rejectWithValue }) => {
    try {
      return await updateTaskStatusRequest(workspaceId, taskId, status)
    } catch (error) {
      return rejectWithValue(toRejection(error))
    }
  },
  { condition: ({ taskId }, { getState }) => !getState().task.updatingIds.includes(taskId) },
)

const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state, action) => {
        // Switching workspace: drop the previous workspace's tasks at once.
        if (action.meta.arg.workspaceId !== state.workspaceId) {
          state.items = []
          state.pagination = { ...initialState.pagination }
          state.workspaceId = action.meta.arg.workspaceId
        }
        state.listRequestId = action.meta.requestId
        state.listQuery = { workspaceId: action.meta.arg.workspaceId, page: action.meta.arg.page ?? 1 }
        state.loading = true
        state.error = null
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return
        state.items = action.payload.items
        state.pagination = action.payload.pagination
        state.loading = false
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return
        state.loading = false
        state.error = action.payload?.message ?? 'Couldn’t load tasks.'
      })

      .addCase(updateTaskStatus.pending, (state, action) => {
        state.updatingIds.push(action.meta.arg.taskId)
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        state.updatingIds = state.updatingIds.filter((id) => id !== action.meta.arg.taskId)
        if (action.meta.arg.workspaceId !== state.workspaceId) return
        state.items = state.items.map((task) => (task.id === action.payload.id ? action.payload : task))
      })
      .addCase(updateTaskStatus.rejected, (state, action) => {
        if (action.meta.condition) return
        state.updatingIds = state.updatingIds.filter((id) => id !== action.meta.arg.taskId)
      })

      .addCase(logout, () => initialState)
  },
})

export default taskSlice.reducer
