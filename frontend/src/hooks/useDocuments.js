import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  deleteDocument,
  fetchDocuments,
  fetchDocumentStatus,
  PAGE_SIZE,
  retryDocument,
} from '../store/slices/documentSlice.js'

// How often the status of each processing document is checked.
const STATUS_POLL_MS = 2500
const NO_FILTERS = { status: 'all', search: '' }

/*
 * The active workspace's documents, one backend page at a time, from documentSlice.
 * AppLayout loads page 1 whenever workspaceSlice.activeWorkspaceId changes; this hook adds
 * paging/filtering, progress polling and the page actions.
 * status: loading | error | success
 */
export default function useDocuments(workspaceId) {
  const dispatch = useDispatch()
  const state = useSelector((root) => root.document)

  // Until this workspace's list arrives, show nothing rather than another workspace's list.
  const current = state.workspaceId === workspaceId
  const documents = current ? state.documents : []
  const status = current && state.error ? 'error' : !current || state.loading ? 'loading' : 'success'
  const pagination = current ? state.pagination : { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 }
  const filters = current ? state.filters : NO_FILTERS

  // Fetch a page with the given changes; filter changes go back to page 1.
  const load = useCallback(
    (changes = {}) => dispatch(fetchDocuments({ workspaceId, limit: pagination.limit, ...filters, page: pagination.page, ...changes })),
    [dispatch, workspaceId, pagination.limit, pagination.page, filters],
  )

  const setPage = useCallback((page) => load({ page }), [load])
  const setStatusFilter = useCallback((value) => load({ status: value, page: 1 }), [load])
  const setSearch = useCallback((value) => load({ search: value, page: 1 }), [load])
  const clearFilters = useCallback(() => load({ status: 'all', search: '', page: 1 }), [load])
  const reload = useCallback(() => load(), [load])

  // Poll only documents that are still processing; stops once each is indexed or failed.
  const processingIds = documents.filter((document) => document.status === 'processing').map((document) => document.id)
  const processingKey = processingIds.join(',')
  useEffect(() => {
    if (!processingKey) return
    const ids = processingKey.split(',')
    const timer = setInterval(() => {
      for (const documentId of ids) dispatch(fetchDocumentStatus({ workspaceId, documentId }))
    }, STATUS_POLL_MS)
    return () => clearInterval(timer)
  }, [processingKey, workspaceId, dispatch])

  // A page past the end (e.g. after deleting the last item on it): show the last page instead.
  const { page, totalPages, total } = pagination
  useEffect(() => {
    if (current && !state.loading && !state.error && documents.length === 0 && page > 1 && total > 0) {
      load({ page: Math.max(1, totalPages) })
    }
  }, [current, state.loading, state.error, documents.length, page, total, totalPages, load])

  // Both resolve with the result or throw { message } for the caller to show.
  const retry = (documentId) => dispatch(retryDocument({ workspaceId, documentId })).unwrap()
  const remove = async (documentId) => {
    await dispatch(deleteDocument({ workspaceId, documentId })).unwrap()
    load() // refill the page and refresh totals
  }

  return {
    documents,
    status,
    error: current ? state.error : null,
    pagination,
    filters,
    statusCounts: current ? state.statusCounts : { all: 0, processing: 0, indexed: 0, failed: 0 },
    setPage,
    setStatusFilter,
    setSearch,
    clearFilters,
    reload,
    retry,
    remove,
  }
}
