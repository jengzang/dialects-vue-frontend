<template>
  <div class="tendency-heatmap-panel glass-panel">
    <h3 class="panel-title">字傾向性熱力圖</h3>

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
let chartInstance = null

const renderChart = () => {
  if (!chartRef.value || props.data.length === 0) return

  if (chartInstance) chartInstance.dispose()
  chartInstance = echarts.init(chartRef.value)

  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'category',
      data: props.data.map(item => item.char),
      axisLabel: { fontSize: 14 }
    },
    yAxis: { type: 'value', name: 'Z-Score' },
    series: [{
      type: 'bar',
      data: props.data.map(item => ({
        value: item.z_score,
        itemStyle: {
          color: item.z_score > 0 ? '#50c878' : '#e74c3c'
        }
      }))
    }]
  }

  chartInstance.setOption(option)
}

watch(() => props.data, () => {
  nextTick(renderChart)
}, { deep: true })

onMounted(() => {
  window.addEventListener('resize', () => chartInstance?.resize())
})
</script>

<style scoped>
.tendency-heatmap-panel {
  padding: 20px;
  min-height: 400px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 20px 0;
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
