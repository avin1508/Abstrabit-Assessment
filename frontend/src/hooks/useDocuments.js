import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { deleteDocument, fetchDocuments, retryDocument } from '../store/slices/documentSlice.js'

// Documents stay "processing" until ingestion finishes, so refresh quietly while any are.
const POLL_MS = 3000

/*
 * Documents of the active workspace, from documentSlice. AppLayout fetches them whenever
 * workspaceSlice.activeWorkspaceId changes; this hook adds polling and the page actions.
 * status: loading | error | success
 */
export default function useDocuments(workspaceId) {
  const dispatch = useDispatch()
  const state = useSelector((root) => root.document)

  // Until the list for this workspace arrives, show nothing rather than another workspace's list.
  const current = state.workspaceId === workspaceId
  const documents = current ? state.documents : []
  const status = current && state.error ? 'error' : !current || state.loading ? 'loading' : 'success'

  const hasProcessing = documents.some((document) => document.status === 'processing')
  useEffect(() => {
    if (!hasProcessing) return
    const timer = setInterval(() => dispatch(fetchDocuments(workspaceId)), POLL_MS)
    return () => clearInterval(timer)
  }, [hasProcessing, workspaceId, dispatch])

  const reload = useCallback(() => dispatch(fetchDocuments(workspaceId)), [dispatch, workspaceId])

  // Both resolve with the result or throw { message } for the caller to show.
  const retry = (documentId) => dispatch(retryDocument({ workspaceId, documentId })).unwrap()
  const remove = (documentId) => dispatch(deleteDocument({ workspaceId, documentId })).unwrap()

  return {
    documents,
    status,
    error: current ? state.error : null,
    deleting: state.deleting,
    retrying: state.retrying,
    reload,
    retry,
    remove,
  }
}
