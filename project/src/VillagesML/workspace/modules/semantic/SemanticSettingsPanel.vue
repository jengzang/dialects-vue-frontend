<template>
  <div class="vml-glass-panel">
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
        <SimpleSelectDropdown :match-trigger-width="true"
          v-model="settings.region_level"
          :options="regionLevelOptions"
        />
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
        <input
          v-model.number="settings.min_edge_weight"
          type="number"
          min="0"
          max="10"
          step="0.1"
          class="setting-input"
        />
        <span class="hint">過濾弱連接（0-10）</span>
      </div>

      <div class="setting-row">
        <label>中心性指標：<span class="required-hint">（至少選擇一個）</span></label>
        <div class="checkbox-group">
          <label class="checkbox-label">
            <CheckBox :model-value="selectedMetrics.includes('degree')" @update:modelValue="toggleMetric('degree', $event)" />
            度中心性
          </label>
          <label class="checkbox-label">
            <CheckBox :model-value="selectedMetrics.includes('betweenness')" @update:modelValue="toggleMetric('betweenness', $event)" />
            介數中心性
          </label>
          <label class="checkbox-label">
            <CheckBox :model-value="selectedMetrics.includes('closeness')" @update:modelValue="toggleMetric('closeness', $event)" />
            接近中心性
          </label>
          <label class="checkbox-label">
            <CheckBox :model-value="selectedMetrics.includes('eigenvector')" @update:modelValue="toggleMetric('eigenvector', $event)" />
            特徵向量中心性
          </label>
        </div>
        <span v-if="selectedMetrics.length === 0" class="error-hint">⚠️ 請至少選擇一個中心性指標</span>
      </div>

      <!-- Detail Mode Toggle -->
      <div class="setting-row">
        <label class="toggle-container">
          <SwitchToggle
            :model-value="detailMode"
            :width="48"
            :height="24"
            :thumb-size="20"
            color="blue"
            variant="solid"
            show-label
            active-text="詳細模式"
            inactive-text="詳細模式"
            label-position="right"
            :aria-label="'詳細模式'"
            @update:modelValue="detailMode = $event"
          />
        </label>
        <span class="hint">語義分類更細緻</span>
      </div>

      <button class="run-button solid-button" @click="runAnalysis" :disabled="loading || !isAuthenticated || !canRun">
        {{ loading ? '分析中...' : isAuthenticated ? '🔍 生成網絡' : '🔒 需要登錄' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, ref, watch } from 'vue'
import { villagesMLStore } from '@/VillagesML/store/villagesMLStore.js'
import { userStore } from '@/main/store/store.js'
import FilterableSelect from '@/VillagesML/components/FilterableSelect.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import SwitchToggle from '@/components/common/SwitchToggle.vue'
import CheckBox from '@/components/selector/CheckBox.vue'

const props = defineProps({
  loading: { type: Boolean, default: false },
  hasNetwork: { type: Boolean, default: false }  // 添加 hasNetwork prop
})

const emit = defineEmits(['run'])

const settings = reactive(villagesMLStore.semanticSettings)
const selectedMetrics = ref(settings.centrality_metrics || ['degree', 'betweenness'])
const isAuthenticated = computed(() => userStore.isAuthenticated)

const toggleMetric = (metric, checked) => {
  if (checked) {
    if (!selectedMetrics.value.includes(metric)) {
      selectedMetrics.value.push(metric)
    }
    return
  }
  selectedMetrics.value = selectedMetrics.value.filter(item => item !== metric)
}

// Region level options
const regionLevelOptions = [
  { label: '市級', value: 'city' },
  { label: '區縣級', value: 'county' },
  { label: '鄉鎮級', value: 'township' }
]

// Detail mode toggle
const detailMode = ref(false)

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

// 監聽 detailMode 變化，如果已有網絡數據則自動重新生成
watch(detailMode, () => {
  if (props.hasNetwork && canRun.value) {
    runAnalysis()
  }
})

const runAnalysis = () => {
  if (!canRun.value) return
  emit('run', {
    ...settings,
    ...(detailMode.value && { detail: true })
  })
}
</script>

<style scoped>
.vml-glass-panel {
  padding: 20px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 20px 0;
}

.settings-group {
  @include flex-col;
  gap: 16px;
}

.setting-row {
  @include flex-col;
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
  color: var(--color-error);
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
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-md);
  background: var(--glass-50);
  backdrop-filter: blur(10px);
  font-size: 14px;
}

.setting-input:focus,
.setting-select:focus {
  outline: none;
  border-color: var(--color-primary);
  background: var(--glass-80);
}

.checkbox-group {
  @include flex-col;
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


.auth-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(var(--color-warning-rgb), 0.15);
  border: 1px solid rgba(var(--color-warning-rgb), 0.3);
  border-radius: var(--radius-md);
  margin-bottom: 16px;
}

.notice-icon {
  font-size: 16px;
}

.notice-text {
  font-size: 13px;
  color: var(--color-warning-dark);
  font-weight: 500;
}

/* Detail Mode Toggle */
.toggle-container {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.toggle-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}
</style>
