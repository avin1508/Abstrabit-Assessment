import { cn } from '../../utils/cn.js'
import { focusRing } from '../../utils/styles.js'

/*
 * Single-choice filter, e.g. All / Indexed / Processing / Failed.
 * options: [{ value, label, count? }]
 */
export default function SegmentedControl({ label, options, value, onChange, className }) {
  function onKeyDown(event) {
    const index = options.findIndex((option) => option.value === value)
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!delta) return
    event.preventDefault()
    const next = options[(index + delta + options.length) % options.length]
    onChange(next.value)
    event.currentTarget.querySelector(`[data-value="${next.value}"]`)?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn('inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-lg bg-surface-muted p-0.5 ring-1 ring-line ring-inset', className)}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            data-value={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium whitespace-nowrap transition-colors',
              focusRing,
              selected ? 'bg-surface text-fg shadow-xs ring-1 ring-line' : 'text-fg-muted hover:text-fg',
            )}
          >
            {option.label}
            {option.count != null && (
              <span className={cn('font-mono text-[10px] tabular-nums', selected ? 'text-fg-muted' : 'text-fg-subtle')}>
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
