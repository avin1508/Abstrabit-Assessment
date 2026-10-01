import { CalendarDays } from 'lucide-react'
import { cn } from '../../utils/cn.js'
import { dueState, formatDate } from '../../utils/format.js'

const TONES = { danger: 'text-red-600', warning: 'text-amber-700', neutral: 'text-fg-muted' }

export default function TaskDue({ task }) {
  if (!task.dueDate) return <span className="text-fg-subtle">No due date</span>
  const state = dueState(task.dueDate, task.status)

  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap', state ? TONES[state.tone] : 'text-fg-subtle')} title={state?.label}>
      <CalendarDays className="size-3.5 shrink-0" aria-hidden />
      {formatDate(task.dueDate)}
      {state?.tone === 'danger' && <span className="sr-only">({state.label})</span>}
    </span>
  )
}
