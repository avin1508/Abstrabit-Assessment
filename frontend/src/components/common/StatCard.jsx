import { cn } from '../../utils/cn.js'
import { Card } from '../ui/Card.jsx'
import Skeleton from '../ui/Skeleton.jsx'

const FOOTNOTE_TONES = {
  neutral: 'text-fg-subtle',
  success: 'text-emerald-700',
  warning: 'text-amber-700',
  danger: 'text-red-600',
}

export default function StatCard({ label, value, title, icon: Icon, footnote, footnoteTone = 'neutral', className }) {
  return (
    <Card className={cn('flex flex-col p-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate font-mono text-[11px] font-medium tracking-wider text-fg-subtle uppercase">{label}</p>
        {Icon && <Icon className="size-4 shrink-0 text-fg-subtle" aria-hidden />}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-fg tabular-nums" title={title}>
        {value}
      </p>
      {footnote && <p className={cn('mt-1 truncate text-xs', FOOTNOTE_TONES[footnoteTone])}>{footnote}</p>}
    </Card>
  )
}

export function StatCardSkeleton() {
  return (
    <Card className="p-4">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-4 h-7 w-16" />
      <Skeleton className="mt-2 h-3 w-24" />
    </Card>
  )
}
