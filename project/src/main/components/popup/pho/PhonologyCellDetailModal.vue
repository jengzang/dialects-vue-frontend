<template>
  <AppModal
    :model-value="visible"
    size="sm"
    :title="titleText"
    :close-label="t('common.button.close')"
    :z-index="100100"
    @update:modelValue="handleVisibilityChange"
  >
    <div class="cell-detail-content">
      <div v-if="toneSections.length === 0" class="empty-state">
        {{ t('result.noData') }}
      </div>

      <div v-else class="tone-section-list">
        <section
          v-for="section in toneSections"
          :key="section.tone"
          class="tone-section"
        >
          <div class="tone-title">{{ section.tone }}</div>

          <div
            v-for="item in section.items"
            :key="`${section.tone}-${item.label}`"
            class="detail-item"
          >
            <div class="item-head">
              <span class="item-label">{{ item.label }}</span>
              <span class="item-count">{{ item.count }}</span>
            </div>
            <div class="item-chars">
              <div v-for="(detail, index) in item.details || []" :key="`${section.tone}-${item.label}-${index}`" class="detail-row">
                <span class="detail-char">{{ detail.char }}</span>
                <span class="detail-values">{{ detail.values.join(' / ') }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </AppModal>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'
import { READING_COLORS } from '@/main/constants/readingColors.js'

const { t } = useI18n()

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    default: ''
  },
  initial: {
    type: String,
    default: ''
  },
  final: {
    type: String,
    default: ''
  },
  toneSections: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close'])

const titleText = computed(() => {
  const location = props.location || ''
  const initial = props.initial || t('result.phonologyTable.zeroInitial')
  const final = props.final || t('result.phonologyTable.zeroFinal')

  return location ? `${location} - ${initial}·${final}` : `${initial}·${final}`
})

function handleVisibilityChange(value) {
  if (!value) {
    emit('close')
  }
}
</script>

<style scoped>
.cell-detail-content {
  min-height: 0;
}

.empty-state {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
}

.tone-section-list {
  display: grid;
  gap: 12px;
}

.tone-section {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.78);
  overflow: hidden;
}

.tone-title {
  padding: 10px 12px;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(37, 99, 235, 0.04));
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.detail-item {
  padding: 10px 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.detail-item:first-of-type {
  border-top: none;
}

.item-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.item-label {
  font-size: 13px;
  font-weight: 700;
  color: #111827;
}

.item-count {
  font-size: 12px;
  color: #4b5563;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 999px;
  padding: 1px 8px;
}

.item-chars {
  font-size: 13px;
  line-height: 1.6;
  color: #1f2937;
  word-break: break-all;
}

.detail-row {
  display: flex;
  gap: 0.5em;
  align-items: baseline;
}

.detail-char {
  font-weight: 600;
}

.detail-values {
  color: #4b5563;
}

.detail-char--wendu {
  color: v-bind('READING_COLORS.wendu');
}

.detail-char--baidu {
  color: v-bind('READING_COLORS.baidu');
}

.detail-char--both {
  color: v-bind('READING_COLORS.both');
}

.detail-char--polyphonic {
  color: v-bind('READING_COLORS.polyphonic');
}
</style>
