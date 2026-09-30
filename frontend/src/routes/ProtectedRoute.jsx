import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'
import { PATHS } from './paths.js'

// Guards authenticated routes. Auth is mocked for now (see hooks/useAuth.js);
// only the hook needs to change when real auth lands.
export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={PATHS.LOGIN} replace state={{ from: location }} />
  }

  return <Outlet />
}
