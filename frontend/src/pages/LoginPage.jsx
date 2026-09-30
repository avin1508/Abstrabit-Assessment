import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Mail } from 'lucide-react'
import { PATHS } from '../routes/paths.js'
import { login } from '../store/slices/authSlice.js'
import { validateLogin } from '../utils/validation.js'
import useForm from '../hooks/useForm.js'
import useToast from '../hooks/useToast.js'
import AuthFormHeader from '../components/auth/AuthFormHeader.jsx'
import { Button, Input, PasswordInput } from '../components/ui/index.js'

const linkClass =
  'rounded-sm font-medium text-brand-600 outline-none hover:text-brand-700 hover:underline focus-visible:ring-2 focus-visible:ring-brand-500/40'

export default function LoginPage() {
  const dispatch = useDispatch()
  const { toast } = useToast()

  // On success AuthLayout redirects to the page the user came from (or the dashboard).
  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: validateLogin,
    // Errors are shown as a toast so nothing above the form appears and shifts the layout.
    onSubmit: async (values) => {
      try {
        const { user } = await dispatch(login(values)).unwrap()
        toast({ tone: 'success', title: `Welcome back, ${user.name.split(' ')[0]}` })
      } catch (error) {
        toast({ tone: 'danger', title: 'Couldn’t sign you in', description: error.message })
      }
    },
  })

  return (
    <>
      <AuthFormHeader title="Sign in" description="Welcome back. Enter your details to access your workspaces." />

      <form onSubmit={form.handleSubmit} noValidate className="space-y-6">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          leftIcon={Mail}
          size="lg"
          floatingMessage
          autoFocus
          {...form.register('email')}
        />

        <PasswordInput
          label="Password"
          autoComplete="current-password"
          placeholder="Enter your password"
          size="lg"
          floatingMessage
          {...form.register('password')}
        />

        <Button type="submit" variant="primary" size="lg" fullWidth loading={form.isSubmitting}>
          {form.isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-fg-muted">
        Don’t have an account?{' '}
        <Link to={PATHS.REGISTER} className={linkClass}>
          Create one
        </Link>
      </p>
    </>
  )
}
