import { Redis } from 'ioredis'
import { env } from './env.js'
import { logger } from '../utils/logger.js'

// BullMQ requires maxRetriesPerRequest: null on its connections.
export function createRedisConnection(name) {
  const connection = new Redis(env.redisUrl, { maxRetriesPerRequest: null, connectionName: name })
  connection.on('error', (error) => logger.error(`Redis (${name}) error:`, error.message))
  return connection
}

export async function verifyRedisConnection() {
  const probe = new Redis(env.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1, retryStrategy: () => null })
  probe.on('error', () => {})
  const safeUrl = env.redisUrl.replace(/\/\/.*@/, '//***@')
  try {
    await probe.connect()
    await probe.ping()
    logger.info(`Redis connected (${safeUrl})`)
  } catch (error) {
    throw new Error(`Cannot connect to Redis at ${safeUrl}: ${error.message}`)
  } finally {
    probe.disconnect()
  }
}
