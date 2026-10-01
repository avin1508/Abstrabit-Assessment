import { Router } from 'express'
import { listTasks, updateTask } from '../controllers/task.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { requireWorkspace } from '../middleware/workspace.middleware.js'

const router = Router()

// No create route: tasks are only created by the assistant's create_task tool.
router.use(authenticate, requireWorkspace)

router.get('/', listTasks)
router.patch('/:id', updateTask)

export default router
