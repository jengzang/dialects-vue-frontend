<template>
  <AppModal
    :model-value="modelValue"
    size="sm"
    width="640px"
    max-height="88dvh"
    :close-on-backdrop="false"
    @update:modelValue="handleVisibleChange"
  >
    <template #header>
      <div class="feature-record-header">
        <h4 class="feature-record-title">{{ isCreateMode ? t('customEntry.featureRecord.createTitle') : t('customEntry.featureRecord.editTitle') }}</h4>
        <button class="close-btn close-btn-sm close-btn-inline" type="button" :aria-label="t('customEntry.featureRecord.close')" @click="closeModal">×</button>
      </div>
    </template>

    <div class="feature-record-body">
      <div class="feature-record-grid">
        <label class="feature-record-field">
          <span>{{ t('customEntry.featureRecord.labels.location') }}</span>
          <input v-model="location" class="feature-record-input" type="text" :placeholder="t('customEntry.featureRecord.placeholders.location')" @input="handleLocationInput" @blur="hideSuggestions" />
          <div v-if="showSuggestions && suggestions.length > 0" class="feature-suggestions-box">
            <button v-for="item in suggestions" :key="item" class="feature-suggestion-item" type="button" @mousedown.prevent="selectSuggestion(item)">
              {{ item }}
            </button>
          </div>
        </label>
        <label class="feature-record-field">
          <span>{{ t('customEntry.featureRecord.labels.region') }}</span>
          <input v-model="region" class="feature-record-input" type="text" :placeholder="t('customEntry.featureRecord.placeholders.region')" />
        </label>
        <label class="feature-record-field feature-record-field-full">
          <span>{{ t('customEntry.featureRecord.labels.coord') }}</span>
          <input :value="coordText" class="feature-record-input" type="text" readonly :placeholder="t('customEntry.featureRecord.placeholders.coord')" />
        </label>
      </div>

      <MiniMapSelector v-model:coord="coord" mode="picker" :readonly="false" :hint-text="t('customEntry.featureRecord.mapHint')" />

      <div class="feature-record-grid feature-record-values">
        <label class="feature-record-field">
          <span>{{ t('customEntry.featureRecord.labels.value') }}</span>
          <input v-model="valueField" class="feature-record-input" type="text" :placeholder="t('customEntry.featureRecord.placeholders.value')" />
        </label>
        <label class="feature-record-field">
          <span>{{ t('customEntry.featureRecord.labels.note') }}</span>
          <input v-model="noteField" class="feature-record-input" type="text" :placeholder="t('customEntry.featureRecord.placeholders.note')" />
        </label>
      </div>

      <div v-if="message" class="feature-record-message">{{ message }}</div>
    </div>

    <template #footer>
      <button class="main-glass-button" type="button" @click="closeModal">{{ t('customEntry.featureRecord.actions.cancel') }}</button>
      <button class="main-glass-button" data-variant="primary" type="button" @click="handleSave">{{ t('customEntry.featureRecord.actions.save') }}</button>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { batchMatch, getRegions } from '@/api'
import { showWarning } from '@/utils/message.js'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'
import { batchCreateCustomData, editCustomData, getDataByFeature } from '@/api'
import { userStore } from '@/main/store/store.js'
import { formatCoord } from '@/utils/map/formatCoord.js'
import MiniMapSelector from './MiniMapSelector.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  feature: {
    type: Object,
    default: () => ({})
  },
  record: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'saved'])
const { t } = useI18n()

const location = ref('')
const region = ref('')
const coord = ref(null)
const valueField = ref('')
const noteField = ref('')
const message = ref('')
const suggestions = ref([])
const showSuggestions = ref(false)
let debounceTimer = null

const isCreateMode = computed(() => !props.record?.created_at)
const coordText = computed(() => (Array.isArray(coord.value) ? formatCoord(coord.value[0], coord.value[1]) : ''))

function parseCoordText(text) {
  if (!text || typeof text !== 'string') return null
  const [lngText, latText] = text.split(',')
  const lng = Number(String(lngText).trim())
  const lat = Number(String(latText).trim())
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
  return [lng, lat]
}

function handleLocationInput() {
  showSuggestions.value = false
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    const query = location.value.trim()
    if (!query) {
      suggestions.value = []
      return
    }
    try {
      const response = await batchMatch(query, false)
      if (response && response.length > 0) {
        const items = response[0].items || []
        suggestions.value = Array.from(new Set(items)).filter((item) => item !== query)
        showSuggestions.value = suggestions.value.length > 0
      }
    } catch (error) {
      suggestions.value = []
    }
  }, 250)
}

async function selectSuggestion(item) {
  location.value = item
  showSuggestions.value = false
  try {
    const response = await getRegions(item)
    if (response && response['音典分區']) {
      region.value = response['音典分區']
    }
  } catch (error) {}
}

function hideSuggestions() {
  setTimeout(() => {
    showSuggestions.value = false
  }, 150)
}

function syncFromProps() {
  const record = props.record || {}
  location.value = record['簡稱'] || ''
  region.value = record['音典分區'] || ''
  coord.value = parseCoordText(record['經緯度'] || '')
  valueField.value = record['值'] || ''
  noteField.value = record['說明'] || ''
  message.value = ''
}

async function checkDuplicateLocation() {
  const featureName = props.feature?.['特徵'] || props.feature?.feature || ''
  const phonology = props.feature?.['聲韻調'] || props.feature?.phonology || ''
  if (!featureName || !phonology || !location.value.trim() || !region.value.trim()) return false
  try {
    const response = await getDataByFeature(featureName, phonology)
    const records = Array.isArray(response?.data) ? response.data : []
    return records.some((item) => {
      if (props.record?.created_at && item.created_at === props.record.created_at) return false
      return (item['簡稱'] || '') === location.value.trim() && (item['音典分區'] || '') === region.value.trim()
    })
  } catch (error) {
    return false
  }
}

function closeModal() {
  emit('update:modelValue', false)
}

function handleVisibleChange(value) {
  emit('update:modelValue', value)
}

async function handleSave() {
  message.value = ''

  if (!location.value.trim() || !region.value.trim()) {
    message.value = t('customEntry.featureRecord.messages.locationRegionRequired')
    return
  }

  if (!Array.isArray(coord.value)) {
    message.value = t('customEntry.featureRecord.messages.coordRequired')
    return
  }

  if (!valueField.value.trim()) {
    message.value = t('customEntry.featureRecord.messages.valueRequired')
    return
  }

  const payload = {
    簡稱: location.value.trim(),
    音典分區: region.value.trim(),
    經緯度: formatCoord(coord.value[0], coord.value[1]),
    聲韻調: props.feature?.['聲韻調'] || props.feature?.phonology || '',
    特徵: props.feature?.['特徵'] || props.feature?.feature || '',
    值: valueField.value.trim(),
    說明: noteField.value.trim(),
    username: userStore.username
  }

  if (!payload.特徵) {
    message.value = t('customEntry.featureRecord.messages.featureRequired')
    return
  }

  const duplicateExists = await checkDuplicateLocation()
  if (duplicateExists) {
    showWarning(t('customEntry.featureRecord.messages.duplicateLocation'))
    const confirmed = globalThis?.window?.confirm?.(t('customEntry.featureRecord.messages.duplicateLocation'))
    if (confirmed === false) return
  }

  if (props.record?.created_at) {
    await editCustomData({ ...payload, created_at: props.record.created_at })
  } else {
    await batchCreateCustomData([payload])
  }

  emit('saved')
  emit('update:modelValue', false)
}

watch(() => props.modelValue, (visible) => {
  if (visible) syncFromProps()
}, { immediate: true })
</script>

<style scoped lang="scss">
.feature-record-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.feature-record-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.feature-record-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-record-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.feature-record-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feature-record-field-full {
  grid-column: 1 / -1;
}

.feature-record-field span {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
}

.feature-record-input {
  width: 100%;
  min-height: 42px;
  padding: 10px 12px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  box-sizing: border-box;
}

.feature-record-message {
  font-size: 13px;
  color: #475569;
}

@media (max-width: 768px) {
  .feature-record-grid {
    grid-template-columns: 1fr;
  }
}
</style>
