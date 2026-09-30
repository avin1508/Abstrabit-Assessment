import { Suspense } from 'react'
import AppRoutes from './routes/AppRoutes.jsx'
import LoadingSpinner from './components/ui/LoadingSpinner.jsx'

// Top-level fallback for code-split pages rendered outside a layout (e.g. 404).
function PageFallback() {
  return (
    <div className="flex h-full items-center justify-center text-brand-600">
      <LoadingSpinner size="md" label="Loading page" />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <AppRoutes />
    </Suspense>
  )
}
