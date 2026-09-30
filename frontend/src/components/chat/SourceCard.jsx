import { cn } from '../../utils/cn.js'
import { focusRing } from '../../utils/styles.js'
import FileIcon from '../common/FileIcon.jsx'
import CitationBadge from './CitationBadge.jsx'
import { fileTypeLabel } from './sourceMeta.js'

/*
 * One retrieved passage backing an answer. Clickable as a whole (opens the preview).
 * citation: { index, documentName, type, location, excerpt }
 */
export default function SourceCard({ citation, workspaceName, active = false, onSelect }) {
  const { index, documentName, type, location, excerpt } = citation

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      aria-label={`Source ${index}: ${documentName}, ${location}. Open preview`}
      className={cn(
        'block w-full rounded-lg border bg-surface p-3.5 text-left transition-[border-color,box-shadow,background-color]',
        focusRing,
        active ? 'border-brand-400 bg-brand-50/30 ring-2 ring-brand-500/15' : 'border-line hover:border-line-strong',
      )}
    >
      <div className="flex items-start gap-2.5">
        <CitationBadge index={index} active={active} size="md" className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-fg" title={documentName}>
            {documentName}
          </p>
          <p className="truncate text-xs text-fg-muted">{location}</p>
        </div>
        <FileIcon type={type} size="sm" />
      </div>

      {excerpt && (
        <blockquote
          className={cn(
            'mt-3 line-clamp-4 border-l-2 pl-3 text-[13px] leading-relaxed text-fg-muted',
            active ? 'border-brand-400' : 'border-line-strong',
          )}
        >
          “{excerpt}”
        </blockquote>
      )}

      <p className="mt-3 font-mono text-[10px] text-fg-subtle uppercase">
        {fileTypeLabel(type)}
        {workspaceName && ` · ${workspaceName}`}
      </p>
    </button>
  )
}
