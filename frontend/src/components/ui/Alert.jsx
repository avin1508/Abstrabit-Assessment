import { CircleCheck, CircleX, Info, TriangleAlert, X } from 'lucide-react'
import { cn } from '../../utils/cn.js'

const TONES = {
  info: { box: 'border-sky-200 bg-sky-50/70', icon: 'text-sky-600', Icon: Info },
  success: { box: 'border-emerald-200 bg-emerald-50/70', icon: 'text-emerald-600', Icon: CircleCheck },
  warning: { box: 'border-amber-200 bg-amber-50/70', icon: 'text-amber-600', Icon: TriangleAlert },
  danger: { box: 'border-red-200 bg-red-50/70', icon: 'text-red-600', Icon: CircleX },
  neutral: { box: 'border-line bg-surface-muted', icon: 'text-fg-subtle', Icon: Info },
}

export default function Alert({ tone = 'info', title, icon, action, onDismiss, className, children }) {
  const { box, icon: iconClass, Icon: DefaultIcon } = TONES[tone]
  const Icon = icon ?? DefaultIcon

  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-lg border p-3.5', box, className)}>
      <Icon className={cn('mt-px size-4 shrink-0', iconClass)} aria-hidden />
      <div className="min-w-0 flex-1 text-sm">
        {title && <p className="font-medium text-fg">{title}</p>}
        {children && <div className={cn('text-fg-muted', title && 'mt-0.5')}>{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-m-1 h-fit rounded p-1 text-fg-subtle hover:bg-black/5 hover:text-fg"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
