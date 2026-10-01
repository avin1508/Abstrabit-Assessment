import { useCallback, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CircleCheck, CircleX, Info, TriangleAlert, X } from 'lucide-react'
import { cn } from '../../utils/cn.js'
import { ToastContext } from './toastContext.js'
import LoadingSpinner from './LoadingSpinner.jsx'

const TONES = {
  neutral: { Icon: Info, className: 'text-fg-subtle' },
  info: { Icon: Info, className: 'text-sky-600' },
  success: { Icon: CircleCheck, className: 'text-emerald-600' },
  warning: { Icon: TriangleAlert, className: 'text-amber-600' },
  danger: { Icon: CircleX, className: 'text-red-600' },
}

const DEFAULT_DURATION = 4500

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const toast = useCallback(
    ({ title, description, tone = 'neutral', duration = DEFAULT_DURATION }) => {
      const id = ++nextId.current
      setToasts((current) => [...current.slice(-3), { id, title, description, tone }])
      if (duration > 0) setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6"
        >
          {toasts.map((item) => (
            <ToastItem key={item.id} {...item} onDismiss={() => dismiss(item.id)} />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

function ToastItem({ title, description, tone, onDismiss }) {
  const { Icon, className } = TONES[tone] ?? TONES.neutral

  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className="pointer-events-auto flex w-full animate-slide-in gap-3 rounded-lg border border-line bg-surface p-3.5 shadow-overlay sm:w-88"
    >
      {tone === 'loading' ? (
        <LoadingSpinner size="sm" className="mt-px text-brand-600" />
      ) : (
        <Icon className={cn('mt-px size-4 shrink-0', className)} aria-hidden />
      )}
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium text-fg">{title}</p>
        {description && <p className="mt-0.5 text-fg-muted">{description}</p>}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="-m-1 h-fit rounded p-1 text-fg-subtle hover:bg-surface-muted hover:text-fg"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}
