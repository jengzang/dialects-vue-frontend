const DB_NAME = 'map-draw-workbench'
const STORE_NAME = 'drafts'
const DB_VERSION = 1
export const AUTO_DRAFT_ID = '__map_draw_auto_draft__'

let dbPromise = null

function ensureIndexedDb() {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB unavailable')
  }
}

function openDraftDb() {
  ensureIndexedDb()

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error || new Error('Failed to open draft database'))
    })
  }

  return dbPromise
}

async function withStore(mode, callback) {
  const db = await openDraftDb()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode)
    const store = transaction.objectStore(STORE_NAME)

    let request
    try {
      request = callback(store)
    } catch (error) {
      reject(error)
      return
    }

    transaction.oncomplete = () => {
      if (request?.result !== undefined) {
        resolve(request.result)
        return
      }
      resolve(undefined)
    }
    transaction.onerror = () => reject(transaction.error || request?.error || new Error('Draft transaction failed'))
    transaction.onabort = () => reject(transaction.error || new Error('Draft transaction aborted'))

    if (request) {
      request.onerror = () => reject(request.error || new Error('Draft request failed'))
    }
  })
}

function cloneState(value) {
  return JSON.parse(JSON.stringify(value))
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }

  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort()
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
  }

  return JSON.stringify(value)
}

function sortDraftsBySavedAt(items = []) {
  return [...items].sort((a, b) => String(a.savedAt || '').localeCompare(String(b.savedAt || '')))
}

export function buildDraftStateSignature(state) {
  return stableStringify(state ?? {})
}

export function isAutoDraftRecord(record) {
  return Boolean(record?.auto === true || record?.id === AUTO_DRAFT_ID)
}

export function buildAutoDraftRecord(state, options = {}) {
  const clonedState = cloneState(state ?? {})
  return {
    id: AUTO_DRAFT_ID,
    name: 'Auto Draft',
    savedAt: options.savedAt ?? new Date().toISOString(),
    version: 1,
    auto: true,
    signature: buildDraftStateSignature(clonedState),
    state: clonedState,
  }
}

export async function listDraftRecords() {
  const records = await withStore('readonly', (store) => store.getAll())
  return sortDraftsBySavedAt(Array.isArray(records) ? records.filter((record) => !isAutoDraftRecord(record)) : [])
}

export async function getDraftRecordById(id) {
  if (!id) return null
  const record = await withStore('readonly', (store) => store.get(id))
  return record || null
}

export async function saveDraftRecord(record) {
  const persistedRecord = {
    ...record,
    version: record?.version ?? 1,
    state: cloneState(record?.state ?? {}),
  }
  await withStore('readwrite', (store) => store.put(persistedRecord))
  return persistedRecord
}

export async function updateDraftRecord(id, patch) {
  const existing = await getDraftRecordById(id)
  if (!existing) return null

  const nextRecord = {
    ...existing,
    ...patch,
    id,
    version: patch?.version ?? existing.version ?? 1,
    state: cloneState(patch?.state ?? existing.state ?? {}),
  }

  await withStore('readwrite', (store) => store.put(nextRecord))
  return nextRecord
}

export async function deleteDraftRecord(id) {
  if (!id) return
  await withStore('readwrite', (store) => store.delete(id))
}

export async function migrateLegacyDraftsFromLocalStorage(storageKey) {
  if (typeof localStorage === 'undefined') return false

  const raw = localStorage.getItem(storageKey)
  if (!raw) return false

  const existingDrafts = await listDraftRecords()
  if (existingDrafts.length > 0) {
    localStorage.removeItem(storageKey)
    return false
  }

  const parsed = JSON.parse(raw)
  const drafts = Array.isArray(parsed) ? parsed : []
  if (!drafts.length) {
    localStorage.removeItem(storageKey)
    return false
  }

  for (const draft of drafts) {
    await saveDraftRecord({
      ...draft,
      version: draft?.version ?? 1,
      state: draft?.state ?? {},
    })
  }

  localStorage.removeItem(storageKey)
  return true
}
