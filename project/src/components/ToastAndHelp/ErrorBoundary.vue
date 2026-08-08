<template>
  <slot v-if="!hasError" />
  <div v-else class="error-boundary-fallback">
    <div class="error-boundary-card">
      <h2 class="error-boundary-title">{{ $t('common.label.error') }}</h2>
      <p class="error-boundary-message">頁面渲染出現異常，請嘗試刷新</p>
      <button class="error-boundary-btn" @click="resetError">
        重試
      </button>
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
  hasError.value = false
}
</script>

<style lang="scss" scoped>
.error-boundary-fallback {
  @include flex-center;
  min-height: 60vh;
  padding: 40px 20px;
}

.error-boundary-card {
  text-align: center;
  max-width: 400px;
}

.error-boundary-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-slate);
  margin: 0 0 8px;
}

.error-boundary-message {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 20px;
}

.error-boundary-btn {
  padding: 8px 20px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background: var(--bg-hover);
  }
}
</style>
