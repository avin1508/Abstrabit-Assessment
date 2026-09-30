import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getErrorMessage } from '../../api/axios.js'
import {
  deleteDocumentRequest,
  getDocumentStatusRequest,
  listDocumentsRequest,
  retryDocumentRequest,
  uploadDocumentRequest,
} from '../../api/document.api.js'
import { logout } from './authSlice.js'

export const PAGE_SIZE = 10
const DEFAULT_FILTERS = { status: 'all', search: '' }
const EMPTY_COUNTS = { all: 0, processing: 0, indexed: 0, failed: 0 }

const initialState = {
  // The current page of documents, as returned by the backend.
  documents: [],
  // Workspace the list belongs to, so a response for a previous workspace is never shown.
  workspaceId: null,
  pagination: { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 },
  // Filters sent to the backend with every page request.
  filters: DEFAULT_FILTERS,
  // Documents per status across the whole workspace (for the filter tabs).
  statusCounts: EMPTY_COUNTS,
  loading: false,
  uploading: false,
  deleting: false,
  retrying: false,
  uploadProgress: 0,
  // Last list-load error. Upload/delete/retry errors go back to the caller via unwrap().
  error: null,
  // Only the latest list request may update the list (fast page clicks, workspace switches).
  listRequestId: null,
}

const toRejection = (error) => ({ message: getErrorMessage(error) })

/*
 * One page of documents. Callers pass workspaceSlice.activeWorkspaceId (via useWorkspace).
 * Omitted options fall back to page 1 and no filters.
 */
export const fetchDocuments = createAsyncThunk(
  'document/fetchDocuments',
  async ({ workspaceId, page = 1, limit = PAGE_SIZE, status = 'all', search = '' }, { rejectWithValue }) => {
    try {
      return await listDocumentsRequest(workspaceId, { page, limit, status, search })
    } catch (error) {
      return rejectWithValue(toRejection(error))
    }
  },
)

// Processing state of one document, for progress polling.
export const fetchDocumentStatus = createAsyncThunk(
  'document/fetchDocumentStatus',
  async ({ workspaceId, documentId }, { rejectWithValue }) => {
    try {
      return await getDocumentStatusRequest(workspaceId, documentId)
    } catch (error) {
      return rejectWithValue(toRejection(error))
    }
  },
)

export const uploadDocument = createAsyncThunk(
  'document/uploadDocument',
  async ({ workspaceId, file }, { dispatch, rejectWithValue }) => {
    try {
      return await uploadDocumentRequest(workspaceId, file, (percent) => dispatch(uploadProgressChanged(percent)))
    } catch (error) {
      return rejectWithValue(toRejection(error))
    }
  },
)

export const deleteDocument = createAsyncThunk(
  'document/deleteDocument',
  async ({ workspaceId, documentId }, { rejectWithValue }) => {
    try {
      await deleteDocumentRequest(workspaceId, documentId)
      return documentId
    } catch (error) {
      return rejectWithValue(toRejection(error))
    }
  },
)

export const retryDocument = createAsyncThunk(
  'document/retryDocument',
  async ({ workspaceId, documentId }, { rejectWithValue }) => {
    try {
      return await retryDocumentRequest(workspaceId, documentId)
    } catch (error) {
      return rejectWithValue(toRejection(error))
    }
  },
)

// Replaces a document in the current page, keeping the status counts in step.
function applyDocumentUpdate(state, update) {
  const index = state.documents.findIndex((document) => document.id === update.id)
  if (index === -1) return
  const previous = state.documents[index].status
  if (update.status && update.status !== previous) {
    state.statusCounts[previous] = Math.max(0, state.statusCounts[previous] - 1)
    state.statusCounts[update.status] += 1
  }
  state.documents[index] = { ...state.documents[index], ...update }
}

const documentSlice = createSlice({
  name: 'document',
  initialState,
  reducers: {
    uploadProgressChanged(state, action) {
      state.uploadProgress = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state, action) => {
        const { workspaceId, limit = PAGE_SIZE, status = 'all', search = '' } = action.meta.arg
        // Switching workspace: drop the previous workspace's page, pagination and counts at once.
        if (workspaceId !== state.workspaceId) {
          state.documents = []
          state.statusCounts = EMPTY_COUNTS
          state.pagination = { page: 1, limit, total: 0, totalPages: 0 }
          state.workspaceId = workspaceId
        }
        // Filters show immediately; the page number changes only when that page's documents
        // arrive, so the "Page X of Y" label always matches the rows shown.
        state.filters = { status, search }
        state.listRequestId = action.meta.requestId
        state.loading = true
        state.error = null
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return
        state.documents = action.payload.documents
        state.pagination = action.payload.pagination
        state.statusCounts = action.payload.statusCounts
        state.loading = false
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return
        state.loading = false
        state.error = action.payload?.message ?? 'Couldn’t load documents.'
      })

      .addCase(fetchDocumentStatus.fulfilled, (state, action) => {
        if (action.meta.arg.workspaceId === state.workspaceId) applyDocumentUpdate(state, action.payload)
      })

      .addCase(uploadDocument.pending, (state) => {
        state.uploading = true
        state.uploadProgress = 0
      })
      // The page is re-fetched after an upload (see useDocumentUploads), so only flags change here.
      .addCase(uploadDocument.fulfilled, (state) => {
        state.uploading = false
        state.uploadProgress = 0
      })
      .addCase(uploadDocument.rejected, (state) => {
        state.uploading = false
        state.uploadProgress = 0
      })

      .addCase(deleteDocument.pending, (state) => {
        state.deleting = true
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.deleting = false
        state.documents = state.documents.filter((document) => document.id !== action.payload)
      })
      .addCase(deleteDocument.rejected, (state) => {
        state.deleting = false
      })

      .addCase(retryDocument.pending, (state) => {
        state.retrying = true
      })
      .addCase(retryDocument.fulfilled, (state, action) => {
        state.retrying = false
        applyDocumentUpdate(state, action.payload)
      })
      .addCase(retryDocument.rejected, (state) => {
        state.retrying = false
      })

      .addCase(logout, () => initialState)
  },
})

export const { uploadProgressChanged } = documentSlice.actions
export default documentSlice.reducer
