import mongoose from 'mongoose'
import { DocumentChunk } from '../models/index.js'
import { HttpError } from '../utils/httpError.js'
import { logger } from '../utils/logger.js'
import { embedQuery } from './embedding.service.js'

// Atlas Vector Search index on document_chunks (definition: scripts/createVectorIndex.js).
export const VECTOR_INDEX_NAME = 'document_chunks_vector_index'
export const MAX_RESULTS = 20

const SEARCH_UNAVAILABLE = 'Search isn’t available right now. Try again in a moment.'
const INDEX_NOT_READY = 'The search index isn’t set up yet.'

let indexReady = false

// $vectorSearch silently returns nothing when the index is missing, so check it once.
async function assertVectorIndexReady() {
  if (indexReady) return
  const [index] = await DocumentChunk.collection.listSearchIndexes(VECTOR_INDEX_NAME).toArray()
  if (!index?.queryable) {
    logger.warn(`[retrieval] vector index "${VECTOR_INDEX_NAME}" is ${index ? index.status : 'missing'}`)
    throw new HttpError(503, INDEX_NOT_READY)
  }
  indexReady = true
}

/*
 * Semantic search over one workspace's chunks.
 *
 * workspaceId MUST already be verified as owned by the caller (requireWorkspace middleware);
 * it is applied as a filter inside $vectorSearch, so other workspaces' chunks are never
 * candidates. Only chunks of indexed documents are returned, most similar first, with the
 * score reported by Atlas.
 */
export async function searchSimilarChunks({ workspaceId, query, limit = 5 }) {
  if (!workspaceId) throw new Error('searchSimilarChunks requires a verified workspaceId')
  const verifiedWorkspaceId = new mongoose.Types.ObjectId(String(workspaceId))
  const size = Math.min(Math.max(1, limit), MAX_RESULTS)

  await assertVectorIndexReady()
  const queryVector = await embedQuery(query)

  try {
    return await DocumentChunk.aggregate([
      {
        $vectorSearch: {
          index: VECTOR_INDEX_NAME,
          path: 'embedding',
          queryVector,
          numCandidates: size * 20,
          limit: size,
          filter: { workspaceId: verifiedWorkspaceId },
        },
      },
      { $project: { documentId: 1, chunkIndex: 1, content: 1, pageNumber: 1, score: { $meta: 'vectorSearchScore' } } },
      {
        $lookup: {
          from: 'documents',
          localField: 'documentId',
          foreignField: '_id',
          as: 'document',
          pipeline: [{ $project: { originalName: 1, mimeType: 1, status: 1 } }],
        },
      },
      { $unwind: '$document' },
      { $match: { 'document.status': 'indexed' } },
      {
        $project: {
          _id: 0,
          chunkId: { $toString: '$_id' },
          documentId: { $toString: '$documentId' },
          documentName: '$document.originalName',
          mimeType: '$document.mimeType',
          chunkIndex: 1,
          pageNumber: 1,
          content: 1,
          score: 1,
        },
      },
    ])
  } catch (error) {
    logger.error('[retrieval] vector search failed:', error.message)
    throw new HttpError(503, SEARCH_UNAVAILABLE)
  }
}
