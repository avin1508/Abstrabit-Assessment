import { GoogleGenAI } from '@google/genai'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

// Gemini embedding settings. The vector index (see scripts/createVectorIndex.js) must use the
// same dimensions; changing them means re-creating the index and re-embedding all chunks.
export const EMBEDDING_MODEL = 'gemini-embedding-001'
export const EMBEDDING_DIMENSIONS = 768
// The API accepts at most 100 texts per embedding request.
export const EMBEDDING_BATCH_SIZE = 100

export const CHAT_MODELS = [...new Set([env.geminiChatModel, ...env.geminiChatFallbackModels])]

let client = null

export function getGeminiClient() {
  if (!env.geminiApiKey) return null
  client ??= new GoogleGenAI({ apiKey: env.geminiApiKey })
  return client
}

export class GenerationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'GenerationError'
    this.userMessage = message
  }
}

const isTemporary = (error) => {
  const status = error?.status ?? error?.code
  // No status means a network error; 429 is quota, 5xx is the model being overloaded.
  return status === undefined || status === 429 || status >= 500
}

const textOf = (content) =>
  (content?.parts ?? [])
    // Thinking models also return thought parts; only the visible text counts.
    .filter((part) => typeof part.text === 'string' && !part.thought)
    .map((part) => part.text)
    .join('')
    .trim()

export async function generateChatTurn({ systemInstruction, contents, tools, toolsDisabled = false, model }) {
  const ai = getGeminiClient()
  if (!ai) throw new GenerationError('AI features aren’t configured on the server.')

  let anyTemporary = false
  // Fall through to the next model on quota/overload. Later rounds of a tool loop pass
  // `model` so the whole turn stays on one model.
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
