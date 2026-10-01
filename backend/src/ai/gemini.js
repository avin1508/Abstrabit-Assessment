import { GoogleGenAI } from '@google/genai'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

// Gemini embedding settings. The vector index (see scripts/createVectorIndex.js) must use the
// same dimensions; changing them means re-creating the index and re-embedding all chunks.
export const EMBEDDING_MODEL = 'gemini-embedding-001'
export const EMBEDDING_DIMENSIONS = 768
// The API accepts at most 100 texts per embedding request.
export const EMBEDDING_BATCH_SIZE = 100

// Chat models in the order they are tried: GEMINI_CHAT_MODEL, then GEMINI_CHAT_FALLBACK_MODELS.
export const CHAT_MODELS = [...new Set([env.geminiChatModel, ...env.geminiChatFallbackModels])]

let client = null

// Server-side Gemini client; null when GEMINI_API_KEY isn't configured.
export function getGeminiClient() {
  if (!env.geminiApiKey) return null
  client ??= new GoogleGenAI({ apiKey: env.geminiApiKey })
  return client
}

// A text-generation failure with a message that is safe to show users.
export class GenerationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'GenerationError'
    this.userMessage = message
  }
}

const isTemporary = (error) => {
  const status = error?.status ?? error?.code
  // No status: network failure. 429: quota/rate limit. 5xx: overloaded or down.
  return status === undefined || status === 429 || status >= 500
}

/*
 * Generates text. The system instruction is passed separately from the conversation contents,
 * so nothing in the contents can act as a system instruction.
 *
 * Models are tried in order (CHAT_MODELS): when one is over quota, overloaded or unavailable,
 * the next one is used. Throws GenerationError with a safe message if none can answer.
 */
export async function generateText({ systemInstruction, contents }) {
  const ai = getGeminiClient()
  if (!ai) throw new GenerationError('AI features aren’t configured on the server.')

  let anyTemporary = false
  for (const model of CHAT_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: { systemInstruction, temperature: 0.1, maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 0 } },
      })
      const text = response?.text?.trim()
      if (text) return text
      anyTemporary = true // empty / blocked answer: another model may still answer
      logger.warn(`[chat] ${model} returned no text`)
    } catch (error) {
      anyTemporary ||= isTemporary(error)
      // Status only: provider messages can be long and aren't for users.
      logger.warn(`[chat] ${model} failed (status ${error?.status ?? 'network'})`)
    }
  }
  throw new GenerationError(
    anyTemporary
      ? 'The AI service is busy right now. Try again in a few minutes.'
      : 'The AI service rejected the request. Try again later.',
  )
}
