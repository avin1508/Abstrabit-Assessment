import { Router } from 'express'
import { listToolCalls } from '../controllers/tool.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { requireWorkspace } from '../middleware/workspace.middleware.js'

const router = Router()

router.use(authenticate, requireWorkspace)

router.get('/', listToolCalls)

export default router
