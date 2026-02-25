<template>
  <div class="pattern-frequency-page">
    <h3 class="villagesml-subtab-title">模式分析 - 頻率分析</h3>

    <div class="glass-panel">
      <h2>🔍 模式頻率分析</h2>

      <!-- Query Mode Selection -->
      <div class="mode-selector">
        <label class="radio-label">
          <input type="radio" v-model="queryMode" value="global" />
          <span>全局模式</span>
        </label>
        <label class="radio-label">
          <input type="radio" v-model="queryMode" value="regional" />
          <span>區域模式</span>
        </label>
      </div>

      <!-- Controls -->
      <div class="controls">
        <!-- Regional Selection (only show when regional mode) -->
        <FilterableSelect
          v-if="queryMode === 'regional'"
          v-model="regionName"
          :level="regionLevel"
          @update:level="(newLevel) => regionLevel = newLevel"
          @update:hierarchy="(h) => regionHierarchy = h"
          placeholder="請選擇或輸入區域"
        />

        <input
          v-model.number="topN"
          type="number"
          min="10"
          :max="queryMode === 'global' ? 100 : 50"
          placeholder="返回數量"
          class="number-input"
        />

        <input
          v-if="queryMode === 'global'"
          v-model.number="minCount"
          type="number"
          min="1"
          placeholder="最小頻次"
          class="number-input"
        />

        <button
          class="query-button"
          :disabled="loading || (queryMode === 'regional' && !regionName)"
          @click="loadPatterns"
        >
          查詢
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>加載中...</p>
      </div>

      <!-- Results -->
      <div v-else-if="patterns.length > 0" class="results">
        <div class="pattern-grid">
          <div
            v-for="(pattern, index) in patterns"
            :key="index"
            class="pattern-card"
            :class="{ 'top-5': index < 5 }"
          >
            <div class="pattern-rank">{{ index + 1 }}</div>
            <div class="pattern-text">{{ pattern.pattern }}</div>
            <div class="pattern-stats">
              <div class="stat-item">
                <span class="stat-label">頻率:</span>
                <span class="stat-value">{{ pattern.frequency }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">百分比:</span>
                <span class="stat-value">{{ pattern.percentage != null ? pattern.percentage.toFixed(2) : '0.00' }}%</span>
              </div>
            </div>
            <div class="pattern-bar">
              <div
                class="bar-fill"
                :style="{ width: `${pattern.percentage != null ? (pattern.percentage / maxPercentage) * 100 : 0}%` }"
              ></div>
            </div>
            <button class="action-button" @click="goToTendency(pattern.pattern)">
              查看傾向性
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import FilterableSelect from '@/components/common/FilterableSelect.vue'
import {
  getPatternFrequencyGlobal,
  getPatternFrequencyRegional
} from '@/api/index.js'
import { showError } from '@/utils/message.js'

const router = useRouter()
const route = useRoute()

// State
const queryMode = ref('global')
const patterns = ref([])
const loading = ref(false)

// Global mode params
const topN = ref(50)
const minCount = ref(5)

// Regional mode params
const regionLevel = ref('city')
const regionName = ref('')
const regionHierarchy = ref({ city: null, county: null, township: null })

// Computed
const maxPercentage = computed(() => {
  if (patterns.value.length === 0) return 1
  return Math.max(...patterns.value.map(item => item.percentage || 0))
})

// Methods
const loadPatterns = async () => {
  loading.value = true
  try {
    if (queryMode.value === 'global') {
      patterns.value = await getPatternFrequencyGlobal({
        top_n: topN.value,
        min_count: minCount.value
      })
    } else {
      if (!regionName.value) return
      patterns.value = await getPatternFrequencyRegional({
        region_level: regionLevel.value,
        ...regionHierarchy.value,
        top_k: topN.value
      })
    }
  } catch (error) {
    showError('加載模式頻率失敗')
  } finally {
    loading.value = false
  }
}

const goToTendency = (pattern) => {
  router.push({
    query: {
      ...route.query,
      subtab: 'tendency',
      pattern: pattern
    }
  })
}
</script>

<style scoped>
.pattern-frequency-page {
  padding: 12px;
  max-width: 1400px;
  margin: 0 auto;
}

.glass-panel {
  padding: 16px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.glass-panel h2 {
  font-size: 16px;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.mode-selector {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-primary);
}

.radio-label input[type="radio"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.controls {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.number-input {
  padding: 10px 16px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.5);
  width: 150px;
}

.query-button {
  padding: 10px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.query-button:hover:not(:disabled) {
  background: #3a7bc8;
}

.query-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state {
  text-align: center;
  padding: 40px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(74, 144, 226, 0.2);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.pattern-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.pattern-card {
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
}

.pattern-card:hover {
  transform: translateY(-5px);
  background: rgba(74, 144, 226, 0.1);
}

.pattern-card.top-5 {
  background: rgba(243, 156, 18, 0.15);
  border: 2px solid rgba(243, 156, 18, 0.3);
}

.pattern-rank {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.pattern-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.pattern-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary);
}

.pattern-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), #3a7bc8);
  transition: width 0.5s ease;
}

.action-button {
  width: 100%;
  padding: 8px 16px;
  background: rgba(74, 144, 226, 0.1);
  color: var(--color-primary);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-button:hover {
  background: rgba(74, 144, 226, 0.2);
  border-color: var(--color-primary);
}

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
  }

  .number-input {
    width: 100%;
  }

  .pattern-grid {
    grid-template-columns: 1fr;
  }
}
</style>
