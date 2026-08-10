<template>
  <slot v-if="!hasError" />
  <div
    v-else
    class="error-boundary-fallback"
  >
    <div class="error-boundary-card">
      <div
        class="error-boundary-icon"
        aria-hidden="true"
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
          />
          <line
            x1="12"
            y1="8"
            x2="12"
            y2="12"
          />
          <line
            x1="12"
            y1="16"
            x2="12.01"
            y2="16"
          />
        </svg>
      </div>
      <h2 class="error-boundary-title">
        {{ $t('common.label.error') }}
      </h2>
      <p class="error-boundary-message">
        {{ $t('common.errorBoundary.message') }}
      </p>
      <div class="error-boundary-actions">
        <button
          class="error-boundary-btn error-boundary-btn--primary"
          @click="resetError"
        >
          {{ $t('common.errorBoundary.retry') }}
        </button>
        <button
          class="error-boundary-btn error-boundary-btn--secondary"
          @click="goToFeedback"
        >
          {{ $t('common.errorBoundary.feedback') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onErrorCaptured, ref } from 'vue'

const hasError = ref(false)

onErrorCaptured((err, instance, info) => {
  console.error('[ErrorBoundary]', err, info)
  hasError.value = true
  return false
})

function resetError() {
  window.location.reload()
}

function goToFeedback() {
  sessionStorage.setItem('__error_boundary_redirect', '/menu/about/suggestion')
  window.location.reload()
}
</script>

<style lang="scss" scoped>
@use '@/styles/global/mixins' as *;

.error-boundary-fallback {
  @include flex-center;
  min-height: 60vh;
  padding: 40px 20px;
}

.error-boundary-card {
  text-align: center;
  max-width: 420px;
  padding: 40px 36px;
  background: var(--surface-glass-floating);
  border: 1px solid var(--glass-10);
  border-radius: var(--radius-xl);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  box-shadow: var(--shadow-lg);
}

.error-boundary-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(var(--color-primary-rgb), 0.08);
  color: var(--color-primary);
  margin-bottom: 20px;
}

.error-boundary-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-deep);
  margin: 0 0 8px;
}

.error-boundary-message {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 28px;
}

.error-boundary-actions {
  @include flex-center;
  gap: 12px;
  flex-wrap: wrap;
}

.error-boundary-btn {
  padding: 10px 24px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;

  &--primary {
    background: var(--color-primary);
    color: #fff;

    &:hover {
      background: var(--color-primary-hover);
    }
  }

  &--secondary {
    background: var(--surface-glass-button);
    color: var(--text-primary);
    border: 1px solid var(--glass-15);

    &:hover {
      background: var(--surface-glass-button-hover);
    }
  }
}
</style>
