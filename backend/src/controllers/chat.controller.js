import * as chatService from '../services/chat.service.js'
import { conversationParamsSchema, createConversationSchema, sendMessageSchema } from '../validators/chat.validator.js'

export async function createConversation(req, res) {
  const input = createConversationSchema.parse(req.body ?? {})
  const conversation = await chatService.createConversation(req.workspace._id, req.user.id, input)
  res.status(201).json({ success: true, data: { conversation } })
}

export async function listConversations(req, res) {
  const conversations = await chatService.listConversations(req.workspace._id, req.user.id)
  res.json({ success: true, data: { conversations } })
}

export async function getConversation(req, res) {
  const { id } = conversationParamsSchema.parse(req.params)
  const data = await chatService.getConversation(req.workspace._id, req.user.id, id)
  res.json({ success: true, data })
}

export async function sendMessage(req, res) {
  const { id } = conversationParamsSchema.parse(req.params)
  const { content } = sendMessageSchema.parse(req.body ?? {})
  const data = await chatService.sendMessage({ workspaceId: req.workspace._id, userId: req.user.id, conversationId: id, content })
  res.status(201).json({ success: true, data })
}

export async function retryMessage(req, res) {
  const { id } = conversationParamsSchema.parse(req.params)
  const data = await chatService.retryLastMessage({ workspaceId: req.workspace._id, userId: req.user.id, conversationId: id })
  res.status(201).json({ success: true, data })
}
