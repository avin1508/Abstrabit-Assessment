import { useCallback, useEffect, useState } from 'react'

/*
 * Runs an async loader and tracks its result. Pass a memoized loader (useCallback);
 * it re-runs whenever the loader identity changes, and on reload().
 * Previous data is kept while reloading so the UI can refresh in place.
 */
export default function useAsyncData(loader) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    loader()
      .then((data) => !cancelled && setState({ status: 'success', data, error: null }))
      .catch((error) => !cancelled && setState((current) => ({ ...current, status: 'error', error })))
    return () => {
      cancelled = true
    }
  }, [loader, reloadKey])

  const reload = useCallback(() => {
    setState((current) => ({ ...current, status: 'loading', error: null }))
    setReloadKey((key) => key + 1)
  }, [])

  return { ...state, reload }
}
