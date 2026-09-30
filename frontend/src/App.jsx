import { Suspense, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import AppRoutes from './routes/AppRoutes.jsx'
import LoadingSpinner from './components/ui/LoadingSpinner.jsx'
import useAuth from './hooks/useAuth.js'
import { getMe } from './store/slices/authSlice.js'

// Top-level fallback for code-split pages rendered outside a layout (e.g. 404),
// and the screen shown while a stored session is being restored.
function PageFallback({ label = 'Loading page' }) {
  return (
    <div className="flex h-full items-center justify-center text-brand-600">
      <LoadingSpinner size="md" label={label} />
    </div>
  )
}

export default function App() {
  const dispatch = useDispatch()
  const { initialized } = useAuth()

  // Restore the session from a stored token (GET /auth/me) before rendering any route,
  // so protected pages never flash and /login never flashes for signed-in users.
  useEffect(() => {
    if (!initialized) dispatch(getMe())
  }, [initialized, dispatch])

  if (!initialized) return <PageFallback label="Restoring your session" />

  return (
    <Suspense fallback={<PageFallback />}>
      <AppRoutes />
    </Suspense>
  )
}
