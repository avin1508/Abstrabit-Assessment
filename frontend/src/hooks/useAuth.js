import { useSelector } from 'react-redux'

// Auth state from the Redux store: { user, token, isAuthenticated, loading, error, initialized }.
export default function useAuth() {
  return useSelector((state) => state.auth)
}
