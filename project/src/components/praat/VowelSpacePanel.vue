<template>
  <div class="vowel-space-panel glass-panel">
    <div style="display: flex;align-items: center;flex-direction: column;justify-content: center;">
      <h2 class="panel-title">F1-F2 元音空間</h2>

      <!-- Usage Hint -->
      <div class="usage-hint">
        💡 使用建議：推薦使用「單音節」分析模式，需精確截取韻核(rime_core)，本網站自動截取的韻核可能有誤差。此功能對錄音質量要求較高，噪音可能影響分析準確度。
      </div>

      <!-- Control Buttons -->
      <div class="control-buttons">
        <!-- Display Mode Switch Toggle -->
        <div
          class="vowel-switch-container"
          :class="{ disabled: vowelSegments.length === 0 }"
          @click="vowelSegments.length > 0 && (showSegmented = !showSegmented)"
          :title="vowelSegments.length === 0 ? '未檢測到有效語音段，無法切換' : ''"
        >
          <span class="switch-label-text">分段顯示</span>
          <div class="custom-switch" :class="{ 'open': showSegmented }">
            <span class="custom-slider">
<!--              <span class="switch-text">-->
<!--                {{ showSegmented ? '開啟' : '關閉' }}-->
<!--              </span>-->
            </span>
          </div>
        </div>

        <!-- Reference Vowels Checkbox -->
        <label class="reference-vowels-checkbox">
          <input
            type="checkbox"
            v-model="showReferenceVowels"
          />
          <span class="segment-label">顯示參考元音</span>
        </label>
      </div>
    </div>

    <!-- Segment Selector Section (only show when segmented mode is on) -->
    <div v-if="showSegmented" class="segment-selector-section">
      <h3 class="section-title">選擇語音段</h3>

      <div v-if="vowelSegments.length === 0" class="no-segments-message">
        未檢測到元音段（rime_core、syllable_like 或 voiced）
      </div>

      <div v-else class="segment-list">
        <!-- Select All Checkbox -->
        <label class="segment-checkbox glass-panel-inner">
          <input
            type="checkbox"
            :checked="showAll"
            @change="toggleAll"
          />
          <span class="segment-label">全部顯示</span>
        </label>

        <!-- Individual Segment Checkboxes -->
        <label
          v-for="seg in vowelSegments"
          :key="seg.id"
          class="segment-checkbox glass-panel-inner"
        >
          <input
            type="checkbox"
            :checked="selectedSegments.has(seg.id)"
            @change="toggleSegment(seg.id)"
          />
          <span class="segment-color-indicator" :style="{ backgroundColor: getSegmentColor(seg.id) }"></span>
          <span class="segment-label">
            {{ seg.label }} ({{ seg.timeRange }})
          </span>
          <span class="segment-type-badge" :class="`type-${seg.type}`">
            {{ seg.type }}
          </span>
        </label>
      </div>
    </div>

    <!-- Vowel Space Chart -->
    <div class="chart-section">
      <div ref="chartContainer" class="chart-container"></div>
    </div>

    <!-- Statistics Section (only show when segmented mode is on) -->
    <div v-if="showSegmented" class="stats-section">
      <h3 class="section-title">統計信息</h3>

      <div v-if="selectedSegments.size === 0" class="no-selection-message">
        請選擇至少一個語音段
      </div>

      <div v-else class="stats-grid">
        <div
          v-for="data in segmentVowelData.filter(d => selectedSegments.has(d.segment.id))"
          :key="data.segment.id"
          class="stat-card glass-panel-inner"
        >
          <div class="stat-header">
            <span class="segment-color-dot" :style="{ backgroundColor: getSegmentColor(data.segment.id) }"></span>
            <span class="stat-label">{{ data.segment.label }}</span>
          </div>
          <div class="stat-values">
            <div class="stat-item">
              <span class="stat-key">F1 平均:</span>
              <span class="stat-value">{{ data.stats.f1Mean.toFixed(0) }} Hz</span>
            </div>
            <div class="stat-item">
              <span class="stat-key">F2 平均:</span>
              <span class="stat-value">{{ data.stats.f2Mean.toFixed(0) }} Hz</span>
            </div>
            <div class="stat-item">
              <span class="stat-key">數據點:</span>
              <span class="stat-value">{{ data.stats.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Description -->
    <div class="description-section">
      <p class="description-text">
        元音空間圖顯示 F1(第一共振峰)和 F2(第二共振峰)的分布。
        根據語音學慣例，兩個軸都是反向的（從高到低）。
        <span v-if="showSegmented">連線顯示元音在時間上的軌跡變化，箭頭指示時間方向。</span>
        <span v-if="showReferenceVowels">灰色標記為 IPA 參考元音位置。</span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import referenceVowelsData from '@/assets/vowels.json'

const props = defineProps({
  results: {
    type: Object,
    default: null
  }
})

const chartContainer = ref(null)
let chart = null
let resizeObserver = null

// Reactive state for segment selection and display modes
const selectedSegments = ref(new Set())
const showAll = ref(true)
const showSegmented = ref(true)  // Toggle between segmented and scatter view
const showReferenceVowels = ref(false)  // Toggle reference vowels

// Color palette for segments
const segmentColors = [
  '#34c759',  // Green - rime_core
  '#007aff',  // Blue - syllable_like
  '#ff9500',  // Orange - voiced
  '#ff2d55',  // Pink
  '#5856d6',  // Purple
  '#5ac8fa',  // Cyan
]

const getSegmentColor = (segmentId) => {
  return segmentColors[segmentId % segmentColors.length]
}

// Filter segments by type (only rime_core, syllable_like, voiced)
const vowelSegments = computed(() => {
  const segments = props.results?.segments || []
  return segments
    .filter(seg => ['rime_core', 'syllable_like', 'voiced'].includes(seg.type))
    .map((seg, idx) => ({
      ...seg,
      id: idx,
      label: `Segment ${idx + 1} (${seg.type})`,
      timeRange: `${seg.start_s.toFixed(2)}-${seg.end_s.toFixed(2)}s`
    }))
})

// Extract formant data for a specific segment
const getSegmentFormantData = (segment) => {
  const ts = props.results?.timeseries
  if (!ts?.time || !ts?.formants?.f1 || !ts?.formants?.f2) return []

  // Find indices within segment time range
  const points = ts.time
    .map((t, idx) => ({
      time: t,
      f1: ts.formants.f1[idx],
      f2: ts.formants.f2[idx],
      idx
    }))
    .filter(p =>
      p.time >= segment.start_s &&
      p.time <= segment.end_s &&
      p.f1 > 0 &&
      p.f2 > 0
    )
    .map(p => [p.f2, p.f1, p.time])  // [F2, F1, time] for ECharts

  return points
}

// Compute all segment data with statistics
const segmentVowelData = computed(() => {
  return vowelSegments.value.map(seg => {
    const points = getSegmentFormantData(seg)

    // Calculate statistics
    const f1Values = points.map(([f2, f1]) => f1)
    const f2Values = points.map(([f2, f1]) => f2)

    return {
      segment: seg,
      points: points,
      stats: {
        f1Mean: f1Values.length > 0
          ? f1Values.reduce((a, b) => a + b, 0) / f1Values.length
          : 0,
        f2Mean: f2Values.length > 0
          ? f2Values.reduce((a, b) => a + b, 0) / f2Values.length
          : 0,
        count: points.length
      }
    }
  })
})

// Compute all formant data (for scatter plot mode)
const allVowelSpaceData = computed(() => {
  const ts = props.results?.timeseries
  if (!ts?.formants?.f1 || !ts?.formants?.f2) return []

  return ts.formants.f1
    .map((f1, idx) => [ts.formants.f2[idx], f1])
    .filter(([f2, f1]) => f2 && f1 && f2 > 0 && f1 > 0)
})

// Initialize: select all segments by default
watch(vowelSegments, (segments) => {
  if (segments.length > 0) {
    // 有元音段时，默认选中全部段
    if (selectedSegments.value.size === 0) {
      selectedSegments.value = new Set(segments.map(s => s.id))
    }
  } else {
    // 【新增逻辑】如果没有元音段，强制切换到“全部显示”模式
    showSegmented.value = false
  }
}, { immediate: true })

// Toggle functions
const toggleAll = () => {
  showAll.value = !showAll.value
  if (showAll.value) {
    selectedSegments.value = new Set(vowelSegments.value.map(s => s.id))
  } else {
    selectedSegments.value = new Set()
  }
}

const toggleSegment = (segmentId) => {
  if (selectedSegments.value.has(segmentId)) {
    selectedSegments.value.delete(segmentId)
  } else {
    selectedSegments.value.add(segmentId)
  }
  // Trigger reactivity
  selectedSegments.value = new Set(selectedSegments.value)

  // Update showAll state
  showAll.value = selectedSegments.value.size === vowelSegments.value.length
}

// Initialize chart
const initChart = () => {
  if (!chartContainer.value) return

  // Dispose existing chart
  if (chart) {
    chart.dispose()
  }

  // Dispose existing resize observer
  if (resizeObserver) {
    resizeObserver.disconnect()
  }

  chart = echarts.init(chartContainer.value)

  let series = []

  // Choose series based on display mode
  if (showSegmented.value) {
    // Segmented mode: line series with trajectories
    series = segmentVowelData.value
      .filter(data => selectedSegments.value.has(data.segment.id))
      .map(data => ({
        name: data.segment.label,
        type: 'line',
        data: data.points,
        smooth: false,
        lineStyle: {
          color: getSegmentColor(data.segment.id),
          width: 2
        },
        itemStyle: {
          color: getSegmentColor(data.segment.id)
        },
        symbolSize: 6,
        showSymbol: true,
        endLabel: {
          show: true,
          formatter: '▶',
          fontSize: 12,
          color: getSegmentColor(data.segment.id),
          distance: 5
        },
        emphasis: {
          focus: 'series'
        }
      }))
  } else {
    // Scatter mode: all points together
    series = [{
      name: '所有數據點',
      type: 'scatter',
      data: allVowelSpaceData.value,
      symbolSize: 6,
      itemStyle: {
        color: '#34c759',
        opacity: 0.6
      }
    }]
  }

  // Add reference vowels if enabled
  if (showReferenceVowels.value) {
    series.push({
      name: 'IPA 參考元音',
      type: 'scatter',
      data: referenceVowelsData.map(v => [v.F2, v.F1]),
      symbolSize: 10,
      itemStyle: {
        color: '#8e8e93',
        opacity: 0.7,
        borderColor: '#fff',
        borderWidth: 1
      },
      label: {
        show: true,
        formatter: (params) => {
          const vowel = referenceVowelsData[params.dataIndex]
          return vowel.symbol
        },
        position: 'top',
        fontSize: 12,
        color: '#8e8e93',
        fontWeight: 'bold'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14
        }
      },
      z: 10  // Ensure reference vowels are on top
    })
  }

  const option = {
    title: {
      text: showSegmented.value ? 'F1-F2 元音空間 (按語音段)' : 'F1-F2 元音空間 (全部數據)',
      left: 'center',
      top: 10
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (params.seriesName === 'IPA 參考元音') {
          const vowel = referenceVowelsData[params.dataIndex]
          return `${vowel.symbol}<br/>F1: ${vowel.F1} Hz<br/>F2: ${vowel.F2} Hz`
        }
        const [f2, f1, time] = params.value
        let result = `${params.seriesName}<br/>F1: ${f1.toFixed(0)} Hz<br/>F2: ${f2.toFixed(0)} Hz`
        if (time !== undefined) {
          result += `<br/>時間: ${time.toFixed(2)}s`
        }
        return result
      }
    },
    legend: {
      data: series.map(s => s.name),
      top: 40,
      type: 'scroll'
    },
    xAxis: {
      type: 'value',
      name: 'F2 (Hz)',
      nameLocation: 'middle',
      nameGap: 30,
      inverse: true,
      scale: true,
      min: 0,
      // 【新增】强制最小间隔为 1，防止出现 0.5 这种情况
      minInterval: 1,
      // 【新增】标签格式化，强制去掉小数点
      axisLabel: {
        formatter: (value) => value.toFixed(0)
      },
      max: (value) => {
        // 1. 先计算出带缓冲的最大值
        let val = value.max + 200;

        // 2. 【关键】向上取整到最近的 100 (例如 2563 -> 2600)
        // 这样能让刻度切分得更漂亮
        val = Math.ceil(val / 100) * 100;

        // 3. 设定硬性保底值
        const hardLimit = 2500;

        return Math.max(val, hardLimit);
      }
    },
    yAxis: {
      type: 'value',
      name: 'F1 (Hz)',
      nameLocation: 'middle',
      nameGap: 40,
      inverse: true,
      scale: true,
      min: 0,
      // 【新增】
      minInterval: 1,
      // 【新增】
      axisLabel: {
        formatter: (value) => value.toFixed(0)
      },
      max: (value) => {
        let val = value.max + 50;

        // 【关键】向上取整到最近的 50
        val = Math.ceil(val / 50) * 50;

        const hardLimit = 1000;

        return Math.max(val, hardLimit);
      }
    },
    series: series,
    grid: {
      left: '15%',
      right: '10%',
      bottom: '15%',
      top: '20%'  // More space for legend
    }
  }

  chart.setOption(option)

  // Handle resize
  resizeObserver = new ResizeObserver(() => {
    chart?.resize()
  })
  resizeObserver.observe(chartContainer.value)
}

// Watch for segment selection changes and display mode changes
watch([selectedSegments, showSegmented, showReferenceVowels, () => props.results], () => {
  if (showSegmented.value && segmentVowelData.value.length > 0) {
    nextTick(() => initChart())
  } else if (!showSegmented.value && allVowelSpaceData.value.length > 0) {
    nextTick(() => initChart())
  }
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    if (segmentVowelData.value.length > 0) {
      initChart()
    }
  })
})

onBeforeUnmount(() => {
  if (chart) {
    chart.dispose()
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})
</script>

<style scoped>
.vowel-space-panel {
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  width: 95%;
}

.panel-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin:1rem;
  color: var(--color-text-primary);
}

.usage-hint {
  max-width: 800px;
  padding: 0.75rem 1.25rem;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.15), rgba(255, 152, 0, 0.1));
  border-left: 4px solid #ffc107;
  border-radius: var(--radius-md, 8px);
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--color-text-primary, #2c3e50);
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.1);
  text-align: left;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--color-text-primary);
}

/* Control Buttons */
.control-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  width: 100%;
  flex-direction: row;
}

.control-btn {
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.control-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.control-btn.active {
  border-color: #007aff;
  background: rgba(0, 122, 255, 0.1);
}
.control-btn:disabled {
  cursor: not-allowed;
  pointer-events: none; /* 彻底防止点击事件 */
}

/* Switch Toggle Styles */
.vowel-switch-container {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}


.vowel-switch-container.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.switch-label-text {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.custom-switch {
  position: relative;
  width: 50px;
  height: 30px;
  background-color: #ccc;
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}

.custom-slider {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-slider:before {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 26px;
  height: 26px;
  background-color: white;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.custom-switch.open {
  background-color: #007aff;
}

.custom-switch.open .custom-slider:before {
  transform: translateX(20px);
}

.custom-switch:hover {
  box-shadow: 0 0 10px 4px rgba(0, 122, 255, 0.3);
}

.switch-text {
  font-size: 0.7rem;
  font-weight: 600;
  color: white;
  z-index: 1;
  pointer-events: none;
}

/* Reference Vowels Checkbox */
.reference-vowels-checkbox {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reference-vowels-checkbox:hover {
  transform: translateY(-2px);
}

.reference-vowels-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* Segment Selector Section */
.segment-selector-section {
  margin-bottom: 2rem;
}

.no-segments-message {
  padding: 1rem;
  text-align: center;
  color: var(--color-text-secondary);
  background: var(--glass-light);
  border-radius: var(--radius-md);
}

.segment-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.segment-checkbox {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.segment-checkbox:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(4px);
}

.segment-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.segment-color-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
}

.segment-label {
  flex: 1;
  font-size: 0.95rem;
  color: var(--color-text-primary);
}

.segment-type-badge {
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
}

.segment-type-badge.type-rime_core {
  background: rgba(52, 199, 89, 0.2);
  color: #34c759;
}

.segment-type-badge.type-syllable_like {
  background: rgba(0, 122, 255, 0.2);
  color: #007aff;
}

.segment-type-badge.type-voiced {
  background: rgba(255, 149, 0, 0.2);
  color: #ff9500;
}

/* Chart Section */
.chart-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
}

.chart-container {
  width: 80%;
  height: 500px;
  background: var(--glass-light);
  border-radius: var(--radius-lg);
  padding: 1rem;
}

/* Statistics Section */
.stats-section {
  margin-bottom: 2rem;
}

.no-selection-message {
  padding: 1rem;
  text-align: center;
  color: var(--color-text-secondary);
  background: var(--glass-light);
  border-radius: var(--radius-md);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.stat-card {
  padding: 1.5rem;
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.segment-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.stat-header .stat-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.stat-values {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-key {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

/* Description Section */
.description-section {
  padding: 1rem;
  background: var(--glass-light);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  justify-items: center;
}

.description-text {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin: 0;
}

@media (max-aspect-ratio: 1/1) {
  .chart-container {
    width: 96%;
    height: 400px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .usage-hint {
    font-size: 0.85rem;
    padding: 0.6rem 1rem;
    margin-bottom: 1rem;
  }

  /* Mobile optimizations for controls */
  .control-buttons {
    gap: 0.5rem;
    width: 100%;
  }

  .vowel-switch-container {
    padding: 0.5rem 1rem;
  }

  .reference-vowels-checkbox {
    padding: 0.5rem 1rem;
  }

  .switch-label-text,
  .segment-label {
    font-size: 0.8rem;
  }

  .switch-text {
    font-size: 0.6rem;
  }
}
</style>