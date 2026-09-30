import { unlink } from 'node:fs/promises'
import { resolveStoragePath, toStoragePath } from '../config/storage.js'
import { Document, DocumentChunk } from '../models/index.js'
import { hashFile } from '../utils/fileHash.js'
import { HttpError } from '../utils/httpError.js'
import { logger } from '../utils/logger.js'

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
    errorMessage: document.errorMessage,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  }
}

async function removeStoredFile(storagePath) {
  try {
    await unlink(resolveStoragePath(storagePath))
  } catch (error) {
    // Already gone is fine; anything else is logged, not surfaced to the client.
    if (error.code !== 'ENOENT') logger.warn(`Couldn't delete stored file ${storagePath}: ${error.message}`)
  }
}

// Keeps readable names but drops path parts and control characters.
function cleanOriginalName(name) {
  const base = name.split(/[\\/]/).pop()
  return base.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 255) || 'document'
}

// Only documents in this (already ownership-verified) workspace.
async function findWorkspaceDocument(workspaceId, documentId) {
  const document = await Document.findOne({ _id: documentId, workspaceId })
  if (!document) throw new HttpError(404, 'Document not found')
  return document
}

// Records an uploaded file. Ingestion (extraction, chunking, embedding) happens later, in Module 4.
export async function createDocument({ workspaceId, userId, file }) {
  const storagePath = toStoragePath(file.filename)
  try {
    const contentHash = await hashFile(file.path)

    // The schema has a unique (workspaceId, contentHash) index, so the same file can't be
    // stored twice in one workspace. Check first to return a clear message.
    if (await Document.exists({ workspaceId, contentHash })) {
      throw new HttpError(409, 'This file has already been uploaded to this workspace')
    }

    const document = await Document.create({
      workspaceId,
      uploadedBy: userId,
      originalName: cleanOriginalName(file.originalname),
      mimeType: file.detectedMimeType,
      fileSize: file.size,
      contentHash,
      storagePath,
      status: 'processing',
      processingStage: 'extracting',
    })
    return toDocumentResponse(document)
  } catch (error) {
    // Don't leave an orphaned file behind when the record wasn't created.
    await removeStoredFile(storagePath)
    throw error
  }
}

export async function listDocuments(workspaceId) {
  const documents = await Document.find({ workspaceId }).sort({ createdAt: -1 })
  return documents.map(toDocumentResponse)
}

export async function deleteDocument(workspaceId, documentId) {
  const document = await findWorkspaceDocument(workspaceId, documentId)
  // Chunks don't exist until ingestion (Module 4), but they must never outlive their document.
  await DocumentChunk.deleteMany({ documentId: document._id, workspaceId })
  await document.deleteOne()
  await removeStoredFile(document.storagePath)
}

// Resets a failed document so ingestion can run again. Queueing the job is added in Module 4.
export async function retryDocument(workspaceId, documentId) {
  const document = await findWorkspaceDocument(workspaceId, documentId)
  if (document.status !== 'failed') {
    throw new HttpError(409, 'Only failed documents can be retried')
  }

  document.status = 'processing'
  document.processingStage = 'extracting'
  document.errorMessage = null
  await document.save()
  return toDocumentResponse(document)
}
