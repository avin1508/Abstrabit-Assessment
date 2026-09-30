import api from './axios.js'
import { AUTH_ENDPOINTS } from './endpoints.js'

export async function registerRequest({ name, email, password }) {
  const response = await api.post(AUTH_ENDPOINTS.REGISTER, { name, email, password })
  return response.data.data 
}

export async function loginRequest({ email, password }) {
  const response = await api.post(AUTH_ENDPOINTS.LOGIN, { email, password })
  return response.data.data 
}

export async function getMeRequest() {
  const response = await api.get(AUTH_ENDPOINTS.ME)
  return response.data.data
}
