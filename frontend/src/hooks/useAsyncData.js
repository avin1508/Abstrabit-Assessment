import { useCallback, useEffect, useState } from 'react'

// Pass a memoized loader. Old data stays visible while reloading.
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
