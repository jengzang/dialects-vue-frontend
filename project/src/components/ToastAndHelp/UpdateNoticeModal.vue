<template>
  <AppModal
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
<!--      <div class="update-notice-footer">-->
        <label class="no-show-checkbox">
          <input v-model="dontShowAgain" type="checkbox" />
          <span>{{ $t('common.updateNotice.dontShowAgain') }}</span>
        </label>
        <button class="confirm-btn" @click="handleConfirm">
          {{ $t('common.updateNotice.confirm') }}
        </button>
<!--      </div>-->
    </template>
  </AppModal>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppModal from '@/components/common/AppModal.vue'

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

onMounted(() => {
  if (props.autoShow && shouldAutoShow()) {
    emit('update:visible', true)
  }
})
</script>

<style scoped>
.update-notice-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.update-icon {
  font-size: 3rem;
  line-height: 1;
  animation: bounce 1s ease infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.update-notice-header-main {
  flex: 1;
  min-width: 0;
  text-align: center;
}

.update-notice-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #007aff;
  white-space: nowrap;
  margin: 0;
}

.update-version {
  font-size: 0.9375rem;
  color: rgba(0, 0, 0, 0.6);
  font-weight: 500;
  margin: 0;
  white-space: nowrap;
}

.update-notice-content {
  padding: 2rem;
}

.update-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: rgba(0, 122, 255, 0.05);
  border-radius: 12px;
  margin-bottom: 0.75rem;
  border-left: 3px solid #007aff;
  transition: all 0.2s ease;
}

.update-item:hover {
  background: rgba(0, 122, 255, 0.08);
  transform: translateX(4px);
}

.update-item:last-child {
  margin-bottom: 0;
}

.item-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  line-height: 1.5;
}

.item-text {
  font-size: 0.9375rem;
  color: #1d1d1f;
  line-height: 1.8 !important;
  font-weight: 500;
}

.item-text * {
  line-height: 1.8 !important;
}

.update-notice-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(0, 122, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.no-show-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 0.9375rem;
  color: rgba(0, 0, 0, 0.7);
  user-select: none;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.no-show-checkbox:hover {
  background: rgba(0, 122, 255, 0.05);
}

.no-show-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #007aff;
}

.confirm-btn {
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #007aff 0%, #005ecb 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
  white-space: nowrap;
}

.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0, 122, 255, 0.4);
}

.confirm-btn:active {
  transform: translateY(0);
}

@media (max-width: 600px) {
  .update-notice-header {
    gap: 0.75rem;
  }

  .update-icon {
    font-size: 2.5rem;
  }

  .update-notice-title {
    font-size: 1.5rem;
  }

  .update-notice-content {
    padding: 1.5rem;
  }

  .update-notice-footer {
    padding: 1.25rem 1.5rem;
  }
}
</style>
