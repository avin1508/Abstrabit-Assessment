import { z } from 'zod'

const objectId = (label) => z.string().regex(/^[a-f\d]{24}$/i, { error: `Invalid ${label} id` })

// Route params for /api/documents/:id and /api/documents/:id/retry.
export const documentParamsSchema = z.object({
  id: objectId('document'),
})

// Uploads take no body fields: uploadedBy, workspace, status and processingStage are all
// set by the server, and anything else in the multipart body is ignored.
