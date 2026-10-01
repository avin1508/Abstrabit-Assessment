import mongoose from 'mongoose'
import { Conversation, Document, Message, Workspace } from '../models/index.js'
import { HttpError } from '../utils/httpError.js'
import { listDocuments } from './document.service.js'
import { listToolCalls } from './tool.service.js'

// Workspaces have a single owner; there is no membership system. `role` is a display value
// the frontend shows in the workspace switcher.
function toWorkspaceResponse(workspace, documentCount = 0) {
  return {
    id: workspace._id.toString(),
    name: workspace.name,
    ownerId: workspace.ownerId.toString(),
    documentCount,
    role: 'Owner',
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
  }
}

export async function createWorkspace(ownerId, { name }) {
  const workspace = await Workspace.create({ name, ownerId })
  return toWorkspaceResponse(workspace)
}

// Only the caller's workspaces, oldest first (the one created at registration comes first).
export async function getUserWorkspaces(ownerId) {
  const workspaces = await Workspace.find({ ownerId }).sort({ createdAt: 1 }).lean()
  if (workspaces.length === 0) return []

  // One grouped query for all document counts instead of one query per workspace.
  const counts = await Document.aggregate([
    { $match: { workspaceId: { $in: workspaces.map((workspace) => workspace._id) } } },
    { $group: { _id: '$workspaceId', count: { $sum: 1 } } },
  ])
  const countById = new Map(counts.map(({ _id, count }) => [_id.toString(), count]))

  return workspaces.map((workspace) => toWorkspaceResponse(workspace, countById.get(workspace._id.toString()) ?? 0))
}

// Returns the workspace only if it belongs to the user. A missing workspace and someone
// else's workspace both give 404, so the response never reveals that another user's exists.
export async function getOwnedWorkspace(workspaceId, ownerId) {
  const workspace = mongoose.isValidObjectId(workspaceId)
    ? await Workspace.findOne({ _id: workspaceId, ownerId })
    : null

  if (!workspace) {
    throw new HttpError(404, 'Workspace not found')
  }
  return workspace
}

const RECENT_DOCUMENTS = 5
const RECENT_CONVERSATIONS = 4
const RECENT_TOOL_RUNS = 5

// Latest chat message of a conversation (tool messages skipped) and whether its latest answer
// was grounded, for the dashboard preview.
async function lastMessageOf(conversationId) {
  const [last, lastAnswer] = await Promise.all([
    Message.findOne({ conversationId, role: { $ne: 'tool' } }).sort({ createdAt: -1, _id: -1 }).lean(),
    Message.findOne({ conversationId, role: 'assistant' }).sort({ createdAt: -1, _id: -1 }).lean(),
  ])
  if (!last) return null
  return { role: last.role, status: last.status ?? null, content: last.content ?? '', grounded: lastAnswer?.status !== 'unknown' }
}

/*
 * Dashboard overview for one (already ownership-verified) workspace: counts plus the most
 * recent documents, conversations and tool calls. Everything is read for this workspace only,
 * reusing the document and tool-call list services.
 */
export async function getWorkspaceOverview(workspaceId) {
  const [documents, toolCalls, conversationCount, conversations] = await Promise.all([
    listDocuments(workspaceId, { page: 1, limit: RECENT_DOCUMENTS }),
    listToolCalls(workspaceId, { page: 1, limit: RECENT_TOOL_RUNS }),
    Conversation.countDocuments({ workspaceId }),
    Conversation.find({ workspaceId }).sort({ updatedAt: -1 }).limit(RECENT_CONVERSATIONS).lean(),
  ])
  const previews = await Promise.all(conversations.map((conversation) => lastMessageOf(conversation._id)))

  return {
    stats: {
      documents: documents.statusCounts.all,
      indexedDocuments: documents.statusCounts.indexed,
      processingDocuments: documents.statusCounts.processing,
      conversations: conversationCount,
      toolCalls: toolCalls.pagination.total,
      successfulToolCalls: toolCalls.statusCounts.success,
      unsuccessfulToolCalls: toolCalls.statusCounts.failed,
    },
    recentDocuments: documents.documents,
    recentConversations: conversations.map((conversation, i) => ({
      id: conversation._id.toString(),
      title: conversation.title || 'New conversation',
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      lastMessage: previews[i],
    })),
    recentToolRuns: toolCalls.items,
  }
}
