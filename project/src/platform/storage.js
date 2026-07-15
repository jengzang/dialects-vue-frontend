function createUnavailableStorage() {
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }
}

function getGlobals(options = {}) {
  return options.globals ?? (typeof window === 'undefined' ? {} : window)
}

function isStorageBridgeCandidate(candidate) {
  return Boolean(
    candidate &&
    typeof candidate.getItem === 'function' &&
    typeof candidate.setItem === 'function' &&
    typeof candidate.removeItem === 'function'
  )
}

export function getNativeStorageBridge(storageType = 'local', options = {}) {
  const globals = getGlobals(options)
  const rootBridge = globals.DialectsNativeStorage || globals.DialectsNativeBridge?.storage
  const typedBridge = rootBridge?.[storageType]

  if (isStorageBridgeCandidate(typedBridge)) {
    return typedBridge
  }

  if (isStorageBridgeCandidate(rootBridge)) {
    return rootBridge
  }

  return null
}

function createNativeStorage(storageType, bridge) {
  return {
    getItem(key) {
      return bridge.getItem(key, storageType)
    },
    setItem(key, value) {
      bridge.setItem(key, String(value), storageType)
    },
    removeItem(key) {
      bridge.removeItem(key, storageType)
    },
  }
}

function getWebStorage(storageType, options = {}) {
  const globals = getGlobals(options)

  if (!globals) {
    return createUnavailableStorage()
  }

  try {
    return (storageType === 'session' ? globals.sessionStorage : globals.localStorage) || createUnavailableStorage()
  } catch {
    return createUnavailableStorage()
  }
}

export function getPlatformStorage(storageType = 'local', options = {}) {
  const nativeBridge = getNativeStorageBridge(storageType, options)

  if (nativeBridge) {
    return createNativeStorage(storageType, nativeBridge)
  }

  return getWebStorage(storageType, options)
}
