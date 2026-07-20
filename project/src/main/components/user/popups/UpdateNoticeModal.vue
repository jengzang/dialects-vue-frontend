<template>
  <AppModal
    v-if="mode === 'modal'"
    :model-value="visible"
    size="sm"
    width="100%"
    max-width="600px"
    max-height="80vh"
    :close-label="$t('common.button.close')"
    :show-close="false"
    @update:modelValue="handleClose"
  >
    <template #header>
      <div class="update-notice-header">
        <div class="update-icon">🎊</div>
        <div class="update-notice-header-main">
          <h2 class="update-notice-title">{{ title || $t('common.updateNotice.title') }}</h2>
          <p class="update-version">{{ versionLine }}</p>
        </div>
        <button
          class="close-btn close-btn-lg close-btn-inline"
          :aria-label="$t('common.button.close')"
          @click="handleClose"
        >
          ×
        </button>
      </div>
    </template>

    <div class="update-notice-content">
      <template v-if="items.length > 0">
        <div
          v-for="(item, index) in items"
          :key="index"
          class="update-item"
        >
          <span class="item-icon">{{ item.icon }}</span>
          <span class="item-text">
            <strong>{{ item.strong }}</strong>
            <template v-if="item.text"> - {{ item.text }}</template>
          </span>
        </div>
      </template>
      <slot v-else>
        <div class="update-item">
          <span class="item-icon">✦</span>
          <span class="item-text">{{ $t('common.updateNotice.defaultItem') }}</span>
        </div>
      </slot>
    </div>

    <template #footer>
        <CheckBox
          class="no-show-checkbox"
          :model-value="dontShowAgain"
          @update:modelValue="dontShowAgain = $event"
        >
          {{ $t('common.updateNotice.dontShowAgain') }}
        </CheckBox>
        <button class="confirm-btn" @click="handleConfirm">
          {{ $t('common.updateNotice.confirm') }}
        </button>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AppModal from '@/components/common/AppModal.vue'
import CheckBox from '@/components/selector/CheckBox.vue'
import { showInfo } from '@/utils/ui/message.js'

const UPDATE_NOTICE_DISMISS_STORAGE_KEY = 'update-notice-dismissed'
const UPDATE_NOTICE_LAST_SHOWN_PREFIX = 'update-notice-last-shown'
const UPDATE_NOTICE_COOLDOWN_MS = 24 * 60 * 60 * 1000

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  version: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  lastUpdateDate: {
    type: String,
    default: ''
  },
  items: {
    type: Array,
    default: () => []
  },
  autoShow: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'modal',
    validator: (v) => ['modal', 'showinfo'].includes(v)
  }
})

const emit = defineEmits(['close', 'confirm', 'update:visible'])

const dontShowAgain = ref(false)
const versionLine = computed(() => {
  if (props.lastUpdateDate) {
    return `${props.version} · ${props.lastUpdateDate}`
  }

  return props.version
})

const buildSummaryText = () => {
  const headline = props.title || '更新日誌'
  const lines = props.items.map((item) => `${item.icon} ${item.strong}`)
  return `${headline}  ${versionLine.value}\n${lines.join('\n')}`
}

const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}

const handleConfirm = () => {
  if (dontShowAgain.value) {
    const dismissedVersions = JSON.parse(localStorage.getItem(UPDATE_NOTICE_DISMISS_STORAGE_KEY) || '[]')
    if (!dismissedVersions.includes(props.version)) {
      dismissedVersions.push(props.version)
      localStorage.setItem(UPDATE_NOTICE_DISMISS_STORAGE_KEY, JSON.stringify(dismissedVersions))
    }
  }
  emit('confirm')
  emit('update:visible', false)
  emit('close')
}

const shouldAutoShow = () => {
  const dismissedVersions = JSON.parse(localStorage.getItem(UPDATE_NOTICE_DISMISS_STORAGE_KEY) || '[]')
  if (dismissedVersions.includes(props.version)) {
    return false
  }

  const lastShownKey = `${UPDATE_NOTICE_LAST_SHOWN_PREFIX}:${props.version}`
  const lastShownAt = Number(localStorage.getItem(lastShownKey))
  const now = Date.now()

  if (Number.isFinite(lastShownAt) && now - lastShownAt < UPDATE_NOTICE_COOLDOWN_MS) {
    return false
  }

  localStorage.setItem(lastShownKey, String(now))
  return true
}

watch(() => props.visible, (val) => {
  if (val && props.mode === 'showinfo') {
    emit('update:visible', false)
    showInfo(buildSummaryText(), 8000)
  }
})

onMounted(() => {
  if (!props.autoShow || !shouldAutoShow()) return

  if (props.mode === 'showinfo') {
    showInfo(buildSummaryText(), 8000)
  } else {
    emit('update:visible', true)
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$primary: var(--color-primary);
$primary-dark: var(--color-primary-hover);
$text-main: var(--text-primary);
$text-secondary: var(--text-secondary);
$text-secondary-strong: var(--text-tertiary);
$text-white: var(--text-white);

$primary-background: rgba(var(--color-primary-rgb), 0.05);
$primary-background-hover: rgba(var(--color-primary-rgb), 0.08);
$primary-border-light: rgba(var(--color-primary-rgb), 0.1);
$primary-shadow: rgba(var(--color-primary-rgb), 0.3);
$primary-shadow-hover: rgba(var(--color-primary-rgb), 0.4);

$card-radius: 12px;
$transition-fast: 0.2s;
$transition-button: 0.25s;

.update-notice-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;

  .update-icon {
    font-size: 3rem;
    line-height: 1;
    animation: bounce 1s ease infinite;
  }

  .update-notice-header-main {
    flex: 1;
    min-width: 0;
    text-align: center;
  }

  .update-notice-title {
    margin: 0;
    color: $primary;
    white-space: nowrap;
    font-size: 1.75rem;
    font-weight: 700;
  }

  .update-version {
    margin: 0;
    color: $text-secondary;
    white-space: nowrap;
    font-size: 0.9375rem;
    font-weight: 500;
  }
}

.update-notice-content {
  padding: 2rem;
}

.update-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  padding: 0.875rem 1rem;
  background: $primary-background;
  border-left: 3px solid $primary;
  border-radius: $card-radius;
  transition:
    background $transition-fast ease,
    transform $transition-fast ease;

  &:hover {
    background: $primary-background-hover;
    transform: translateX(4px);
  }

  &:last-child {
    margin-bottom: 0;
  }

  .item-icon {
    flex-shrink: 0;
    font-size: 1.25rem;
    line-height: 1.5;
  }

  .item-text {
    color: $text-main;
    font-size: 0.9375rem;
    font-weight: 500;
    line-height: 1.8 !important;

    * {
      line-height: 1.8 !important;
    }
  }
}

.no-show-checkbox {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm2);
  color: $text-secondary-strong;
  font-size: 0.9375rem;
  cursor: pointer;
  user-select: none;
  transition: background $transition-fast ease;

  &:hover {
    background: $primary-background;
  }
}

.confirm-btn {
  padding: 0.75rem 1rem;
  background: var(--action-primary-bg);
  border: none;
  border-radius: $card-radius;
  box-shadow: var(--action-primary-shadow);
  color: var(--action-primary-text);
  white-space: nowrap;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    box-shadow $transition-button ease,
    transform $transition-button ease;

  &:hover {
    background: var(--action-primary-bg-hover);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}

@media (max-width: 600px) {
  .update-notice-header {
    gap: 0.75rem;

    .update-icon {
      font-size: 2.5rem;
    }

    .update-notice-title {
      font-size: 1.5rem;
    }
  }

  .update-notice-content {
    padding: 1.5rem;
  }
}
</style>
