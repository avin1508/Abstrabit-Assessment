import { Link } from 'react-router-dom'
import { MessageSquareText, ShieldCheck, Upload } from 'lucide-react'
import { PATHS } from '../../routes/paths.js'
import { canWrite } from '../../utils/permissions.js'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import Tooltip from '../ui/Tooltip.jsx'
import WorkspaceAvatar from '../workspace/WorkspaceAvatar.jsx'

export default function WorkspaceOverviewHeader({ workspace }) {
  const writable = canWrite(workspace)

  const uploadButton = (
    <Button as={writable ? Link : 'button'} to={writable ? PATHS.DOCUMENTS : undefined} leftIcon={Upload} disabled={!writable}>
      Upload document
    </Button>
  )

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="hidden sm:block">
            <WorkspaceAvatar workspace={workspace} size="xl" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-medium tracking-wider text-fg-subtle uppercase">Active workspace</p>
            <h1 className="mt-1 flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-fg">
              <span className="sm:hidden">
                <WorkspaceAvatar workspace={workspace} size="sm" />
              </span>
              <span className="truncate">{workspace.name}</span>
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-fg-muted">
              Documents, conversations and tool activity in this workspace.
              <Badge tone="brand">{workspace.role}</Badge>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {writable ? uploadButton : <Tooltip content="Viewers can’t upload documents">{uploadButton}</Tooltip>}
          <Button as={Link} to={PATHS.CHAT} variant="primary" leftIcon={MessageSquareText}>
            Ask AI
          </Button>
        </div>
      </header>

      <p className="flex items-center gap-2.5 rounded-lg border border-line bg-surface-muted/50 px-3 py-2 text-xs text-fg-muted">
        <ShieldCheck className="size-4 shrink-0 text-emerald-600" aria-hidden />
        <span>
          Showing data from <span className="font-semibold text-fg">{workspace.name}</span> only. Other workspaces are never
          included.
        </span>
      </p>
    </div>
  )
}
