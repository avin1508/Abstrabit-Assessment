import { Router } from 'express'
import { listTasks, updateTask } from '../controllers/task.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { requireWorkspace } from '../middleware/workspace.middleware.js'

const router = Router()

// Signed-in user + owned workspace (X-Workspace-Id header). Tasks are created only by the
// assistant's create_task tool, so there is no create route.
router.use(authenticate, requireWorkspace)

router.get('/', listTasks)
router.patch('/:id', updateTask)

export default router
