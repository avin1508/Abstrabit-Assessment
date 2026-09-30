// Client-side upload checks. The backend must re-validate; these only give fast feedback.

export const SUPPORTED_FILE_TYPES = {
  pdf: { label: 'PDF', mimeType: 'application/pdf' },
  docx: { label: 'DOCX', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  md: { label: 'Markdown', mimeType: 'text/markdown' },
  txt: { label: 'Text', mimeType: 'text/plain' },
}

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024
export const MAX_FILE_SIZE_LABEL = '20 MB'

// Value for <input accept="…">.
export const ACCEPTED_EXTENSIONS = Object.keys(SUPPORTED_FILE_TYPES)
  .map((extension) => `.${extension}`)
  .join(',')

export function getFileExtension(name) {
  const match = /\.([^.]+)$/.exec(name)
  return match ? match[1].toLowerCase() : ''
}

// Returns an error message, or null when the file can be uploaded.
export function validateUploadFile(file) {
  const extension = getFileExtension(file.name)
  if (!SUPPORTED_FILE_TYPES[extension]) {
    return `Unsupported file type${extension ? ` (.${extension})` : ''}. Use PDF, DOCX, Markdown or text.`
  }
  if (file.size === 0) return 'File is empty.'
  if (file.size > MAX_FILE_SIZE_BYTES) return `File is larger than ${MAX_FILE_SIZE_LABEL}.`
  return null
}
