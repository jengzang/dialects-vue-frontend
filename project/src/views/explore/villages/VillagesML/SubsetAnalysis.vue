<template>
  <div class="subset-analysis-page">
    <!-- Header -->
    <div class="page-header">
      <h2>🔐 子集分析 Subset Analysis</h2>
      <p class="subtitle">對自訂村莊子集進行聚類與比較分析</p>
      <div v-if="!isAuthenticated" class="auth-warning">
        <span class="lock-icon">🔒</span>
        <span>此功能需要登入</span>
        <button @click="goToAuth" class="glass-button small">前往登入</button>
      </div>
    </div>

    <!-- Filter Builder -->
    <div class="glass-panel filter-panel">
      <div class="panel-header">
        <h3>篩選器構建 Filter Builder</h3>
        <button @click="addFilter" class="glass-button small">+ 添加篩選條件</button>
      </div>
      <div class="filter-content">
        <div v-for="(filter, idx) in filters" :key="idx" class="filter-row">
          <select v-model="filter.field" class="glass-select">
            <option value="name">村名</option>
            <option value="region">區域</option>
            <option value="semantic">語義類別</option>
            <option value="structure">結構模式</option>
            <option value="length">名稱長度</option>
          </select>
          <select v-model="filter.operator" class="glass-select">
            <option value="contains">包含</option>
            <option value="equals">等於</option>
            <option value="startsWith">開頭為</option>
            <option value="endsWith">結尾為</option>
            <option value="gt">大於</option>
            <option value="lt">小於</option>
          </select>
          <input v-model="filter.value" type="text" placeholder="值" class="glass-input">
          <button @click="removeFilter(idx)" class="glass-button small secondary">刪除</button>
        </div>
        <div class="filter-actions">
          <button @click="applyFilters" :disabled="filters.length === 0 || loading" class="glass-button primary">
            應用篩選 Apply Filters
          </button>
          <button @click="clearFilters" class="glass-button secondary">清空篩選</button>
        </div>
        <div v-if="subsetA.villages.length > 0" class="subset-info">
          <span class="info-label">子集 A:</span>
          <span class="info-value">{{ subsetA.villages.length }} 個村莊</span>
        </div>
      </div>
    </div>

    <!-- Subset Comparison -->
    <div class="glass-panel comparison-panel">
      <div class="panel-header">
        <h3>子集比較 Subset Comparison</h3>
      </div>
      <div class="comparison-content">
        <div class="subset-selector">
          <div class="subset-card">
            <h4>子集 A</h4>
            <div class="subset-stats">
              <div class="stat-item">
                <span class="label">村莊數:</span>
                <span class="value">{{ subsetA.villages.length }}</span>
              </div>
              <div class="stat-item">
                <span class="label">平均長度:</span>
                <span class="value">{{ subsetA.avgLength || 'N/A' }}</span>
              </div>
            </div>
            <button @click="saveAsSubsetA" :disabled="!canSaveSubset" class="glass-button small">
              保存為子集 A
            </button>
          </div>
          <div class="vs-divider">VS</div>
          <div class="subset-card">
            <h4>子集 B</h4>
            <div class="subset-stats">
              <div class="stat-item">
                <span class="label">村莊數:</span>
                <span class="value">{{ subsetB.villages.length }}</span>
              </div>
              <div class="stat-item">
                <span class="label">平均長度:</span>
                <span class="value">{{ subsetB.avgLength || 'N/A' }}</span>
              </div>
            </div>
            <button @click="saveAsSubsetB" :disabled="!canSaveSubset" class="glass-button small">
              保存為子集 B
            </button>
          </div>
        </div>
        <div class="comparison-actions">
          <button
            @click="compareSubsets"
            :disabled="!canCompare || loading"
            class="glass-button primary large"
          >
            比較子集 Compare Subsets
          </button>
        </div>
      </div>
    </div>

    <!-- Comparison Results -->
    <div v-if="comparisonResults" class="glass-panel results-panel">
      <div class="panel-header">
        <h3>比較結果 Comparison Results</h3>
      </div>
      <div class="results-content">
        <!-- Metrics -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">相似度</div>
            <div class="metric-value">{{ formatNumber(comparisonResults.similarity) }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">差異度</div>
            <div class="metric-value">{{ formatNumber(comparisonResults.difference) }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">重疊村莊</div>
            <div class="metric-value">{{ comparisonResults.overlap_count }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">獨特村莊 (A)</div>
            <div class="metric-value">{{ comparisonResults.unique_a }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">獨特村莊 (B)</div>
            <div class="metric-value">{{ comparisonResults.unique_b }}</div>
          </div>
        </div>

        <!-- Comparison Chart -->
        <div class="comparison-chart">
          <div ref="comparisonChart" class="chart-container"></div>
        </div>

        <!-- Feature Differences -->
        <div class="feature-diff-table">
          <h4>特徵差異 Feature Differences</h4>
          <table class="glass-table">
            <thead>
              <tr>
                <th>特徵</th>
                <th>子集 A</th>
                <th>子集 B</th>
                <th>差異</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(diff, feature) in comparisonResults.feature_diffs" :key="feature">
                <td>{{ feature }}</td>
                <td>{{ formatNumber(diff.a) }}</td>
                <td>{{ formatNumber(diff.b) }}</td>
                <td :class="['diff-value', diff.diff > 0 ? 'positive' : 'negative']">
                  {{ formatNumber(diff.diff) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Subset Clustering -->
    <div class="glass-panel clustering-panel">
      <div class="panel-header">
        <h3>子集聚類 Subset Clustering</h3>
      </div>
      <div class="clustering-content">
        <div class="clustering-controls">
          <div class="control-row">
            <label>選擇子集:</label>
            <select v-model="clusteringSubset" class="glass-select">
              <option value="A">子集 A</option>
              <option value="B">子集 B</option>
              <option value="both">兩者</option>
            </select>
          </div>
          <div class="control-row">
            <label>聚類數 K:</label>
            <input v-model.number="clusterK" type="number" min="2" max="20" class="glass-input small">
          </div>
          <div class="control-row">
            <label>演算法:</label>
            <select v-model="clusterAlgorithm" class="glass-select">
              <option value="kmeans">K-Means</option>
              <option value="hierarchical">Hierarchical</option>
              <option value="dbscan">DBSCAN</option>
            </select>
          </div>
          <button
            @click="runSubsetClustering"
            :disabled="!canCluster || loading"
            class="glass-button primary"
          >
            執行聚類 Run Clustering
          </button>
        </div>

        <div v-if="clusteringResults" class="clustering-results">
          <div class="clustering-chart">
            <div ref="clusteringChart" class="chart-container"></div>
          </div>
          <div class="cluster-summary">
            <h4>聚類摘要 Cluster Summary</h4>
            <table class="glass-table">
              <thead>
                <tr>
                  <th>聚類 ID</th>
                  <th>村莊數</th>
                  <th>中心點</th>
                  <th>內聚度</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cluster in clusteringResults.clusters" :key="cluster.id">
                  <td>{{ cluster.id }}</td>
                  <td>{{ cluster.size }}</td>
                  <td>{{ formatVector(cluster.centroid) }}</td>
                  <td>{{ formatNumber(cluster.cohesion) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
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
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { clusterSubset, compareSubsets } from '@/api/index.js'
import { showError, showSuccess } from '@/utils/message.js'
import { userStore } from '@/utils/store.js'

// Router
const router = useRouter()

// Authentication
const isAuthenticated = computed(() => userStore.isAuthenticated)

// State
const filters = ref([])
const subsetA = ref({ villages: [], avgLength: null })
const subsetB = ref({ villages: [], avgLength: null })
const currentFilteredVillages = ref([])
const comparisonResults = ref(null)
const clusteringResults = ref(null)
const loading = ref(false)
const loadingMessage = ref('載入中...')

// Clustering params
const clusteringSubset = ref('A')
const clusterK = ref(5)
const clusterAlgorithm = ref('kmeans')

// Chart refs
const comparisonChart = ref(null)
const clusteringChart = ref(null)

// Computed
const canSaveSubset = computed(() => currentFilteredVillages.value.length > 0)

const canCompare = computed(() => {
  return isAuthenticated.value && subsetA.value.villages.length > 0 && subsetB.value.villages.length > 0
})

const canCluster = computed(() => {
  return isAuthenticated.value && (
    (clusteringSubset.value === 'A' && subsetA.value.villages.length > 0) ||
    (clusteringSubset.value === 'B' && subsetB.value.villages.length > 0) ||
    (clusteringSubset.value === 'both' && subsetA.value.villages.length > 0 && subsetB.value.villages.length > 0)
  )
})

// Methods
const goToAuth = () => {
  router.push('/auth?redirect=/explore?tab=villages')
}

const addFilter = () => {
  filters.value.push({
    field: 'name',
    operator: 'contains',
    value: ''
  })
}

const removeFilter = (idx) => {
  filters.value.splice(idx, 1)
}

const clearFilters = () => {
  filters.value = []
  currentFilteredVillages.value = []
  showSuccess('已清空篩選條件')
}

const applyFilters = async () => {
  if (filters.value.length === 0) return

  loading.value = true
  loadingMessage.value = '正在應用篩選...'

  try {
    // Mock filtered villages
    currentFilteredVillages.value = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `村莊${i + 1}`,
      region: '台北市',
      length: 2 + Math.floor(Math.random() * 3)
    }))

    showSuccess(`篩選完成，找到 ${currentFilteredVillages.value.length} 個村莊`)
  } catch (error) {
    showError(error.message || '篩選失敗')
  } finally {
    loading.value = false
  }
}

const saveAsSubsetA = () => {
  subsetA.value = {
    villages: [...currentFilteredVillages.value],
    avgLength: calculateAvgLength(currentFilteredVillages.value)
  }
  showSuccess(`已保存為子集 A (${subsetA.value.villages.length} 個村莊)`)
}

const saveAsSubsetB = () => {
  subsetB.value = {
    villages: [...currentFilteredVillages.value],
    avgLength: calculateAvgLength(currentFilteredVillages.value)
  }
  showSuccess(`已保存為子集 B (${subsetB.value.villages.length} 個村莊)`)
}

const calculateAvgLength = (villages) => {
  if (villages.length === 0) return null
  const sum = villages.reduce((acc, v) => acc + v.length, 0)
  return (sum / villages.length).toFixed(2)
}

const compareSubsets = async () => {
  if (!canCompare.value) return

  loading.value = true
  loadingMessage.value = '正在比較子集...'

  try {
    const response = await compareSubsets({
      subset_a: subsetA.value.villages.map(v => v.id),
      subset_b: subsetB.value.villages.map(v => v.id)
    })

    // Mock comparison results
    comparisonResults.value = {
      similarity: 0.7234,
      difference: 0.2766,
      overlap_count: 10,
      unique_a: 40,
      unique_b: 35,
      feature_diffs: {
        '語義特徵': { a: 0.45, b: 0.52, diff: 0.07 },
        '結構特徵': { a: 0.38, b: 0.31, diff: -0.07 },
        'N-gram 特徵': { a: 0.62, b: 0.58, diff: -0.04 }
      }
    }

    await nextTick()
    renderComparisonChart()
    showSuccess('子集比較完成')
  } catch (error) {
    showError(error.message || '子集比較失敗')
  } finally {
    loading.value = false
  }
}

const runSubsetClustering = async () => {
  if (!canCluster.value) return

  loading.value = true
  loadingMessage.value = '正在執行聚類...'

  try {
    let villages = []
    if (clusteringSubset.value === 'A') villages = subsetA.value.villages
    else if (clusteringSubset.value === 'B') villages = subsetB.value.villages
    else villages = [...subsetA.value.villages, ...subsetB.value.villages]

    const response = await clusterSubset({
      village_ids: villages.map(v => v.id),
      k: clusterK.value,
      algorithm: clusterAlgorithm.value
    })

    // Mock clustering results
    clusteringResults.value = {
      k: clusterK.value,
      algorithm: clusterAlgorithm.value,
      clusters: Array.from({ length: clusterK.value }, (_, i) => ({
        id: i,
        size: Math.floor(Math.random() * 20) + 5,
        centroid: [Math.random(), Math.random(), Math.random()],
        cohesion: Math.random()
      }))
    }

    await nextTick()
    renderClusteringChart()
    showSuccess('聚類分析完成')
  } catch (error) {
    showError(error.message || '聚類分析失敗')
  } finally {
    loading.value = false
  }
}

const renderComparisonChart = () => {
  if (!comparisonChart.value || !comparisonResults.value) return

  const chart = echarts.init(comparisonChart.value)

  chart.setOption({
    title: { text: '子集特徵比較', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['子集 A', '子集 B'], bottom: 10 },
    radar: {
      indicator: Object.keys(comparisonResults.value.feature_diffs).map(f => ({ name: f, max: 1 }))
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: Object.values(comparisonResults.value.feature_diffs).map(d => d.a),
          name: '子集 A',
          itemStyle: { color: '#4a90e2' }
        },
        {
          value: Object.values(comparisonResults.value.feature_diffs).map(d => d.b),
          name: '子集 B',
          itemStyle: { color: '#50c878' }
        }
      ]
    }]
  })
}

const renderClusteringChart = () => {
  if (!clusteringChart.value || !clusteringResults.value) return

  const chart = echarts.init(clusteringChart.value)

  // Mock scatter data
  const scatterData = clusteringResults.value.clusters.map((cluster, idx) => ({
    name: `聚類 ${cluster.id}`,
    type: 'scatter',
    data: Array.from({ length: cluster.size }, () => [
      Math.random() * 10,
      Math.random() * 10
    ]),
    symbolSize: 15,
    itemStyle: { color: ['#4a90e2', '#50c878', '#f39c12', '#e74c3c', '#9b59b6'][idx] }
  }))

  chart.setOption({
    title: { text: '子集聚類可視化', left: 'center' },
    tooltip: { trigger: 'item' },
    xAxis: { type: 'value', name: 'PC1' },
    yAxis: { type: 'value', name: 'PC2' },
    series: scatterData
  })
}

const formatNumber = (num) => {
  return typeof num === 'number' ? num.toFixed(4) : 'N/A'
}

const formatVector = (vec) => {
  if (!Array.isArray(vec)) return 'N/A'
  return vec.map(v => v.toFixed(2)).join(', ')
}
</script>

<style scoped>
.subset-analysis-page {
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
  background: var(--glass-bg);
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

.filter-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  align-items: center;
}

.glass-select,
.glass-input {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.glass-select:focus,
.glass-input:focus {
  outline: none;
  border-color: #4a90e2;
  background: rgba(255, 255, 255, 0.8);
}

.glass-input.small {
  max-width: 100px;
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

.filter-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.subset-info {
  margin-top: 16px;
  padding: 12px;
  background: rgba(74, 144, 226, 0.1);
  border-radius: 8px;
}

.info-label {
  font-weight: 600;
  color: var(--text-primary);
  margin-right: 8px;
}

.info-value {
  color: #4a90e2;
  font-weight: 500;
}

.subset-selector {
  display: flex;
  gap: 24px;
  align-items: center;
  margin-bottom: 24px;
}

.subset-card {
  flex: 1;
  padding: 20px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  border: 2px solid rgba(74, 144, 226, 0.2);
}

.subset-card h4 {
  margin: 0 0 16px 0;
  color: var(--text-primary);
}

.subset-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
}

.stat-item .label {
  color: var(--text-secondary);
}

.stat-item .value {
  font-weight: 600;
  color: var(--text-primary);
}

.vs-divider {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-secondary);
}

.comparison-actions {
  display: flex;
  justify-content: center;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.metric-card {
  padding: 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  text-align: center;
  border: 2px solid rgba(74, 144, 226, 0.2);
}

.metric-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: #4a90e2;
}

.chart-container {
  width: 100%;
  height: 400px;
  margin-bottom: 24px;
}

.glass-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
}

.glass-table thead {
  background: rgba(74, 144, 226, 0.1);
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

.diff-value.positive {
  color: #50c878;
}

.diff-value.negative {
  color: #e74c3c;
}

.clustering-controls {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-row label {
  font-weight: 500;
  color: var(--text-primary);
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
  .subset-analysis-page {
    padding: 12px;
  }

  .filter-row {
    flex-direction: column;
  }

  .subset-selector {
    flex-direction: column;
  }

  .vs-divider {
    transform: rotate(90deg);
  }

  .clustering-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .chart-container {
    height: 300px;
  }
}
</style>
