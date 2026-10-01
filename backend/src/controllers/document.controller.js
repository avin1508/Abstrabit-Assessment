import * as documentService from '../services/document.service.js'
import { searchSimilarChunks } from '../services/retrieval.service.js'
import {
  documentParamsSchema,
  listDocumentsQuerySchema,
  searchDocumentsQuerySchema,
} from '../validators/document.validator.js'

export async function uploadDocument(req, res) {
  const document = await documentService.createDocument({
    workspaceId: req.workspace._id,
    userId: req.user.id,
    file: req.file,
  })
  res.status(201).json({ success: true, message: 'Document uploaded', data: { document } })
}

export async function listDocuments(req, res) {
  const query = listDocumentsQuerySchema.parse(req.query)
  const data = await documentService.listDocuments(req.workspace._id, query)
  res.json({ success: true, data })
}

export async function searchDocuments(req, res) {
  const { q, limit } = searchDocumentsQuerySchema.parse(req.query)
  const results = await searchSimilarChunks({ workspaceId: req.workspace._id, query: q, limit })
  res.json({ success: true, data: { results } })
}

export async function getDocumentStatus(req, res) {
  const { id } = documentParamsSchema.parse(req.params)
  const status = await documentService.getDocumentStatus(req.workspace._id, id)
  res.json({ success: true, data: { status } })
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
