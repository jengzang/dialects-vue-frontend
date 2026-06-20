<template>
  <AppModal
    :model-value="visible"
    size="lg"
    :title="t('query.components.zhongguSelector.detailsTitle')"
    :close-label="t('common.button.close')"
    @update:modelValue="handleClose"
  >
    <div class="zhonggu-modal-content">
      <div v-for="item in normalizedResults" :key="item.key" class="full-item">
        <div class="full-item-header">
          <span class="combo-name">{{ formatTitle(item.query) }}</span>
          <span class="count-badge">
            {{ t('query.components.zhongguSelector.charCount', { count: item.char_count }) }}
          </span>
        </div>
        <div v-if="item.rows.length > 0" class="detail-rows">
          <div v-for="(row, rowIndex) in item.rows" :key="`${item.key}-${rowIndex}`" class="detail-row">
            <div class="detail-row-meta">
              <span class="detail-row-location">{{ row.地點 }}</span>
              <span class="detail-row-value">{{ getGroupValueText(row) }}</span>
              <span class="detail-row-count">{{ row.字數 }}</span>
            </div>
            <div class="full-chars">
              <span
                v-for="(char, charIndex) in row['對應字'] || []"
                :key="`${item.key}-${rowIndex}-${char}-${charIndex}`"
                :class="getReadingClass(getZhongGuCharReadingType(row, char), 'reading-char')"
              >
                {{ char }}
              </span>
            </div>
          </div>
        </div>
        <div v-else class="full-chars">
          <span
            v-for="(char, charIndex) in item.chars"
            :key="`${item.key}-${char}-${charIndex}`"
            class="reading-char"
          >
            {{ char }}
          </span>
        </div>
      </div>
    </div>
  </AppModal>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'
import { getReadingClass, getZhongGuCharReadingType } from '@/main/utils/ResultTable.js'

const props = defineProps({
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

const normalizedResults = computed(() => {
  return (Array.isArray(props.results) ? props.results : []).map((item, index) => {
    const rows = Array.isArray(item?.data)
      ? item.data.flat().filter(row => row && typeof row === 'object')
      : []

    const fallbackChars = Array.isArray(item?.chars)
      ? item.chars
      : rows.flatMap(row => Array.isArray(row?.對應字) ? row.對應字 : [])

    return {
      key: item?.query || `zhonggu-${index}`,
      query: item?.query || '',
      char_count: item?.char_count ?? fallbackChars.length,
      chars: fallbackChars,
      rows
    }
  })
})

function getGroupValueText(row) {
  const groupValue = row?.分組值
  if (!groupValue || typeof groupValue !== 'object') return ''
  return Object.values(groupValue).filter(Boolean).join(' · ')
}

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

.detail-rows {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-row {
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.48);
  border: 1px solid rgba(255, 255, 255, 0.58);
}

.detail-row-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
}

.detail-row-location {
  color: var(--color-blue-custom);
  font-weight: 700;
}

.detail-row-value,
.detail-row-count {
  color: var(--text-secondary, #5f6b7a);
}

.full-chars {
  font-size: 18px;
  line-height: 1.6;
  color: var(--text-dark);
  letter-spacing: 0.5em;
  font-variant-ligatures: none;
  word-break: break-word;
}

.reading-char {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.12em;
  margin-right: 0.08em;
  border-radius: 0.35em;
  border: 1px solid transparent;
}

.reading-char--polyphonic {
  color: darkred;
  font-weight: 600;
}

.reading-char--wendu {
  color: #b26a00;
  background: rgba(255, 204, 0, 0.14);
  border-color: rgba(255, 204, 0, 0.32);
}

.reading-char--baidu {
  color: #7e3af2;
  background: rgba(175, 82, 222, 0.12);
  border-color: rgba(175, 82, 222, 0.3);
}

.reading-char--both {
  color: #5e5ce6;
  background: rgba(94, 92, 230, 0.12);
  border-color: rgba(94, 92, 230, 0.3);
}
</style>
