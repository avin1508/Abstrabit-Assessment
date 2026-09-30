import { cn } from '../../utils/cn.js'

/*
 * Label/value pairs. items: [{ label, value, mono? }]; falsy items are skipped.
 */
export default function DetailList({ items, className }) {
  return (
    <dl className={cn('divide-y divide-line', className)}>
      {items.filter(Boolean).map((item) => (
        <div key={item.label} className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-3 py-2.5 text-sm">
          <dt className="text-fg-subtle">{item.label}</dt>
          <dd className={cn('min-w-0 break-words text-fg', item.mono && 'font-mono text-xs leading-5')}>
            {item.value ?? '—'}
          </dd>
        </div>
      ))}
    </dl>
  )
}
