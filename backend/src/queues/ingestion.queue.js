import { Queue } from 'bullmq'
import { createRedisConnection } from '../config/redis.js'

export const INGESTION_QUEUE_NAME = 'document-ingestion'

// Temporary errors (e.g. a database hiccup) are retried; problems with the file are not
// (see ingestion.worker.js). After the last attempt the document is marked failed.
export const INGESTION_ATTEMPTS = 3

let queue = null
let connection = null

export function getIngestionQueue() {
  if (!queue) {
    connection = createRedisConnection('ingestion-queue')
    queue = new Queue(INGESTION_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: INGESTION_ATTEMPTS,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    })
  }
  return queue
}

/*
 * Queues ingestion for a document. The job carries only the id; the worker loads the rest.
 * The job id is the document id, so a document is never queued twice at the same time.
 * A finished job with that id (from an earlier run) is removed first so retries can re-queue.
 */
export async function enqueueIngestion(documentId) {
  const ingestionQueue = getIngestionQueue()
  const jobId = String(documentId)

  const existing = await ingestionQueue.getJob(jobId)
  if (existing) {
    const state = await existing.getState()
    if (['waiting', 'active', 'delayed', 'prioritized', 'waiting-children'].includes(state)) return existing
    await existing.remove()
  }
  return ingestionQueue.add('ingest', { documentId: jobId }, { jobId })
}

// BullMQ doesn't close connections it was given, so quit ours explicitly.
export async function closeIngestionQueue() {
  if (queue) {
    await queue.close()
    await connection.quit()
    queue = null
    connection = null
  }
}
