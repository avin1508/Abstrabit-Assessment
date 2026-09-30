import { randomUUID } from 'node:crypto'
import { open, unlink } from 'node:fs/promises'
import path from 'node:path'
import multer from 'multer'
import { UPLOAD_DIR } from '../config/storage.js'
import { HttpError } from '../utils/httpError.js'

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024

// Allowed types by extension (the same list the frontend accepts). Browsers often send
// generic MIME types for .md/.txt, so those are accepted too. `mimeType` is what gets stored,
// never the client's value.
const FILE_TYPES = {
  '.pdf': {
    mimeType: 'application/pdf',
    clientTypes: ['application/pdf'],
    signature: Buffer.from('%PDF-'),
  },
  '.docx': {
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    clientTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/octet-stream'],
    signature: Buffer.from([0x50, 0x4b, 0x03, 0x04]), // ZIP container
  },
  '.md': {
    mimeType: 'text/markdown',
    clientTypes: ['text/markdown', 'text/x-markdown', 'text/plain', 'application/octet-stream'],
    text: true,
  },
  '.txt': {
    mimeType: 'text/plain',
    clientTypes: ['text/plain', 'application/octet-stream'],
    text: true,
  },
}

const UNSUPPORTED = 'Unsupported file type. Upload a PDF, DOCX, Markdown or text file.'

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    // Server-generated name; the original filename never touches the filesystem.
    filename: (req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1, fields: 5 },
  defParamCharset: 'utf8',
  fileFilter: (req, file, cb) => {
    const type = FILE_TYPES[path.extname(file.originalname).toLowerCase()]
    if (!type || !type.clientTypes.includes(file.mimetype)) return cb(new HttpError(400, UNSUPPORTED))
    cb(null, true)
  },
})

function requireFile(req, res, next) {
  if (!req.file) throw new HttpError(400, 'Choose a file to upload in the "file" field.')
  next()
}

// Checks the file content matches its extension (e.g. a renamed .exe isn't accepted as .pdf)
// and records the server-side MIME type on req.file.
async function verifyFileContent(req, res, next) {
  const type = FILE_TYPES[path.extname(req.file.originalname).toLowerCase()]
  const head = Buffer.alloc(8192)
  const handle = await open(req.file.path, 'r')
  const { bytesRead } = await handle.read(head, 0, head.length, 0).finally(() => handle.close())
  const start = head.subarray(0, bytesRead)

  let problem = null
  if (bytesRead === 0) problem = 'The file is empty.'
  else if (type.signature && !start.subarray(0, type.signature.length).equals(type.signature)) problem = UNSUPPORTED
  else if (type.text && start.includes(0)) problem = UNSUPPORTED // binary data in a text file

  if (problem) {
    await unlink(req.file.path).catch(() => {})
    throw new HttpError(400, problem)
  }

  req.file.detectedMimeType = type.mimeType
  next()
}

// Single file in the "file" field, max 20 MB, supported types only.
export const uploadDocument = [upload.single('file'), requireFile, verifyFileContent]
