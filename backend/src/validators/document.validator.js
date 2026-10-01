import { z } from 'zod'

const objectId = (label) => z.string().regex(/^[a-f\d]{24}$/i, { error: `Invalid ${label} id` })

export const documentParamsSchema = z.object({
  id: objectId('document'),
})

export const listDocumentsQuerySchema = z.object({
  page: z.coerce.number({ error: 'page must be a number' }).int().min(1, { error: 'page must be 1 or more' }).default(1),
  limit: z.coerce
    .number({ error: 'limit must be a number' })
    .int()
    .min(1, { error: 'limit must be between 1 and 50' })
    .max(50, { error: 'limit must be between 1 and 50' })
    .default(10),
  status: z.enum(['processing', 'indexed', 'failed'], { error: 'status must be processing, indexed or failed' }).optional(),
  search: z.string().trim().max(100, { error: 'search must be at most 100 characters' }).optional(),
})

export const searchDocumentsQuerySchema = z.object({
  q: z
    .string({ error: 'q is required' })
    .trim()
    .min(1, { error: 'q is required' })
    .max(500, { error: 'q must be at most 500 characters' }),
  limit: z.coerce
    .number({ error: 'limit must be a number' })
    .int()
    .min(1, { error: 'limit must be between 1 and 20' })
    .max(20, { error: 'limit must be between 1 and 20' })
    .default(5),
})

// No body schema for uploads: uploadedBy, workspace and status are always set server-side.
