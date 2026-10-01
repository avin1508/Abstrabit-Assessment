import multer from 'multer'
import { ZodError } from 'zod'
import { HttpError } from '../utils/httpError.js'
import { logger } from '../utils/logger.js'

// Multer removes partially written files itself.
const MULTER_ERRORS = {
  LIMIT_FILE_SIZE: [413, 'File is too large. The maximum size is 20 MB.'],
  LIMIT_FILE_COUNT: [400, 'Upload one file at a time.'],
  LIMIT_UNEXPECTED_FILE: [400, 'Send the file in the "file" field, one file at a time.'],
}

export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
    })
  }

  if (err instanceof multer.MulterError) {
    const [status, message] = MULTER_ERRORS[err.code] ?? [400, 'Invalid upload.']
    return res.status(status).json({ success: false, message })
  }

  // Unique index violation (e.g. two registrations with the same email at once).
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: 'A record with these details already exists' })
  }

  const status = err.status ?? err.statusCode ?? 500
  // HttpError messages are written by us and safe to show, even for 5xx (e.g. "AI service busy").
  // Any other 5xx is unexpected: log it fully and send a generic message.
  const safe = err instanceof HttpError
  if (status >= 500) safe ? logger.warn(`${status} ${err.message}`) : logger.error(err)
  res.status(status).json({
    success: false,
    message: status >= 500 && !safe ? 'Internal server error' : err.message,
  })
}
