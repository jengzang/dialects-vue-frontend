<template>
  <div class="regional-vectors-page">
    <h3 class="villagesml-subtab-title">
      區域分析 - 特徵向量
      <HelpIcon content="基於9維語義類別特徵向量比較區域。餘弦相似度：向量夾角余弦值（0-1）。歐氏距離：向量空間直線距離。曼哈頓距離：各維度差值絕對值之和。支持批量比較熱力圖和PCA降維散點圖" />
    </h3>

    <!-- Region Selector -->
    <div class="vml-glass-panel selector-panel">
      <div class="panel-header">
        <h3>選擇兩個區域進行比較</h3>
      </div>
      <div class="selector-content">
        <div class="regions-row">
          <!-- Region 1 -->
          <div class="region-group">
            <h4 class="group-title">區域 1</h4>
            <FilterableSelect
              v-model="region1"
              v-model:level="level1"
              :show-level-selector="true"
              :show-counts="true"
              placeholder="請選擇區域..."
              @update:hierarchy="(h) => hierarchy1 = h"
            />
          </div>

          <!-- Region 2 -->
          <div class="region-group">
            <h4 class="group-title">區域 2</h4>
            <FilterableSelect
              v-model="region2"
              v-model:level="level2"
              :show-level-selector="true"
              :show-counts="true"
              placeholder="請選擇區域..."
              @update:hierarchy="(h) => hierarchy2 = h"
            />
          </div>
        </div>

        <button
          @click="compareVectors"
          :disabled="!region1 || !region2 || loading"
          class="action-button primary"
        >
          <span v-if="!loading">比較向量</span>
          <span v-else>比較中...</span>
        </button>
      </div>
    </div>


    <!-- Comparison Results -->
    <div v-if="comparisonData" class="results-section">
      <!-- Similarity Metrics -->
      <div class="vml-glass-panel similarity-panel">
        <div class="panel-header">
          <h3>相似度分析</h3>
        </div>
        <div class="similarity-content">
          <div class="comparison-header">
            <div class="region-badge primary">{{ region1 }}</div>
            <div class="vs-label">vs</div>
            <div class="region-badge compare">{{ region2 }}</div>
          </div>
          <div class="similarity-metrics">
            <div class="metric-card">
              <div class="metric-label">餘弦相似度</div>
              <div class="metric-value">{{ formatNumber(comparisonData.cosine_similarity) }}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">歐氏距離</div>
              <div class="metric-value">{{ formatNumber(comparisonData.euclidean_distance) }}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">曼哈頓距離</div>
              <div class="metric-value">{{ formatNumber(comparisonData.manhattan_distance) }}</div>
            </div>
          </div>
        </div>
        <div class="chart-wrapper">
          <div ref="comparisonChart" class="chart-container-large"></div>
        </div>
      </div>

      <!-- Side-by-side Vector Charts -->
<!--      <div class="vectors-row">-->
        <!-- Region 1 Vector -->
<!--        <div class="vml-glass-panel vector-panel">-->
<!--          <div class="panel-header">-->
<!--            <h3>{{ region1 }}</h3>-->
<!--            <span class="region-label">{{ getLevelLabel(level1) }}</span>-->
<!--          </div>-->
<!--          <div class="vector-content">-->
<!--            <div class="vector-stats">-->
<!--              <div class="stat-item">-->
<!--                <span class="label">向量維度:</span>-->
<!--                <span class="value">{{ comparisonData.feature_dimension || 9 }}</span>-->
<!--              </div>-->
<!--            </div>-->
<!--            <div class="vector-visualization">-->
<!--              <div ref="vector1Chart" class="chart-container"></div>-->
<!--            </div>-->
<!--          </div>-->
<!--        </div>-->

        <!-- Region 2 Vector -->
<!--        <div class="vml-glass-panel vector-panel">-->
<!--          <div class="panel-header">-->
<!--            <h3>{{ region2 }}</h3>-->
<!--            <span class="region-label">{{ getLevelLabel(level2) }}</span>-->
<!--          </div>-->
<!--          <div class="vector-content">-->
<!--            <div class="vector-stats">-->
<!--              <div class="stat-item">-->
<!--                <span class="label">向量維度:</span>-->
<!--                <span class="value">{{ comparisonData.feature_dimension || 9 }}</span>-->
<!--              </div>-->
<!--            </div>-->
<!--            <div class="vector-visualization">-->
<!--              <div ref="vector2Chart" class="chart-container"></div>-->
<!--            </div>-->
<!--          </div>-->
<!--        </div>-->
<!--      </div>-->

    </div>

    <!-- Multi-Region Selector for Batch Analysis -->
    <div class="vml-glass-panel multi-region-panel">
      <div class="panel-header">
        <h3>批量分析（熱力圖 & 散點圖）</h3>
      </div>
      <div class="multi-region-content">
        <div class="region-selector-row">
          <FilterableSelect
              v-model="selectedRegionToAdd"
              v-model:level="batchLevel"
              :show-level-selector="true"
              :show-counts="true"
              placeholder="選擇區域添加到列表..."
              @update:hierarchy="(h) => selectedRegionHierarchy = h"
          />
          <button
              @click="addRegionToBatch"
              :disabled="!selectedRegionToAdd || batchRegions.length >= 20"
              class="action-button add-button"
          >
            添加 ({{ batchRegions.length }}/20)
          </button>
        </div>

        <!-- Selected Regions List -->
        <div v-if="batchRegions.length > 0" class="selected-regions-list">
          <div
              v-for="(region, index) in batchRegions"
              :key="index"
              class="region-chip"
          >
            <span class="region-name">{{ region.display }}</span>
            <button @click="removeRegionFromBatch(index)" class="remove-btn">×</button>
          </div>
        </div>

        <!-- Batch Actions -->
        <div v-if="batchRegions.length >= 2" class="batch-actions">
          <button
              @click="runBatchComparison"
              :disabled="loading"
              class="action-button primary"
          >
            <span v-if="!loading">生成熱力圖</span>
            <span v-else>生成中...</span>
          </button>
          <button
              @click="runDimensionReduction"
              :disabled="loading"
              class="action-button secondary"
          >
            <span v-if="!loading">生成散點圖 (PCA)</span>
            <span v-else>降維中...</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Batch Analysis Results -->
    <div v-if="batchComparisonData || reductionData" class="batch-results-section">
      <!-- Heatmap -->
      <div v-if="batchComparisonData" class="vml-glass-panel heatmap-panel">
        <div class="panel-header">
          <h3>相似度熱力圖</h3>
        </div>
        <div class="chart-wrapper">
          <div ref="heatmapChart" class="chart-container-xlarge"></div>
        </div>
      </div>

      <!-- Scatter Plot -->
      <div v-if="reductionData" class="vml-glass-panel scatter-panel">
        <div class="panel-header">
          <h3>向量降維散點圖 (PCA)</h3>
          <span class="info-label">解釋方差: {{ formatVariance(reductionData.explained_variance) }}</span>
        </div>
        <div class="chart-wrapper">
          <div ref="scatterChart" class="chart-container-xlarge"></div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="ui-loading--page" aria-hidden="true"></div>
      <p>載入中...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { compareRegionalVectors, batchCompareRegionalVectors, reduceRegionalVectors } from '@/api/index.js'
import { showError, showSuccess, showWarning } from '@/utils/message.js'
import FilterableSelect from '@/VillagesML/components/FilterableSelect.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import { SEMANTIC_CATEGORY_NAMES } from '@/VillagesML/config/villagesML.js'

// State - Two Region Comparison
const level1 = ref('city')
const region1 = ref('')
const hierarchy1 = ref(null)
const level2 = ref('city')
const region2 = ref('')
const hierarchy2 = ref(null)
const comparisonData = ref(null)

// State - Batch Analysis
const batchLevel = ref('city')
const selectedRegionToAdd = ref('')
const selectedRegionHierarchy = ref(null)
const batchRegions = ref([])
const batchComparisonData = ref(null)
const reductionData = ref(null)

const loading = ref(false)

// Chart refs
const comparisonChart = ref(null)
const heatmapChart = ref(null)
const scatterChart = ref(null)

// Chart instances
let comparisonChartInstance = null
let heatmapChartInstance = null
let scatterChartInstance = null

// Compare vectors
const compareVectors = async () => {
  if (!region1.value || !region2.value) return

  loading.value = true
  try {
    const params = {}

    // Region 1 params (使用层级路径)
    params.level1 = level1.value
    if (hierarchy1.value) {
      if (hierarchy1.value.city) params.city1 = hierarchy1.value.city
      if (hierarchy1.value.county) params.county1 = hierarchy1.value.county
      if (hierarchy1.value.township) params.township1 = hierarchy1.value.township
    }

    // Region 2 params (使用层级路径)
    params.level2 = level2.value
    if (hierarchy2.value) {
      if (hierarchy2.value.city) params.city2 = hierarchy2.value.city
      if (hierarchy2.value.county) params.county2 = hierarchy2.value.county
      if (hierarchy2.value.township) params.township2 = hierarchy2.value.township
    }

    console.log('发送参数:', params) // 调试用
    const response = await compareRegionalVectors(params)
    comparisonData.value = response

    await nextTick()
    // 添加额外延迟确保 DOM 完全渲染
    setTimeout(() => {
      renderComparisonChart()
    }, 50)
    showSuccess('向量比較完成')
  } catch (error) {
    showError(error.message || '向量比較失敗')
  } finally {
    loading.value = false
  }
}

// Add region to batch list
const addRegionToBatch = () => {
  if (!selectedRegionToAdd.value || batchRegions.value.length >= 20) return

  const regionParams = {
    level: batchLevel.value,
    display: selectedRegionToAdd.value
  }

  if (selectedRegionHierarchy.value) {
    if (selectedRegionHierarchy.value.city) regionParams.city = selectedRegionHierarchy.value.city
    if (selectedRegionHierarchy.value.county) regionParams.county = selectedRegionHierarchy.value.county
    if (selectedRegionHierarchy.value.township) regionParams.township = selectedRegionHierarchy.value.township
  }

  // Check duplicate
  const isDuplicate = batchRegions.value.some(r =>
    r.level === regionParams.level &&
    r.city === regionParams.city &&
    r.county === regionParams.county &&
    r.township === regionParams.township
  )

  if (isDuplicate) {
    showWarning('該區域已在列表中')
    return
  }

  batchRegions.value.push(regionParams)
  selectedRegionToAdd.value = ''
}

// Remove region from batch list
const removeRegionFromBatch = (index) => {
  batchRegions.value.splice(index, 1)
}

// Run batch comparison (heatmap)
const runBatchComparison = async () => {
  if (batchRegions.value.length < 2) {
    showWarning('至少需要2個區域')
    return
  }

  loading.value = true
  try {
    const regions = batchRegions.value.map(r => ({
      level: r.level,
      city: r.city,
      county: r.county,
      township: r.township
    }))

    const response = await batchCompareRegionalVectors({ regions })
    batchComparisonData.value = response

    await nextTick()
    renderHeatmap()
    showSuccess('熱力圖生成完成')
  } catch (error) {
    showError(error.message || '批量比較失敗')
  } finally {
    loading.value = false
  }
}

// Run dimension reduction (scatter plot)
const runDimensionReduction = async () => {
  if (batchRegions.value.length < 2) {
    showWarning('至少需要2個區域')
    return
  }

  loading.value = true
  try {
    const regions = batchRegions.value.map(r => ({
      level: r.level,
      city: r.city,
      county: r.county,
      township: r.township
    }))

    const response = await reduceRegionalVectors({
      regions,
      method: 'pca',
      n_components: 2
    })
    reductionData.value = response

    await nextTick()
    renderScatterPlot()
    showSuccess('散點圖生成完成')
  } catch (error) {
    showError(error.message || '降維失敗')
  } finally {
    loading.value = false
  }
}

// Render comparison chart (side-by-side)
const renderComparisonChart = () => {
  if (!comparisonChart.value || !comparisonData.value) {
    console.warn('[RegionalVectors] comparisonChart ref or data not ready', {
      hasRef: !!comparisonChart.value,
      hasData: !!comparisonData.value
    })
    return
  }

  // 确保容器有尺寸
  const container = comparisonChart.value
  if (container.offsetWidth === 0 || container.offsetHeight === 0) {
    console.warn('[RegionalVectors] Chart container has no size', {
      width: container.offsetWidth,
      height: container.offsetHeight
    })
    // 延迟重试
    setTimeout(() => renderComparisonChart(), 100)
    return
  }

  if (!comparisonChartInstance) {
    comparisonChartInstance = echarts.init(comparisonChart.value)
  }

  const categoryKeys = ['agriculture', 'clan', 'direction', 'infrastructure', 'mountain', 'settlement', 'symbolic', 'vegetation', 'water']
  const categories = categoryKeys.map(key => SEMANTIC_CATEGORY_NAMES[key])
  const isMobile = window.matchMedia('(orientation: portrait)').matches

  comparisonChartInstance.setOption({
    title: {
      text: '向量對比',
      left: 'center',
      textStyle: { fontSize: isMobile ? 14 : 16 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: [region1.value, region2.value],
      top: isMobile ? 28 : 32,
      textStyle: { fontSize: isMobile ? 11 : 12 }
    },
    grid: {
      left: isMobile ? '15%' : '10%',
      right: isMobile ? '5%' : '10%',
      bottom: isMobile ? '20%' : '15%',
      top: isMobile ? '22%' : '20%'
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        rotate: isMobile ? 45 : 35,
        fontSize: isMobile ? 10 : 12
      }
    },
    yAxis: {
      type: 'value',
      name: '權重',
      nameTextStyle: { fontSize: isMobile ? 11 : 12 },
      axisLabel: { fontSize: isMobile ? 10 : 12 }
    },
    series: [
      {
        name: region1.value,
        type: 'bar',
        data: comparisonData.value.region1_vector || [],
        itemStyle: { color: '#4a90e2' }
      },
      {
        name: region2.value,
        type: 'bar',
        data: comparisonData.value.region2_vector || [],
        itemStyle: { color: '#50c878' }
      }
    ]
  })
}

// Render heatmap
const renderHeatmap = () => {
  if (!heatmapChart.value || !batchComparisonData.value) return

  if (!heatmapChartInstance) {
    heatmapChartInstance = echarts.init(heatmapChart.value)
  }

  const regions = batchComparisonData.value.regions.map(r => r.region_name || r.display)
  const matrix = batchComparisonData.value.similarity_matrix
  const heatmapData = []

  matrix.forEach((row, i) => {
    row.forEach((value, j) => {
      heatmapData.push([j, i, value])
    })
  })

  const isMobile = window.matchMedia('(orientation: portrait)').matches

  heatmapChartInstance.setOption({
    tooltip: {
      position: 'top',
      formatter: (params) => {
        const [x, y, value] = params.data
        return `${regions[y]} vs ${regions[x]}<br/>相似度: ${value.toFixed(4)}`
      }
    },
    grid: {
      left: isMobile ? '25%' : '15%',
      right: '5%',
      bottom: isMobile ? '25%' : '15%',
      top: '5%'
    },
    xAxis: {
      type: 'category',
      data: regions,
      axisLabel: {
        rotate: 45,
        fontSize: isMobile ? 9 : 11
      }
    },
    yAxis: {
      type: 'category',
      data: regions,
      axisLabel: {
        fontSize: isMobile ? 9 : 11
      }
    },
    visualMap: {
      min: 0,
      max: 1,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: isMobile ? '2%' : '5%',
      inRange: {
        color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
      }
    },
    series: [{
      type: 'heatmap',
      data: heatmapData,
      label: {
        show: !isMobile,
        fontSize: 10
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  })
}

// Render scatter plot
const renderScatterPlot = () => {
  if (!scatterChart.value || !reductionData.value) return

  if (!scatterChartInstance) {
    scatterChartInstance = echarts.init(scatterChart.value)
  }

  const regions = reductionData.value.regions.map(r => r.region_name || r.display)
  const coordinates = reductionData.value.coordinates
  const scatterData = coordinates.map((coord, i) => ({
    value: coord,
    name: regions[i]
  }))

  const isMobile = window.matchMedia('(orientation: portrait)').matches

  scatterChartInstance.setOption({
    tooltip: {
      formatter: (params) => params.name
    },
    grid: {
      left: '10%',
      right: '10%',
      bottom: '10%',
      top: '5%'
    },
    xAxis: {
      type: 'value',
      name: 'PC1',
      nameLocation: 'middle',
      nameGap: 30
    },
    yAxis: {
      type: 'value',
      name: 'PC2',
      nameLocation: 'middle',
      nameGap: 40
    },
    series: [{
      type: 'scatter',
      data: scatterData,
      symbolSize: isMobile ? 15 : 20,
      itemStyle: {
        color: '#4a90e2',
        borderColor: '#357abd',
        borderWidth: 2
      },
      label: {
        show: true,
        position: 'top',
        fontSize: isMobile ? 10 : 12,
        formatter: (params) => params.name
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(74, 144, 226, 0.5)'
        }
      }
    }]
  })
}

// Format number
const formatNumber = (num) => {
  return typeof num === 'number' ? num.toFixed(4) : 'N/A'
}

// Format variance
const formatVariance = (variance) => {
  if (!variance || !Array.isArray(variance)) return 'N/A'
  const total = variance.reduce((sum, v) => sum + v, 0)
  return `${(total * 100).toFixed(2)}%`
}

// Get level label
const getLevelLabel = (level) => {
  const labels = {
    city: '市級',
    county: '區縣級',
    town: '鄉鎮級',
    township: '鄉鎮級'
  }
  return labels[level] || level
}

// Responsive handling
const handleResize = () => {
  if (comparisonChartInstance) {
    comparisonChartInstance.resize()
    if (comparisonData.value) renderComparisonChart()
  }
  if (heatmapChartInstance) {
    heatmapChartInstance.resize()
    if (batchComparisonData.value) renderHeatmap()
  }
  if (scatterChartInstance) {
    scatterChartInstance.resize()
    if (reductionData.value) renderScatterPlot()
  }
}

// Lifecycle
onMounted(() => {
  window.addEventListener('resize', handleResize)
  window.addEventListener('orientationchange', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('orientationchange', handleResize)
  if (comparisonChartInstance) {
    comparisonChartInstance.dispose()
    comparisonChartInstance = null
  }
  if (heatmapChartInstance) {
    heatmapChartInstance.dispose()
    heatmapChartInstance = null
  }
  if (scatterChartInstance) {
    scatterChartInstance.dispose()
    scatterChartInstance = null
  }
})
</script>

<style scoped>
.regional-vectors-page {
  padding: 12px;
  max-width: 1600px;
  margin: 0 auto;
}

.glass-panel {
  margin-bottom: 24px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(74, 144, 226, 0.2);
}

.panel-header h3 {
  font-size: 16px;
  color: var(--text-primary);
  margin: 0;
}

.region-label {
  background: linear-gradient(135deg, #4a90e2, #50c878);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}

.selector-panel {
  display: flex;
  flex-direction: column;
}

.selector-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
}

/* 區域選擇器並排 */
.regions-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.region-group {
  padding: 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  border: 1px solid rgba(74, 144, 226, 0.2);
}

.group-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(74, 144, 226, 0.15);
}

.action-button {
  width: 100%;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  background: linear-gradient(135deg, #4a90e2, #357abd);
}

.action-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #357abd, #2868a8);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.action-button.add-button {
  width: auto;
  padding: 10px 20px;
  background: linear-gradient(135deg, #50c878, #3da35d);
}

.action-button.add-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #3da35d, #2d8a4a);
}

/* Multi-region panel */
.multi-region-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.region-selector-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.region-selector-row > :first-child {
  flex: 1;
}

.selected-regions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  min-height: 50px;
}

.region-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #4a90e2, #357abd);
  color: white;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
}

.region-name {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-btn {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.remove-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.batch-actions {
  display: flex;
  gap: 12px;
}

.batch-actions .action-button {
  flex: 1;
}

.info-label {
  font-size: 13px;
  color: var(--text-secondary);
  background: rgba(74, 144, 226, 0.1);
  padding: 4px 10px;
  border-radius: 8px;
}

/* 結果區域 */
.results-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 向量卡片並排 */
.vectors-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.vector-panel {
  margin-bottom: 0;
}

.vector-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-item {
  flex: 1;
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
}

.stat-item .label {
  font-weight: 500;
  font-size: 13px;
  color: var(--text-secondary);
}

.stat-item .value {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}

.chart-container {
  width: 100%;
  height: 320px;
}

.chart-wrapper {
  width: 100%;
  margin-top: 16px;
}

.chart-container-large {
  width: 100%;
  height: 400px;
}

.chart-container-xlarge {
  width: 100%;
  height: 500px;
}

.comparison-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
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
  font-size: 16px;
  font-weight: 700;
  color: var(--text-secondary);
}

.similarity-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}

.metric-card {
  flex: 1;
  min-width: 150px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  text-align: center;
  border: 2px solid rgba(74, 144, 226, 0.2);
}

.metric-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.metric-value {
  font-size: 26px;
  font-weight: 700;
  color: #4a90e2;
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



.loading-overlay p {
  color: white;
  margin-top: 16px;
  font-size: 16px;
}

/* Responsive - Landscape orientation */
@media (min-aspect-ratio: 1/1) {
  .selector-panel {
    flex-direction: row;
    align-items: center;
  }

  .selector-panel .panel-header {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }

  .selector-content {
    flex-direction: row;
    align-items: center;
    gap: 12px;
  }

  .action-button {
    width: auto;
    flex-shrink: 0;
  }
}

/* Responsive - Portrait orientation */
@media (orientation: portrait) {
  .regional-vectors-page {
    padding: 8px;
  }

  .glass-panel {
    padding: 12px;
    margin-bottom: 16px;
  }

  /* 豎屏時改為上下排列 */
  .regions-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .region-group {
    padding: 12px;
  }

  .vectors-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .comparison-header {
    flex-direction: column;
    gap: 12px;
  }

  .region-badge {
    padding: 6px 16px;
    font-size: 14px;
  }

  .similarity-metrics {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .metric-card {
    padding: 12px;
  }

  .metric-value {
    font-size: 22px;
  }

  .chart-container {
    height: 260px;
  }

  .chart-container-large {
    height: 300px;
  }

  .chart-container-xlarge {
    height: 350px;
  }

  .region-selector-row {
    flex-direction: column;
    align-items: stretch;
  }

  .region-selector-row .action-button {
    width: 100%;
  }

  .batch-actions {
    flex-direction: column;
  }
}
</style>
