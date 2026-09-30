import * as workspaceService from '../services/workspace.service.js'
import { createWorkspaceSchema } from '../validators/workspace.validator.js'

export async function createWorkspace(req, res) {
  const input = createWorkspaceSchema.parse(req.body)
  const workspace = await workspaceService.createWorkspace(req.user.id, input)
  res.status(201).json({ success: true, message: 'Workspace created', data: { workspace } })
}

export async function listWorkspaces(req, res) {
  const workspaces = await workspaceService.getUserWorkspaces(req.user.id)
  res.json({ success: true, data: { workspaces } })
}
