import { Router } from 'express'
import { getOverview } from '../controllers/dashboard.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { requireWorkspace } from '../middleware/workspace.middleware.js'

// Mounted at /api/workspaces/:workspaceId/overview. mergeParams exposes :workspaceId to
// requireWorkspace, which verifies the signed-in user owns it.
const router = Router({ mergeParams: true })

router.get('/', authenticate, requireWorkspace, getOverview)

export default router
