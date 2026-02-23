<template>
  <div class="network-graph-panel glass-panel">
    <h3 class="panel-title">語義網絡圖</h3>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>生成網絡中...</p>
    </div>

    <div v-else-if="network" ref="chartRef" class="chart-container"></div>

    <div v-else class="empty-state">
      <p>點擊"生成網絡"查看結果</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  network: { type: Object, default: null },
  loading: { type: Boolean, default: false }
})

const chartRef = ref(null)
let chartInstance = null

const renderChart = () => {
  if (!chartRef.value || !props.network) return

  if (chartInstance) chartInstance.dispose()
  chartInstance = echarts.init(chartRef.value)

  const option = {
    tooltip: {},
    series: [{
      type: 'graph',
      layout: 'force',
      data: props.network.nodes || [],
      edges: props.network.edges || [],
      roam: true,
      label: { show: true, position: 'right' },
      force: {
        repulsion: 100,
        edgeLength: 50
      }
    }]
  }

  chartInstance.setOption(option)
}

watch(() => props.network, () => {
  nextTick(renderChart)
}, { deep: true })

onMounted(() => {
  window.addEventListener('resize', () => chartInstance?.resize())
})
</script>

<style scoped>
.network-graph-panel {
  padding: 20px;
  min-height: 500px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 20px 0;
}

.chart-container {
  width: 100%;
  height: 500px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: var(--text-primary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(74, 144, 226, 0.2);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
