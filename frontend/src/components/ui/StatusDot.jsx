import { cn } from '../../utils/cn.js'

const TONES = {
  neutral: 'bg-fg-subtle',
  brand: 'bg-brand-500',
  info: 'bg-sky-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
}

export default function StatusDot({ tone = 'neutral', pulse = false, className }) {
  return (
    <span className={cn('relative inline-flex size-1.5 shrink-0', className)} aria-hidden>
      {pulse && <span className={cn('absolute inset-0 animate-ping rounded-full opacity-60', TONES[tone])} />}
      <span className={cn('relative size-1.5 rounded-full', TONES[tone])} />
    </span>
  )
}
