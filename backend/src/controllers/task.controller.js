import * as taskService from '../services/task.service.js'
import { paginationQuerySchema, taskParamsSchema, updateTaskSchema } from '../validators/task.validator.js'

export async function listTasks(req, res) {
  const query = paginationQuerySchema.parse(req.query)
  const data = await taskService.listTasks(req.workspace._id, query)
  res.json({ success: true, data })
}

export async function updateTask(req, res) {
  const { id } = taskParamsSchema.parse(req.params)
  const { status } = updateTaskSchema.parse(req.body ?? {})
  const task = await taskService.updateTaskStatus(req.workspace._id, id, status)
  res.json({ success: true, data: { task } })
}
