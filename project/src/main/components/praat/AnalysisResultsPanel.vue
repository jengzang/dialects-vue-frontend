<template>
  <div v-if="results" class="analysis-results-panel main-glass-panel">
    <h2 class="panel-title">{{ t('praat.results.title') }}</h2>

    <!-- Summary Statistics -->
    <div class="summary-section">
      <h3 class="section-title">{{ t('praat.results.basicInfo.title') }}</h3>
      <div class="stats-grid">
        <div class="stat-card main-glass-panel-inner">
          <div class="stat-label">{{ t('praat.results.basicInfo.duration') }}</div>
          <div class="stat-value">{{ t('praat.results.basicInfo.durationValue', { duration: results.meta?.duration_s?.toFixed(2) }) }}</div>
        </div>
        <div class="stat-card main-glass-panel-inner">
          <div class="stat-label">{{ t('praat.results.basicInfo.sampleRate') }}</div>
          <div class="stat-value">{{ t('praat.results.basicInfo.sampleRateValue', { rate: results.meta?.sample_rate }) }}</div>
        </div>
        <div v-if="results.summary?.intensity" class="stat-card main-glass-panel-inner">
          <div class="stat-label">{{ t('praat.results.basicInfo.avgIntensity') }}</div>
          <div class="stat-value">{{ t('praat.results.basicInfo.avgIntensityValue', { intensity: results.summary.intensity.mean_db?.toFixed(1) }) }}</div>
        </div>
        <div v-if="results.summary?.intensity" class="stat-card main-glass-panel-inner">
          <div class="stat-label">{{ t('praat.results.basicInfo.intensityRange') }}</div>
          <div class="stat-value">
            {{ t('praat.results.basicInfo.intensityRangeValue', {
              min: results.summary.intensity.min_db?.toFixed(1),
              max: results.summary.intensity.max_db?.toFixed(1)
            }) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Tone Features (Single Mode) -->
    <div v-if="results.units?.[0]?.tone_features" class="summary-section">
      <h3 class="section-title">{{ t('praat.results.toneFeatures.title') }}</h3>
      <div class="stats-grid">
        <div class="stat-card main-glass-panel-inner">
          <div class="stat-label">{{ t('praat.results.toneFeatures.f0Start') }}</div>
          <div class="stat-value">{{ t('praat.results.toneFeatures.f0StartValue', { f0: results.units[0].tone_features.f0_start?.toFixed(1) }) }}</div>
        </div>
        <div class="stat-card main-glass-panel-inner">
          <div class="stat-label">{{ t('praat.results.toneFeatures.f0End') }}</div>
          <div class="stat-value">{{ t('praat.results.toneFeatures.f0EndValue', { f0: results.units[0].tone_features.f0_end?.toFixed(1) }) }}</div>
        </div>
        <div class="stat-card main-glass-panel-inner">
          <div class="stat-label">{{ t('praat.results.toneFeatures.f0Slope') }}</div>
          <div class="stat-value">{{ t('praat.results.toneFeatures.f0SlopeValue', { slope: results.units[0].tone_features.f0_slope?.toFixed(2) }) }}</div>
        </div>
        <div class="stat-card main-glass-panel-inner">
          <div class="stat-label">{{ t('praat.results.toneFeatures.contour5pt') }}</div>
          <div class="stat-value contour-display">
            {{ t('praat.results.toneFeatures.contour5ptValue', { contour: formatContour5pt(results.units[0].tone_features.contour_5pt) }) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Time Series Charts - Separated -->
    <div v-if="hasTimeSeriesData" class="charts-section">
      <!-- Pitch Chart with Segment Overlay -->
      <div v-if="hasPitchData" class="chart-section">
        <h3 class="section-title">{{ t('praat.results.charts.pitch.title') }}</h3>
        <div ref="pitchChartContainer" class="chart-container"></div>
      </div>

      <!-- Intensity Chart -->
      <div v-if="hasIntensityData" class="chart-section">
        <h3 class="section-title">{{ t('praat.results.charts.intensity.title') }}</h3>
        <div ref="intensityChartContainer" class="chart-container"></div>
      </div>

      <!-- Formant Trajectories Chart (F1-F5) -->
      <div v-if="hasFormantData" class="chart-section">
        <h3 class="section-title">{{ t('praat.results.charts.formant.title') }}</h3>
        <div ref="formantChartContainer" class="chart-container"></div>
      </div>
    </div>

    <!-- Spectrogram Chart -->
    <div v-if="hasSpectrogramData" class="chart-section">
      <h3 class="section-title">{{ t('praat.results.charts.spectrogram.title') }}</h3>

      <div v-if="!showSpectrogram" class="spectrogram-placeholder main-glass-panel-inner">
        <div class="placeholder-content">
          <span class="placeholder-icon">🌊</span>
          <p>{{ t('praat.results.charts.spectrogram.loadHint') }}</p>
          <button class="load-spectrogram-btn main-glass-button" @click="loadSpectrogram">
            {{ t('praat.results.charts.spectrogram.loadButton') }}
          </button>
        </div>
      </div>

      <div v-else ref="spectrogramChartContainer" class="chart-container spectrogram-chart"></div>
    </div>

    <!-- Voice Quality Section -->
    <div v-if="results.summary?.voice_quality" class="voice-quality-section">
      <h3 class="section-title">{{ t('praat.results.voiceQuality.title') }}</h3>
      <div class="quality-grid">
        <!-- HNR Gauge -->
        <div v-if="results.summary?.voice_quality.hnr" class="quality-card main-glass-panel-inner">
          <div class="quality-label">{{ t('praat.results.voiceQuality.hnr.label') }}</div>
          <div class="quality-value" :class="getHnrClass(results.summary?.voice_quality.hnr.mean_db)">
            {{ t('praat.results.voiceQuality.hnr.value', { hnr: results.summary?.voice_quality.hnr.mean_db?.toFixed(1) }) }}
          </div>
          <div class="quality-bar">
            <div class="quality-fill" :style="getHnrBarStyle(results.summary?.voice_quality.hnr.mean_db)"></div>
          </div>
          <div class="quality-status">{{ getHnrStatus(results.summary?.voice_quality.hnr.mean_db) }}</div>
        </div>

        <!-- Jitter -->
        <div v-if="results.summary?.voice_quality.jitter" class="quality-card main-glass-panel-inner">
          <div class="quality-label">{{ t('praat.results.voiceQuality.jitter.label') }}</div>
          <div class="quality-value"
               :class="getJitterClass(results.summary?.voice_quality.jitter.local)">
            {{ t('praat.results.voiceQuality.jitter.value', { jitter: (results.summary?.voice_quality.jitter.local * 100)?.toFixed(2) }) }}
          </div>
          <div class="quality-bar">
            <div class="quality-fill" :style="getJitterBarStyle(results.summary?.voice_quality.jitter.local)"></div>
          </div>
          <div class="quality-status">{{
              getJitterStatus(results.summary?.voice_quality.jitter.local) }}</div>
        </div>

        <!-- Shimmer -->
        <div v-if="results.summary?.voice_quality.shimmer" class="quality-card main-glass-panel-inner">
          <div class="quality-label">{{ t('praat.results.voiceQuality.shimmer.label') }}</div>
          <div class="quality-value"
               :class="getShimmerClass(results.summary?.voice_quality.shimmer.local)">
            {{ t('praat.results.voiceQuality.shimmer.value', { shimmer: (results.summary?.voice_quality.shimmer.local * 100)?.toFixed(2) }) }}
          </div>
          <div class="quality-bar">
            <div class="quality-fill" :style="getShimmerBarStyle(results.summary?.voice_quality.shimmer.local)"></div>
          </div>
          <div class="quality-status">{{
              getShimmerStatus(results.summary?.voice_quality.shimmer.local) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, watch, onMounted, onBeforeUnmount, computed, nextTick} from 'vue'
import * as echarts from 'echarts'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  results: {
    type: Object,
    default: null
  }
})
const { t } = useI18n()

const pitchChartContainer = ref(null)
const intensityChartContainer = ref(null)
const formantChartContainer = ref(null)
const spectrogramChartContainer = ref(null)
const showSpectrogram = ref(false)

let pitchChart = null
let intensityChart = null
let formantChart = null
let spectrogramChart = null
const chartResizeObservers = []

const clearChartResizeObservers = () => {
  while (chartResizeObservers.length > 0) {
    chartResizeObservers.pop().disconnect()
  }
}

const observeChartResize = (container, chart) => {
  if (!container || !chart) return

  const resizeObserver = new ResizeObserver(() => {
    chart.resize()
  })

  resizeObserver.observe(container)
  chartResizeObservers.push(resizeObserver)
}

const disposeTimeSeriesCharts = () => {
  if (pitchChart) {
    pitchChart.dispose()
    pitchChart = null
  }
  if (intensityChart) {
    intensityChart.dispose()
    intensityChart = null
  }
  if (formantChart) {
    formantChart.dispose()
    formantChart = null
  }
}

const hasTimeSeriesData = computed(() => {
  const ts = props.results?.timeseries
  return (ts?.pitch_hz && ts.pitch_hz.length > 0) ||
         (ts?.intensity_db && ts.intensity_db.length > 0) ||
         (ts?.formants && Object.keys(ts.formants).length > 0)
})

const hasPitchData = computed(() => {
  const ts = props.results?.timeseries
  return ts?.pitch_hz && ts.pitch_hz.length > 0
})

const hasIntensityData = computed(() => {
  const ts = props.results?.timeseries
  return ts?.intensity_db && ts.intensity_db.length > 0
})

const hasFormantData = computed(() => {
  const ts = props.results?.timeseries
  return ts?.formants && Object.keys(ts.formants).length > 0
})

const hasSpectrogramData = computed(() => {
  return props.results?.spectrogram &&
         props.results.spectrogram.time &&
         props.results.spectrogram.time.length > 0
})

const hasSegmentData = computed(() => {
  return props.results?.segments && props.results.segments.length > 0
})

const loadSpectrogram = async () => {
  showSpectrogram.value = true
  // 等待 DOM 更新，確保 spectrogramChartContainer 已經被渲染出來
  await nextTick()
  initSpectrogramChart()
}

// Format contour_5pt array for display
const formatContour5pt = (contour) => {
  if (!contour || !Array.isArray(contour)) return t('praat.common.notAvailable')
  return contour.map(v => v.toFixed(2)).join(' → ')
}

// Initialize Pitch Chart with Segment Overlay
const initPitchChart = () => {
  if (!pitchChartContainer.value || !hasPitchData.value) return

  pitchChart = echarts.init(pitchChartContainer.value)
  const ts = props.results.timeseries

  const pitchData = ts.pitch_hz
    .map((value, idx) => [ts.time?.[idx] || idx * 0.01, value])
    .filter(([t, v]) => v !== null && v > 0)

  // Prepare segment markArea
  const segments = props.results.segments || []
  const markAreaData = segments.map(seg => [
    {
      xAxis: seg.start_s,
      itemStyle: {
        color: seg.type === 'rime_core' ? 'rgba(var(--color-gold-rgb), 0.2)' :
               seg.type === 'silence' ? 'rgba(var(--color-silver-rgb), 0.1)' :
               'rgba(100,150,255,0.15)'
      }
    },
    { xAxis: seg.end_s }
  ])

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    xAxis: {
      type: 'value',
      name: t('praat.results.charts.pitch.xAxis'),
      nameLocation: 'middle',
      nameGap: 30
    },
    yAxis: {
      type: 'value',
      name: t('praat.results.charts.pitch.yAxis'),
      axisLine: { lineStyle: { color: 'var(--color-primary)' } }
    },
    series: [{
      name: t('praat.results.charts.pitch.seriesName'),
      type: 'line',
      data: pitchData,
      smooth: true,
      lineStyle: { color: 'var(--color-primary)', width: 2 },
      showSymbol: false,
      markArea: markAreaData.length > 0 ? { data: markAreaData } : undefined
    }],
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%',
      top: '10%'
    },
    dataZoom: [
      { type: 'inside', xAxisIndex: 0 },
      { type: 'slider', xAxisIndex: 0, bottom: 10 }
    ]
  }

  pitchChart.setOption(option)
  observeChartResize(pitchChartContainer.value, pitchChart)
}

// Initialize Intensity Chart
const initIntensityChart = () => {
  if (!intensityChartContainer.value || !hasIntensityData.value) return

  intensityChart = echarts.init(intensityChartContainer.value)
  const ts = props.results.timeseries

  const intensityData = ts.intensity_db
    .map((value, idx) => [ts.time?.[idx] || idx * 0.01, value])
    .filter(([t, v]) => v > 0)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    xAxis: {
      type: 'value',
      name: t('praat.results.charts.intensity.xAxis'),
      nameLocation: 'middle',
      nameGap: 30
    },
    yAxis: {
      type: 'value',
      name: t('praat.results.charts.intensity.yAxis'),
      axisLine: { lineStyle: { color: 'var(--color-error-light)' } }
    },
    series: [{
      name: t('praat.results.charts.intensity.seriesName'),
      type: 'line',
      data: intensityData,
      smooth: true,
      lineStyle: { color: 'var(--color-error-light)', width: 2 },
      showSymbol: false
    }],
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%',
      top: '10%'
    },
    dataZoom: [
      { type: 'inside', xAxisIndex: 0 },
      { type: 'slider', xAxisIndex: 0, bottom: 10 }
    ]
  }

  intensityChart.setOption(option)
  observeChartResize(intensityChartContainer.value, intensityChart)
}

// Initialize Formant Chart (F1-F5)
const initFormantChart = () => {
  if (!formantChartContainer.value || !hasFormantData.value) return

  formantChart = echarts.init(formantChartContainer.value)
  const ts = props.results.timeseries

  const formantColors = ['var(--color-success)', 'var(--color-warning)', 'var(--color-purple)', '#ff2d55', 'var(--color-cyan)']
  const formantKeys = ['f1', 'f2', 'f3', 'f4', 'f5']

  const formantSeries = formantKeys.map((key, i) => {
    if (!ts.formants[key]) return null

    return {
      name: key.toUpperCase(),
      type: 'line',
      data: ts.formants[key]
        .map((v, idx) => [ts.time?.[idx] || idx * 0.01, v])
        .filter(([t, v]) => v !== null && v > 0),
      smooth: true,
      lineStyle: {
        color: formantColors[i],
        width: 2
      },
      showSymbol: false
    }
  }).filter(s => s !== null)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: formantSeries.map(s => s.name),
      top: 10
    },
    xAxis: {
      type: 'value',
      name: t('praat.results.charts.formant.xAxis'),
      nameLocation: 'middle',
      nameGap: 30
    },
    yAxis: {
      type: 'value',
      name: t('praat.results.charts.formant.yAxis'),
      scale: true, // 允许 Y 轴不从 0 开始（虽然共振峰通常较高，这个加上比较保险）
      // 【重点修改】动态计算最大值
      max: (value) => {
        // value.max 是当前数据的最大值
        // 乘以 1.1 (增加10%) 或者加一个固定值，给顶部留出空间
        // Math.ceil 取整让刻度好看一点
        return Math.ceil(value.max * 1.1)
      }
    },
    series: formantSeries,
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%',
      top: '15%'
    },
    dataZoom: [
      { type: 'inside', xAxisIndex: 0 },
      { type: 'slider', xAxisIndex: 0, bottom: 10 }
    ]
  }

  formantChart.setOption(option)
  observeChartResize(formantChartContainer.value, formantChart)
}

// Initialize Spectrogram Chart
const initSpectrogramChart = () => {
  if (!spectrogramChartContainer.value || !hasSpectrogramData.value) return

  spectrogramChart = echarts.init(spectrogramChartContainer.value)

  const { time, frequency, energy_db } = props.results.spectrogram

  // Prepare heatmap data: [timeIndex, frequencyIndex, energy]
  const heatmapData = []
  for (let i = 0; i < time.length; i++) {
    for (let j = 0; j < frequency.length; j++) {
      heatmapData.push([i, j, energy_db[i][j]])
    }
  }

  // Get energy range from summary or calculate
  const summary = props.results.summary?.spectrogram
  const minEnergy = summary?.min_db ?? -100
  const maxEnergy = summary?.max_db ?? -20

  const option = {
    tooltip: {
      formatter: (params) => {
        const t = time[params.data[0]].toFixed(3)
        const f = frequency[params.data[1]].toFixed(0)
        const e = params.data[2].toFixed(1)
        return t('praat.results.charts.spectrogram.tooltip', {
          time: t,
          freq: f,
          energy: e
        })
      }
    },
    grid: {
      left: '10%',
      right: '15%',
      top: '10%',
      bottom: '15%'
    },
    xAxis: {
      type: 'category',
      data: time.map((_, i) => i),
      name: t('praat.results.charts.spectrogram.xAxis'),
      nameLocation: 'middle',
      nameGap: 30,
      axisLabel: {
        formatter: (value) => time[value]?.toFixed(2) || ''
      }
    },
    yAxis: {
      type: 'category',
      data: frequency.map((_, i) => i),
      name: t('praat.results.charts.spectrogram.yAxis'),
      nameLocation: 'middle',
      nameGap: 50,
      axisLabel: {
        formatter: (value) => frequency[value]?.toFixed(0) || ''
      }
    },
    visualMap: {
      min: minEnergy,
      max: maxEnergy,
      calculable: true,
      orient: 'vertical',
      right: '0',
      top: 'center',
      text: [
        t('praat.results.charts.spectrogram.visualMap.high'),
        t('praat.results.charts.spectrogram.visualMap.low')
      ],
      inRange: {
        color: [
          '#313695', '#4575b4', '#74add1', '#abd9e9',
          '#e0f3f8', '#ffffbf', '#fee090', '#fdae61',
          '#f46d43', '#d73027', '#a50026'
        ]
      }
    },
    series: [{
      type: 'heatmap',
      data: heatmapData,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }

  // Add overlay layers if data is available
  addSpectrogramOverlays(option)

  spectrogramChart.setOption(option)
}

// Add overlay layers to spectrogram
const addSpectrogramOverlays = (option) => {
  const { time, frequency } = props.results.spectrogram
  const overlays = []

  // Helper function to find nearest index
  const findNearestIndex = (arr, value) => {
    let minDiff = Infinity
    let index = 0
    for (let i = 0; i < arr.length; i++) {
      const diff = Math.abs(arr[i] - value)
      if (diff < minDiff) {
        minDiff = diff
        index = i
      }
    }
    return index
  }

  // Add formant trajectories (F1, F2, F3)
  if (hasFormantData.value) {
    const ts = props.results.timeseries
    const formantColors = ['#ff4444', '#44ff44', '#4444ff']
    const formantNames = ['F1', 'F2', 'F3']
    const formantKeys = ['f1', 'f2', 'f3']

    for (let i = 0; i < 3; i++) {  // Only show F1, F2, F3
      const formantKey = formantKeys[i]
      if (!ts.formants[formantKey]) continue

      const formantData = ts.formants[formantKey]
        .map((freq, idx) => {
          if (freq === null || freq === undefined) return null
          const t = ts.time?.[idx] || idx * 0.01
          const timeIndex = findNearestIndex(time, t)
          const freqIndex = findNearestIndex(frequency, freq)
          return [timeIndex, freqIndex]
        })
        .filter(point => point !== null)

      if (formantData.length > 0) {
        overlays.push({
          type: 'line',
          name: formantNames[i],
          data: formantData,
          symbol: 'none',
          lineStyle: {
            color: formantColors[i],
            width: 2
          },
          z: 10  // Ensure overlays are on top
        })
      }
    }
  }

  // Add pitch curve (F0)
  if (hasPitchData.value) {
    const ts = props.results.timeseries
    const pitchData = ts.pitch_hz
      .map((freq, idx) => {
        if (freq === null || freq === undefined || freq <= 0) return null
        const t = ts.time?.[idx] || idx * 0.01
        const timeIndex = findNearestIndex(time, t)
        const freqIndex = findNearestIndex(frequency, freq)
        return [timeIndex, freqIndex]
      })
      .filter(point => point !== null)

    if (pitchData.length > 0) {
      overlays.push({
        type: 'line',
        name: t('praat.results.charts.pitch.overlaySeriesName'),
        data: pitchData,
        symbol: 'none',
        lineStyle: {
          color: '#ffffff',
          width: 3,
          type: 'solid'
        },
        z: 11  // On top of formants
      })
    }
  }

  // Add segment markers
  if (hasSegmentData.value) {
    const segments = props.results.segments
    const markAreas = segments.map(seg => {
      const startIndex = findNearestIndex(time, seg.start_s)
      const endIndex = findNearestIndex(time, seg.end_s)
      return {
        xAxis: startIndex,
        xAxisEnd: endIndex,
        itemStyle: {
          color: 'var(--glass-10)',
          borderColor: '#ffffff',
          borderWidth: 1,
          borderType: 'dashed'
        }
      }
    })

    option.series[0].markArea = {
      data: markAreas.map(area => [
        { xAxis: area.xAxis, yAxis: 0 },
        { xAxis: area.xAxisEnd, yAxis: frequency.length - 1 }
      ]),
      itemStyle: markAreas[0]?.itemStyle
    }
  }

  // Add overlay series to option
  if (overlays.length > 0) {
    option.series.push(...overlays)
    option.legend = {
      data: overlays.map(s => s.name),
      top: 'bottom',
      textStyle: {
        color: 'var(--text-dark)'
      }
    }
  }
}

const renderTimeSeriesCharts = () => {
  clearChartResizeObservers()
  disposeTimeSeriesCharts()

  if (!props.results || !hasTimeSeriesData.value) return

  if (hasPitchData.value) initPitchChart()
  if (hasIntensityData.value) initIntensityChart()
  if (hasFormantData.value) initFormantChart()
}

// Voice Quality Helper Functions
const getHnrClass = (hnr) => hnr >= 15 ? 'quality-good' : hnr >= 10 ? 'quality-fair' : 'quality-poor'
const getHnrBarStyle = (hnr) => ({
  width: `${Math.min((hnr / 20) * 100, 100)}%`,
  backgroundColor: hnr >= 15 ? 'var(--color-success)' : hnr >= 10 ? 'var(--color-warning)' : 'var(--color-error-light)'
})
const getHnrStatus = (hnr) => hnr >= 15
  ? t('praat.results.voiceQuality.hnr.status.good')
  : hnr >= 10
    ? t('praat.results.voiceQuality.hnr.status.fair')
    : t('praat.results.voiceQuality.hnr.status.poor')

const getJitterClass = (j) => j < 0.01 ? 'quality-good' : j < 0.02 ? 'quality-fair' : 'quality-poor'
const getJitterBarStyle = (j) => ({
  width: `${Math.min((j / 0.05) * 100, 100)}%`,
  backgroundColor: j < 0.01 ? 'var(--color-success)' : j < 0.02 ? 'var(--color-warning)' : 'var(--color-error-light)'
})
const getJitterStatus = (j) => j < 0.01
  ? t('praat.results.voiceQuality.jitter.status.good')
  : j < 0.02
    ? t('praat.results.voiceQuality.jitter.status.fair')
    : t('praat.results.voiceQuality.jitter.status.poor')

const getShimmerClass = (s) => s < 0.03 ? 'quality-good' : s < 0.06 ? 'quality-fair' : 'quality-poor'
const getShimmerBarStyle = (s) => ({
  width: `${Math.min((s / 0.1) * 100, 100)}%`,
  backgroundColor: s < 0.03 ? 'var(--color-success)' : s < 0.06 ? 'var(--color-warning)' : 'var(--color-error-light)'
})
const getShimmerStatus = (s) => s < 0.03
  ? t('praat.results.voiceQuality.shimmer.status.good')
  : s < 0.06
    ? t('praat.results.voiceQuality.shimmer.status.fair')
    : t('praat.results.voiceQuality.shimmer.status.poor')

watch(() => props.results, () => {
  setTimeout(() => {
    renderTimeSeriesCharts()
    // if (showSpectrogram.value && hasSpectrogramData.value) initSpectrogramChart()
  }, 100)
}, { deep: true })

onMounted(() => {
  renderTimeSeriesCharts()
  if (props.results && hasSpectrogramData.value) {
    initSpectrogramChart()
  }
})

onBeforeUnmount(() => {
  clearChartResizeObservers()
  disposeTimeSeriesCharts()
  if (pitchChart) pitchChart.dispose()
  if (intensityChart) intensityChart.dispose()
  if (formantChart) formantChart.dispose()
  if (spectrogramChart) spectrogramChart.dispose()
})
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$primary-blue: var(--color-primary);
$quality-good: var(--color-success);
$quality-fair: var(--color-warning);
$quality-poor: var(--color-error-light);

$text-primary: var(--color-text-primary);
$text-secondary: var(--color-text-secondary);

$chart-width: 80%;
$chart-height: 400px;
$card-padding: 1.5rem;
$section-spacing: 2rem;

$border-light: rgba(0, 0, 0, 0.1);
$blue-shadow: rgba(var(--color-primary-rgb), 0.2);
$blue-shadow-hover: rgba(var(--color-primary-rgb), 0.3);

$transition-normal: 0.3s;

.analysis-results-panel {
  width: 95%;
  margin-bottom: 1.5rem;
  padding: 1rem;
}

.panel-title {
  margin-bottom: 1.5rem;
  color: $text-primary;
  font-size: 1.5rem;
  font-weight: 600;
}

.summary-section {
  margin-bottom: $section-spacing;
}

.section-title {
  margin-bottom: 1rem;
  color: $text-primary;
  font-size: 1.2rem;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  padding: $card-padding;
  text-align: center;
}

/*
 * 保留在基础图表规则之前。
 * 原样式中 spectrogram-chart 的 400px 会被后面的 500px 覆盖，
 * 当前整理不擅自改变这个实际效果。
 */
@media (max-aspect-ratio: 1/1) {
  .stat-card {
    padding: 0.8rem;
  }

  .chart-container {
    width: 96% !important;
    padding: 0.5rem !important;
  }

  .spectrogram-chart {
    height: 400px;
    min-height: 400px;
  }
}

.stat-label {
  margin-bottom: 0.5rem;
  color: $text-secondary;
  font-size: 0.9rem;
}

.stat-value {
  color: $text-primary;
  font-size: 1.5rem;
  font-weight: 600;

  &.contour-display {
    color: $primary-blue;
    font-family: "Courier New", monospace;
    font-size: 1.1rem;
    letter-spacing: 0.05em;
  }
}

.charts-section {
  @include flex-col;
  gap: $section-spacing;
}

.chart-section {
  @include flex-col;
  align-items: center;
  margin-top: $section-spacing;
}

.chart-container {
  width: $chart-width;
  height: $chart-height;
  padding: 1rem;
  background: var(--glass-30);
  border-radius: var(--radius-lg);
}

.spectrogram-chart {
  height: 500px;
  min-height: 500px;
}

.voice-quality-section {
  margin-top: $section-spacing;
}

.quality-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.quality-card {
  @include flex-col;
  gap: 0.75rem;
  padding: $card-padding;
  text-align: center;
}

.quality-label {
  color: $text-secondary;
  font-size: 0.95rem;
  font-weight: 500;
}

.quality-value {
  font-size: 1.8rem;
  font-weight: 700;
  transition: color $transition-normal ease;

  &.quality-good {
    color: $quality-good;
  }

  &.quality-fair {
    color: $quality-fair;
  }

  &.quality-poor {
    color: $quality-poor;
  }
}

.quality-bar {
  width: 100%;
  height: 8px;
  overflow: hidden;
  background: $border-light;
  border-radius: var(--radius-xs);

  .quality-fill {
    height: 100%;
    border-radius: var(--radius-xs);
    transition:
      width 0.5s ease,
      background-color $transition-normal ease;
  }
}

.quality-status {
  color: $text-secondary;
  font-size: 0.85rem;
  font-weight: 600;
}

/* 频谱图占位区域 */
.spectrogram-placeholder {
  @include flex-center;
  width: $chart-width;
  height: 300px;
  background: var(--glass-30);
  border: 1px dashed $border-light;
  border-radius: var(--radius-lg);
}

.placeholder-content {
  @include flex-col;
  align-items: center;
  gap: 1rem;
  text-align: center;

  .placeholder-icon {
    opacity: 0.7;
    font-size: 3rem;
  }
}

.load-spectrogram-btn {
  padding: 0.8rem 1.5rem;
  background: var(--color-primary);
  border: none;
  border-radius: var(--radius-2xl);
  box-shadow: 0 4px 12px $blue-shadow;
  color: var(--text-white);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    opacity $transition-normal ease,
    box-shadow $transition-normal ease,
    transform $transition-normal ease;

  &:hover {
    opacity: 0.9;
    box-shadow: 0 6px 16px $blue-shadow-hover;
    transform: translateY(-2px);
  }
}
</style>
