import { readFile } from 'node:fs/promises'
import mammoth from 'mammoth'
import { PDFParse } from 'pdf-parse'
import { resolveStoragePath } from '../config/storage.js'
import { Document, DocumentChunk } from '../models/index.js'
import { embedTexts } from './embedding.service.js'

const CHUNK_SIZE = 1000 // characters
const CHUNK_OVERLAP = 150
const INSERT_BATCH_SIZE = 100

const PROGRESS = { extracting: 5, extracted: 30, embedding: 40, embedded: 85, saved: 99, done: 100 }

export class IngestionError extends Error {
  constructor(message) {
    super(message)
    this.name = 'IngestionError'
  }
}

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

function normalize(text) {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Prefer paragraph, then line, sentence and word boundaries so chunks don't cut mid-thought.
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

// Only touches documents still processing, so a delete/reset mid-run isn't overwritten.
function updateProcessing(documentId, fields) {
  return Document.updateOne({ _id: documentId, status: 'processing' }, { $set: fields })
}

// Safe to re-run: old chunks are replaced, so retries never leave duplicates.
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
  const stillProcessing = async (fields) => (await updateProcessing(document._id, fields)).matchedCount > 0

  if (!(await stillProcessing({ processingStage: 'embedding', progress: PROGRESS.embedding }))) return abandon()
  const embedSpan = PROGRESS.embedded - PROGRESS.embedding
  let abandoned = false
  const vectors = await embedTexts(
    chunks.map((chunk) => chunk.content),
    {
      taskType: 'RETRIEVAL_DOCUMENT',
      onBatch: async (done, total) => {
        const progress = PROGRESS.embedding + Math.round((embedSpan * done) / total)
        if (!(await stillProcessing({ progress }))) {
          abandoned = true
          throw new Error('abandoned')
        }
      },
    },
  ).catch((error) => {
    if (abandoned) return null
    throw error
  })
  if (!vectors) return abandon()

  // Replace any previous chunk set (retry / re-delivered job), then save chunks with their
  // embeddings. Inserting only now means a half-processed document is never searchable.
  await DocumentChunk.deleteMany(scope)
  const saveSpan = PROGRESS.saved - PROGRESS.embedded
  for (let i = 0; i < chunks.length; i += INSERT_BATCH_SIZE) {
    const batch = chunks
      .slice(i, i + INSERT_BATCH_SIZE)
      .map((chunk, j) => ({ ...scope, ...chunk, embedding: vectors[i + j] }))
    await DocumentChunk.insertMany(batch, { ordered: true })
    const inserted = Math.min(i + INSERT_BATCH_SIZE, chunks.length)
    if (!(await stillProcessing({ progress: PROGRESS.embedded + Math.round((saveSpan * inserted) / chunks.length) }))) {
      return abandon()
    }
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

// Keep the file so the user can retry, but drop partial chunks so it's never searchable.
export async function markDocumentFailed(documentId, message) {
  await Document.updateOne({ _id: documentId, status: 'processing' }, { $set: { status: 'failed', errorMessage: message } })
  await DocumentChunk.deleteMany({ documentId })
}

export const GENERIC_FAILURE = 'Processing failed unexpectedly. Try again.'
