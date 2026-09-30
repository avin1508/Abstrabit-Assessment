import { MOCK_USERS } from '../data/mockAuth.js'

// Mock auth service. Function signatures and return shapes match what the real API
// will provide, so only the bodies change when POST /api/auth/* exists.

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function toPublicUser({ id, name, email }) {
  return { id, name, email }
}

export async function login({ email, password }) {
  await delay(900)
  const user = MOCK_USERS.find((candidate) => candidate.email === email.trim().toLowerCase())

  if (!user || user.password !== password) {
    throw new Error('Invalid email or password.')
  }
  return { user: toPublicUser(user) }
}

export async function register({ name, email }) {
  await delay(1100)
  const normalizedEmail = email.trim().toLowerCase()

  if (MOCK_USERS.some((candidate) => candidate.email === normalizedEmail)) {
    throw new Error('An account with this email already exists.')
  }
  return { user: { id: `user_${Date.now()}`, name: name.trim(), email: normalizedEmail } }
}
