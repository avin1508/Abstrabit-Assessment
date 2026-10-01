import { cn } from '../../utils/cn.js'

const MARK_SIZES = { sm: 'size-6', md: 'size-7', lg: 'size-9' }

export function LogoMark({ size = 'md', className }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md bg-fg text-white shadow-xs',
        MARK_SIZES[size],
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 20 20" className="size-[62%]" fill="none">
        <path d="M3 13.5 10 17l7-3.5" stroke="currentColor" strokeOpacity=".45" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M3 10 10 13.5 17 10" stroke="currentColor" strokeOpacity=".7" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M10 3 17 6.5 10 10 3 6.5 10 3Z" fill="var(--color-brand-400)" stroke="var(--color-brand-400)" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export default function Logo({ size = 'md', className }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark size={size} />
      <span className={cn('font-semibold tracking-tight text-fg', size === 'lg' ? 'text-lg' : 'text-[15px]')}>
        Abstrabit
      </span>
    </span>
  )
}
