import { useMemo, useState } from 'react'
import { MessageSquareDashed, Plus, Search, ShieldCheck } from 'lucide-react'
import Button from '../ui/Button.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import Input from '../ui/Input.jsx'
import Skeleton from '../ui/Skeleton.jsx'
import ConversationItem from './ConversationItem.jsx'

/*
 * Conversation history for the active workspace only.
 * `embedded` hides the title row (used inside the mobile drawer, which has its own title).
 */
export default function ConversationSidebar({ workspace, conversations, activeId, onSelect, onNew, embedded = false }) {
  const [query, setQuery] = useState('')
  const loading = conversations.status === 'loading'

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return conversations.items
    return conversations.items.filter(
      (conversation) =>
        conversation.title.toLowerCase().includes(needle) || conversation.lastMessage?.text?.toLowerCase().includes(needle),
    )
  }, [conversations.items, query])

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <div className="space-y-2.5 border-b border-line p-3">
        {!embedded && (
          <div className="flex items-center justify-between px-1">
            <p className="font-mono text-[10px] font-medium tracking-widest text-fg-subtle uppercase">Conversations</p>
          </div>
        )}
        <Button variant="primary" leftIcon={Plus} fullWidth onClick={onNew}>
          New conversation
        </Button>
        <Input
          aria-label="Search conversations"
          placeholder="Search conversations…"
          size="sm"
          leftIcon={Search}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="space-y-3 p-2" aria-hidden>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
            ))}
          </div>
        ) : conversations.items.length === 0 ? (
          <EmptyState
            icon={MessageSquareDashed}
            title="No conversations yet"
            description={`Questions you ask in ${workspace.name} will appear here.`}
            className="px-3 py-10"
          />
        ) : visible.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-fg-subtle">No conversations match “{query}”.</p>
        ) : (
          <ul className="space-y-0.5">
            {visible.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                active={conversation.id === activeId}
                onSelect={onSelect}
              />
            ))}
          </ul>
        )}
      </div>

      <p className="flex items-start gap-1.5 border-t border-line px-4 py-2.5 text-[11px] leading-snug text-fg-subtle">
        <ShieldCheck className="mt-px size-3.5 shrink-0 text-emerald-600" aria-hidden />
        Only conversations in {workspace.name} are shown.
      </p>
    </div>
  )
}
