import 'dotenv/config'

// Required for the server to boot (database, queue, auth).
const REQUIRED = ['DB_USERNAME', 'DB_PASSWORD', 'DB_CLUSTER_URL', 'DB_NAME', 'REDIS_URL', 'JWT_SECRET']

// Needed by later modules (AI, Discord). Allowed to be empty for now.
const LATER = ['GEMINI_API_KEY', 'DISCORD_WEBHOOK_URL']

const missing = REQUIRED.filter((key) => !process.env[key]?.trim())
if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}. See .env.example.`)
}

const port = Number(process.env.PORT ?? 5000)
if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`PORT must be a positive integer, received "${process.env.PORT}"`)
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
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL ?? '',
})
