import { EMBEDDING_BATCH_SIZE, EMBEDDING_DIMENSIONS, EMBEDDING_MODEL, getGeminiClient } from '../ai/gemini.js'
import { logger } from '../utils/logger.js'

// Waits before retrying a rate-limited or temporarily failing request.
const RETRY_DELAYS_MS = [2_000, 5_000, 15_000]

/*
 * An embedding failure with a message that is safe to show users.
 * retryable: true for temporary problems (rate limits, outages) that may succeed later.
 */
export class EmbeddingError extends Error {
  constructor(message, { retryable }) {
    super(message)
    this.name = 'EmbeddingError'
    this.userMessage = message
    this.retryable = retryable
  }
}

const NOT_CONFIGURED = 'AI features aren’t configured on the server.'
const BUSY = 'The AI service is busy right now. Try again in a few minutes.'
const REJECTED = 'The AI service rejected the request. Check the server’s AI configuration.'
const UNEXPECTED = 'The AI service returned an unexpected response.'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function isTemporary(error) {
  const status = error?.status ?? error?.code
  // No status: network failure (DNS, reset, timeout).
  return status === undefined || status === 429 || status >= 500
}

// Every vector must be the configured length and contain only finite numbers.
function validVectors(response, expectedCount) {
  const vectors = response?.embeddings?.map((embedding) => embedding?.values)
  const ok =
    Array.isArray(vectors) &&
    vectors.length === expectedCount &&
    vectors.every(
      (vector) => Array.isArray(vector) && vector.length === EMBEDDING_DIMENSIONS && vector.every(Number.isFinite),
    )
  return ok ? vectors : null
}

// One API call (≤ EMBEDDING_BATCH_SIZE texts) with retries for temporary failures.
async function embedBatch(client, texts, taskType) {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await client.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: texts,
        config: { taskType, outputDimensionality: EMBEDDING_DIMENSIONS },
      })
      const vectors = validVectors(response, texts.length)
      if (!vectors) throw new EmbeddingError(UNEXPECTED, { retryable: true })
      return vectors
    } catch (error) {
      if (error instanceof EmbeddingError) throw error
      const temporary = isTemporary(error)
      // Log the status only: raw provider messages can be long and aren't for users.
      logger.warn(`[embedding] request failed (status ${error?.status ?? 'network'}, attempt ${attempt + 1})`)
      if (!temporary) throw new EmbeddingError(REJECTED, { retryable: false })
      if (attempt >= RETRY_DELAYS_MS.length) throw new EmbeddingError(BUSY, { retryable: true })
      await sleep(RETRY_DELAYS_MS[attempt])
    }
  }
}

/*
 * Embeds texts with Gemini in batches of up to 100, preserving order.
 * taskType: 'RETRIEVAL_DOCUMENT' for chunks, 'RETRIEVAL_QUERY' for search queries.
 * onBatch(done, total) is called after each batch, for progress reporting.
 */
export async function embedTexts(texts, { taskType, onBatch } = {}) {
  const client = getGeminiClient()
  if (!client) throw new EmbeddingError(NOT_CONFIGURED, { retryable: false })

  const vectors = []
  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
    vectors.push(...(await embedBatch(client, texts.slice(i, i + EMBEDDING_BATCH_SIZE), taskType)))
    await onBatch?.(vectors.length, texts.length)
  }
  return vectors
}

export async function embedQuery(text) {
  const [vector] = await embedTexts([text], { taskType: 'RETRIEVAL_QUERY' })
  return vector
}
