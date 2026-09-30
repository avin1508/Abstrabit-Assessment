// Mock session used until the backend auth API exists.
export const mockSession = {
  isAuthenticated: true,
  user: {
    id: 'user_1',
    name: 'Demo User',
    email: 'demo@abstrabit.dev',
  },
}

// Accounts the mock auth service accepts. Plain-text passwords are mock-only.
export const MOCK_USERS = [
  { id: 'user_1', name: 'Demo User', email: 'demo@abstrabit.dev', password: 'demo1234' },
]

export const DEMO_CREDENTIALS = { email: MOCK_USERS[0].email, password: MOCK_USERS[0].password }
