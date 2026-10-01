import { listToolCalls as listWorkspaceToolCalls } from '../services/tool.service.js'
import { paginationQuerySchema } from '../validators/task.validator.js'

// req.workspace is set by requireWorkspace (ownership verified).
export async function listToolCalls(req, res) {
  const query = paginationQuerySchema.parse(req.query)
  const data = await listWorkspaceToolCalls(req.workspace._id, query)
  res.json({ success: true, data })
}
