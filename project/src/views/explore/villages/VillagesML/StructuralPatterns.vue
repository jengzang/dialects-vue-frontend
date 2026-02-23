<template>
  <ExploreLayout>
    <div class="structural-patterns-page">
      <h1 class="page-title">🏗️ 結構模式分析</h1>

      <!-- Global Pattern Frequency -->
      <div class="global-section glass-panel">
        <h2>全局模式頻率</h2>
        <div class="controls">
          <input
            v-model.number="globalTopN"
            type="number"
            min="10"
            max="100"
            placeholder="返回數量"
            class="number-input"
          />
          <input
            v-model.number="globalMinCount"
            type="number"
            min="1"
            placeholder="最小出現次數"
            class="number-input"
          />
          <button
            class="query-button"
            :disabled="loadingGlobal"
            @click="loadGlobalPatterns"
          >
            查詢
          </button>
        </div>

        <div v-if="loadingGlobal" class="loading-state">
          <div class="spinner"></div>
          <p>加載中...</p>
        </div>

        <div v-else-if="globalPatterns.length > 0" class="global-results">
          <div class="pattern-grid">
            <div
              v-for="(pattern, index) in globalPatterns"
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
                  <span class="stat-value">{{ (pattern.percentage * 100).toFixed(2) }}%</span>
                </div>
              </div>
              <div class="pattern-bar">
                <div
                  class="bar-fill"
                  :style="{ width: `${pattern.percentage * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Regional Pattern Frequency -->
      <div class="regional-section glass-panel">
        <h2>區域模式頻率</h2>
        <div class="controls">
          <select v-model="regionLevel" class="select-input">
            <option value="city">城市</option>
            <option value="county">區縣</option>
            <option value="township">鄉鎮</option>
          </select>
          <input
            v-model="regionName"
            type="text"
            placeholder="輸入區域名稱"
            class="text-input"
          />
          <input
            v-model.number="regionalTopN"
            type="number"
            min="10"
            max="50"
            placeholder="返回數量"
            class="number-input"
          />
          <button
            class="query-button"
            :disabled="!regionName || loadingRegional"
            @click="loadRegionalPatterns"
          >
            查詢
          </button>
        </div>

        <div v-if="loadingRegional" class="loading-state">
          <div class="spinner"></div>
        </div>

        <div v-else-if="regionalPatterns.length > 0" class="regional-results">
          <div class="results-table">
            <div class="table-header">
              <div class="col-rank">排名</div>
              <div class="col-pattern">模式</div>
              <div class="col-frequency">頻率</div>
              <div class="col-percentage">百分比</div>
              <div class="col-bar">分佈</div>
            </div>
            <div class="table-body">
              <div
                v-for="(pattern, index) in regionalPatterns"
                :key="index"
                class="table-row"
              >
                <div class="col-rank">{{ index + 1 }}</div>
                <div class="col-pattern">{{ pattern.pattern }}</div>
                <div class="col-frequency">{{ pattern.frequency }}</div>
                <div class="col-percentage">{{ (pattern.percentage * 100).toFixed(2) }}%</div>
                <div class="col-bar">
                  <div class="bar-container">
                    <div
                      class="bar-fill"
                      :style="{ width: `${pattern.percentage * 100}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Structural Analysis -->
      <div class="structural-section glass-panel">
        <h2>結構分析</h2>
        <div class="controls">
          <select v-model="patternType" class="select-input">
            <option value="">全部類型</option>
            <option value="prefix">前綴模式</option>
            <option value="suffix">後綴模式</option>
            <option value="compound">複合模式</option>
          </select>
          <button
            class="query-button"
            :disabled="loadingStructural"
            @click="loadStructuralAnalysis"
          >
            查詢
          </button>
        </div>

        <div v-if="loadingStructural" class="loading-state">
          <div class="spinner"></div>
        </div>

        <div v-else-if="structuralData.length > 0" class="structural-results">
          <div class="structural-list">
            <div
              v-for="(item, index) in structuralData"
              :key="index"
              class="structural-item"
            >
              <div class="item-header">
                <span class="item-pattern">{{ item.pattern }}</span>
                <span class="item-count">{{ item.count }} 個</span>
              </div>
              <div class="item-structure">
                <span class="structure-label">結構:</span>
                <span class="structure-value">{{ item.structure }}</span>
              </div>
              <div class="item-examples">
                <span class="examples-label">示例:</span>
                <div class="examples-tags">
                  <span
                    v-for="(example, i) in item.examples?.slice(0, 5)"
                    :key="i"
                    class="example-tag"
                  >
                    {{ example }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pattern Tendency -->
      <div class="tendency-section glass-panel">
        <h2>模式傾向性</h2>
        <div class="controls">
          <input
            v-model="tendencyPattern"
            type="text"
            placeholder="輸入模式"
            class="text-input"
          />
          <select v-model="tendencyLevel" class="select-input">
            <option value="city">城市</option>
            <option value="county">區縣</option>
            <option value="township">鄉鎮</option>
          </select>
          <button
            class="query-button"
            :disabled="!tendencyPattern || loadingTendency"
            @click="loadPatternTendency"
          >
            查詢
          </button>
        </div>

        <div v-if="loadingTendency" class="loading-state">
          <div class="spinner"></div>
        </div>

        <div v-else-if="tendencyData.length > 0" class="tendency-results">
          <div class="tendency-chart">
            <div
              v-for="(item, index) in tendencyData.slice(0, 20)"
              :key="index"
              class="tendency-item"
              :class="getTendencyClass(item.z_score)"
            >
              <div class="tendency-region">{{ item.region_name }}</div>
              <div class="tendency-bar">
                <div
                  class="tendency-fill"
                  :style="{
                    width: `${Math.abs(item.z_score) * 10}%`,
                    background: item.z_score >= 0 ? 'var(--primary-color)' : '#e74c3c'
                  }"
                ></div>
              </div>
              <div class="tendency-value">
                <span class="z-score">Z: {{ item.z_score.toFixed(2) }}</span>
                <span class="frequency">頻率: {{ item.frequency }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pattern Comparison -->
      <div class="comparison-section glass-panel">
        <h2>模式比較</h2>
        <div class="comparison-info">
          <p>比較不同模式在各區域的分佈差異</p>
        </div>
        <div class="comparison-placeholder">
          <div class="placeholder-icon">📊</div>
          <p>選擇多個模式進行比較分析</p>
          <p class="placeholder-note">可視化展示不同模式的區域分佈對比</p>
        </div>
      </div>
    </div>
  </ExploreLayout>
</template>

<script setup>
import { ref } from 'vue'
import ExploreLayout from '@/layouts/ExploreLayout.vue'
import {
  getPatternFrequencyGlobal,
  getPatternFrequencyRegional,
  getPatternStructural,
  getPatternTendency
} from '@/api/index.js'
import { showError } from '@/utils/message.js'

// State
const globalPatterns = ref([])
const regionalPatterns = ref([])
const structuralData = ref([])
const tendencyData = ref([])

const loadingGlobal = ref(false)
const loadingRegional = ref(false)
const loadingStructural = ref(false)
const loadingTendency = ref(false)

const globalTopN = ref(50)
const globalMinCount = ref(5)

const regionLevel = ref('city')
const regionName = ref('')
const regionalTopN = ref(30)

const patternType = ref('')

const tendencyPattern = ref('')
const tendencyLevel = ref('city')

// Methods
const loadGlobalPatterns = async () => {
  loadingGlobal.value = true
  try {
    globalPatterns.value = await getPatternFrequencyGlobal({
      top_n: globalTopN.value,
      min_count: globalMinCount.value
    })
  } catch (error) {
    showError('加載全局模式失敗')
  } finally {
    loadingGlobal.value = false
  }
}

const loadRegionalPatterns = async () => {
  if (!regionName.value) return

  loadingRegional.value = true
  try {
    regionalPatterns.value = await getPatternFrequencyRegional({
      region_level: regionLevel.value,
      region_name: regionName.value,
      top_n: regionalTopN.value
    })
  } catch (error) {
    showError('加載區域模式失敗')
  } finally {
    loadingRegional.value = false
  }
}

const loadStructuralAnalysis = async () => {
  loadingStructural.value = true
  try {
    const params = {}
    if (patternType.value) {
      params.pattern_type = patternType.value
    }
    structuralData.value = await getPatternStructural(params)
  } catch (error) {
    showError('加載結構分析失敗')
  } finally {
    loadingStructural.value = false
  }
}

const loadPatternTendency = async () => {
  if (!tendencyPattern.value) return

  loadingTendency.value = true
  try {
    tendencyData.value = await getPatternTendency({
      pattern: tendencyPattern.value,
      region_level: tendencyLevel.value
    })
  } catch (error) {
    showError('加載傾向性數據失敗')
  } finally {
    loadingTendency.value = false
  }
}

const getTendencyClass = (zScore) => {
  if (Math.abs(zScore) >= 2) return 'strong-tendency'
  if (Math.abs(zScore) >= 1) return 'moderate-tendency'
  return ''
}
</script>

<style scoped>
.structural-patterns-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 30px;
  text-align: center;
}

.global-section,
.regional-section,
.structural-section,
.tendency-section,
.comparison-section {
  padding: 24px;
  margin-bottom: 30px;
}

.global-section h2,
.regional-section h2,
.structural-section h2,
.tendency-section h2,
.comparison-section h2 {
  font-size: 20px;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.controls {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.select-input,
.number-input,
.text-input {
  padding: 10px 16px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.5);
}

.select-input {
  width: 150px;
}

.number-input {
  width: 150px;
}

.text-input {
  flex: 1;
}

.query-button {
  padding: 10px 24px;
  background: var(--primary-color);
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
  border-top-color: var(--primary-color);
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
  padding: 20px;
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
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.pattern-text {
  font-size: 20px;
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
  color: var(--primary-color);
}

.pattern-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  transition: width 0.5s ease;
}

.results-table {
  border-radius: 12px;
  overflow: hidden;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 60px 200px 100px 100px 1fr;
  gap: 12px;
  padding: 12px 16px;
  align-items: center;
}

.table-header {
  background: rgba(74, 144, 226, 0.2);
  font-weight: 600;
  color: var(--text-primary);
}

.table-row {
  background: rgba(255, 255, 255, 0.3);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background 0.3s ease;
}

.table-row:hover {
  background: rgba(74, 144, 226, 0.1);
}

.col-pattern {
  font-weight: 600;
  color: var(--text-primary);
}

.bar-container {
  height: 20px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  overflow: hidden;
}

.structural-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.structural-item {
  padding: 20px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.item-pattern {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.item-count {
  padding: 4px 12px;
  background: rgba(74, 144, 226, 0.2);
  color: var(--primary-color);
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}

.item-structure {
  margin-bottom: 12px;
  font-size: 14px;
}

.structure-label {
  color: var(--text-secondary);
  margin-right: 8px;
}

.structure-value {
  color: var(--text-primary);
  font-weight: 500;
}

.item-examples {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.examples-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.examples-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.example-tag {
  padding: 4px 12px;
  background: rgba(80, 200, 120, 0.2);
  color: #2d8659;
  border-radius: 12px;
  font-size: 13px;
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
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  align-items: center;
}

.tendency-item.strong-tendency {
  background: rgba(243, 156, 18, 0.15);
}

.tendency-item.moderate-tendency {
  background: rgba(243, 156, 18, 0.08);
}

.tendency-region {
  font-weight: 600;
  color: var(--text-primary);
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
}

.tendency-value {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.z-score {
  font-weight: 600;
  color: var(--primary-color);
}

.frequency {
  color: var(--text-secondary);
}

.comparison-info {
  margin-bottom: 20px;
  padding: 12px;
  background: rgba(74, 144, 226, 0.1);
  border-radius: 8px;
  color: var(--text-primary);
}

.comparison-placeholder {
  padding: 80px 20px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  text-align: center;
}

.placeholder-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.comparison-placeholder p {
  font-size: 18px;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.placeholder-note {
  font-size: 14px !important;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .page-title {
    font-size: 24px;
  }

  .controls {
    flex-direction: column;
  }

  .select-input,
  .number-input {
    width: 100%;
  }

  .pattern-grid {
    grid-template-columns: 1fr;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .tendency-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
