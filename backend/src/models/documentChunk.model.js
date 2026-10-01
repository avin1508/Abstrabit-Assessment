import mongoose from 'mongoose'

// workspaceId is stored on every chunk so vector search can filter by workspace.
const documentChunkSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },

    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },

    chunkIndex: {
      type: Number,
      required: true,
      min: 0,
    },

    content: {
      type: String,
      required: true,
    },

    pageNumber: {
      type: Number,
      default: null,
    },

    embedding: {
      type: [Number],
      default: undefined,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  },
)

documentChunkSchema.index({ workspaceId: 1 })
documentChunkSchema.index({ documentId: 1 })
documentChunkSchema.index({ documentId: 1, chunkIndex: 1 }, { unique: true })

export const DocumentChunk = mongoose.model('DocumentChunk', documentChunkSchema, 'document_chunks')
