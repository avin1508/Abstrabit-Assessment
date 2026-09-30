import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import { errorHandler, notFound } from './middleware/error.middleware.js'

const app = express()

app.use(cors({ origin: env.clientUrl, credentials: true }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is healthy' })
})

// Feature routes are mounted here in later modules.

app.use(notFound)
app.use(errorHandler)

export default app
