import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { createWorkspace, fetchWorkspaces, setActiveWorkspace } from '../store/slices/workspaceSlice.js'
import useToast from './useToast.js'

export default function useWorkspace() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { workspaces, activeWorkspaceId, loading, loaded, error } = useSelector((state) => state.workspace)
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null

  // Query params point at records in the previous workspace (e.g. ?conversation=…); drop them.
  const clearScopedQuery = useCallback(() => {
    if (location.search) navigate(location.pathname, { replace: true })
  }, [location.pathname, location.search, navigate])

  const switchWorkspace = useCallback(
    (workspaceId) => {
      const target = workspaces.find((workspace) => workspace.id === workspaceId)
      if (!target || workspaceId === activeWorkspaceId) return
      clearScopedQuery()
      dispatch(setActiveWorkspace(workspaceId))
      toast({ tone: 'success', title: `Switched to ${target.name}` })
    },
    [workspaces, activeWorkspaceId, clearScopedQuery, dispatch, toast],
  )

  const addWorkspace = useCallback(
    async (name) => {
      const workspace = await dispatch(createWorkspace({ name })).unwrap()
      clearScopedQuery()
      return workspace
    },
    [clearScopedQuery, dispatch],
  )

  const reload = useCallback(() => dispatch(fetchWorkspaces()), [dispatch])

  return { workspaces, activeWorkspace, activeWorkspaceId, loading, loaded, error, switchWorkspace, addWorkspace, reload }
}
