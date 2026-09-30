import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getMeRequest, loginRequest, registerRequest } from '../../api/auth.api.js'
import { getErrorMessage, TOKEN_STORAGE_KEY } from '../../api/axios.js'
import { readStorage } from '../../utils/storage.js'

const storedToken = readStorage(TOKEN_STORAGE_KEY)

const initialState = {
  user: null,
  token: storedToken,
  isAuthenticated: false,
  loading: false,
  error: null,
  // False while a stored token is being checked with GET /auth/me on startup.
  initialized: !storedToken,
}

// Rejections carry { message, status } so forms can show the message via unwrap().
function toRejection(error) {
  return { message: getErrorMessage(error), status: error?.response?.status ?? null }
}

export const register = createAsyncThunk('auth/register', async (credentials, { rejectWithValue }) => {
  try {
    return await registerRequest(credentials)
  } catch (error) {
    return rejectWithValue(toRejection(error))
  }
})

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    return await loginRequest(credentials)
  } catch (error) {
    return rejectWithValue(toRejection(error))
  }
})

export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      return await getMeRequest()
    } catch (error) {
      return rejectWithValue(toRejection(error))
    }
  },
  // Skip when there is no token or a check is already running (e.g. StrictMode double effects).
  { condition: (_, { getState }) => Boolean(getState().auth.token) && !getState().auth.loading },
)

function setSession(state, { user, token }) {
  state.user = user
  state.token = token
  state.isAuthenticated = true
  state.loading = false
  state.error = null
  state.initialized = true
}

function clearSession(state) {
  state.user = null
  state.token = null
  state.isAuthenticated = false
  state.loading = false
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      clearSession(state)
      state.error = null
      state.initialized = true
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getMe.fulfilled, (state, action) => {
        setSession(state, { user: action.payload.user, token: state.token })
      })
      .addCase(getMe.rejected, (state, action) => {
        // An invalid or expired token is discarded. On other failures (e.g. server down) the token
        // is kept so a reload can retry, but the app stays signed out for now.
        if (action.payload?.status === 401) clearSession(state)
        else state.isAuthenticated = false
        state.loading = false
        state.error = action.payload?.message ?? null
        state.initialized = true
      })
      .addMatcher(
        (action) => [register.fulfilled.type, login.fulfilled.type].includes(action.type),
        (state, action) => setSession(state, action.payload),
      )
      .addMatcher(
        (action) => [register.pending.type, login.pending.type, getMe.pending.type].includes(action.type),
        (state) => {
          state.loading = true
          state.error = null
        },
      )
      .addMatcher(
        (action) => [register.rejected.type, login.rejected.type].includes(action.type),
        (state, action) => {
          state.loading = false
          state.error = action.payload?.message ?? null
        },
      )
  },
})

export const { logout } = authSlice.actions
export default authSlice.reducer
