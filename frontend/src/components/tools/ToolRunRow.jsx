import { cn } from '../../utils/cn.js'
import { formatDuration } from '../../utils/format.js'
import RelativeTime from '../common/RelativeTime.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'
import { getToolMeta } from './toolMeta.js'

const ICON_TONES = {
  success: 'text-fg-muted',
  running: 'text-sky-600',
  pending: 'text-fg-subtle',
  failed: 'text-red-600',
  blocked: 'text-amber-600',
}

// One tool invocation in a compact list (dashboard): tool id, status, what it did, when.
export default function ToolRunRow({ run }) {
  const { label, icon: Icon } = getToolMeta(run.tool)
  const duration = formatDuration(run.durationMs)

  return (
    <li className="flex items-start gap-3 px-5 py-3.5">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-muted ring-1 ring-line ring-inset">
        <Icon className={cn('size-4', ICON_TONES[run.status] ?? 'text-fg-muted')} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate">
            <code className="font-mono text-xs font-semibold text-fg">{run.tool}</code>
            <span className="ml-2 hidden text-xs text-fg-subtle sm:inline">{label}</span>
          </p>
          <StatusBadge status={run.status} />
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-fg-muted">{run.summary}</p>
        <p className="mt-1 font-mono text-[11px] text-fg-subtle">
          <RelativeTime value={run.createdAt} />
          {duration && ` · ${duration}`}
          {run.triggeredBy && ` · ${run.triggeredBy}`}
        </p>
      </div>
    </li>
  )
}
