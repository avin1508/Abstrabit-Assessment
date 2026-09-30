import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { listWorkspaces, selectWorkspace } from '../services/workspaceService.js'
import { readStorage, writeStorage } from '../utils/storage.js'
import useToast from '../hooks/useToast.js'
import { WorkspaceContext } from './workspaceContext.js'

const STORAGE_KEY = 'abstrabit.activeWorkspaceId'

/*
 * Owns the workspace list and the active workspace for the signed-in app.
 * Everything workspace-scoped (documents, chat, tasks, tool logs) reads `activeWorkspace.id`
 * from here and must re-fetch when it changes.
 */
export default function WorkspaceProvider({ children }) {
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [workspaces, setWorkspaces] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [activeId, setActiveId] = useState(() => readStorage(STORAGE_KEY))
  const [switchingTo, setSwitchingTo] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    listWorkspaces()
      .then((list) => {
        if (cancelled) return
        setWorkspaces(list)
        setStatus('ready')
      })
      .catch(() => !cancelled && setStatus('error'))
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const reload = useCallback(() => {
    setStatus('loading')
    setReloadKey((key) => key + 1)
  }, [])

  // Fall back to the first workspace if the stored id is missing or no longer accessible.
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeId) ?? workspaces[0] ?? null

  const switchWorkspace = useCallback(
    async (workspaceId) => {
      if (switchingTo || workspaceId === activeWorkspace?.id) return
      const target = workspaces.find((workspace) => workspace.id === workspaceId)
      if (!target) return

      setSwitchingTo(target)
      try {
        await selectWorkspace(workspaceId)
        // Query params point at records in the old workspace (e.g. ?conversation=…); drop them.
        if (location.search) navigate(location.pathname, { replace: true })
        setActiveId(workspaceId)
        writeStorage(STORAGE_KEY, workspaceId)
        toast({ tone: 'success', title: `Switched to ${target.name}` })
      } catch (error) {
        toast({ tone: 'danger', title: 'Couldn’t switch workspace', description: error.message })
      } finally {
        setSwitchingTo(null)
      }
    },
    [activeWorkspace?.id, switchingTo, toast, workspaces, location.pathname, location.search, navigate],
  )

  const value = useMemo(
    () => ({ workspaces, activeWorkspace, status, switchingTo, switchWorkspace, reload }),
    [workspaces, activeWorkspace, status, switchingTo, switchWorkspace, reload],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}
