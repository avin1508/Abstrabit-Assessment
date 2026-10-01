import { Router } from 'express'
import { getOverview } from '../controllers/dashboard.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { requireWorkspace } from '../middleware/workspace.middleware.js'

const router = Router({ mergeParams: true })

router.get('/', authenticate, requireWorkspace, getOverview)

export default router
