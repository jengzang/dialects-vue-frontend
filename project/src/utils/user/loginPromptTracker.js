import { userStore } from '@/main/store/store.js'
import { showInfo } from '@/utils/ui/message.js'

const STORAGE_KEY = 'login-prompt-session'
const VISIBLE_THRESHOLD_MS = 5 * 60 * 1000
const KEY_API_THRESHOLD = 1
const TOAST_DURATION_MS = 8000

const KEY_API_PATTERNS = [
  /^\/api\/ZhongGu(?:\?|$)/,
  /^\/api\/YinWei(?:\?|$)/,
  /^\/api\/search_chars\/?(?:\?|$)/,
  /^\/api\/search_tones\/?(?:\?|$)/,
  /^\/api\/compare\/(?:chars|ZhongGu|tones)(?:\?|$)/,
  /^\/api\/phonology(?:\?|$)/,
  /^\/api\/phonology_matrix(?:\?|$)/,
  /^\/api\/phonology_classification_matrix(?:\?|$)/,
  /^\/api\/pho_pie_by_(?:value|status)(?:\?|$)/,
  /^\/api\/feature_(?:counts|stats)(?:\?|$)/,
]

let visibleStartAt = null
let visibleMs = 0
let keyApiCount = 0
let isInitialized = false
let isPageVisible = typeof document !== 'undefined' ? !document.hidden : true
let promptTimer = null

function getDefaultState() {
  return {
    visibleMs: 0,
    keyApiCount: 0,
    lastPromptAt: 0,
  }
}

function parseStoredState() {
  if (typeof window === 'undefined') {
    return getDefaultState()
  }

  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || '{}')
    return {
      ...getDefaultState(),
      ...parsed,
      visibleMs: Number.isFinite(Number(parsed.visibleMs)) ? Number(parsed.visibleMs) : 0,
      keyApiCount: Number.isFinite(Number(parsed.keyApiCount)) ? Number(parsed.keyApiCount) : 0,
      lastPromptAt: Number.isFinite(Number(parsed.lastPromptAt)) ? Number(parsed.lastPromptAt) : 0,
    }
  } catch {
    return getDefaultState()
  }
}

function persistState(extra = {}) {
  if (typeof window === 'undefined') {
    return
  }

  const state = {
    visibleMs,
    keyApiCount,
    lastPromptAt: 0,
    ...extra,
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function collectVisibleTime() {
  if (!isPageVisible || !visibleStartAt) {
    return
  }

  const duration = Date.now() - visibleStartAt
  if (duration > 0) {
    visibleMs += duration
  }
  visibleStartAt = Date.now()
}

function getCurrentVisibleMs() {
  if (!isPageVisible || !visibleStartAt) {
    return visibleMs
  }

  return visibleMs + Math.max(0, Date.now() - visibleStartAt)
}

function clearPromptTimer() {
  if (promptTimer) {
    clearTimeout(promptTimer)
    promptTimer = null
  }
}

function schedulePromptCheck() {
  clearPromptTimer()

  if (!isInitialized || userStore.isAuthenticated || !isPageVisible || keyApiCount < KEY_API_THRESHOLD) {
    return
  }

  const remainingMs = VISIBLE_THRESHOLD_MS - getCurrentVisibleMs()
  if (remainingMs <= 0) {
    maybeShowPrompt()
    return
  }

  promptTimer = setTimeout(() => {
    promptTimer = null
    maybeShowPrompt()
  }, remainingMs)
}

function resetPromptCycle() {
  clearPromptTimer()
  visibleMs = 0
  keyApiCount = 0
  visibleStartAt = isPageVisible ? Date.now() : null
  persistState({ lastPromptAt: Date.now() })
}

function buildLoginUrl() {
  const currentPath = typeof window !== 'undefined'
    ? `${window.location.pathname}${window.location.search}${window.location.hash}`
    : '/'
  const redirect = currentPath.startsWith('/auth') ? '/' : currentPath
  return `/auth?view=login&redirect=${encodeURIComponent(redirect)}`
}

function showLoginPromptToast() {
  resetPromptCycle()
  showInfo('messages.loginPrompt.message', TOAST_DURATION_MS, {
    actionText: 'messages.loginPrompt.login',
    dismissText: 'messages.loginPrompt.dismiss',
    positionRight: true,
    onAction: () => {
      if (typeof window !== 'undefined') {
        window.location.href = buildLoginUrl()
      }
    }
  })
}

function shouldShowPrompt() {
  return (
    isInitialized &&
    !userStore.isAuthenticated &&
    getCurrentVisibleMs() >= VISIBLE_THRESHOLD_MS &&
    keyApiCount >= KEY_API_THRESHOLD
  )
}

function maybeShowPrompt() {
  if (shouldShowPrompt()) {
    showLoginPromptToast()
  } else {
    schedulePromptCheck()
  }
}

function handleVisibilityChange() {
  const nowVisible = !document.hidden

  if (nowVisible && !isPageVisible) {
    isPageVisible = true
    visibleStartAt = Date.now()
    schedulePromptCheck()
    return
  }

  if (!nowVisible && isPageVisible) {
    collectVisibleTime()
    isPageVisible = false
    visibleStartAt = null
    clearPromptTimer()
    persistState()
  }
}

function handlePageHide() {
  collectVisibleTime()
  persistState()
}

export function isLoginPromptKeyApi(path) {
  if (typeof path !== 'string') {
    return false
  }

  return KEY_API_PATTERNS.some(pattern => pattern.test(path))
}

export function recordLoginPromptApiHit(path) {
  if (!isInitialized || userStore.isAuthenticated || !isLoginPromptKeyApi(path)) {
    return
  }

  collectVisibleTime()
  keyApiCount += 1
  persistState()
  maybeShowPrompt()
}

export function initLoginPromptTracker() {
  if (isInitialized || typeof document === 'undefined') {
    return
  }

  const storedState = parseStoredState()
  visibleMs = storedState.visibleMs
  keyApiCount = storedState.keyApiCount
  isPageVisible = !document.hidden
  visibleStartAt = isPageVisible ? Date.now() : null
  isInitialized = true

  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('pagehide', handlePageHide)
  window.addEventListener('beforeunload', handlePageHide)
  schedulePromptCheck()
}

export function stopLoginPromptTracker() {
  if (!isInitialized || typeof document === 'undefined') {
    return
  }

  handlePageHide()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('pagehide', handlePageHide)
  window.removeEventListener('beforeunload', handlePageHide)
  clearPromptTimer()

  visibleStartAt = null
  isInitialized = false
}
