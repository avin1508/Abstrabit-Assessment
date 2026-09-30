import { logger } from '../utils/logger.js'

export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` })
}

// Centralized error handler. Hides internal details for 5xx errors.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status ?? err.statusCode ?? 500
  if (status >= 500) logger.error(err)
  res.status(status).json({
    success: false,
    message: status >= 500 ? 'Internal server error' : err.message,
  })
}
