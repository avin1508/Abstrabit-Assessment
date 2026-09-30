import { UnrecoverableError, Worker } from 'bullmq'
import { createRedisConnection } from '../config/redis.js'
import { Document } from '../models/index.js'
import { GENERIC_FAILURE, IngestionError, ingestDocument, markDocumentFailed } from '../services/ingestion.service.js'
import { logger } from '../utils/logger.js'
import { enqueueIngestion, INGESTION_QUEUE_NAME } from './ingestion.queue.js'

// Runs ingestion for one document. The processing itself lives in ingestion.service.js.
async function processIngestionJob(job) {
  const { documentId } = job.data
  try {
    const result = await ingestDocument(documentId)
    logger.info(`[ingestion] document ${documentId}:`, result.skipped ? `skipped (${result.reason})` : `${result.chunks} chunks`)
    return result
  } catch (error) {
    const isFileProblem = error instanceof IngestionError
    const lastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1)

    if (isFileProblem || lastAttempt) {
      // Only file problems have user-facing messages; anything else gets a generic one.
      await markDocumentFailed(documentId, isFileProblem ? error.message : GENERIC_FAILURE)
    }
    if (!isFileProblem) logger.error(`[ingestion] document ${documentId} attempt ${job.attemptsMade + 1}:`, error.message)

    // A broken file won't be fixed by retrying, so skip BullMQ's remaining attempts.
    throw isFileProblem ? new UnrecoverableError(error.message) : error
  }
}

let worker = null
let connection = null

export function startIngestionWorker() {
  if (!worker) {
    connection = createRedisConnection('ingestion-worker')
    worker = new Worker(INGESTION_QUEUE_NAME, processIngestionJob, { connection, concurrency: 2 })
    worker.on('error', (error) => logger.error('[ingestion] worker error:', error.message))
    logger.info(`Ingestion worker listening on queue "${INGESTION_QUEUE_NAME}"`)
  }
  return worker
}

// Documents left in "processing" without a queued job (e.g. the server stopped mid-way, or
// they were uploaded before ingestion existed) are queued again on startup.
export async function requeuePendingDocuments() {
  const pending = await Document.find({ status: 'processing' }).select('_id').lean()
  for (const { _id } of pending) await enqueueIngestion(_id)
  if (pending.length) logger.info(`[ingestion] re-queued ${pending.length} document(s) still processing`)
}

export async function stopIngestionWorker() {
  if (worker) {
    await worker.close()
    await connection.quit()
    worker = null
    connection = null
  }
}
