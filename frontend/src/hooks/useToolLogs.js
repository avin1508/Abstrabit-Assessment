import { useCallback, useEffect, useState } from 'react'
import { listToolRuns } from '../services/toolService.js'

const POLL_MS = 1500
const IN_FLIGHT = new Set(['pending', 'running'])

// Tool runs for one workspace. Re-fetches quietly while any run is pending/running.
export default function useToolLogs(workspaceId) {
  const [state, setState] = useState({ status: 'loading', runs: [], error: null })
  const [reloadKey, setReloadKey] = useState(0)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    listToolRuns(workspaceId)
      .then((runs) => !cancelled && setState({ status: 'success', runs, error: null }))
      .catch((error) => !cancelled && setState((current) => ({ ...current, status: 'error', error })))
    return () => {
      cancelled = true
    }
  }, [workspaceId, reloadKey, tick])

  const hasInFlight = state.runs.some((run) => IN_FLIGHT.has(run.status))
  useEffect(() => {
    if (!hasInFlight) return
    const timer = setInterval(() => setTick((value) => value + 1), POLL_MS)
    return () => clearInterval(timer)
  }, [hasInFlight])

  const reload = useCallback(() => {
    setState((current) => ({ ...current, status: 'loading', error: null }))
    setReloadKey((key) => key + 1)
  }, [])

  return { ...state, reload }
}
