import api from './axios.js'
import { TOOL_CALL_ENDPOINTS } from './endpoints.js'
import { toDateOnly } from '../utils/format.js'

const inWorkspace = (workspaceId) => ({ headers: { 'X-Workspace-Id': workspaceId } })

// dueDate can be a full date-time; the UI date helpers expect YYYY-MM-DD.
const withDateOnly = (args = {}) => (args.dueDate ? { ...args, dueDate: toDateOnly(args.dueDate) } : args)

function summarize(run) {
  if (run.status === 'failed') return run.error ?? 'Failed'
  if (run.tool === 'create_task') return `Created task “${run.args?.title ?? ''}”`
  if (run.tool === 'send_summary') return `Summary sent${run.args?.channel ? ` to ${run.args.channel}` : ''}`
  return ''
}

export async function listToolCallsRequest(workspaceId, { page, limit }) {
  const response = await api.get(TOOL_CALL_ENDPOINTS.LIST, { ...inWorkspace(workspaceId), params: { page, limit } })
  const { items, pagination, statusCounts } = response.data.data
  const runs = items.map((run) => ({ ...run, args: withDateOnly(run.args) }))
  return { items: runs.map((run) => ({ ...run, summary: summarize(run) })), pagination, statusCounts }
}
