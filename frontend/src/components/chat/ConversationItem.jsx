import { Link } from 'react-router-dom'
import { CircleHelp } from 'lucide-react'
import { cn } from '../../utils/cn.js'
import { formatRelativeTime } from '../../utils/format.js'

/*
 * One conversation in a list: title, last activity and a preview of the last message.
 * Pass `onSelect` for the chat sidebar, or `to` to render it as a link (dashboard).
 */
export default function ConversationItem({ conversation, active = false, onSelect, to }) {
  const { title, updatedAt, lastMessage } = conversation
  const ungrounded = lastMessage?.role === 'assistant' && lastMessage.grounded === false

  const className = cn(
    'relative block w-full rounded-md px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-500/40',
    active ? 'bg-surface shadow-xs ring-1 ring-line' : 'hover:bg-surface-muted/70',
  )

  const content = (
    <>
      {active && <span className="absolute inset-y-2.5 left-0 w-0.5 rounded-full bg-brand-600" aria-hidden />}
      <span className="flex items-baseline justify-between gap-2">
        <span className={cn('truncate text-sm text-fg', active ? 'font-semibold' : 'font-medium')}>{title}</span>
        <time dateTime={updatedAt} className="shrink-0 text-[11px] text-fg-subtle">
          {formatRelativeTime(updatedAt)}
        </time>
      </span>
      {lastMessage?.text && (
        <span className="mt-0.5 flex items-center gap-1 text-xs text-fg-subtle">
          {ungrounded && <CircleHelp className="size-3 shrink-0 text-amber-600" aria-label="Not found in documents" />}
          <span className="truncate">
            {lastMessage.role === 'user' ? 'You: ' : ''}
            {lastMessage.text}
          </span>
        </span>
      )}
    </>
  )

  return (
    <li>
      {to ? (
        <Link to={to} className={className}>
          {content}
        </Link>
      ) : (
        <button type="button" onClick={() => onSelect(conversation.id)} aria-current={active ? 'true' : undefined} className={className}>
          {content}
        </button>
      )}
    </li>
  )
}
