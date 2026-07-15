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

const capacitorPreferenceCaches = {
  local: new Map(),
  session: new Map(),
}
let capacitorPreferencesBridge = null

function toPreferenceKey(storageType, key) {
  return `${storageType}:${key}`
}

function fromPreferenceKey(key) {
  const separatorIndex = key.indexOf(':')

  if (separatorIndex === -1) {
    return null
  }

  const storageType = key.slice(0, separatorIndex)
  if (storageType !== 'local' && storageType !== 'session') {
    return null
  }

  return {
    storageType,
    key: key.slice(separatorIndex + 1),
  }
}

function createCapacitorPreferencesStorage(storageType) {
  const cache = capacitorPreferenceCaches[storageType]

  return {
    getItem(key) {
      return cache.has(key) ? cache.get(key) : null
    },
    setItem(key, value) {
      const nextValue = String(value)
      cache.set(key, nextValue)
      capacitorPreferencesBridge?.set({
        key: toPreferenceKey(storageType, key),
        value: nextValue,
      })
    },
    removeItem(key) {
      cache.delete(key)
      capacitorPreferencesBridge?.remove({
        key: toPreferenceKey(storageType, key),
      })
    },
  }
}

export async function registerCapacitorPreferencesStorage(preferences) {
  if (!preferences) {
    return
  }

  capacitorPreferencesBridge = preferences
  capacitorPreferenceCaches.local.clear()
  capacitorPreferenceCaches.session.clear()

  const { keys = [] } = await preferences.keys()
  await Promise.all(keys.map(async (key) => {
    const parsed = fromPreferenceKey(key)

    if (!parsed) {
      return
    }

    const { value } = await preferences.get({ key })
    if (value !== null && value !== undefined) {
      capacitorPreferenceCaches[parsed.storageType].set(parsed.key, value)
    }
  }))
}

export function resetCapacitorPreferencesStorageForTests() {
  capacitorPreferencesBridge = null
  capacitorPreferenceCaches.local.clear()
  capacitorPreferenceCaches.session.clear()
}

export function hasCapacitorPreferencesStorage() {
  return Boolean(capacitorPreferencesBridge)
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

  if (capacitorPreferencesBridge) {
    return createCapacitorPreferencesStorage(storageType)
  }

  return getWebStorage(storageType, options)
}
