import { cn } from '../../utils/cn.js'

const SIZES = {
  xs: 'size-5 text-[10px]',
  sm: 'size-6 text-[11px]',
  md: 'size-8 text-xs',
  lg: 'size-10 text-sm',
}

const COLORS = [
  'bg-brand-100 text-brand-800',
  'bg-emerald-100 text-emerald-800',
  'bg-amber-100 text-amber-800',
  'bg-sky-100 text-sky-800',
  'bg-rose-100 text-rose-800',
  'bg-violet-100 text-violet-800',
]

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

// Stable color per name so the same person/workspace always looks the same.
function colorFor(name = '') {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return COLORS[hash % COLORS.length]
}

export default function Avatar({ name, src, size = 'md', square = false, className }) {
  const shape = square ? 'rounded-md' : 'rounded-full'

  if (src) {
    return <img src={src} alt={name} className={cn('shrink-0 object-cover', SIZES[size], shape, className)} />
  }

  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-semibold select-none',
        SIZES[size],
        shape,
        colorFor(name),
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
