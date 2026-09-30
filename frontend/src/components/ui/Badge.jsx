import { cn } from '../../utils/cn.js'

const TONES = {
  neutral: 'bg-surface-muted text-fg-muted ring-line-strong/70',
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/15',
  info: 'bg-sky-50 text-sky-700 ring-sky-600/15',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  warning: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  danger: 'bg-red-50 text-red-700 ring-red-600/15',
}

const SIZES = {
  sm: 'h-5 gap-1 px-1.5 text-[11px]',
  md: 'h-6 gap-1.5 px-2 text-xs',
}

export default function Badge({ tone = 'neutral', size = 'sm', icon: Icon, mono = false, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-md font-medium whitespace-nowrap ring-1 ring-inset',
        TONES[tone],
        SIZES[size],
        mono && 'font-mono',
        className,
      )}
    >
      {Icon && <Icon className="size-3" aria-hidden />}
      {children}
    </span>
  )
}
