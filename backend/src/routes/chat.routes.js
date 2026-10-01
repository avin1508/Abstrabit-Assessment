import { Router } from 'express'
import {
  createConversation,
  getConversation,
  listConversations,
  retryMessage,
  sendMessage,
} from '../controllers/chat.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { requireWorkspace } from '../middleware/workspace.middleware.js'

const router = Router()

router.use(authenticate, requireWorkspace)

router.post('/', createConversation)
router.get('/', listConversations)
router.get('/:id', getConversation)
router.post('/:id/messages', sendMessage)
router.post('/:id/retry', retryMessage)

export default router
