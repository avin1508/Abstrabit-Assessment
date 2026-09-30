import { MOCK_TASKS } from '../data/mockTasks.js'

/*
 * Mock task service. Tasks are created only by the assistant's `create_task` tool
 * (createTaskSync, called from toolService). Stands in for:
 *   GET   /api/workspaces/:workspaceId/tasks
 *   PATCH /api/workspaces/:workspaceId/tasks/:id   { status }
 */

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const now = () => new Date().toISOString()

const tasks = MOCK_TASKS.map((task) => ({ ...task }))
const clone = (task) => ({ ...task })

function findInWorkspace(workspaceId, taskId) {
  const task = tasks.find((candidate) => candidate.id === taskId)
  // Same error for "missing" and "other workspace" so ids reveal nothing across workspaces.
  if (!task || task.workspaceId !== workspaceId) throw new Error('Task not found.')
  return task
}

// Called by the create_task tool. Throws on invalid arguments (reported as a failed tool run).
export function createTaskSync(workspaceId, fields) {
  const title = fields.title?.trim() ?? ''
  if (!title) throw new Error('Title is required.')
  if (title.length > 200) throw new Error('Title must be 200 characters or fewer.')

  const task = {
    id: `task_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    workspaceId,
    title,
    description: fields.description?.trim() ?? '',
    status: 'open',
    dueDate: fields.dueDate || null,
    createdBy: fields.createdBy,
    createdAt: now(),
    conversationId: fields.conversationId ?? null,
    toolRunId: fields.toolRunId ?? null,
  }
  tasks.unshift(task)
  return clone(task)
}

// Newest first, so a task the assistant just created appears at the top.
export async function listTasks(workspaceId) {
  await delay(350)
  return tasks
    .filter((task) => task.workspaceId === workspaceId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(clone)
}

// status: 'open' | 'completed'
export async function setTaskStatus(workspaceId, taskId, status) {
  await delay(250)
  const task = findInWorkspace(workspaceId, taskId)
  Object.assign(task, { status, completedAt: status === 'completed' ? now() : null })
  return clone(task)
}
