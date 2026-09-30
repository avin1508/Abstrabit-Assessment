import { mockSession } from '../data/mockAuth.js'

// Placeholder auth hook. Returns a mock session; will later read from an auth context
// backed by the real API. Components should depend on this hook, not on the mock data.
export default function useAuth() {
  return mockSession
}
