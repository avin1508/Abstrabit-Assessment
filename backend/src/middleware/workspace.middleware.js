import { getOwnedWorkspace } from '../services/workspace.service.js'
import { HttpError } from '../utils/httpError.js'

// Never trust the workspace id from the client: load it only if this user owns it (404
// otherwise). Handlers should scope every query with req.workspace._id.
export async function requireWorkspace(req, res, next) {
  const workspaceId = req.params.workspaceId ?? req.get('X-Workspace-Id')
  if (!workspaceId) throw new HttpError(400, 'Select a workspace (X-Workspace-Id header)')

  req.workspace = await getOwnedWorkspace(workspaceId, req.user.id)
  next()
}
