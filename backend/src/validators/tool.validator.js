import { z } from 'zod'

// Tool args come from the model, so treat them as untrusted. Strict schemas reject extra
// fields like workspaceId or a webhook URL.

const URL_PATTERN = /\b(?:https?|ftp|file|javascript|data):|\bwww\.|discord(?:app)?\.com\/api\/webhooks/i
const SCRIPT_PATTERN = /<\s*\/?\s*(?:script|iframe|object|embed)\b|\bon\w+\s*=/i

const noLinksOrScripts = (value) => !URL_PATTERN.test(value) && !SCRIPT_PATTERN.test(value)

export const createTaskSchema = z
  .object({
    title: z.string().trim().min(1, { error: 'title is required' }).max(200, { error: 'title must be at most 200 characters' }),
    description: z.string().trim().max(2000, { error: 'description must be at most 2000 characters' }).optional(),
    dueDate: z.union([z.iso.date(), z.iso.datetime({ offset: true })], { error: 'dueDate must be an ISO 8601 date' }).optional(),
  })
  .strict()

export const sendSummarySchema = z
  .object({
    summary: z
      .string()
      .trim()
      .min(1, { error: 'summary is required' })
      .max(1800, { error: 'summary must be at most 1800 characters' })
      .refine(noLinksOrScripts, { error: 'summary must not contain links or scripts' }),
    // Informational label only — never used as a destination.
    channel: z
      .string()
      .trim()
      .max(100, { error: 'channel must be at most 100 characters' })
      .regex(/^[#\w .-]*$/, { error: 'channel must be a plain channel name' })
      .optional(),
  })
  .strict()

export const TOOL_SCHEMAS = {
  create_task: createTaskSchema,
  send_summary: sendSummarySchema,
}
