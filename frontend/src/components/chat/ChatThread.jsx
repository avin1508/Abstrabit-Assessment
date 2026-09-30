import { useEffect, useRef } from 'react'
import ToolActivity from '../tools/ToolActivity.jsx'
import AssistantMessage from './AssistantMessage.jsx'
import UserMessage from './UserMessage.jsx'

/*
 * Renders a conversation: user question → tool activity (if any) → assistant answer.
 * Tool blocks are indented under the assistant column so they read as actions, not replies.
 * Scrolls to the newest content whenever the thread changes.
 */
export default function ChatThread({ messages, workspaceName, selection, onSelectCitation, onShowSources, onRetry, busy }) {
  const endRef = useRef(null)
  const last = messages[messages.length - 1]
  const lastKey = last ? `${last.id}:${last.state ?? ''}:${last.phase ?? ''}:${last.run?.status ?? ''}` : ''

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [messages.length, lastKey])

  return (
    <div className="space-y-6">
      {messages.map((message) => {
        if (message.role === 'user') return <UserMessage key={message.id} message={message} />
        if (message.role === 'tool') {
          return (
            <div key={message.id} className="pl-9 sm:pl-10">
              <ToolActivity run={message.run} />
            </div>
          )
        }
        return (
          <AssistantMessage
            key={message.id}
            message={message}
            workspaceName={workspaceName}
            selected={selection?.messageId === message.id}
            activeCitation={selection?.messageId === message.id ? selection.citation : null}
            onSelectCitation={onSelectCitation}
            onShowSources={onShowSources}
            onRetry={onRetry}
            retryDisabled={busy}
          />
        )
      })}
      <div ref={endRef} />
    </div>
  )
}
