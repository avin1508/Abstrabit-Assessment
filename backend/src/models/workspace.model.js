import mongoose from 'mongoose'

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

workspaceSchema.index({ ownerId: 1 })

export const Workspace = mongoose.model('Workspace', workspaceSchema, 'workspaces')
