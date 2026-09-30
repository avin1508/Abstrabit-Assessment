import { getOwnedWorkspace } from '../services/workspace.service.js'
import { HttpError } from '../utils/httpError.js'

// Use after `authenticate`. The workspace comes from the :workspaceId route param or the
// X-Workspace-Id header. It is loaded only if the authenticated user owns it (404 otherwise)
// and attached as req.workspace, so handlers scope every query with req.workspace._id rather
// than trusting the client.
export async function requireWorkspace(req, res, next) {
  const workspaceId = req.params.workspaceId ?? req.get('X-Workspace-Id')
  if (!workspaceId) throw new HttpError(400, 'Select a workspace (X-Workspace-Id header)')

  req.workspace = await getOwnedWorkspace(workspaceId, req.user.id)
  next()
}
