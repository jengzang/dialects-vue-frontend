<template>
  <div class="pitch-tone-panel main-glass-panel">
    <h2 class="panel-title" style="margin:0">{{ t('praat.pitchTone.title') }}</h2>

    <!-- Step 1: Select and Label -->
    <div v-if="hasPitchData" class="step-section">
      <div class="step-header">
        <span class="step-number">1</span>
        <div class="step-info">
          <h3 class="step-title">{{ t('praat.pitchTone.step1.title') }}</h3>
          <span class="step-hint">{{ t('praat.pitchTone.step1.hint') }}</span>
        </div>
      </div>

      <div ref="pitchChartContainer" class="chart-container"></div>

      <div class="controls-section main-glass-panel-inner">
        <div class="input-group">
          <div class="selection-info">
            <span v-if="currentSelection.length > 0" class="status-active">
              ✅ {{ t('praat.pitchTone.step1.controls.selectionStatus.active', { count: currentSelection.length }) }}
            </span>
            <span v-else class="status-idle">{{ t('praat.pitchTone.step1.controls.selectionStatus.idle') }}</span>
          </div>

          <input
              v-model="toneNameInput"
              type="text"
              :placeholder="t('praat.pitchTone.step1.controls.toneNameInput')"
              class="tone-input"
              @keyup.enter="saveTone"
          />
          <button
              class="action-btn add-btn"
              :disabled="currentSelection.length === 0 || !toneNameInput"
              @click="saveTone"
            >➕ {{ t('praat.pitchTone.step1.controls.addButton') }}</button>

          <div class="persistence-hint">
            💡 {{ t('praat.pitchTone.step1.controls.persistenceHint') }}
          </div>
        </div>

        <div class="saved-list-container">
          <div class="list-header">
            <span>{{ t('praat.pitchTone.step1.savedList.title', { count: savedTones.length }) }}</span>
            <button v-if="savedTones.length > 0" @click="clearAll" class="text-btn danger">{{ t('praat.pitchTone.step1.savedList.clearAll') }}</button>
          </div>

          <div class="tags-wrapper">
            <div v-for="(tone, index) in savedTones" :key="index" class="tone-tag" @click="openPreview(index)">
              <span class="tag-name">{{ tone.name }}</span>
              <span class="tag-count">{{ t('praat.pitchTone.step1.savedList.tagCount', { count: getToneSegmentCount(tone) }) }}</span>
              <button @click.stop="removeTone(index)" class="close-tag">×</button>
            </div>
            <div v-if="savedTones.length === 0" class="empty-hint">{{ t('praat.pitchTone.step1.savedList.empty') }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="no-data-message">
      <div class="no-data-icon">📊</div>
      <p>{{ t('praat.pitchTone.noData.text') }}</p>
    </div>

    <!-- Step 2: Analyze -->
    <div v-if="hasPitchData && savedTones.length > 0" class="step-section">
      <div class="step-header">
        <span class="step-number">2</span>
        <div class="step-info">
          <h3 class="step-title">{{ t('praat.pitchTone.step2.title') }}</h3>
          <span class="step-hint">{{ t('praat.pitchTone.step2.hint') }}</span>
        </div>
      </div>

      <div class="analyze-action">
        <div class="analyze-options-row">
          <div class="log-scale-selector">
            <span class="log-scale-label">{{ t('praat.pitchTone.step2.logScaleLabel') }}</span>
            <RadioGroup
              v-model="logScaleMode"
              :options="logScaleOptions"
              name="logScaleMode"
            />
          </div>
          <div class="analysis-mode-toggle">
            <CheckBox v-model="analysisMode" :label="t('praat.pitchTone.step2.analysisModeCheckbox')" />
          </div>
        </div>
        <button
            class="analyze-btn"
            @click="performTValueAnalysis"
        >🚀 {{ t('praat.pitchTone.step2.analyzeButton', { count: savedTones.length }) }}</button>
      </div>
    </div>

    <!-- Step 3: Results -->
    <div v-if="tValueResults.length > 0" class="step-section">
      <div class="step-header">
        <span class="step-number">3</span>
        <div class="step-info">
          <h3 class="step-title">{{ t('praat.pitchTone.step3.title') }}</h3>
          <span class="step-hint">{{ t('praat.pitchTone.step3.hint') }}</span>
        </div>
      </div>

      <div class="stats-info">
        <template v-if="globalStats.mode === 'logZScore'">
          <span>{{ t('praat.pitchTone.step3.stats.logMean', { mean: globalStats.logMean.toFixed(3) }) }}</span>
          <span>{{ t('praat.pitchTone.step3.stats.logSd', { sd: globalStats.logSd.toFixed(3) }) }}</span>
        </template>
        <template v-else>
          <span>{{ t('praat.pitchTone.step3.stats.ceiling', { max: globalStats.max.toFixed(1) }) }}</span>
          <span>{{ t('praat.pitchTone.step3.stats.floor', { min: globalStats.min.toFixed(1) }) }}</span>
        </template>
      </div>

      <div class="export-actions">
        <button class="export-btn" @click="exportToExcel">
          📊 {{ t('praat.pitchTone.step3.exportButton') }}
        </button>
      </div>

      <div ref="tValueChartContainer" class="chart-container result-chart"></div>
    </div>

    <AppModal
      v-model="showPreviewModal"
      size="sm"
      :title="previewTitle"
      :close-label="t('praat.pitchTone.step1.savedList.closePreview')"
    >
      <div v-if="previewTone" class="preview-segments">
        <div
          v-for="(seg, si) in previewTone.segments"
          :key="si"
          class="preview-segment-row"
        >
          <div class="preview-segment-info">
            <span class="preview-segment-label">
              {{ t('praat.pitchTone.step1.savedList.segmentIndex', { index: si + 1 }) }}
            </span>
            <span class="preview-segment-meta">
              {{ t('praat.pitchTone.step1.savedList.segmentPoints', { count: getSegmentValues(seg).length }) }}
              <template v-if="getSegmentValues(seg).length > 0">
                · {{ getSegmentHZRange(seg).min.toFixed(1) }} – {{ getSegmentHZRange(seg).max.toFixed(1) }} Hz
              </template>
            </span>
            <span v-if="seg.savedAt" class="preview-segment-time">
              {{ formatTime(seg.savedAt) }}
            </span>
          </div>
          <button
            class="text-btn danger"
            @click="deleteSegment(si)"
          >{{ t('praat.pitchTone.step1.savedList.deleteSegment') }}</button>
        </div>
      </div>
      <div v-else class="preview-empty">
        {{ t('praat.pitchTone.step1.savedList.empty') }}
      </div>
    </AppModal>

  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import * as XLSX from 'xlsx'
import { useI18n } from 'vue-i18n'
import { showSuccess, showWarning, showConfirm } from '@/utils/message.js'
import { useStorageState } from '@/composables/core/useStorageState.js'
import RadioGroup from '@/components/selector/RadioGroup.vue'
import CheckBox from '@/components/selector/CheckBox.vue'
import AppModal from '@/components/common/AppModal.vue'

const STANDARD_POINT_COUNT = 11

const props = defineProps({
  results: { type: Object, default: null }
})
const { t } = useI18n()
const PITCH_TONE_EXPORT_FILE_PREFIX = '方音圖鑑_T值法定調_'
const PITCH_TONE_EXPORT_SHEET_NAME = '石鋒T值分析'
const PITCH_TONE_EXPORT_TIME_COLUMN = '時間 (ms)'
const PITCH_TONE_EXPORT_TIME_COLUMN_ELEVEN_POINT = '归一化时长 (%)'

// === 狀態變量 ===
const pitchChartContainer = ref(null)
const tValueChartContainer = ref(null)
let pitchChart = null
let tValueChart = null
let resizeObserver = null

const toneNameInput = ref('')
const currentSelection = ref([]) // 當前框選的Hz數組
const savedTones = ref([])       // 已保存的調類列表 [{name, segments:[[]]}]
const tValueResults = ref([])    // 計算後的T值結果
const globalStats = ref({ max: 0, min: 0, mode: 'log', logMean: 0, logSd: 0 })

// 预览弹窗
const showPreviewModal = ref(false)
const previewToneIndex = ref(-1)
const previewTone = computed(() => savedTones.value[previewToneIndex.value] ?? null)
const previewTitle = computed(() => {
  if (!previewTone.value) return ''
  return t('praat.pitchTone.step1.savedList.previewTitle', { name: previewTone.value.name })
})

// 对数变换方式：'log' | 'logZScore'
const logScaleMode = ref('log')
const logScaleOptions = computed(() => [
  { value: 'log', label: t('praat.pitchTone.step2.logScaleOptions.log') },
  { value: 'logZScore', label: t('praat.pitchTone.step2.logScaleOptions.logZScore') }
])

// 分析模式：false = 完整曲线，true = 11 点标准化
const analysisMode = ref(false)

// 本地存儲 Key
const STORAGE_KEY = 'shifeng_analysis_data'
const pitchToneStorage = useStorageState(STORAGE_KEY, {
  defaultValue: [],
})

const hasPitchData = computed(() => {
  return props.results && props.results.timeseries && props.results.timeseries.pitch_hz && props.results.timeseries.pitch_hz.length > 0
})

// Helper function to safely get segment count
const getToneSegmentCount = (tone) => {
  if (!tone) return 0
  if (tone.segments && Array.isArray(tone.segments)) {
    return tone.segments.length
  }
  // Old format fallback
  if (tone.values && Array.isArray(tone.values)) {
    return 1
  }
  return 0
}

// Helper: extract Hz array from a segment regardless of old/new format
const getSegmentValues = (seg) => {
  if (Array.isArray(seg)) return seg
  return seg?.values ?? []
}

const formatTime = (ts) => {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const getSegmentHZRange = (seg) => {
  const values = getSegmentValues(seg)
  if (values.length === 0) return { min: 0, max: 0 }
  let min = Infinity, max = -Infinity
  for (const v of values) {
    if (v < min) min = v
    if (v > max) max = v
  }
  return { min, max }
}

// === 初始化與生命週期 ===
onMounted(() => {
  console.log('[PitchTone] Component mounted')
  console.log('[PitchTone] hasPitchData:', hasPitchData.value)
  console.log('[PitchTone] props.results:', props.results)

  // 1. 从 localStorage 恢复历史调类；如果还是旧格式 { values }，这里顺手迁移成 { segments }。
  const stored = pitchToneStorage.read()
  if (Array.isArray(stored) && stored.length > 0) {
    const normalizedTones = stored.map(tone => {
      // 兼容旧缓存：旧结构只有一组 values，新结构统一存成 segments 数组。
      if (tone.values && !tone.segments) {
        return {
          name: tone.name,
          segments: [tone.values]
        }
      }

      return {
        name: tone.name,
        segments: tone.segments || []
      }
    })

    savedTones.value = normalizedTones

    // 只有真的发生迁移时才回写，避免每次挂载都无意义覆盖缓存。
    if (JSON.stringify(normalizedTones) !== JSON.stringify(stored)) {
      pitchToneStorage.write(normalizedTones)
    }
  }

  // 2. 初始化圖表 (在 nextTick 中确保 DOM 已挂载)
  nextTick(() => {
    console.log('[PitchTone] nextTick: Checking for pitch data...')
    console.log('[PitchTone] pitchChartContainer.value:', pitchChartContainer.value)
    if (hasPitchData.value) {
      console.log('[PitchTone] Has pitch data, initializing chart...')
      initPitchChart()
    } else {
      console.log('[PitchTone] No pitch data available')
    }

    // 3. Setup ResizeObserver (在 nextTick 中确保容器已存在)
    resizeObserver = new ResizeObserver(() => {
      // 使用 auto 参数强制重新计算宽度
      pitchChart?.resize({ width: 'auto', height: 'auto' })
      tValueChart?.resize({ width: 'auto', height: 'auto' })
    })

    if (pitchChartContainer.value) {
      // console.log('Setting up ResizeObserver for pitch chart')
      resizeObserver.observe(pitchChartContainer.value)
    }

  })
})

// Cleanup on unmount
onBeforeUnmount(() => {
  // console.log('Component unmounting, cleaning up...')
  resizeObserver?.disconnect()
  pitchChart?.dispose()
  tValueChart?.dispose()
})

// 監聽數據變化自動保存
watch(savedTones, (newVal) => {
  // 所有保存动作统一走 composable，便于后续继续复用序列化/清理策略。
  pitchToneStorage.write(newVal)
}, { deep: true })

// 監聽 props.results 變化，重新初始化圖表
watch(() => props.results, (newVal) => {
  console.log('[PitchTone] props.results changed:', newVal)
  if (newVal && newVal.timeseries && newVal.timeseries.pitch_hz) {
    nextTick(() => {
      console.log('[PitchTone] Re-initializing chart due to data change')
      initPitchChart()
    })
  }
}, { deep: true })

// === 1. 基頻圖表邏輯 (帶框選功能) ===
const initPitchChart = () => {
  console.log('[PitchTone] initPitchChart called')
  console.log('[PitchTone] pitchChartContainer.value:', pitchChartContainer.value)

  if (!pitchChartContainer.value) {
    console.error('[PitchTone] pitchChartContainer is null!')
    return
  }

  if (pitchChart) pitchChart.dispose()

  // === 关键修复: 重新绑定 ResizeObserver ===
  if (resizeObserver) {
    // 先断开旧的监听，防止内存泄漏
    resizeObserver.disconnect()
    // 重新监听当前的 DOM 元素
    resizeObserver.observe(pitchChartContainer.value)
    // 如果 T 值图表容器存在，也加入监听
    if (tValueChartContainer.value) {
      resizeObserver.observe(tValueChartContainer.value)
    }
  }

  console.log('[PitchTone] Initializing ECharts...')
  pitchChart = echarts.init(pitchChartContainer.value)
  console.log('[PitchTone] ECharts initialized:', pitchChart)

  const ts = props.results.timeseries
  if (!ts || !ts.pitch_hz) {
    console.error('[PitchTone] No pitch data available')
    return
  }

  console.log('[PitchTone] Pitch data points:', ts.pitch_hz.length)

  // 構建數據 [時間, Hz]
  const rawData = ts.pitch_hz.map((v, i) => [ts.time?.[i] || i * 0.01, v])

  // 準備音段背景 (markArea)
  const segments = props.results.segments || []
  const markAreaData = segments.map(seg => [
    {
      xAxis: seg.start_s,
      itemStyle: {
        color: seg.type === 'rime_core' ? 'rgba(255,215,0,0.2)' :
            seg.type === 'silence' ? 'rgba(200,200,200,0.1)' :
                'rgba(100,150,255,0.15)'
      }
    },
    { xAxis: seg.end_s }
  ])

  const option = {
    title: {
      text: t('praat.pitchTone.step1.chart.title'),
      left: 'center',
      textStyle: { fontSize: 14, color: '#666' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    toolbox: {
      right: 20,
      feature: {
        dataZoom: {
          title: {
            zoom: t('praat.pitchTone.step1.chart.toolbox.zoom'),
            back: t('praat.pitchTone.step1.chart.toolbox.back')
          }
        },
        restore: { title: t('praat.pitchTone.step1.chart.toolbox.restore') }
      }
    },
    brush: {
      toolbox: ['lineX'],  // 启用横向框选
      xAxisIndex: 0,
      throttleType: 'debounce',
      throttleDelay: 300,
      transformable: true,
      brushStyle: { borderWidth: 2, color: 'rgba(142,20,34,0.15)', borderColor: '#e24a57' }
    },
    xAxis: {
      type: 'value',
      name: t('praat.pitchTone.step1.chart.xAxis'),
      min: 'dataMin',
      max: 'dataMax'
    },
    yAxis: {
      type: 'value',
      name: t('praat.pitchTone.step1.chart.yAxis'),
      scale: true
    },
    series: [{
      name: t('praat.pitchTone.step1.chart.seriesName'),
      type: 'line',
      data: rawData,
      symbol: 'none',
      smooth: true,
      lineStyle: { color: '#007aff', width: 2 },
      markArea: markAreaData.length > 0 ? {
        data: markAreaData,
        silent: true
      } : undefined
    }]
  }

  pitchChart.setOption(option)

  // 强制 resize 确保图表尺寸正确，使用 auto 参数
  setTimeout(() => {
    pitchChart?.resize({ width: 'auto', height: 'auto' })
    console.log('[PitchTone] Chart resized with auto dimensions')
  }, 100)

  // console.log('Pitch chart initialized, activating brush mode...')

  // 默认激活框选模式
  pitchChart.dispatchAction({
    type: 'takeGlobalCursor',
    key: 'brush',
    brushOption: {
      brushType: 'lineX',
      brushMode: 'single'
    }
  })

  // console.log('Brush mode activated')

  // 監聽框選事件
  pitchChart.on('brushSelected', (params) => {
    // console.log('=== brushSelected event triggered ===')

    const brushComponent = params.batch[0]
    if (!brushComponent || !brushComponent.areas || brushComponent.areas.length === 0) {
      // console.log('No valid brush selection')
      currentSelection.value = []
      return
    }

    // Get the time range from brush area
    const area = brushComponent.areas[0]
    const coordRange = area.coordRange || area.coordRanges?.[0]

    if (!coordRange || coordRange.length !== 2) {
      // console.log('No valid coordRange')
      currentSelection.value = []
      return
    }

    const [startTime, endTime] = coordRange
    // console.log('Selected time range:', startTime, 'to', endTime)

    // Manually filter data points within the time range
    const selectedValues = rawData
      .filter(([time, hz]) => time >= startTime && time <= endTime && hz !== null && hz > 0)
      .map(([time, hz]) => hz)

    currentSelection.value = selectedValues
    // console.log('✅ Selected Hz values:', currentSelection.value.length, 'points')
    // console.log('First few values:', currentSelection.value.slice(0, 5))
  })
}

// === 2. 數據管理邏輯 ===
const saveTone = () => {
  if (!toneNameInput.value || currentSelection.value.length === 0) return

  // Check if tone class already exists
  const existingTone = savedTones.value.find(t => t.name === toneNameInput.value)

  if (existingTone) {
    // Add to existing tone class
    existingTone.segments.push({ values: [...currentSelection.value], savedAt: Date.now() })
  } else {
    // Create new tone class
    savedTones.value.push({
      name: toneNameInput.value,
      segments: [{ values: [...currentSelection.value], savedAt: Date.now() }]
    })
  }

  // 重置輸入
  toneNameInput.value = ''
  // 清除圖表上的選框
  if (pitchChart) {
    pitchChart.dispatchAction({
      type: 'brush',
      areas: []
    })
  }
  currentSelection.value = []
}

const removeTone = (index) => {
  savedTones.value.splice(index, 1)
}

const clearAll = async () => {
  if (await showConfirm(t('praat.pitchTone.step1.savedList.confirmClear'))) {
    savedTones.value = []
    pitchToneStorage.remove()
    // Do NOT clear tValueResults - keep analysis results visible
  }
}

const openPreview = (index) => {
  previewToneIndex.value = index
  showPreviewModal.value = true
}

const deleteSegment = (segIndex) => {
  if (!previewTone.value) return
  previewTone.value.segments.splice(segIndex, 1)
  if (previewTone.value.segments.length === 0) {
    savedTones.value.splice(previewToneIndex.value, 1)
    showPreviewModal.value = false
  }
}

// === 3. 石鋒 T 值分析算法 ===

const resampleToNPoints = (values, pointCount = STANDARD_POINT_COUNT) => {
  const cleanValues = values.filter(v => Number.isFinite(v))
  if (cleanValues.length === 0) return []
  if (cleanValues.length === 1) return Array(pointCount).fill(cleanValues[0])

  const result = []
  const lastIndex = cleanValues.length - 1
  for (let i = 0; i < pointCount; i++) {
    const position = (i / (pointCount - 1)) * lastIndex
    const leftIndex = Math.floor(position)
    const rightIndex = Math.ceil(position)
    const ratio = position - leftIndex
    if (leftIndex === rightIndex) {
      result.push(cleanValues[leftIndex])
    } else {
      result.push(cleanValues[leftIndex] * (1 - ratio) + cleanValues[rightIndex] * ratio)
    }
  }
  return result
}

const averagePointwise = (segments) => {
  if (!segments.length) return []
  const pointCount = segments[0].length
  const averaged = []
  for (let i = 0; i < pointCount; i++) {
    let sum = 0
    let count = 0
    for (const segment of segments) {
      const value = segment[i]
      if (Number.isFinite(value)) {
        sum += value
        count++
      }
    }
    averaged.push(count > 0 ? sum / count : null)
  }
  return averaged
}

// === 4. 石鋒 T 值分析算法 ===
const performTValueAnalysis = () => {
  if (savedTones.value.length === 0) return

  // A. Calculate global statistics from ALL collected segments
  const allValues = analysisMode.value
    ? savedTones.value.flatMap(t =>
        t.segments.flatMap(seg => {
          const clean = getSegmentValues(seg).filter(v => v !== null && v !== undefined && v > 0)
          return resampleToNPoints(clean, STANDARD_POINT_COUNT)
        })
      )
    : savedTones.value.flatMap(t => t.segments.flatMap(seg => getSegmentValues(seg)))

  if (allValues.length === 0) {
    showWarning(t('praat.pitchTone.alerts.noValidData'))
    return
  }

  // ✅ 使用真實的最大/最小值作為參考系上下限
  const ceiling = Math.max(...allValues)
  const floor = Math.min(...allValues)

  // 計算均值和標準差（用於日誌輸出）
  const mean = allValues.reduce((sum, v) => sum + v, 0) / allValues.length
  const variance = allValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / allValues.length
  const sd = Math.sqrt(variance)

  console.log('Statistics:', { mean, sd, ceiling, floor, realMax: ceiling, realMin: floor })

  // B. Calculate T-values for each tone class
  const lgValues = allValues.map(v => Math.log10(v))
  const lgMin = Math.min(...lgValues)
  const lgMax = Math.max(...lgValues)

  const useZScore = logScaleMode.value === 'logZScore'

  // Helper: Convert Hz array to T-value array based on selected log scale mode
  let zMean, zSd
  if (useZScore) {
    zMean = lgValues.reduce((sum, v) => sum + v, 0) / lgValues.length
    const varianceLog = lgValues.reduce((sum, v) => sum + Math.pow(v - zMean, 2), 0) / lgValues.length
    zSd = Math.sqrt(varianceLog)
    globalStats.value = { max: ceiling, min: floor, mode: 'logZScore', logMean: zMean, logSd: zSd }
  } else {
    globalStats.value = { max: ceiling, min: floor, mode: 'log' }
  }

  const hzToTValues = (hzArray) => {
    return hzArray.map(hz => {
      const lgX = Math.log10(hz)
      if (useZScore) {
        return (lgX - zMean) / zSd
      }
      return Math.max(0, Math.min(5, ((lgX - lgMin) / (lgMax - lgMin)) * 5))
    })
  }

  // ✅ 修复：计算采样间隔（用于保留真实时长）
  const ts = props.results?.timeseries
  let samplingInterval = 0.01 // 默认 10ms
  if (ts && ts.time && ts.time.length > 1) {
    // 计算平均采样间隔（秒）
    samplingInterval = (ts.time[ts.time.length - 1] - ts.time[0]) / (ts.time.length - 1)
  }
  const samplingIntervalMs = samplingInterval * 1000  // 转换为毫秒

  console.log('Sampling interval:', samplingIntervalMs, 'ms')

  // C. Process each tone class
  const isElevenPoint = analysisMode.value

  if (isElevenPoint) {
    tValueResults.value = savedTones.value.map(tone => {
      // Find this tone class's own longest token duration (ms) → determines x-axis extent
      let classMaxMs = 0
      tone.segments.forEach(seg => {
        const clean = getSegmentValues(seg).filter(v => v !== null && v !== undefined && v > 0)
        const dur = clean.length * samplingIntervalMs
        if (dur > classMaxMs) classMaxMs = dur
      })

      if (classMaxMs === 0) return { name: tone.name, data: [] }

      const tokenData = []

      tone.segments.forEach(seg => {
        const cleanHz = getSegmentValues(seg).filter(v => v !== null && v !== undefined && v > 0)
        if (cleanHz.length === 0) return

        const tValues = hzToTValues(cleanHz)
        const resampled11 = resampleToNPoints(tValues, STANDARD_POINT_COUNT)

        const tokenDuration = cleanHz.length * samplingIntervalMs
        const times = []
        for (let i = 0; i < STANDARD_POINT_COUNT; i++) {
          times.push((i / (STANDARD_POINT_COUNT - 1)) * tokenDuration)
        }

        tokenData.push({ times, values: resampled11 })
      })

      if (tokenData.length === 0) return { name: tone.name, data: [] }

      const chartData = []
      for (let i = 0; i < STANDARD_POINT_COUNT; i++) {
        let sumT = 0, sumTime = 0, count = 0
        for (const td of tokenData) {
          const v = td.values[i]
          if (Number.isFinite(v)) {
            sumT += v
            sumTime += td.times[i]
            count++
          }
        }
        if (count > 0) {
          chartData.push([sumTime / count, sumT / count])
        }
      }

      return { name: tone.name, data: chartData }
    })

    // Find global max x (ms) across all tone classes → 100% reference
    let globalMaxX = 0
    tValueResults.value.forEach(r => {
      r.data.forEach(([x]) => { if (x > globalMaxX) globalMaxX = x })
    })

    // Convert ms x → percentage (0–100%)
    if (globalMaxX > 0) {
      tValueResults.value.forEach(r => {
        r.data = r.data.map(([x, y]) => [(x / globalMaxX) * 100, y])
      })
    }
  } else {
    tValueResults.value = savedTones.value.map(tone => {
      const tValueSegments = tone.segments.map(seg => {
        return hzToTValues(getSegmentValues(seg))
      }).filter(seg => seg.length > 0)

      if (tValueSegments.length === 0) return { name: tone.name, data: [] }

      // Target length = average of all token lengths within this tone class
      const totalLen = tValueSegments.reduce((s, seg) => s + seg.length, 0)
      const avgLength = Math.round(totalLen / tValueSegments.length)

      // Resample each token to the average length
      const normalizedSegments = tValueSegments.map(seg => resampleToNPoints(seg, avgLength))

      const avgTValues = averagePointwise(normalizedSegments)

      const chartData = avgTValues.map((val, idx) => {
        const timeMs = idx * samplingIntervalMs
        return [timeMs, val]
      }).filter(([, val]) => val !== null)

      return {
        name: tone.name,
        data: chartData
      }
    })
  }

  // D. Do NOT clear localStorage automatically
  // User will manually clear using the "清空" button

  // E. Render results chart
  nextTick(() => {
    initTValueChart()
  })
}

// === 4. Excel 导出功能 ===
const exportToExcel = () => {
  if (tValueResults.value.length === 0) {
    showWarning(t('praat.pitchTone.step3.export.noData'))
    return
  }

  const isElevenPoint = analysisMode.value
  const timeColumnName = isElevenPoint
    ? PITCH_TONE_EXPORT_TIME_COLUMN_ELEVEN_POINT
    : PITCH_TONE_EXPORT_TIME_COLUMN

  const maxLength = Math.max(...tValueResults.value.map(r => r.data.length))

  const excelData = []
  for (let i = 0; i < maxLength; i++) {
    const row = {}

    const firstTime = tValueResults.value[0].data[i]?.[0]
    row[timeColumnName] = isElevenPoint
      ? firstTime?.toFixed(0) || ''
      : firstTime?.toFixed(1) || ''

    tValueResults.value.forEach(result => {
      const point = result.data[i]
      row[result.name] = point ? point[1].toFixed(2) : ''
    })

    excelData.push(row)
  }

  // 3. 生成 Excel
  const ws = XLSX.utils.json_to_sheet(excelData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, PITCH_TONE_EXPORT_SHEET_NAME)

  // 4. 下载文件
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
  XLSX.writeFile(wb, `${PITCH_TONE_EXPORT_FILE_PREFIX}${timestamp}.xlsx`)

  showSuccess(t('praat.pitchTone.step3.export.success'))
}

const initTValueChart = () => {
  if (!tValueChartContainer.value) return
  if (tValueChart) tValueChart.dispose()

  if (resizeObserver && tValueChartContainer.value) {
    resizeObserver.observe(tValueChartContainer.value)
  }

  tValueChart = echarts.init(tValueChartContainer.value)

  const isZScore = globalStats.value.mode === 'logZScore'
  const isElevenPoint = analysisMode.value

  if (isElevenPoint) {
    initElevenPointChart()
  } else {
    initContinuousChart(isZScore)
  }

  setTimeout(() => {
    tValueChart?.resize({ width: 'auto', height: 'auto' })
  }, 100)
}

const ACADEMIC_SYMBOLS = [
  'circle',
  'rect',
  'triangle',
  'diamond',
  'roundRect',
  'pin',
  'arrow',
  'path://M-6,0L6,0M0,-6L0,6',
  'path://M-5,-5L5,5M-5,5L5,-5',
  'path://M0,-7L1.5,-2.5L6,-2.5L2.5,0.5L4,5.5L0,3L-4,5.5L-2.5,0.5L-6,-2.5L-1.5,-2.5Z',
  'path://M0,6L5,-4L-5,-4Z',
  'path://M0,-6L3.5,-3.5L6,0L3.5,3.5L0,6L-3.5,3.5L-6,0L-3.5,-3.5Z',
]

const ACADEMIC_COLORS = [
  '#000000',
  '#e41a1c',
  '#377eb8',
  '#4daf4a',
  '#984ea3',
  '#ff7f00',
  '#a65628',
  '#f781bf',
]

const initElevenPointChart = () => {
  const isZScore = globalStats.value.mode === 'logZScore'

  const series = tValueResults.value.map((res, idx) => ({
    name: res.name,
    type: 'line',
    data: res.data,
    smooth: false,
    showSymbol: true,
    symbol: ACADEMIC_SYMBOLS[idx % ACADEMIC_SYMBOLS.length],
    symbolSize: 7,
    lineStyle: {
      width: 1.8,
      color: ACADEMIC_COLORS[idx % ACADEMIC_COLORS.length],
    },
    itemStyle: {
      color: ACADEMIC_COLORS[idx % ACADEMIC_COLORS.length],
    },
  }))

  const option = {
    backgroundColor: '#ffffff',
    title: {
      text: t('praat.pitchTone.step3.chart.title'),
      left: 'center',
      top: 8,
      textStyle: { fontSize: 14, fontWeight: 'bold', color: '#000' },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: '#000',
      borderWidth: 1,
      textStyle: { color: '#000', fontSize: 12 },
      formatter: (params) => {
        let result = t('praat.pitchTone.step3.chart.tooltipTimeElevenPoint', {
          percent: params[0].value[0].toFixed(0)
        }) + '<br/>'
        params.forEach(param => {
          result += `${param.seriesName}: ${param.value[1].toFixed(2)}<br/>`
        })
        return result
      },
    },
    legend: {
      orient: 'vertical',
      right: 8,
      top: 50,
      backgroundColor: '#ffffff',
      borderColor: '#000000',
      borderWidth: 1,
      padding: [8, 12],
      itemGap: 10,
      itemWidth: 24,
      textStyle: { fontSize: 12, color: '#000' },
    },
    toolbox: {
      right: 10,
      top: 8,
      feature: {
        saveAsImage: {
          title: t('praat.pitchTone.step3.chart.toolbox.saveAsImage'),
          name: t('praat.pitchTone.step3.chart.imageName'),
          pixelRatio: 2,
          backgroundColor: '#fff',
        },
      },
    },
    grid: {
      top: 50,
      bottom: 50,
      left: 60,
      right: 120,
    },
    xAxis: {
      type: 'value',
      name: t('praat.pitchTone.step3.chart.xAxisElevenPoint'),
      nameLocation: 'center',
      nameGap: 28,
      nameTextStyle: { fontSize: 12, color: '#000' },
      min: 0,
      max: 100,
      axisLabel: { formatter: '{value}%', color: '#000', fontSize: 11 },
      axisLine: { lineStyle: { color: '#000', width: 1 } },
      axisTick: { lineStyle: { color: '#000' } },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: isZScore
        ? t('praat.pitchTone.step3.chart.yAxisZScore')
        : t('praat.pitchTone.step3.chart.yAxis'),
      nameTextStyle: { fontSize: 12, color: '#000' },
      ...(isZScore
        ? { scale: true }
        : { min: 0, max: 5, interval: 1 }
      ),
      axisLabel: { color: '#000', fontSize: 11 },
      axisLine: { lineStyle: { color: '#000', width: 1 } },
      axisTick: { lineStyle: { color: '#000' } },
      splitLine: {
        show: true,
        lineStyle: { color: '#555555', width: 0.8, type: 'solid' },
      },
    },
    series: series,
  }

  tValueChart.setOption(option)
}

const initContinuousChart = (isZScore) => {
  const series = tValueResults.value.map(res => ({
    name: res.name,
    type: 'line',
    data: res.data,
    smooth: true,
    showSymbol: false,
    lineStyle: { width: 3 }
  }))

  const option = {
    title: { text: t('praat.pitchTone.step3.chart.title'), left: 'center' },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let result = t('praat.pitchTone.step3.chart.tooltipTime', {
          time: params[0].value[0].toFixed(1)
        }) + '<br/>'
        params.forEach(param => {
          result += `${param.seriesName}: ${param.value[1].toFixed(2)}<br/>`
        })
        return result
      }
    },
    legend: {
      bottom: 0,
      type: 'scroll',
      orient: 'horizontal',
      itemGap: 20,
      textStyle: {
        fontSize: 14,
        color: '#2c3e50'
      }
    },
    toolbox: {
      right: 20,
      feature: {
        dataZoom: {
          title: {
            zoom: t('praat.pitchTone.step3.chart.toolbox.zoom'),
            back: t('praat.pitchTone.step3.chart.toolbox.back')
          }
        },
        restore: { title: t('praat.pitchTone.step3.chart.toolbox.restore') },
        saveAsImage: {
          title: t('praat.pitchTone.step3.chart.toolbox.saveAsImage'),
          name: t('praat.pitchTone.step3.chart.imageName'),
          pixelRatio: 2,
          backgroundColor: '#fff'
        }
      }
    },
    grid: { top: 50, bottom: 60, left: 60, right: 30 },
    xAxis: {
      type: 'value',
      name: t('praat.pitchTone.step3.chart.xAxis'),
      min: 0,
      axisLabel: { formatter: '{value}' }
    },
    yAxis: {
      type: 'value',
      name: isZScore
        ? t('praat.pitchTone.step3.chart.yAxisZScore')
        : t('praat.pitchTone.step3.chart.yAxis'),
      ...(isZScore
        ? { scale: true }
        : { min: 0, max: 5, interval: 1, splitNumber: 5 }
      ),
      splitLine: { show: true }
    },
    series: series
  }

  tValueChart.setOption(option)
}
</script>

<style scoped lang="scss">
.pitch-tone-panel {
  padding: 1.5rem;
  margin: 0 auto 1.5rem auto;
  max-width: 1200px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .panel-title {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--color-text-primary, #2c3e50);
    margin: 0 0 1rem 0;
    text-align: center;
  }

  .step-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 96%;
    min-width: 0;
    box-sizing: border-box;

    .step-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .step-number {
      flex-shrink: 0;
      width: 2.5rem;
      height: 2.5rem;
      background: linear-gradient(135deg, #007aff, #5856d6);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
    }

    .step-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      align-items: center;
    }

    .step-title {
      font-size: 1.3rem;
      font-weight: 600;
      color: var(--color-text-primary, #2c3e50);
      margin: 0;
    }

    .step-hint {
      font-size: 0.9rem;
      color: var(--color-text-secondary, #666);
    }
  }

  .chart-container {
    width: 100%;
    height: 350px;
    background: white;
    border-radius: var(--radius-md, 8px);
    padding: 0.5rem;
    border: 1px solid rgba(0, 0, 0, 0.05);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    position: relative;
    overflow: hidden;
    box-sizing: border-box;

    &.result-chart {
      height: 400px;
    }
  }

  .no-data-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: var(--color-text-secondary, #666);
    background: rgba(255, 255, 255, 0.5);
    border-radius: var(--radius-lg, 12px);
    border: 2px dashed rgba(0, 0, 0, 0.1);

    .no-data-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
  }

  .controls-section {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 1.5rem;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.5);
    border-radius: var(--radius-lg, 12px);
    border: 1px solid rgba(255, 255, 255, 0.8);

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;

      .selection-info {
        font-size: 0.95rem;
        font-weight: 600;
        min-height: 1.5rem;

        .status-active {
          color: var(--color-success, #50c878);
          animation: pulse 2s ease-in-out infinite;
        }

        .status-idle {
          color: var(--color-text-secondary, #999);
          font-weight: 500;
        }
      }

      .tone-input {
        padding: 0.7rem 1rem;
        border: 2px solid rgba(0, 0, 0, 0.1);
        border-radius: var(--radius-md, 8px);
        font-size: 1rem;
        transition: all 0.2s;

        &:focus {
          outline: none;
          border-color: var(--color-primary, #4a90e2);
          box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
        }
      }

      .action-btn {
        padding: 0.7rem;
        border: none;
        border-radius: var(--radius-md, 8px);
        cursor: pointer;
        font-weight: 600;
        font-size: 1rem;
        transition: all 0.2s;

        &.add-btn {
          background: var(--color-primary, #4a90e2);
          color: white;
          box-shadow: 0 2px 6px rgba(74, 144, 226, 0.3);

          &:hover:not(:disabled) {
            background: #3a7bc8;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
          }

          &:disabled {
            background: #ccc;
            cursor: not-allowed;
            box-shadow: none;
          }
        }
      }

      .persistence-hint {
        font-size: 0.8rem;
        color: var(--color-text-secondary, #888);
        font-style: italic;
        padding: 0.25rem 0;
        line-height: 1.4;
      }
    }

    .saved-list-container {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;

      .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--color-text-primary, #2c3e50);
      }


      .tags-wrapper {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
        max-height: 140px;
        overflow-y: auto;
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.5);
        border-radius: var(--radius-md, 8px);
      }

      .tone-tag {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: white;
        padding: 0.4rem 0.8rem;
        border: 2px solid rgba(0, 0, 0, 0.5);
        border-radius: var(--radius-2xl);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        font-size: 0.95rem;
        transition: all 0.2s;
        cursor: pointer;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .tag-name {
          font-weight: 700;
          color: var(--color-primary, #4a90e2);
        }

        .tag-count {
          font-size: 0.8rem;
          color: #666;
          font-weight: 600;
        }

        .close-tag {
          border: none;
          background: none;
          color: #999;
          cursor: pointer;
          font-size: 1.2rem;
          line-height: 1;
          padding: 0;
          width: 1.2rem;
          height: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;

          &:hover {
            color: var(--color-error, #e74c3c);
            transform: scale(1.2);
          }
        }
      }

      .empty-hint {
        color: var(--color-text-secondary, #999);
        font-size: 0.9rem;
        font-style: italic;
        text-align: center;
        padding: 1rem;
      }
    }
  }

  .analyze-action {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1rem 0;

    .analyze-options-row {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 1.5rem;

      .log-scale-selector {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
        justify-content: center;

        .log-scale-label {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--color-text-primary, #2c3e50);
          white-space: nowrap;
        }
      }
    }

    .analyze-btn {
      background: linear-gradient(135deg, #007aff, #5856d6);
      color: white;
      border: none;
      padding: 1rem 3rem;
      border-radius: var(--radius-2xl);
      font-size: 1.2rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0, 122, 255, 0.4);
      transition: all 0.3s;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        transition: left 0.5s;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 122, 255, 0.5);

        &::before {
          left: 100%;
        }
      }

      &:active {
        transform: translateY(0);
      }
    }
  }

  .stats-info {
    display: flex;
    justify-content: center;
    gap: 3rem;
    margin-bottom: 1rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.5);
    border-radius: var(--radius-md, 8px);
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-text-primary, #2c3e50);
    font-family: 'Courier New', monospace;
  }

  .export-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 1rem;
    align-items: center;

    .export-btn {
      background: linear-gradient(135deg, #50c878, #3aa65d);
      color: white;
      border: none;
      padding: 0.8rem 2rem;
      border-radius: var(--radius-lg, 12px);
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(80, 200, 120, 0.3);
      transition: all 0.3s;
      max-width: 300px;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(80, 200, 120, 0.4);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }
}

.text-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  text-decoration: underline;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.7;
  }

  &.danger {
    color: var(--color-error, #e74c3c);
    font-weight: 600;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@media (max-aspect-ratio: 1/1) {
  .pitch-tone-panel {
    padding: 0.5rem;

    .controls-section {
      display: flex !important;
      flex-direction: column;
      gap: 1rem;
    }

    .chart-container {
      height: 280px;

      &.result-chart {
        height: 320px;
      }
    }

    .stats-info {
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-start;
    }

    .export-actions {
      flex-direction: column;
      width: 100%;
    }

    .analyze-options-row {
      gap: 1rem;
    }
  }
}

@media (max-width: 600px) {
  .pitch-tone-panel {
    .step-number {
      width: 2rem;
      height: 2rem;
      font-size: 1rem;
    }

    .step-title {
      font-size: 1.1rem;
    }

    .step-hint {
      font-size: 0.85rem;
    }

    .panel-title {
      font-size: 1.4rem;
    }
  }
}

.preview-segments {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 80px;
}

.preview-segment-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.6rem 0.75rem;
  background: rgba(0, 0, 0, 0.03);
  border-radius: var(--radius-md, 8px);
  gap: 1rem;

  .preview-segment-info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;

    .preview-segment-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--color-text-primary, #2c3e50);
    }

    .preview-segment-meta {
      font-size: 0.8rem;
      color: var(--color-text-secondary, #666);
    }

    .preview-segment-time {
      font-size: 0.75rem;
      color: var(--color-text-secondary, #999);
    }
  }

  .text-btn.danger {
    flex-shrink: 0;
    margin-top: 0.15rem;
  }
}

.preview-empty {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-secondary, #999);
  font-style: italic;
}
</style>
