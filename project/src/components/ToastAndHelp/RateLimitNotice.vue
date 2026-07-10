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

<style scoped lang="scss">
$text-primary: rgba(35, 29, 15, 0.9);
$text-message: rgba(38, 30, 12, 0.92);
$text-meta: rgba(76, 60, 23, 0.72);
$text-brown: rgba(63, 49, 9, 0.92);

$white: var(--text-white);
$primary-blue: rgba(var(--color-primary-rgb), 0.95);

$button-transition-duration: 0.18s;
$enter-easing: cubic-bezier(0.22, 1, 0.36, 1);

@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin glass-blur($blur, $saturation: null) {
  @if $saturation {
    backdrop-filter: blur($blur) saturate($saturation);
    -webkit-backdrop-filter: blur($blur) saturate($saturation);
  } @else {
    backdrop-filter: blur($blur);
    -webkit-backdrop-filter: blur($blur);
  }
}

/*
 * 提示组件通过 Teleport 渲染到 body，
 * 因此相关样式保持为顶层选择器。
 */
.rate-limit-shell {
  position: fixed;
  top: 92px;
  left: 50%;
  z-index: 99990;
  width: min(720px, calc(100vw - 32px));
  pointer-events: none;
  transform: translateX(-50%);

  @media (max-width: 768px) {
    top: 72px;
    width: calc(100vw - 20px);
  }
}

.rate-limit-notice {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  padding: 18px 20px;
  overflow: hidden;
  color: $text-primary;
  pointer-events: auto;
  background:
    linear-gradient(
      135deg,
      var(--glass-70),
      rgba(255, 250, 237, 0.58)
    ),
    linear-gradient(
      135deg,
      rgba(255, 214, 102, 0.26),
      var(--glass-10)
    );
  border: 1px solid var(--glass-40);
  border-radius: 26px;
  box-shadow:
    0 24px 54px rgba(120, 90, 20, 0.14),
    0 8px 18px rgba(0, 0, 0, 0.08),
    inset 0 0 0 0.5px var(--glass-50);

  @include glass-blur(28px, 180%);

  @media (max-width: 768px) {
    grid-template-columns: auto 1fr;
    gap: 14px;
    padding: 16px;
    border-radius: 22px;
  }
}

.notice-glow {
  position: absolute;
  inset: -35% auto auto -12%;
  width: 220px;
  height: 220px;
  pointer-events: none;
  background: radial-gradient(
    circle,
    rgba(255, 214, 102, 0.34),
    rgba(255, 214, 102, 0)
  );
  border-radius: 50%;
}

.notice-icon {
  position: relative;
  z-index: 1;
  width: 42px;
  height: 42px;
  color: rgba(111, 71, 0, 0.95);
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(
    180deg,
    var(--glass-80),
    rgba(255, 214, 102, 0.42)
  );
  border: 1px solid var(--glass-50);
  border-radius: 15px;
  box-shadow:
    0 10px 24px rgba(160, 120, 26, 0.2),
    inset 0 1px 0 var(--glass-60);

  @include flex-center;
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
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  border-radius: 999px;

  @include glass-blur(20px);
}

.notice-chip {
  color: rgba(92, 60, 0, 0.92);
  background: rgba(255, 245, 219, 0.72);
  border: 1px solid var(--glass-50);
}

.countdown-chip {
  color: $text-brown;
  background: var(--glass-60);
  border: 1px solid var(--glass-40);
}

.notice-message {
  margin: 0;
  color: $text-message;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.45;

  @media (max-width: 768px) {
    font-size: 14px;
  }
}

.notice-meta {
  margin: 6px 0 0;
  color: $text-meta;
  font-size: 13px;
  line-height: 1.45;

  @media (max-width: 768px) {
    font-size: 12px;
  }
}

.notice-actions {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 10px;
  align-items: center;

  @media (max-width: 768px) {
    grid-column: 1 / -1;
    justify-content: flex-end;
    padding-left: 56px;
  }
}

.notice-button {
  min-height: 40px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 999px;
  transition:
    transform $button-transition-duration ease,
    box-shadow $button-transition-duration ease,
    background $button-transition-duration ease,
    border-color $button-transition-duration ease;

  &:hover {
    transform: translateY(-1px);
  }
}

.login-button {
  color: $white;
  background: linear-gradient(
    135deg,
    $primary-blue,
    rgba(79, 146, 255, 0.95)
  );
  box-shadow: 0 10px 24px rgba(var(--color-primary-rgb), 0.24);
}

.ghost-button {
  color: rgba(63, 49, 9, 0.88);
  background: var(--glass-50);
  border-color: var(--glass-40);
  box-shadow: inset 0 1px 0 var(--glass-30);
}

.rate-limit-slide-enter-active {
  animation: rate-limit-in 0.35s $enter-easing;
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
</style>
