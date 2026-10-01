import mongoose from 'mongoose'

export const MESSAGE_ROLES = ['user', 'assistant', 'tool']
export const MESSAGE_STATUSES = ['answer', 'unknown', 'error']

// Snapshot of a cited chunk, kept even if the source document is later deleted.
const citationSchema = new mongoose.Schema(
  {
    index: {
      type: Number,
      required: true,
    },

    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },

    chunkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DocumentChunk',
      required: true,
    },

    documentName: {
      type: String,
      required: true,
    },

    fileType: {
      type: String,
      default: null,
    },

    pageNumber: {
      type: Number,
      default: null,
    },

    location: {
      type: String,
      default: null,
    },

    excerpt: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
  },
)

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },

    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },

    role: {
      type: String,
      enum: MESSAGE_ROLES,
      required: true,
    },

    status: {
      type: String,
      enum: [...MESSAGE_STATUSES, null],
      default: null,
    },

    // Optional for tool messages, whose data lives in the linked tool call.
    content: {
      type: String,
      required: function () {
        return this.role !== 'tool'
      },
    },

    citations: {
      type: [citationSchema],
      default: [],
    },

    toolCallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ToolCall',
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  },
)

messageSchema.index({ conversationId: 1, createdAt: 1 })

export const Message = mongoose.model('Message', messageSchema, 'messages')
