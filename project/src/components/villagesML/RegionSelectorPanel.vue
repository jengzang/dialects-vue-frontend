<template>
  <div class="region-selector-panel glass-panel">
    <h3 class="panel-title">區域選擇</h3>

    <div class="selector-group">
      <div class="selector-row">
        <label class="selector-label">區域層級：</label>
        <select v-model="localLevel" class="selector-input" @change="handleLevelChange">
          <option value="city">城市</option>
          <option value="county">區縣</option>
          <option value="township">鄉鎮</option>
        </select>
      </div>

      <div class="selector-row">
        <label class="selector-label">區域名稱：</label>
        <select v-model="localName" class="selector-input" @change="handleNameChange" :disabled="regions.length === 0">
          <option value="">請選擇...</option>
          <option v-for="region in regions" :key="region" :value="region">{{ region }}</option>
        </select>
      </div>

      <button class="analyze-button glass-button" @click="handleAnalyze" :disabled="!localName">
        🔍 開始分析
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { villagesMLStore } from '@/utils/villagesMLStore.js'
import { getRegionList } from '@/api'
import { showError } from '@/utils/message.js'

const emit = defineEmits(['analyze'])

const localLevel = ref(villagesMLStore.regionLevel)
const localName = ref(villagesMLStore.regionName)
const regions = ref([])

const handleLevelChange = async () => {
  localName.value = ''
  villagesMLStore.regionLevel = localLevel.value
  await loadRegions()
}

const handleNameChange = () => {
  villagesMLStore.regionName = localName.value
}

const handleAnalyze = () => {
  if (!localName.value) return
  emit('analyze', { level: localLevel.value, name: localName.value })
}

const loadRegions = async () => {
  try {
    regions.value = await getRegionList(localLevel.value)
  } catch (error) {
    showError('載入區域列表失敗')
  }
}

onMounted(() => {
  loadRegions()
})
</script>

<style scoped>
.region-selector-panel {
  padding: 20px;
  margin-bottom: 20px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 20px 0;
}

.selector-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.selector-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selector-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  min-width: 80px;
}

.selector-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.selector-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.selector-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.analyze-button {
  padding: 12px 24px;
  margin-top: 8px;
}

.analyze-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
