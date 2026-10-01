import { useEffect, useEffectEvent } from 'react'

// Open dialogs, innermost last. Only the top dialog reacts to Escape/Tab, so a confirm
// dialog opened from a drawer closes on its own.
const dialogStack = []

const FOCUSABLE =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

export default function useDialog(open, onClose, panelRef) {
  const handleClose = useEffectEvent(() => onClose())

  useEffect(() => {
    if (!open) return

    const token = {}
    dialogStack.push(token)
    const isTop = () => dialogStack[dialogStack.length - 1] === token

    function onKeyDown(event) {
      if (!isTop()) return
      if (event.key === 'Escape') {
        event.stopPropagation()
        handleClose()
      } else if (event.key === 'Tab' && panelRef.current) {
        const focusable = [...panelRef.current.querySelectorAll(FOCUSABLE)]
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    if (!panelRef.current?.contains(document.activeElement)) panelRef.current?.focus()

    return () => {
      dialogStack.splice(dialogStack.indexOf(token), 1)
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus?.()
    }
  }, [open, panelRef])
}
