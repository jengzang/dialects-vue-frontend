<template>
  <div class="yindian-match-section">
    <h4 class="yindian-match-title">{{ t('words.wordList.upload.useYindianData') }}</h4>
    <div class="yindian-match-row">
      <div class="yindian-input-wrapper">
        <input
          v-model="query"
          type="text"
          :placeholder="t('words.wordList.upload.yindianHint')"
          autocomplete="off"
          @input="onInput"
          @keydown.enter.prevent="confirm"
          @blur="onBlur"
        />
        <div v-if="suggestions.length" class="yindian-suggestions">
          <div
            v-for="item in suggestions"
            :key="item"
            class="yindian-suggest-item"
            @mousedown.prevent="applySuggestion(item)"
          >
            {{ item }}
          </div>
        </div>
      </div>
      <button
        class="glass-button"
        data-variant="primary"
        type="button"
        :disabled="!query.trim() || isLoading"
        @click="confirm"
      >
        {{ isLoading ? t('common.label.loading') : t('common.button.confirm') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { batchMatch, getLocationDetail } from '@/api'
import { showError, showSuccess, showWarning } from '@/utils/ui/message.js'
import { TONE_SOURCE_KEYS } from './vocabularyLocationFields.js'

const props = defineProps({
  draft: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['apply'])

const { t } = useI18n()
const query = ref('')
const suggestions = ref([])
const isLoading = ref(false)
let debounceTimer = null

function getLocationDetailRow(response) {
  if (Array.isArray(response?.data)) return response.data[0] || null
  if (response?.data && typeof response.data === 'object') return response.data
  return response && typeof response === 'object' ? response : null
}

function buildDraft(detail) {
  const draft = props.draft || {}
  const next = {
    ...draft,
    location_name: draft.location_name || detail?.['語言'] || '',
    coordinates: detail?.['經緯度'] || draft.coordinates,
    province: detail?.['省'] || draft.province,
    city: detail?.['市'] || draft.city,
    county: detail?.['縣'] || draft.county,
    town: detail?.['鎮'] || draft.town,
    administrative_village: detail?.['行政村'] || draft.administrative_village,
    natural_village: detail?.['自然村'] || draft.natural_village,
    yindian_region: detail?.['音典分區'] || draft.yindian_region,
    atlas_region: detail?.['地圖集二分區'] || draft.atlas_region,
  }

  TONE_SOURCE_KEYS.forEach((sourceKey, index) => {
    const key = `t${index + 1}`
    next[key] = detail?.[sourceKey] || draft[key]
  })

  return next
}

async function fillFromYindian(name) {
  if (!name || isLoading.value) return
  isLoading.value = true
  try {
    const response = await getLocationDetail(name)
    const detail = getLocationDetailRow(response)
    if (!detail) {
      showWarning(t('words.wordList.upload.yindianNotFound'))
      return
    }
    emit('apply', buildDraft(detail))
    showSuccess(t('words.wordList.upload.yindianFilled'))
  } catch (error) {
    showError(error.message || t('words.wordList.upload.yindianFailed'))
  } finally {
    isLoading.value = false
  }
}

function onInput() {
  clearTimeout(debounceTimer)
  const value = query.value.trim()
  if (!value) {
    suggestions.value = []
    return
  }
  debounceTimer = setTimeout(async () => {
    try {
      const results = await batchMatch(value, false)
      const items = Array.isArray(results) ? results.flatMap((r) => r.items || []) : []
      suggestions.value = [...new Set(items)]
    } catch {
      suggestions.value = []
    }
  }, 300)
}

function onBlur() {
  setTimeout(() => {
    suggestions.value = []
  }, 200)
}

function applySuggestion(item) {
  query.value = item
  suggestions.value = []
  return fillFromYindian(item)
}

function confirm() {
  const name = query.value.trim()
  if (!name || isLoading.value) return
  return fillFromYindian(name)
}
</script>

<style scoped lang="scss">
.yindian-match-section {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--color-primary-border);
  padding: 8px 0;
  gap: 8px;
}

.yindian-match-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
}

.yindian-match-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.yindian-input-wrapper {
  // flex: 1;
  position: relative;

  input {
    // width: 100%;
    padding: 10px 12px;
    font-size: 0.9rem;
    background: var(--surface-panel);
    border: 1px solid var(--border-glass);
    border-radius: var(--radius-md);
    color: var(--text-deep);
    outline: none;

    &:focus {
      border-color: var(--action-primary-border);
    }
  }
}

.yindian-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  margin-top: 4px;
  max-height: 200px;
  overflow-y: auto;
  background: var(--surface-panel);
  backdrop-filter: blur(4px);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-glass-hover);
}

.yindian-suggest-item {
  padding: 8px 12px;
  font-size: 0.9rem;
  color: var(--text-deep);
  cursor: pointer;

  &:hover {
    background: var(--border-control-focus);
  }
}
</style>
