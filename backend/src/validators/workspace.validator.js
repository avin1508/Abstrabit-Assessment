import { z } from 'zod'

// Only `name` is read from the client. Unknown keys (such as ownerId) are stripped;
// the owner always comes from the verified JWT.
export const createWorkspaceSchema = z.object({
  name: z
    .string({ error: 'Workspace name is required' })
    .trim()
    .min(1, { error: 'Workspace name is required' })
    .max(80, { error: 'Workspace name must be at most 80 characters' }),
})
