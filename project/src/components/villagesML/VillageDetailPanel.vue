<template>
  <div class="village-detail-panel glass-panel" v-if="village">
    <!-- Header -->
    <div class="detail-header">
      <h3 class="village-title">{{ village.name }}</h3>
      <button class="close-button" @click="close">✕</button>
    </div>

    <!-- Basic Info -->
    <div class="info-section">
      <div class="info-row">
        <span class="info-label">城市：</span>
        <span class="info-value">{{ village.city }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">区县：</span>
        <span class="info-value">{{ village.county }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">乡镇：</span>
        <span class="info-value">{{ village.township }}</span>
      </div>
    </div>

    <!-- Character Frequency Chart -->
    <div class="chart-section">
      <h4 class="section-title">字頻分佈</h4>
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>載入中...</p>
      </div>
      <div v-else-if="charFrequency.length > 0" ref="chartRef" class="chart-container"></div>
      <div v-else class="empty-state">暫無數據</div>
    </div>
  </div>

  <div v-else class="village-detail-panel glass-panel empty-panel">
    <div class="empty-state">
      <div class="empty-icon">📍</div>
      <p>請選擇一個村查看詳情</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import { villagesMLStore } from '@/utils/villagesMLStore.js'
import * as echarts from 'echarts'

const props = defineProps({
  village: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const loading = ref(false)
const charFrequency = ref([])
const chartRef = ref(null)
let chartInstance = null

const close = () => {
  villagesMLStore.selectedVillage = null
  emit('close')
}

// Note: Village-specific character frequency endpoint not available in backend
// This feature is disabled until backend support is added
const loadCharFrequency = async () => {
  if (!props.village) return
  // Backend API does not provide village-specific character frequency
  // charFrequency remains empty, showing "暫無數據" state
}

const renderChart = () => {
  if (!chartRef.value || charFrequency.value.length === 0) return

  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(chartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    xAxis: {
      type: 'category',
      data: charFrequency.value.map(item => item.char),
      axisLabel: { fontSize: 14 }
    },
    yAxis: {
      type: 'value',
      name: '出現次數'
    },
    series: [{
      type: 'bar',
      data: charFrequency.value.map(item => item.count),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#4a90e2' },
          { offset: 1, color: '#50c878' }
        ])
      }
    }]
  }

  chartInstance.setOption(option)
}

watch(() => props.village, (newVillage) => {
  if (newVillage) {
    loadCharFrequency()
  }
}, { immediate: true })

onMounted(() => {
  window.addEventListener('resize', () => {
    if (chartInstance) {
      chartInstance.resize()
    }
  })
})
</script>

<style scoped>
.village-detail-panel {
  padding: 20px;
  min-height: 400px;
}

.empty-panel {
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);
}

.village-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0;
}

.close-button {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(243, 156, 18, 0.2);
  color: var(--accent-color);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-button:hover {
  background: rgba(243, 156, 18, 0.3);
  transform: rotate(90deg);
}

.info-section {
  margin-bottom: 24px;
}

.info-row {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.info-label {
  font-weight: 500;
  color: var(--text-primary);
  min-width: 80px;
}

.info-value {
  color: var(--text-primary);
}

.chart-section {
  margin-top: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.chart-container {
  width: 100%;
  height: 300px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--text-primary);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(74, 144, 226, 0.2);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
</style>

