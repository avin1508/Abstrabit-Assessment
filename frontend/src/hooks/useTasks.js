import { useCallback, useEffect, useState } from 'react'
import { listTasks, setTaskStatus } from '../services/taskService.js'

// Tasks for one workspace, plus the complete/reopen toggle.
export default function useTasks(workspaceId) {
  const [state, setState] = useState({ status: 'loading', tasks: [], error: null })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    listTasks(workspaceId)
      .then((tasks) => !cancelled && setState({ status: 'success', tasks, error: null }))
      .catch((error) => !cancelled && setState((current) => ({ ...current, status: 'error', error })))
    return () => {
      cancelled = true
    }
  }, [workspaceId, reloadKey])

  const reload = useCallback(() => {
    setState((current) => ({ ...current, status: 'loading', error: null }))
    setReloadKey((key) => key + 1)
  }, [])

  async function toggle(taskId, status) {
    const task = await setTaskStatus(workspaceId, taskId, status)
    setState((current) => ({ ...current, tasks: current.tasks.map((existing) => (existing.id === taskId ? task : existing)) }))
    return task
  }

  return { ...state, reload, toggle }
}
