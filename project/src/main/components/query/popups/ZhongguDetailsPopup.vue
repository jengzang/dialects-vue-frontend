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

<style scoped lang="scss">
$accent-color: var(--color-primary-hover);
$accent-background: var(--bg-blue-tint);
$content-gap: 24px;
$item-padding-bottom: 16px;
$header-gap: 10px;

.zhonggu-modal-content {
  @include flex-col;
  gap: $content-gap;

  .full-item {
    padding-bottom: $item-padding-bottom;
    border-bottom: 1px dashed var(--border-medium);

    &:last-child {
      padding-bottom: 0;
      border-bottom: none;
    }
  }
}

.full-item-header {
  display: flex;
  align-items: center;
  gap: $header-gap;
  margin-bottom: $header-gap;

  .combo-name {
    color: $accent-color;
    font-size: 16px;
    font-weight: 700;
  }

  .count-badge {
    padding: 2px 8px;
    background: $accent-background;
    border-radius: var(--radius-md);
    color: $accent-color;
    font-size: 12px;
  }
}

.full-chars {
  color: var(--text-dark);
  word-break: break-word;
  font-size: 18px;
  line-height: 1.6;
  letter-spacing: 0.5em;
  font-variant-ligatures: none;
}
</style>
