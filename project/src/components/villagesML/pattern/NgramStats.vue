<template>
  <div class="ngram-stats-page">
    <h3 class="villagesml-subtab-title">模式分析 - N-gram 統計</h3>

    <!-- Info Banner (if coming from explore page) -->
    <div v-if="route.query.ngram" class="info-banner glass-panel">
      <span>正在分析 N-gram：<strong>{{ route.query.ngram }}</strong></span>
      <button @click="clearNgram" class="text-button">清除</button>
    </div>

    <!-- Shared Controls -->
    <div class="shared-controls glass-panel">
      <div class="controls">
        <input
          v-model="ngram"
          type="text"
          placeholder="輸入 N-gram"
          class="text-input"
        />
        <select v-model="level" class="select-input">
          <option value="city">城市</option>
          <option value="county">區縣</option>
          <option value="township">鄉鎮</option>
        </select>
        <button
          class="query-button"
          :disabled="!ngram || loading"
          @click="loadNgramData"
        >
          查詢
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state glass-panel">
      <div class="spinner"></div>
    </div>

    <template v-else-if="ngramData.length > 0">
      <!-- Regional Distribution -->
      <div class="regional-section glass-panel">
        <div class="section-header">
          <h2>區域分佈</h2>
          <button class="toggle-section-btn" @click="toggleRegionalSection">
            {{ regionalExpanded ? '收起' : '展開' }}
          </button>
        </div>

        <div v-show="regionalExpanded">
          <div class="regional-results">
          <!-- Position Filter Tabs -->
          <div class="position-tabs">
            <button
              class="tab-button"
              :class="{ active: regionalPositionFilter === 'all' }"
              @click="regionalPositionFilter = 'all'"
            >
              全部 ({{ positionCounts.all }})
            </button>
            <button
              class="tab-button"
              :class="{ active: regionalPositionFilter === 'middle' }"
              @click="regionalPositionFilter = 'middle'"
            >
              中間 ({{ positionCounts.middle }})
            </button>
            <button
              class="tab-button"
              :class="{ active: regionalPositionFilter === 'prefix' }"
              @click="regionalPositionFilter = 'prefix'"
            >
              前綴 ({{ positionCounts.prefix }})
            </button>
            <button
              class="tab-button"
              :class="{ active: regionalPositionFilter === 'suffix' }"
              @click="regionalPositionFilter = 'suffix'"
            >
              後綴 ({{ positionCounts.suffix }})
            </button>
          </div>

          <!-- Results Info -->
          <div class="results-info">
            <span>共 {{ filteredRegionalData.length }} 個區域（按頻率排序）</span>
          </div>

          <!-- Regional Chart -->
          <div class="regional-chart">
            <div
              v-for="(item, index) in filteredRegionalData"
              :key="index"
              class="regional-bar"
            >
              <div class="region-header">
                <RegionDisplay :item="item" mode="full" :skipCity="false" class="region-name" />
              </div>
              <div class="regional-stats">
                <div class="stat-item">
                  <span class="stat-label">頻率:</span>
                  <span class="stat-value">{{ item.frequency }}</span>
                </div>
                <div class="stat-item" v-if="item.position">
                  <span class="stat-label">位置:</span>
                  <span class="stat-value">{{ getNgramPositionLabel(item.position) }}</span>
                </div>
              </div>
              <div class="bar-container">
                <div
                  class="bar-fill"
                  :style="{ width: `${item.frequency != null ? (item.frequency / maxRegionalFrequency * 100) : 0}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tendency Analysis -->
    <div class="tendency-section glass-panel">
      <div class="section-header">
        <h2>傾向性分析</h2>
        <button class="toggle-section-btn" @click="toggleTendencySection">
          {{ tendencyExpanded ? '收起' : '展開' }}
        </button>
      </div>

      <div v-show="tendencyExpanded">
        <div class="tendency-results">
          <!-- Position Filter Tabs -->
          <div class="position-tabs">
            <button
              class="tab-button"
              :class="{ active: tendencyPositionFilter === 'all' }"
              @click="tendencyPositionFilter = 'all'"
            >
              全部 ({{ positionCounts.all }})
            </button>
            <button
              class="tab-button"
              :class="{ active: tendencyPositionFilter === 'middle' }"
              @click="tendencyPositionFilter = 'middle'"
            >
              中間 ({{ positionCounts.middle }})
            </button>
            <button
              class="tab-button"
              :class="{ active: tendencyPositionFilter === 'prefix' }"
              @click="tendencyPositionFilter = 'prefix'"
            >
              前綴 ({{ positionCounts.prefix }})
            </button>
            <button
              class="tab-button"
              :class="{ active: tendencyPositionFilter === 'suffix' }"
              @click="tendencyPositionFilter = 'suffix'"
            >
              後綴 ({{ positionCounts.suffix }})
            </button>
          </div>

          <!-- Results Info -->
          <div class="results-info">
            <span>共 {{ filteredTendencyData.length }} 個區域（按 Z 分數從高到低排序）</span>
          </div>

          <!-- Tendency Chart -->
          <div class="regional-chart">
            <div
              v-for="(item, index) in filteredTendencyData"
              :key="index"
              class="regional-bar"
            >
              <div class="region-header">
                <RegionDisplay :item="item" mode="full" :skipCity="false" class="region-name" />
              </div>
              <div class="regional-stats">
                <div class="stat-item">
                  <span class="stat-label">Z分數:</span>
                  <span class="stat-value" :class="getTendencyClassByZScore(item.z_score)">
                    {{ item.z_score != null ? item.z_score.toFixed(2) : 'N/A' }}
                  </span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">對數幾率:</span>
                  <span class="stat-value">
                    {{ item.log_odds != null ? item.log_odds.toFixed(2) : 'N/A' }}
                  </span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">傾向:</span>
                  <span class="stat-value">
                    {{ item.tendency_score != null ? item.tendency_score.toFixed(2) : 'N/A' }}x
                  </span>
                </div>
                <div class="stat-item" v-if="item.position">
                  <span class="stat-label">位置:</span>
                  <span class="stat-value">{{ getNgramPositionLabel(item.position) }}</span>
                </div>
              </div>
              <div class="bar-container">
                <div
                  class="bar-fill"
                  :style="{
                    width: `${item.z_score != null ? (Math.abs(item.z_score) / maxTendencyZScore * 100) : 0}%`,
                    background: (item.z_score || 0) >= 0 ? 'var(--color-primary)' : '#e74c3c'
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </template>

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
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RegionDisplay from '@/components/common/RegionDisplay.vue'
import {
  getNgramTendency,
  getNgramSignificance
} from '@/api/index.js'
import { showError } from '@/utils/message.js'
import { getSignificanceLabel, getSignificanceLevel, getNgramPositionLabel } from '@/config/villagesML.js'

const route = useRoute()
const router = useRouter()

// Unified State
const ngram = ref('')
const level = ref('city')
const hierarchy = ref({ city: null, county: null, township: null })
const ngramData = ref([])
const loading = ref(false)

// Section-specific State
const regionalPositionFilter = ref('all')
const regionalExpanded = ref(true)

const tendencyPositionFilter = ref('all')
const tendencyExpanded = ref(true)

const significanceNgram = ref('')
const significanceLevel = ref('city')
const significanceData = ref([])
const loadingSignificance = ref(false)

// Computed
const maxRegionalFrequency = computed(() => {
  if (filteredRegionalData.value.length === 0) return 1
  return Math.max(...filteredRegionalData.value.map(item => item.frequency || 0))
})

const maxTendencyZScore = computed(() => {
  if (filteredTendencyData.value.length === 0) return 1
  return Math.max(...filteredTendencyData.value.map(item => Math.abs(item.z_score || 0)))
})

const sortedRegionalData = computed(() => {
  // Sort by frequency for regional distribution
  return [...ngramData.value].sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
})

const sortedTendencyData = computed(() => {
  // Sort by z_score value (positive first, negative last)
  return [...ngramData.value].sort((a, b) => (b.z_score || 0) - (a.z_score || 0))
})

const filteredRegionalData = computed(() => {
  return sortedRegionalData.value.filter(item => item.position === regionalPositionFilter.value)
})

const filteredTendencyData = computed(() => {
  return sortedTendencyData.value.filter(item => item.position === tendencyPositionFilter.value)
})

const positionCounts = computed(() => {
  const counts = {
    all: 0,
    prefix: 0,
    middle: 0,
    suffix: 0
  }
  ngramData.value.forEach(item => {
    if (item.position && counts[item.position] !== undefined) {
      counts[item.position]++
    }
  })
  return counts
})

// Methods
const loadNgramData = async () => {
  if (!ngram.value) return

  loading.value = true
  try {
    ngramData.value = await getNgramTendency({
      ngram: ngram.value,
      region_level: level.value,
      ...hierarchy.value
    })
  } catch (error) {
    showError('加載 N-gram 數據失敗')
  } finally {
    loading.value = false
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

const getTendencyClassByZScore = (zScore) => {
  // z_score > 0 means preference, < 0 means avoidance
  if (!zScore) return ''
  if (zScore >= 2) return 'strong-preference'
  if (zScore >= 1) return 'moderate-preference'
  if (zScore <= -2) return 'strong-avoidance'
  if (zScore <= -1) return 'moderate-avoidance'
  return ''
}

const getTendencyClassByScore = (tendencyScore) => {
  // tendency_score > 1 means preference, < 1 means avoidance
  if (tendencyScore >= 2) return 'strong-preference'
  if (tendencyScore >= 1.5) return 'moderate-preference'
  if (tendencyScore <= 0.5) return 'strong-avoidance'
  if (tendencyScore <= 0.75) return 'moderate-avoidance'
  return ''
}

const getPValueClass = (pValue) => {
  const level = getSignificanceLevel(pValue)
  if (level.symbol === '***') return 'p-very-significant'
  if (level.symbol === '**') return 'p-significant'
  if (level.symbol === '*') return 'p-marginal'
  return 'p-not-significant'
}

const getSignificanceBadge = (pValue) => {
  const level = getSignificanceLevel(pValue)
  if (level.symbol === '***') return 'badge-very-significant'
  if (level.symbol === '**') return 'badge-significant'
  if (level.symbol === '*') return 'badge-marginal'
  return 'badge-not-significant'
}

const clearNgram = () => {
  router.push({
    path: '/villagesML',
    query: {
      module: 'pattern',
      subtab: 'ngram-stats'
    }
  })
  ngram.value = ''
  significanceNgram.value = ''
}

const toggleRegionalSection = () => {
  regionalExpanded.value = !regionalExpanded.value
}

const toggleTendencySection = () => {
  tendencyExpanded.value = !tendencyExpanded.value
}

onMounted(() => {
  const ngramParam = route.query.ngram
  if (ngramParam) {
    ngram.value = ngramParam
    significanceNgram.value = ngramParam
    // Auto-trigger query
    loadNgramData()
  }
})

// Watch for route query changes (for KeepAlive scenarios)
watch(
  () => route.query.ngram,
  (newNgram) => {
    if (newNgram) {
      ngram.value = newNgram
      significanceNgram.value = newNgram
      // Auto-trigger query
      loadNgramData()
    }
  }
)
</script>

<style scoped>
.ngram-stats-page {
  padding: 12px;
  max-width: 1400px;
  margin: 0 auto;
}

.info-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: rgba(74, 144, 226, 0.1);
  border-radius: 10px;
  font-size: 14px;
}

.shared-controls {
  padding: 16px;
  margin-bottom: 16px;
}

.loading-state {
  padding: 40px;
  text-align: center;
}

.info-banner strong {
  color: var(--color-primary);
  margin: 0 6px;
}

.text-button {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 6px;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

.text-button:hover {
  background: rgba(74, 144, 226, 0.1);
  border-color: var(--color-primary);
}

.regional-section,
.tendency-section,
.significance-section {
  padding: 16px;
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h2 {
  font-size: 16px;
  margin: 0;
  color: var(--text-primary);
}

.toggle-section-btn {
  padding: 6px 16px;
  background: rgba(74, 144, 226, 0.2);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 6px;
  font-size: 13px;
  color: var(--color-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-section-btn:hover {
  background: rgba(74, 144, 226, 0.3);
  border-color: var(--color-primary);
}

.regional-section h2,
.tendency-section h2,
.significance-section h2 {
  font-size: 16px;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.controls {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.select-input,
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

.text-input {
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

.position-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.tab-button {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.5);
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-button:hover {
  background: rgba(74, 144, 226, 0.1);
  border-color: var(--color-primary);
}

.tab-button.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.results-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: rgba(74, 144, 226, 0.1);
  border-radius: 8px;
}

.results-count {
  font-size: 13px;
  color: var(--text-secondary);
}

.control-buttons {
  display: flex;
  gap: 8px;
}

.control-btn {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: rgba(74, 144, 226, 0.2);
  border-color: var(--color-primary);
}

.results-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: rgba(74, 144, 226, 0.1);
  border-radius: 8px;
}

.results-count {
  font-size: 13px;
  color: var(--text-secondary);
}

.control-buttons {
  display: flex;
  gap: 8px;
}

.control-btn {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: rgba(74, 144, 226, 0.2);
  border-color: var(--color-primary);
}

.results-info {
  padding: 8px 12px;
  margin-bottom: 12px;
  background: rgba(74, 144, 226, 0.1);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  text-align: center;
}

.regional-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.regional-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  transition: background 0.3s ease;
}

.regional-bar:hover {
  background: rgba(74, 144, 226, 0.1);
}

.region-header {
  margin-bottom: 4px;
}

.region-name {
  font-weight: 600;
  font-size: 15px;
  color: var(--text-primary);
}

.regional-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  gap: 6px;
  align-items: center;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-value.tendency {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 13px;
}

.stat-value.strong-preference {
  background: rgba(46, 204, 113, 0.2);
  color: #27ae60;
}

.stat-value.moderate-preference {
  background: rgba(52, 152, 219, 0.2);
  color: #2980b9;
}

.stat-value.strong-avoidance {
  background: rgba(231, 76, 60, 0.2);
  color: #c0392b;
}

.stat-value.moderate-avoidance {
  background: rgba(243, 156, 18, 0.2);
  color: #d68910;
}

.regional-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  transition: background 0.3s ease;
}

.regional-bar:hover {
  background: rgba(74, 144, 226, 0.1);
}

.regional-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  gap: 6px;
  align-items: center;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-value.tendency {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 13px;
}

.stat-value.strong-preference {
  background: rgba(46, 204, 113, 0.2);
  color: #27ae60;
}

.stat-value.moderate-preference {
  background: rgba(52, 152, 219, 0.2);
  color: #2980b9;
}

.stat-value.strong-avoidance {
  background: rgba(231, 76, 60, 0.2);
  color: #c0392b;
}

.stat-value.moderate-avoidance {
  background: rgba(243, 156, 18, 0.2);
  color: #d68910;
}

.region-name {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
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
  .controls {
    flex-direction: column;
  }

  .select-input {
    width: 100%;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .section-header {
    flex-direction: row;
    justify-content: space-between;
  }
}
</style>
