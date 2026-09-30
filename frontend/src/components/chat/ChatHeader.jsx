import { BookOpen, ChevronRight, History, Plus } from 'lucide-react'
import Button from '../ui/Button.jsx'
import IconButton from '../ui/IconButton.jsx'
import WorkspaceAvatar from '../workspace/WorkspaceAvatar.jsx'

// Chat title bar: product name, active workspace and panel toggles.
export default function ChatHeader({ workspace, conversationTitle, sourcesOpen, onOpenHistory, onToggleSources, onNew }) {
  return (
    <header className="flex min-w-0 items-center gap-2 border-b border-line bg-surface px-3 py-2.5 sm:gap-3 sm:px-5">
      <IconButton icon={History} label="Conversations" onClick={onOpenHistory} tooltip={false} className="md:hidden" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-fg">AI Assistant</h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-px font-mono text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-600/15 ring-inset">
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
            Workspace-scoped
          </span>
        </div>
        <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-fg-muted">
          <WorkspaceAvatar workspace={workspace} size="xs" />
          <span className="shrink-0 font-medium text-fg">{workspace.name}</span>
          {conversationTitle && (
            <>
              <ChevronRight className="size-3 shrink-0 text-fg-subtle" aria-hidden />
              <span className="truncate">{conversationTitle}</span>
            </>
          )}
        </p>
      </div>

      <IconButton icon={Plus} label="New conversation" onClick={onNew} tooltip={false} className="md:hidden" />
      <Button
        size="sm"
        variant={sourcesOpen ? 'secondary' : 'ghost'}
        leftIcon={BookOpen}
        onClick={onToggleSources}
        aria-pressed={sourcesOpen}
        aria-label="Sources"
        className="shrink-0"
      >
        <span className="hidden sm:inline">Sources</span>
      </Button>
    </header>
  )
}
