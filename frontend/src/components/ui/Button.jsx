import { cn } from '../../utils/cn.js'
import { focusRing } from '../../utils/styles.js'
import LoadingSpinner from './LoadingSpinner.jsx'

// Visual weight, highest to lowest: primary > secondary > ghost.
// Destructive actions use `danger` (confirming) or `danger-secondary` (initiating).
const VARIANTS = {
  primary:
    'bg-brand-600 text-white shadow-xs shadow-brand-900/10 hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-600/50',
  secondary:
    'border border-line-strong bg-surface text-fg shadow-xs hover:bg-surface-muted active:bg-line disabled:text-fg-subtle',
  ghost: 'text-fg-muted hover:bg-surface-muted hover:text-fg active:bg-line disabled:text-fg-subtle',
  danger: 'bg-red-600 text-white shadow-xs hover:bg-red-700 active:bg-red-800 disabled:bg-red-600/50',
  'danger-secondary':
    'border border-line-strong bg-surface text-red-600 shadow-xs hover:border-red-200 hover:bg-red-50 disabled:text-red-300',
}

const SIZES = {
  sm: 'h-7 gap-1.5 rounded-md px-2.5 text-xs',
  md: 'h-8.5 gap-2 rounded-md px-3 text-sm',
  lg: 'h-10 gap-2 rounded-md px-4 text-sm',
}

const ICON_SIZES = { sm: 'size-3.5', md: 'size-4', lg: 'size-4' }

export default function Button({
  as: Component = 'button',
  variant = 'secondary',
  size = 'md',
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  ...props
}) {
  const isButton = Component === 'button'
  const iconClass = cn(ICON_SIZES[size], 'shrink-0')

  return (
    <Component
      {...(isButton && { type: 'button', disabled: disabled || loading })}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex select-none items-center justify-center font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed',
        focusRing,
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <LoadingSpinner size={size === 'sm' ? 'xs' : 'sm'} />
      ) : (
        LeftIcon && <LeftIcon className={iconClass} aria-hidden />
      )}
      {children}
      {RightIcon && !loading && <RightIcon className={iconClass} aria-hidden />}
    </Component>
  )
}
