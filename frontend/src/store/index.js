import { configureStore } from '@reduxjs/toolkit'
import { TOKEN_STORAGE_KEY } from '../api/axios.js'
import { removeStorage, writeStorage } from '../utils/storage.js'
import authReducer from './slices/authSlice.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
})

// Keep the persisted token in sync with Redux, so reducers stay free of side effects.
let persistedToken = store.getState().auth.token
store.subscribe(() => {
  const { token } = store.getState().auth
  if (token === persistedToken) return
  persistedToken = token
  if (token) writeStorage(TOKEN_STORAGE_KEY, token)
  else removeStorage(TOKEN_STORAGE_KEY)
})
