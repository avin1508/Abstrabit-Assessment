import { useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn.js'
import useMenu from '../../hooks/useMenu.js'
import Kbd from './Kbd.jsx'

const VIEWPORT_MARGIN = 8
const GAP = 4

// Rendered in a portal so tables and drawers don't clip it.
export default function Dropdown({ renderTrigger, items, align = 'start', className }) {
  const { open, rootRef, menuRef, triggerProps, onMenuKeyDown, closeAndFocusTrigger } = useMenu()

  // Flip above the trigger when there's no room below.
  useLayoutEffect(() => {
    const trigger = rootRef.current?.querySelector('[aria-haspopup]')
    const menu = menuRef.current
    if (!open || !trigger || !menu) return

    const t = trigger.getBoundingClientRect()
    const m = menu.getBoundingClientRect()
    const fitsBelow = t.bottom + GAP + m.height <= window.innerHeight - VIEWPORT_MARGIN
    const top = fitsBelow || t.top - GAP - m.height < VIEWPORT_MARGIN ? t.bottom + GAP : t.top - GAP - m.height
    const preferredLeft = align === 'end' ? t.right - m.width : t.left
    const left = Math.max(VIEWPORT_MARGIN, Math.min(preferredLeft, window.innerWidth - m.width - VIEWPORT_MARGIN))

    Object.assign(menu.style, { top: `${top}px`, left: `${left}px`, visibility: 'visible' })
  }, [open, align, rootRef, menuRef])

  function select(item) {
    closeAndFocusTrigger()
    item.onSelect?.()
  }

  return (
    <div ref={rootRef} className={cn('relative inline-block', className)}>
      {renderTrigger({ open, ...triggerProps })}

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            onKeyDown={onMenuKeyDown}
            className={cn(
              'invisible fixed z-[70] min-w-48 animate-scale-in rounded-lg border border-line bg-surface p-1 shadow-overlay',
              align === 'end' ? 'origin-top-right' : 'origin-top-left',
            )}
          >
            {items.map((item, i) => {
              if (item.type === 'separator') return <div key={i} className="-mx-1 my-1 h-px bg-line" />
              if (item.type === 'label') {
                return (
                  <div key={i} className="px-2 pt-1.5 pb-1 font-mono text-[11px] tracking-wider text-fg-subtle uppercase">
                    {item.label}
                  </div>
                )
              }

              const Icon = item.icon
              const danger = item.tone === 'danger'
              return (
                <button
                  key={i}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => select(item)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none disabled:opacity-40',
                    danger
                      ? 'text-red-600 hover:bg-red-50 focus-visible:bg-red-50'
                      : 'text-fg hover:bg-surface-muted focus-visible:bg-surface-muted',
                  )}
                >
                  {Icon && <Icon className={cn('size-4', danger ? 'text-red-500' : 'text-fg-subtle')} aria-hidden />}
                  <span className="flex-1">{item.label}</span>
                  {item.shortcut && <Kbd>{item.shortcut}</Kbd>}
                </button>
              )
            })}
          </div>,
          document.body,
        )}
    </div>
  )
}
