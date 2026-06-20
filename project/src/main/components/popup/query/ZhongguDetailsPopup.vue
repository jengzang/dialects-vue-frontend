<template>
  <AppModal
    :model-value="visible"
    size="lg"
    :title="t('query.components.zhongguSelector.detailsTitle')"
    :close-label="t('common.button.close')"
    @update:modelValue="handleClose"
  >
    <div class="zhonggu-modal-content">
      <div v-for="item in results" :key="item.query" class="full-item">
        <div class="full-item-header">
          <span class="combo-name">{{ formatTitle(item.query) }}</span>
          <span class="count-badge">
            {{ t('query.components.zhongguSelector.charCount', { count: item.char_count }) }}
          </span>
        </div>
        <div class="full-chars">
          {{ (item.chars || []).join('') }}
        </div>
      </div>
    </div>
  </AppModal>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'

defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  results: {
    type: Array,
    default: () => []
  },
  formatTitle: {
    type: Function,
    required: true
  }
})

const emit = defineEmits(['close'])
const { t } = useI18n()

function handleClose() {
  emit('close')
}
</script>

<style scoped>
.zhonggu-modal-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.full-item {
  border-bottom: 1px dashed var(--border-medium);
  padding-bottom: 16px;
}

.full-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.full-item-header {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.combo-name {
  font-size: 16px;
  font-weight: bold;
  color: var(--color-blue-custom);
}

.count-badge {
  background: var(--color-blue-custom-bg);
  color: var(--color-blue-custom);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.full-chars {
  font-size: 18px;
  line-height: 1.6;
  color: var(--text-dark);
  letter-spacing: 0.5em;
  font-variant-ligatures: none;
  word-break: break-word;
}
</style>
