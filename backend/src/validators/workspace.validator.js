import { z } from 'zod'

// ownerId is stripped; the owner always comes from the JWT.
export const createWorkspaceSchema = z.object({
  name: z
    .string({ error: 'Workspace name is required' })
    .trim()
    .min(1, { error: 'Workspace name is required' })
    .max(80, { error: 'Workspace name must be at most 80 characters' }),
})
