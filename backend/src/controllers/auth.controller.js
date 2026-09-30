import * as authService from '../services/auth.service.js'
import { loginSchema, registerSchema } from '../validators/auth.validator.js'

export async function register(req, res) {
  const input = registerSchema.parse(req.body)
  const data = await authService.register(input)
  res.status(201).json({ success: true, message: 'Registration successful', data })
}

export async function login(req, res) {
  const input = loginSchema.parse(req.body)
  const data = await authService.login(input)
  res.json({ success: true, message: 'Login successful', data })
}

export function me(req, res) {
  res.json({ success: true, data: { user: req.user } })
}
