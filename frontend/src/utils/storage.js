// localStorage wrappers that never throw (private mode, blocked storage, SSR).

export function readStorage(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Persistence is a convenience; ignore failures.
  }
}
