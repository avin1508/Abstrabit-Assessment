import { z } from 'zod'

export const MESSAGE_MAX_LENGTH = 4000

export const createConversationSchema = z.object({
  title: z.string({ error: 'title must be text' }).trim().max(120, { error: 'title must be at most 120 characters' }).optional(),
})

export const sendMessageSchema = z.object({
  content: z
    .string({ error: 'content is required' })
    .trim()
    .min(1, { error: 'content is required' })
    .max(MESSAGE_MAX_LENGTH, { error: `content must be at most ${MESSAGE_MAX_LENGTH} characters` }),
})

export const conversationParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, { error: 'Invalid conversation id' }),
})

// userId, workspaceId, citations and document ids are never read from the client.
