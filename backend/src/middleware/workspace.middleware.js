import { getOwnedWorkspace } from '../services/workspace.service.js'

// For routes under /:workspaceId. Use after `authenticate`. Loads the workspace only if the
// authenticated user owns it (404 otherwise) and attaches it as req.workspace, so handlers
// scope every query with req.workspace._id rather than trusting the URL.
export async function requireWorkspace(req, res, next) {
  req.workspace = await getOwnedWorkspace(req.params.workspaceId, req.user.id)
  next()
}
