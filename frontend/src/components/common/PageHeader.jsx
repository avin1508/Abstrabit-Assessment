import { cn } from '../../utils/cn.js'

// Top-of-page title block. `eyebrow` is an optional small mono label above the title.
export default function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 font-mono text-[11px] font-medium tracking-wider text-fg-subtle uppercase">{eyebrow}</p>
        )}
        <h1 className="text-xl font-semibold tracking-tight text-fg">{title}</h1>
        {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
