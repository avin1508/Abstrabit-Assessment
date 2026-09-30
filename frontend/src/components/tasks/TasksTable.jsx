import { cn } from '../../utils/cn.js'
import Skeleton from '../ui/Skeleton.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'
import TaskCompleteToggle from './TaskCompleteToggle.jsx'
import TaskDue from './TaskDue.jsx'

const HEADER = 'h-9 px-4 text-left font-mono text-[11px] font-medium tracking-wider whitespace-nowrap text-fg-subtle uppercase'

function Title({ task }) {
  const completed = task.status === 'completed'
  return (
    <>
      <p
        className={cn('truncate text-sm font-medium', completed ? 'text-fg-subtle line-through decoration-fg-subtle/60' : 'text-fg')}
        title={task.title}
      >
        {task.title}
      </p>
      {task.description && <p className="mt-0.5 line-clamp-1 text-xs text-fg-subtle">{task.description}</p>}
    </>
  )
}

// Tasks as a table from `md` up and as stacked rows on phones. Only action: complete / reopen.
export default function TasksTable({ tasks, writable, onToggle }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead className="border-b border-line bg-surface-muted/60">
            <tr>
              <th scope="col" className={cn(HEADER, 'w-12')}>
                <span className="sr-only">Done</span>
              </th>
              <th scope="col" className={cn(HEADER, 'pl-0')}>Task</th>
              <th scope="col" className={cn(HEADER, 'w-32')}>Status</th>
              <th scope="col" className={cn(HEADER, 'w-32')}>Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {tasks.map((task) => (
              <tr key={task.id}>
                <td className="px-4 py-3 align-top">
                  <TaskCompleteToggle task={task} onToggle={onToggle} disabled={!writable} />
                </td>
                <td className="min-w-0 py-3 pr-4 align-top">
                  <Title task={task} />
                </td>
                <td className="px-4 py-3 align-top">
                  <StatusBadge status={task.status} />
                </td>
                <td className="px-4 py-3 align-top text-xs">
                  <TaskDue task={task} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line md:hidden">
        {tasks.map((task) => (
          <li key={task.id} className="flex gap-3 px-4 py-3.5">
            <div className="pt-0.5">
              <TaskCompleteToggle task={task} onToggle={onToggle} disabled={!writable} />
            </div>
            <div className="min-w-0 flex-1">
              <Title task={task} />
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                <StatusBadge status={task.status} />
                <TaskDue task={task} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

export function TasksTableSkeleton({ rows = 5 }) {
  return (
    <ul className="divide-y divide-line" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-4 px-4 py-4">
          <Skeleton className="size-5 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-2.5 w-3/5" />
          </div>
          <Skeleton className="hidden h-5 w-20 md:block" />
          <Skeleton className="hidden h-3 w-16 md:block" />
        </li>
      ))}
    </ul>
  )
}
