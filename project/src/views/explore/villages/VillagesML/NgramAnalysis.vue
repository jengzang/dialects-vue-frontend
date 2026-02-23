<template>
  <ExploreLayout>
    <div class="ngram-analysis-page">
      <h1 class="page-title">📐 N-gram 分析</h1>

      <!-- N-gram Frequency -->
      <div class="frequency-section glass-panel">
        <h2>N-gram 頻率分析</h2>
        <div class="controls">
          <select v-model.number="nValue" class="select-input">
            <option :value="1">單字 (Unigrams)</option>
            <option :value="2">二元組 (Bigrams)</option>
            <option :value="3">三元組 (Trigrams)</option>
          </select>
          <input
            v-model.number="minCount"
            type="number"
            min="1"
            placeholder="最小出現次數"
            class="number-input"
          />
          <input
            v-model.number="topN"
            type="number"
            min="10"
            max="100"
            placeholder="返回數量"
            class="number-input"
          />
          <button
            class="query-button"
            :disabled="loadingFrequency"
            @click="loadFrequency"
          >
            查詢
          </button>
        </div>

        <div v-if="loadingFrequency" class="loading-state">
          <div class="spinner"></div>
          <p>加載中...</p>
        </div>

        <div v-else-if="frequencyData.length > 0" class="frequency-results">
          <div class="results-header">
            <div class="col-rank">排名</div>
            <div class="col-ngram">N-gram</div>
            <div class="col-frequency">頻率</div>
            <div class="col-percentage">百分比</div>
            <div class="col-bar">分佈</div>
          </div>
          <div class="results-body">
            <div
              v-for="(item, index) in frequencyData"
              :key="index"
              class="result-row"
              :class="{ 'top-10': index < 10 }"
            >
              <div class="col-rank">{{ index + 1 }}</div>
              <div class="col-ngram">{{ item.ngram }}</div>
              <div class="col-frequency">{{ item.frequency }}</div>
              <div class="col-percentage">{{ (item.percentage * 100).toFixed(2) }}%</div>
              <div class="col-bar">
                <div class="bar-container">
                  <div
                    class="bar-fill"
                    :style="{ width: `${item.percentage * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pattern Search -->
      <div class="pattern-section glass-panel">
        <h2>模式搜尋</h2>
        <div class="search-controls">
          <input
            v-model="searchPattern"
            type="text"
            placeholder="輸入模式（支持通配符 *）"
            class="pattern-input"
            @keyup.enter="searchPatterns"
          />
          <select v-model.number="patternN" class="select-input">
            <option :value="1">單字</option>
            <option :value="2">二元組</option>
            <option :value="3">三元組</option>
          </select>
          <button
            class="query-button"
            :disabled="!searchPattern || loadingPatterns"
            @click="searchPatterns"
          >
            搜尋
          </button>
        </div>

        <div v-if="loadingPatterns" class="loading-state">
          <div class="spinner"></div>
        </div>

        <div v-else-if="patternResults.length > 0" class="pattern-results">
          <div class="pattern-count">找到 {{ patternResults.length }} 個匹配模式</div>
          <div class="pattern-list">
            <div
              v-for="(item, index) in patternResults"
              :key="index"
              class="pattern-item"
            >
              <div class="pattern-ngram">{{ item.ngram }}</div>
              <div class="pattern-frequency">{{ item.frequency }} 次</div>
              <div class="pattern-examples">
                <span
                  v-for="(example, i) in item.examples?.slice(0, 3)"
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

      <!-- Regional Distribution -->
      <div class="regional-section glass-panel">
        <h2>區域分佈</h2>
        <div class="controls">
          <input
            v-model="regionalNgram"
            type="text"
            placeholder="輸入 N-gram"
            class="text-input"
          />
          <select v-model="regionalLevel" class="select-input">
            <option value="city">城市</option>
            <option value="county">區縣</option>
            <option value="township">鄉鎮</option>
          </select>
          <button
            class="query-button"
            :disabled="!regionalNgram || loadingRegional"
            @click="loadRegionalDistribution"
          >
            查詢
          </button>
        </div>

        <div v-if="loadingRegional" class="loading-state">
          <div class="spinner"></div>
        </div>

        <div v-else-if="regionalData.length > 0" class="regional-results">
          <div class="regional-chart">
            <div
              v-for="(item, index) in regionalData.slice(0, 20)"
              :key="index"
              class="regional-bar"
            >
              <div class="region-name">{{ item.region_name }}</div>
              <div class="bar-container">
                <div
                  class="bar-fill"
                  :style="{ width: `${(item.percentage || item.frequency / maxRegionalFreq) * 100}%` }"
                ></div>
              </div>
              <div class="region-value">
                {{ item.frequency }} ({{ ((item.percentage || 0) * 100).toFixed(1) }}%)
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tendency Analysis -->
      <div class="tendency-section glass-panel">
        <h2>傾向性分析</h2>
        <div class="controls">
          <input
            v-model="tendencyNgram"
            type="text"
            placeholder="輸入 N-gram"
            class="text-input"
          />
          <select v-model="tendencyLevel" class="select-input">
            <option value="city">城市</option>
            <option value="county">區縣</option>
            <option value="township">鄉鎮</option>
          </select>
          <button
            class="query-button"
            :disabled="!tendencyNgram || loadingTendency"
            @click="loadTendency"
          >
            查詢
          </button>
        </div>

        <div v-if="loadingTendency" class="loading-state">
          <div class="spinner"></div>
        </div>

        <div v-else-if="tendencyData.length > 0" class="tendency-results">
          <div class="tendency-table">
            <div class="table-header">
              <div class="col">區域</div>
              <div class="col">Z分數</div>
              <div class="col">頻率</div>
              <div class="col">傾向性</div>
            </div>
            <div class="table-body">
              <div
                v-for="(item, index) in tendencyData.slice(0, 20)"
                :key="index"
                class="table-row"
                :class="getTendencyClass(item.z_score)"
              >
                <div class="col">{{ item.region_name }}</div>
                <div class="col">{{ item.z_score.toFixed(2) }}</div>
                <div class="col">{{ item.frequency }}</div>
                <div class="col">
                  <div class="tendency-bar">
                    <div
                      class="tendency-fill"
                      :style="{
                        width: `${Math.abs(item.z_score) * 10}%`,
                        background: item.z_score >= 0 ? 'var(--primary-color)' : '#e74c3c'
                      }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Significance Analysis -->
      <div class="significance-section glass-panel">
        <h2>顯著性分析</h2>
        <div class="controls">
          <input
            v-model="significanceNgram"
            type="text"
            placeholder="輸入 N-gram"
            class="text-input"
          />
          <select v-model="significanceLevel" class="select-input">
            <option value="city">城市</option>
            <option value="county">區縣</option>
            <option value="township">鄉鎮</option>
          </select>
          <button
            class="query-button"
            :disabled="!significanceNgram || loadingSignificance"
            @click="loadSignificance"
          >
            查詢
          </button>
        </div>

        <div v-if="loadingSignificance" class="loading-state">
          <div class="spinner"></div>
        </div>

        <div v-else-if="significanceData.length > 0" class="significance-results">
          <div class="significance-table">
            <div class="table-header">
              <div class="col">區域</div>
              <div class="col">卡方值</div>
              <div class="col">P值</div>
              <div class="col">顯著性</div>
            </div>
            <div class="table-body">
              <div
                v-for="(item, index) in significanceData.slice(0, 20)"
                :key="index"
                class="table-row"
                :class="{ 'significant': item.p_value < 0.05 }"
              >
                <div class="col">{{ item.region_name }}</div>
                <div class="col">{{ item.chi_square.toFixed(4) }}</div>
                <div class="col">
                  <span :class="getPValueClass(item.p_value)">
                    {{ item.p_value.toFixed(6) }}
                  </span>
                </div>
                <div class="col">
                  <span class="sig-badge" :class="getSignificanceBadge(item.p_value)">
                    {{ getSignificanceLabel(item.p_value) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ExploreLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import ExploreLayout from '@/layouts/ExploreLayout.vue'
import {
  getNgramFrequency,
  getNgramPatterns,
  getNgramRegional,
  getNgramTendency,
  getNgramSignificance
} from '@/api/index.js'
import { showError } from '@/utils/message.js'

// State
const nValue = ref(1)
const minCount = ref(5)
const topN = ref(50)
const frequencyData = ref([])

const searchPattern = ref('')
const patternN = ref(1)
const patternResults = ref([])

const regionalNgram = ref('')
const regionalLevel = ref('city')
const regionalData = ref([])

const tendencyNgram = ref('')
const tendencyLevel = ref('city')
const tendencyData = ref([])

const significanceNgram = ref('')
const significanceLevel = ref('city')
const significanceData = ref([])

const loadingFrequency = ref(false)
const loadingPatterns = ref(false)
const loadingRegional = ref(false)
const loadingTendency = ref(false)
const loadingSignificance = ref(false)

// Computed
const maxRegionalFreq = computed(() => {
  if (regionalData.value.length === 0) return 1
  return Math.max(...regionalData.value.map(item => item.frequency))
})

// Methods
const loadFrequency = async () => {
  loadingFrequency.value = true
  try {
    frequencyData.value = await getNgramFrequency({
      n: nValue.value,
      top_n: topN.value,
      min_count: minCount.value
    })
  } catch (error) {
    showError('加載頻率數據失敗')
  } finally {
    loadingFrequency.value = false
  }
}

const searchPatterns = async () => {
  if (!searchPattern.value) return

  loadingPatterns.value = true
  try {
    patternResults.value = await getNgramPatterns({
      pattern: searchPattern.value,
      n: patternN.value
    })
  } catch (error) {
    showError('搜尋模式失敗')
  } finally {
    loadingPatterns.value = false
  }
}

const loadRegionalDistribution = async () => {
  if (!regionalNgram.value) return

  loadingRegional.value = true
  try {
    regionalData.value = await getNgramRegional({
      ngram: regionalNgram.value,
      region_level: regionalLevel.value
    })
  } catch (error) {
    showError('加載區域分佈失敗')
  } finally {
    loadingRegional.value = false
  }
}

const loadTendency = async () => {
  if (!tendencyNgram.value) return

  loadingTendency.value = true
  try {
    tendencyData.value = await getNgramTendency({
      ngram: tendencyNgram.value,
      region_level: tendencyLevel.value
    })
  } catch (error) {
    showError('加載傾向性數據失敗')
  } finally {
    loadingTendency.value = false
  }
}

const loadSignificance = async () => {
  if (!significanceNgram.value) return

  loadingSignificance.value = true
  try {
    significanceData.value = await getNgramSignificance({
      ngram: significanceNgram.value,
      region_level: significanceLevel.value
    })
  } catch (error) {
    showError('加載顯著性數據失敗')
  } finally {
    loadingSignificance.value = false
  }
}

const getTendencyClass = (zScore) => {
  if (Math.abs(zScore) >= 2) return 'strong-tendency'
  if (Math.abs(zScore) >= 1) return 'moderate-tendency'
  return ''
}

const getPValueClass = (pValue) => {
  if (pValue < 0.001) return 'p-very-significant'
  if (pValue < 0.01) return 'p-significant'
  if (pValue < 0.05) return 'p-marginal'
  return 'p-not-significant'
}

const getSignificanceBadge = (pValue) => {
  if (pValue < 0.001) return 'badge-very-significant'
  if (pValue < 0.01) return 'badge-significant'
  if (pValue < 0.05) return 'badge-marginal'
  return 'badge-not-significant'
}

const getSignificanceLabel = (pValue) => {
  if (pValue < 0.001) return '***'
  if (pValue < 0.01) return '**'
  if (pValue < 0.05) return '*'
  return 'n.s.'
}
</script>

<style scoped>
.ngram-analysis-page {
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

.frequency-section,
.pattern-section,
.regional-section,
.tendency-section,
.significance-section {
  padding: 24px;
  margin-bottom: 30px;
}

.frequency-section h2,
.pattern-section h2,
.regional-section h2,
.tendency-section h2,
.significance-section h2 {
  font-size: 20px;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.controls,
.search-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.select-input,
.number-input,
.text-input,
.pattern-input {
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

.pattern-input {
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

.frequency-results {
  border-radius: 12px;
  overflow: hidden;
}

.results-header,
.result-row {
  display: grid;
  grid-template-columns: 60px 150px 100px 100px 1fr;
  gap: 12px;
  padding: 12px 16px;
  align-items: center;
}

.results-header {
  background: rgba(74, 144, 226, 0.2);
  font-weight: 600;
  color: var(--text-primary);
}

.result-row {
  background: rgba(255, 255, 255, 0.3);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background 0.3s ease;
}

.result-row:hover {
  background: rgba(74, 144, 226, 0.1);
}

.result-row.top-10 {
  background: rgba(243, 156, 18, 0.1);
}

.col-ngram {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 16px;
}

.bar-container {
  height: 20px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  transition: width 0.5s ease;
}

.pattern-count {
  padding: 12px;
  background: rgba(74, 144, 226, 0.1);
  border-radius: 8px;
  margin-bottom: 16px;
  color: var(--text-primary);
  font-weight: 500;
}

.pattern-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pattern-item {
  padding: 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  display: grid;
  grid-template-columns: 150px 100px 1fr;
  gap: 16px;
  align-items: center;
}

.pattern-ngram {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.pattern-frequency {
  color: var(--text-secondary);
}

.pattern-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.example-tag {
  padding: 4px 12px;
  background: rgba(74, 144, 226, 0.2);
  color: var(--primary-color);
  border-radius: 12px;
  font-size: 13px;
}

.regional-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.regional-bar {
  display: grid;
  grid-template-columns: 150px 1fr 150px;
  gap: 12px;
  align-items: center;
}

.region-name {
  font-weight: 500;
  color: var(--text-primary);
}

.region-value {
  font-size: 14px;
  color: var(--text-secondary);
  text-align: right;
}

.tendency-table,
.significance-table {
  border-radius: 12px;
  overflow: hidden;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 2fr;
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

.table-row.strong-tendency {
  background: rgba(243, 156, 18, 0.15);
}

.table-row.moderate-tendency {
  background: rgba(243, 156, 18, 0.08);
}

.table-row.significant {
  background: rgba(80, 200, 120, 0.1);
}

.tendency-bar {
  height: 20px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  overflow: hidden;
}

.tendency-fill {
  height: 100%;
  transition: width 0.5s ease;
}

.p-very-significant {
  color: #27ae60;
  font-weight: 700;
}

.p-significant {
  color: #2ecc71;
  font-weight: 600;
}

.p-marginal {
  color: #f39c12;
  font-weight: 500;
}

.p-not-significant {
  color: var(--text-secondary);
}

.sig-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.badge-very-significant {
  background: rgba(39, 174, 96, 0.2);
  color: #27ae60;
}

.badge-significant {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
}

.badge-marginal {
  background: rgba(243, 156, 18, 0.2);
  color: #f39c12;
}

.badge-not-significant {
  background: rgba(149, 165, 166, 0.2);
  color: #95a5a6;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 24px;
  }

  .controls,
  .search-controls {
    flex-direction: column;
  }

  .select-input,
  .number-input {
    width: 100%;
  }

  .results-header,
  .result-row,
  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
