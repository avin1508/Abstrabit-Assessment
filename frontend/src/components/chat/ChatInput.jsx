import { useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '../../utils/cn.js'
import { focusRing } from '../../utils/styles.js'
import Kbd from '../ui/Kbd.jsx'
import LoadingSpinner from '../ui/LoadingSpinner.jsx'

const MAX_HEIGHT = 200

/*
 * Message composer. Enter sends, Shift+Enter adds a line.
 * `onSend(text)` may return a promise resolving to false to keep the draft (e.g. on failure).
 */
export default function ChatInput({ onSend, busy = false, disabled = false, placeholder, footnote }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)
  const canSend = value.trim().length > 0 && !busy && !disabled

  function resize() {
    const element = textareaRef.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, MAX_HEIGHT)}px`
  }

  async function submit() {
    if (!canSend) return
    const text = value
    setValue('')
    requestAnimationFrame(resize)
    const ok = await onSend(text)
    if (ok === false) setValue(text)
  }

  function onKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <div>
      <div
        className={cn(
          'rounded-xl border bg-surface shadow-xs transition-[border-color,box-shadow]',
          disabled ? 'border-line bg-surface-muted' : 'border-line-strong focus-within:border-brand-500 focus-within:ring-3 focus-within:ring-brand-500/15',
        )}
      >
        <label htmlFor="chat-input" className="sr-only">
          Message
        </label>
        <textarea
          id="chat-input"
          ref={textareaRef}
          rows={1}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => {
            setValue(event.target.value)
            resize()
          }}
          onKeyDown={onKeyDown}
          className="block max-h-[200px] w-full resize-none bg-transparent px-3.5 pt-3 pb-1 text-sm leading-relaxed text-fg outline-none placeholder:text-fg-subtle disabled:cursor-not-allowed"
        />
        <div className="flex items-center gap-2 pr-2 pb-2 pl-3.5">
          <p className="hidden min-w-0 flex-1 items-center gap-1 truncate text-[11px] text-fg-subtle sm:flex" aria-live="polite">
            {busy ? (
              'Assistant is responding…'
            ) : (
              <>
                <Kbd>Enter</Kbd> to send · <Kbd>Shift</Kbd>+<Kbd>Enter</Kbd> new line
              </>
            )}
          </p>
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            aria-label={busy ? 'Sending' : 'Send message'}
            className={cn(
              'ml-auto flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
              focusRing,
              canSend ? 'bg-brand-600 text-white shadow-xs hover:bg-brand-700' : 'bg-surface-muted text-fg-subtle',
            )}
          >
            {busy ? <LoadingSpinner size="xs" label="Sending" /> : <ArrowUp className="size-4" aria-hidden />}
          </button>
        </div>
      </div>
      {footnote && <p className="mt-1.5 text-center text-[11px] text-fg-subtle">{footnote}</p>}
    </div>
  )
}
