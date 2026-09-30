import mongoose from 'mongoose'

export const MESSAGE_ROLES = ['user', 'assistant', 'tool']
export const MESSAGE_STATUSES = ['answer', 'unknown', 'error']

const citationSchema = new mongoose.Schema(
  {
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
    chunkId: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentChunk', required: true },
    documentName: { type: String, required: true },
    chunkIndex: { type: Number, required: true },
    snippet: { type: String, required: true },
  },
  { _id: false },
)

const messageSchema = new mongoose.Schema(
  {
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    role: { type: String, enum: MESSAGE_ROLES, required: true },
    content: { type: String, required: true },
    // Only set on assistant messages.
    status: { type: String, enum: [...MESSAGE_STATUSES, null], default: null },
    citations: { type: [citationSchema], default: [] },
    toolCallIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ToolCall' }],
  },
  { timestamps: true },
)

messageSchema.index({ conversationId: 1, createdAt: 1 })

export const Message = mongoose.model('Message', messageSchema, 'messages')
