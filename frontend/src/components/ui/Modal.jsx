import { useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import useDialog from '../../hooks/useDialog.js'
import { cn } from '../../utils/cn.js'
import IconButton from './IconButton.jsx'

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
}

export default function Modal({ open, onClose, title, description, footer, size = 'md', children }) {
  const panelRef = useRef(null)
  const titleId = useId()
  useDialog(open, onClose, panelRef)

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 animate-fade-in bg-fg/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[calc(100vh-2rem)] w-full animate-scale-in flex-col rounded-xl border border-line bg-surface shadow-overlay outline-none',
          SIZES[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div className="min-w-0">
            {title && (
              <h2 id={titleId} className="text-base font-semibold text-fg">
                {title}
              </h2>
            )}
            {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
          </div>
          <IconButton icon={X} label="Close" size="sm" tooltip={false} onClick={onClose} className="-mt-1 -mr-2" />
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 rounded-b-xl border-t border-line bg-surface-muted/50 px-5 py-3 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
