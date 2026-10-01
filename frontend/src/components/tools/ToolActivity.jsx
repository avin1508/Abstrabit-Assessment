import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { PATHS } from '../../routes/paths.js'
import { cn } from '../../utils/cn.js'
import { formatDuration } from '../../utils/format.js'
import RelativeTime from '../common/RelativeTime.jsx'
import LoadingSpinner from '../ui/LoadingSpinner.jsx'
import { ARG_LABELS, TOOL_STATUS, formatArg, getToolMeta } from './toolMeta.js'

function headline(run) {
  const { tool, args, status } = run
  const inFlight = status === 'running' || status === 'pending'
  if (tool === 'create_task') return inFlight ? `Creating task: “${args.title}”` : `“${args.title}”`
  if (tool === 'send_summary') return inFlight ? `Sending summary to ${args.channel}` : `Summary to ${args.channel}`
  return run.summary
}

export default function ToolActivity({ run, className }) {
  if (!run) return null
  const status = TOOL_STATUS[run.status] ?? TOOL_STATUS.pending
  const { label, icon: ToolIcon } = getToolMeta(run.tool)
  const StatusIcon = status.icon
  const args = Object.entries(run.args ?? {}).filter(([key]) => ARG_LABELS[key] && key !== 'title')

  return (
    <section
      aria-label={`Tool activity: ${run.tool}`}
      className={cn('overflow-hidden rounded-lg border border-dashed bg-surface font-sans', status.border, className)}
    >
      <header className={cn('flex items-center gap-2 border-b border-dashed px-3 py-2', status.border, status.header)}>
        <ToolIcon className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />
        <span className="hidden font-mono text-[10px] font-medium tracking-widest text-fg-subtle uppercase sm:inline">
          Tool activity
        </span>
        <code className="min-w-0 truncate font-mono text-xs font-semibold text-fg">{run.tool}</code>
        <span className={cn('ml-auto flex shrink-0 items-center gap-1.5 text-xs font-medium', status.className)} role="status">
          {run.status === 'running' ? (
            <LoadingSpinner size="xs" label="Running" />
          ) : (
            StatusIcon && <StatusIcon className="size-3.5" aria-hidden />
          )}
          {status.label}
        </span>
      </header>

      <div className="space-y-2 px-3 py-2.5">
        <p className="text-sm break-words text-fg">
          <span className="sr-only">{label}: </span>
          {headline(run)}
        </p>

        {args.length > 0 && (
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 font-mono text-[11px]">
            {args.map(([key, value]) => (
              <div key={key} className="contents">
                <dt className="text-fg-subtle">{ARG_LABELS[key]}</dt>
                <dd className="truncate text-fg-muted" title={String(value)}>
                  {formatArg(key, value)}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {run.error && <p className={cn('text-xs', run.status === 'blocked' ? 'text-amber-800' : 'text-red-700')}>{run.error}</p>}
        {run.status === 'success' && run.result?.taskId && (
          <Link
            to={PATHS.TASKS}
            className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-700 hover:underline"
          >
            ✓ Task created — view in Tasks
            <ArrowUpRight className="size-3" aria-hidden />
          </Link>
        )}
        {run.status === 'success' && run.result?.messageId && (
          <p className="text-xs text-emerald-700">
            ✓ Delivered to {run.result.channel} <code className="font-mono text-fg-subtle">{run.result.messageId}</code>
          </p>
        )}

      </div>

      <footer className="flex items-center gap-2 border-t border-dashed border-line px-3 py-1.5 font-mono text-[10px] text-fg-subtle">
        <RelativeTime value={run.createdAt} />
        {formatDuration(run.durationMs) && <span>· {formatDuration(run.durationMs)}</span>}
        <Link to={PATHS.TOOL_LOGS} className="ml-auto hover:text-fg hover:underline">
          {label} · log
        </Link>
      </footer>
    </section>
  )
}
