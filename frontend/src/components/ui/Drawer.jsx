import { useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import useDialog from '../../hooks/useDialog.js'
import { cn } from '../../utils/cn.js'
import IconButton from './IconButton.jsx'

const SIZES = {
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
}

const SIDES = {
  right: { container: 'justify-end', panel: 'h-full animate-slide-in-right border-l' },
  left: { container: 'justify-start', panel: 'h-full animate-slide-in-left border-r' },
  // Bottom sheet for phones: full width, capped height, rounded top.
  bottom: { container: 'items-end', panel: 'max-h-[88dvh] animate-slide-in-up rounded-t-2xl border-t' },
}

// Sheet for details panels. side: 'right' (default) | 'left' | 'bottom'. Full-width on phones.
export default function Drawer({ open, onClose, title, description, header, footer, size = 'lg', side = 'right', children }) {
  const panelRef = useRef(null)
  const titleId = useId()
  useDialog(open, onClose, panelRef)

  if (!open) return null
  const layout = SIDES[side] ?? SIDES.right

  return createPortal(
    <div className={cn('fixed inset-0 z-50 flex', layout.container)}>
      <div className="absolute inset-0 animate-fade-in bg-fg/30" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'relative flex w-full flex-col border-line bg-surface shadow-overlay outline-none',
          layout.panel,
          side !== 'bottom' && SIZES[size],
        )}
      >
        {side === 'bottom' && <span className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line-strong" aria-hidden />}
        <div className="flex items-start gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            {header}
            <h2 id={titleId} className={cn('text-base font-semibold break-words text-fg', header && 'sr-only')}>
              {title}
            </h2>
            {description && !header && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
          </div>
          <IconButton icon={X} label="Close" size="sm" tooltip={false} onClick={onClose} className="-mr-1.5" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface-muted/50 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
