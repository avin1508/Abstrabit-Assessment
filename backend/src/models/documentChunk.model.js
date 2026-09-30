import mongoose from 'mongoose'

// workspaceId is duplicated here so vector search can filter by tenant.
// The Atlas Vector Search index (path "embedding", filter "workspaceId") is created in Atlas later.
const documentChunkSchema = new mongoose.Schema(
  {
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
    chunkIndex: { type: Number, required: true, min: 0 },
    text: { type: String, required: true },
    embedding: { type: [Number], default: undefined },
    pageNumber: { type: Number, default: null },
  },
  { timestamps: true },
)

documentChunkSchema.index({ documentId: 1, chunkIndex: 1 }, { unique: true })

export const DocumentChunk = mongoose.model('DocumentChunk', documentChunkSchema, 'document_chunks')
