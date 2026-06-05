<template>
  <section class="point-detail-form">
    <div class="point-detail-header">
      <button class="main-glass-button" type="button" @click="$emit('back')">{{ t('customEntry.pointDetail.back') }}</button>
      <div class="point-detail-heading">
        <h4 class="point-detail-title">{{ isCreateMode ? t('customEntry.pointDetail.createTitle') : detailTitle }}</h4>
        <p class="point-detail-description">
          {{ isCreateMode ? t('customEntry.pointDetail.createDescription') : t('customEntry.pointDetail.editDescription') }}
        </p>
      </div>
    </div>

    <div class="point-detail-layout">
      <div class="point-detail-main main-glass-panel-inner">
        <div class="point-base-fields">
          <label class="point-field">
            <span class="point-field-label">{{ t('customEntry.pointDetail.labels.location') }}</span>
            <input v-model="location" class="point-field-input" type="text" :placeholder="t('customEntry.pointDetail.placeholders.location')" @input="handleLocationInput" @blur="hideSuggestions" />
            <div v-if="showPointSuggestions && pointSuggestions.length > 0" class="point-suggestions-box">
              <button v-for="item in pointSuggestions" :key="item" class="point-suggestion-item" type="button" @mousedown.prevent="selectSuggestion(item)">
                {{ item }}
              </button>
            </div>
          </label>
          <label class="point-field">
            <span class="point-field-label">{{ t('customEntry.pointDetail.labels.region') }}</span>
            <input v-model="region" class="point-field-input" type="text" :placeholder="t('customEntry.pointDetail.placeholders.region')" />
          </label>
          <label class="point-field point-field-full">
            <span class="point-field-label">{{ t('customEntry.pointDetail.labels.coord') }}</span>
            <input :value="coordText" class="point-field-input" type="text" readonly :placeholder="t('customEntry.pointDetail.placeholders.coord')" />
          </label>
        </div>

        <div class="point-rows-header">
          <div>
            <h5 class="point-rows-title">{{ t('customEntry.pointDetail.rows.title') }}</h5>
            <p class="point-rows-description">{{ t('customEntry.pointDetail.rows.description') }}</p>
          </div>
          <button class="main-glass-button" type="button" @click="addRow">{{ t('customEntry.pointDetail.rows.add') }}</button>
        </div>

        <div class="point-rows-table">
          <div class="point-rows-table-head">
            <span>{{ t('customEntry.pointDetail.rows.headers.phonology') }}</span>
            <span>{{ t('customEntry.pointDetail.rows.headers.feature') }}</span>
            <span>{{ t('customEntry.pointDetail.rows.headers.value') }}</span>
            <span>{{ t('customEntry.pointDetail.rows.headers.note') }}</span>
            <span>{{ t('customEntry.pointDetail.rows.headers.action') }}</span>
          </div>
          <div v-for="row in rows" :key="row.id" class="point-row">
            <input v-model="row.聲韻調" class="point-row-input" type="text" :placeholder="t('customEntry.pointDetail.placeholders.phonology')" />
            <input v-model="row.特徵" class="point-row-input" type="text" :placeholder="t('customEntry.pointDetail.placeholders.feature')" />
            <input v-model="row.值" class="point-row-input" type="text" :placeholder="t('customEntry.pointDetail.placeholders.value')" />
            <input v-model="row.說明" class="point-row-input" type="text" :placeholder="t('customEntry.pointDetail.placeholders.note')" />
            <button class="point-row-remove" type="button" @click="removeRow(row.id)">{{ t('customEntry.pointDetail.rows.remove') }}</button>
          </div>
        </div>

        <div v-if="saveMessage" class="point-save-message">{{ saveMessage }}</div>

        <div class="point-detail-actions">
          <button class="main-glass-button" type="button" @click="$emit('back')">{{ t('customEntry.pointDetail.actions.cancel') }}</button>
          <button class="main-glass-button" data-variant="primary" type="button" :disabled="isSaving" @click="handleSave">{{ isSaving ? t('customEntry.common.saving') : t('customEntry.pointDetail.actions.save') }}</button>
        </div>
      </div>

      <div class="point-detail-side main-glass-panel-inner">
        <div class="point-map-title">{{ isCreateMode ? t('customEntry.pointDetail.map.pickTitle') : t('customEntry.pointDetail.map.previewTitle') }}</div>
        <MiniMapSelector
          v-model:coord="coord"
          :readonly="!isCreateMode"
          :mode="isCreateMode ? 'picker' : 'single-preview'"
          :points="mapPreviewPoints"
          :hint-text="isCreateMode ? t('customEntry.pointDetail.map.pickHint') : t('customEntry.pointDetail.map.previewHint')"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { batchMatch, getRegions } from '@/api'
import { showConfirm, showWarning } from '@/utils/message.js'
import { useI18n } from 'vue-i18n'
import { batchCreateCustomData, batchDeleteCustomData, editCustomData, getDataByPoint } from '@/api'
import { userStore } from '@/main/store/store.js'
import { formatCoord } from '@/utils/map/formatCoord.js'
import MiniMapSelector from './MiniMapSelector.vue'

const props = defineProps({
  point: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['back', 'saved'])
const { t } = useI18n()

const location = ref('')
const region = ref('')
const coord = ref(null)
const rows = ref([])
const removedIds = ref([])
const saveMessage = ref('')
const isSaving = ref(false)
const pointSuggestions = ref([])
const showPointSuggestions = ref(false)
let locationDebounceTimer = null
let rowSeed = 0

const isCreateMode = computed(() => !props.point)
const detailTitle = computed(() => {
  if (!props.point) return t('customEntry.pointDetail.createTitle')
  return `${props.point['簡稱'] || props.point.location || ''}（${props.point['音典分區'] || props.point.region || ''}）`
})

const coordText = computed(() => (Array.isArray(coord.value) ? formatCoord(coord.value[0], coord.value[1]) : ''))
const mapPreviewPoints = computed(() => {
  if (!Array.isArray(coord.value)) return []
  return [{ coord: coord.value, label: location.value || t('customEntry.pointDetail.map.currentPoint'), active: true }]
})

function createEmptyRow() {
  rowSeed += 1
  return {
    id: `row-${rowSeed}`,
    created_at: '',
    聲韻調: '',
    特徵: '',
    值: '',
    說明: '',
    original: null
  }
}

function parseCoordText(text) {
  if (!text || typeof text !== 'string') return null
  const [lngText, latText] = text.split(',')
  const lng = Number(String(lngText).trim())
  const lat = Number(String(latText).trim())
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
  return [lng, lat]
}

function handleLocationInput() {
  if (!isCreateMode.value) return
  showPointSuggestions.value = false
  clearTimeout(locationDebounceTimer)
  locationDebounceTimer = setTimeout(async () => {
    const query = location.value.trim()
    if (!query) {
      pointSuggestions.value = []
      return
    }
    try {
      const response = await batchMatch(query, false)
      if (response && response.length > 0) {
        const items = response[0].items || []
        pointSuggestions.value = Array.from(new Set(items)).filter((item) => item !== query)
        showPointSuggestions.value = pointSuggestions.value.length > 0
      }
    } catch (error) {
      pointSuggestions.value = []
    }
  }, 250)
}

async function selectSuggestion(item) {
  location.value = item
  showPointSuggestions.value = false
  try {
    const response = await getRegions(item)
    if (response && response['音典分區']) {
      region.value = response['音典分區']
    }
  } catch (error) {}
}

function hideSuggestions() {
  setTimeout(() => {
    showPointSuggestions.value = false
  }, 150)
}

function rowChanged(row) {
  if (!row.created_at || !row.original) return true
  return row.聲韻調 !== (row.original.聲韻調 || '') ||
    row.特徵 !== (row.original.特徵 || '') ||
    row.值 !== (row.original.值 || '') ||
    row.說明 !== (row.original.說明 || '')
}

function removeRow(id) {
  const target = rows.value.find((row) => row.id === id)
  if (target?.created_at) {
    removedIds.value.push(target.created_at)
  }
  rows.value = rows.value.filter((row) => row.id !== id)
  if (rows.value.length === 0) {
    rows.value = [createEmptyRow()]
  }
}

function addRow() {
  rows.value.push(createEmptyRow())
}

async function loadPointDetail(point) {
  location.value = point?.['簡稱'] || point?.location || ''
  region.value = point?.['音典分區'] || point?.region || ''
  coord.value = parseCoordText(point?.['經緯度'] || point?.coordinate || '')
  rows.value = []
  removedIds.value = []
  saveMessage.value = ''

  if (!point) {
    rows.value = [createEmptyRow()]
    return
  }

  try {
    const response = await getDataByPoint(location.value, region.value)
    const records = Array.isArray(response?.data) ? response.data : []
    rows.value = records.map((record) => {
      rowSeed += 1
      return {
        id: `row-${rowSeed}`,
        created_at: record.created_at || '',
        聲韻調: record['聲韻調'] || '',
        特徵: record['特徵'] || '',
        值: record['值'] || '',
        說明: record['說明'] || '',
        original: {
          聲韻調: record['聲韻調'] || '',
          特徵: record['特徵'] || '',
          值: record['值'] || '',
          說明: record['說明'] || ''
        }
      }
    })

    if (rows.value.length === 0) {
      rows.value = [createEmptyRow()]
    }
  } catch (error) {
    saveMessage.value = error.message || t('customEntry.pointDetail.messages.loadFailed')
    rows.value = [createEmptyRow()]
  }
}

async function handleSave() {
  if (isSaving.value) return
  saveMessage.value = ''

  if (!location.value.trim() || !region.value.trim()) {
    saveMessage.value = t('customEntry.pointDetail.messages.locationRegionRequired')
    return
  }

  if (!Array.isArray(coord.value)) {
    saveMessage.value = t('customEntry.pointDetail.messages.coordRequired')
    return
  }

  const validRows = rows.value.filter((row) => row.特徵.trim() && row.值.trim())
  const duplicateKeys = new Set()
  let hasDuplicate = false
  validRows.forEach((row) => {
    const key = `${row.聲韻調.trim()}||${row.特徵.trim()}`
    if (duplicateKeys.has(key)) hasDuplicate = true
    duplicateKeys.add(key)
  })
  if (hasDuplicate) {
    showWarning(t('customEntry.pointDetail.rows.duplicateWarning'))
    const confirmed = await showConfirm(t('customEntry.pointDetail.messages.confirmContinue'))
    if (confirmed === false) return
  }
  if (validRows.length === 0 && removedIds.value.length === 0) {
    saveMessage.value = t('customEntry.pointDetail.messages.rowRequired')
    return
  }

  const baseRecord = {
    簡稱: location.value.trim(),
    音典分區: region.value.trim(),
    經緯度: formatCoord(coord.value[0], coord.value[1]),
    username: userStore.username
  }

  const toCreate = []
  const toEdit = []

  validRows.forEach((row) => {
    const nextRecord = {
      ...baseRecord,
      聲韻調: row.聲韻調.trim(),
      特徵: row.特徵.trim(),
      值: row.值.trim(),
      說明: row.說明.trim()
    }

    if (!row.created_at) {
      toCreate.push(nextRecord)
      return
    }

    if (rowChanged(row)) {
      toEdit.push({
        ...nextRecord,
        created_at: row.created_at
      })
    }
  })

  const tasks = []
  if (toCreate.length > 0) tasks.push(batchCreateCustomData(toCreate))
  if (removedIds.value.length > 0) tasks.push(batchDeleteCustomData(removedIds.value))
  toEdit.forEach((record) => tasks.push(editCustomData(record)))

  if (tasks.length === 0) {
    saveMessage.value = t('customEntry.pointDetail.messages.noChanges')
    return
  }

  isSaving.value = true
  const results = await Promise.allSettled(tasks)
  const failedCount = results.filter((item) => item.status === 'rejected').length

  if (failedCount > 0) {
    saveMessage.value = t('customEntry.pointDetail.messages.partialFailed', { count: failedCount })
    isSaving.value = false
    return
  }

  saveMessage.value = t('customEntry.pointDetail.messages.saveSuccess')
  isSaving.value = false
  emit('saved')
}

watch(() => props.point, (point) => {
  loadPointDetail(point)
}, { immediate: true })
</script>

<style scoped lang="scss">
@use '@/styles/main/_surfaces.scss';

.point-detail-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.point-detail-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.point-detail-heading {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.point-detail-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.point-detail-description {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.point-detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.85fr);
  gap: 18px;
}

.point-detail-main,
.point-detail-side {
  padding: 18px;
}

.point-base-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.point-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.point-field-full {
  grid-column: 1 / -1;
}

.point-field-label,
.point-map-title,
.point-rows-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.point-field-input,
.point-row-input {
  width: 100%;
  min-height: 42px;
  padding: 10px 12px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  box-sizing: border-box;
}

.point-rows-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-top: 18px;
}

.point-rows-description {
  margin: 6px 0 0;
  font-size: 13px;
  color: #64748b;
}

.point-rows-table {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

.point-rows-table-head,
.point-row {
  display: grid;
  grid-template-columns: 0.85fr 1fr 0.85fr 1fr auto;
  gap: 10px;
  align-items: center;
}

.point-rows-table-head {
  padding: 0 6px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.point-row-remove {
  padding: 10px 12px;
  border: none;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
  cursor: pointer;
}

.point-detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 18px;
}

.point-map-title {
  margin-bottom: 12px;
}

.point-save-message {
  margin-top: 12px;
  font-size: 13px;
  color: #475569;
}

@media (max-width: 1100px) {
  .point-detail-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .point-base-fields,
  .point-rows-table-head,
  .point-row {
    grid-template-columns: 1fr;
  }
}
</style>
