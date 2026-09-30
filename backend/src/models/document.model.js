import mongoose from 'mongoose'

export const DOCUMENT_STATUSES = ['processing', 'indexed', 'failed']
export const PROCESSING_STAGES = ['extracting', 'chunking', 'embedding']

const documentSchema = new mongoose.Schema(
  {
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    originalName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    fileHash: { type: String, required: true },
    storagePath: { type: String, required: true },
    status: { type: String, enum: DOCUMENT_STATUSES, default: 'processing', required: true },
    processingStage: { type: String, enum: [...PROCESSING_STAGES, null], default: 'extracting' },
    error: { type: String, default: null },
    chunkCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
)

documentSchema.index({ workspaceId: 1 })
documentSchema.index({ workspaceId: 1, createdAt: -1 })

export const Document = mongoose.model('Document', documentSchema, 'documents')
