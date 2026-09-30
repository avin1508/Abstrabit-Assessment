import { configureStore } from '@reduxjs/toolkit'
import { TOKEN_STORAGE_KEY } from '../api/axios.js'
import { removeStorage, writeStorage } from '../utils/storage.js'
import authReducer from './slices/authSlice.js'
import documentReducer from './slices/documentSlice.js'
import workspaceReducer, { ACTIVE_WORKSPACE_STORAGE_KEY } from './slices/workspaceSlice.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workspace: workspaceReducer,
    document: documentReducer,
  },
})

// Keep persisted values in sync with Redux, so reducers stay free of side effects.
function persist(key, value) {
  if (value) writeStorage(key, value)
  else removeStorage(key)
}

let persistedToken = store.getState().auth.token
let persistedWorkspaceId = store.getState().workspace.activeWorkspaceId
store.subscribe(() => {
  const { auth, workspace } = store.getState()
  if (auth.token !== persistedToken) {
    persistedToken = auth.token
    persist(TOKEN_STORAGE_KEY, auth.token)
  }
  if (workspace.activeWorkspaceId !== persistedWorkspaceId) {
    persistedWorkspaceId = workspace.activeWorkspaceId
    persist(ACTIVE_WORKSPACE_STORAGE_KEY, workspace.activeWorkspaceId)
  }
})
