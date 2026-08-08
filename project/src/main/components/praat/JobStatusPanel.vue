<template>
  <div v-if="jobId && isVisible" class="job-status-panel main-glass-panel">
    <div class="panel-header">
      <div class="job-info">
        <span class="job-label">{{ t('praat.jobStatus.jobId') }}</span>
        <span class="job-id">{{ jobId }}</span>
      </div>
      <button v-if="status === 'queued' || status === 'processing'"
              class="cancel-button"
              @click="$emit('cancel')">
        {{ t('praat.jobStatus.cancel') }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="status === 'queued' || status === 'processing'" class="loading-content">
      <div class="ui-loading--page" aria-hidden="true"></div>
      <h3 class="loading-title">{{ t('praat.jobStatus.loading.title') }}</h3>
      <p class="loading-text">{{ stage || t('praat.jobStatus.loading.defaultText') }}</p>
      <div class="loading-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        </div>
        <span class="progress-text">{{ progress }}%</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="status === 'error' || status === 'failed'" class="error-content">
      <div class="error-icon"><InlineIcon icon="❌" /></div>
      <h3 class="error-title">{{ t('praat.jobStatus.error.title') }}</h3>
      <p class="error-text">{{ error || t('praat.jobStatus.error.defaultText') }}</p>
    </div>

    <!-- Completed State -->
    <div v-else-if="status === 'completed' || status === 'done'" class="completed-content">
      <div class="completed-icon"><InlineIcon icon="✅" /></div>
      <h3 class="completed-title">{{ t('praat.jobStatus.completed.title') }}</h3>
    </div>

    <div v-else-if="status === 'canceled'" class="canceled-content">
      <div class="canceled-icon"><InlineIcon icon="🟠" /></div>
      <h3 class="canceled-title">{{ t('praat.jobStatus.canceled.title') }}</h3>
    </div>
  </div>
</template>

<script setup>
import InlineIcon from '@/components/common/InlineIcon.vue'
import { ref, watch, onUnmounted } from "vue"
import { useI18n } from 'vue-i18n'

const props = defineProps({
  jobId: { type: String, default: null },
  status: { type: String, default: 'queued' },
  progress: { type: Number, default: 0 },
  stage: { type: String, default: null },
  error: { type: String, default: null }
})

defineEmits(['cancel'])
const { t } = useI18n()
const isVisible = ref(true)
let timer = null

watch(() => props.status, (newStatus) => {
  if (newStatus === 'completed' || newStatus === 'done') {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      isVisible.value = false
    }, 3000)
  } else {
    isVisible.value = true
  }
}, { immediate: true })

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$primary: var(--color-primary);
$primary-light: var(--color-cyan);

$error: var(--color-error-light);
$success: var(--color-success);
$warning: var(--color-warning);

$text-primary: var(--color-text-primary);
$text-secondary: var(--color-text-secondary);

$error-background: rgba(var(--color-error-light-rgb), 0.15);
$error-background-hover: rgba(var(--color-error-light-rgb), 0.25);
$error-border: rgba(var(--color-error-light-rgb), 0.3);
$error-border-hover: rgba(var(--color-error-light-rgb), 0.5);

$panel-divider: var(--glass-20);
$progress-background: rgba(0, 0, 0, 0.1);

$transition-duration: 0.3s;

@mixin status-content {
  @include flex-col;
  align-items: center;
  padding: 2rem 0;
  text-align: center;
}

@mixin status-icon {
  margin-bottom: 1rem;
  font-size: 3rem;
}

@mixin status-title($color) {
  color: $color;
  font-size: 1.3rem;
  font-weight: 600;
}

.job-status-panel {
  width: 95%;
  max-width: 800px;
  margin: 1rem auto;
  padding: 1rem;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid $panel-divider;

  .job-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .job-label {
    color: $text-secondary;
    font-size: 0.9rem;
  }

  .job-id {
    color: $text-primary;
    font-family: "Courier New", monospace;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .cancel-button {
    padding: 0.5rem 1rem;
    background: $error-background;
    border: 1px solid $error-border;
    border-radius: var(--radius-md);
    color: $error;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition:
      background $transition-duration ease,
      border-color $transition-duration ease;

    &:hover {
      background: $error-background-hover;
      border-color: $error-border-hover;
    }
  }
}

/* 加载状态 */
.loading-content {
  @include status-content;
}

.loading-title {
  margin-bottom: 0.5rem;
  color: $text-primary;
  font-size: 1.5rem;
  font-weight: 600;
}

.loading-text {
  margin-bottom: 2rem;
  color: $text-secondary;
  font-size: 1rem;
}

.loading-progress {
  @include flex-col;
  gap: 0.5rem;
  width: 100%;
  max-width: 400px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  overflow: hidden;
  background: $progress-background;
  border-radius: var(--radius-xs);

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, $primary, $primary-light);
    border-radius: var(--radius-xs);
    transition: width $transition-duration ease;
  }
}

.progress-text {
  color: $primary;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 600;
}

/* 错误状态 */
.error-content {
  @include status-content;
}

.error-icon {
  @include status-icon;
}

.error-title {
  margin-bottom: 0.5rem;

  @include status-title($error);
}

.error-text {
  color: $text-secondary;
  font-size: 1rem;
}

/* 完成状态 */
.completed-content {
  @include status-content;
}

.completed-icon {
  @include status-icon;
}

.completed-title {
  @include status-title($success);
}

/* 已取消状态 */
.canceled-content {
  @include status-content;
}

.canceled-icon {
  @include status-icon;
}

.canceled-title {
  @include status-title($warning);
}
</style>
