import { Queue } from 'bullmq'
import { createRedisConnection } from '../config/redis.js'

export const INGESTION_QUEUE_NAME = 'document-ingestion'

let queue = null
let connection = null

export function getIngestionQueue() {
  if (!queue) {
    connection = createRedisConnection('ingestion-queue')
    queue = new Queue(INGESTION_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    })
  }
  return queue
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
