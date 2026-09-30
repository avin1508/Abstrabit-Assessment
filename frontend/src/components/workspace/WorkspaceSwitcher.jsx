import { useState } from 'react'
import { Check, ChevronDown, ChevronsUpDown, Plus, ShieldCheck } from 'lucide-react'
import useMenu from '../../hooks/useMenu.js'
import useWorkspace from '../../hooks/useWorkspace.js'
import { cn } from '../../utils/cn.js'
import { focusRing } from '../../utils/styles.js'
import LoadingSpinner from '../ui/LoadingSpinner.jsx'
import Skeleton from '../ui/Skeleton.jsx'
import CreateWorkspaceModal from './CreateWorkspaceModal.jsx'
import WorkspaceAvatar from './WorkspaceAvatar.jsx'

function workspaceMeta(workspace) {
  return `${workspace.documentCount} ${workspace.documentCount === 1 ? 'document' : 'documents'}`
}

function SidebarTrigger({ workspace, busy, open, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg border bg-surface p-2 text-left shadow-xs transition-colors',
        open ? 'border-line-strong' : 'border-line hover:border-line-strong',
        focusRing,
      )}
    >
      <WorkspaceAvatar workspace={workspace} size="md" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-fg" title={workspace.name}>
          {workspace.name}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-fg-subtle">
          <span
            className={cn('size-1.5 shrink-0 rounded-full', busy ? 'animate-pulse bg-sky-500' : 'bg-emerald-500')}
            aria-hidden
          />
          <span className="truncate">{busy ? 'Switching…' : 'Active'}</span>
        </span>
      </span>
      {busy ? (
        <LoadingSpinner size="xs" className="text-fg-subtle" />
      ) : (
        <ChevronsUpDown className="size-4 shrink-0 text-fg-subtle" aria-hidden />
      )}
    </button>
  )
}

function CompactTrigger({ workspace, busy, open, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'flex h-8.5 max-w-full min-w-0 items-center gap-2 rounded-md border border-line bg-surface pr-2 pl-1.5 shadow-xs transition-colors',
        open ? 'border-line-strong bg-surface-muted' : 'hover:bg-surface-muted',
        focusRing,
      )}
    >
      <WorkspaceAvatar workspace={workspace} size="sm" />
      <span className="truncate text-sm font-semibold text-fg" title={workspace.name}>
        {workspace.name}
      </span>
      {busy ? (
        <LoadingSpinner size="xs" className="text-fg-subtle" />
      ) : (
        <ChevronDown className="size-4 shrink-0 text-fg-subtle" aria-hidden />
      )}
    </button>
  )
}

/*
 * Active-workspace picker.
 *   variant="sidebar" — full-width card for the desktop sidebar / mobile drawer.
 *   variant="compact" — pill for the top bar on smaller screens.
 * `onSwitch` fires after a new workspace is chosen (e.g. to close the mobile drawer).
 */
export default function WorkspaceSwitcher({ variant = 'sidebar', onSwitch, className }) {
  const { workspaces, activeWorkspace, status, switchingTo, switchWorkspace } = useWorkspace()
  const { open, rootRef, menuRef, triggerProps, onMenuKeyDown, closeAndFocusTrigger } = useMenu()
  const [createOpen, setCreateOpen] = useState(false)

  if (status !== 'ready' || !activeWorkspace) {
    return variant === 'sidebar' ? (
      <div className={cn('flex items-center gap-2.5 rounded-lg border border-line bg-surface p-2', className)}>
        <Skeleton className="size-8" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
      </div>
    ) : (
      <Skeleton className={cn('h-8.5 w-40', className)} />
    )
  }

  const Trigger = variant === 'sidebar' ? SidebarTrigger : CompactTrigger

  function choose(workspaceId) {
    closeAndFocusTrigger()
    if (workspaceId !== activeWorkspace.id) {
      switchWorkspace(workspaceId)
      onSwitch?.(workspaceId)
    }
  }

  function openCreate() {
    closeAndFocusTrigger()
    setCreateOpen(true)
  }

  return (
    <div ref={rootRef} className={cn('relative', variant === 'sidebar' ? 'w-full' : 'min-w-0', className)}>
      <Trigger
        workspace={switchingTo ?? activeWorkspace}
        busy={Boolean(switchingTo)}
        open={open}
        aria-label={`Active workspace: ${activeWorkspace.name}. Switch workspace`}
        {...triggerProps}
      />

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Workspaces"
          onKeyDown={onMenuKeyDown}
          className="absolute top-full left-0 z-50 mt-1.5 w-[min(19rem,calc(100vw-1.5rem))] origin-top-left animate-scale-in rounded-lg border border-line bg-surface shadow-overlay"
        >
          <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
            <p className="font-mono text-[10px] font-medium tracking-widest text-fg-subtle uppercase">Workspaces</p>
          </div>

          <div className="space-y-0.5 px-1 pb-1">
            {workspaces.map((workspace) => {
              const active = workspace.id === activeWorkspace.id
              return (
                <button
                  key={workspace.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  disabled={Boolean(switchingTo)}
                  onClick={() => choose(workspace.id)}
                  className={cn(
                    'relative flex w-full items-center gap-2.5 rounded-md py-2 pr-2.5 pl-2 text-left outline-none disabled:opacity-60',
                    active
                      ? 'bg-brand-50/70 focus-visible:bg-brand-50'
                      : 'hover:bg-surface-muted focus-visible:bg-surface-muted',
                  )}
                >
                  {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-brand-600" aria-hidden />}
                  <WorkspaceAvatar workspace={workspace} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-fg">{workspace.name}</span>
                      {active && (
                        <span className="shrink-0 rounded bg-brand-100 px-1 font-mono text-[9px] font-semibold tracking-wider text-brand-700 uppercase">
                          Active
                        </span>
                      )}
                    </span>
                    <span className="block truncate font-mono text-[11px] text-fg-subtle">
                      {workspaceMeta(workspace)}
                    </span>
                  </span>
                  {active && <Check className="size-4 shrink-0 text-brand-600" aria-hidden />}
                </button>
              )
            })}
          </div>

          <div className="border-t border-line p-1">
            <button
              type="button"
              role="menuitem"
              onClick={openCreate}
              className="flex w-full items-center gap-2.5 rounded-md p-2 text-left text-sm text-fg-muted outline-none hover:bg-surface-muted hover:text-fg focus-visible:bg-surface-muted focus-visible:text-fg"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-dashed border-line-strong text-fg-subtle">
                <Plus className="size-4" aria-hidden />
              </span>
              Create workspace
            </button>
          </div>

          <p className="flex items-start gap-1.5 rounded-b-lg border-t border-line bg-surface-muted/60 px-3 py-2 text-[11px] leading-snug text-fg-subtle">
            <ShieldCheck className="mt-px size-3.5 shrink-0" aria-hidden />
            Documents, chat, tasks and tool activity are isolated to the active workspace.
          </p>
        </div>
      )}

      {/* Mounted only while open so the form starts empty each time. */}
      {createOpen && <CreateWorkspaceModal open onClose={() => setCreateOpen(false)} />}
    </div>
  )
}
