import { readFile } from 'node:fs/promises'
import mammoth from 'mammoth'
import { PDFParse } from 'pdf-parse'
import { resolveStoragePath } from '../config/storage.js'
import { Document, DocumentChunk } from '../models/index.js'

/*
 * Document ingestion, run by the BullMQ worker (never inside an HTTP request):
 *   extract text -> split into chunks -> save document_chunks -> mark indexed.
 * Embeddings are added in the next module; chunks are saved without them.
 */

const CHUNK_SIZE = 1000 // characters
const CHUNK_OVERLAP = 150 // characters repeated between neighbouring chunks
const INSERT_BATCH_SIZE = 100

// Progress milestones (0–100) saved on the Document.
const PROGRESS = { extracting: 5, extracted: 30, chunking: 40, chunked: 90, done: 100 }

// A problem with the file itself. Retrying won't help, and the message is safe to show users.
export class IngestionError extends Error {
  constructor(message) {
    super(message)
    this.name = 'IngestionError'
  }
}

// ---------------------------------------------------------------- extraction

// Returns [{ pageNumber, text }]; pageNumber is null for formats without pages.
async function extractPdf(buffer) {
  const parser = new PDFParse({ data: buffer })
  try {
    const result = await parser.getText()
    return result.pages.map((page) => ({ pageNumber: page.num, text: page.text }))
  } catch (error) {
    if (error?.name === 'PasswordException') {
      throw new IngestionError('This PDF is password-protected. Upload an unprotected copy.')
    }
    throw new IngestionError('This PDF couldn’t be read. The file may be damaged.')
  } finally {
    await parser.destroy().catch(() => {})
  }
}

async function extractDocx(buffer) {
  try {
    const { value } = await mammoth.extractRawText({ buffer })
    return [{ pageNumber: null, text: value }]
  } catch {
    throw new IngestionError('This Word document couldn’t be read. The file may be damaged.')
  }
}

function extractPlainText(buffer) {
  return [{ pageNumber: null, text: buffer.toString('utf8').replace(/^﻿/, '') }]
}

const EXTRACTORS = {
  'application/pdf': extractPdf,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': extractDocx,
  'text/markdown': extractPlainText,
  'text/plain': extractPlainText,
}

async function extractText(document) {
  const extract = EXTRACTORS[document.mimeType]
  if (!extract) throw new IngestionError('This file type can’t be processed.')

  let buffer
  try {
    buffer = await readFile(resolveStoragePath(document.storagePath))
  } catch {
    throw new IngestionError('The uploaded file is missing. Delete this document and upload it again.')
  }
  return extract(buffer)
}

// ---------------------------------------------------------------- chunking

function normalize(text) {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Deterministic split into ~CHUNK_SIZE pieces, preferring paragraph, line, sentence and then
// word boundaries, with CHUNK_OVERLAP characters of context carried into the next chunk.
export function splitText(text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = []
  let start = 0

  while (start < text.length) {
    let end = Math.min(start + size, text.length)
    if (end < text.length) {
      const window = text.slice(start, end)
      const minCut = Math.floor(size * 0.5)
      const boundary = ['\n\n', '\n', '. ', ' ']
        .map((separator) => window.lastIndexOf(separator) + separator.length)
        .find((cut) => cut > minCut)
      if (boundary) end = start + boundary
    }

    const chunk = text.slice(start, end).trim()
    if (chunk) chunks.push(chunk)
    if (end >= text.length) break

    // Step back for overlap, then forward to the next word start so words aren't cut.
    let next = Math.max(end - overlap, start + 1)
    while (next < end && !/\s/.test(text[next - 1])) next++
    start = next
  }
  return chunks
}

// Pages are chunked separately so every chunk keeps its page number.
function buildChunks(pages) {
  const chunks = []
  for (const page of pages) {
    for (const content of splitText(normalize(page.text))) {
      chunks.push({ chunkIndex: chunks.length, content, pageNumber: page.pageNumber })
    }
  }
  return chunks
}

// ---------------------------------------------------------------- pipeline

// Updates the document only while it is still being processed (not deleted or reset).
function updateProcessing(documentId, fields) {
  return Document.updateOne({ _id: documentId, status: 'processing' }, { $set: fields })
}

/*
 * Processes one document. Safe to run again for the same document: existing chunks are
 * replaced, so a retry or a re-delivered job never leaves duplicate chunks.
 * Throws IngestionError for problems with the file; other errors may be retried by BullMQ.
 */
export async function ingestDocument(documentId) {
  const document = await Document.findById(documentId)
  if (!document || document.status !== 'processing') {
    return { skipped: true, reason: document ? `status is ${document.status}` : 'document deleted' }
  }
  const scope = { documentId: document._id, workspaceId: document.workspaceId }

  await updateProcessing(document._id, { processingStage: 'extracting', progress: PROGRESS.extracting })
  const pages = await extractText(document)
  const chunks = buildChunks(pages)
  if (chunks.length === 0) {
    throw new IngestionError(
      document.mimeType === 'application/pdf'
        ? 'No text could be extracted. The PDF may contain only scanned images.'
        : 'The document is empty — there is no text to index.',
    )
  }
  await updateProcessing(document._id, { processingStage: 'chunking', progress: PROGRESS.extracted })

  // Deleted (or reset) while processing: stop and don't leave its chunks behind.
  const abandon = async () => {
    await DocumentChunk.deleteMany(scope)
    return { skipped: true, reason: 'document changed during processing' }
  }

  await DocumentChunk.deleteMany(scope)
  if ((await updateProcessing(document._id, { progress: PROGRESS.chunking })).matchedCount === 0) return abandon()

  const span = PROGRESS.chunked - PROGRESS.chunking
  for (let i = 0; i < chunks.length; i += INSERT_BATCH_SIZE) {
    const batch = chunks.slice(i, i + INSERT_BATCH_SIZE).map((chunk) => ({ ...scope, ...chunk }))
    await DocumentChunk.insertMany(batch, { ordered: true })
    const inserted = Math.min(i + INSERT_BATCH_SIZE, chunks.length)
    const progress = PROGRESS.chunking + Math.round((span * inserted) / chunks.length)
    if ((await updateProcessing(document._id, { progress })).matchedCount === 0) return abandon()
  }

  const finished = await updateProcessing(document._id, {
    status: 'indexed',
    processingStage: null,
    progress: PROGRESS.done,
    errorMessage: null,
  })
  if (finished.matchedCount === 0) return abandon()
  return { chunks: chunks.length }
}

// Called once the job has finally failed. The stage it failed in stays in processingStage and
// the uploaded file is kept so the user can retry; partial chunks are removed so a failed
// document is never searchable.
export async function markDocumentFailed(documentId, message) {
  await Document.updateOne({ _id: documentId, status: 'processing' }, { $set: { status: 'failed', errorMessage: message } })
  await DocumentChunk.deleteMany({ documentId })
}

export const GENERIC_FAILURE = 'Processing failed unexpectedly. Try again.'
