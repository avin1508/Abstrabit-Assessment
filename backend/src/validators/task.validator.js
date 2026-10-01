import { z } from 'zod'

export const paginationQuerySchema = z.object({
  page: z.coerce.number({ error: 'page must be a number' }).int().min(1, { error: 'page must be 1 or more' }).default(1),
  limit: z.coerce
    .number({ error: 'limit must be a number' })
    .int()
    .min(1, { error: 'limit must be between 1 and 50' })
    .max(50, { error: 'limit must be between 1 and 50' })
    .default(10),
})

export const taskParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, { error: 'Invalid task id' }),
})

// Only status can be changed; anything else is rejected.
export const updateTaskSchema = z
  .object({
    status: z.enum(['open', 'completed'], { error: 'status must be open or completed' }),
  })
  .strict()
