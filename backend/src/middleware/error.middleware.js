import { ZodError } from 'zod'
import { logger } from '../utils/logger.js'

export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` })
}

// Centralized error handler. Hides internal details for 5xx errors.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
    })
  }

  // Unique index violation (e.g. two registrations with the same email at once).
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: 'A record with these details already exists' })
  }

  const status = err.status ?? err.statusCode ?? 500
  if (status >= 500) logger.error(err)
  res.status(status).json({
    success: false,
    message: status >= 500 ? 'Internal server error' : err.message,
  })
}
