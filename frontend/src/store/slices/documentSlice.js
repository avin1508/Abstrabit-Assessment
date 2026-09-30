import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getErrorMessage } from '../../api/axios.js'
import {
  deleteDocumentRequest,
  listDocumentsRequest,
  retryDocumentRequest,
  uploadDocumentRequest,
} from '../../api/document.api.js'
import { logout } from './authSlice.js'

const initialState = {
  documents: [],
  // Workspace the list belongs to, so a response for a previous workspace is never shown.
  workspaceId: null,
  loading: false,
  uploading: false,
  deleting: false,
  retrying: false,
  uploadProgress: 0,
  // Last list-load error. Upload/delete/retry errors go back to the caller via unwrap().
  error: null,
}

const toRejection = (error) => ({ message: getErrorMessage(error) })

// Callers pass workspaceSlice.activeWorkspaceId (via useWorkspace's activeWorkspace.id).
export const fetchDocuments = createAsyncThunk('document/fetchDocuments', async (workspaceId, { rejectWithValue }) => {
  try {
    return await listDocumentsRequest(workspaceId)
  } catch (error) {
    return rejectWithValue(toRejection(error))
  }
})

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

// Results are applied only if they belong to the workspace currently shown.
const forShownWorkspace = (state, workspaceId) => workspaceId === state.workspaceId

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
        // Switching workspace: drop the previous workspace's documents immediately.
        if (action.meta.arg !== state.workspaceId) {
          state.documents = []
          state.workspaceId = action.meta.arg
        }
        state.loading = true
        state.error = null
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        if (!forShownWorkspace(state, action.meta.arg)) return
        state.documents = action.payload
        state.loading = false
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        if (!forShownWorkspace(state, action.meta.arg)) return
        state.loading = false
        state.error = action.payload?.message ?? 'Couldn’t load documents.'
      })

      .addCase(uploadDocument.pending, (state) => {
        state.uploading = true
        state.uploadProgress = 0
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.uploading = false
        state.uploadProgress = 0
        if (forShownWorkspace(state, action.payload.workspaceId)) {
          state.documents = [action.payload, ...state.documents.filter((document) => document.id !== action.payload.id)]
        }
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
        state.documents = state.documents.map((document) => (document.id === action.payload.id ? action.payload : document))
      })
      .addCase(retryDocument.rejected, (state) => {
        state.retrying = false
      })

      .addCase(logout, () => initialState)
  },
})

export const { uploadProgressChanged } = documentSlice.actions
export default documentSlice.reducer
