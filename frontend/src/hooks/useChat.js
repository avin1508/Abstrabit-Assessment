import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getConversation, listConversations, retryMessage, sendMessage } from '../services/chatService.js'

const POLL_MS = 1500
const NEW_THREAD = { status: 'new', conversationId: null, messages: [] }
const LOADING_THREAD = { status: 'loading', conversationId: null, messages: [] }

/*
 * Chat state for the active workspace.
 * - The open conversation lives in the URL (?conversation=<id>); no param = new conversation.
 * - Conversations from other workspaces are rejected by the service and bounce back to a new
 *   conversation with a notice, so ids never leak across workspaces.
 * - Streaming events from the service update the thread as the mock response progresses.
 */
export default function useChat({ workspace, userName }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeId = searchParams.get('conversation')

  const [list, setList] = useState({ status: 'loading', items: [] })
  const [thread, setThread] = useState({ status: 'ready', conversationId: null, messages: [] })
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState(null)
  const threadIdRef = useRef(null)

  const refreshList = useCallback(async () => {
    try {
      const items = await listConversations(workspace.id)
      setList({ status: 'ready', items })
    } catch {
      setList((current) => ({ ...current, status: 'error' }))
    }
  }, [workspace.id])

  useEffect(() => {
    let cancelled = false
    listConversations(workspace.id)
      .then((items) => !cancelled && setList({ status: 'ready', items }))
      .catch(() => !cancelled && setList((current) => ({ ...current, status: 'error' })))
    return () => {
      cancelled = true
    }
  }, [workspace.id])

  const loadThread = useCallback(
    async (conversationId, { silent = false } = {}) => {
      try {
        const { messages } = await getConversation(workspace.id, conversationId)
        if (threadIdRef.current === conversationId) setThread({ status: 'ready', conversationId, messages })
      } catch {
        if (silent || threadIdRef.current !== conversationId) return
        threadIdRef.current = null
        setNotice(`That conversation isn’t available in ${workspace.name}. It may belong to a different workspace.`)
        setSearchParams({}, { replace: true })
      }
    },
    [workspace.id, workspace.name, setSearchParams],
  )

  useEffect(() => {
    if (!activeId) {
      threadIdRef.current = null
      return
    }
    if (activeId === threadIdRef.current) return
    threadIdRef.current = activeId
    loadThread(activeId)
  }, [activeId, loadThread])

  // Keep polling while a tool call in view is still running (e.g. seeded in-flight calls).
  const hasRunningTool = thread.messages.some((message) => message.role === 'tool' && message.run?.status === 'running')
  useEffect(() => {
    if (!hasRunningTool || sending || !activeId) return
    const timer = setInterval(() => {
      loadThread(activeId, { silent: true })
      refreshList()
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [hasRunningTool, sending, activeId, loadThread, refreshList])

  const handleEvent = useCallback(
    (event) => {
      if (event.type === 'conversation') {
        threadIdRef.current = event.conversation.id
        setThread({ status: 'ready', conversationId: event.conversation.id, messages: [] })
        setList((current) => ({ ...current, items: [event.conversation, ...current.items] }))
        setSearchParams({ conversation: event.conversation.id })
      } else if (event.type === 'messages' && event.conversationId === threadIdRef.current) {
        setThread({ status: 'ready', conversationId: event.conversationId, messages: event.messages })
      }
    },
    [setSearchParams],
  )

  async function run(task) {
    setSending(true)
    setNotice(null)
    try {
      await task()
      return true
    } catch (error) {
      setNotice(error.message)
      return false
    } finally {
      setSending(false)
      refreshList()
    }
  }

  function send(text) {
    const trimmed = text.trim()
    if (!trimmed || sending) return Promise.resolve(false)
    return run(() =>
      sendMessage(workspace.id, { conversationId: activeId, text: trimmed, author: userName }, { onEvent: handleEvent }),
    )
  }

  function retry(messageId) {
    if (sending || !activeId) return Promise.resolve(false)
    return run(() => retryMessage(workspace.id, activeId, messageId, { onEvent: handleEvent }))
  }

  const selectConversation = (conversationId) => {
    setNotice(null)
    setSearchParams({ conversation: conversationId })
  }

  const newConversation = () => {
    setNotice(null)
    setSearchParams({})
  }

  // What the UI should render for the current URL.
  const view = !activeId ? NEW_THREAD : thread.conversationId === activeId ? thread : LOADING_THREAD
  const activeConversation = list.items.find((conversation) => conversation.id === activeId) ?? null

  return {
    conversations: list,
    activeId,
    activeConversation,
    thread: view,
    sending,
    notice,
    dismissNotice: () => setNotice(null),
    send,
    retry,
    selectConversation,
    newConversation,
  }
}
