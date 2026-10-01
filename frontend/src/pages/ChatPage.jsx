import { useState } from 'react'
import { useSelector } from 'react-redux'
import useAuth from '../hooks/useAuth.js'
import useChat from '../hooks/useChat.js'
import useMediaQuery from '../hooks/useMediaQuery.js'
import useWorkspace from '../hooks/useWorkspace.js'
import ChatEmptyState from '../components/chat/ChatEmptyState.jsx'
import ChatHeader from '../components/chat/ChatHeader.jsx'
import ChatInput from '../components/chat/ChatInput.jsx'
import ChatThread from '../components/chat/ChatThread.jsx'
import ConversationSidebar from '../components/chat/ConversationSidebar.jsx'
import SourcePreview from '../components/chat/SourcePreview.jsx'
import SourcesPanel from '../components/chat/SourcesPanel.jsx'
import { Alert, Drawer, Skeleton } from '../components/ui/index.js'

const WIDE = '(min-width: 1280px)'
const PHONE = '(max-width: 639px)'

function ThreadSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-2/3 rounded-lg" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="size-6 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// The latest answer that has evidence to show — or an honest "no evidence" state.
function findLatestSourced(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (message.role === 'assistant' && (message.citations?.length || message.state === 'unknown')) return message
  }
  return null
}

export default function ChatPage() {
  const { user } = useAuth()
  const { activeWorkspace: workspace } = useWorkspace()
  const isWide = useMediaQuery(WIDE)
  const isPhone = useMediaQuery(PHONE)

  const chat = useChat({ workspace, userName: user.name })
  // Indexed documents in this workspace (null until the document list for it has loaded).
  const indexedCount = useSelector((state) =>
    state.document.workspaceId === workspace.id ? state.document.statusCounts.indexed : null,
  )

  const [historyOpen, setHistoryOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(true) // ≥ xl side panel
  const [sourcesDrawerOpen, setSourcesDrawerOpen] = useState(false) // < xl
  const [selection, setSelection] = useState(null) // { messageId, citation }
  const [previewOpen, setPreviewOpen] = useState(false)

  // Only messages loaded for the active workspace are candidates — never another workspace's.
  const messages = chat.thread.messages.filter((message) => message.workspaceId === workspace.id)

  // Sources follow the answer the user picked, else the latest answer with (or without) evidence.
  const selectedMessage = messages.find((message) => message.id === selection?.messageId) ?? findLatestSourced(messages)
  const activeSelection = selectedMessage && {
    messageId: selectedMessage.id,
    citation: selection?.messageId === selectedMessage.id ? selection.citation : null,
  }


  // [n] / source chip / source card → highlight that source and open its preview.
  function openCitation(messageId, citation) {
    setSelection({ messageId, citation })
    setPreviewOpen(true)
    if (isWide) setPanelOpen(true)
  }

  // A new question hands the Sources panel back to the latest answer, so no stale evidence lingers.
  function send(text) {
    setSelection(null)
    setPreviewOpen(false)
    return chat.send(text)
  }

  // "View all sources" → show the answer's sources without a preview.
  function showSources(messageId) {
    setSelection({ messageId, citation: null })
    if (isWide) setPanelOpen(true)
    else setSourcesDrawerOpen(true)
  }

  function toggleSources() {
    if (isWide) setPanelOpen((open) => !open)
    else setSourcesDrawerOpen(true)
  }

  const sidebarProps = {
    workspace,
    conversations: chat.conversations,
    activeId: chat.activeId,
    onSelect: (id) => {
      chat.selectConversation(id)
      setHistoryOpen(false)
    },
    onNew: () => {
      chat.newConversation()
      setHistoryOpen(false)
    },
  }

  const sourcesProps = {
    message: selectedMessage,
    workspace,
    indexedCount,
    activeCitation: activeSelection?.citation,
    onSelectCitation: openCitation,
  }

  return (
    <div className="flex h-full min-h-0">
      <aside className="hidden w-72 shrink-0 border-r border-line md:block" aria-label="Conversation history">
        <ConversationSidebar {...sidebarProps} />
      </aside>

      <section className="flex min-w-0 flex-1 flex-col" aria-label="Chat">
        <ChatHeader
          workspace={workspace}
          conversationTitle={chat.activeConversation?.title}
          sourcesOpen={isWide ? panelOpen : sourcesDrawerOpen}
          onOpenHistory={() => setHistoryOpen(true)}
          onToggleSources={toggleSources}
          onNew={chat.newConversation}
        />

        <div className="relative min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
            {chat.notice && (
              <Alert tone="warning" onDismiss={chat.dismissNotice} className="mb-6">
                {chat.notice}
              </Alert>
            )}
            {chat.thread.status === 'loading' ? (
              <ThreadSkeleton />
            ) : chat.thread.status === 'new' ? (
              <ChatEmptyState
                workspace={workspace}
                indexedCount={indexedCount ?? 0}
              />
            ) : (
              <ChatThread
                messages={messages}
                workspaceName={workspace.name}
                selection={activeSelection}
                onSelectCitation={openCitation}
                onShowSources={showSources}
                onRetry={chat.retry}
                busy={chat.sending}
              />
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-line bg-surface px-4 py-3 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <ChatInput
              onSend={send}
              busy={chat.sending}
              disabled={chat.thread.status === 'loading'}
              placeholder={`Ask about documents in ${workspace.name}…`}
              footnote={`Answers use only ${workspace.name} documents and can be incomplete — check the sources.`}
            />
          </div>
        </div>
      </section>

      {isWide && panelOpen && (
        <aside className="w-80 shrink-0 border-l border-line" aria-label="Sources">
          <SourcesPanel {...sourcesProps} />
        </aside>
      )}

      <Drawer
        open={!isWide && sourcesDrawerOpen}
        onClose={() => setSourcesDrawerOpen(false)}
        title="Sources"
        description={`Evidence from ${workspace.name} for the selected answer`}
        size="md"
      >
        <SourcesPanel {...sourcesProps} embedded />
      </Drawer>

      <Drawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Conversations"
        description={`In ${workspace.name}`}
        size="md"
        side="left"
      >
        <ConversationSidebar {...sidebarProps} embedded />
      </Drawer>

      {previewOpen && (
        <SourcePreview
          message={selectedMessage}
          citationIndex={activeSelection?.citation}
          workspace={workspace}
          onSelectCitation={openCitation}
          onClose={() => setPreviewOpen(false)}
          sheet={isPhone}
        />
      )}
    </div>
  )
}
