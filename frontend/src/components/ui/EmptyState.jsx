import { cn } from '../../utils/cn.js'

export default function EmptyState({ icon: Icon, title, description, action, bordered = false, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-12 text-center',
        bordered && 'rounded-lg border border-dashed border-line-strong bg-surface',
        className,
      )}
    >
      {Icon && (
        <div className="mb-4 flex size-10 items-center justify-center rounded-lg border border-line bg-surface text-fg-subtle shadow-xs">
          <Icon className="size-5" aria-hidden />
        </div>
      )}
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-5 flex items-center gap-2">{action}</div>}
    </div>
  )
}
