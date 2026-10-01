import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTasks, TASK_PAGE_SIZE, updateTaskStatus } from '../store/slices/taskSlice.js'

/*
 * The active workspace's tasks, one backend page at a time, from taskSlice, plus the
 * complete/reopen toggle. status: loading | error | success
 */
export default function useTasks(workspaceId) {
  const dispatch = useDispatch()
  const state = useSelector((root) => root.task)

  useEffect(() => {
    dispatch(fetchTasks({ workspaceId, page: 1 }))
  }, [workspaceId, dispatch])

  // Until this workspace's list arrives, show nothing rather than another workspace's tasks.
  const current = state.workspaceId === workspaceId
  const tasks = current ? state.items : []
  const status = current && state.error ? 'error' : !current || state.loading ? 'loading' : 'success'
  const pagination = current ? state.pagination : { page: 1, limit: TASK_PAGE_SIZE, total: 0, totalPages: 0 }

  const setPage = useCallback((page) => dispatch(fetchTasks({ workspaceId, page })), [dispatch, workspaceId])
  const reload = useCallback(() => dispatch(fetchTasks({ workspaceId, page: pagination.page })), [dispatch, workspaceId, pagination.page])

  // Resolves with the updated task or throws { message }. Ignored while that task is updating.
  const toggle = (taskId, nextStatus) => dispatch(updateTaskStatus({ workspaceId, taskId, status: nextStatus })).unwrap()

  return {
    tasks,
    status,
    error: current && state.error ? { message: state.error } : null,
    pagination,
    setPage,
    reload,
    toggle,
  }
}
