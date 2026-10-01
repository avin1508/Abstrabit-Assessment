import { GoogleGenAI } from '@google/genai'
import { env } from '../config/env.js'

// Gemini embedding settings. The vector index (see scripts/createVectorIndex.js) must use the
// same dimensions; changing them means re-creating the index and re-embedding all chunks.
export const EMBEDDING_MODEL = 'gemini-embedding-001'
export const EMBEDDING_DIMENSIONS = 768
// The API accepts at most 100 texts per embedding request.
export const EMBEDDING_BATCH_SIZE = 100

let client = null

// Server-side Gemini client; null when GEMINI_API_KEY isn't configured.
export function getGeminiClient() {
  if (!env.geminiApiKey) return null
  client ??= new GoogleGenAI({ apiKey: env.geminiApiKey })
  return client
}
