import axios from 'axios'
import { readStorage } from '../utils/storage.js'

// The JWT is persisted under this key (see store/index.js) and read here for every request.
export const TOKEN_STORAGE_KEY = 'abstrabit.token'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

api.interceptors.request.use((config) => {
  const token = readStorage(TOKEN_STORAGE_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Turns an Axios error into a message that is safe to show. The backend already sends safe
// messages for 4xx responses; anything else gets a generic message.
export function getErrorMessage(error) {
  const response = error?.response
  if (!response) return 'Can’t reach the server. Check your connection and try again.'
  if (response.status >= 500) return 'Something went wrong. Please try again.'

  const { message, errors } = response.data ?? {}
  return errors?.[0]?.message || message || 'Something went wrong. Please try again.'
}

export default api
