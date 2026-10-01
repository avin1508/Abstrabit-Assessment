import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const UPLOAD_DIR = fileURLToPath(new URL('../../uploads/', import.meta.url))

export function toStoragePath(filename) {
  return `uploads/${path.basename(filename)}`
}

// Absolute path for a stored file. Only the basename is used, so a tampered storagePath
// can never point outside UPLOAD_DIR.
export function resolveStoragePath(storagePath) {
  return path.join(UPLOAD_DIR, path.basename(storagePath))
}
