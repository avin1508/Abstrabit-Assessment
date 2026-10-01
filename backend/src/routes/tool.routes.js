import { Router } from 'express'
import { listToolCalls } from '../controllers/tool.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { requireWorkspace } from '../middleware/workspace.middleware.js'

const router = Router()

// Read-only tool call log of the active workspace (calls are written by the chat's tools).
router.use(authenticate, requireWorkspace)

router.get('/', listToolCalls)

export default router
