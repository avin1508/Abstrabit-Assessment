import { Suspense, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import AppRoutes from './routes/AppRoutes.jsx'
import LoadingSpinner from './components/ui/LoadingSpinner.jsx'
import useAuth from './hooks/useAuth.js'
import { getMe } from './store/slices/authSlice.js'

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

  // Restore the session before rendering routes so neither /login nor protected pages flash.
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
