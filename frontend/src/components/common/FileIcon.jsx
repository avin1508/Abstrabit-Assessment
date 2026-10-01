import { cn } from '../../utils/cn.js'

const TYPES = {
  pdf: 'bg-red-50 text-red-700 ring-red-600/15',
  docx: 'bg-sky-50 text-sky-700 ring-sky-600/15',
  md: 'bg-violet-50 text-violet-700 ring-violet-600/15',
  txt: 'bg-surface-muted text-fg-muted ring-line-strong/70',
  csv: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
}

const SIZES = {
  xs: 'size-5 rounded text-[7px]',
  sm: 'size-7 text-[8px]',
  md: 'size-9 text-[9px]',
}

export default function FileIcon({ type = '', size = 'md', className }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-mono font-semibold tracking-wide uppercase ring-1 ring-inset',
        size !== 'xs' && 'rounded-md',
        TYPES[type] ?? TYPES.txt,
        SIZES[size],
        className,
      )}
    >
      {type.slice(0, 4) || 'FILE'}
    </span>
  )
}
