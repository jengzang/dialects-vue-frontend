function getLocalStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

export function readLocalCache(key, dbVersion) {
  const storage = getLocalStorage()
  if (!storage) {
    return null
  }

  const raw = storage.getItem(key)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.dbVersion !== dbVersion) {
      return null
    }

    return parsed
  } catch (error) {
    console.warn(`讀取本地緩存失敗 (${key}):`, error)
    return null
  }
}

export function writeLocalCache(key, payload, dbVersion) {
  const storage = getLocalStorage()
  if (!storage) {
    return
  }

  try {
    storage.setItem(
      key,
      JSON.stringify({ ...payload, dbVersion, cachedAt: Date.now() })
    )
  } catch (error) {
    console.warn(`寫入本地緩存失敗 (${key}):`, error)
  }
}
