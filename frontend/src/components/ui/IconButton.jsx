import { cn } from '../../utils/cn.js'
import { focusRing } from '../../utils/styles.js'
import Tooltip from './Tooltip.jsx'

const VARIANTS = {
  ghost: 'text-fg-subtle hover:bg-surface-muted hover:text-fg active:bg-line',
  secondary: 'border border-line-strong bg-surface text-fg-muted shadow-xs hover:bg-surface-muted hover:text-fg',
  primary: 'bg-brand-600 text-white shadow-xs hover:bg-brand-700',
  danger: 'text-fg-subtle hover:bg-red-50 hover:text-red-600',
}

const SIZES = {
  sm: { button: 'size-7', icon: 'size-3.5' },
  md: { button: 'size-8.5', icon: 'size-4' },
}

// Icon-only button. `label` is required: it becomes the accessible name and the tooltip.
export default function IconButton({
  icon: Icon,
  label,
  variant = 'ghost',
  size = 'md',
  tooltip = true,
  tooltipSide = 'top',
  className,
  ...props
}) {
  const button = (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-40',
        focusRing,
        VARIANTS[variant],
        SIZES[size].button,
        className,
      )}
      {...props}
    >
      <Icon className={SIZES[size].icon} aria-hidden />
    </button>
  )

  return tooltip ? (
    <Tooltip content={label} side={tooltipSide}>
      {button}
    </Tooltip>
  ) : (
    button
  )
}
