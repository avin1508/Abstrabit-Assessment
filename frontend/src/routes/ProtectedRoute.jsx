import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'
import { PATHS } from './paths.js'

// App waits for session restore first, so auth state is already settled here.
export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={PATHS.LOGIN} replace state={{ from: location }} />
  }

  return <Outlet />
}
