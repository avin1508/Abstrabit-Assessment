import { cn } from '../../utils/cn.js'

export function Card({ as: Component = 'div', className, children, ...props }) {
  return (
    <Component
      className={cn('rounded-lg border border-line bg-surface shadow-xs', className)}
      {...props}
    >
      {children}
    </Component>
  )
}

export function CardHeader({ title, description, actions, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 border-b border-line px-5 py-4', className)}>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

