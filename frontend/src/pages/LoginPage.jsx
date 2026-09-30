import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { PATHS } from '../routes/paths.js'
import { login } from '../services/authService.js'
import { validateLogin } from '../utils/validation.js'
import { DEMO_CREDENTIALS } from '../data/mockAuth.js'
import useForm from '../hooks/useForm.js'
import useToast from '../hooks/useToast.js'
import AuthFormHeader from '../components/auth/AuthFormHeader.jsx'
import { Alert, Button, Input, PasswordInput } from '../components/ui/index.js'

const linkClass =
  'rounded-sm font-medium text-brand-600 outline-none hover:text-brand-700 hover:underline focus-visible:ring-2 focus-visible:ring-brand-500/40'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const redirectTo = location.state?.from?.pathname ?? PATHS.DASHBOARD

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: validateLogin,
    onSubmit: async (values) => {
      const { user } = await login(values)
      toast({ tone: 'success', title: `Welcome back, ${user.name.split(' ')[0]}` })
      navigate(redirectTo, { replace: true })
    },
  })

  function fillDemoAccount() {
    form.setValues((values) => ({ ...values, ...DEMO_CREDENTIALS }))
  }

  return (
    <>
      <AuthFormHeader title="Sign in" description="Welcome back. Enter your details to access your workspaces." />

      <form onSubmit={form.handleSubmit} noValidate className="space-y-5">
        {form.submitError && (
          <Alert tone="danger" title="Couldn’t sign you in">
            {form.submitError}
          </Alert>
        )}

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          leftIcon={Mail}
          size="lg"
          autoFocus
          {...form.register('email')}
        />

        <PasswordInput
          label="Password"
          autoComplete="current-password"
          placeholder="Enter your password"
          size="lg"
          {...form.register('password')}
        />

        <Button type="submit" variant="primary" size="lg" fullWidth loading={form.isSubmitting}>
          {form.isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between gap-3 rounded-lg border border-dashed border-line-strong bg-surface-muted/50 px-3.5 py-2.5">
        <p className="min-w-0 text-xs text-fg-muted">
          <span className="font-medium text-fg">Demo account</span>
          <span className="block truncate font-mono text-[11px] text-fg-subtle">
            {DEMO_CREDENTIALS.email} / {DEMO_CREDENTIALS.password}
          </span>
        </p>
        <Button size="sm" variant="secondary" onClick={fillDemoAccount}>
          Fill in
        </Button>
      </div>

      <p className="mt-8 text-center text-sm text-fg-muted">
        Don’t have an account?{' '}
        <Link to={PATHS.REGISTER} className={linkClass}>
          Create one
        </Link>
      </p>
    </>
  )
}
