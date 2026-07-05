<template>
  <div class="pattern-tendency-page">
    <h3 class="villagesml-subtab-title">
      模式分析 - 傾向性分析
      <HelpIcon content="分析模式在不同區域的傾向性。Z分數≥2表示強傾向性，≥1表示中等傾向性。Z分數衡量該模式在特定區域的使用頻率是否顯著高於或低於全局平均" />
    </h3>

    <div class="vml-glass-panel">
      <h2>📊 模式傾向性分析</h2>

      <!-- Controls -->
      <div class="controls">
        <input
          v-model="tendencyPattern"
          type="text"
          placeholder="輸入模式（如：新村）"
          class="text-input"
        />
        <SimpleSelectDropdown :match-trigger-width="true"
          v-model="tendencyLevel"
          :options="tendencyLevelOptions"
        />
        <button
          class="query-button"
          :disabled="!tendencyPattern || loading"
          @click="loadPatternTendency"
        >
          查詢
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="vml-loading">
        <div class="ui-loading--page" aria-hidden="true"></div>
        <p>加載中...</p>
      </div>

      <!-- Results -->
      <div v-else-if="tendencyData.length > 0" class="tendency-results">
        <!-- Significance Legend -->
        <div class="significance-legend">
          <div class="legend-item">
            <span class="legend-dot strong"></span>
            <span>Z ≥ 2.0：強傾向性</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot moderate"></span>
            <span>Z ≥ 1.0：中等傾向性</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot weak"></span>
            <span>Z &lt; 1.0：弱傾向性</span>
          </div>
        </div>

        <!-- Tendency Chart -->
        <div class="tendency-chart">
          <div
            v-for="(item, index) in tendencyData"
            :key="index"
            class="tendency-item"
            :class="getTendencyClass(item.tendency_score)"
          >
            <div class="tendency-region">{{ item.region_name }}</div>
            <div class="tendency-bar">
              <div
                class="tendency-fill"
                :style="{
                  width: `${Math.min(Math.abs(item.tendency_score) * 20, 100)}%`,
                  background: getBarColor(item.tendency_score)
                }"
              ></div>
            </div>
            <div class="tendency-value">
              <span class="z-score" :style="{ color: getZScoreColor(item.tendency_score) }">
                Z: {{ item.tendency_score != null ? item.tendency_score.toFixed(2) : 'N/A' }}
              </span>
              <span class="frequency">({{ item.frequency != null ? (item.frequency * 100).toFixed(2) : '0.00' }}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import { getPatternTendency } from '@/api/index.js'
import { showError } from '@/utils/message.js'

const route = useRoute()

// State
const tendencyData = ref([])
const loading = ref(false)
const tendencyPattern = ref('')
const tendencyLevel = ref('city')

// Options for SimpleSelectDropdown
const tendencyLevelOptions = [
  { label: '城市', value: 'city' },
  { label: '區縣', value: 'county' },
  { label: '鄉鎮', value: 'township' }
]

// Methods
const loadPatternTendency = async () => {
  if (!tendencyPattern.value) return

  loading.value = true
  try {
    tendencyData.value = await getPatternTendency({
      pattern: tendencyPattern.value,
      region_level: tendencyLevel.value
    })
  } catch (error) {
    showError('加載傾向性數據失敗')
  } finally {
    loading.value = false
  }
}

const getTendencyClass = (zScore) => {
  const absZ = Math.abs(zScore)
  if (absZ >= 2) return 'strong-tendency'
  if (absZ >= 1) return 'moderate-tendency'
  return 'weak-tendency'
}

const getBarColor = (zScore) => {
  const absZ = Math.abs(zScore)
  if (absZ >= 2) return '#f39c12'
  if (absZ >= 1) return '#f1c40f'
  return 'var(--color-primary)'
}

const getZScoreColor = (zScore) => {
  const absZ = Math.abs(zScore)
  if (absZ >= 2) return '#e67e22'
  if (absZ >= 1) return '#f39c12'
  return 'var(--color-primary)'
}

// Initialize from URL query and watch for changes
watch(
  () => route.query.pattern,
  (newPattern) => {
    if (newPattern) {
      tendencyPattern.value = newPattern
      loadPatternTendency()
    }
  },
  { immediate: true } // 立即执行一次
)
</script>

<style scoped>
.pattern-tendency-page {
  padding: 12px;
  max-width: 1400px;
  margin: 0 auto;
}

.vml-glass-panel h2 {
  margin-bottom: 16px;
}

.controls {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
}

.text-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 16px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.5);
}

.select-input {
  padding: 10px 16px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.5);
  width: 150px;
}

.significance-legend {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(74, 144, 226, 0.1);
  border-radius: 8px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-primary);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-dot.strong {
  background: #f39c12;
}

.legend-dot.moderate {
  background: #f1c40f;
}

.legend-dot.weak {
  background: var(--color-primary);
}

.tendency-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tendency-item {
  display: grid;
  grid-template-columns: 150px 1fr 200px;
  gap: 12px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  align-items: center;
  transition: all 0.3s ease;
}

.tendency-item:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: translateX(5px);
}

.tendency-item.strong-tendency {
  background: rgba(243, 156, 18, 0.15);
  border-left: 4px solid #f39c12;
}

.tendency-item.moderate-tendency {
  background: rgba(241, 196, 15, 0.1);
  border-left: 4px solid #f1c40f;
}

.tendency-item.weak-tendency {
  border-left: 4px solid transparent;
}

.tendency-region {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}

.tendency-bar {
  height: 24px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  overflow: hidden;
}

.tendency-fill {
  height: 100%;
  transition: width 0.5s ease;
  border-radius: 12px;
}

.tendency-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.z-score {
  font-weight: 600;
}

.frequency {
  color: var(--text-secondary);
  font-size: 13px;
}

@media (max-width: 768px) {


  .tendency-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .significance-legend {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
