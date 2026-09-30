import { Link, useNavigate } from 'react-router-dom'
import { PATHS } from '../routes/paths.js'
import { register as registerAccount } from '../services/authService.js'
import { validateRegister } from '../utils/validation.js'
import useForm from '../hooks/useForm.js'
import useToast from '../hooks/useToast.js'
import AuthFormHeader from '../components/auth/AuthFormHeader.jsx'
import PasswordStrengthMeter from '../components/auth/PasswordStrengthMeter.jsx'
import { Alert, Button, Input, PasswordInput } from '../components/ui/index.js'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const form = useForm({
    initialValues: { name: '', email: '', password: '', confirmPassword: '' },
    validate: validateRegister,
    onSubmit: async (values) => {
      const { user } = await registerAccount(values)
      toast({ tone: 'success', title: 'Account created', description: `Signed in as ${user.email}.` })
      navigate(PATHS.DASHBOARD, { replace: true })
    },
  })

  const passwordsMatch = form.values.confirmPassword && form.values.confirmPassword === form.values.password

  return (
    <>
      <AuthFormHeader title="Create your account" description="Start organizing documents into isolated workspaces." />

      <form onSubmit={form.handleSubmit} noValidate className="space-y-5">
        {form.submitError && (
          <Alert tone="danger" title="Couldn’t create your account">
            {form.submitError}
          </Alert>
        )}

        <Input label="Full name" autoComplete="name" placeholder="Ada Lovelace" size="lg" autoFocus {...form.register('name')} />

        <Input
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          size="lg"
          {...form.register('email')}
        />

        <div>
          <PasswordInput
            label="Password"
            autoComplete="new-password"
            placeholder="Create a password"
            size="lg"
            aria-describedby="password-strength"
            {...form.register('password')}
          />
          <PasswordStrengthMeter id="password-strength" password={form.values.password} />
        </div>

        <PasswordInput
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          size="lg"
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
