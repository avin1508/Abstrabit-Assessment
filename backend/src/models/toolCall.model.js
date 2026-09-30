import mongoose from 'mongoose'

export const TOOL_NAMES = ['create_task', 'send_summary']
export const TOOL_CALL_STATUSES = ['success', 'failed']

const toolCallSchema = new mongoose.Schema(
  {
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toolName: { type: String, enum: TOOL_NAMES, required: true },
    arguments: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: TOOL_CALL_STATUSES, required: true },
    result: { type: mongoose.Schema.Types.Mixed, default: null },
    error: { type: String, default: null },
  },
  { timestamps: true, minimize: false },
)

toolCallSchema.index({ workspaceId: 1, createdAt: -1 })

export const ToolCall = mongoose.model('ToolCall', toolCallSchema, 'tool_calls')
