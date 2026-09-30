import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { PATHS } from '../routes/paths.js'
import { register as registerAccount } from '../store/slices/authSlice.js'
import { PASSWORD_MIN_LENGTH, validateRegister } from '../utils/validation.js'
import useForm from '../hooks/useForm.js'
import useToast from '../hooks/useToast.js'
import AuthFormHeader from '../components/auth/AuthFormHeader.jsx'
import { Button, Input, PasswordInput } from '../components/ui/index.js'

export default function RegisterPage() {
  const dispatch = useDispatch()
  const { toast } = useToast()

  // confirmPassword is checked client-side only; the backend receives name, email and password.
  // On success AuthLayout redirects into the app.
  const form = useForm({
    initialValues: { name: '', email: '', password: '', confirmPassword: '' },
    validate: validateRegister,
    // Errors are shown as a toast so nothing above the form appears and shifts the layout.
    onSubmit: async ({ name, email, password }) => {
      try {
        const { user } = await dispatch(registerAccount({ name, email, password })).unwrap()
        toast({ tone: 'success', title: 'Account created', description: `Signed in as ${user.email}.` })
      } catch (error) {
        toast({ tone: 'danger', title: 'Couldn’t create your account', description: error.message })
      }
    },
  })

  const passwordsMatch = form.values.confirmPassword && form.values.confirmPassword === form.values.password

  return (
    <>
      <AuthFormHeader title="Create your account" description="Start organizing documents into isolated workspaces." />

      <form onSubmit={form.handleSubmit} noValidate className="space-y-6">
        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Ada Lovelace"
          size="lg"
          floatingMessage
          autoFocus
          {...form.register('name')}
        />

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          size="lg"
          floatingMessage
          {...form.register('email')}
        />

        <PasswordInput
          label="Password"
          autoComplete="new-password"
          placeholder="Create a password"
          size="lg"
          floatingMessage
          hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
          {...form.register('password')}
        />

        <PasswordInput
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          size="lg"
          floatingMessage
          hint={passwordsMatch ? '✓ Passwords match' : undefined}
          {...form.register('confirmPassword')}
        />

        <Button type="submit" variant="primary" size="lg" fullWidth loading={form.isSubmitting}>
          {form.isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-fg-muted">
        Already have an account?{' '}
        <Link
          to={PATHS.LOGIN}
          className="rounded-sm font-medium text-brand-600 outline-none hover:text-brand-700 hover:underline focus-visible:ring-2 focus-visible:ring-brand-500/40"
        >
          Sign in
        </Link>
      </p>
    </>
  )
}
