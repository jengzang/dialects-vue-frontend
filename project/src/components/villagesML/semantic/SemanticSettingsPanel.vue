<template>
  <div class="semantic-settings-panel glass-panel">
    <h3 class="panel-title">語義網絡設定</h3>

    <!-- 登錄提示 -->
    <div v-if="!isAuthenticated" class="auth-notice">
      <span class="notice-icon">🔒</span>
      <span class="notice-text">此功能需要登錄</span>
    </div>

    <div class="settings-group">
      <!-- 區域選擇 -->
      <div class="setting-row">
        <label>行政級別：</label>
        <select v-model="settings.region_level" class="setting-select">
          <option value="city">市級</option>
          <option value="county">區縣級</option>
          <option value="township">鄉鎮級</option>
        </select>
      </div>

      <div class="setting-row">
        <label>區域名稱：</label>
        <FilterableSelect
          v-model="settings.region_name"
          :level="settings.region_level"
          placeholder="請選擇或輸入區域"
          :show-level-selector="false"
          @update:hierarchy="handleHierarchyUpdate"
        />
      </div>

      <!-- 網絡參數 -->
      <div class="setting-row">
        <label>最小邊權重：</label>
        <input v-model.number="settings.min_edge_weight" type="number" min="0" max="10" step="0.1" class="setting-input" />
        <span class="hint">過濾弱連接（0-10）</span>
      </div>

      <div class="setting-row">
        <label>中心性指標：<span class="required-hint">（至少選擇一個）</span></label>
        <div class="checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" value="degree" v-model="selectedMetrics" />
            度中心性
          </label>
          <label class="checkbox-label">
            <input type="checkbox" value="betweenness" v-model="selectedMetrics" />
            介數中心性
          </label>
          <label class="checkbox-label">
            <input type="checkbox" value="closeness" v-model="selectedMetrics" />
            接近中心性
          </label>
          <label class="checkbox-label">
            <input type="checkbox" value="eigenvector" v-model="selectedMetrics" />
            特徵向量中心性
          </label>
        </div>
        <span v-if="selectedMetrics.length === 0" class="error-hint">⚠️ 請至少選擇一個中心性指標</span>
      </div>

      <button class="run-button glass-button" @click="runAnalysis" :disabled="loading || !isAuthenticated || !canRun">
        {{ loading ? '分析中...' : isAuthenticated ? '🔍 生成網絡' : '🔒 需要登錄' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, ref, watch } from 'vue'
import { villagesMLStore } from '@/utils/villagesMLStore.js'
import { userStore } from '@/utils/store.js'
import FilterableSelect from '@/components/common/FilterableSelect.vue'

const props = defineProps({
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['run'])

const settings = reactive(villagesMLStore.semanticSettings)
const selectedMetrics = ref(settings.centrality_metrics || ['degree', 'betweenness'])
const isAuthenticated = computed(() => userStore.isAuthenticated)

// 是否可以運行（需要選擇區域和至少一個中心性指標）
const canRun = computed(() => {
  const hasRegion = settings.region_name || settings.city || settings.county || settings.township
  const hasMetrics = selectedMetrics.value && selectedMetrics.value.length > 0
  return hasRegion && hasMetrics
})

// 處理層級更新
const handleHierarchyUpdate = (hierarchy) => {
  settings.city = hierarchy.city || ''
  settings.county = hierarchy.county || ''
  settings.township = hierarchy.township || ''
}

// 監聽指標選擇變化
watch(selectedMetrics, (newMetrics) => {
  settings.centrality_metrics = newMetrics
}, { deep: true })

// 監聽區域級別變化，清空區域名稱
watch(() => settings.region_level, () => {
  settings.region_name = ''
  settings.city = ''
  settings.county = ''
  settings.township = ''
})

const runAnalysis = () => {
  if (!canRun.value) return
  emit('run', settings)
}
</script>

<style scoped>
.semantic-settings-panel {
  padding: 20px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 20px 0;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-row label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.required-hint {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 400;
}

.error-hint {
  font-size: 12px;
  color: #e74c3c;
  font-weight: 500;
  margin-top: 4px;
  display: block;
}

.hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.setting-input,
.setting-select {
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  font-size: 14px;
}

.setting-input:focus,
.setting-select:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(255, 255, 255, 0.8);
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.run-button {
  padding: 12px 24px;
  margin-top: 8px;
}

.run-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auth-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 193, 7, 0.15);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 10px;
  margin-bottom: 16px;
}

.notice-icon {
  font-size: 16px;
}

.notice-text {
  font-size: 13px;
  color: #856404;
  font-weight: 500;
}
</style>
