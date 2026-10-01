import { Router } from 'express'
import {
  deleteDocument,
  getDocumentStatus,
  listDocuments,
  retryDocument,
  searchDocuments,
  uploadDocument,
} from '../controllers/document.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { uploadDocument as receiveFile } from '../middleware/upload.middleware.js'
import { requireWorkspace } from '../middleware/workspace.middleware.js'

const router = Router()

// Ownership is checked before Multer runs, so nothing is written for someone else's workspace.
router.use(authenticate, requireWorkspace)

router.post('/', receiveFile, uploadDocument)
router.get('/', listDocuments)
router.get('/search', searchDocuments)
router.get('/:id/status', getDocumentStatus)
router.delete('/:id', deleteDocument)
router.post('/:id/retry', retryDocument)

export default router
