import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchToolCalls, TOOL_CALL_PAGE_SIZE } from '../store/slices/toolCallSlice.js'

export default function useToolLogs(workspaceId) {
  const dispatch = useDispatch()
  const state = useSelector((root) => root.toolCall)

  useEffect(() => {
    dispatch(fetchToolCalls({ workspaceId, page: 1 }))
  }, [workspaceId, dispatch])

  // Until this workspace's log arrives, show nothing rather than another workspace's calls.
  const current = state.workspaceId === workspaceId
  const runs = current ? state.items : []
  const status = current && state.error ? 'error' : !current || state.loading ? 'loading' : 'success'
  const pagination = current ? state.pagination : { page: 1, limit: TOOL_CALL_PAGE_SIZE, total: 0, totalPages: 0 }

  const setPage = useCallback((page) => dispatch(fetchToolCalls({ workspaceId, page })), [dispatch, workspaceId])
  const reload = useCallback(() => dispatch(fetchToolCalls({ workspaceId, page: pagination.page })), [dispatch, workspaceId, pagination.page])

  return { runs, status, error: current && state.error ? { message: state.error } : null, pagination, setPage, reload }
}
