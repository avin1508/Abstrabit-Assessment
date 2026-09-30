const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const PASSWORD_MIN_LENGTH = 8

export function isValidEmail(value) {
  return EMAIL_PATTERN.test(value.trim())
}

const STRENGTH_LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong']

// Client-side hint only; the backend owns the real password policy.
export function getPasswordStrength(password) {
  const checks = [
    { id: 'length', label: `${PASSWORD_MIN_LENGTH}+ characters`, met: password.length >= PASSWORD_MIN_LENGTH },
    { id: 'case', label: 'Upper & lowercase', met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { id: 'number', label: 'A number', met: /\d/.test(password) },
    { id: 'symbol', label: 'A symbol', met: /[^A-Za-z0-9]/.test(password) },
  ]

  let score = password ? checks.filter((check) => check.met).length : 0
  if (password && !checks[0].met) score = Math.min(score, 1)

  return { score, label: password ? STRENGTH_LABELS[score] : '', checks }
}

// Validators return { field: message } in field order, so the first key is the first invalid field.

function validateEmailField(email) {
  if (!email.trim()) return 'Email is required.'
  if (!isValidEmail(email)) return 'Enter a valid email address.'
  return undefined
}

function compact(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message))
}

export function validateLogin({ email, password }) {
  return compact({
    email: validateEmailField(email),
    password: password ? undefined : 'Password is required.',
  })
}

export function validateRegister({ name, email, password, confirmPassword }) {
  let passwordError
  if (!password) passwordError = 'Password is required.'
  else if (password.length < PASSWORD_MIN_LENGTH) passwordError = `Use at least ${PASSWORD_MIN_LENGTH} characters.`
  else if (getPasswordStrength(password).score < 2) passwordError = 'Add uppercase letters, numbers or symbols.'

  let confirmError
  if (!confirmPassword) confirmError = 'Confirm your password.'
  else if (confirmPassword !== password) confirmError = 'Passwords don’t match.'

  return compact({
    name: name.trim().length < 2 ? 'Enter your full name.' : undefined,
    email: validateEmailField(email),
    password: passwordError,
    confirmPassword: confirmError,
  })
}
