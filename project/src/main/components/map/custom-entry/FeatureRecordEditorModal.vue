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
        <h4 class="feature-record-title">{{ isCreateMode ? '新增地點記錄' : '編輯地點記錄' }}</h4>
        <button class="close-btn close-btn-sm close-btn-inline" type="button" aria-label="關閉" @click="closeModal">×</button>
      </div>
    </template>

    <div class="feature-record-body">
      <div class="feature-record-grid">
        <label class="feature-record-field">
          <span>地點</span>
          <input v-model="location" class="feature-record-input" type="text" placeholder="輸入地點名稱" />
        </label>
        <label class="feature-record-field">
          <span>分區</span>
          <input v-model="region" class="feature-record-input" type="text" placeholder="輸入分區" />
        </label>
        <label class="feature-record-field feature-record-field-full">
          <span>坐標</span>
          <input :value="coordText" class="feature-record-input" type="text" readonly placeholder="點擊地圖後自動填入" />
        </label>
      </div>

      <MiniMapSelector v-model:coord="coord" mode="picker" :readonly="false" hint-text="點擊地圖選取坐標" />

      <div class="feature-record-grid feature-record-values">
        <label class="feature-record-field">
          <span>值</span>
          <input v-model="valueField" class="feature-record-input" type="text" placeholder="輸入值" />
        </label>
        <label class="feature-record-field">
          <span>說明</span>
          <input v-model="noteField" class="feature-record-input" type="text" placeholder="可選說明" />
        </label>
      </div>

      <div v-if="message" class="feature-record-message">{{ message }}</div>
    </div>

    <template #footer>
      <button class="main-glass-button" type="button" @click="closeModal">取消</button>
      <button class="main-glass-button" data-variant="primary" type="button" @click="handleSave">保存此行</button>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import AppModal from '@/components/common/AppModal.vue'
import { batchCreateCustomData, editCustomData } from '@/api'
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

const location = ref('')
const region = ref('')
const coord = ref(null)
const valueField = ref('')
const noteField = ref('')
const message = ref('')

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

function syncFromProps() {
  const record = props.record || {}
  location.value = record['簡稱'] || ''
  region.value = record['音典分區'] || ''
  coord.value = parseCoordText(record['經緯度'] || '')
  valueField.value = record['值'] || ''
  noteField.value = record['說明'] || ''
  message.value = ''
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
    message.value = '請先填寫地點與分區'
    return
  }

  if (!Array.isArray(coord.value)) {
    message.value = '請先選取坐標'
    return
  }

  if (!valueField.value.trim()) {
    message.value = '請先填寫值'
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
    message.value = '當前特徵為空，請返回上一層重新選擇'
    return
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
