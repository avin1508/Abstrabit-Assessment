import 'dotenv/config'

// Required for the server to boot (database, queue, auth).
const REQUIRED = ['DB_USERNAME', 'DB_PASSWORD', 'DB_CLUSTER_URL', 'DB_NAME', 'REDIS_URL', 'JWT_SECRET']

// Optional at boot. Without GEMINI_API_KEY, document embedding and search fail with a clear
// message; DISCORD_WEBHOOK_URL is used by a later module.
const LATER = ['GEMINI_API_KEY', 'DISCORD_WEBHOOK_URL']

const missing = REQUIRED.filter((key) => !process.env[key]?.trim())
if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}. See .env.example.`)
}

const port = Number(process.env.PORT ?? 5000)
if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`PORT must be a positive integer, received "${process.env.PORT}"`)
}

// Minimum Atlas vector-search score (0–1) a chunk needs to be used as chat context. Below it the
// assistant answers "I don't know." 0.78 was calibrated on test documents: answerable questions
// scored 0.815–0.888, off-topic ones 0.744–0.794 (those closest to 0.78 are also caught by the model).
const ragMinScore = Number(process.env.RAG_MIN_SCORE ?? 0.78)
if (!(ragMinScore >= 0 && ragMinScore <= 1)) {
  throw new Error(`RAG_MIN_SCORE must be a number between 0 and 1, received "${process.env.RAG_MIN_SCORE}"`)
}

export const pendingLaterVariables = LATER.filter((key) => !process.env[key]?.trim())

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port,
  // Allowed CORS origins; CLIENT_URL may list several, comma-separated.
  clientUrls: (process.env.CLIENT_URL ?? 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
  db: Object.freeze({
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    clusterUrl: process.env.DB_CLUSTER_URL,
    name: process.env.DB_NAME,
  }),
  redisUrl: process.env.REDIS_URL,
  jwtSecret: process.env.JWT_SECRET,
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  geminiChatModel: process.env.GEMINI_CHAT_MODEL?.trim() || 'gemini-3.5-flash',
  // Tried in order when the main chat model is over quota or unavailable (each model has its
  // own free-tier quota). Comma-separated.
  geminiChatFallbackModels: (process.env.GEMINI_CHAT_FALLBACK_MODELS ?? 'gemini-3-flash-preview,gemini-3.1-flash-lite')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean),
  ragMinScore,
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL ?? '',
})
