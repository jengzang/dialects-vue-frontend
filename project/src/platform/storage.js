function createUnavailableStorage() {
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }
}

function getWebStorage(storageType) {
  if (typeof window === 'undefined') {
    return createUnavailableStorage()
  }

  try {
    return storageType === 'session' ? window.sessionStorage : window.localStorage
  } catch {
    return createUnavailableStorage()
  }
}

export function getPlatformStorage(storageType = 'local') {
  return getWebStorage(storageType)
}
