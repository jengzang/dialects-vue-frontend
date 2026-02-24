<template>
  <div class="tendency-heatmap-panel glass-panel">
    <div class="panel-header">
      <h3 class="panel-title">字傾向性熱力圖</h3>

      <div v-if="data.length > 0" class="metric-selector">
        <button
          class="metric-button"
          :class="{ active: selectedMetric === 'z_score' }"
          @click="selectedMetric = 'z_score'"
        >
          Z-Score
        </button>
        <button
          class="metric-button"
          :class="{ active: selectedMetric === 'log_odds' }"
          @click="selectedMetric = 'log_odds'"
        >
          Log Odds
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>載入中...</p>
    </div>

    <div v-else-if="data.length > 0" ref="chartRef" class="chart-container"></div>

    <div v-else class="empty-state">
      <p>請選擇區域並點擊"開始分析"</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

const chartRef = ref(null)
const selectedMetric = ref('z_score')
let chartInstance = null

const getMetricLabel = () => {
  return selectedMetric.value === 'z_score' ? 'Z-Score' : 'Log Odds'
}

const getMetricValue = (item) => {
  return selectedMetric.value === 'z_score' ? item.z_score : item.log_odds
}

const renderChart = () => {
  if (!chartRef.value || props.data.length === 0) return

  if (chartInstance) chartInstance.dispose()
  chartInstance = echarts.init(chartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const item = props.data[params[0].dataIndex]
        return `
          <strong>${item.character}</strong><br/>
          Z-Score: ${item.z_score?.toFixed(3) || 'N/A'}<br/>
          Log Odds: ${item.log_odds?.toFixed(3) || 'N/A'}<br/>
          Lift: ${item.lift?.toFixed(2) || 'N/A'}
        `
      }
    },
    xAxis: {
      type: 'category',
      data: props.data.map(item => item.character),
      axisLabel: { fontSize: 14 }
    },
    yAxis: {
      type: 'value',
      name: getMetricLabel(),
      nameTextStyle: { fontSize: 14, fontWeight: 600 }
    },
    series: [{
      type: 'bar',
      data: props.data.map(item => {
        const value = getMetricValue(item)
        return {
          value: value,
          itemStyle: {
            color: value > 0 ? '#50c878' : '#e74c3c'
          }
        }
      })
    }]
  }

  chartInstance.setOption(option)
}

watch(() => props.data, () => {
  nextTick(renderChart)
}, { deep: true })

watch(() => selectedMetric.value, () => {
  nextTick(renderChart)
})

onMounted(() => {
  window.addEventListener('resize', () => chartInstance?.resize())
})
</script>

<style scoped>
.tendency-heatmap-panel {
  padding: 20px;
  min-height: 400px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.metric-selector {
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.3);
  padding: 4px;
  border-radius: 10px;
}

.metric-button {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.metric-button:hover {
  background: rgba(74, 144, 226, 0.1);
}

.metric-button.active {
  background: var(--color-primary);
  color: white;
}

.chart-container {
  width: 100%;
  height: 400px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: var(--text-primary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(74, 144, 226, 0.2);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
