// Re-queues indexed documents whose chunks have no embeddings (e.g. ingested before
// embeddings existed). The running server's worker picks them up.
// Usage: npm run embeddings:backfill            (re-queue)
//        npm run embeddings:backfill -- --dry-run   (only report)
import { connectDB, disconnectDB } from '../config/db.js'
import { Document, DocumentChunk } from '../models/index.js'
import { closeIngestionQueue, enqueueIngestion } from '../queues/ingestion.queue.js'
import { logger } from '../utils/logger.js'

const dryRun = process.argv.includes('--dry-run')

async function main() {
  await connectDB()
  const documentIds = await DocumentChunk.distinct('documentId', { embedding: { $exists: false } })
  const documents = await Document.find({ _id: { $in: documentIds }, status: 'indexed' }).select('originalName').lean()
  logger.info(`${documents.length} indexed document(s) have chunks without embeddings.`)
  if (dryRun || documents.length === 0) return

  let queued = 0
  for (const document of documents) {
    const reset = await Document.updateOne(
      { _id: document._id, status: 'indexed' },
      { $set: { status: 'processing', processingStage: 'extracting', progress: 0, errorMessage: null } },
    )
    if (reset.modifiedCount === 0) continue
    await enqueueIngestion(document._id)
    queued++
  }
  logger.info(`Queued ${queued} document(s); the running server's worker will embed them.`)
}

main()
  .catch((error) => {
    logger.error('Backfill failed:', error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await closeIngestionQueue()
    await disconnectDB()
  })
