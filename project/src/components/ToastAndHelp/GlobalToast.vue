<template>
  <Teleport to="body">
    <Transition name="toast-fade">
      <div
        v-if="messageState.show"
        :class="['global-toast', 'global-toast-shell', messageState.type, { 'has-action': messageState.actionText, 'rate-limit-toast': messageState.rateLimitMode, 'changelog-toast': messageState.changelogMode, 'position-right': messageState.positionRight }]"
        @mouseenter="persistMessageUntilDismiss"
        @click="persistMessageUntilDismiss"
      >
        <span class="toast-icon">{{ getIcon(messageState.type) }}</span>
        <span class="toast-message">
          <template v-for="(line, idx) in messageLines" :key="idx">
            {{ line }}<br v-if="idx < messageLines.length - 1" />
          </template>
        </span>
        <button
          v-if="messageState.actionText"
          class="toast-action"
          type="button"
          @click.stop="triggerMessageAction"
        >
          {{ messageState.actionText }}
        </button>
        <button
          v-if="messageState.dismissText || messageState.actionText"
          class="close-btn"
          type="button"
          :aria-label="messageState.dismissText || 'Close'"
          @click.stop="hideMessage({ dismissed: true })"
        >
          ×
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { messageState, triggerMessageAction, hideMessage, persistMessageUntilDismiss } from '@/utils/ui/message.js'

const dynamicMessage = ref('')

let tickerId = null

function startTicker() {
  stopTicker()
  const fn = messageState.value.messageFn
  if (typeof fn !== 'function') return
  dynamicMessage.value = fn()
  tickerId = setInterval(() => {
    const text = fn()
    if (!text) {
      hideMessage()
      return
    }
    dynamicMessage.value = text
  }, 1000)
}

function stopTicker() {
  if (tickerId) {
    clearInterval(tickerId)
    tickerId = null
  }
}

watch(
  () => messageState.value.messageFn,
  (fn) => {
    if (typeof fn === 'function') {
      startTicker()
    } else {
      stopTicker()
      dynamicMessage.value = ''
    }
  },
  { immediate: true }
)

watch(
  () => messageState.value.show,
  (show) => {
    if (!show) {
      stopTicker()
    }
  }
)

onBeforeUnmount(() => stopTicker())

const messageLines = computed(() => {
  const msg = dynamicMessage.value || messageState.value.message || ''
  return msg.split('\n')
})

function getIcon(type) {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }
  return icons[type] || icons.info
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$apple-blue: var(--color-primary);
$action-blue: var(--color-primary-hover);
$white: var(--text-white);

$text-default: rgba(24, 32, 46, 0.86);
$text-dark: rgba(0, 0, 0, 0.85);
$text-action-info: rgba(20, 34, 56, 0.88);

$toast-enter-easing: cubic-bezier(0.175, 0.885, 0.32, 1.275);
$toast-leave-easing: cubic-bezier(0.25, 0.46, 0.45, 0.94);

@mixin toast-icon($background, $font-size, $color: null) {
  width: 24px;
  height: 24px;
  font-size: $font-size;
  font-weight: 700;
  background: $background;
  border-radius: var(--radius-full);

  @include flex-center;

  @if $color {
    color: $color;
  }
}

/*
 * Toast 通过 Teleport 渲染到 body，
 * 因此保持为顶层选择器。
 */
.global-toast {
  position: fixed;
  top: 80px;
  left: 0;
  right: 0;
  z-index: 99999;
  display: flex;
  gap: 10px;
  align-items: center;
  width: fit-content;
  max-width: min(420px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 12px 14px;
  color: $text-default;
  background: linear-gradient(
    135deg,
    var(--glass-70),
    rgba(242, 247, 255, 0.44)
  );
  border: 1px solid var(--glass-40);
  border-radius: 22px;
  box-shadow:
    0 18px 48px rgba(31, 45, 74, 0.18),
    inset 0 1px 0 var(--glass-50);

  @include glass-blur(22px, 180%);

  &.position-right {
    top: 20dvh;
    right: 28px;
    left: auto;
    transform: none;
  }

  &.success {
    color: $white;
    background: linear-gradient(
      135deg,
      rgba(var(--color-success-rgb), 0.85),
      rgba(48, 209, 88, 0.8)
    );
    border-color: rgba(var(--color-success-rgb), 0.5);

    .toast-icon {
      @include toast-icon(var(--glass-30), 14px);
    }
  }

  &.error {
    color: $white;
    background: linear-gradient(
      135deg,
      rgba(var(--color-error-light-rgb), 0.85),
      rgba(255, 69, 58, 0.8)
    );
    border-color: rgba(var(--color-error-light-rgb), 0.5);

    .toast-icon {
      @include toast-icon(var(--glass-30), 16px);
    }
  }

  &.warning {
    color: $text-dark;
    background: linear-gradient(
      135deg,
      rgba(var(--color-gold-rgb), 0.85),
      rgba(255, 214, 10, 0.8)
    );
    border-color: rgba(var(--color-gold-rgb), 0.5);

    .toast-icon {
      @include toast-icon(rgba(0, 0, 0, 0.15), 16px);
    }
  }

  &.info {
    color: var(--action-primary-text);
    background: linear-gradient(
      135deg,
      rgba(var(--color-primary-rgb), 0.85),
      rgba(var(--color-primary-rgb), 0.8)
    );
    border-color: rgba(var(--color-primary-rgb), 0.5);

    .toast-icon {
      @include toast-icon(var(--glass-30), 14px);
    }

    &.has-action {
      color: $text-action-info;
      background: linear-gradient(
        135deg,
        var(--glass-60),
        rgba(234, 243, 255, 0.4)
      );
      border-color: var(--glass-50);

      .toast-icon {
        color: $apple-blue;
        background: rgba(var(--color-primary-rgb), 0.13);
      }

      .toast-action {
        color: $action-blue;
        background: rgba(var(--color-primary-rgb), 0.12);
        box-shadow: inset 0 0 0 1px rgba(var(--color-primary-rgb), 0.18);

        &:hover {
          background: rgba(var(--color-primary-rgb), 0.18);
        }
      }
    }
  }

  &.has-action {
    &.toast-fade-enter-active {
      animation-name: toast-in-side;
    }

    &.toast-fade-leave-active {
      animation-name: toast-out-side;
    }
  }

  &.rate-limit-toast {
    max-width: min(480px, calc(100vw - 32px));
    padding: 16px 20px;
    font-weight: 500;
    border-radius: 24px;
    box-shadow:
      0 20px 54px rgba(120, 90, 20, 0.16),
      0 6px 16px rgba(160, 120, 26, 0.12),
      inset 0 0 0 0.5px var(--glass-50);

    .toast-icon {
      width: 38px;
      height: 38px;
      font-size: 16px;
      background: rgba(255, 214, 102, 0.3);
      border: 1px solid var(--glass-50);
      border-radius: 14px;
      box-shadow: 0 8px 20px rgba(160, 120, 26, 0.18);
    }

    .toast-message {
      font-size: 14px;
      line-height: 1.55;
    }

    .toast-action {
      padding: 8px 16px;
      font-size: 13px;
    }
  }

  @media (max-aspect-ratio:1/1) {
    top: auto;
    right: 16px;
    bottom: 22px;
    max-width: calc(100vw - 32px);
    padding: 12px 14px;
    font-size: 14px;
    border-radius: 18px;
    transform: none;

    .toast-icon {
      width: 22px;
      height: 22px;
      font-size: 13px;
    }

    &.position-right {
      top: auto;
      right: 16px;
      bottom: 20dvh;
      transform: none;
    }

    &.changelog-toast {
      left: 25px;
      right: 25px;
      width: auto;
      max-width: calc(100dvw - 50px);
    }
  }
}

.toast-message {
  flex: 1;
  min-width: 0;
  line-height: 1.4;
}

.toast-action {
  padding: 6px 12px;
  color: inherit;
  font: inherit;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  background: var(--glass-50);
  border: 0;
  border-radius: var(--radius-pill);
  box-shadow: inset 0 0 0 1px var(--glass-40);

  @include glass-blur(10px);

  &:hover {
    background: var(--glass-60);
  }
}

/* Toast 进入与离开动画 */
.toast-fade-enter-active {
  animation: toast-in 0.5s $toast-enter-easing;
}

.toast-fade-leave-active {
  animation: toast-out 0.35s $toast-leave-easing;
}

@keyframes toast-in {
  0% {
    opacity: 0;
    transform: translateY(-18px) scale(0.96);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes toast-out {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  100% {
    opacity: 0;
    transform: translateY(-12px) scale(0.98);
  }
}

@keyframes toast-in-side {
  0% {
    opacity: 0;
    transform: translateY(-18px) scale(0.96);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes toast-out-side {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  100% {
    opacity: 0;
    transform: translateY(-12px) scale(0.98);
  }
}
</style>
