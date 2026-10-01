import { Task } from '../models/index.js'
import { HttpError } from '../utils/httpError.js'

// Safe task data for the client.
export function toTaskResponse(task) {
  return {
    id: task._id.toString(),
    title: task.title,
    description: task.description,
    status: task.status,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }
}

// Creates a task (used by the create_task tool). workspaceId and createdBy come from the
// verified request, never from the model; status always starts as "open".
export async function createTask({ workspaceId, userId, title, description, dueDate }) {
  const task = await Task.create({
    workspaceId,
    createdBy: userId,
    title,
    description: description ?? '',
    status: 'open',
    dueDate: dueDate ? new Date(dueDate) : null,
  })
  return {
    taskId: task._id.toString(),
    title: task.title,
    status: task.status,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
  }
}

// One page of the (already ownership-verified) workspace's tasks, newest first.
export async function listTasks(workspaceId, { page, limit }) {
  const [tasks, total] = await Promise.all([
    Task.find({ workspaceId }).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
    Task.countDocuments({ workspaceId }),
  ])
  return {
    items: tasks.map(toTaskResponse),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

// Only the status can change. A task outside the workspace is "not found".
export async function updateTaskStatus(workspaceId, taskId, status) {
  const task = await Task.findOneAndUpdate({ _id: taskId, workspaceId }, { $set: { status } }, { new: true })
  if (!task) throw new HttpError(404, 'Task not found')
  return toTaskResponse(task)
}
