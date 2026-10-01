import { unlink } from 'node:fs/promises'
import { resolveStoragePath, toStoragePath } from '../config/storage.js'
import { Document, DocumentChunk } from '../models/index.js'
import { enqueueIngestion } from '../queues/ingestion.queue.js'
import { hashFile } from '../utils/fileHash.js'
import { HttpError } from '../utils/httpError.js'
import { logger } from '../utils/logger.js'

const QUEUE_UNAVAILABLE = 'Processing couldn’t be started. Retry in a moment.'

// Safe document data for the client: no storagePath or contentHash.
export function toDocumentResponse(document) {
  return {
    id: document._id.toString(),
    workspaceId: document.workspaceId.toString(),
    originalName: document.originalName,
    mimeType: document.mimeType,
    fileSize: document.fileSize,
    status: document.status,
    processingStage: document.processingStage,
    progress: document.progress,
    errorMessage: document.errorMessage,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  }
}

async function removeStoredFile(storagePath) {
  try {
    await unlink(resolveStoragePath(storagePath))
  } catch (error) {
    // Already gone is fine.
    if (error.code !== 'ENOENT') logger.warn(`Couldn't delete stored file ${storagePath}: ${error.message}`)
  }
}

// Display name only: strip path parts and control characters.
function cleanOriginalName(name) {
  const base = name.split(/[\\/]/).pop()
  return base.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 255) || 'document'
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Always scoped to the workspace, so another workspace's document is just "not found".
async function findWorkspaceDocument(workspaceId, documentId) {
  const document = await Document.findOne({ _id: documentId, workspaceId })
  if (!document) throw new HttpError(404, 'Document not found')
  return document
}

// Queues ingestion. If Redis is unavailable the document is marked failed (so it can be
// retried) instead of sitting in "processing" forever.
async function queueIngestion(document) {
  try {
    await enqueueIngestion(document._id)
  } catch (error) {
    logger.error(`Couldn't queue ingestion for document ${document._id}: ${error.message}`)
    document.status = 'failed'
    document.errorMessage = QUEUE_UNAVAILABLE
    await document.save()
  }
}

export async function createDocument({ workspaceId, userId, file }) {
  const storagePath = toStoragePath(file.filename)
  let document
  try {
    const contentHash = await hashFile(file.path)

    // The schema has a unique (workspaceId, contentHash) index, so the same file can't be
    // stored twice in one workspace. Check first to return a clear message.
    if (await Document.exists({ workspaceId, contentHash })) {
      throw new HttpError(409, 'This file has already been uploaded to this workspace')
    }

    document = await Document.create({
      workspaceId,
      uploadedBy: userId,
      originalName: cleanOriginalName(file.originalname),
      mimeType: file.detectedMimeType,
      fileSize: file.size,
      contentHash,
      storagePath,
      status: 'processing',
      processingStage: 'extracting',
      progress: 0,
    })
  } catch (error) {
    // Don't leave an orphaned file behind if the record wasn't created.
    await removeStoredFile(storagePath)
    throw error
  }

  await queueIngestion(document)
  return toDocumentResponse(document)
}

export async function listDocuments(workspaceId, { page, limit, status, search }) {
  const filter = { workspaceId }
  if (status) filter.status = status
  if (search) filter.originalName = { $regex: escapeRegex(search), $options: 'i' }

  const [documents, total, grouped] = await Promise.all([
    Document.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Document.countDocuments(filter),
    Document.aggregate([{ $match: { workspaceId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ])

  const statusCounts = { all: 0, processing: 0, indexed: 0, failed: 0 }
  for (const { _id, count } of grouped) {
    statusCounts[_id] = count
    statusCounts.all += count
  }

  return {
    documents: documents.map(toDocumentResponse),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    statusCounts,
  }
}

export async function getDocumentStatus(workspaceId, documentId) {
  const document = await Document.findOne({ _id: documentId, workspaceId })
    .select('status processingStage progress errorMessage')
    .lean()
  if (!document) throw new HttpError(404, 'Document not found')
  return {
    id: document._id.toString(),
    status: document.status,
    processingStage: document.processingStage,
    progress: document.progress,
    errorMessage: document.errorMessage,
  }
}

export async function deleteDocument(workspaceId, documentId) {
  const document = await findWorkspaceDocument(workspaceId, documentId)
  await DocumentChunk.deleteMany({ documentId: document._id, workspaceId })
  await document.deleteOne()
  await removeStoredFile(document.storagePath)
}

export async function retryDocument(workspaceId, documentId) {
  const document = await findWorkspaceDocument(workspaceId, documentId)
  if (document.status !== 'failed') {
    throw new HttpError(409, 'Only failed documents can be retried')
  }

  document.status = 'processing'
  document.processingStage = 'extracting'
  document.progress = 0
  document.errorMessage = null
  await document.save()

  await queueIngestion(document)
  return toDocumentResponse(document)
}
