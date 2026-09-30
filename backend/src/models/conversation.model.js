import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema(
  {
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, trim: true, default: 'New conversation' },
  },
  { timestamps: true },
)

conversationSchema.index({ workspaceId: 1, updatedAt: -1 })

export const Conversation = mongoose.model('Conversation', conversationSchema, 'conversations')
