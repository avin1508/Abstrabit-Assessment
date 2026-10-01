import { getWorkspaceOverview } from '../services/workspace.service.js'

export async function getOverview(req, res) {
  const overview = await getWorkspaceOverview(req.workspace._id)
  res.json({ success: true, data: overview })
}
