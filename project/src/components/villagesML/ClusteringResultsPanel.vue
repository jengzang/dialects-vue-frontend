<template>
  <div class="clustering-results-panel glass-panel">
    <h3 class="panel-title">聚類結果</h3>

    <div v-if="results" class="results-content">
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">輪廓係數</div>
          <div class="metric-value">{{ results.silhouette_score?.toFixed(3) || 'N/A' }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">聚類數</div>
          <div class="metric-value">{{ results.n_clusters || 'N/A' }}</div>
        </div>
      </div>

      <div ref="chartRef" class="chart-container"></div>
    </div>

    <div v-else class="empty-state">
      <p>運行聚類後查看結果</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  results: { type: Object, default: null }
})

const chartRef = ref(null)
let chartInstance = null

const renderChart = () => {
  if (!chartRef.value || !props.results) return

  if (chartInstance) chartInstance.dispose()
  chartInstance = echarts.init(chartRef.value)

  const option = {
    tooltip: {},
    xAxis: { type: 'value', name: 'PC1' },
    yAxis: { type: 'value', name: 'PC2' },
    series: [{
      type: 'scatter',
      data: props.results.scatter_data || [],
      symbolSize: 8
    }]
  }

  chartInstance.setOption(option)
}

watch(() => props.results, () => {
  nextTick(renderChart)
}, { deep: true })

onMounted(() => {
  window.addEventListener('resize', () => chartInstance?.resize())
})
</script>

<style scoped>
.clustering-results-panel {
  padding: 20px;
  min-height: 400px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 20px 0;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.metric-card {
  padding: 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  text-align: center;
}

.metric-label {
  font-size: 13px;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.metric-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-primary);
}

.chart-container {
  width: 100%;
  height: 400px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: var(--text-primary);
}
</style>
