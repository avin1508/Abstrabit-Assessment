import { MOCK_DOCUMENTS } from '../data/mockDocuments.js'
import { getFileExtension } from '../utils/fileValidation.js'

/*
 * Mock document service.
 * Real endpoints this stands in for:
 *   GET    /api/workspaces/:workspaceId/documents
 *   POST   /api/workspaces/:workspaceId/documents          (multipart upload)
 *   POST   /api/workspaces/:workspaceId/documents/:id/retry
 *   DELETE /api/workspaces/:workspaceId/documents/:id
 *
 * Ingestion (extract → chunk → embed) is simulated with timers so the UI can show live progress.
 * Every chunk is tagged with its workspaceId inside one shared index; retrieval filters on it.
 */

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const store = MOCK_DOCUMENTS.map((document) => ({ ...document }))
const runningPipelines = new Set()

function findInWorkspace(workspaceId, documentId) {
  const document = store.find((candidate) => candidate.id === documentId)
  // Same error for "missing" and "other workspace" so ids from other workspaces reveal nothing.
  if (!document || document.workspaceId !== workspaceId) throw new Error('Document not found.')
  return document
}

function estimateChunks(sizeBytes, type) {
  const bytesPerChunk = type === 'pdf' || type === 'docx' ? 14_000 : 900
  return Math.max(2, Math.round(sizeBytes / bytesPerChunk))
}

function toPublic(document) {
  // Strip simulation-only fields.
  const { expectedChunks, simulateFailure, ...rest } = document
  return rest
}

// Advances a queued/processing document one step at a time until indexed or failed.
function runPipeline(documentId, stepMs) {
  if (runningPipelines.has(documentId)) return
  runningPipelines.add(documentId)

  const finish = () => runningPipelines.delete(documentId)

  const tick = () => {
    const document = store.find((candidate) => candidate.id === documentId)
    if (!document) return finish() // deleted mid-flight

    if (document.status === 'queued') {
      Object.assign(document, { status: 'processing', stage: 'extracting', progress: 12 })
    } else if (document.stage === 'extracting') {
      if (document.simulateFailure) {
        Object.assign(document, { status: 'failed', failedStage: 'extracting', error: document.simulateFailure, stage: null, progress: null })
        return finish()
      }
      Object.assign(document, { stage: 'chunking', progress: 38 })
    } else if (document.stage === 'chunking') {
      Object.assign(document, { stage: 'embedding', progress: 60 })
    } else if (document.progress < 92) {
      document.progress = Math.min(92, document.progress + 16)
    } else {
      Object.assign(document, {
        status: 'indexed',
        stage: null,
        progress: null,
        chunkCount: document.expectedChunks ?? estimateChunks(document.sizeBytes, document.type),
        indexedAt: new Date().toISOString(),
      })
      return finish()
    }
    setTimeout(tick, stepMs)
  }

  setTimeout(tick, stepMs)
}

// Synchronous accessor for other mock services (dashboard, workspaces). Not part of the API surface.
export function getWorkspaceDocumentsSync(workspaceId) {
  return store.filter((document) => document.workspaceId === workspaceId)
}

export async function listDocuments(workspaceId) {
  await delay(350)
  const documents = getWorkspaceDocumentsSync(workspaceId)
  // Seeded in-flight documents start progressing once someone looks at them.
  documents
    .filter((document) => document.status === 'queued' || document.status === 'processing')
    .forEach((document) => runPipeline(document.id, 2600))

  return documents
    .slice()
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    .map(toPublic)
}

/*
 * Simulated multipart upload. Reports 0–100 through onProgress, then returns the new
 * document in `queued` state; ingestion continues in the background.
 * Filenames containing "scan" fail extraction, to demo the failed state.
 */
export async function uploadDocument(workspaceId, file, { uploadedBy, onProgress } = {}) {
  const durationMs = Math.min(3000, Math.max(700, file.size / 2500))
  const steps = 10
  for (let step = 1; step <= steps; step++) {
    await delay(durationMs / steps)
    onProgress?.(Math.round((step / steps) * 100))
  }

  const type = getFileExtension(file.name)
  const document = {
    id: `doc_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    workspaceId,
    name: file.name,
    type,
    sizeBytes: file.size,
    status: 'queued',
    chunkCount: null,
    expectedChunks: estimateChunks(file.size, type),
    uploadedAt: new Date().toISOString(),
    uploadedBy: uploadedBy ?? 'You',
    simulateFailure: /scan/i.test(file.name) ? 'Scanned PDF — no extractable text. Upload a text-based PDF or run OCR first.' : null,
  }
  store.unshift(document)
  runPipeline(document.id, 1400)
  return toPublic(document)
}

// Retries ingestion of a failed document.
export async function retryDocument(workspaceId, documentId) {
  await delay(300)
  const document = findInWorkspace(workspaceId, documentId)
  if (document.status !== 'failed') throw new Error('Only failed documents can be retried.')
  if (document.failedStage === 'validating') {
    throw new Error('This file type can’t be indexed. Upload it as PDF, DOCX, Markdown or text.')
  }
  Object.assign(document, {
    status: 'queued',
    stage: null,
    progress: null,
    error: null,
    failedStage: null,
    simulateFailure: null,
    expectedChunks: document.chunkCount ?? document.expectedChunks,
    chunkCount: null,
    indexedAt: null,
  })
  runPipeline(document.id, 1400)
  return toPublic(document)
}

export async function deleteDocument(workspaceId, documentId) {
  await delay(400)
  const document = findInWorkspace(workspaceId, documentId)
  store.splice(store.indexOf(document), 1)
}
