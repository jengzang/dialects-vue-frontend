import { reactive } from 'vue'

function createDefaultState() {
  return {
    visible: false,
    message: '',
    retryAfterSeconds: 0,
    expiresAtMs: null,
    resetAt: '',
    limitType: '',
    scope: '',
    suggestLogin: false,
    showLoginAction: false,
    isAuthenticated: false,
    path: '',
    updatedAt: 0
  }
}

function normalizeRetryAfterSeconds(value) {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return 0
  }
  return Math.ceil(numberValue)
}

function normalizeExpiresAtMs(expiresAtMs, resetAt, retryAfterSeconds) {
  if (Number.isFinite(expiresAtMs) && expiresAtMs > Date.now()) {
    return expiresAtMs
  }

  if (typeof resetAt === 'string' && resetAt.trim()) {
    const parsed = Date.parse(resetAt)
    if (!Number.isNaN(parsed) && parsed > Date.now()) {
      return parsed
    }
  }

  if (retryAfterSeconds > 0) {
    return Date.now() + retryAfterSeconds * 1000
  }

  return null
}

export const rateLimitNoticeState = reactive(createDefaultState())

export function clearRateLimitNotice() {
  Object.assign(rateLimitNoticeState, createDefaultState())
}

export function showRateLimitNotice(notice = {}) {
  const retryAfterSeconds = normalizeRetryAfterSeconds(
    notice.retryAfterSeconds ?? notice.retry_after_seconds
  )
  const expiresAtMs = normalizeExpiresAtMs(
    notice.expiresAtMs,
    notice.resetAt ?? notice.reset_at,
    retryAfterSeconds
  )

  Object.assign(rateLimitNoticeState, {
    visible: true,
    message: notice.message || '',
    retryAfterSeconds,
    expiresAtMs,
    resetAt: expiresAtMs ? new Date(expiresAtMs).toISOString() : '',
    limitType: notice.limitType ?? notice.limit_type ?? '',
    scope: notice.scope ?? '',
    suggestLogin: Boolean(notice.suggestLogin ?? notice.suggest_login),
    showLoginAction: Boolean(notice.showLoginAction),
    isAuthenticated: Boolean(notice.isAuthenticated),
    path: notice.path ?? '',
    updatedAt: Date.now()
  })
}
