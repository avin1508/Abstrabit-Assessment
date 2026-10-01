import { Task } from '../models/index.js'

// Creates a task. workspaceId and createdBy come from the verified request, never from the
// model; status always starts as "open".
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
