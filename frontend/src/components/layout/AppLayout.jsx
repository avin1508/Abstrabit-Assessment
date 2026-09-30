import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { ChevronRight, FolderPlus, Menu, RefreshCw, TriangleAlert } from 'lucide-react'
import useWorkspace from '../../hooks/useWorkspace.js'
import { fetchDocuments } from '../../store/slices/documentSlice.js'
import { fetchWorkspaces } from '../../store/slices/workspaceSlice.js'
import { findNavItem } from '../../routes/navigation.js'
import Button from '../ui/Button.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import IconButton from '../ui/IconButton.jsx'
import LoadingSpinner from '../ui/LoadingSpinner.jsx'
import CreateWorkspaceModal from '../workspace/CreateWorkspaceModal.jsx'
import WorkspaceAvatar from '../workspace/WorkspaceAvatar.jsx'
import WorkspaceSwitcher from '../workspace/WorkspaceSwitcher.jsx'
import Sidebar from './Sidebar.jsx'

// Desktop breadcrumb: "<workspace> › <page>", so the active workspace is visible above every page.
function Breadcrumb() {
  const { activeWorkspace } = useWorkspace()
  const { pathname } = useLocation()
  const page = findNavItem(pathname)

  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm lg:flex">
      {activeWorkspace && (
        <span className="flex min-w-0 items-center gap-2 font-medium text-fg">
          <WorkspaceAvatar workspace={activeWorkspace} size="xs" />
          <span className="truncate">{activeWorkspace.name}</span>
        </span>
      )}
      {page && (
        <>
          <ChevronRight className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />
          <span className="truncate text-fg-muted" aria-current="page">
            {page.label}
          </span>
        </>
      )}
    </nav>
  )
}

function MainContent() {
  const { activeWorkspace, loaded, error, reload } = useWorkspace()
  const [createOpen, setCreateOpen] = useState(false)

  if (!loaded && error) {
    return (
      <EmptyState
        bordered
        icon={TriangleAlert}
        title="Couldn’t load your workspaces"
        description={error}
        action={
          <Button leftIcon={RefreshCw} onClick={reload}>
            Retry
          </Button>
        }
      />
    )
  }

  if (!loaded) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-sm text-fg-muted" role="status">
        <LoadingSpinner size="md" className="text-brand-600" />
        Loading workspace…
      </div>
    )
  }

  // Registration creates a first workspace, so this only shows if the user has none.
  if (!activeWorkspace) {
    return (
      <>
        <EmptyState
          bordered
          icon={FolderPlus}
          title="Create your first workspace"
          description="Documents, chats, tasks and tool activity all live inside a workspace."
          action={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              Create workspace
            </Button>
          }
        />
        {createOpen && <CreateWorkspaceModal open onClose={() => setCreateOpen(false)} />}
      </>
    )
  }

  // Keyed by workspace so page state never leaks between workspaces.
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24 text-brand-600">
          <LoadingSpinner size="md" label="Loading page" />
        </div>
      }
    >
      <Outlet key={activeWorkspace?.id} />
    </Suspense>
  )
}

// Authenticated app shell: sidebar + top bar + routed content.
export default function AppLayout() {
  const dispatch = useDispatch()
  const { loaded, error, activeWorkspaceId } = useWorkspace()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Load the signed-in user's workspaces once the protected app mounts (and after a sign-in).
  useEffect(() => {
    if (!loaded && !error) dispatch(fetchWorkspaces())
  }, [loaded, error, dispatch])

  // Documents belong to the active workspace: reload them whenever it changes.
  useEffect(() => {
    if (loaded && activeWorkspaceId) dispatch(fetchDocuments(activeWorkspaceId))
  }, [loaded, activeWorkspaceId, dispatch])
  const { pathname } = useLocation()
  const fullBleed = Boolean(findNavItem(pathname)?.fullBleed)

  return (
    <div className="flex h-full">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 animate-fade-in bg-fg/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface lg:my-2 lg:mr-2 lg:overflow-hidden lg:rounded-xl lg:border lg:border-line lg:shadow-xs">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-4 lg:px-8">
          <IconButton
            icon={Menu}
            label="Open navigation"
            tooltip={false}
            onClick={() => setSidebarOpen(true)}
            className="-ml-1.5 lg:hidden"
          />
          <WorkspaceSwitcher variant="compact" className="lg:hidden" />
          <Breadcrumb />
        </header>

        {fullBleed ? (
          <main className="min-h-0 flex-1 overflow-hidden">
            <MainContent />
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-8">
              <MainContent />
            </div>
          </main>
        )}
      </div>
    </div>
  )
}
