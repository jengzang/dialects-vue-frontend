<template>
  <div class="ngram-explore-page">
    <h3 class="villagesml-subtab-title">模式分析 - N-gram 探索</h3>

    <!-- Statistics Banner -->
    <div v-if="ngramStats" class="stats-banner glass-panel">
      <div class="banner-item">
        <span class="banner-label">總 N-gram</span>
        <span class="banner-value">{{ formatBannerNum(ngramStats.ngram_significance?.total) }}</span>
      </div>
      <div class="banner-divider"></div>
      <div class="banner-item">
        <span class="banner-label">顯著 N-gram</span>
        <span class="banner-value highlight">{{ formatBannerNum(ngramStats.ngram_significance?.significant) }}</span>
      </div>
      <div class="banner-divider"></div>
      <div class="banner-item">
        <span class="banner-label">顯著率</span>
        <span class="banner-value">{{ formatRate(ngramStats.ngram_significance?.significance_rate) }}</span>
      </div>
      <div class="banner-divider"></div>
      <div class="banner-item" v-if="ngramStats.by_level">
        <span class="banner-label">城市 / 區縣 / 鄉鎮</span>
        <span class="banner-value">
          {{ formatRate(ngramStats.by_level.city?.rate) }} /
          {{ formatRate(ngramStats.by_level.county?.rate) }} /
          {{ formatRate(ngramStats.by_level.township?.rate) }}
        </span>
      </div>
      <div class="banner-tip">只顯示統計顯著的 N-gram (p &lt; 0.05)</div>
    </div>

    <!-- N-gram Frequency -->
    <div class="frequency-section glass-panel">
      <h2>N-gram 頻率分析</h2>
      <div class="controls">
        <select v-model.number="nValue" class="select-input">
          <option :value="2">二元組 (Bigrams)</option>
          <option :value="3">三元組 (Trigrams)</option>
          <option :value="4">四元組 (4-grams)</option>
        </select>
        <select v-model="position" class="select-input">
          <option value="all">所有位置</option>
          <option value="prefix">前綴</option>
          <option value="middle">中間</option>
          <option value="suffix">後綴</option>
        </select>
        <input
          v-model.number="minFrequency"
          type="number"
          min="1"
          placeholder="最小頻次 (≥1)"
          class="number-input"
        />
        <input
          v-model.number="topK"
          type="number"
          min="1"
          max="1000"
          placeholder="返回數量 (1-1000)"
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
          <div class="col-position">位置</div>
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
            <div class="col-ngram clickable" @click="goToStats(item.ngram)">
              {{ item.ngram }}
              <span class="goto-icon">→</span>
            </div>
            <div class="col-position">
              <span class="position-badge" :class="`position-${item.position}`">
                {{ getPositionLabel(item.position) }}
              </span>
            </div>
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
          <option :value="2">二元組</option>
          <option :value="3">三元組</option>
          <option :value="4">四元組</option>
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
            <div class="pattern-ngram clickable" @click="goToStats(item.pattern)">
              {{ item.pattern }}
              <span class="goto-icon">→</span>
            </div>
            <div class="pattern-type">
              <span class="type-badge" :class="`type-${item.pattern_type}`">
                {{ getPatternTypeLabel(item.pattern_type) }}
              </span>
            </div>
            <div class="pattern-frequency">{{ item.frequency }} 次</div>
            <div class="pattern-examples">
              <span class="example-tag">{{ item.example }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  getNgramFrequency,
  getNgramPatterns,
  getNgramStatistics
} from '@/api/index.js'
import { showError } from '@/utils/message.js'

const router = useRouter()

// State
const ngramStats = ref(null)
const nValue = ref(2)
const position = ref('all')
const minFrequency = ref(5)
const topK = ref(100)
const frequencyData = ref([])

const searchPattern = ref('')
const patternN = ref(2)
const patternResults = ref([])

const loadingFrequency = ref(false)
const loadingPatterns = ref(false)

// Methods
const getPositionLabel = (pos) => {
  const labels = {
    'all': '全部',
    'prefix': '前綴',
    'middle': '中間',
    'suffix': '後綴'
  }
  return labels[pos] || pos
}

const getPatternTypeLabel = (type) => {
  const labels = {
    'prefix': '前綴',
    'suffix': '後綴',
    'middle': '中間',
    'all': '全部'
  }
  return labels[type] || type
}

const formatBannerNum = (num) => num ? num.toLocaleString('zh-CN') : '—'
const formatRate = (rate) => rate != null ? (rate * 100).toFixed(1) + '%' : '—'

const loadFrequency = async () => {
  loadingFrequency.value = true
  try {
    frequencyData.value = await getNgramFrequency({
      n: nValue.value,
      top_k: topK.value,
      min_frequency: minFrequency.value,
      position: position.value
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

const goToStats = (ngram) => {
  router.push({
    path: '/villagesML',
    query: {
      module: 'pattern',
      subtab: 'ngram-stats',
      ngram: ngram
    }
  })
}

onMounted(async () => {
  try {
    ngramStats.value = await getNgramStatistics()
  } catch {
    // Non-critical
  }
})
</script>

<style scoped>
.ngram-explore-page {
  padding: 12px;
  max-width: 1400px;
  margin: 0 auto;
}

.frequency-section,
.pattern-section {
  padding: 16px;
  margin-bottom: 16px;
}

.stats-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 0;
  padding: 10px 14px;
  margin-bottom: 14px;
  background: rgba(74, 144, 226, 0.08);
  border: 1px solid rgba(74, 144, 226, 0.25);
  border-radius: 10px;
  font-size: 13px;
}

.banner-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 14px;
}

.banner-label {
  color: var(--text-secondary);
  font-size: 11px;
  margin-bottom: 2px;
}

.banner-value {
  font-weight: 600;
  color: var(--text-primary);
}

.banner-value.highlight {
  color: var(--color-primary-hover, #4a90e2);
}

.banner-divider {
  width: 1px;
  height: 32px;
  background: rgba(74, 144, 226, 0.2);
}

.banner-tip {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-secondary);
  font-style: italic;
  padding-left: 12px;
}

.frequency-section h2,
.pattern-section h2 {
  font-size: 16px;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.controls,
.search-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.select-input,
.number-input,
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

.pattern-input {
  flex: 1;
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

.frequency-results {
  border-radius: 12px;
  overflow: hidden;
}

.results-header,
.result-row {
  display: grid;
  grid-template-columns: 60px 150px 80px 100px 100px 1fr;
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

.col-ngram.clickable {
  cursor: pointer;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.col-ngram.clickable:hover {
  color: var(--color-primary);
}

.goto-icon {
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.col-ngram.clickable:hover .goto-icon {
  opacity: 1;
}

.position-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  display: inline-block;
}

.position-all {
  background: rgba(149, 165, 166, 0.2);
  color: #7f8c8d;
}

.position-prefix {
  background: rgba(52, 152, 219, 0.2);
  color: #2980b9;
}

.position-middle {
  background: rgba(155, 89, 182, 0.2);
  color: #8e44ad;
}

.position-suffix {
  background: rgba(46, 204, 113, 0.2);
  color: #27ae60;
}

.bar-container {
  height: 20px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-hover));
  transition: width 0.5s ease;
}

.pattern-results {
  display: flex;
  flex-direction: column;
  justify-content: center;
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
  grid-template-columns: 150px 100px 100px 1fr;
  gap: 16px;
  align-items: center;
}

.pattern-ngram {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.pattern-ngram.clickable {
  cursor: pointer;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.pattern-ngram.clickable:hover {
  color: var(--color-primary);
}

.pattern-ngram.clickable:hover .goto-icon {
  opacity: 1;
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
  color: var(--color-primary);
  border-radius: 12px;
  font-size: 13px;
}

.type-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  display: inline-block;
}

.type-prefix {
  background: rgba(52, 152, 219, 0.2);
  color: #2980b9;
}

.type-suffix {
  background: rgba(46, 204, 113, 0.2);
  color: #27ae60;
}

.type-middle {
  background: rgba(155, 89, 182, 0.2);
  color: #8e44ad;
}

.type-all {
  background: rgba(149, 165, 166, 0.2);
  color: #7f8c8d;
}

@media (max-width: 768px) {
  .controls,
  .search-controls {
    flex-direction: column;
  }

  .select-input,
  .number-input {
    width: 100%;
  }

  .results-header,
  .result-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
