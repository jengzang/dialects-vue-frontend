<template>
  <div class="vml-glass-panel">
    <div class="panel-header">
      <h3 class="panel-title">
        字傾向性熱力圖
        <HelpIcon
          content="條形高度越高，表示該字符在該地區的使用傾向性越強（TF-IDF 值越高），由此可發現顯著的地域特色用字。本圖表僅展示排行前列的高傾向字項，綠色條柱代表正傾向（即該地區偏好使用的特徵用字）。"
          size="md"
          fontSize="16px"
          trigger="both"
        />
      </h3>

      <div v-if="data.length > 0" class="metric-selector">
        <button
          class="metric-button"
          :class="{ active: selectedMetric === 'z_score' }"
          @click="selectedMetric = 'z_score'"
        >
          Z-Score
          <HelpIcon
            content="標準化偏差，公式：z = (觀察頻率 - 期望頻率) / √(期望頻率 × (1-p))。z>2表示顯著偏好（p<0.05），z<-2表示顯著迴避。數值越大，該字符在該地區的使用傾向性越強"
            size="sm"
            fontSize="14px"
            trigger="both"
          />
        </button>
        <button
          class="metric-button"
          :class="{ active: selectedMetric === 'log_odds' }"
          @click="selectedMetric = 'log_odds'"
        >
          Log Odds
          <HelpIcon
            content="對數幾率差，公式：log(p/(1-p)) - log(q/(1-q))。正值表示偏好，負值表示迴避。相比Lift，Log-odds對極端概率更敏感"
            size="sm"
            fontSize="14px"
            trigger="both"
          />
        </button>
      </div>
    </div>

    <div v-if="loading" class="vml-loading">
      <div class="ui-loading--page" aria-hidden="true"></div>
      <p>載入中...</p>
    </div>

    <div v-else-if="data.length > 0" ref="chartRef" class="chart-container"></div>

    <div v-else class="empty-state">
      <p>請選擇區域並點擊"開始分析"</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

const chartRef = ref(null)
const selectedMetric = ref('z_score')
let chartInstance = null

const handleResize = () => {
  chartInstance?.resize()
}

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
            color: value > 0 ? 'var(--color-success)' : 'var(--color-error)'
          }
        }
      })
    }]
  }

  chartInstance.setOption(option)
}

const scheduleRenderChart = async () => {
  await nextTick()

  requestAnimationFrame(() => {
    if (!props.loading && props.data.length > 0 && chartRef.value) {
      renderChart()
      chartInstance?.resize()
    }
  })
}

watch(
  [() => props.data, () => props.loading, () => selectedMetric.value],
  () => {
    scheduleRenderChart()
  },
  {
    deep: true,
    immediate: true,
    flush: 'post'
  }
)

onMounted(() => {
  window.addEventListener('resize', handleResize)
  nextTick(renderChart)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped lang="scss">
.vml-glass-panel {
  padding: 20px;
  min-height: 400px;
}

.empty-state {
  min-height: 300px;
  color: var(--text-primary);
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
  background: var(--glass-30);
  padding: 4px;
  border-radius: var(--radius-md);
}

.metric-button {
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-sm2);
  background: transparent;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.metric-button:hover {
  background: rgba(var(--vml-blue-rgb), 0.1);
}

.metric-button.active {
  background: var(--color-primary);
  color: white;
}

.chart-container {
  width: 100%;
  height: clamp(280px, 45vh, 400px);
}

</style>
