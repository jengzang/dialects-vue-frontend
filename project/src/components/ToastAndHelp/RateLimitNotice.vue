<template>
  <Teleport to="body">
    <Transition name="rate-limit-slide">
      <aside v-if="rateLimitNoticeState.visible" class="rate-limit-shell" aria-live="polite">
        <section class="rate-limit-notice">
          <div class="notice-glow"></div>

          <div class="notice-icon" aria-hidden="true">!</div>

          <div class="notice-content">
            <div class="notice-header">
              <span class="notice-chip">{{ noticeTypeLabel }}</span>
              <span v-if="remainingSeconds > 0" class="countdown-chip">
                {{ countdownPrefix }} {{ formattedCountdown }}
              </span>
            </div>

            <p class="notice-message">{{ primaryMessage }}</p>
            <p class="notice-meta">{{ secondaryMessage }}</p>
          </div>

          <div class="notice-actions">
            <button
              v-if="rateLimitNoticeState.showLoginAction"
              type="button"
              class="notice-button login-button"
              @click="goToLogin"
            >
              {{ loginButtonLabel }}
            </button>

            <button
              type="button"
              class="notice-button ghost-button"
              @click="handleDismiss"
            >
              {{ closeButtonLabel }}
            </button>
          </div>
        </section>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, watch, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { rateLimitNoticeState, clearRateLimitNotice } from '@/utils/user/rateLimitNotice.js'

const router = useRouter()
const route = useRoute()
const { locale, t } = useI18n()

const nowMs = ref(Date.now())
let tickerId = null

const remainingSeconds = computed(() => {
  if (!rateLimitNoticeState.expiresAtMs) {
    return 0
  }
  return Math.max(0, Math.ceil((rateLimitNoticeState.expiresAtMs - nowMs.value) / 1000))
})

const currentLanguage = computed(() => {
  const value = String(locale.value || 'zh-CN')
  if (value.startsWith('en')) {
    return 'en'
  }
  if (value.startsWith('zh-Hant')) {
    return 'zh-Hant'
  }
  return 'zh-CN'
})

const limitTypeKey = computed(() => {
  const limitType = rateLimitNoticeState.limitType
  const supportedTypes = [
    'guest_ip_limit',
    'authenticated_ip_limit',
    'authenticated_user_limit',
    'login_ip_limit'
  ]
  return supportedTypes.includes(limitType) ? limitType : 'default'
})

const primaryMessage = computed(() => {
  return rateLimitNoticeState.message || t('messages.rateLimit.defaultMessage')
})

const secondaryMessage = computed(() => {
  return t(
    rateLimitNoticeState.showLoginAction
      ? 'messages.rateLimit.guestHint'
      : 'messages.rateLimit.userHint'
  )
})

const noticeTypeLabel = computed(() => {
  return t(`messages.rateLimit.limitTypes.${limitTypeKey.value}`)
})

const countdownPrefix = computed(() => t('messages.rateLimit.retryIn'))
const loginButtonLabel = computed(() => t('navigation.login'))
const closeButtonLabel = computed(() => t('common.button.close'))

const formattedCountdown = computed(() => formatDuration(remainingSeconds.value, currentLanguage.value))

function formatDuration(seconds, language) {
  if (!seconds || seconds <= 0) {
    return t('messages.rateLimit.duration.now')
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (language === 'en') {
    const parts = []
    if (hours > 0) parts.push(`${hours}${t('messages.rateLimit.duration.hour')}`)
    if (minutes > 0) parts.push(`${minutes}${t('messages.rateLimit.duration.minute')}`)
    if (secs > 0 || parts.length === 0) {
      parts.push(`${secs}${t('messages.rateLimit.duration.second')}`)
    }
    return parts.join(' ')
  }

  const parts = []
  if (hours > 0) parts.push(`${hours}${t('messages.rateLimit.duration.hour')}`)
  if (minutes > 0) parts.push(`${minutes}${t('messages.rateLimit.duration.minute')}`)
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}${t('messages.rateLimit.duration.second')}`)
  }
  return parts.join('')
}

function startTicker() {
  stopTicker()
  nowMs.value = Date.now()
  tickerId = window.setInterval(() => {
    nowMs.value = Date.now()
  }, 1000)
}

function stopTicker() {
  if (tickerId) {
    window.clearInterval(tickerId)
    tickerId = null
  }
}

function handleDismiss() {
  clearRateLimitNotice()
}

function goToLogin() {
  const redirect = getSafeRedirectPath(route.fullPath)
  clearRateLimitNotice()
  router.push({
    path: '/auth',
    query: redirect ? { view: 'login', redirect } : { view: 'login' }
  })
}

function getSafeRedirectPath(path) {
  if (typeof path !== 'string') {
    return ''
  }
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/auth')) {
    return ''
  }
  return path
}

watch(
  () => rateLimitNoticeState.visible,
  (visible) => {
    if (visible) {
      startTicker()
    } else {
      stopTicker()
    }
  },
  { immediate: true }
)

watch(remainingSeconds, (value) => {
  if (rateLimitNoticeState.visible && rateLimitNoticeState.expiresAtMs && value <= 0) {
    clearRateLimitNotice()
  }
})

onBeforeUnmount(() => {
  stopTicker()
})
</script>

<style scoped>
.rate-limit-shell {
  position: fixed;
  top: 92px;
  left: 50%;
  z-index: 99990;
  width: min(720px, calc(100vw - 32px));
  transform: translateX(-50%);
  pointer-events: none;
}

.rate-limit-notice {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  padding: 18px 20px;
  border-radius: 26px;
  overflow: hidden;
  pointer-events: auto;
  color: rgba(35, 29, 15, 0.9);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.72), rgba(255, 250, 237, 0.58)),
    linear-gradient(135deg, rgba(255, 214, 102, 0.26), rgba(255, 255, 255, 0.08));
  border: 1px solid rgba(255, 255, 255, 0.42);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  box-shadow:
    0 24px 54px rgba(120, 90, 20, 0.14),
    0 8px 18px rgba(0, 0, 0, 0.08),
    inset 0 0 0 0.5px rgba(255, 255, 255, 0.46);
}

.notice-glow {
  position: absolute;
  inset: -35% auto auto -12%;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 214, 102, 0.34), rgba(255, 214, 102, 0));
  pointer-events: none;
}

.notice-icon {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 15px;
  font-size: 20px;
  font-weight: 700;
  color: rgba(111, 71, 0, 0.95);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(255, 214, 102, 0.42));
  border: 1px solid rgba(255, 255, 255, 0.52);
  box-shadow:
    0 10px 24px rgba(160, 120, 26, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.notice-content {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.notice-header {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 8px;
}

.notice-chip,
.countdown-chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.notice-chip {
  color: rgba(92, 60, 0, 0.92);
  background: rgba(255, 245, 219, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.45);
}

.countdown-chip {
  color: rgba(63, 49, 9, 0.92);
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.38);
}

.notice-message {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.45;
  color: rgba(38, 30, 12, 0.92);
}

.notice-meta {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: rgba(76, 60, 23, 0.72);
}

.notice-actions {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 10px;
  align-items: center;
}

.notice-button {
  min-height: 40px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease;
}

.notice-button:hover {
  transform: translateY(-1px);
}

.login-button {
  color: white;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.95), rgba(79, 146, 255, 0.95));
  box-shadow: 0 10px 24px rgba(0, 122, 255, 0.24);
}

.ghost-button {
  color: rgba(63, 49, 9, 0.88);
  background: rgba(255, 255, 255, 0.52);
  border-color: rgba(255, 255, 255, 0.44);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.32);
}

.rate-limit-slide-enter-active {
  animation: rate-limit-in 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.rate-limit-slide-leave-active {
  animation: rate-limit-out 0.24s ease-in;
}

@keyframes rate-limit-in {
  0% {
    opacity: 0;
    transform: translateY(-12px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes rate-limit-out {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-8px);
  }
}

@media (max-width: 768px) {
  .rate-limit-shell {
    top: 72px;
    width: calc(100vw - 20px);
  }

  .rate-limit-notice {
    grid-template-columns: auto 1fr;
    gap: 14px;
    padding: 16px;
    border-radius: 22px;
  }

  .notice-actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
    padding-left: 56px;
  }

  .notice-message {
    font-size: 14px;
  }

  .notice-meta {
    font-size: 12px;
  }
}
</style>
