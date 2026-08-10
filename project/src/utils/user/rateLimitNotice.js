import { reactive } from 'vue'
import { showWarning } from '@/utils/ui/message.js'
import i18n from '@/i18n'
import router from '@/main/router.js'

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

function getSafeRedirectPath(path) {
  if (typeof path !== 'string') return ''
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/auth')) return ''
  return path
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return ''

  const t = i18n.global.t
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const parts = []
  if (hours > 0) parts.push(`${hours}${t('messages.rateLimit.duration.hour')}`)
  if (minutes > 0) parts.push(`${minutes}${t('messages.rateLimit.duration.minute')}`)
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}${t('messages.rateLimit.duration.second')}`)
  }
  return parts.join('')
}

export const rateLimitNoticeState = reactive(createDefaultState())

export function clearRateLimitNotice() {
  Object.assign(rateLimitNoticeState, createDefaultState())
}

export function showRateLimitNotice(notice = {}) {
  const t = i18n.global.t

  const retryAfterSeconds = normalizeRetryAfterSeconds(
    notice.retryAfterSeconds ?? notice.retry_after_seconds
  )
  const expiresAtMs = normalizeExpiresAtMs(
    notice.expiresAtMs,
    notice.resetAt ?? notice.reset_at,
    retryAfterSeconds
  )
  const limitType = notice.limitType ?? notice.limit_type ?? ''
  const showLoginAction = Boolean(notice.showLoginAction)

  const supportedTypes = [
    'guest_ip_limit',
    'authenticated_ip_limit',
    'authenticated_user_limit',
    'login_ip_limit'
  ]
  const limitTypeKey = supportedTypes.includes(limitType) ? limitType : 'default'
  const typeLabel = t(`messages.rateLimit.limitTypes.${limitTypeKey}`)

  function buildMessage(remainingSeconds) {
    const dur = formatDuration(remainingSeconds)
    const lines = [typeLabel]
    if (showLoginAction) {
      lines.push(t('messages.rateLimit.guestHint'))
      if (dur) lines.push(`${t('messages.rateLimit.retryIn')} ${dur}`)
    } else if (dur) {
      lines.push(t('messages.rateLimit.userHint', { duration: dur }))
    }
    return lines.join('\n')
  }

  const messageFn = expiresAtMs
    ? () => {
        const remaining = Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000))
        if (remaining <= 0) {
          clearRateLimitNotice()
          return ''
        }
        return buildMessage(remaining)
      }
    : null

  const staticMessage = messageFn ? buildMessage(retryAfterSeconds) : buildMessage(retryAfterSeconds || 0)

  Object.assign(rateLimitNoticeState, {
    visible: true,
    message: staticMessage,
    retryAfterSeconds,
    expiresAtMs,
    resetAt: expiresAtMs ? new Date(expiresAtMs).toISOString() : '',
    limitType,
    scope: notice.scope ?? '',
    suggestLogin: Boolean(notice.suggestLogin ?? notice.suggest_login),
    showLoginAction,
    isAuthenticated: Boolean(notice.isAuthenticated),
    path: notice.path ?? '',
    updatedAt: Date.now()
  })

  const toastDuration = messageFn ? 3600000 : 8000

  showWarning(messageFn ? buildMessage(retryAfterSeconds) : staticMessage, toastDuration, {
    messageFn,
    rateLimitMode: true,
    actionText: showLoginAction ? t('navigation.login') : '',
    dismissText: t('common.button.close'),
    onAction: showLoginAction
      ? () => {
          clearRateLimitNotice()
          const redirect = getSafeRedirectPath(window.location.pathname)
          router.push({
            path: '/auth',
            query: redirect ? { view: 'login', redirect } : { view: 'login' }
          })
        }
      : null,
    onDismiss: () => {
      clearRateLimitNotice()
    }
  })
}
