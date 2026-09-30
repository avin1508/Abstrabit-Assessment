import { cn } from '../../utils/cn.js'

const SIZES = {
  xs: 'size-3',
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-8',
}

export default function LoadingSpinner({ size = 'sm', label = 'Loading', className }) {
  return (
    <svg
      className={cn('animate-spin', SIZES[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label={label}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
