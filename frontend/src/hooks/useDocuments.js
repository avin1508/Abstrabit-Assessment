import { useCallback, useEffect, useRef, useState } from 'react'
import { deleteDocument, listDocuments, retryDocument } from '../services/documentService.js'

const POLL_MS = 1500
const IN_FLIGHT = new Set(['queued', 'processing'])

/*
 * Documents for one workspace. While any document is queued/processing the list is
 * re-fetched quietly so ingestion progress updates live (the backend may later push this instead).
 */
export default function useDocuments(workspaceId) {
  const [state, setState] = useState({ status: 'loading', documents: [], error: null })
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const fetchDocuments = useCallback(async () => {
    try {
      const documents = await listDocuments(workspaceId)
      if (mountedRef.current) setState({ status: 'success', documents, error: null })
    } catch (error) {
      if (mountedRef.current) setState((current) => ({ ...current, status: 'error', error }))
    }
  }, [workspaceId])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const hasInFlight = state.documents.some((document) => IN_FLIGHT.has(document.status))
  useEffect(() => {
    if (!hasInFlight) return
    const timer = setInterval(fetchDocuments, POLL_MS)
    return () => clearInterval(timer)
  }, [hasInFlight, fetchDocuments])

  const reload = useCallback(() => {
    setState((current) => ({ ...current, status: 'loading', error: null }))
    fetchDocuments()
  }, [fetchDocuments])

  const addDocument = useCallback((document) => {
    setState((current) => ({
      ...current,
      documents: [document, ...current.documents.filter((existing) => existing.id !== document.id)],
    }))
  }, [])

  const replaceDocument = (document) =>
    setState((current) => ({
      ...current,
      documents: current.documents.map((existing) => (existing.id === document.id ? document : existing)),
    }))

  async function retry(documentId) {
    replaceDocument(await retryDocument(workspaceId, documentId))
  }

  async function remove(documentId) {
    await deleteDocument(workspaceId, documentId)
    setState((current) => ({
      ...current,
      documents: current.documents.filter((document) => document.id !== documentId),
    }))
  }

  return { ...state, reload, addDocument, retry, remove }
}
