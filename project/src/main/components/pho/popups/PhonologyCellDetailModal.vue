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
import { READING_COLORS } from '@/main/config/readingColors.js'

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

<style scoped lang="scss">
$text-main: var(--text-primary);
$text-body: var(--text-deep);
$text-secondary: var(--text-slate);

.cell-detail-content {
  min-height: 0;
}

.empty-state {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-secondary;
}

.tone-section-list {
  display: grid;
  gap: 12px;
}

.tone-section {
  overflow: hidden;
  background: var(--glass-80);
  border: 1px solid var(--bg-hover-strong);
  border-radius: 12px;
}

.tone-title {
  padding: 10px 12px;
  background: linear-gradient(
    135deg,
    rgba(var(--color-primary-rgb), 0.12),
    rgba(var(--color-primary-rgb), 0.04)
  );
  border-bottom: 1px solid var(--bg-overlay-light2);
  color: var(--text-deep);
  font-size: 14px;
  font-weight: 700;
}

.detail-item {
  padding: 10px 12px;
  border-top: 1px solid var(--bg-hover-medium);
}

.item-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.item-label {
  color: $text-main;
  font-size: 13px;
  font-weight: 700;
}

.item-count {
  padding: 1px 8px;
  background: var(--bg-hover-medium);
  border-radius: 999px;
  color: $text-secondary;
  font-size: 12px;
}

.item-chars {
  color: $text-body;
  word-break: break-all;
  font-size: 13px;
  line-height: 1.6;
}

.detail-row {
  display: flex;
  align-items: baseline;
  gap: 0.5em;
}

.detail-char {
  font-weight: 600;
}

.detail-values {
  color: $text-secondary;
}
</style>
