export const TILE_CACHE_PROTOCOL = 'tilecache'
export const TILE_CACHE_DB_NAME = 'dialect-map-tile-cache'
export const TILE_CACHE_STORE_NAME = 'tiles'
export const TILE_CACHE_DB_VERSION = 1

export const DEFAULT_TILE_CACHE_OPTIONS = Object.freeze({
  maxBytes: 50 * 1024 * 1024, // 50 MB
  maxEntries: 1500,
  ttlMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  touchThrottleMs: 60 * 1000, // 1 minute
})

const registeredHandlers = new WeakMap()

function createAbortError(reason) {
  if (reason instanceof Error) return reason
  const error = new Error(typeof reason === 'string' && reason ? reason : 'Tile request aborted')
  error.name = 'AbortError'
  return error
}

function getSafeOrigin(url) {
  try {
    return new URL(url).origin
  } catch {
    return ''
  }
}

export function isCacheableTileUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url)
}

export function wrapTileUrlWithCacheProtocol(url, protocol = TILE_CACHE_PROTOCOL) {
  if (!isCacheableTileUrl(url)) return url
  return `${protocol}://${url}`
}

export function unwrapTileCacheUrl(url, protocol = TILE_CACHE_PROTOCOL) {
  const prefix = `${protocol}://`
  if (typeof url === 'string' && url.startsWith(prefix)) {
    return url.slice(prefix.length)
  }
  return url
}

export function loadImageElement(url, abortController) {
  return new Promise((resolve, reject) => {
    if (typeof Image === 'undefined') {
      reject(new Error('Image API unavailable'))
      return
    }
    if (abortController?.signal?.aborted) {
      reject(createAbortError(abortController.signal.reason))
      return
    }

    const image = new Image()
    image.crossOrigin = 'anonymous'

    const onAbort = () => {
      cleanup()
      image.src = ''
      reject(createAbortError(abortController?.signal?.reason))
    }

    const cleanup = () => {
      image.onload = null
      image.onerror = null
      abortController?.signal?.removeEventListener?.('abort', onAbort)
    }

    abortController?.signal?.addEventListener?.('abort', onAbort, { once: true })

    image.onload = () => {
      cleanup()
      resolve(image)
    }

    image.onerror = () => {
      cleanup()
      if (abortController?.signal?.aborted) return
      reject(new Error(`Failed to load tile image: ${url}`))
    }

    image.src = url
  })
}

export function createIndexedDbTileStore(options = {}) {
  const config = { ...DEFAULT_TILE_CACHE_OPTIONS, ...options }
  const dbName = options.dbName || TILE_CACHE_DB_NAME
  const storeName = options.storeName || TILE_CACHE_STORE_NAME
  const idb = options.indexedDB ?? (typeof indexedDB !== 'undefined' ? indexedDB : null)
  const nowFn = options.now || (() => Date.now())

  let dbPromise = null
  let prunePromise = null

  function openDb() {
    if (!idb) return Promise.resolve(null)
    if (!dbPromise) {
      dbPromise = new Promise((resolve) => {
        try {
          const request = idb.open(dbName, TILE_CACHE_DB_VERSION)
          request.onupgradeneeded = () => {
            const db = request.result
            const store = db.objectStoreNames.contains(storeName)
              ? request.transaction.objectStore(storeName)
              : db.createObjectStore(storeName, { keyPath: 'url' })
            if (!store.indexNames.contains('by_lastAccessed')) {
              store.createIndex('by_lastAccessed', 'lastAccessedAt', { unique: false })
            }
          }
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => {
            dbPromise = null
            resolve(null)
          }
        } catch {
          dbPromise = null
          resolve(null)
        }
      })
    }
    return dbPromise
  }

  async function deleteEntry(url) {
    const db = await openDb()
    if (!db) return
    await new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readwrite')
        tx.objectStore(storeName).delete(url)
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
        tx.onabort = () => resolve()
      } catch {
        resolve()
      }
    })
  }

  async function touchEntry(record, accessedAt) {
    const db = await openDb()
    if (!db) return
    await new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readwrite')
        tx.objectStore(storeName).put({ ...record, lastAccessedAt: accessedAt })
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
        tx.onabort = () => resolve()
      } catch {
        resolve()
      }
    })
  }

  async function get(url) {
    const db = await openDb()
    if (!db) return null

    const record = await new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readonly')
        const request = tx.objectStore(storeName).get(url)
        request.onsuccess = () => resolve(request.result || null)
        request.onerror = () => resolve(null)
      } catch {
        resolve(null)
      }
    })

    if (!record || !(record.data instanceof ArrayBuffer)) return null

    const now = nowFn()
    if (now - record.updatedAt > config.ttlMs) {
      void deleteEntry(url)
      return null
    }

    if (now - record.lastAccessedAt >= config.touchThrottleMs) {
      void touchEntry(record, now)
    }

    return {
      data: record.data.slice(0),
      contentType: record.contentType || '',
    }
  }

  async function prune() {
    if (prunePromise) return prunePromise
    prunePromise = (async () => {
      const db = await openDb()
      if (!db) return

      const now = nowFn()
      const entries = await new Promise((resolve) => {
        try {
          const tx = db.transaction(storeName, 'readonly')
          const index = tx.objectStore(storeName).index('by_lastAccessed')
          const list = []
          const request = index.openCursor()
          request.onsuccess = () => {
            const cursor = request.result
            if (!cursor) {
              resolve(list)
              return
            }
            const { url, size, updatedAt, lastAccessedAt } = cursor.value
            list.push({
              url,
              size: Number(size) || 0,
              updatedAt: Number(updatedAt) || 0,
              lastAccessedAt: Number(lastAccessedAt) || 0,
            })
            cursor.continue()
          }
          request.onerror = () => resolve([])
        } catch {
          resolve([])
        }
      })

      const urlsToDelete = []
      let remainingBytes = 0
      const activeEntries = []

      for (const entry of entries) {
        if (now - entry.updatedAt > config.ttlMs) {
          urlsToDelete.push(entry.url)
        } else {
          remainingBytes += entry.size
          activeEntries.push(entry)
        }
      }

      let remainingCount = activeEntries.length
      for (const entry of activeEntries) {
        if (remainingBytes <= config.maxBytes && remainingCount <= config.maxEntries) {
          break
        }
        urlsToDelete.push(entry.url)
        remainingBytes -= entry.size
        remainingCount -= 1
      }

      if (urlsToDelete.length === 0) return

      await new Promise((resolve) => {
        try {
          const tx = db.transaction(storeName, 'readwrite')
          const store = tx.objectStore(storeName)
          for (const url of urlsToDelete) {
            store.delete(url)
          }
          tx.oncomplete = () => resolve()
          tx.onerror = () => resolve()
          tx.onabort = () => resolve()
        } catch {
          resolve()
        }
      })
    })().finally(() => {
      prunePromise = null
    })

    return prunePromise
  }

  async function put(url, buffer, contentType = '') {
    if (!(buffer instanceof ArrayBuffer) || buffer.byteLength === 0) return
    if (buffer.byteLength > config.maxBytes) return

    const db = await openDb()
    if (!db) return

    const now = nowFn()
    const record = {
      url,
      data: buffer.slice(0),
      size: buffer.byteLength,
      contentType,
      updatedAt: now,
      lastAccessedAt: now,
    }

    const writeError = await new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readwrite')
        tx.objectStore(storeName).put(record)
        tx.oncomplete = () => resolve(null)
        tx.onerror = () => resolve(tx.error || new Error('Tile cache write failed'))
        tx.onabort = () => resolve(tx.error || new Error('Tile cache write aborted'))
      } catch (error) {
        resolve(error)
      }
    })

    if (writeError?.name === 'QuotaExceededError') {
      await prune()
      return
    }

    if (!writeError) {
      void prune()
    }
  }

  async function clear() {
    const db = await openDb()
    if (!db) return
    await new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readwrite')
        tx.objectStore(storeName).clear()
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
        tx.onabort = () => resolve()
      } catch {
        resolve()
      }
    })
  }

  return { get, put, prune, clear }
}

const defaultTileStore = createIndexedDbTileStore()
const defaultCorsFallbackOrigins = new Set()

function isNonImageContentType(contentType) {
  return /^(text\/|application\/(json|xml|xhtml))/i.test(String(contentType || '').trim())
}

export function createTileCacheProtocolHandler(options = {}) {
  const store = options.store || defaultTileStore
  const fetchImpl = options.fetch || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null)
  const loadImageImpl = options.loadImage || loadImageElement
  const corsFallbackOrigins = options.corsFallbackOrigins || defaultCorsFallbackOrigins
  const protocol = options.protocol || TILE_CACHE_PROTOCOL
  const getFallbackUrl = typeof options.getFallbackUrl === 'function' ? options.getFallbackUrl : null

  async function requestSingleUrl(url, abortController) {
    const origin = getSafeOrigin(url)

    if (origin && corsFallbackOrigins.has(origin)) {
      const image = await loadImageImpl(url, abortController)
      return { data: image, cacheable: false }
    }

    if (!fetchImpl) {
      const image = await loadImageImpl(url, abortController)
      return { data: image, cacheable: false }
    }

    let response
    try {
      response = await fetchImpl(url, {
        signal: abortController?.signal,
        mode: 'cors',
      })
    } catch (fetchError) {
      if (abortController?.signal?.aborted || fetchError?.name === 'AbortError') {
        throw fetchError
      }
      // CORS-blocked or fetch-incompatible tile origins fall back to direct Image loading.
      const image = await loadImageImpl(url, abortController)
      if (origin) {
        corsFallbackOrigins.add(origin)
      }
      return { data: image, cacheable: false }
    }

    if (!response.ok) {
      throw new Error(`Tile fetch error (${response.status}): ${url}`)
    }

    const contentType = response.headers?.get?.('content-type') || ''
    if (isNonImageContentType(contentType)) {
      throw new Error(`Tile fetch returned non-image content (${contentType}): ${url}`)
    }

    const buffer = await response.arrayBuffer()
    if (!buffer || buffer.byteLength === 0) {
      throw new Error(`Tile fetch returned empty payload: ${url}`)
    }

    return { data: buffer, contentType, cacheable: true }
  }

  return async (params, abortController) => {
    const rawUrl = unwrapTileCacheUrl(params?.url, protocol)

    const cached = await store.get(rawUrl).catch(() => null)
    if (cached?.data) {
      return { data: cached.data }
    }

    let result
    try {
      result = await requestSingleUrl(rawUrl, abortController)
    } catch (primaryError) {
      if (abortController?.signal?.aborted || primaryError?.name === 'AbortError') {
        throw primaryError
      }
      const fallbackUrl = getFallbackUrl?.(rawUrl)
      if (!fallbackUrl || fallbackUrl === rawUrl) {
        throw primaryError
      }
      result = await requestSingleUrl(fallbackUrl, abortController)
    }

    if (result.cacheable && result.data instanceof ArrayBuffer) {
      void store.put(rawUrl, result.data, result.contentType)
    }

    return { data: result.data }
  }
}

export function registerMapTileCacheProtocol(maplibreglInstance, options = {}) {
  if (typeof maplibreglInstance?.addProtocol !== 'function') {
    return false
  }
  const existing = registeredHandlers.get(maplibreglInstance)
  if (existing) {
    if (typeof options.getFallbackUrl === 'function') {
      existing.getFallbackUrl = options.getFallbackUrl
    }
    return true
  }
  const protocol = options.protocol || TILE_CACHE_PROTOCOL
  const state = {
    getFallbackUrl: typeof options.getFallbackUrl === 'function' ? options.getFallbackUrl : null,
  }
  maplibreglInstance.addProtocol(
    protocol,
    createTileCacheProtocolHandler({
      ...options,
      getFallbackUrl: (url) => state.getFallbackUrl?.(url) ?? null,
    })
  )
  registeredHandlers.set(maplibreglInstance, state)
  return true
}

export async function clearMapTileCache() {
  defaultCorsFallbackOrigins.clear()
  await defaultTileStore.clear()
}
