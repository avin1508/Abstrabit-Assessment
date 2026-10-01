import { useEffect, useRef, useState } from 'react'
import { FileSearch, FolderOpen, RefreshCw, Search, Upload, X } from 'lucide-react'
import { canWrite } from '../utils/permissions.js'
import useDocuments from '../hooks/useDocuments.js'
import useDocumentUploads from '../hooks/useDocumentUploads.js'
import useToast from '../hooks/useToast.js'
import useWorkspace from '../hooks/useWorkspace.js'
import PageHeader from '../components/common/PageHeader.jsx'
import Pagination from '../components/common/Pagination.jsx'
import DocumentDetailsDrawer from '../components/documents/DocumentDetailsDrawer.jsx'
import DocumentsTable, { DocumentsTableSkeleton } from '../components/documents/DocumentsTable.jsx'
import UploadDropzone from '../components/documents/UploadDropzone.jsx'
import UploadQueue from '../components/documents/UploadQueue.jsx'
import WorkspaceScope from '../components/workspace/WorkspaceScope.jsx'
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  SegmentedControl,
  Tooltip,
} from '../components/ui/index.js'

const SEARCH_DEBOUNCE_MS = 300

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'indexed', label: 'Indexed' },
  { value: 'processing', label: 'Processing' },
  { value: 'failed', label: 'Failed' },
]

export default function DocumentsPage() {
  const { activeWorkspace: workspace } = useWorkspace()
  const { toast } = useToast()
  const writable = canWrite(workspace)

  const {
    documents,
    status,
    error,
    pagination,
    filters,
    statusCounts,
    setPage,
    setStatusFilter,
    setSearch,
    clearFilters,
    reload,
    retry,
    remove,
  } = useDocuments(workspace.id)
  // New uploads are newest, so show page 1 (with the current filters) after each one.
  const { uploads, addFiles, dismiss, clearFinished } = useDocumentUploads({
    workspaceId: workspace.id,
    onUploaded: () => setPage(1),
  })

  const dropzoneRef = useRef(null)
  const [query, setQuery] = useState(filters.search)
  const [selectedId, setSelectedId] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  useEffect(() => {
    const value = query.trim()
    if (value === filters.search) return
    const timer = setTimeout(() => setSearch(value), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query, filters.search, setSearch])

  // Read from the current page so the drawer shows live ingestion progress.
  const selected = documents.find((document) => document.id === selectedId) ?? null

  function handleFiles(files) {
    const entries = addFiles(files)
    const accepted = entries.filter((entry) => entry.status === 'queued').length
    if (accepted) {
      toast({
        tone: 'info',
        title: `Uploading ${accepted} ${accepted === 1 ? 'file' : 'files'} to ${workspace.name}`,
      })
    }
  }

  async function handleRetry(document) {
    try {
      await retry(document.id)
      toast({ tone: 'info', title: 'Retrying ingestion', description: document.name })
    } catch (retryError) {
      toast({ tone: 'danger', title: 'Couldn’t retry ingestion', description: retryError.message })
    }
  }

  async function confirmDelete() {
    const document = pendingDelete
    try {
      await remove(document.id)
      if (selectedId === document.id) setSelectedId(null)
      toast({ tone: 'success', title: 'Document deleted', description: `${document.name} and its chunks were removed.` })
    } catch (deleteError) {
      toast({ tone: 'danger', title: 'Couldn’t delete document', description: deleteError.message })
    } finally {
      setPendingDelete(null)
    }
  }

  const actions = {
    writable,
    onOpen: (document) => setSelectedId(document.id),
    onRetry: handleRetry,
    onDelete: setPendingDelete,
  }

  const uploadButton = (
    <Button variant="primary" leftIcon={Upload} disabled={!writable} onClick={() => dropzoneRef.current?.open()}>
      Upload document
    </Button>
  )

  const loading = status === 'loading' && documents.length === 0
  const workspaceEmpty = status === 'success' && statusCounts.all === 0
  const filtered = filters.status !== 'all' || Boolean(filters.search)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<WorkspaceScope />}
        title="Documents"
        description={`Files in ${workspace.name}. They’re only used to answer questions asked in this workspace.`}
        actions={writable ? uploadButton : <Tooltip content="Viewers can’t upload documents">{uploadButton}</Tooltip>}
      />

      <div className="space-y-3">
        <UploadDropzone ref={dropzoneRef} onFiles={handleFiles} workspaceName={workspace.name} disabled={!writable} />
        <UploadQueue uploads={uploads} onDismiss={dismiss} onClearFinished={clearFinished} />
      </div>

      {status === 'error' && (
        <Alert
          tone="danger"
          title="Couldn’t load documents"
          action={
            <Button size="sm" leftIcon={RefreshCw} onClick={reload}>
              Try again
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-fg">All documents</h2>
            <p className="font-mono text-[11px] text-fg-subtle" aria-live="polite">
              {loading
                ? 'Loading…'
                : `${statusCounts.all} ${statusCounts.all === 1 ? 'document' : 'documents'}`}
              {statusCounts.processing > 0 && ` · ${statusCounts.processing} processing`}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SegmentedControl
              label="Filter by status"
              value={filters.status}
              onChange={setStatusFilter}
              options={FILTERS.map((option) => ({ ...option, count: loading ? null : statusCounts[option.value] }))}
            />
            <Input
              aria-label="Search documents"
              placeholder="Search by name…"
              size="sm"
              leftIcon={Search}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="sm:w-56"
              rightElement={
                query && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setQuery('')}
                    className="rounded p-0.5 text-fg-subtle hover:bg-surface-muted hover:text-fg"
                  >
                    <X className="size-3.5" />
                  </button>
                )
              }
            />
          </div>
        </div>

        {loading ? (
          <DocumentsTableSkeleton />
        ) : workspaceEmpty ? (
          <EmptyState
            icon={FolderOpen}
            title={`No documents in ${workspace.name} yet`}
            description="Upload PDFs, Word documents, Markdown or text files. Once indexed, the assistant can answer questions from them with citations."
            action={writable && uploadButton}
            className="py-16"
          />
        ) : documents.length === 0 && filtered ? (
          <EmptyState
            icon={FileSearch}
            title="No matching documents"
            description={
              filters.search ? `Nothing matches “${filters.search}” with the current filter.` : 'No documents have this status.'
            }
            action={
              <Button
                size="sm"
                onClick={() => {
                  setQuery('')
                  clearFilters()
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <DocumentsTable documents={documents} selectedId={selectedId} actions={actions} />
            <Pagination
              page={pagination.page}
              pageCount={Math.max(1, pagination.totalPages)}
              onChange={setPage}
              label="Documents pages"
            />
          </>
        )}
      </Card>

      <DocumentDetailsDrawer
        document={selected}
        workspace={workspace}
        writable={writable}
        onClose={() => setSelectedId(null)}
        onRetry={handleRetry}
        onDelete={setPendingDelete}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete document?"
        confirmLabel="Delete document"
        description={
          pendingDelete &&
          `${pendingDelete.name} will be removed from ${workspace.name}, along with its indexed data. Past answers that cited it will keep their citation text. This can’t be undone.`
        }
      />
    </div>
  )
}
