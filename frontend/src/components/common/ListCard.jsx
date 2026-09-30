import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { cn } from '../../utils/cn.js'
import { focusRing } from '../../utils/styles.js'
import { Card, CardHeader } from '../ui/Card.jsx'
import Skeleton from '../ui/Skeleton.jsx'

/*
 * Card with a titled header and a divided list body.
 *   viewAllTo  — optional route for the "View all" link
 *   loading    — renders `skeletonRows` placeholder rows
 *   empty      — element rendered instead of children when there are no rows
 *   divided    — rows separated by rules (default) vs. padded, self-contained items
 */
export default function ListCard({
  title,
  description,
  viewAllTo,
  viewAllLabel = 'View all',
  loading = false,
  skeletonRows = 4,
  isEmpty = false,
  empty,
  divided = true,
  className,
  children,
}) {
  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      <CardHeader
        title={title}
        description={description}
        actions={
          viewAllTo && (
            <Link
              to={viewAllTo}
              className={cn(
                'group inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-fg-muted hover:text-fg',
                focusRing,
              )}
            >
              {viewAllLabel}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          )
        }
      />
      {loading ? (
        <ul className="divide-y divide-line" aria-hidden>
          {Array.from({ length: skeletonRows }, (_, i) => (
            <li key={i} className="flex items-center gap-3 px-5 py-3.5">
              <Skeleton className="size-8 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-2/5" />
                <Skeleton className="h-2.5 w-3/5" />
              </div>
            </li>
          ))}
        </ul>
      ) : isEmpty ? (
        <div className="flex flex-1 items-center justify-center">{empty}</div>
      ) : (
        <ul className={divided ? 'divide-y divide-line' : 'space-y-0.5 p-2'}>{children}</ul>
      )}
    </Card>
  )
}
