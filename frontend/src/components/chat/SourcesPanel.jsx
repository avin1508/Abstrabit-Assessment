import { BookOpen, FileX, FolderOpen, Info, ShieldCheck } from 'lucide-react'
import EmptyState from '../ui/EmptyState.jsx'
import SourceCard from './SourceCard.jsx'

export default function SourcesPanel({ message, workspace, indexedCount, activeCitation, onSelectCitation, embedded = false }) {
  // Defensive: never show evidence that doesn't belong to the active workspace.
  const scoped = message && message.workspaceId === workspace.id ? message : null
  const citations = (scoped?.citations ?? []).filter((citation) => !citation.workspaceId || citation.workspaceId === workspace.id)

  let body
  if (indexedCount === 0 && !scoped) {
    body = (
      <EmptyState
        icon={FolderOpen}
        title="No documents to cite"
        description={`${workspace.name} has no indexed documents yet, so answers can’t be backed by sources.`}
        className="px-2"
      />
    )
  } else if (!scoped) {
    body = (
      <EmptyState
        icon={BookOpen}
        title="No sources yet"
        description={`Ask a question — the passages from ${workspace.name} used to answer it will appear here.`}
        className="px-2"
      />
    )
  } else if (scoped.state === 'unknown') {
    body = (
      <EmptyState
        icon={FileX}
        title="No supporting evidence found"
        description={`Nothing in ${workspace.name} was relevant enough to support an answer, so the assistant didn’t give one. There are no sources to show.`}
        className="px-2"
      />
    )
  } else if (citations.length === 0) {
    body = (
      <EmptyState
        icon={BookOpen}
        title="No sources for this response"
        description="It didn’t draw on workspace documents. Select a cited answer, or click a [n] marker, to inspect its evidence."
        className="px-2"
      />
    )
  } else {
    body = (
      <ol className="space-y-2.5" aria-label="Sources used">
        {citations.map((citation) => (
          <li key={citation.index}>
            <SourceCard
              citation={citation}
              workspaceName={workspace.name}
              active={activeCitation === citation.index}
              onSelect={() => onSelectCitation?.(scoped.id, citation.index)}
            />
          </li>
        ))}
      </ol>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      {!embedded && (
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-fg">Sources</h2>
          <p className="mt-0.5 text-xs text-fg-muted" aria-live="polite">
            {citations.length > 0
              ? `${citations.length} ${citations.length === 1 ? 'source' : 'sources'} used in the selected answer`
              : 'Evidence for the selected answer'}
          </p>
        </div>
      )}

      <div className="relative min-h-0 flex-1 overflow-y-auto p-4">
        {embedded && citations.length > 0 && (
          <p className="mb-3 text-xs font-medium text-fg-muted" aria-live="polite">
            {citations.length} {citations.length === 1 ? 'source' : 'sources'} used in the selected answer
          </p>
        )}
        {citations.length > 0 && (
          <p className="mb-3 flex items-start gap-2 rounded-md bg-surface-muted px-3 py-2 text-xs leading-snug text-fg-muted">
            <Info className="mt-px size-3.5 shrink-0 text-fg-subtle" aria-hidden />
            The answer is generated from these excerpts. Select a source to see the highlighted evidence.
          </p>
        )}
        {body}
      </div>

      <p className="flex items-center gap-1.5 border-t border-line px-4 py-2.5 text-[11px] text-fg-subtle">
        <ShieldCheck className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
        Only documents from {workspace.name}
      </p>
    </div>
  )
}
