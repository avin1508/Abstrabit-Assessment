import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import { errorHandler, notFound } from './middleware/error.middleware.js'
import authRoutes from './routes/auth.routes.js'
import workspaceRoutes from './routes/workspace.routes.js'

const app = express()

app.use(cors({ origin: env.clientUrls, credentials: true }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is healthy' })
})

app.use('/api/auth', authRoutes)
app.use('/api/workspaces', workspaceRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
