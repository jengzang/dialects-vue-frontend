<template>
  <div class="vowel-space-panel main-glass-panel">
    <div style="display: flex;align-items: center;flex-direction: column;justify-content: center;">
      <h2 class="panel-title">{{ t('praat.vowelSpace.title') }}</h2>

      <!-- Usage Hint -->
      <div class="usage-hint">
        💡 {{ t('praat.vowelSpace.usageHint') }}
      </div>

      <!-- Control Buttons -->
      <div class="control-buttons">
        <!-- Display Mode Switch Toggle -->
        <div
          class="vowel-switch-container"
          :class="{ disabled: vowelSegments.length === 0 }"
          :title="vowelSegments.length === 0 ? t('praat.vowelSpace.controls.segmentedDisabled') : ''"
        >
          <SwitchToggle
            :model-value="showSegmented"
            :disabled="vowelSegments.length === 0"
            :width="50"
            :height="30"
            :thumb-size="26"
            color="blue"
            variant="solid"
            show-label
            :active-text="t('praat.vowelSpace.controls.segmentedDisplay')"
            :inactive-text="t('praat.vowelSpace.controls.segmentedDisplay')"
            label-position="left"
            :gap="1.6"
            :aria-label="t('praat.vowelSpace.controls.segmentedDisplay')"
            @update:modelValue="showSegmented = $event"
          />
        </div>

        <!-- Reference Vowels Checkbox -->
        <CheckBox
          :model-value="showReferenceVowels"
          :label="t('praat.vowelSpace.controls.showReferenceVowels')"
          class="reference-vowels-checkbox"
          @update:modelValue="showReferenceVowels = $event"
        />
      </div>
    </div>

    <!-- Segment Selector Section (only show when segmented mode is on) -->
    <div v-if="showSegmented" class="segment-selector-section">
      <h3 class="section-title">{{ t('praat.vowelSpace.segments.title') }}</h3>

      <div v-if="vowelSegments.length === 0" class="no-segments-message">
        {{ t('praat.vowelSpace.segments.noSegments') }}
      </div>

      <div v-else class="segment-list">
        <!-- Select All Checkbox -->
        <CheckBox
          :model-value="showAll"
          :label="t('praat.vowelSpace.segments.selectAll')"
          class="segment-checkbox main-glass-panel-inner"
          @update:modelValue="toggleAll"
        />

        <!-- Individual Segment Checkboxes -->
        <div
          v-for="seg in vowelSegments"
          :key="seg.id"
          class="segment-checkbox main-glass-panel-inner"
        >
          <CheckBox
            :model-value="selectedSegments.has(seg.id)"
            @update:modelValue="toggleSegment(seg.id)"
          >
            <span class="segment-color-indicator" :style="{ backgroundColor: getSegmentColor(seg.id) }"></span>
            <span class="segment-label">
              {{ seg.label }} ({{ seg.timeRange }})
            </span>
            <span class="segment-type-badge" :class="`type-${seg.type}`">
              {{ getSegmentTypeLabel(seg.type) }}
            </span>
          </CheckBox>
        </div>
      </div>
    </div>

    <!-- Vowel Space Chart -->
    <div class="chart-section">
      <div ref="chartContainer" class="chart-container"></div>
    </div>

    <!-- Statistics Section (only show when segmented mode is on) -->
    <div v-if="showSegmented" class="stats-section">
      <h3 class="section-title">{{ t('praat.vowelSpace.stats.title') }}</h3>

      <div v-if="selectedSegments.size === 0" class="no-selection-message">
        {{ t('praat.vowelSpace.stats.noSelection') }}
      </div>

      <div v-else class="stats-grid">
        <div
          v-for="data in segmentVowelData.filter(d => selectedSegments.has(d.segment.id))"
          :key="data.segment.id"
          class="stat-card main-glass-panel-inner"
        >
          <div class="stat-header">
            <span class="segment-color-dot" :style="{ backgroundColor: getSegmentColor(data.segment.id) }"></span>
            <span class="stat-label">{{ data.segment.label }}</span>
          </div>
          <div class="stat-values">
            <div class="stat-item">
              <span class="stat-key">{{ t('praat.vowelSpace.stats.f1Mean') }}</span>
              <span class="stat-value">{{ t('praat.vowelSpace.stats.f1MeanValue', { f1: data.stats.f1Mean.toFixed(0) }) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-key">{{ t('praat.vowelSpace.stats.f2Mean') }}</span>
              <span class="stat-value">{{ t('praat.vowelSpace.stats.f2MeanValue', { f2: data.stats.f2Mean.toFixed(0) }) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-key">{{ t('praat.vowelSpace.stats.dataPoints') }}</span>
              <span class="stat-value">{{ t('praat.vowelSpace.stats.dataPointsValue', { count: data.stats.count }) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Description -->
    <div class="description-section">
      <p class="description-text">
        {{ t('praat.vowelSpace.description.intro') }}
        <span v-if="showSegmented">{{ t('praat.vowelSpace.description.segmented') }}</span>
        <span v-if="showReferenceVowels">{{ t('praat.vowelSpace.description.reference') }}</span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useI18n } from 'vue-i18n'
import referenceVowelsData from '@/assets/data/vowels.json'
import SwitchToggle from '@/components/common/SwitchToggle.vue'
import CheckBox from '@/components/selector/CheckBox.vue'

const props = defineProps({
  results: {
    type: Object,
    default: null
  }
})
const { t } = useI18n()

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

const getSegmentTypeLabel = (type) => {
  const labels = {
    rime_core: t('praat.vowelSpace.segments.segmentTypes.rimeCore'),
    syllable_like: t('praat.vowelSpace.segments.segmentTypes.syllableLike'),
    voiced: t('praat.vowelSpace.segments.segmentTypes.voiced')
  }
  return labels[type] || type
}

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
      label: t('praat.vowelSpace.segments.segment', {
        index: idx + 1,
        type: getSegmentTypeLabel(seg.type)
      }),
      timeRange: t('praat.vowelSpace.segments.timeRange', {
        start: seg.start_s.toFixed(2),
        end: seg.end_s.toFixed(2)
      })
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
      name: t('praat.vowelSpace.chart.allDataPoints'),
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
      name: t('praat.vowelSpace.chart.referenceVowels'),
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
      text: showSegmented.value
        ? t('praat.vowelSpace.chart.titleSegmented')
        : t('praat.vowelSpace.chart.titleAll'),
      left: 'center',
      top: 10
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (params.seriesName === t('praat.vowelSpace.chart.referenceVowels')) {
          const vowel = referenceVowelsData[params.dataIndex]
          return t('praat.vowelSpace.chart.tooltipReference', {
            symbol: vowel.symbol,
            f1: vowel.F1,
            f2: vowel.F2
          })
        }
        const [f2, f1, time] = params.value
        if (time !== undefined) {
          return t('praat.vowelSpace.chart.tooltip', {
            name: params.seriesName,
            f1: f1.toFixed(0),
            f2: f2.toFixed(0),
            time: time.toFixed(2)
          })
        }
        return t('praat.vowelSpace.chart.tooltipNoTime', {
          name: params.seriesName,
          f1: f1.toFixed(0),
          f2: f2.toFixed(0)
        })
      }
    },
    legend: {
      data: series.map(s => s.name),
      top: 40,
      type: 'scroll'
    },
    xAxis: {
      type: 'value',
      name: t('praat.vowelSpace.chart.xAxis'),
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
      name: t('praat.vowelSpace.chart.yAxis'),
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


$primary: var(--color-primary);
$success: #34c759;
$warning: #ff9500;

$text-primary: var(--color-text-primary);
$text-secondary: var(--color-text-secondary, #666);

$primary-background: rgba(0, 122, 255, 0.2);
$success-background: rgba(52, 199, 89, 0.2);
$warning-background: rgba(255, 149, 0, 0.2);

$surface-hover: rgba(255, 255, 255, 0.15);
$divider-light: rgba(255, 255, 255, 0.2);

$transition-duration: 0.3s;

@mixin empty-message {
  padding: 1rem;
  background: var(--glass-light);
  border-radius: var(--radius-md);
  color: $text-secondary;
  text-align: center;
}

.vowel-space-panel {
  width: 95%;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
}

.panel-title {
  margin: 1rem;
  color: var(--color-text-primary);
  font-size: 1.5rem;
  font-weight: 600;
}

.usage-hint {
  max-width: 800px;
  margin-bottom: 1.5rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(
    135deg,
    rgba(255, 193, 7, 0.15),
    rgba(255, 152, 0, 0.1)
  );
  border-left: 4px solid #ffc107;
  border-radius: var(--radius-md, 8px);
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.1);
  color: $text-primary;
  text-align: left;
  font-size: 0.9rem;
  line-height: 1.6;
}

.section-title {
  margin-bottom: 1rem;
  color: var(--color-text-primary);
  font-size: 1.1rem;
  font-weight: 600;
}

/* 显示控制 */
.control-buttons {
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  width: 100%;
  margin-bottom: 2rem;
}

.vowel-switch-container {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  padding: 0.75rem 1.5rem;
  transition: opacity $transition-duration ease;

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
}

.reference-vowels-checkbox {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: transform $transition-duration ease;

  &:hover {
    transform: translateY(-2px);
  }
}

/* 音段选择 */
.segment-selector-section {
  margin-bottom: 2rem;
}

.no-segments-message,
.no-selection-message {
  @include empty-message;
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
  transition:
    background $transition-duration ease,
    transform $transition-duration ease;

  &:hover {
    background: $surface-hover;
    transform: translateX(4px);
  }
}

.segment-color-indicator {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.segment-label {
  flex: 1;
  color: var(--color-text-primary);
  font-size: 0.95rem;
}

.segment-type-badge {
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  text-transform: uppercase;
  font-size: 0.8rem;
  font-weight: 500;

  &.type-rime_core {
    background: $success-background;
    color: $success;
  }

  &.type-syllable_like {
    background: $primary-background;
    color: $primary;
  }

  &.type-voiced {
    background: $warning-background;
    color: $warning;
  }
}

/* 元音空间图 */
.chart-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
}

.chart-container {
  width: 80%;
  height: 500px;
  padding: 1rem;
  background: var(--glass-light);
  border-radius: var(--radius-lg);
}

/* 统计信息 */
.stats-section {
  margin-bottom: 2rem;
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
  border-bottom: 1px solid $divider-light;

  .segment-color-dot {
    flex-shrink: 0;
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  .stat-label {
    color: var(--color-text-primary);
    font-size: 0.95rem;
    font-weight: 600;
  }
}

.stat-values {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .stat-key {
    color: var(--color-text-secondary);
    font-size: 0.85rem;
  }

  .stat-value {
    color: var(--color-text-primary);
    font-size: 1rem;
    font-weight: 600;
  }
}

/* 描述区域 */
.description-section {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: var(--glass-light);
  border-radius: var(--radius-md);
}

.description-text {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  line-height: 1.6;
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
    margin-bottom: 1rem;
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
  }

  .control-buttons {
    gap: 0.5rem;
    width: 100%;
  }

  .vowel-switch-container,
  .reference-vowels-checkbox {
    padding: 0.5rem 1rem;
  }

  .segment-label {
    font-size: 0.8rem;
  }
}

