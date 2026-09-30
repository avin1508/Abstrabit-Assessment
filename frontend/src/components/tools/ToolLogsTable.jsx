import { cn } from '../../utils/cn.js'
import Skeleton from '../ui/Skeleton.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'
import { ARG_LABELS, formatArg } from './toolMeta.js'

const HEADER = 'h-9 px-4 text-left font-mono text-[11px] font-medium tracking-wider whitespace-nowrap text-fg-subtle uppercase'

const SUCCESS_TEXT = {
  create_task: 'Task created successfully',
  send_summary: 'Summary sent successfully',
}

function ToolName({ run }) {
  return <p className="truncate font-mono text-sm font-medium text-fg">{run.tool}</p>
}

// key: "value" pairs, one per line.
function Arguments({ args = {} }) {
  const entries = Object.entries(args).filter(([key]) => ARG_LABELS[key])
  return (
    <dl className="space-y-0.5 font-mono text-xs">
      {entries.map(([key, value]) => (
        <div key={key} className="flex min-w-0 gap-1.5">
          <dt className="shrink-0 text-fg-subtle">{key}:</dt>
          <dd className="min-w-0 break-words text-fg-muted">“{formatArg(key, value)}”</dd>
        </div>
      ))}
    </dl>
  )
}

function Result({ run }) {
  if (run.status === 'failed' || run.status === 'blocked') {
    return (
      <p className={cn('text-xs break-words', run.status === 'blocked' ? 'text-amber-800' : 'text-red-700')}>
        <span className="font-medium">Error:</span> {run.error}
      </p>
    )
  }
  if (run.status === 'success') return <p className="text-xs text-emerald-700">{SUCCESS_TEXT[run.tool] ?? 'Completed successfully'}</p>
  return <p className="text-xs text-fg-subtle">In progress…</p>
}

// Tool calls: tool → arguments → status → result or error. Same table style as Tasks.
export default function ToolLogsTable({ runs }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead className="border-b border-line bg-surface-muted/60">
            <tr>
              <th scope="col" className={cn(HEADER, 'w-40')}>Tool</th>
              <th scope="col" className={HEADER}>Arguments</th>
              <th scope="col" className={cn(HEADER, 'w-32')}>Status</th>
              <th scope="col" className={cn(HEADER, 'w-[30%]')}>Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {runs.map((run) => (
              <tr key={run.id}>
                <td className="px-4 py-3 align-top">
                  <ToolName run={run} />
                </td>
                <td className="min-w-0 px-4 py-3 align-top">
                  <Arguments args={run.args} />
                </td>
                <td className="px-4 py-3 align-top">
                  <StatusBadge status={run.status} />
                </td>
                <td className="px-4 py-3 align-top">
                  <Result run={run} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line md:hidden">
        {runs.map((run) => (
          <li key={run.id} className="px-4 py-3.5">
            <ToolName run={run} />
            <div className="mt-1">
              <Arguments args={run.args} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
              <StatusBadge status={run.status} />
              <Result run={run} />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

export function ToolLogsTableSkeleton({ rows = 5 }) {
  return (
    <ul className="divide-y divide-line" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-4 px-4 py-4">
          <Skeleton className="h-3 w-24 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-2.5 w-3/5" />
          </div>
          <Skeleton className="hidden h-5 w-20 md:block" />
          <Skeleton className="hidden h-3 w-32 md:block" />
        </li>
      ))}
    </ul>
  )
}
