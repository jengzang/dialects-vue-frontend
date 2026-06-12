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
          class="toast-dismiss"
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

<style scoped>
/* 🍎 苹果液态玻璃风格 Toast */
.global-toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 99999;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: min(420px, calc(100vw - 32px));
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.68), rgba(242, 247, 255, 0.44));
  color: rgba(24, 32, 46, 0.86);
  box-shadow: 0 18px 48px rgba(31, 45, 74, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(22px) saturate(180%);
  -webkit-backdrop-filter: blur(22px) saturate(180%);
}

.global-toast.has-action {
  left: auto;
  right: 28px;
  top:20dvh;
  transform: none;
}

/* ✅ 成功消息 - 苹果绿 */
.global-toast.success {
  background: linear-gradient(
    135deg,
    rgba(52, 199, 89, 0.85),
    rgba(48, 209, 88, 0.80)
  );
  border-color: rgba(52, 199, 89, 0.5);
  color: white;
}

.global-toast.success .toast-icon {
  background: rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
}

/* ❌ 错误消息 - 苹果红 */
.global-toast.error {
  background: linear-gradient(
    135deg,
    rgba(255, 59, 48, 0.85),
    rgba(255, 69, 58, 0.80)
  );
  border-color: rgba(255, 59, 48, 0.5);
  color: white;
}

.global-toast.error .toast-icon {
  background: rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
}

/* ⚠️ 警告消息 - 苹果橙黄 */
.global-toast.warning {
  background: linear-gradient(
    135deg,
    rgba(255, 204, 0, 0.85),
    rgba(255, 214, 10, 0.80)
  );
  border-color: rgba(255, 204, 0, 0.5);
  color: rgba(0, 0, 0, 0.85);
}

.global-toast.warning .toast-icon {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
}

/* ℹ️ 提示消息 - 苹果蓝 */
.global-toast.info {
  background: linear-gradient(
    135deg,
    rgba(0, 122, 255, 0.85),
    rgba(10, 132, 255, 0.80)
  );
  border-color: rgba(0, 122, 255, 0.5);
  color: white;
}

.global-toast.info .toast-icon {
  background: rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
}

.global-toast.has-action.info {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(234, 243, 255, 0.4));
  border-color: rgba(255, 255, 255, 0.48);
  color: rgba(20, 34, 56, 0.88);
}

.global-toast.has-action.info .toast-icon {
  background: rgba(0, 122, 255, 0.13);
  color: #007aff;
}

.toast-message {
  flex: 1;
  min-width: 0;
  line-height: 1.4;
}

.toast-action,
.toast-dismiss {
  border: 0;
  font: inherit;
  cursor: pointer;
  white-space: nowrap;
}

.toast-action {
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.46);
  color: inherit;
  font-weight: 600;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.38);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.toast-action:hover {
  background: rgba(255, 255, 255, 0.62);
}

.global-toast.has-action.info .toast-action {
  background: rgba(0, 122, 255, 0.12);
  color: #0067d8;
  box-shadow: inset 0 0 0 1px rgba(0, 122, 255, 0.18);
}

.global-toast.has-action.info .toast-action:hover {
  background: rgba(0, 122, 255, 0.18);
}

.toast-dismiss {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.28);
  color: inherit;
  font-size: 18px;
  line-height: 1;
  opacity: 0.72;
}

.toast-dismiss:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.44);
}

/* 🎬 苹果风格动画 - 轻量上浮 */
.toast-fade-enter-active {
  animation: toast-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-fade-leave-active {
  animation: toast-out 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.global-toast.has-action.toast-fade-enter-active {
  animation-name: toast-in-side;
}

.global-toast.has-action.toast-fade-leave-active {
  animation-name: toast-out-side;
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

/* 📱 移动端适配 */
@media (max-width: 768px) {
  .global-toast {
    top: auto;
    right: 16px;
    bottom: 22px;
    font-size: 14px;
    padding: 12px 14px;
    max-width: calc(100vw - 32px);
    border-radius: 18px;
  }

  .global-toast .toast-icon {
    width: 22px;
    height: 22px;
    font-size: 13px;
  }
  .global-toast.has-action {
    right: 16px;
    top: auto;
    bottom: 20dvh;
    transform: none;
  }
}
</style>
