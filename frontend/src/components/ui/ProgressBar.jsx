import { cn } from '../../utils/cn.js'

const TONES = {
  brand: 'bg-brand-500',
  info: 'bg-sky-500',
  success: 'bg-emerald-500',
  danger: 'bg-red-500',
}

export default function ProgressBar({ value, tone = 'brand', label, className }) {
  const clamped = Math.max(0, Math.min(100, value ?? 0))

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={cn('h-1 w-full overflow-hidden rounded-full bg-line', className)}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-500 ease-out', TONES[tone])} style={{ width: `${clamped}%` }} />
    </div>
  )
}
