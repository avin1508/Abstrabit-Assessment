import * as documentService from '../services/document.service.js'
import { documentParamsSchema } from '../validators/document.validator.js'

// req.workspace is set by requireWorkspace (ownership already verified).

export async function uploadDocument(req, res) {
  const document = await documentService.createDocument({
    workspaceId: req.workspace._id,
    userId: req.user.id,
    file: req.file,
  })
  res.status(201).json({ success: true, message: 'Document uploaded', data: { document } })
}

export async function listDocuments(req, res) {
  const documents = await documentService.listDocuments(req.workspace._id)
  res.json({ success: true, data: { documents } })
}

export async function deleteDocument(req, res) {
  const { id } = documentParamsSchema.parse(req.params)
  await documentService.deleteDocument(req.workspace._id, id)
  res.json({ success: true, message: 'Document deleted' })
}

export async function retryDocument(req, res) {
  const { id } = documentParamsSchema.parse(req.params)
  const document = await documentService.retryDocument(req.workspace._id, id)
  res.json({ success: true, message: 'Document queued for processing', data: { document } })
}
