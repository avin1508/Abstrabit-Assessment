import api from './axios.js'
import { DOCUMENT_ENDPOINTS } from './endpoints.js'

// Document routes are workspace-scoped: the backend reads the workspace from this header
// and verifies the signed-in user owns it.
const inWorkspace = (workspaceId) => ({ headers: { 'X-Workspace-Id': workspaceId } })

function extensionOf(name) {
  const match = /\.([^.]+)$/.exec(name)
  return match ? match[1].toLowerCase() : ''
}

/*
 * Backend document -> the shape the Documents UI reads.
 * processingStage is the current stage while processing and the stage that failed when failed.
 * Chunk counts don't exist until ingestion (Module 4).
 */
function toDocument(document) {
  return {
    id: document.id,
    workspaceId: document.workspaceId,
    name: document.originalName,
    type: extensionOf(document.originalName),
    mimeType: document.mimeType,
    sizeBytes: document.fileSize,
    status: document.status,
    stage: document.status === 'processing' ? document.processingStage : null,
    failedStage: document.status === 'failed' ? document.processingStage : null,
    error: document.errorMessage,
    chunkCount: null,
    uploadedAt: document.createdAt,
    updatedAt: document.updatedAt,
  }
}

export async function listDocumentsRequest(workspaceId) {
  const response = await api.get(DOCUMENT_ENDPOINTS.LIST, inWorkspace(workspaceId))
  return response.data.data.documents.map(toDocument)
}

// onProgress receives 0–100 from the browser's real upload progress events.
export async function uploadDocumentRequest(workspaceId, file, onProgress) {
  const form = new FormData()
  form.append('file', file)
  const response = await api.post(DOCUMENT_ENDPOINTS.UPLOAD, form, {
    // Overrides the instance's JSON default; the browser adds the multipart boundary.
    headers: { 'X-Workspace-Id': workspaceId, 'Content-Type': 'multipart/form-data' },
    timeout: 0, // large files on slow connections can take longer than the default timeout
    onUploadProgress: (event) => {
      if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100))
    },
  })
  return toDocument(response.data.data.document)
}

export async function deleteDocumentRequest(workspaceId, documentId) {
  await api.delete(DOCUMENT_ENDPOINTS.DELETE(documentId), inWorkspace(workspaceId))
}

export async function retryDocumentRequest(workspaceId, documentId) {
  // No body: `null` would be sent as the JSON text "null", which the backend rejects.
  const response = await api.post(DOCUMENT_ENDPOINTS.RETRY(documentId), undefined, inWorkspace(workspaceId))
  return toDocument(response.data.data.document)
}
