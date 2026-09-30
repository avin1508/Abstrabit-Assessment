import mongoose from 'mongoose'

export const TASK_STATUSES = ['open', 'completed']

const taskSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    status: {
      type: String,
      enum: TASK_STATUSES,
      required: true,
      default: 'open',
    },

    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

taskSchema.index({ workspaceId: 1, createdAt: -1 })

export const Task = mongoose.model('Task', taskSchema, 'tasks')
