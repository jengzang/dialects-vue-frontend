<template>
  <section class="point-detail-form">
    <div class="point-detail-header">
      <button class="main-glass-button" type="button" @click="$emit('back')">← 返回</button>
      <div class="point-detail-heading">
        <h4 class="point-detail-title">{{ isCreateMode ? '新增方言點' : detailTitle }}</h4>
        <p class="point-detail-description">
          {{ isCreateMode ? '先确定地點與坐標，再補充多條特徵資料。' : '在同一個方言點下持續補充或修改多條資料。' }}
        </p>
      </div>
    </div>

    <div class="point-detail-layout">
      <div class="point-detail-main main-glass-panel-inner">
        <div class="point-base-fields">
          <label class="point-field">
            <span class="point-field-label">簡稱</span>
            <input v-model="location" class="point-field-input" type="text" placeholder="輸入方言點簡稱" />
          </label>
          <label class="point-field">
            <span class="point-field-label">音典分區</span>
            <input v-model="region" class="point-field-input" type="text" placeholder="輸入分區" />
          </label>
          <label class="point-field point-field-full">
            <span class="point-field-label">經緯度</span>
            <input :value="coordText" class="point-field-input" type="text" readonly placeholder="點擊地圖後自動填入" />
          </label>
        </div>

        <div class="point-rows-header">
          <div>
            <h5 class="point-rows-title">特徵記錄</h5>
            <p class="point-rows-description">每一行代表一條可提交的自定義資料。</p>
          </div>
          <button class="main-glass-button" type="button" @click="addRow">+ 再添加一條</button>
        </div>

        <div class="point-rows-table">
          <div class="point-rows-table-head">
            <span>聲韻調</span>
            <span>特徵</span>
            <span>值</span>
            <span>說明</span>
            <span>操作</span>
          </div>
          <div v-for="row in rows" :key="row.id" class="point-row">
            <input v-model="row.聲韻調" class="point-row-input" type="text" placeholder="如：韻母" />
            <input v-model="row.特徵" class="point-row-input" type="text" placeholder="如：流攝" />
            <input v-model="row.值" class="point-row-input" type="text" placeholder="如：eu" />
            <input v-model="row.說明" class="point-row-input" type="text" placeholder="可選補充說明" />
            <button class="point-row-remove" type="button" @click="removeRow(row.id)">刪除</button>
          </div>
        </div>

        <div v-if="saveMessage" class="point-save-message">{{ saveMessage }}</div>

        <div class="point-detail-actions">
          <button class="main-glass-button" type="button" @click="$emit('back')">取消</button>
          <button class="main-glass-button" data-variant="primary" type="button" @click="handleSave">保存</button>
        </div>
      </div>

      <div class="point-detail-side main-glass-panel-inner">
        <div class="point-map-title">{{ isCreateMode ? '點擊地圖選取坐標' : '當前方言點位置' }}</div>
        <MiniMapSelector
          v-model:coord="coord"
          :readonly="!isCreateMode"
          :mode="isCreateMode ? 'picker' : 'single-preview'"
          :points="mapPreviewPoints"
          :hint-text="isCreateMode ? '點擊地圖選取坐標' : '當前點位預覽'"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
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

const location = ref('')
const region = ref('')
const coord = ref(null)
const rows = ref([])
const removedIds = ref([])
const saveMessage = ref('')
let rowSeed = 0

const isCreateMode = computed(() => !props.point)
const detailTitle = computed(() => {
  if (!props.point) return '新增方言點'
  return `${props.point['簡稱'] || props.point.location || ''}（${props.point['音典分區'] || props.point.region || ''}）`
})

const coordText = computed(() => (Array.isArray(coord.value) ? formatCoord(coord.value[0], coord.value[1]) : ''))
const mapPreviewPoints = computed(() => {
  if (!Array.isArray(coord.value)) return []
  return [{ coord: coord.value, label: location.value || '當前點位', active: true }]
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
    saveMessage.value = error.message || '獲取地點詳情失敗'
    rows.value = [createEmptyRow()]
  }
}

async function handleSave() {
  saveMessage.value = ''

  if (!location.value.trim() || !region.value.trim()) {
    saveMessage.value = '請先填寫方言點名稱與分區'
    return
  }

  if (!Array.isArray(coord.value)) {
    saveMessage.value = '請先在地圖上選取坐標'
    return
  }

  const validRows = rows.value.filter((row) => row.特徵.trim() && row.值.trim())
  if (validRows.length === 0 && removedIds.value.length === 0) {
    saveMessage.value = '請至少填寫一條特徵與值'
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
    saveMessage.value = '當前沒有需要提交的變更'
    return
  }

  const results = await Promise.allSettled(tasks)
  const failedCount = results.filter((item) => item.status === 'rejected').length

  if (failedCount > 0) {
    saveMessage.value = `保存時有 ${failedCount} 項失敗，請重試`
    return
  }

  saveMessage.value = '保存成功'
  emit('saved')
}

watch(() => props.point, (point) => {
  loadPointDetail(point)
}, { immediate: true })
</script>

<style scoped lang="scss">
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
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
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
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
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
