import { cn } from '../../utils/cn.js'
import { focusRing } from '../../utils/styles.js'

const SIZES = {
  sm: 'h-4 min-w-4 px-1 text-[10px]',
  md: 'h-5 min-w-5 px-1 text-[11px]',
}

export default function CitationBadge({ index, active = false, onClick, label, size = 'sm', className }) {
  const classes = cn(
    'inline-flex shrink-0 items-center justify-center rounded font-mono font-semibold tabular-nums ring-1 ring-inset transition-colors',
    SIZES[size],
    active
      ? 'bg-brand-600 text-white ring-brand-600'
      : 'bg-brand-50 text-brand-700 ring-brand-600/20',
    className,
  )

  if (!onClick) {
    return (
      <span className={classes} aria-hidden={label ? undefined : true} aria-label={label}>
        {index}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ?? `Source ${index}`}
      aria-pressed={active}
      title={label}
      className={cn(
        classes,
        'mx-0.5 -translate-y-px cursor-pointer align-middle',
        !active && 'hover:bg-brand-100 hover:ring-brand-600/40',
        focusRing,
      )}
    >
      {index}
    </button>
  )
}
