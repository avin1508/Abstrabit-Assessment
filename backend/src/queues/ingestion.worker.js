import { Worker } from 'bullmq'
import { createRedisConnection } from '../config/redis.js'
import { logger } from '../utils/logger.js'
import { INGESTION_QUEUE_NAME } from './ingestion.queue.js'

// PLACEHOLDER (Module 0): no ingestion logic yet.
// Extraction, chunking and embedding are implemented in a later module.
async function processIngestionJob(job) {
  logger.info(`[ingestion] placeholder received job ${job.id}`, job.data)
  return { placeholder: true }
}

let worker = null
let connection = null

export function startIngestionWorker() {
  if (!worker) {
    connection = createRedisConnection('ingestion-worker')
    worker = new Worker(INGESTION_QUEUE_NAME, processIngestionJob, { connection, concurrency: 2 })
    worker.on('failed', (job, error) => logger.error(`[ingestion] job ${job?.id} failed:`, error.message))
    worker.on('error', (error) => logger.error('[ingestion] worker error:', error.message))
    logger.info(`Ingestion worker listening on queue "${INGESTION_QUEUE_NAME}"`)
  }
  return worker
}

export async function stopIngestionWorker() {
  if (worker) {
    await worker.close()
    await connection.quit()
    worker = null
    connection = null
  }
}
