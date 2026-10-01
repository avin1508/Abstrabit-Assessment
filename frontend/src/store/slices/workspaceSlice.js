import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getErrorMessage } from '../../api/axios.js'
import { createWorkspaceRequest, fetchWorkspacesRequest } from '../../api/workspace.api.js'
import { readStorage } from '../../utils/storage.js'
import { logout } from './authSlice.js'

export const ACTIVE_WORKSPACE_STORAGE_KEY = 'abstrabit.activeWorkspaceId'

const initialState = {
  workspaces: [],
  activeWorkspaceId: readStorage(ACTIVE_WORKSPACE_STORAGE_KEY),
  loading: false,
  error: null,
  loaded: false,
}

export const fetchWorkspaces = createAsyncThunk(
  'workspace/fetchWorkspaces',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchWorkspacesRequest()
    } catch (error) {
      return rejectWithValue({ message: getErrorMessage(error) })
    }
  },
  // Skip if a request is already running (e.g. StrictMode double effects).
  { condition: (_, { getState }) => !getState().workspace.loading },
)

export const createWorkspace = createAsyncThunk('workspace/createWorkspace', async ({ name }, { rejectWithValue }) => {
  try {
    return await createWorkspaceRequest({ name })
  } catch (error) {
    return rejectWithValue({ message: getErrorMessage(error) })
  }
})

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setActiveWorkspace(state, action) {
      // Only workspaces returned by the backend can be selected.
      if (state.workspaces.some((workspace) => workspace.id === action.payload)) {
        state.activeWorkspaceId = action.payload
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.workspaces = action.payload
        // Keep the stored selection if it still exists, otherwise fall back to the first workspace.
        const stillValid = action.payload.some((workspace) => workspace.id === state.activeWorkspaceId)
        if (!stillValid) state.activeWorkspaceId = action.payload[0]?.id ?? null
        state.loading = false
        state.loaded = true
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message ?? 'Couldn’t load your workspaces.'
      })
      .addCase(createWorkspace.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.workspaces.push(action.payload)
        state.activeWorkspaceId = action.payload.id
        state.loading = false
      })
      .addCase(createWorkspace.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message ?? null
      })
      // Another user may sign in next: drop this user's list so it is fetched fresh.
      // The active id is kept as a preference and re-validated against the next fetch.
      .addCase(logout, (state) => {
        state.workspaces = []
        state.loading = false
        state.error = null
        state.loaded = false
      })
  },
})

export const { setActiveWorkspace } = workspaceSlice.actions
export default workspaceSlice.reducer
