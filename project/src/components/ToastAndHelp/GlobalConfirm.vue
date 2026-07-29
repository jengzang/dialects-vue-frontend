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
        <span class="confirm-icon">⚠️</span>
        <h3 class="confirm-title">{{ confirmState.title }}</h3>
      </div>
    </template>

    <div class="confirm-message">
      {{ confirmState.message }}
    </div>

    <div class="confirm-actions">
      <button class="confirm-btn global-action-btn global-action-btn-secondary cancel-btn" @click="handleCancel">
        {{ confirmState.cancelText }}
      </button>
      <button class="confirm-btn global-action-btn global-action-btn-primary" @click="handleConfirm">
        {{ confirmState.confirmText }}
      </button>
    </div>
  </AppModal>
</template>

<script setup>
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

.confirm-btn {
  @media (max-width: 768px) {
    padding: 10px 20px;
    font-size: 15px;
  }
}
</style>
