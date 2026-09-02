function getSessionStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.sessionStorage
}

export function readSessionCache(key) {
  const storage = getSessionStorage()
  if (!storage) {
    return null
  }

  const cached = storage.getItem(key)
  if (!cached) {
    return null
  }

  try {
    return JSON.parse(cached)
  } catch {
    storage.removeItem(key)
    return null
  }
}

export function writeSessionCache(key, value) {
  const storage = getSessionStorage()
  if (!storage) {
    return
  }

  storage.setItem(key, JSON.stringify(value))
}
