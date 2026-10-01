import { cn } from '../../utils/cn.js'
import { focusRing } from '../../utils/styles.js'
import FileIcon from '../common/FileIcon.jsx'
import CitationBadge from './CitationBadge.jsx'

export default function SourceCitation({ citation, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`Source ${citation.index}: ${citation.documentName}, ${citation.location}`}
      title={`${citation.documentName} · ${citation.location}`}
      className={cn(
        'inline-flex max-w-full min-w-0 items-center gap-2 rounded-md border py-1 pr-2.5 pl-1 text-left text-xs transition-colors',
        focusRing,
        active
          ? 'border-brand-400 bg-brand-50/70 text-fg ring-1 ring-brand-500/20'
          : 'border-line bg-surface text-fg-muted hover:border-line-strong hover:text-fg',
      )}
    >
      <CitationBadge index={citation.index} active={active} className="size-4.5" />
      <FileIcon type={citation.type} size="xs" />
      <span className="min-w-0 truncate">
        <span className="font-medium text-fg">{citation.documentName}</span>
        <span className="text-fg-subtle"> · {citation.location}</span>
      </span>
    </button>
  )
}
