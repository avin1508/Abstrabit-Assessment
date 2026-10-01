// Creates the Atlas Vector Search index on document_chunks (idempotent).
// Usage: npm run vector:index
import { EMBEDDING_DIMENSIONS } from '../ai/gemini.js'
import { connectDB, disconnectDB } from '../config/db.js'
import { DocumentChunk } from '../models/index.js'
import { VECTOR_INDEX_NAME } from '../services/retrieval.service.js'
import { logger } from '../utils/logger.js'

// workspaceId is a filter field so every query can be restricted to one workspace
// inside $vectorSearch itself.
export const VECTOR_INDEX_DEFINITION = {
  fields: [
    { type: 'vector', path: 'embedding', numDimensions: EMBEDDING_DIMENSIONS, similarity: 'cosine' },
    { type: 'filter', path: 'workspaceId' },
  ],
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  await connectDB()
  const collection = DocumentChunk.collection
  // The collection must exist before a search index can be created on it.
  await DocumentChunk.createCollection().catch(() => {})

  const [existing] = await collection.listSearchIndexes(VECTOR_INDEX_NAME).toArray()
  if (existing) {
    logger.info(`Index "${VECTOR_INDEX_NAME}" already exists (status: ${existing.status}).`)
    const fields = existing.latestDefinition?.fields ?? []
    const vector = fields.find((field) => field.type === 'vector')
    if (vector?.numDimensions !== EMBEDDING_DIMENSIONS || !fields.some((field) => field.path === 'workspaceId')) {
      logger.warn('Existing index definition differs from the expected one:', JSON.stringify(existing.latestDefinition))
    }
  } else {
    await collection.createSearchIndex({ name: VECTOR_INDEX_NAME, type: 'vectorSearch', definition: VECTOR_INDEX_DEFINITION })
    logger.info(`Created index "${VECTOR_INDEX_NAME}":`, JSON.stringify(VECTOR_INDEX_DEFINITION))
  }

  for (let i = 0; i < 60; i++) {
    const [index] = await collection.listSearchIndexes(VECTOR_INDEX_NAME).toArray()
    if (index?.queryable) {
      logger.info(`Index "${VECTOR_INDEX_NAME}" is ready (status: ${index.status}).`)
      return
    }
    await sleep(5000)
  }
  logger.warn('Index is still building; check its status in Atlas → Search & Vector Search.')
}

main()
  .catch((error) => {
    logger.error('Creating the vector index failed:', error.message)
    process.exitCode = 1
  })
  .finally(() => disconnectDB())
