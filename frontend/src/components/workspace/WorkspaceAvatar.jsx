import { cn } from '../../utils/cn.js'

const COLORS = {
  brand: 'bg-brand-600',
  emerald: 'bg-emerald-600',
  amber: 'bg-amber-500',
  sky: 'bg-sky-600',
  rose: 'bg-rose-600',
  neutral: 'bg-fg',
}

const SIZES = {
  xs: 'size-4 rounded text-[9px]',
  sm: 'size-6 rounded-md text-[11px]',
  md: 'size-8 rounded-md text-sm',
  lg: 'size-10 rounded-lg text-base',
  xl: 'size-12 rounded-xl text-lg',
}

const PALETTE = ['brand', 'emerald', 'amber', 'sky', 'rose']

function colorFor(workspace) {
  const id = workspace?.id ?? ''
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return id ? PALETTE[hash % PALETTE.length] : 'neutral'
}

export default function WorkspaceAvatar({ workspace, size = 'md', className }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-semibold text-white shadow-xs ring-1 ring-black/5 ring-inset select-none',
        COLORS[colorFor(workspace)],
        SIZES[size],
        className,
      )}
    >
      {workspace?.name?.trim()[0]?.toUpperCase() ?? '?'}
    </span>
  )
}
