import { Check } from 'lucide-react'
import { cn } from '../../utils/cn.js'
import { focusRing } from '../../utils/styles.js'

export default function TaskCompleteToggle({ task, onToggle, disabled }) {
  const completed = task.status === 'completed'

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={completed}
      aria-label={completed ? `Reopen “${task.title}”` : `Mark “${task.title}” complete`}
      title={disabled ? 'View-only access' : completed ? 'Reopen task' : 'Mark complete'}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation()
        onToggle(task)
      }}
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        focusRing,
        completed
          ? 'border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600'
          : 'border-line-strong bg-surface text-transparent hover:border-emerald-500 hover:text-emerald-500',
      )}
    >
      <Check className="size-3" strokeWidth={3} aria-hidden />
    </button>
  )
}
