import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Uploaded files live in backend/uploads/ under server-generated names.
export const UPLOAD_DIR = fileURLToPath(new URL('../../uploads/', import.meta.url))

// storagePath saved on the Document, relative to the backend root (e.g. "uploads/<uuid>.pdf").
export function toStoragePath(filename) {
  return `uploads/${path.basename(filename)}`
}

// Absolute path for a stored file. Only the basename is used, so a tampered storagePath
// can never point outside UPLOAD_DIR.
export function resolveStoragePath(storagePath) {
  return path.join(UPLOAD_DIR, path.basename(storagePath))
}
