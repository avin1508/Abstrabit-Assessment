import mongoose from 'mongoose'
import { env } from './env.js'
import { logger } from '../utils/logger.js'

function buildMongoUri({ username, password, clusterUrl, name }) {
  const user = encodeURIComponent(username)
  const pass = encodeURIComponent(password)
  return `mongodb+srv://${user}:${pass}@${clusterUrl}/${name}?retryWrites=true&w=majority`
}

// Connects to MongoDB Atlas. Throws on failure so startup can abort.
export async function connectDB() {
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'))
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'))
  mongoose.connection.on('error', (error) => logger.error('MongoDB error:', error.message))

  await mongoose.connect(buildMongoUri(env.db), { serverSelectionTimeoutMS: 10_000 })
  logger.info(`MongoDB connected (database: ${mongoose.connection.name})`)
}

export async function disconnectDB() {
  await mongoose.disconnect()
}
