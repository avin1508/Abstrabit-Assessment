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

// Visible answer text of a response (thought parts excluded).
const textOf = (content) =>
  (content?.parts ?? [])
    .filter((part) => typeof part.text === 'string' && !part.thought)
    .map((part) => part.text)
    .join('')
    .trim()

/*
 * One model turn. The system instruction is passed separately from the conversation contents,
 * so nothing in the contents can act as a system instruction.
 *
 * tools: function declarations the model may call. toolsDisabled keeps them declared but
 * forbids calling them (used for the last round of the tool loop).
 * Returns { model, content, text, functionCalls }.
 *
 * Without `model`, models are tried in order (CHAT_MODELS): when one is over quota, overloaded
 * or unavailable, the next one is used. Later rounds of the same turn pass `model` so the whole
 * turn stays on one model. Throws GenerationError with a safe message if none can answer.
 */
export async function generateChatTurn({ systemInstruction, contents, tools, toolsDisabled = false, model }) {
  const ai = getGeminiClient()
  if (!ai) throw new GenerationError('AI features aren’t configured on the server.')

  let anyTemporary = false
  for (const candidate of model ? [model] : CHAT_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: candidate,
        contents,
        config: {
          systemInstruction,
          temperature: 0.1,
          maxOutputTokens: 1024,
          thinkingConfig: { thinkingBudget: 0 },
          ...(tools && {
            tools: [{ functionDeclarations: tools }],
            toolConfig: { functionCallingConfig: { mode: toolsDisabled ? 'NONE' : 'AUTO' } },
          }),
        },
      })
      const content = response?.candidates?.[0]?.content
      const functionCalls = response?.functionCalls ?? []
      const text = textOf(content)
      if (text || functionCalls.length) return { model: candidate, content, text, functionCalls }
      anyTemporary = true // empty / blocked answer: another model may still answer
      logger.warn(`[chat] ${candidate} returned no text`)
    } catch (error) {
      anyTemporary ||= isTemporary(error)
      // Status only: provider messages can be long and aren't for users.
      logger.warn(`[chat] ${candidate} failed (status ${error?.status ?? 'network'})`)
    }
  }
  throw new GenerationError(
    anyTemporary
      ? 'The AI service is busy right now. Try again in a few minutes.'
      : 'The AI service rejected the request. Try again later.',
  )
}
