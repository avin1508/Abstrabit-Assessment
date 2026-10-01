import mongoose from 'mongoose'

export const DOCUMENT_STATUSES = ['processing', 'indexed', 'failed']
export const PROCESSING_STAGES = ['extracting', 'chunking', 'embedding']

const documentSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    originalName: {
      type: String,
      required: true,
      trim: true,
    },

    mimeType: {
      type: String,
      default: null,
    },

    fileSize: {
      type: Number,
      min: 0,
      default: null,
    },

    contentHash: {
      type: String,
      required: false,
      default: null,
    },

    storagePath: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: DOCUMENT_STATUSES,
      required: true,
      default: 'processing',
    },

    // Current stage while processing; the stage that failed when status is "failed".
    processingStage: {
      type: String,
      enum: [...PROCESSING_STAGES, null],
      default: 'extracting',
    },

    errorMessage: {
      type: String,
      default: null,
    },

    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

documentSchema.index({ workspaceId: 1 })
documentSchema.index({ workspaceId: 1, createdAt: -1 })
documentSchema.index(
  { workspaceId: 1, contentHash: 1 },
  {
    unique: true,
    partialFilterExpression: {
      contentHash: { $type: 'string' },
    },
  },
)

export const Document = mongoose.model('Document', documentSchema, 'documents')
