<template>
  <Teleport to="body">
    <Transition name="toast-fade">
      <div
        v-if="messageState.show"
        :class="['global-toast', 'global-toast-shell', messageState.type, { 'has-action': messageState.actionText }]"
        @mouseenter="persistMessageUntilDismiss"
        @click="persistMessageUntilDismiss"
      >
        <span class="toast-icon">{{ getIcon(messageState.type) }}</span>
        <span class="toast-message">{{ messageState.message }}</span>
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
import { messageState, triggerMessageAction, hideMessage, persistMessageUntilDismiss } from '@/utils/message.js'

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


$apple-blue: var(--color-primary);
$action-blue: var(--color-primary-hover);
$white: var(--text-white);

$text-default: rgba(24, 32, 46, 0.86);
$text-dark: rgba(0, 0, 0, 0.85);
$text-action-info: rgba(20, 34, 56, 0.88);

$toast-enter-easing: cubic-bezier(0.175, 0.885, 0.32, 1.275);
$toast-leave-easing: cubic-bezier(0.25, 0.46, 0.45, 0.94);

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

@mixin toast-icon($background, $font-size, $color: null) {
  width: 24px;
  height: 24px;
  font-size: $font-size;
  font-weight: 700;
  background: $background;
  border-radius: 50%;

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
  left: 50%;
  z-index: 99999;
  display: flex;
  gap: 10px;
  align-items: center;
  max-width: min(420px, calc(100vw - 32px));
  padding: 12px 14px;
  color: $text-default;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.68),
    rgba(242, 247, 255, 0.44)
  );
  border: 1px solid rgba(255, 255, 255, 0.42);
  border-radius: 22px;
  box-shadow:
    0 18px 48px rgba(31, 45, 74, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  transform: translateX(-50%);

  @include glass-blur(22px, 180%);

  &.has-action {
    top: 20dvh;
    right: 28px;
    left: auto;
    transform: none;
  }

  &.success {
    color: $white;
    background: linear-gradient(
      135deg,
      rgba(52, 199, 89, 0.85),
      rgba(48, 209, 88, 0.8)
    );
    border-color: rgba(52, 199, 89, 0.5);

    .toast-icon {
      @include toast-icon(rgba(255, 255, 255, 0.25), 14px);
    }
  }

  &.error {
    color: $white;
    background: linear-gradient(
      135deg,
      rgba(255, 59, 48, 0.85),
      rgba(255, 69, 58, 0.8)
    );
    border-color: rgba(255, 59, 48, 0.5);

    .toast-icon {
      @include toast-icon(rgba(255, 255, 255, 0.25), 16px);
    }
  }

  &.warning {
    color: $text-dark;
    background: linear-gradient(
      135deg,
      rgba(255, 204, 0, 0.85),
      rgba(255, 214, 10, 0.8)
    );
    border-color: rgba(255, 204, 0, 0.5);

    .toast-icon {
      @include toast-icon(rgba(0, 0, 0, 0.15), 16px);
    }
  }

  &.info {
    color: $white;
    background: linear-gradient(
      135deg,
      rgba(0, 122, 255, 0.85),
      rgba(10, 132, 255, 0.8)
    );
    border-color: rgba(0, 122, 255, 0.5);

    .toast-icon {
      @include toast-icon(rgba(255, 255, 255, 0.25), 14px);
    }

    &.has-action {
      color: $text-action-info;
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.6),
        rgba(234, 243, 255, 0.4)
      );
      border-color: rgba(255, 255, 255, 0.48);

      .toast-icon {
        color: $apple-blue;
        background: rgba(0, 122, 255, 0.13);
      }

      .toast-action {
        color: $action-blue;
        background: rgba(0, 122, 255, 0.12);
        box-shadow: inset 0 0 0 1px rgba(0, 122, 255, 0.18);

        &:hover {
          background: rgba(0, 122, 255, 0.18);
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

  @media (max-width: 768px) {
    top: auto;
    right: 16px;
    bottom: 22px;
    max-width: calc(100vw - 32px);
    padding: 12px 14px;
    font-size: 14px;
    border-radius: 18px;

    .toast-icon {
      width: 22px;
      height: 22px;
      font-size: 13px;
    }

    &.has-action {
      top: auto;
      right: 16px;
      bottom: 20dvh;
      transform: none;
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
  background: rgba(255, 255, 255, 0.46);
  border: 0;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.38);

  @include glass-blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.62);
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
    transform: translateX(-50%) translateY(-18px) scale(0.96);
  }

  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

@keyframes toast-out {
  0% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }

  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-12px) scale(0.98);
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

