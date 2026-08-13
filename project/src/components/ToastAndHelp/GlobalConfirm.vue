<template>
  <AppModal
    :model-value="confirmState.show"
    size="sm"
    width="90%"
    max-width="400px"
    :show-close="false"
    :z-index="100000"
    @update:modelValue="handleCancel"
  >
    <template #header>
      <div class="confirm-header">
        <span class="confirm-icon"><InlineIcon icon="⚠️" /></span>
        <h3 class="confirm-title">{{ confirmState.title }}</h3>
      </div>
    </template>

    <div class="confirm-message">
      {{ confirmState.message }}
    </div>

    <div class="confirm-actions">
      <button class="confirm-btn action-btn action-btn-secondary cancel-btn" @click="handleCancel">
        {{ confirmState.cancelText }}
      </button>
      <button class="confirm-btn action-btn action-btn-primary" @click="handleConfirm">
        {{ confirmState.confirmText }}
      </button>
    </div>
  </AppModal>
</template>

<script setup>
import InlineIcon from '@/components/common/InlineIcon.vue'
import AppModal from '@/components/common/AppModal.vue'
import { confirmState, resolveConfirm } from '@/utils/ui/message.js'

function handleConfirm() {
  resolveConfirm(true)
}

function handleCancel() {
  resolveConfirm(false)
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$desktop-gap: 12px;
$mobile-gap: 10px;

/* 苹果液态玻璃风格确认对话框 */
.confirm-header {
  @include flex-col;
  gap: $desktop-gap;
  align-items: center;
  width: 100%;

  @media (max-width: 768px) {
    gap: $mobile-gap;
  }
}

.confirm-icon {
  font-size: 48px;
  line-height: 1;
  filter: drop-shadow(0 2px 8px rgba(var(--color-gold-rgb), 0.3));

  @media (max-width: 768px) {
    font-size: 40px;
  }
}

.confirm-title {
  margin: 0;
  color: var(--text-dark-alpha);
  font-size: 20px;
  font-weight: 600;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 18px;
  }
}

.confirm-message {
  padding: 0 0 24px;
  color: var(--text-dark-medium);
  font-size: 15px;
  line-height: 1.5;
  text-align: center;
  white-space: pre-line;

  @media (max-width: 768px) {
    padding-bottom: 20px;
    font-size: 14px;
  }
}

.confirm-actions {
  display: flex;
  gap: $desktop-gap;
  padding: 0;

  @media (max-width: 768px) {
    gap: $mobile-gap;
  }
}

.action-btn {
  flex: 1;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
  position: relative;
  overflow: hidden;
}

.action-btn-secondary {
  background: var(--bg-hover) !important;
  color: var(--text-dark-medium) !important;
  border: 1px solid var(--bg-hover-strong) !important;
}

.action-btn-secondary:hover {
  background: var(--bg-overlay-light2);
  transform: translateY(-1px);
}

.action-btn-secondary:active {
  transform: translateY(0);
}

.action-btn-primary {
  background: var(--action-primary-bg);
  color: var(--action-primary-text);
  box-shadow: var(--action-primary-shadow);
}

.action-btn-primary:hover {
  background: var(--action-primary-bg-hover);
  transform: translateY(-1px);
  box-shadow: var(--action-primary-shadow);
}

.action-btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(var(--color-primary-rgb), 0.22);
}

.confirm-btn {
  @media (max-width: 768px) {
    padding: 10px 20px;
    font-size: 15px;
  }
}
</style>
