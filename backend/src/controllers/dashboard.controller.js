import { getWorkspaceOverview } from '../services/workspace.service.js'

// GET /api/workspaces/:workspaceId/overview — req.workspace is set by requireWorkspace
// (ownership verified); all data is read for req.workspace._id only.
export async function getOverview(req, res) {
  const overview = await getWorkspaceOverview(req.workspace._id)
  res.json({ success: true, data: overview })
}
