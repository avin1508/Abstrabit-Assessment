import { formatDateTime, formatRelativeTime } from '../../utils/format.js'
import { cn } from '../../utils/cn.js'

// <time> showing "3h ago" with the full timestamp on hover.
export default function RelativeTime({ value, className }) {
  return (
    <time dateTime={value} title={formatDateTime(value)} className={cn('whitespace-nowrap', className)}>
      {formatRelativeTime(value)}
    </time>
  )
}
