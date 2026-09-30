import { Router } from 'express'
import { createWorkspace, listWorkspaces } from '../controllers/workspace.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

router.use(authenticate)

router.post('/', createWorkspace)
router.get('/', listWorkspaces)

export default router
