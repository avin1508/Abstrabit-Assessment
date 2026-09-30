import { Redis } from 'ioredis'
import { env } from './env.js'
import { logger } from '../utils/logger.js'

// BullMQ requires maxRetriesPerRequest: null on its connections.
export function createRedisConnection(name) {
  const connection = new Redis(env.redisUrl, { maxRetriesPerRequest: null, connectionName: name })
  connection.on('error', (error) => logger.error(`Redis (${name}) error:`, error.message))
  return connection
}

// Startup probe: connect + PING once, then close. Throws if Redis is unreachable.
export async function verifyRedisConnection() {
  const probe = new Redis(env.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1, retryStrategy: () => null })
  probe.on('error', () => {})
  try {
    await probe.connect()
    await probe.ping()
    logger.info(`Redis connected (${env.redisUrl.replace(/\/\/.*@/, '//***@')})`)
  } catch (error) {
    throw new Error(`Cannot connect to Redis at ${env.redisUrl}: ${error.message}`)
  } finally {
    probe.disconnect()
  }
}
