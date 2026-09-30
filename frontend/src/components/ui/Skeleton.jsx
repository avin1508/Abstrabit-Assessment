import { cn } from '../../utils/cn.js'

// Size and shape the skeleton with className (e.g. "h-4 w-32").
export default function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-md bg-line/70', className)} aria-hidden />
}
