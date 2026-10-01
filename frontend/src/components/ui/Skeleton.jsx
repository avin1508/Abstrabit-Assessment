import { cn } from '../../utils/cn.js'

export default function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-md bg-line/70', className)} aria-hidden />
}
