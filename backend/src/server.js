import { env, pendingLaterVariables } from './config/env.js'
import { connectDB, disconnectDB } from './config/db.js'
import { verifyRedisConnection } from './config/redis.js'
import { closeIngestionQueue, getIngestionQueue } from './queues/ingestion.queue.js'
import { requeuePendingDocuments, startIngestionWorker, stopIngestionWorker } from './queues/ingestion.worker.js'
import { logger } from './utils/logger.js'
import app from './app.js'

// Importing registers all Mongoose models.
import './models/index.js'

async function start() {
  if (pendingLaterVariables.length) {
    logger.warn(`Not set yet (needed by later modules): ${pendingLaterVariables.join(', ')}`)
  }

  await connectDB()
  await verifyRedisConnection()
  getIngestionQueue()
  startIngestionWorker()
  await requeuePendingDocuments().catch((error) => logger.error('[ingestion] re-queue on startup failed:', error.message))

  const server = app.listen(env.port, () => logger.info(`Server listening on port ${env.port}`))

  let shuttingDown = false
  async function shutdown(signal) {
    if (shuttingDown) return
    shuttingDown = true
    logger.info(`${signal} received, shutting down`)
    server.close()
    await stopIngestionWorker()
    await closeIngestionQueue()
    await disconnectDB()
    process.exit(0)
  }
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

start().catch((error) => {
  logger.error('Startup failed:', error.message)
  process.exit(1)
})
