import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import {
  createConversation,
  fetchConversation,
  fetchConversations,
  resetChat,
  retryMessage,
  sendMessage,
} from '../store/slices/conversationSlice.js'

export default function useChat({ workspace }) {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeId = searchParams.get('conversation')
  const workspaceId = workspace.id

  const { conversations: loaded, listStatus, thread, sending, retrying } = useSelector((state) => state.conversation)
  // Guard against a render that still holds the previous workspace's list (before the reset below).
  const conversations = loaded.filter((conversation) => conversation.workspaceId === workspaceId)
  const [notice, setNotice] = useState(null)
  const [creating, setCreating] = useState(false)
  const autoSelected = useRef(false)
  // setSearchParams changes identity with the URL; the workspace effect below must not re-run
  // (and reset chat) on every navigation, so it reads the latest one through a ref.
  const setParamsRef = useRef(setSearchParams)
  useEffect(() => {
    setParamsRef.current = setSearchParams
  })
  const busy = sending || retrying || creating

  // Reset chat on workspace change. Without ?conversation, open the most recent one from this
  // request's result, not whatever list is still in the store.
  useEffect(() => {
    dispatch(resetChat())
    const request = dispatch(fetchConversations({ workspaceId }))
    request
      .unwrap()
      .then((items) => {
        if (autoSelected.current) return
        autoSelected.current = true
        if (items.length) {
          setParamsRef.current((params) => (params.get('conversation') ? params : { conversation: items[0].id }), { replace: true })
        }
      })
      .catch(() => {})
    return () => {
      request.abort()
      dispatch(resetChat())
    }
  }, [workspaceId, dispatch])

  useEffect(() => {
    if (!activeId || thread.conversationId === activeId) return
    dispatch(fetchConversation({ workspaceId, conversationId: activeId }))
      .unwrap()
      .catch(() => {
        setNotice(`That conversation isn’t available in ${workspace.name}. It may belong to a different workspace.`)
        setSearchParams({}, { replace: true })
      })
  }, [activeId, thread.conversationId, workspaceId, workspace.name, dispatch, setSearchParams])

  async function startConversation() {
    setCreating(true)
    try {
      const conversation = await dispatch(createConversation({ workspaceId })).unwrap()
      setSearchParams({ conversation: conversation.id })
      return conversation.id
    } finally {
      setCreating(false)
    }
  }

  async function send(text) {
    const content = text.trim()
    if (!content || busy) return false
    setNotice(null)
    try {
      const conversationId = activeId ?? (await startConversation())
      await dispatch(sendMessage({ workspaceId, conversationId, content })).unwrap()
      return true
    } catch (error) {
      // The backend saved the question and an error answer: the thread shows it with "Try again",
      // so the question counts as sent (the input clears).
      if (error?.messages) return true
      setNotice(error?.message ?? 'Couldn’t send your message. Try again.')
      return false
    } finally {
      refreshList()
    }
  }

  function refreshList() {
    dispatch(fetchConversations({ workspaceId }))
  }

  async function retry() {
    if (busy || !activeId) return false
    setNotice(null)
    try {
      await dispatch(retryMessage({ workspaceId, conversationId: activeId })).unwrap()
      return true
    } catch (error) {
      if (!error?.messages) setNotice(error?.message ?? 'Couldn’t retry. Try again.')
      return false
    } finally {
      refreshList()
    }
  }

  const selectConversation = (conversationId) => {
    setNotice(null)
    setSearchParams({ conversation: conversationId })
  }

  // Don't create another conversation while the open one is still empty.
  async function newConversation() {
    setNotice(null)
    if (busy || (activeId && thread.conversationId === activeId && thread.messages.length === 0)) return
    try {
      await startConversation()
    } catch (error) {
      setNotice(error?.message ?? 'Couldn’t start a new conversation.')
    }
  }

  const threadLoaded = activeId && thread.conversationId === activeId && thread.status === 'ready'
  let view
  if (!activeId) {
    view = { status: listStatus === 'ready' || listStatus === 'error' ? 'new' : 'loading', conversationId: null, messages: [] }
  } else if (!threadLoaded) {
    view = { status: 'loading', conversationId: activeId, messages: [] }
  } else {
    view = { status: thread.messages.length ? 'ready' : 'new', conversationId: activeId, messages: thread.messages }
  }

  return {
    conversations: { status: listStatus === 'idle' ? 'loading' : listStatus, items: conversations },
    activeId,
    activeConversation: conversations.find((conversation) => conversation.id === activeId) ?? null,
    thread: view,
    sending: busy,
    notice,
    dismissNotice: () => setNotice(null),
    send,
    retry,
    selectConversation,
    newConversation,
  }
}
