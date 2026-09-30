import { useCallback, useEffect, useRef, useState } from 'react'

const ITEM_SELECTOR = '[role^="menuitem"]:not(:disabled)'

/*
 * Open/close + keyboard behavior shared by menu-style popovers.
 * Spread `triggerProps` on the trigger button, attach `rootRef` to the wrapper and
 * `menuRef` + `onMenuKeyDown` to the menu (which may be portaled elsewhere).
 * Closes on outside press, window resize and scroll outside the menu.
 * On open, focus goes to the checked item (if any) or the first item.
 */
export default function useMenu() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const menuRef = useRef(null)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return

    const isInside = (target) => rootRef.current?.contains(target) || menuRef.current?.contains(target)
    const onPointerDown = (event) => !isInside(event.target) && close()

    // Close only if the trigger actually moved — ignores late scroll events (e.g. scroll-into-view
    // right before opening) that would otherwise close the menu immediately.
    const triggerTop = () => rootRef.current?.getBoundingClientRect().top ?? 0
    const openedAt = triggerTop()
    const onScroll = (event) => {
      if (menuRef.current?.contains(event.target)) return
      if (Math.abs(triggerTop() - openedAt) > 2) close()
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', close)
    }
  }, [open, close])

  useEffect(() => {
    if (!open || !menuRef.current) return
    const items = [...menuRef.current.querySelectorAll(ITEM_SELECTOR)]
    ;(items.find((item) => item.getAttribute('aria-checked') === 'true') ?? items[0])?.focus()
  }, [open])

  function closeAndFocusTrigger() {
    setOpen(false)
    rootRef.current?.querySelector('[aria-haspopup]')?.focus()
  }

  function onMenuKeyDown(event) {
    const items = [...menuRef.current.querySelectorAll(ITEM_SELECTOR)]
    const index = items.indexOf(document.activeElement)
    const focusAt = (i) => items[(i + items.length) % items.length]?.focus()

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        focusAt(index + 1)
        break
      case 'ArrowUp':
        event.preventDefault()
        focusAt(index - 1)
        break
      case 'Home':
        event.preventDefault()
        focusAt(0)
        break
      case 'End':
        event.preventDefault()
        focusAt(items.length - 1)
        break
      case 'Escape':
        // Keep Escape from also closing a surrounding dialog.
        event.preventDefault()
        event.stopPropagation()
        closeAndFocusTrigger()
        break
      case 'Tab':
        setOpen(false)
        break
    }
  }

  const triggerProps = {
    onClick: () => setOpen((value) => !value),
    'aria-haspopup': 'menu',
    'aria-expanded': open,
  }

  return { open, rootRef, menuRef, triggerProps, onMenuKeyDown, closeAndFocusTrigger }
}
