const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Mirrors the backend rules (backend/src/validators/auth.validator.js); the backend stays authoritative.
export const NAME_MAX_LENGTH = 100
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 72

export function isValidEmail(value) {
  return EMAIL_PATTERN.test(value.trim())
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
  let nameError
  if (!name.trim()) nameError = 'Enter your full name.'
  else if (name.trim().length > NAME_MAX_LENGTH) nameError = `Use at most ${NAME_MAX_LENGTH} characters.`

  let passwordError
  if (!password) passwordError = 'Password is required.'
  else if (password.length < PASSWORD_MIN_LENGTH) passwordError = `Use at least ${PASSWORD_MIN_LENGTH} characters.`
  else if (password.length > PASSWORD_MAX_LENGTH) passwordError = `Use at most ${PASSWORD_MAX_LENGTH} characters.`

  let confirmError
  if (!confirmPassword) confirmError = 'Confirm your password.'
  else if (confirmPassword !== password) confirmError = 'Passwords don’t match.'

  return compact({
    name: nameError,
    email: validateEmailField(email),
    password: passwordError,
    confirmPassword: confirmError,
  })
}
