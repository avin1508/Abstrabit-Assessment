import mongoose from 'mongoose'
import { Document, Workspace } from '../models/index.js'
import { HttpError } from '../utils/httpError.js'

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
