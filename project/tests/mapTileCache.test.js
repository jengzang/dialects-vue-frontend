import { describe, expect, it, vi } from 'vitest'
import {
  TILE_CACHE_PROTOCOL,
  createIndexedDbTileStore,
  createTileCacheProtocolHandler,
  registerMapTileCacheProtocol,
  unwrapTileCacheUrl,
  wrapTileUrlWithCacheProtocol,
} from '@/utils/map/tileCache.js'

function createMockIndexedDB() {
  const databases = new Map()

  function makeRequest(executor) {
    const req = { result: undefined, error: null, onsuccess: null, onerror: null, onupgradeneeded: null }
    queueMicrotask(() => {
      try {
        executor(req)
      } catch (err) {
        req.error = err
        req.onerror?.()
      }
    })
    return req
  }

  return {
    open(name) {
      return makeRequest((req) => {
        let dbState = databases.get(name)
        const isNew = !dbState
        if (!dbState) {
          dbState = { stores: new Map() }
          databases.set(name, dbState)
        }

        const db = {
          objectStoreNames: {
            contains: (storeName) => dbState.stores.has(storeName),
          },
          createObjectStore: (storeName) => {
            const storeData = { records: new Map(), indexes: new Set() }
            dbState.stores.set(storeName, storeData)
            return {
              indexNames: { contains: (idx) => storeData.indexes.has(idx) },
              createIndex: (idx) => storeData.indexes.add(idx),
            }
          },
          transaction: (storeName) => {
            const storeData = dbState.stores.get(storeName)
            const tx = { oncomplete: null, onerror: null, onabort: null, error: null }
            const finishTx = () => queueMicrotask(() => tx.oncomplete?.())

            const objectStore = {
              get(key) {
                return makeRequest((r) => {
                  r.result = storeData.records.get(key)
                  r.onsuccess?.()
                  finishTx()
                })
              },
              put(record) {
                storeData.records.set(record.url, record)
                finishTx()
              },
              delete(key) {
                storeData.records.delete(key)
                finishTx()
              },
              clear() {
                storeData.records.clear()
                finishTx()
              },
              index() {
                return {
                  openCursor() {
                    const sorted = [...storeData.records.values()].sort(
                      (a, b) => a.lastAccessedAt - b.lastAccessedAt
                    )
                    let idx = 0
                    const cursorReq = { result: null, onsuccess: null, onerror: null }
                    const step = () => {
                      queueMicrotask(() => {
                        if (idx >= sorted.length) {
                          cursorReq.result = null
                          cursorReq.onsuccess?.()
                          finishTx()
                          return
                        }
                        const current = sorted[idx++]
                        cursorReq.result = {
                          value: current,
                          continue: step,
                        }
                        cursorReq.onsuccess?.()
                      })
                    }
                    step()
                    return cursorReq
                  },
                }
              },
            }

            tx.objectStore = () => objectStore
            return tx
          },
        }

        req.result = db
        if (isNew) {
          req.onupgradeneeded?.()
        }
        req.onsuccess?.()
      })
    },
  }
}

function makeBytes(length, fillByte = 1) {
  const arr = new Uint8Array(length)
  arr.fill(fillByte)
  return arr.buffer
}

async function flushMicrotasks(rounds = 8) {
  for (let i = 0; i < rounds; i += 1) {
    await Promise.resolve()
  }
}

describe('map tile cache (addProtocol + IndexedDB LRU)', () => {
  it('wraps and unwraps http/https tile URLs cleanly', () => {
    const raw = 'https://t0.tianditu.gov.cn/vec_w/wmts?TILECOL=1&TILEROW=2&TILEMATRIX=3'
    const wrapped = wrapTileUrlWithCacheProtocol(raw)
    expect(wrapped).toBe(`${TILE_CACHE_PROTOCOL}://${raw}`)
    expect(unwrapTileCacheUrl(wrapped)).toBe(raw)
    expect(wrapTileUrlWithCacheProtocol('data:image/png;base64,abc')).toBe('data:image/png;base64,abc')
  })

  it('caches fetched tiles in IndexedDB and serves subsequent requests without network fetch', async () => {
    let now = 1_000_000
    const store = createIndexedDbTileStore({
      indexedDB: createMockIndexedDB(),
      dbName: 'test-hit-db',
      now: () => now,
    })

    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => 'image/png' },
      arrayBuffer: async () => makeBytes(16, 42),
    }))

    const handler = createTileCacheProtocolHandler({
      store,
      fetch: fetchMock,
      corsFallbackOrigins: new Set(),
    })

    const tileUrl = wrapTileUrlWithCacheProtocol('https://tiles.example.com/1/2/3.png')
    const first = await handler({ url: tileUrl }, new AbortController())
    await flushMicrotasks()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(new Uint8Array(first.data)[0]).toBe(42)

    // Mutate returned buffer to ensure cached copy is isolated.
    new Uint8Array(first.data)[0] = 99

    const second = await handler({ url: tileUrl }, new AbortController())
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(new Uint8Array(second.data)[0]).toBe(42)
  })

  it('evicts least-recently-used tiles when maxEntries or maxBytes is exceeded', async () => {
    let now = 10_000
    const store = createIndexedDbTileStore({
      indexedDB: createMockIndexedDB(),
      dbName: 'test-lru-db',
      maxEntries: 2,
      maxBytes: 1024,
      touchThrottleMs: 0,
      now: () => now,
    })

    await store.put('https://tiles.example.com/a.png', makeBytes(10, 1))
    now += 100
    await store.put('https://tiles.example.com/b.png', makeBytes(10, 2))
    await flushMicrotasks()

    // Touch "a" so "b" becomes the least-recently-used tile.
    now += 100
    expect(await store.get('https://tiles.example.com/a.png')).not.toBeNull()
    await flushMicrotasks()

    // Insert "c", exceeding maxEntries=2 -> "b" should be evicted, "a" and "c" kept.
    now += 100
    await store.put('https://tiles.example.com/c.png', makeBytes(10, 3))
    await store.prune()

    expect(await store.get('https://tiles.example.com/b.png')).toBeNull()
    expect(await store.get('https://tiles.example.com/a.png')).not.toBeNull()
    expect(await store.get('https://tiles.example.com/c.png')).not.toBeNull()
  })

  it('re-fetches tiles once TTL has expired', async () => {
    let now = 1_000
    const store = createIndexedDbTileStore({
      indexedDB: createMockIndexedDB(),
      dbName: 'test-ttl-db',
      ttlMs: 500,
      now: () => now,
    })

    await store.put('https://tiles.example.com/expire.png', makeBytes(8, 7))
    await flushMicrotasks()

    expect(await store.get('https://tiles.example.com/expire.png')).not.toBeNull()
    now += 600
    expect(await store.get('https://tiles.example.com/expire.png')).toBeNull()
  })

  it('falls back to direct Image loading on CORS fetch failure and remembers the origin', async () => {
    const store = createIndexedDbTileStore({
      indexedDB: createMockIndexedDB(),
      dbName: 'test-cors-db',
    })
    const corsFallbackOrigins = new Set()
    const fetchMock = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    const fakeImg = { tagName: 'IMG' }
    const loadImageMock = vi.fn(async () => fakeImg)

    const handler = createTileCacheProtocolHandler({
      store,
      fetch: fetchMock,
      loadImage: loadImageMock,
      corsFallbackOrigins,
    })

    const res1 = await handler(
      { url: wrapTileUrlWithCacheProtocol('https://no-cors.example.com/1.png') },
      new AbortController()
    )
    expect(res1.data).toBe(fakeImg)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(loadImageMock).toHaveBeenCalledTimes(1)
    expect(corsFallbackOrigins.has('https://no-cors.example.com')).toBe(true)

    // Subsequent request to the same origin skips fetch completely.
    const res2 = await handler(
      { url: wrapTileUrlWithCacheProtocol('https://no-cors.example.com/2.png') },
      new AbortController()
    )
    expect(res2.data).toBe(fakeImg)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(loadImageMock).toHaveBeenCalledTimes(2)
  })

  it('does not mark an origin as CORS-unsupported when both fetch and Image fallback fail', async () => {
    const store = createIndexedDbTileStore({
      indexedDB: createMockIndexedDB(),
      dbName: 'test-offline-db',
    })
    const corsFallbackOrigins = new Set()
    const handler = createTileCacheProtocolHandler({
      store,
      fetch: vi.fn(async () => {
        throw new TypeError('Network offline')
      }),
      loadImage: vi.fn(async () => {
        throw new Error('Image offline')
      }),
      corsFallbackOrigins,
    })

    await expect(
      handler({ url: wrapTileUrlWithCacheProtocol('https://offline.example.com/1.png') }, new AbortController())
    ).rejects.toThrow('Image offline')
    expect(corsFallbackOrigins.size).toBe(0)
  })

  it('registers the protocol only once per maplibregl instance', () => {
    const mockMaplibre = { addProtocol: vi.fn() }
    expect(registerMapTileCacheProtocol(mockMaplibre)).toBe(true)
    expect(registerMapTileCacheProtocol(mockMaplibre)).toBe(true)
    expect(mockMaplibre.addProtocol).toHaveBeenCalledTimes(1)
    expect(mockMaplibre.addProtocol).toHaveBeenCalledWith(TILE_CACHE_PROTOCOL, expect.any(Function))
    expect(registerMapTileCacheProtocol({})).toBe(false)
  })
})
