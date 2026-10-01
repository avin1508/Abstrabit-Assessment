import { TOOL_NAMES } from '../ai/tools.js'
import { env } from '../config/env.js'
import { Conversation, ToolCall, Workspace } from '../models/index.js'
import { logger } from '../utils/logger.js'
import { TOOL_SCHEMAS } from '../validators/tool.validator.js'
import { DiscordError, sendDiscordMessage } from './discord.service.js'
import { createTask } from './task.service.js'

const MAX_LOGGED_STRING = 2000
const DEFAULT_CHANNEL = 'Discord'

class ToolError extends Error {}

// Removes anything secret-looking before it is stored or returned: the configured webhook
// and any Discord webhook URL, plus over-long strings.
function sanitize(value, depth = 0) {
  if (typeof value === 'string') {
    let clean = value
    if (env.discordWebhookUrl) clean = clean.split(env.discordWebhookUrl).join('[redacted]')
    clean = clean.replace(/https?:\/\/\S*discord(?:app)?\.com\/api\/webhooks\/\S*/gi, '[redacted webhook]')
    return clean.length > MAX_LOGGED_STRING ? `${clean.slice(0, MAX_LOGGED_STRING)}…` : clean
  }
  if (Array.isArray(value)) return depth > 3 ? [] : value.slice(0, 20).map((item) => sanitize(item, depth + 1))
  if (value && typeof value === 'object') {
    if (depth > 3) return {}
    return Object.fromEntries(Object.entries(value).slice(0, 20).map(([key, item]) => [key, sanitize(item, depth + 1)]))
  }
  return value
}

const formatIssues = (error) => error.issues.map((issue) => `${issue.path.join('.') || 'arguments'}: ${issue.message}`).join('; ')

// The workspace must belong to the user and the conversation to both (defense in depth: the
// HTTP layer already checked this).
async function isAuthorized({ workspaceId, userId, conversationId }) {
  const [workspace, conversation] = await Promise.all([
    Workspace.exists({ _id: workspaceId, ownerId: userId }),
    Conversation.exists({ _id: conversationId, workspaceId, userId }),
  ])
  return Boolean(workspace && conversation)
}

// Avoid repeating an action when the user retries a failed answer. create_task matches on
// title so several different tasks in one request still work.
function findEarlierSuccess(toolName, args, { conversationId, since }) {
  if (!since) return null
  return ToolCall.findOne({
    conversationId,
    toolName,
    status: 'success',
    createdAt: { $gte: since },
    ...(toolName === 'create_task' && { 'arguments.title': args.title }),
  })
}

async function runTool(toolName, args, context) {
  if (toolName === 'create_task') {
    const task = await createTask({ ...args, workspaceId: context.workspaceId, userId: context.userId })
    return { success: true, ...task }
  }
  // send_summary: the destination is always the server's DISCORD_WEBHOOK_URL.
  const heading = `**Summary${args.channel ? ` for ${args.channel}` : ''}**`
  try {
    const { messageId } = await sendDiscordMessage(`${heading}\n${args.summary}`)
    return { success: true, message: 'Summary sent successfully.', channel: args.channel, messageId }
  } catch (error) {
    throw new ToolError(error instanceof DiscordError ? error.message : 'Sending the summary failed.')
  }
}

async function log({ context, toolName, args, status, result = null, errorMessage = null, started }) {
  return ToolCall.create({
    workspaceId: context.workspaceId,
    userId: context.userId,
    conversationId: context.conversationId,
    toolName,
    arguments: sanitize(args ?? {}),
    status,
    result: result === null ? null : sanitize(result),
    errorMessage,
    durationMs: Date.now() - started,
  })
}

// Workspace, user and conversation always come from the verified request (`context`), never
// from the model.
export async function executeToolCall({ name, args, context }) {
  const started = Date.now()

  // Unknown tools never run.
  if (!TOOL_NAMES.includes(name)) {
    logger.warn(`[tools] rejected unknown tool "${String(name).slice(0, 50)}"`)
    return { toolCall: null, response: { success: false, error: `Unknown tool "${String(name).slice(0, 50)}". Only create_task and send_summary exist.` } }
  }

  const parsed = TOOL_SCHEMAS[name].safeParse(args ?? {})
  if (!parsed.success) {
    const errorMessage = `Invalid arguments: ${formatIssues(parsed.error)}`
    const toolCall = await log({ context, toolName: name, args, status: 'failed', errorMessage, started })
    return { toolCall, response: { success: false, error: errorMessage } }
  }
  const validArgs = name === 'send_summary' ? { ...parsed.data, channel: parsed.data.channel || DEFAULT_CHANNEL } : parsed.data

  if (!(await isAuthorized(context))) {
    const errorMessage = 'Not allowed in this workspace.'
    const toolCall = await log({ context, toolName: name, args: validArgs, status: 'failed', errorMessage, started })
    return { toolCall, response: { success: false, error: errorMessage } }
  }

  const earlier = await findEarlierSuccess(name, validArgs, context)
  if (earlier) {
    return { toolCall: null, response: { ...earlier.result, note: 'Already done for this request; not repeated.' } }
  }

  try {
    const result = await runTool(name, validArgs, context)
    const toolCall = await log({ context, toolName: name, args: validArgs, status: 'success', result, started })
    return { toolCall, response: result }
  } catch (error) {
    const errorMessage = error instanceof ToolError ? error.message : 'The tool failed unexpectedly.'
    if (!(error instanceof ToolError)) logger.error(`[tools] ${name} failed:`, error.message)
    const toolCall = await log({ context, toolName: name, args: validArgs, status: 'failed', errorMessage, started })
    return { toolCall, response: { success: false, error: errorMessage } }
  }
}

export async function listToolCalls(workspaceId, { page, limit }) {
  const [toolCalls, total, grouped] = await Promise.all([
    ToolCall.find({ workspaceId }).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ToolCall.countDocuments({ workspaceId }),
    ToolCall.aggregate([{ $match: { workspaceId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ])
  const statusCounts = { success: 0, failed: 0 }
  for (const { _id, count } of grouped) statusCounts[_id] = count

  return {
    items: toolCalls.map((toolCall) => ({
      id: toolCall._id.toString(),
      tool: toolCall.toolName,
      args: sanitize(toolCall.arguments ?? {}),
      status: toolCall.status,
      result: toolCall.result === null ? null : sanitize(toolCall.result),
      error: toolCall.errorMessage ? sanitize(toolCall.errorMessage) : null,
      createdAt: toolCall.createdAt,
      durationMs: toolCall.durationMs,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    statusCounts,
  }
}

export function toToolCallResponse(toolCall) {
  return {
    id: toolCall._id.toString(),
    toolName: toolCall.toolName,
    arguments: toolCall.arguments,
    status: toolCall.status,
    result: toolCall.result,
    errorMessage: toolCall.errorMessage,
    durationMs: toolCall.durationMs,
    createdAt: toolCall.createdAt,
  }
}
