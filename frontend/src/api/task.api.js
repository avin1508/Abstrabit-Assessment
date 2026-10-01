import api from './axios.js'
import { TASK_ENDPOINTS } from './endpoints.js'
import { toDateOnly } from '../utils/format.js'

const inWorkspace = (workspaceId) => ({ headers: { 'X-Workspace-Id': workspaceId } })

const toTask = (task) => ({ ...task, dueDate: toDateOnly(task.dueDate) })

export async function listTasksRequest(workspaceId, { page, limit }) {
  const response = await api.get(TASK_ENDPOINTS.LIST, { ...inWorkspace(workspaceId), params: { page, limit } })
  const { items, pagination } = response.data.data
  return { items: items.map(toTask), pagination }
}

export async function updateTaskStatusRequest(workspaceId, taskId, status) {
  const response = await api.patch(TASK_ENDPOINTS.UPDATE(taskId), { status }, inWorkspace(workspaceId))
  return toTask(response.data.data.task)
}
