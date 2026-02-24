<template>
  <div class="regional-vectors-page">
      <h3 class="villagesml-subtab-title">區域分析 - 特徵向量</h3>
    <!-- Header -->
    <div class="page-header">
      <h2>區域特徵向量 Regional Feature Vectors</h2>
      <p class="subtitle">分析區域間的特徵向量相似度與聚類模式</p>
    </div>

    <!-- Region Selector -->
    <div class="glass-panel selector-panel">
      <div class="panel-header">
        <h3>選擇區域 Select Regions</h3>
      </div>
      <div class="selector-content">
        <div class="form-row">
          <label>層級 Level:</label>
          <select v-model="selectedLevel" @change="handleLevelChange" class="glass-select">
            <option value="city">市 City</option>
            <option value="county">縣 County</option>
            <option value="town">鄉鎮 Township</option>
          </select>
        </div>
        <div class="form-row">
          <label>主要區域 Primary Region:</label>
          <select v-model="primaryRegion" @change="handlePrimaryChange" class="glass-select">
            <option value="">-- 請選擇 --</option>
            <option v-for="region in availableRegions" :key="region.name || region" :value="region.name || region">
              {{ region.name || region }}{{ region.village_count ? ` (${region.village_count}村)` : '' }}
            </option>
          </select>
        </div>
        <div class="form-row">
          <label>比較區域 Compare Region (可選):</label>
          <select v-model="compareRegion" class="glass-select">
            <option value="">-- 無 --</option>
            <option v-for="region in availableRegions" :key="region.name || region" :value="region.name || region" :disabled="(region.name || region) === primaryRegion">
              {{ region.name || region }}{{ region.village_count ? ` (${region.village_count}村)` : '' }}
            </option>
          </select>
        </div>
        <div class="button-group">
          <button @click="loadVectors" :disabled="!primaryRegion || loading" class="solid-button primary">
            <span v-if="!loading">載入向量 Load Vectors</span>
            <span v-else>載入中...</span>
          </button>
          <button @click="compareVectors" :disabled="!primaryRegion || !compareRegion || loading" class="solid-button secondary">
            比較向量 Compare Vectors
          </button>
        </div>
      </div>
    </div>

    <!-- Feature Vector Display -->
    <div v-if="vectorData" class="glass-panel vector-panel">
      <div class="panel-header">
        <h3>特徵向量 Feature Vector</h3>
        <span class="region-label">{{ primaryRegion }}</span>
      </div>
      <div class="vector-content">
        <div class="vector-stats">
          <div class="stat-item">
            <span class="label">向量維度:</span>
            <span class="value">{{ vectorData.dimension || 'N/A' }}</span>
          </div>
          <div class="stat-item">
            <span class="label">村莊數量:</span>
            <span class="value">{{ vectorData.village_count || 'N/A' }}</span>
          </div>
          <div class="stat-item">
            <span class="label">特徵類型:</span>
            <span class="value">{{ vectorData.feature_type || 'Semantic' }}</span>
          </div>
        </div>
        <div class="vector-visualization">
          <div ref="vectorChart" class="chart-container"></div>
        </div>
      </div>
    </div>

    <!-- Similarity Comparison -->
    <div v-if="similarityData" class="glass-panel similarity-panel">
      <div class="panel-header">
        <h3>相似度分析 Similarity Analysis</h3>
      </div>
      <div class="similarity-content">
        <div class="comparison-header">
          <div class="region-badge primary">{{ primaryRegion }}</div>
          <div class="vs-label">vs</div>
          <div class="region-badge compare">{{ compareRegion }}</div>
        </div>
        <div class="similarity-metrics">
          <div class="metric-card">
            <div class="metric-label">餘弦相似度 Cosine Similarity</div>
            <div class="metric-value">{{ formatNumber(similarityData.cosine_similarity) }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">歐氏距離 Euclidean Distance</div>
            <div class="metric-value">{{ formatNumber(similarityData.euclidean_distance) }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">曼哈頓距離 Manhattan Distance</div>
            <div class="metric-value">{{ formatNumber(similarityData.manhattan_distance) }}</div>
          </div>
        </div>
        <div class="difference-chart">
          <div ref="diffChart" class="chart-container"></div>
        </div>
      </div>
    </div>

    <!-- Regional Clustering -->
    <div class="glass-panel clustering-panel">
      <div class="panel-header">
        <h3>區域聚類 Regional Clustering</h3>
        <button @click="runClustering" :disabled="loading" class="solid-button small">
          執行聚類 Run Clustering
        </button>
      </div>
      <div v-if="clusteringResults" class="clustering-content">
        <div class="clustering-params">
          <div class="param-item">
            <label>聚類數量 K:</label>
            <input v-model.number="clusterK" type="number" min="2" max="20" class="glass-input small">
          </div>
          <div class="param-item">
            <label>演算法 Algorithm:</label>
            <select v-model="clusterAlgorithm" class="glass-select small">
              <option value="kmeans">K-Means</option>
              <option value="hierarchical">Hierarchical</option>
              <option value="dbscan">DBSCAN</option>
            </select>
          </div>
        </div>
        <div class="clustering-visualization">
          <div ref="clusterChart" class="chart-container"></div>
        </div>
        <div class="cluster-table">
          <table class="glass-table">
            <thead>
              <tr>
                <th>聚類 ID</th>
                <th>區域數量</th>
                <th>區域列表</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cluster in clusteringResults.clusters" :key="cluster.id">
                <td>{{ cluster.id }}</td>
                <td>{{ cluster.regions.length }}</td>
                <td class="region-list">{{ cluster.regions.join(', ') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>尚未執行聚類分析</p>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>載入中...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getRegionalVectors } from '@/api/index.js'
import { showError, showSuccess } from '@/utils/message.js'

// State
const selectedLevel = ref('city')
const primaryRegion = ref('')
const compareRegion = ref('')
const availableRegions = ref([])
const vectorData = ref(null)
const similarityData = ref(null)
const clusteringResults = ref(null)
const loading = ref(false)

// Clustering params
const clusterK = ref(5)
const clusterAlgorithm = ref('kmeans')

// Chart refs
const vectorChart = ref(null)
const diffChart = ref(null)
const clusterChart = ref(null)

// Mock regions (replace with actual API call)
const mockRegions = {
  city: ['台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市'],
  county: ['宜蘭縣', '新竹縣', '苗栗縣', '彰化縣', '南投縣', '雲林縣'],
  town: ['中正區', '大同區', '中山區', '松山區', '大安區', '萬華區']
}

// Methods
const handleLevelChange = () => {
  availableRegions.value = mockRegions[selectedLevel.value]
  primaryRegion.value = ''
  compareRegion.value = ''
  vectorData.value = null
  similarityData.value = null
}

const handlePrimaryChange = () => {
  vectorData.value = null
  similarityData.value = null
}

const loadVectors = async () => {
  if (!primaryRegion.value) return

  loading.value = true
  try {
    const response = await getRegionalVectors({
      level: selectedLevel.value,
      region: primaryRegion.value
    })

    vectorData.value = response.data || {
      dimension: 9,
      village_count: 1234,
      feature_type: 'Semantic',
      vector: [0.23, 0.15, 0.31, 0.08, 0.19, 0.12, 0.27, 0.18, 0.22]
    }

    await nextTick()
    renderVectorChart()
    showSuccess('向量載入成功')
  } catch (error) {
    showError(error.message || '載入向量失敗')
  } finally {
    loading.value = false
  }
}

const compareVectors = async () => {
  if (!primaryRegion.value || !compareRegion.value) return

  loading.value = true
  try {
    // Mock similarity data
    similarityData.value = {
      cosine_similarity: 0.8234,
      euclidean_distance: 0.4521,
      manhattan_distance: 1.2345,
      vector_diff: [0.05, -0.03, 0.08, -0.02, 0.04, -0.01, 0.06, -0.04, 0.03]
    }

    await nextTick()
    renderDiffChart()
    showSuccess('向量比較完成')
  } catch (error) {
    showError(error.message || '向量比較失敗')
  } finally {
    loading.value = false
  }
}

const runClustering = async () => {
  loading.value = true
  try {
    // Mock clustering results
    clusteringResults.value = {
      k: clusterK.value,
      algorithm: clusterAlgorithm.value,
      clusters: [
        { id: 0, regions: ['台北市', '新北市', '桃園市'] },
        { id: 1, regions: ['台中市', '彰化縣'] },
        { id: 2, regions: ['台南市', '高雄市'] }
      ]
    }

    await nextTick()
    renderClusterChart()
    showSuccess('聚類分析完成')
  } catch (error) {
    showError(error.message || '聚類分析失敗')
  } finally {
    loading.value = false
  }
}

const renderVectorChart = () => {
  if (!vectorChart.value || !vectorData.value) return

  const chart = echarts.init(vectorChart.value)
  const categories = ['山', '水', '聚落', '方位', '植物', '動物', '顏色', '數字', '其他']

  chart.setOption({
    title: { text: '特徵向量分布', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { rotate: 45 }
    },
    yAxis: { type: 'value', name: '權重' },
    series: [{
      type: 'bar',
      data: vectorData.value.vector || [],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#4a90e2' },
          { offset: 1, color: '#50c878' }
        ])
      }
    }]
  })
}

const renderDiffChart = () => {
  if (!diffChart.value || !similarityData.value) return

  const chart = echarts.init(diffChart.value)
  const categories = ['山', '水', '聚落', '方位', '植物', '動物', '顏色', '數字', '其他']

  chart.setOption({
    title: { text: '向量差異分布', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { rotate: 45 }
    },
    yAxis: { type: 'value', name: '差異值' },
    series: [{
      type: 'bar',
      data: similarityData.value.vector_diff || [],
      itemStyle: {
        color: (params) => params.value >= 0 ? '#50c878' : '#e74c3c'
      }
    }]
  })
}

const renderClusterChart = () => {
  if (!clusterChart.value || !clusteringResults.value) return

  const chart = echarts.init(clusterChart.value)

  // Mock scatter data
  const scatterData = clusteringResults.value.clusters.flatMap((cluster, idx) =>
    cluster.regions.map((region, i) => ({
      value: [Math.random() * 10, Math.random() * 10],
      name: region,
      itemStyle: { color: ['#4a90e2', '#50c878', '#f39c12'][idx] }
    }))
  )

  chart.setOption({
    title: { text: '區域聚類可視化', left: 'center' },
    tooltip: { trigger: 'item' },
    xAxis: { type: 'value', name: 'PC1' },
    yAxis: { type: 'value', name: 'PC2' },
    series: [{
      type: 'scatter',
      data: scatterData,
      symbolSize: 20
    }]
  })
}

const formatNumber = (num) => {
  return typeof num === 'number' ? num.toFixed(4) : 'N/A'
}

// Lifecycle
onMounted(() => {
  availableRegions.value = mockRegions[selectedLevel.value]
})
</script>

<style scoped>
.regional-vectors-page {
  padding: 20px;
  max-width: 1400px;
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

.region-label {
  background: linear-gradient(135deg, #4a90e2, #50c878);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

.selector-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.form-row label {
  min-width: 150px;
  font-weight: 500;
  color: var(--text-primary);
}

.glass-select,
.glass-input {
  flex: 1;
  padding: 10px 16px;
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

.glass-select.small,
.glass-input.small {
  max-width: 150px;
}

.button-group {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.solid-button {
  padding: 10px 24px;
  background: linear-gradient(135deg, #4a90e2, #50c878);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.solid-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
}

.solid-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.solid-button.secondary {
  background: linear-gradient(135deg, #95a5a6, #7f8c8d);
}

.solid-button.small {
  padding: 6px 16px;
  font-size: 13px;
}

.vector-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
}

.stat-item .label {
  font-weight: 500;
  color: var(--text-secondary);
}

.stat-item .value {
  font-weight: 600;
  color: var(--text-primary);
}

.chart-container {
  width: 100%;
  height: 400px;
}

.comparison-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 24px;
}

.region-badge {
  padding: 8px 20px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 16px;
}

.region-badge.primary {
  background: linear-gradient(135deg, #4a90e2, #357abd);
  color: white;
}

.region-badge.compare {
  background: linear-gradient(135deg, #50c878, #3da35d);
  color: white;
}

.vs-label {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-secondary);
}

.similarity-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.metric-card {
  padding: 20px;
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
  font-size: 28px;
  font-weight: 700;
  color: #4a90e2;
}

.clustering-params {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.param-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.param-item label {
  font-weight: 500;
  color: var(--text-primary);
}

.glass-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
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

.region-list {
  font-size: 13px;
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
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
  .regional-vectors-page {
    padding: 12px;
  }

  .form-row {
    flex-direction: column;
    align-items: stretch;
  }

  .form-row label {
    min-width: auto;
  }

  .button-group {
    flex-direction: column;
  }

  .comparison-header {
    flex-direction: column;
    gap: 12px;
  }

  .clustering-params {
    flex-direction: column;
  }

  .chart-container {
    height: 300px;
  }
}
</style>
