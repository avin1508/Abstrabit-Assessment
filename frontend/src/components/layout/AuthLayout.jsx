import { Suspense } from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { PATHS } from '../../routes/paths.js'
import useAuth from '../../hooks/useAuth.js'
import Logo from '../common/Logo.jsx'
import AuthShowcase from '../auth/AuthShowcase.jsx'
import { TAGLINE } from '../auth/authCopy.js'

export default function AuthLayout() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  // Signed-in users don't see /login or /register. This also performs the redirect after a
  // successful sign-in or registration, back to the page that sent them to sign in.
  if (isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname ?? PATHS.DASHBOARD} replace />
  }

  return (
    <div className="grid min-h-full bg-surface lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex min-h-full flex-col px-5 py-6 sm:px-10 sm:py-8">
        <header>
          <Link to={PATHS.LOGIN} className="inline-flex rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40">
            <Logo />
          </Link>
          <p className="mt-2 text-sm text-fg-muted lg:hidden">{TAGLINE}</p>
        </header>

        <main className="flex flex-1 items-start justify-center pt-10 pb-12 sm:items-center sm:py-10">
          <div className="w-full max-w-sm">
            <Suspense fallback={<div className="h-96" aria-busy="true" />}>
              <Outlet />
            </Suspense>
          </div>
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-2 text-xs text-fg-subtle">
          <span>© {new Date().getFullYear()} Abstrabit</span>
          <span className="font-mono">v0.1</span>
        </footer>
      </div>

      <AuthShowcase className="hidden lg:flex" />
    </div>
  )
}
