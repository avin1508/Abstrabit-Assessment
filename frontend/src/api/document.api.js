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
 * Processing state as the UI reads it. processingStage is the current stage while
 * processing and the stage that failed when failed; progress (0–100) comes from the worker.
 */
export function toProcessingState({ status, processingStage, progress, errorMessage }) {
  return {
    status,
    stage: status === 'processing' ? processingStage : null,
    failedStage: status === 'failed' ? processingStage : null,
    progress: progress ?? 0,
    error: errorMessage,
  }
}

// Backend document -> the shape the Documents UI reads. Chunk counts aren't returned by the API.
function toDocument(document) {
  return {
    id: document.id,
    workspaceId: document.workspaceId,
    name: document.originalName,
    type: extensionOf(document.originalName),
    mimeType: document.mimeType,
    sizeBytes: document.fileSize,
    ...toProcessingState(document),
    chunkCount: null,
    uploadedAt: document.createdAt,
    updatedAt: document.updatedAt,
  }
}

// One page of documents. status 'all' and an empty search mean "no filter".
export async function listDocumentsRequest(workspaceId, { page, limit, status, search }) {
  const params = { page, limit }
  if (status && status !== 'all') params.status = status
  if (search) params.search = search

  const response = await api.get(DOCUMENT_ENDPOINTS.LIST, { ...inWorkspace(workspaceId), params })
  const { documents, pagination, statusCounts } = response.data.data
  return { documents: documents.map(toDocument), pagination, statusCounts }
}

// Lightweight processing state for one document: { id, status, stage, failedStage, progress, error }.
export async function getDocumentStatusRequest(workspaceId, documentId) {
  const response = await api.get(DOCUMENT_ENDPOINTS.STATUS(documentId), inWorkspace(workspaceId))
  const { status } = response.data.data
  return { id: status.id, ...toProcessingState(status) }
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
