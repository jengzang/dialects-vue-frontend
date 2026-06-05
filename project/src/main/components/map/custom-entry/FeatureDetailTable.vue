<template>
  <section class="feature-detail-table">
    <div class="feature-detail-header">
      <button class="main-glass-button" type="button" @click="$emit('back')">← 返回</button>
      <div class="feature-detail-heading">
        <h4 class="feature-detail-title">{{ detailTitle }}</h4>
        <p class="feature-detail-description">以同一特徵為中心，維護多個方言點的分布資料。</p>
      </div>
      <button class="main-glass-button" data-variant="primary" type="button" @click="openCreateModal">+ 新增地點記錄</button>
    </div>

    <div class="feature-detail-layout">
      <div class="feature-detail-main main-glass-panel-inner">
        <div v-if="loading" class="feature-detail-state">正在載入特徵詳情…</div>
        <div v-else-if="errorMessage" class="feature-detail-state feature-detail-state-error">
          <div>{{ errorMessage }}</div>
          <button class="main-glass-button" type="button" @click="loadRecords">重試</button>
        </div>
        <div v-else-if="rows.length === 0" class="feature-detail-state">暫無地點記錄，點擊右上角開始新增。</div>
        <div v-else class="feature-detail-table-body">
          <div class="feature-detail-table-head">
            <span>地點</span>
            <span>分區</span>
            <span>坐標</span>
            <span>值</span>
            <span>說明</span>
            <span>操作</span>
          </div>
          <div v-for="row in rows" :key="row.created_at || `${row['簡稱']}-${row['音典分區']}-${row['值']}`" class="feature-detail-row">
            <span>{{ row['簡稱'] }}</span>
            <span>{{ row['音典分區'] }}</span>
            <span>{{ row['經緯度'] }}</span>
            <span>{{ row['值'] }}</span>
            <span>{{ row['說明'] || '—' }}</span>
            <div class="feature-detail-actions">
              <button class="feature-detail-link" type="button" @click="openEditModal(row)">編輯</button>
              <button class="feature-detail-link danger" type="button" @click="handleDelete(row)">刪除</button>
            </div>
          </div>
        </div>
      </div>

      <div class="feature-detail-side main-glass-panel-inner">
        <div class="feature-detail-map-title">當前特徵點位分布</div>
        <MiniMapSelector mode="multi-preview" :readonly="true" :points="mapPoints" hint-text="特徵分布預覽" />
      </div>
    </div>

    <FeatureRecordEditorModal
      v-model="isEditorOpen"
      :feature="feature"
      :record="editingRecord"
      @saved="handleSaved"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { batchDeleteCustomData, getDataByFeature } from '@/api'
import MiniMapSelector from './MiniMapSelector.vue'
import FeatureRecordEditorModal from './FeatureRecordEditorModal.vue'

const props = defineProps({
  feature: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['back', 'saved'])

const loading = ref(false)
const errorMessage = ref('')
const rows = ref([])
const isEditorOpen = ref(false)
const editingRecord = ref(null)

const detailTitle = computed(() => {
  const featureName = props.feature?.['特徵'] || props.feature?.feature || '未命名特徵'
  const phonology = props.feature?.['聲韻調'] || props.feature?.phonology || '未分類'
  return `${featureName}（${phonology}）`
})

const mapPoints = computed(() => rows.value
  .map((row) => {
    const [lngText, latText] = String(row['經緯度'] || '').split(',')
    const lng = Number(String(lngText).trim())
    const lat = Number(String(latText).trim())
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
    return {
      coord: [lng, lat],
      label: row['簡稱'] || '',
      active: editingRecord.value?.created_at === row.created_at
    }
  })
  .filter(Boolean))

const loadRecords = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const featureName = props.feature?.['特徵'] || props.feature?.feature || ''
    const phonology = props.feature?.['聲韻調'] || props.feature?.phonology || ''
    const response = await getDataByFeature(featureName, phonology)
    rows.value = Array.isArray(response?.data) ? response.data : []
  } catch (error) {
    errorMessage.value = error.message || '獲取特徵詳情失敗'
    rows.value = []
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  editingRecord.value = {
    '簡稱': '',
    '音典分區': '',
    '經緯度': '',
    '值': '',
    '說明': ''
  }
  isEditorOpen.value = true
}

const openEditModal = (row) => {
  editingRecord.value = { ...row }
  isEditorOpen.value = true
}

const handleDelete = async (row) => {
  if (!row?.created_at) return
  await batchDeleteCustomData([row.created_at])
  rows.value = rows.value.filter((item) => item.created_at !== row.created_at)
  emit('saved')
}

const handleSaved = async () => {
  await loadRecords()
  emit('saved')
}

watch(() => props.feature, () => {
  loadRecords()
}, { deep: true })

onMounted(() => {
  loadRecords()
})
</script>

<style scoped lang="scss">
.feature-detail-table {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.feature-detail-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  flex-wrap: wrap;
}

.feature-detail-heading {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.feature-detail-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.feature-detail-description {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.feature-detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.85fr);
  gap: 18px;
}

.feature-detail-main,
.feature-detail-side {
  padding: 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
}

.feature-detail-state {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  color: #64748b;
}

.feature-detail-state-error {
  color: #dc2626;
}

.feature-detail-table-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feature-detail-table-head,
.feature-detail-row {
  display: grid;
  grid-template-columns: 0.9fr 0.85fr 1fr 0.7fr 0.9fr auto;
  gap: 10px;
  align-items: center;
}

.feature-detail-table-head {
  padding: 0 6px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.feature-detail-row {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
  font-size: 13px;
  color: #0f172a;
}

.feature-detail-actions {
  display: flex;
  gap: 8px;
}

.feature-detail-link {
  border: none;
  background: transparent;
  color: #007aff;
  cursor: pointer;
}

.feature-detail-link.danger {
  color: #dc2626;
}

.feature-detail-map-title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

@media (max-width: 1100px) {
  .feature-detail-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .feature-detail-table-head,
  .feature-detail-row {
    grid-template-columns: 1fr;
  }
}
</style>
