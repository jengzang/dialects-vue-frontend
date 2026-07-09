import { reportOnlineTime, getToken } from '../../api/auth/auth.js'
import { userStore } from '@/main/store/store.js'
import { WEB_BASE } from '@/env-config.js'

const AUTH_API_BASE = '/api/auth'
const REPORT_INTERVAL = 5 * 60 * 1000
const INVISIBLE_THRESHOLD = 5 * 60 * 1000
const SAVE_INTERVAL = 30 * 1000

const LEGACY_PENDING_KEY = 'pending_online_time'
const PENDING_KEY_PREFIX = 'pending_online_time:'

let startTime = null
let accumulatedTime = 0
let reportTimer = null
let invisibleTimer = null
let saveTimer = null
let isPageVisible = true
let isInitialized = false
let reportPromise = null
let isPageHideReporting = false

function getPendingStorageKey() {
  return userStore.id ? `${PENDING_KEY_PREFIX}${userStore.id}` : null
}

function parseStoredSeconds(value) {
  const seconds = Number.parseInt(value, 10)
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 0
}

function clearPendingTime() {
  const storageKey = getPendingStorageKey()

  if (storageKey) {
    sessionStorage.removeItem(storageKey)
  }

  sessionStorage.removeItem(LEGACY_PENDING_KEY)
}

function persistPendingTime(seconds) {
  const storageKey = getPendingStorageKey()

  if (!storageKey || seconds <= 0 || !getToken()) {
    clearPendingTime()
    return
  }

  sessionStorage.setItem(storageKey, Math.floor(seconds).toString())
  sessionStorage.removeItem(LEGACY_PENDING_KEY)
}

function loadPendingTime() {
  const storageKey = getPendingStorageKey()

  if (storageKey) {
    const scopedValue = parseStoredSeconds(sessionStorage.getItem(storageKey))
    if (scopedValue > 0) {
      return scopedValue
    }
  }

  const legacyValue = parseStoredSeconds(sessionStorage.getItem(LEGACY_PENDING_KEY))

  if (legacyValue > 0 && storageKey) {
    sessionStorage.setItem(storageKey, legacyValue.toString())
  }

  if (legacyValue > 0) {
    sessionStorage.removeItem(LEGACY_PENDING_KEY)
  }

  return legacyValue
}

function collectVisibleTime() {
  if (!startTime || !isPageVisible) {
    return
  }

  const duration = Math.floor((Date.now() - startTime) / 1000)

  if (duration > 0) {
    accumulatedTime += duration
  }
}

function resetStartTime() {
  startTime = isPageVisible ? Date.now() : null
}

async function flushAccumulatedTime() {
  if (reportPromise) {
    return reportPromise
  }

  reportPromise = (async () => {
    collectVisibleTime()
    const seconds = accumulatedTime
    accumulatedTime = 0
    resetStartTime()

    if (seconds > 0) {
      const success = await reportOnlineTime(seconds)

      if (success) {
        clearPendingTime()
      } else {
        persistPendingTime(seconds)
      }
    }

    return true
  })().finally(() => {
    reportPromise = null
  })

  return reportPromise
}

function handleVisibilityChange() {
  const nowVisible = !document.hidden

  if (nowVisible && !isPageVisible) {
    if (invisibleTimer) {
      clearTimeout(invisibleTimer)
      invisibleTimer = null
    }

    isPageVisible = true
    resetStartTime()
    return
  }

  if (!nowVisible && isPageVisible) {
    collectVisibleTime()
    startTime = null
    isPageVisible = false

    invisibleTimer = setTimeout(() => {
      if (!isPageVisible) {
        void flushAccumulatedTime()
      }
    }, INVISIBLE_THRESHOLD)
  }
}

function handlePageHide() {
  if (isPageHideReporting || reportPromise) {
    return
  }

  isPageHideReporting = true
  collectVisibleTime()
  startTime = null

  if (accumulatedTime > 0) {
    const token = getToken()

    if (token) {
      const seconds = Math.max(1, Math.min(3600, Math.floor(accumulatedTime)))
      const data = JSON.stringify({ seconds })

      try {
        fetch(WEB_BASE + `${AUTH_API_BASE}/report-online-time`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: data,
          keepalive: true
        })
      } catch {
        persistPendingTime(accumulatedTime)
      }
    }
  }
}

function saveToSessionStorage() {
  collectVisibleTime()
  resetStartTime()

  if (accumulatedTime > 0) {
    persistPendingTime(accumulatedTime)
  }
}

async function reportPendingTime() {
  const pendingTime = loadPendingTime()

  if (pendingTime <= 0) {
    clearPendingTime()
    return
  }

  const success = await reportOnlineTime(pendingTime)

  if (success) {
    clearPendingTime()
  }
}

export async function initOnlineTimeTracker() {
  if (isInitialized || !getToken()) {
    return
  }

  isInitialized = true
  isPageHideReporting = false
  isPageVisible = !document.hidden

  await reportPendingTime()

  resetStartTime()

  reportTimer = setInterval(() => {
    void flushAccumulatedTime()
  }, REPORT_INTERVAL)

  saveTimer = setInterval(() => {
    saveToSessionStorage()
  }, SAVE_INTERVAL)

  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('pagehide', handlePageHide)
  window.addEventListener('beforeunload', handlePageHide)
}

export function stopOnlineTimeTracker(options = {}) {
  const { clearPending = false } = options

  if (reportTimer) {
    clearInterval(reportTimer)
    reportTimer = null
  }

  if (saveTimer) {
    clearInterval(saveTimer)
    saveTimer = null
  }

  if (invisibleTimer) {
    clearTimeout(invisibleTimer)
    invisibleTimer = null
  }

  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('pagehide', handlePageHide)
  window.removeEventListener('beforeunload', handlePageHide)

  if (clearPending) {
    clearPendingTime()
  }

  startTime = null
  accumulatedTime = 0
  isPageVisible = !document.hidden
  isInitialized = false
  isPageHideReporting = false
  reportPromise = null
}

export async function manualReport() {
  return flushAccumulatedTime()
}
