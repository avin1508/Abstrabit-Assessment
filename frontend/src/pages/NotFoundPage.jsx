import { Link } from 'react-router-dom'
import { PATHS } from '../routes/paths.js'
import Button from '../components/ui/Button.jsx'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-xs font-medium tracking-wider text-fg-subtle uppercase">Error 404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-sm text-fg-muted">The page you’re looking for doesn’t exist or was moved.</p>
      <Button as={Link} to={PATHS.DASHBOARD} className="mt-6">
        Back to dashboard
      </Button>
    </main>
  )
}
