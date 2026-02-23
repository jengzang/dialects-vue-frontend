<template>
  <div class="feature-extraction-page">
    <!-- Header -->
    <div class="page-header">
      <h2>🔐 特徵提取 Feature Extraction</h2>
      <p class="subtitle">為自訂村莊集合提取特徵向量</p>
      <div v-if="!isAuthenticated" class="auth-warning">
        <span class="lock-icon">🔒</span>
        <span>此功能需要登入</span>
        <button @click="goToAuth" class="glass-button small">前往登入</button>
      </div>
    </div>

    <!-- Village Selector -->
    <div class="glass-panel selector-panel">
      <div class="panel-header">
        <h3>選擇村莊 Select Villages</h3>
        <span class="count-badge">已選擇: {{ selectedVillages.length }}</span>
      </div>
      <div class="selector-content">
        <!-- Search Bar -->
        <div class="search-bar">
          <input
            v-model="searchQuery"
            @input="handleSearch"
            type="text"
            placeholder="搜尋村莊名稱..."
            class="glass-input"
          >
          <button @click="clearSearch" class="glass-button small secondary">清除</button>
        </div>

        <!-- Filter Controls -->
        <div class="filter-controls">
          <div class="filter-item">
            <label>區域篩選:</label>
            <select v-model="filterRegion" @change="handleFilterChange" class="glass-select">
              <option value="">全部區域</option>
              <option v-for="region in availableRegions" :key="region.name || region" :value="region.name || region">
                {{ region.name || region }}
              </option>
            </select>
          </div>
          <div class="filter-item">
            <label>快速選擇:</label>
            <button @click="selectTop100" class="glass-button small">前 100 個</button>
            <button @click="selectRandom50" class="glass-button small">隨機 50 個</button>
            <button @click="clearSelection" class="glass-button small secondary">清空選擇</button>
          </div>
        </div>

        <!-- Village List -->
        <div class="village-list">
          <div
            v-for="village in filteredVillages"
            :key="village.id"
            @click="toggleVillage(village)"
            :class="['village-item', { selected: isSelected(village.id) }]"
          >
            <input type="checkbox" :checked="isSelected(village.id)" @click.stop="toggleVillage(village)">
            <span class="village-name">{{ village.name }}</span>
            <span class="village-region">{{ village.region }}</span>
          </div>
        </div>

        <!-- Pagination -->
        <div class="pagination">
          <button @click="prevPage" :disabled="currentPage === 1" class="glass-button small">上一頁</button>
          <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 頁</span>
          <button @click="nextPage" :disabled="currentPage === totalPages" class="glass-button small">下一頁</button>
        </div>
      </div>
    </div>

    <!-- Feature Type Selector -->
    <div class="glass-panel feature-type-panel">
      <div class="panel-header">
        <h3>特徵類型 Feature Types</h3>
      </div>
      <div class="feature-types">
        <label v-for="type in featureTypes" :key="type.value" class="feature-type-item">
          <input type="checkbox" v-model="selectedFeatureTypes" :value="type.value">
          <span class="type-label">{{ type.label }}</span>
          <span class="type-desc">{{ type.description }}</span>
        </label>
      </div>
    </div>

    <!-- Extraction Controls -->
    <div class="glass-panel controls-panel">
      <div class="panel-header">
        <h3>提取控制 Extraction Controls</h3>
      </div>
      <div class="controls-content">
        <div class="control-row">
          <label>聚合方法:</label>
          <select v-model="aggregationMethod" class="glass-select">
            <option value="mean">平均值 (Mean)</option>
            <option value="sum">總和 (Sum)</option>
            <option value="max">最大值 (Max)</option>
            <option value="min">最小值 (Min)</option>
          </select>
        </div>
        <div class="control-row">
          <label>標準化:</label>
          <input type="checkbox" v-model="normalize">
          <span>對特徵向量進行標準化</span>
        </div>
        <div class="button-group">
          <button
            @click="extractFeatures"
            :disabled="!canExtract || loading"
            class="glass-button primary large"
          >
            <span v-if="!loading">提取特徵 Extract Features</span>
            <span v-else>提取中...</span>
          </button>
          <button
            @click="aggregateFeatures"
            :disabled="!extractionResults || loading"
            class="glass-button secondary large"
          >
            聚合特徵 Aggregate Features
          </button>
        </div>
      </div>
    </div>

    <!-- Extraction Results -->
    <div v-if="extractionResults" class="glass-panel results-panel">
      <div class="panel-header">
        <h3>提取結果 Extraction Results</h3>
        <button @click="exportResults" class="glass-button small">匯出 CSV</button>
      </div>
      <div class="results-content">
        <!-- Summary Stats -->
        <div class="summary-stats">
          <div class="stat-card">
            <div class="stat-label">村莊數量</div>
            <div class="stat-value">{{ extractionResults.village_count }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">特徵維度</div>
            <div class="stat-value">{{ extractionResults.feature_dimension }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">提取時間</div>
            <div class="stat-value">{{ extractionResults.extraction_time }}ms</div>
          </div>
        </div>

        <!-- Feature Table -->
        <div class="feature-table-wrapper">
          <table class="glass-table">
            <thead>
              <tr>
                <th>村莊 ID</th>
                <th>村莊名稱</th>
                <th>區域</th>
                <th v-for="(type, idx) in selectedFeatureTypes" :key="idx">{{ getFeatureLabel(type) }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="result in paginatedResults" :key="result.village_id">
                <td>{{ result.village_id }}</td>
                <td>{{ result.village_name }}</td>
                <td>{{ result.region }}</td>
                <td v-for="(type, idx) in selectedFeatureTypes" :key="idx">
                  {{ formatFeatureValue(result.features[type]) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Results Pagination -->
        <div class="pagination">
          <button @click="prevResultsPage" :disabled="resultsPage === 1" class="glass-button small">上一頁</button>
          <span class="page-info">第 {{ resultsPage }} / {{ totalResultsPages }} 頁</span>
          <button @click="nextResultsPage" :disabled="resultsPage === totalResultsPages" class="glass-button small">下一頁</button>
        </div>
      </div>
    </div>

    <!-- Aggregation Results -->
    <div v-if="aggregationResults" class="glass-panel aggregation-panel">
      <div class="panel-header">
        <h3>聚合結果 Aggregation Results</h3>
      </div>
      <div class="aggregation-content">
        <div class="aggregation-chart">
          <div ref="aggregationChart" class="chart-container"></div>
        </div>
        <div class="aggregation-table">
          <table class="glass-table">
            <thead>
              <tr>
                <th>特徵類型</th>
                <th>聚合值</th>
                <th>標準差</th>
                <th>最小值</th>
                <th>最大值</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(agg, type) in aggregationResults.aggregates" :key="type">
                <td>{{ getFeatureLabel(type) }}</td>
                <td>{{ formatNumber(agg.value) }}</td>
                <td>{{ formatNumber(agg.std) }}</td>
                <td>{{ formatNumber(agg.min) }}</td>
                <td>{{ formatNumber(agg.max) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { extractFeatures as apiExtractFeatures, aggregateFeatures as apiAggregateFeatures } from '@/api/index.js'
import { showError, showSuccess } from '@/utils/message.js'
import { userStore } from '@/utils/store.js'

// Router
const router = useRouter()

// Authentication
const isAuthenticated = computed(() => userStore.isAuthenticated)

// State
const searchQuery = ref('')
const filterRegion = ref('')
const availableRegions = ref(['台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市'])
const selectedVillages = ref([])
const selectedFeatureTypes = ref(['semantic', 'structural'])
const aggregationMethod = ref('mean')
const normalize = ref(true)
const loading = ref(false)
const loadingMessage = ref('載入中...')
const extractionResults = ref(null)
const aggregationResults = ref(null)

// Village list (mock data)
const allVillages = ref([])
const currentPage = ref(1)
const pageSize = 20

// Results pagination
const resultsPage = ref(1)
const resultsPageSize = 20

// Chart ref
const aggregationChart = ref(null)

// Feature types
const featureTypes = [
  { value: 'semantic', label: '語義特徵', description: '9 個語義類別向量' },
  { value: 'structural', label: '結構特徵', description: '村名結構模式' },
  { value: 'ngram', label: 'N-gram 特徵', description: '1-3 字符組合' },
  { value: 'character', label: '字符特徵', description: '字符頻率向量' },
  { value: 'spatial', label: '空間特徵', description: '地理位置特徵' }
]

// Computed
const canExtract = computed(() => {
  return isAuthenticated.value && selectedVillages.value.length > 0 && selectedFeatureTypes.value.length > 0
})

const filteredVillages = computed(() => {
  let villages = allVillages.value

  if (searchQuery.value) {
    villages = villages.filter(v => v.name.includes(searchQuery.value))
  }

  if (filterRegion.value) {
    villages = villages.filter(v => v.region === filterRegion.value)
  }

  const start = (currentPage.value - 1) * pageSize
  return villages.slice(start, start + pageSize)
})

const totalPages = computed(() => {
  let count = allVillages.value.length
  if (searchQuery.value || filterRegion.value) {
    count = filteredVillages.value.length
  }
  return Math.ceil(count / pageSize)
})

const paginatedResults = computed(() => {
  if (!extractionResults.value) return []
  const start = (resultsPage.value - 1) * resultsPageSize
  return extractionResults.value.results.slice(start, start + resultsPageSize)
})

const totalResultsPages = computed(() => {
  if (!extractionResults.value) return 0
  return Math.ceil(extractionResults.value.results.length / resultsPageSize)
})

// Methods
const goToAuth = () => {
  router.push('/auth?redirect=/explore?tab=villages')
}

const handleSearch = () => {
  currentPage.value = 1
}

const clearSearch = () => {
  searchQuery.value = ''
  currentPage.value = 1
}

const handleFilterChange = () => {
  currentPage.value = 1
}

const toggleVillage = (village) => {
  const idx = selectedVillages.value.findIndex(v => v.id === village.id)
  if (idx >= 0) {
    selectedVillages.value.splice(idx, 1)
  } else {
    selectedVillages.value.push(village)
  }
}

const isSelected = (villageId) => {
  return selectedVillages.value.some(v => v.id === villageId)
}

const selectTop100 = () => {
  selectedVillages.value = allVillages.value.slice(0, 100)
  showSuccess('已選擇前 100 個村莊')
}

const selectRandom50 = () => {
  const shuffled = [...allVillages.value].sort(() => 0.5 - Math.random())
  selectedVillages.value = shuffled.slice(0, 50)
  showSuccess('已隨機選擇 50 個村莊')
}

const clearSelection = () => {
  selectedVillages.value = []
  showSuccess('已清空選擇')
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const prevResultsPage = () => {
  if (resultsPage.value > 1) resultsPage.value--
}

const nextResultsPage = () => {
  if (resultsPage.value < totalResultsPages.value) resultsPage.value++
}

const extractFeatures = async () => {
  if (!canExtract.value) return

  loading.value = true
  loadingMessage.value = '正在提取特徵...'

  try {
    const response = await apiExtractFeatures({
      village_ids: selectedVillages.value.map(v => v.id),
      feature_types: selectedFeatureTypes.value,
      normalize: normalize.value
    })

    // Mock response
    extractionResults.value = {
      village_count: selectedVillages.value.length,
      feature_dimension: selectedFeatureTypes.value.length * 9,
      extraction_time: 1234,
      results: selectedVillages.value.map(v => ({
        village_id: v.id,
        village_name: v.name,
        region: v.region,
        features: selectedFeatureTypes.value.reduce((acc, type) => {
          acc[type] = Math.random().toFixed(4)
          return acc
        }, {})
      }))
    }

    resultsPage.value = 1
    showSuccess('特徵提取完成')
  } catch (error) {
    showError(error.message || '特徵提取失敗')
  } finally {
    loading.value = false
  }
}

const aggregateFeatures = async () => {
  if (!extractionResults.value) return

  loading.value = true
  loadingMessage.value = '正在聚合特徵...'

  try {
    const response = await apiAggregateFeatures({
      features: extractionResults.value.results,
      method: aggregationMethod.value
    })

    // Mock response
    aggregationResults.value = {
      method: aggregationMethod.value,
      aggregates: selectedFeatureTypes.value.reduce((acc, type) => {
        acc[type] = {
          value: Math.random(),
          std: Math.random() * 0.1,
          min: Math.random() * 0.5,
          max: Math.random() * 0.5 + 0.5
        }
        return acc
      }, {})
    }

    await nextTick()
    renderAggregationChart()
    showSuccess('特徵聚合完成')
  } catch (error) {
    showError(error.message || '特徵聚合失敗')
  } finally {
    loading.value = false
  }
}

const renderAggregationChart = () => {
  if (!aggregationChart.value || !aggregationResults.value) return

  const chart = echarts.init(aggregationChart.value)
  const types = Object.keys(aggregationResults.value.aggregates)
  const values = types.map(t => aggregationResults.value.aggregates[t].value)

  chart.setOption({
    title: { text: '聚合特徵分布', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: types.map(t => getFeatureLabel(t)),
      axisLabel: { rotate: 45 }
    },
    yAxis: { type: 'value', name: '聚合值' },
    series: [{
      type: 'bar',
      data: values,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#4a90e2' },
          { offset: 1, color: '#50c878' }
        ])
      }
    }]
  })
}

const getFeatureLabel = (type) => {
  const feature = featureTypes.find(f => f.value === type)
  return feature ? feature.label : type
}

const formatFeatureValue = (value) => {
  return typeof value === 'number' ? value.toFixed(4) : value
}

const formatNumber = (num) => {
  return typeof num === 'number' ? num.toFixed(4) : 'N/A'
}

const exportResults = () => {
  if (!extractionResults.value) return

  // Mock CSV export
  const csv = 'Village ID,Village Name,Region,' + selectedFeatureTypes.value.join(',') + '\n'
  showSuccess('CSV 匯出功能開發中')
}

// Lifecycle
onMounted(() => {
  // Mock village data
  allVillages.value = Array.from({ length: 500 }, (_, i) => ({
    id: i + 1,
    name: `村莊${i + 1}`,
    region: availableRegions.value[i % availableRegions.value.length]
  }))
})
</script>

<style scoped>
.feature-extraction-page {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.page-header h2 {
  font-size: 28px;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 16px;
}

.auth-warning {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(231, 76, 60, 0.1);
  border: 2px solid rgba(231, 76, 60, 0.3);
  border-radius: 12px;
  color: #e74c3c;
  font-weight: 500;
}

.lock-icon {
  font-size: 20px;
}

.glass-panel {
  background: var(--glass-heavy);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(74, 144, 226, 0.2);
}

.panel-header h3 {
  font-size: 20px;
  color: var(--text-primary);
  margin: 0;
}

.count-badge {
  background: linear-gradient(135deg, #4a90e2, #50c878);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.glass-input {
  flex: 1;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.glass-input:focus {
  outline: none;
  border-color: #4a90e2;
  background: rgba(255, 255, 255, 0.8);
}

.filter-controls {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-item label {
  font-weight: 500;
  color: var(--text-primary);
}

.glass-select {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.glass-select:focus {
  outline: none;
  border-color: #4a90e2;
  background: rgba(255, 255, 255, 0.8);
}

.glass-button {
  padding: 8px 16px;
  background: linear-gradient(135deg, #4a90e2, #50c878);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.glass-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
}

.glass-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.glass-button.secondary {
  background: linear-gradient(135deg, #95a5a6, #7f8c8d);
}

.glass-button.small {
  padding: 6px 12px;
  font-size: 13px;
}

.glass-button.large {
  padding: 12px 32px;
  font-size: 16px;
}

.village-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid rgba(74, 144, 226, 0.2);
  border-radius: 8px;
  margin-bottom: 16px;
}

.village-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid rgba(74, 144, 226, 0.1);
  cursor: pointer;
  transition: background 0.2s ease;
}

.village-item:hover {
  background: rgba(74, 144, 226, 0.05);
}

.village-item.selected {
  background: rgba(74, 144, 226, 0.1);
}

.village-name {
  flex: 1;
  font-weight: 500;
  color: var(--text-primary);
}

.village-region {
  font-size: 13px;
  color: var(--text-secondary);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.page-info {
  font-size: 14px;
  color: var(--text-secondary);
}

.feature-types {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-type-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.feature-type-item:hover {
  background: rgba(255, 255, 255, 0.7);
}

.type-label {
  font-weight: 500;
  color: var(--text-primary);
  min-width: 100px;
}

.type-desc {
  font-size: 13px;
  color: var(--text-secondary);
}

.controls-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-row label {
  min-width: 100px;
  font-weight: 500;
  color: var(--text-primary);
}

.button-group {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  text-align: center;
  border: 2px solid rgba(74, 144, 226, 0.2);
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #4a90e2;
}

.feature-table-wrapper {
  overflow-x: auto;
  margin-bottom: 16px;
}

.glass-table {
  width: 100%;
  border-collapse: collapse;
}

.glass-table thead {
  background: rgba(74, 144, 226, 0.1);
  position: sticky;
  top: 0;
}

.glass-table th,
.glass-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid rgba(74, 144, 226, 0.1);
}

.glass-table th {
  font-weight: 600;
  color: var(--text-primary);
}

.chart-container {
  width: 100%;
  height: 400px;
  margin-bottom: 24px;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-overlay p {
  color: white;
  margin-top: 16px;
  font-size: 16px;
}

/* Responsive */
@media (max-width: 768px) {
  .feature-extraction-page {
    padding: 12px;
  }

  .filter-controls {
    flex-direction: column;
  }

  .button-group {
    flex-direction: column;
  }

  .chart-container {
    height: 300px;
  }
}
</style>
