<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import * as echarts from 'echarts'
import { getFeatureCounts } from '@/api'
import AppModal from '@/components/common/AppModal.vue'
import LocationMultiInput from '@/main/components/geo/LocationMultiInput.vue'
import CountLocationJumpNav from '@/main/components/pho/CountLocationJumpNav.vue'
import { PHONOLOGY_LOCATION_LIMITS } from '@/main/config/constants.js'
import { useAsyncTask } from '@/composables/core/useAsyncTask.js'
import { useNavAnchorJump } from '@/composables/useNavAnchorJump.js'
import all_feature_counts from '/data/feature_counts_20260624.json?url'

const { t } = useI18n()
const route = useRoute()

const loadCountsTask = useAsyncTask()
const loading = loadCountsTask.loading
const error = ref(null)
const matrixData = ref(null)
const queryStrings = ref([])
const matchedLocations = ref([])
const isMatching = ref(false) // 添加匹配状态
const rendering = ref(false)

const waitForPaint = () => {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve)
    })
  })
}

// 音節統計數據
const featureData = ref({}) // 存儲每個地點的原始數據
const aggregatedData = ref({}) // 存儲匯總統計數據

//默认加载
const isUsingDefaultCounts = ref(false)
const displayLocationCount = ref(0)

const hasResultData = computed(() => {
  return Object.keys(featureData.value).length > 0 || Object.keys(aggregatedData.value).length > 0
})

const hasLocationDetailData = computed(() => {
  return Object.keys(featureData.value).length > 0
})

// 圖表配置
const FEATURE_TYPE_ORDER = ['聲母', '韻母', '聲調']
const PIE_MAX_OTHER_SHARE = 0.2
const BAR_MAX_REMAINDER_SHARE = 0.1
const MIN_VISIBLE_ITEMS = 1
const DEFAULT_JSON_MIN_TOTAL_COUNT = {
  聲母: 5,
  韻母: 20,
  聲調: 2
}

const chartEls = {
  pie: {},
  bar: {}
}

const chartInstances = {
  pie: {},
  bar: {}
}

const scatterChartEl = ref(null)
let scatterChartInstance = null
let defaultCountsCache = null
let defaultCountsPromise = null

// 弹窗状态
const showLocationModal = ref(false)
const modalLoading = ref(false)
const modalLocationText = ref('')
let modalOpenToken = 0

const modalData = ref({
  syllable: '',
  featureType: '',
  locations: [],
  totalCount: 0
})

const displayLocations = computed(() => {
  if (!matrixData.value) return []
  return Object.keys(matrixData.value)
})

const chartFeatureTypes = computed(() => {
  const keys = Object.keys(aggregatedData.value || {})
  const ordered = FEATURE_TYPE_ORDER.filter((type) => keys.includes(type))
  const rest = keys.filter((type) => !FEATURE_TYPE_ORDER.includes(type))

  return [...ordered, ...rest]
})

const hasChartData = computed(() => chartFeatureTypes.value.length > 0)
const isResultsBusy = computed(() => loading.value || rendering.value)
const isCurrentCountRoute = computed(() => route.path === '/menu/pho/count')

const {
  locationNavItems,
  currentVisibleNavId,
  getChartsAnchorId,
  getAggregatedAnchorId,
  getLocationAnchorId,
  handleLocationNavJump
} = useNavAnchorJump({
  featureData,
  aggregatedData,
  hasChartData,
  hasResultData,
  isEnabled: isCurrentCountRoute
})

// 处理匹配到的地点列表
const handleMatchedLocations = (locations) => {
  matchedLocations.value = locations
}

// 处理匹配状态
const handleIsMatching = (matching) => {
  isMatching.value = matching
}

const setChartRef = (chartType, featureType, el) => {
  if (!chartEls[chartType]) {
    chartEls[chartType] = {}
  }

  if (!el) {
    delete chartEls[chartType][featureType]
    return
  }

  chartEls[chartType][featureType] = el
}

const setScatterChartRef = (el) => {
  scatterChartEl.value = el || null
}

const safeDisposeChart = (chart) => {
  if (chart && !chart.isDisposed?.()) {
    chart.dispose()
  }
}

const disposeAllCharts = () => {
  Object.keys(chartInstances).forEach((chartType) => {
    Object.values(chartInstances[chartType]).forEach((chart) => {
      safeDisposeChart(chart)
    })

    chartInstances[chartType] = {}
  })

  safeDisposeChart(scatterChartInstance)
  scatterChartInstance = null
}

const getChartInstance = (chartType, featureType) => {
  const el = chartEls[chartType]?.[featureType]
  if (!el) return null

  const existed = chartInstances[chartType][featureType]

  if (existed && !existed.isDisposed?.()) {
    return existed
  }

  chartInstances[chartType][featureType] = echarts.getInstanceByDom(el) || echarts.init(el)

  return chartInstances[chartType][featureType]
}

const getScatterChartInstance = () => {
  const el = scatterChartEl.value
  if (!el) return null

  if (scatterChartInstance && !scatterChartInstance.isDisposed?.()) {
    return scatterChartInstance
  }

  scatterChartInstance = echarts.getInstanceByDom(el) || echarts.init(el)

  return scatterChartInstance
}

const getFeatureStatsList = (featureType) => {
  const features = aggregatedData.value?.[featureType] || {}

  return Object.entries(features)
    .map(([syllable, stats]) => ({
      syllable,
      totalCount: Number(stats?.totalCount || 0),
      locationCount: Number(stats?.locationCount || stats?.locations?.length || 0),
      locations: Array.isArray(stats?.locations) ? stats.locations : []
    }))
    .sort((a, b) => {
      if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount
      if (b.locationCount !== a.locationCount) return b.locationCount - a.locationCount
      return a.syllable.localeCompare(b.syllable, 'zh-Hant')
    })
}

const sortFeatureEntries = (features = {}) => {
  return Object.fromEntries(
    Object.entries(features)
      .map(([syllable, stats]) => {
        const normalizedStats = {
          totalCount: Number(stats?.totalCount || 0),
          locationCount: Number(stats?.locationCount || stats?.locations?.length || 0),
          locations: Array.isArray(stats?.locations) ? stats.locations : []
        }

        return [syllable, normalizedStats]
      })
      .sort(([syllableA, a], [syllableB, b]) => {
        if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount
        if (b.locationCount !== a.locationCount) return b.locationCount - a.locationCount
        return String(syllableA).localeCompare(String(syllableB), 'zh-Hant')
      })
  )
}

const normalizeAndFilterAggregatedData = (data = {}, { applyDefaultThreshold = false } = {}) => {
  const normalized = {}

  Object.entries(data || {}).forEach(([featureType, features]) => {
    const minTotalCount = applyDefaultThreshold ? Number(DEFAULT_JSON_MIN_TOTAL_COUNT[featureType] || 0) : 0

    const filteredEntries = Object.entries(features || {}).filter(([, stats]) => {
      const totalCount = Number(stats?.totalCount || 0)
      return totalCount >= minTotalCount
    })

    if (!filteredEntries.length) return

    normalized[featureType] = sortFeatureEntries(Object.fromEntries(filteredEntries))
  })

  const ordered = {}

  FEATURE_TYPE_ORDER.forEach((type) => {
    if (normalized[type]) {
      ordered[type] = normalized[type]
    }
  })

  Object.keys(normalized).forEach((type) => {
    if (!Object.prototype.hasOwnProperty.call(ordered, type)) {
      ordered[type] = normalized[type]
    }
  })

  return ordered
}

const pickPieVisibleList = (list) => {
  if (list.length <= 1) return { visible: list, otherCount: 0 }

  const total = list.reduce((sum, item) => sum + item.totalCount, 0)
  let visibleCount = Math.min(list.length, Math.max(MIN_VISIBLE_ITEMS, 1))
  let visible = list.slice(0, visibleCount)
  let otherCount = total - visible.reduce((sum, item) => sum + item.totalCount, 0)

  while (visibleCount < list.length && total > 0 && otherCount / total > PIE_MAX_OTHER_SHARE) {
    visibleCount += 1
    visible = list.slice(0, visibleCount)
    otherCount = total - visible.reduce((sum, item) => sum + item.totalCount, 0)
  }

  return { visible, otherCount }
}

const pickBarVisibleList = (list) => {
  if (list.length <= 1) return { visible: list, hiddenTotalCount: 0 }

  const totalCount = list.reduce((sum, item) => sum + item.totalCount, 0)
  let visibleCount = Math.min(list.length, Math.max(MIN_VISIBLE_ITEMS, 1))
  let visible = list.slice(0, visibleCount)
  let hiddenTotalCount = totalCount - visible.reduce((sum, item) => sum + item.totalCount, 0)

  while (visibleCount < list.length && totalCount > 0 && hiddenTotalCount / totalCount >= BAR_MAX_REMAINDER_SHARE) {
    visibleCount += 1
    visible = list.slice(0, visibleCount)
    hiddenTotalCount = totalCount - visible.reduce((sum, item) => sum + item.totalCount, 0)
  }

  return { visible, hiddenTotalCount }
}

const formatLocationsPreview = (locations = [], limit = 2) => {
  if (!locations.length) return '無'

  const preview = locations.slice(0, limit).join('、')
  return locations.length > limit ? `${preview}…` : preview
}

const isMobileChart = () => {
  return window.innerWidth <= 768
}

const getTotalLocationCountForCharts = () => {
  // 如果你前面已经加了 displayLocationCount，就优先用它
  if (typeof displayLocationCount.value !== 'undefined' && Number(displayLocationCount.value) > 0) {
    return Number(displayLocationCount.value)
  }

  // 用户真实查询后，有 featureData
  const featureLocationCount = Object.keys(featureData.value || {}).length
  if (featureLocationCount > 0) {
    return featureLocationCount
  }

  // 默认 aggregated-only 数据下，从 locations 反推总地点数
  const locationSet = new Set()

  Object.values(aggregatedData.value || {}).forEach((features) => {
    Object.values(features || {}).forEach((stats) => {
      if (Array.isArray(stats?.locations)) {
        stats.locations.forEach((location) => {
          if (location) locationSet.add(location)
        })
      }
    })
  })

  return locationSet.size || 1
}

const getScatterSymbolSize = (locationCount) => {
  const totalLocationCount = getTotalLocationCountForCharts()
  const ratio = totalLocationCount > 0 ? locationCount / totalLocationCount : 0

  const minSize = isMobileChart() ? 5 : 6
  const maxSize = isMobileChart() ? 18 : 28

  // 用 sqrt 保留差异，但避免小比例全部挤在一起
  return minSize + Math.sqrt(Math.max(0, ratio)) * (maxSize - minSize)
}

const renderPieChart = (featureType) => {
  const chart = getChartInstance('pie', featureType)
  if (!chart) return

  const list = getFeatureStatsList(featureType)
  const { visible: topItems, otherCount } = pickPieVisibleList(list)

  const pieData = topItems.map((item) => ({
    name: item.syllable,
    value: item.totalCount
  }))

  if (otherCount > 0) {
    pieData.push({
      name: t('phonology.phonology.countphos.charts.common.other'),
      value: otherCount
    })
  }

  chart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        return [
          `${featureType}：${params.name}`,
          `${t('phonology.phonology.countphos.charts.common.totalCount')}：${params.value}`,
          `${t('phonology.phonology.countphos.charts.common.share')}：${params.percent}%`
        ].join('<br/>')
      }
    },
    legend: {
      type: 'scroll',
      bottom: 0,
      left: 'center'
    },
    series: [
      {
        name: featureType,
        type: 'pie',
        radius: ['35%', '65%'],
        center: ['50%', '43%'],
        avoidLabelOverlap: true,
        stillShowZeroSum: false,
        label: {
          formatter: '{b}\n{d}%',
          fontSize: 11
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: pieData
      }
    ]
  }, true)

  chart.off('click')
  chart.on('click', (params) => {
    if (params.name === t('phonology.phonology.countphos.charts.common.other')) return

    const stats = aggregatedData.value?.[featureType]?.[params.name]
    if (!stats) return

    openLocationModal(params.name, featureType, stats)
  })
}

const renderBarChart = (featureType) => {
  const chart = getChartInstance('bar', featureType)
  if (!chart) return

  // 先按總數量排行取前 N，再展示這些音節對應的地點數
  const { visible: list } = pickBarVisibleList(getFeatureStatsList(featureType))

  const mobile = isMobileChart()
  const useDataZoom = list.length > 50 && (!mobile)

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      confine: true,
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params) => {
        const index = params?.[0]?.dataIndex
        const item = list[index]
        if (!item) return ''

        return [
          `${featureType}：${item.syllable}`,
          `${t('phonology.phonology.countphos.charts.common.totalCount')}：${item.totalCount}`,
          `${t('phonology.phonology.countphos.charts.common.locationCount')}：${item.locationCount}`,
          `${t('phonology.phonology.countphos.charts.common.locations')}：${formatLocationsPreview(item.locations)}`
        ].join('<br/>')
      }
    },
    grid: {
      left: mobile ? 6 : 12,
      right: mobile ? 15 : 30,
      top: mobile ? 30 : 36,
      bottom: mobile ? 76 : 64,
      containLabel: true
    },
    dataZoom: useDataZoom
      ? [
          {
            type: 'inside',
            xAxisIndex: 0
          },
          {
            type: 'slider',
            xAxisIndex: 0,
            height: 18,
            bottom: 12
          }
        ]
      : [],
    xAxis: {
      type: 'category',
      data: list.map((item) => item.syllable),
      axisLabel: {
        interval: 0,
        rotate: mobile ? 60 : 45,
        fontSize: mobile ? 10 : 12,
        hideOverlap: true
      }
    },
    yAxis: {
      type: 'value',
      position: 'right',
      name: mobile ? '' : t('phonology.phonology.countphos.charts.common.locationCount'),
      minInterval: 1,
      axisLabel: {
        fontSize: mobile ? 10 : 12
      }
    },
    series: [
      {
        name: `${featureType}${t('phonology.phonology.countphos.charts.common.locationCount')}`,
        type: 'bar',
        data: list.map((item) => item.locationCount),
        barMaxWidth: mobile ? 22 : 32
      }
    ]
  }, true)

  chart.off('click')
  chart.on('click', (params) => {
    const item = list[params.dataIndex]
    if (!item) return

    const stats = aggregatedData.value?.[featureType]?.[item.syllable]
    if (!stats) return

    openLocationModal(item.syllable, featureType, stats)
  })
}

const renderScatterChart = () => {
  const chart = getScatterChartInstance()
  if (!chart) return

  const series = chartFeatureTypes.value.map((featureType) => ({
    name: featureType,
    type: 'scatter',
    symbolSize: (value) => {
      const locationCount = Number(value?.[1] || 0)
      return getScatterSymbolSize(locationCount)
    },
    emphasis: {
      focus: 'series',
      label: {
        show: true,
        formatter: (params) => params.data?.syllable || '',
        position: 'top',
        fontWeight: 'bold'
      }
    },
    data: getFeatureStatsList(featureType).map((item) => ({
      value: [item.totalCount, item.locationCount],
      syllable: item.syllable,
      featureType,
      totalCount: item.totalCount,
      locationCount: item.locationCount,
      locations: item.locations
    }))
  }))

  const mobile = isMobileChart()

  chart.setOption({
    tooltip: {
      trigger: 'item',
      confine: true,
      formatter: (params) => {
        const item = params.data
        if (!item) return ''

        return [
          `${item.featureType}：${item.syllable}`,
          `${t('phonology.phonology.countphos.charts.common.totalCount')}：${item.totalCount}`,
          `${t('phonology.phonology.countphos.charts.common.locationCount')}：${item.locationCount}`,
          `${t('phonology.phonology.countphos.charts.common.locations')}：${formatLocationsPreview(item.locations)}`
        ].join('<br/>')
      }
    },
    legend: {
      type: 'scroll',
      top: 0,
      left: 'center',
      itemWidth: mobile ? 10 : 14,
      itemHeight: mobile ? 8 : 10,
      textStyle: {
        fontSize: mobile ? 11 : 12
      }
    },
    grid: {
      left: mobile ? 6 : 12,
      right: mobile ? 15 : 30,
      top: mobile ? 48 : 52,
      bottom: mobile ? 42 : 52,
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: mobile ? '' : t('phonology.phonology.countphos.charts.common.totalCount'),
      min: 0,
      axisLabel: {
        fontSize: mobile ? 10 : 12
      },
      splitLine: {
        show: true
      }
    },
    yAxis: {
      type: 'value',
      position: 'right',
      name: mobile ? '' : t('phonology.phonology.countphos.charts.common.locationCount'),
      min: 0,
      minInterval: 1,
      axisLabel: {
        fontSize: mobile ? 10 : 12
      },
      splitLine: {
        show: true
      }
    },
    series
  }, true)

  chart.off('click')
  chart.on('click', (params) => {
    const item = params.data
    if (!item?.featureType || !item?.syllable) return

    const stats = aggregatedData.value?.[item.featureType]?.[item.syllable]
    if (!stats) return

    openLocationModal(item.syllable, item.featureType, stats)
  })
}

const resizeCharts = () => {
  requestAnimationFrame(() => {
    Object.values(chartInstances).forEach((group) => {
      Object.values(group).forEach((chart) => {
        if (chart && !chart.isDisposed?.()) {
          chart.resize()
        }
      })
    })

    if (scatterChartInstance && !scatterChartInstance.isDisposed?.()) {
      scatterChartInstance.resize()
    }
  })
}

const renderAllCharts = async () => {
  rendering.value = true

  try {
    await nextTick()

    if (!hasChartData.value) return

    await waitForPaint()

    chartFeatureTypes.value.forEach((featureType) => {
      renderPieChart(featureType)
      renderBarChart(featureType)
    })

    renderScatterChart()
    resizeCharts()
    await nextTick()
  } finally {
    rendering.value = false
  }
}

const getDefaultCountsData = async () => {
  if (defaultCountsCache) {
    return defaultCountsCache
  }

  if (!defaultCountsPromise) {
    defaultCountsPromise = fetch(all_feature_counts)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load default feature counts: ${res.status}`)
        }
        return res.json()
      })
      .then((result) => {
        const aggregated = normalizeAndFilterAggregatedData(result?.aggregated || result || {}, {
          applyDefaultThreshold: true
        })

        defaultCountsCache = {
          aggregated,
          locationCount: Number(result?.locationCount || 0) || inferAggregatedLocationCount(aggregated)
        }

        return defaultCountsCache
      })
      .finally(() => {
        defaultCountsPromise = null
      })
  }

  return defaultCountsPromise
}

const loadDefaultCountsData = async () => {
  error.value = null

  await loadCountsTask.run(async () => {
    const cachedData = await getDefaultCountsData()

    featureData.value = {}
    aggregatedData.value = cachedData.aggregated
    displayLocationCount.value = cachedData.locationCount
    isUsingDefaultCounts.value = true
  }, {
    onError: (err) => {
      console.error('默认音节统计数据加载失败:', err)
    }
  })

  if (!error.value && Object.keys(aggregatedData.value).length > 0) {
    await renderAllCharts()
  }
}

const loadData = async () => {
  if (matchedLocations.value.length === 0) {
    error.value = t('phonology.phonology.countphos.states.minLocationError')
    return
  }

  error.value = null
  disposeAllCharts()
  featureData.value = {}
  aggregatedData.value = {}
  isUsingDefaultCounts.value = false
  displayLocationCount.value = matchedLocations.value.length

  await loadCountsTask.run(async () => {
    // 調用 API
    const result = await getFeatureCounts({ locations: matchedLocations.value })

    // 存儲原始數據
    featureData.value = result || {}

    // 計算匯總數據
    aggregatedData.value = calculateAggregatedData(result || {})

    displayLocationCount.value = Object.keys(featureData.value).length || matchedLocations.value.length
  }, {
    onError: (err) => {
      console.error('加載失敗:', err)
      error.value = err.message || t('phonology.phonology.countphos.states.loadError')
    }
  })

  if (!error.value && Object.keys(aggregatedData.value).length > 0) {
    await renderAllCharts()
  }
}

// 計算匯總統計數據
const calculateAggregatedData = (data) => {
  const aggregated = {}

  // 遍歷每個地點的數據
  Object.keys(data || {}).forEach(locationName => {
    const locationData = data[locationName] || {}

    // 遍歷每個特徵類型（聲母/韻母/聲調）
    Object.keys(locationData).forEach(featureType => {
      if (!aggregated[featureType]) {
        aggregated[featureType] = {}
      }

      const features = locationData[featureType] || {}

      // 遍歷每個音節
      Object.keys(features).forEach(syllable => {
        const count = Number(features[syllable] || 0)
        if (count <= 0) return

        if (!aggregated[featureType][syllable]) {
          aggregated[featureType][syllable] = {
            totalCount: 0, // 總數量
            locationCount: 0, // 出現在多少個地點
            locations: [] // 具體哪些地點
          }
        }

        aggregated[featureType][syllable].totalCount += count
        aggregated[featureType][syllable].locationCount += 1
        aggregated[featureType][syllable].locations.push(locationName)
      })
    })
  })

  return normalizeAndFilterAggregatedData(aggregated)
}

const orderAggregatedData = (data = {}) => {
  return normalizeAndFilterAggregatedData(data)
}

const inferAggregatedLocationCount = (aggregated = {}) => {
  const locationSet = new Set()

  Object.values(aggregated || {}).forEach((features) => {
    Object.values(features || {}).forEach((stats) => {
      if (Array.isArray(stats?.locations)) {
        stats.locations.forEach((location) => {
          if (location) locationSet.add(location)
        })
      }
    })
  })

  return locationSet.size
}

// 打开地点详情弹窗
const openLocationModal = async (syllable, featureType, stats) => {
  const currentToken = ++modalOpenToken
  const locations = Array.isArray(stats?.locations) ? stats.locations : []
  const totalCount = Number(stats?.totalCount || 0)

  modalLoading.value = true
  modalLocationText.value = ''

  modalData.value = {
    syllable,
    featureType,
    locations: [],
    totalCount
  }

  showLocationModal.value = true

  await nextTick()
  await waitForPaint()

  if (currentToken !== modalOpenToken || !showLocationModal.value) return

  modalData.value = {
    syllable,
    featureType,
    locations,
    totalCount
  }

  modalLocationText.value = locations.join('、')

  await nextTick()

  if (currentToken !== modalOpenToken || !showLocationModal.value) return

  modalLoading.value = false
}

// 关闭弹窗
const closeLocationModal = () => {
  modalOpenToken += 1
  showLocationModal.value = false
  modalLoading.value = false
  modalLocationText.value = ''
}

onMounted(async () => {
  window.addEventListener('resize', resizeCharts)
  await loadDefaultCountsData()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  disposeAllCharts()
})
</script>

<template>
  <div class="phonology-page">
    <!-- <div class="page-header">
      <h2 class="page-title">🧮 音節統計</h2>
    </div> -->

    <!-- 地点输入组件 -->
    <div class="input-section">
      <LocationMultiInput
        v-model="queryStrings"
        @update:matchedLocations="handleMatchedLocations"
        @update:isMatching="handleIsMatching"
        :max-locations="PHONOLOGY_LOCATION_LIMITS.countphos"
      />
      <button
        class="load-btn"
        @click="loadData"
        :disabled="matchedLocations.length === 0 || loading || isMatching"
      >
        <span v-if="isMatching" class="ui-loading--inline" aria-hidden="true">↻</span>
        <span v-else-if="loading">{{ $t('phonology.phonology.countphos.actions.loading') }}</span>
        <span v-else>{{ $t('phonology.phonology.countphos.actions.query') }}</span>
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="ui-loading--page" aria-hidden="true"></div>
      <p>{{ $t('phonology.phonology.countphos.actions.loading') }}</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="loadData" class="retry-btn">
        {{ $t('phonology.phonology.countphos.actions.retry') }}
      </button>
    </div>

    <div v-else-if="hasResultData" class="results-container" :class="{ 'results-container--busy': isResultsBusy }">
      <div v-if="isResultsBusy" class="results-loading-overlay" aria-live="polite">
        <div class="ui-loading--page" aria-hidden="true"></div>
        <p>{{ $t('phonology.phonology.countphos.actions.loading') }}</p>
      </div>
      <!-- 匯總統計部分 -->
      <section class="aggregated-section">
        <!-- <h3 class="section-title">匯總統計</h3> -->
        <h3 class="section-title section-title--with-pill">
          <span>{{ $t('phonology.phonology.countphos.titlePrefix') }}</span>
          <span class="section-title-pill">{{ $t('phonology.phonology.countphos.locationPill', { count: displayLocationCount }) }}</span>
        </h3>

        <!-- 圖表統計部分 -->
        <div v-if="hasChartData" :id="getChartsAnchorId()" class="charts-section">
          <div class="chart-block">
            <h4 class="chart-block-title">{{ $t('phonology.phonology.countphos.charts.pie.title') }}</h4>
            <p class="chart-block-desc">
              {{ $t('phonology.phonology.countphos.charts.pie.description') }}
            </p>

            <div class="pie-chart-row">
              <div
                v-for="featureType in chartFeatureTypes"
                :key="`pie-${featureType}`"
                class="chart-card"
              >
                <h5 class="chart-title">{{ featureType }}</h5>
                <div
                  :ref="(el) => setChartRef('pie', featureType, el)"
                  class="echart-container pie-chart"
                ></div>
              </div>
            </div>
          </div>

          <div class="chart-block">
            <h4 class="chart-block-title">{{ $t('phonology.phonology.countphos.charts.bar.title') }}</h4>
            <p class="chart-block-desc">
              {{ $t('phonology.phonology.countphos.charts.bar.description') }}
            </p>

            <div class="bar-chart-list">
              <div
                v-for="featureType in chartFeatureTypes"
                :key="`bar-${featureType}`"
                class="chart-card chart-card--wide"
              >
                <h5 class="chart-title">
                  {{ featureType }}
                </h5>
                <div
                  :ref="(el) => setChartRef('bar', featureType, el)"
                  class="echart-container bar-chart"
                ></div>
              </div>
            </div>
          </div>

          <div class="chart-block">
            <h4 class="chart-block-title">{{ $t('phonology.phonology.countphos.charts.scatter.title') }}</h4>
            <p class="chart-block-desc">
              {{ $t('phonology.phonology.countphos.charts.scatter.description') }}
            </p>

            <div class="chart-card chart-card--wide">
              <h5 class="chart-title">總數量 × 地點覆蓋</h5>
              <div
                :ref="(el) => setScatterChartRef(el)"
                class="echart-container scatter-chart"
              ></div>
            </div>
          </div>
        </div>

        <div
          v-for="(features, featureType) in aggregatedData"
          :key="featureType"
          :id="getAggregatedAnchorId(featureType)"
          class="feature-category"
        >
          <h4 class="category-title">{{ featureType }}</h4>
          <div class="syllable-grid">
            <div
              v-for="(stats, syllable) in features"
              :key="syllable"
              class="syllable-card"
            >
              <div class="syllable-top">
                <div class="syllable-name">{{ syllable }}</div>
                <div class="syllable-stats">
                  <span class="stat-item">
                    <span class="stat-label">{{ $t('phonology.phonology.countphos.stats.total') }}:</span>
                    <span class="stat-value">{{ stats.totalCount }}</span>
                  </span>
                  <span class="stat-item">
                    <span class="stat-label">{{ $t('phonology.phonology.countphos.stats.locationCount') }}:</span>
                    <span class="stat-value">{{ stats.locationCount }}</span>
                  </span>
                </div>
              </div>
              <div class="location-tags">
                <!-- 显示前10个地点 -->
                <span
                  v-for="loc in stats.locations.slice(0, 10)"
                  :key="loc"
                  class="location-tag"
                >
                  {{ loc }}
                </span>
                <!-- 如果超过10个，显示展开按钮 -->
                <button
                  v-if="stats.locations.length > 10"
                  class="expand-btn"
                  @click="openLocationModal(syllable, featureType, stats)"
                >
                  {{ $t('phonology.phonology.countphos.stats.more', { count: stats.locations.length - 10 }) }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 地點詳情部分 -->
      <section v-if="hasLocationDetailData" class="locations-section">
        <h3 class="section-title">{{ $t('phonology.phonology.countphos.sections.locations') }}</h3>
        <p class="section-subtitle">
          {{ $t('phonology.phonology.countphos.sections.locationsSubtitle') }}
        </p>

        <div
          v-for="(locationData, locationName) in featureData"
          :key="locationName"
          :id="getLocationAnchorId(locationName)"
          class="location-detail"
        >
          <h4 class="location-name">{{ locationName }}</h4>

          <div
            v-for="(features, featureType) in locationData"
            :key="featureType"
            class="feature-group"
          >
            <h5 class="feature-type">{{ featureType }}</h5>
            <div class="feature-tags">
              <span
                v-for="(count, syllable) in features"
                :key="syllable"
                class="feature-tag"
              >
                <span class="tag-syllable">{{ syllable }}</span>
                <span class="tag-count">{{ count }}</span>
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div v-else class="empty">
      <p>{{ $t('phonology.phonology.countphos.states.emptyInput') }}</p>
      <p>{{ $t('phonology.phonology.countphos.states.hint') }}</p>
    </div>

    <CountLocationJumpNav
      v-if="isCurrentCountRoute && hasResultData && locationNavItems.length > 0"
      :items="locationNavItems"
      :follow-id="currentVisibleNavId"
      @jump="handleLocationNavJump"
    />

    <!-- 地点详情弹窗 -->
    <AppModal
      :model-value="showLocationModal"
      size="sm"
      :title="$t('phonology.phonology.countphos.modal.title', { featureType: modalData.featureType, syllable: modalData.syllable })"
      :close-label="t('common.button.close')"
      :z-index="20000"
      @update:modelValue="closeLocationModal"
    >
      <div class="modal-content-shell">
        <div v-if="modalLoading" class="modal-loading-block" aria-live="polite">
          <div class="ui-loading--page" aria-hidden="true"></div>
          <p>{{ $t('phonology.phonology.countphos.actions.loading') }}</p>
        </div>

        <template v-else>
          <div class="modal-stats">
            <span class="modal-stat-item">
              <span class="modal-stat-label">{{ $t('phonology.phonology.countphos.stats.total') }}:</span>
              <span class="modal-stat-value">{{ modalData.totalCount }}</span>
            </span>
            <span class="modal-stat-item">
              <span class="modal-stat-label">{{ $t('phonology.phonology.countphos.stats.locationCount') }}:</span>
              <span class="modal-stat-value">{{ modalData.locations.length }}</span>
            </span>
          </div>

          <div class="modal-locations-list">
            <span class="modal-location-text">
              {{ modalLocationText }}
            </span>
          </div>
        </template>
      </div>
    </AppModal>
  </div>
</template>

<style lang="scss" scoped>
.phonology-page {
  margin-top: 20px;
  min-width: 80dvw;

  .page-header {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 20px 0;
  }

  .page-title {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    color: var(--text-dark-light);
  }

  .input-section {
    max-width: 600px;
    margin: 0 auto 30px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    justify-content: center;
    align-items: center;
  }

  .load-btn {
    padding: 12px 24px;
    max-width: 100px;
    white-space: nowrap;
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
    color: var(--text-white);
    border: none;
    border-radius: var(--radius-md);
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px var(--color-primary-shadow), 0 2px 4px rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, var(--color-primary-hover) 0%, #004ba0 100%);
      box-shadow: 0 6px 16px var(--color-primary-shadow-light), 0 3px 6px rgba(0, 0, 0, 0.12);
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &:disabled {
      background: var(--bg-hover-medium);
      color: var(--text-secondary);
      cursor: not-allowed;
      box-shadow: none;
    }
  }

  .loading,
  .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50dvh;
    gap: 15px;
  }

  .loading {
    p {
      color: var(--text-secondary);
      font-size: 15px;
    }
  }

  .error {
    p {
      color: var(--color-error);
      font-size: 16px;
      font-weight: 500;
    }
  }

  .retry-btn {
    padding: 10px 20px;
    background: var(--color-primary);
    color: var(--text-white);
    border: none;
    border-radius: var(--radius-md);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: var(--shadow-md);

    &:hover {
      background: var(--color-primary-hover);
      box-shadow: var(--shadow-lg);
      transform: translateY(-1px);
    }
  }

  .results-container {
    position: relative;
    margin-top: 24px;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .results-container--busy {
    pointer-events: none;
  }

  .results-loading-overlay {
    position: absolute;
    inset: 0;
    z-index: 5;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 15px;
    border-radius: var(--radius-lg);
    background: rgba(255, 255, 255, 0.58);
    backdrop-filter: blur(10px);

    p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 15px;
    }
  }

  .section-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-dark);
    margin: 8px 0;
  }

  .section-title--with-pill {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .section-title-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 10px;
    border-radius: 999px;
    background: rgba(0, 122, 255, 0.12);
    color: var(--color-primary);
    font-size: 15px;
    font-weight: 700;
    line-height: 1.4;
    white-space: nowrap;
  }

  .section-subtitle {
    font-size: 14px;
    color: var(--text-dark-light);
    margin-bottom: 20px;
  }

  .aggregated-section,
  .locations-section {
    background: var(--glass-medium2);
    backdrop-filter: blur(12px);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-gray-light);
  }

  .aggregated-section {
    padding: 12px;
  }

  .charts-section {
    display: flex;
    flex-direction: column;
    gap: 24px;
    margin: 18px 0 28px;
  }

  .chart-block {
    background: rgba(255, 255, 255, 0.58);
    border: 1px solid rgba(0, 122, 255, 0.1);
    border-radius: 14px;
    padding: 16px;
    box-shadow: 0 10px 24px rgba(20, 38, 60, 0.04);
  }

  .chart-block-title {
    margin: 0 0 6px;
    font-size: 17px;
    font-weight: 700;
    color: var(--text-dark);
  }

  .chart-block-desc {
    margin: 0 0 14px;
    font-size: 13px;
    color: var(--text-dark-light);
    line-height: 1.6;
  }

  .pie-chart-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .bar-chart-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .chart-card {
    min-width: 0;
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid rgba(0, 122, 255, 0.1);
    border-radius: 12px;
    padding: 12px;
  }

  .chart-card--wide {
    width: 100%;
  }

  .chart-title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: #274b73;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .chart-title-note {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-primary);
    background: rgba(0, 122, 255, 0.1);
    border-radius: 999px;
    padding: 2px 8px;
  }

  .echart-container {
    width: 100%;
  }

  .pie-chart {
    height: 290px;
  }

  .bar-chart {
    height: 300px;
  }

  .scatter-chart {
    height: 420px;
  }

  .feature-category {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .category-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-dark);
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--border-gray-light);
  }

  .syllable-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }

  .syllable-card {
    background: var(--glass-very-light2);
    border: 1px solid var(--border-gray-lighter);
    border-radius: 8px;
    padding: 12px;
    transition: all 0.2s ease;

    &:hover {
      background: var(--glass-light2);
      transform: translateY(-2px);
      box-shadow: var(--shadow-sm);
    }
  }

  .syllable-name {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-dark);
    margin-bottom: 8px;
  }

  .syllable-stats {
    display: flex;
    gap: 12px;
    margin-bottom: 8px;
  }

  .stat-item {
    display: flex;
    gap: 4px;
    font-size: 13px;
  }

  .stat-label {
    color: var(--text-dark-light);
    white-space: nowrap;
  }

  .stat-value {
    color: var(--color-primary);
    font-weight: 600;
  }

  .location-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .location-tag {
    background: rgba(0, 122, 255, 0.1);
    color: var(--color-primary);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
  }

  .locations-section {
    padding: 24px;
  }

  .location-detail {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(247, 251, 255, 0.66));
    border: 1px solid rgba(0, 122, 255, 0.12);
    border-radius: 12px;
    padding: 18px;
    margin-bottom: 16px;
    box-shadow: 0 10px 24px rgba(20, 38, 60, 0.06);

    &:last-child {
      margin-bottom: 0;
    }
  }

  .location-name {
    font-size: 18px;
    font-weight: 700;
    color: var(--color-primary);
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(0, 122, 255, 0.12);
  }

  .feature-group {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .feature-type {
    font-size: 15px;
    font-weight: 700;
    color: #35679b;
    margin-bottom: 10px;
  }

  .feature-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .feature-tag {
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(0, 122, 255, 0.12);
    border-radius: 999px;
    padding: 6px 10px;
    display: inline-flex;
    gap: 8px;
    align-items: center;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.96);
      transform: translateY(-1px);
      box-shadow: 0 8px 18px rgba(0, 122, 255, 0.08);
    }
  }

  .tag-syllable {
    font-size: 14px;
    font-weight: 700;
    color: #274b73;
  }

  .tag-count {
    font-size: 12px;
    color: var(--color-primary);
    font-weight: 700;
    background: rgba(0, 122, 255, 0.12);
    padding: 2px 8px;
    border-radius: 999px;
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    color: var(--text-secondary);
    font-size: 16px;
    text-align: center;
    gap: 8px;

    p {
      margin: 0;
      line-height: 1.6;
    }
  }

  .expand-btn {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    background: linear-gradient(135deg, #007aff, #0051d5);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 6px rgba(0, 122, 255, 0.3);

    &:hover {
      background: linear-gradient(135deg, #0051d5, #003d9e);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 122, 255, 0.4);
    }

    &:active {
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    min-width: 0;

    .syllable-grid {
      grid-template-columns: 1fr;
      gap: 10px;
    }

    .syllable-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .location-tag {
      padding: 2px 4px;
    }

    .pie-chart-row {
      grid-template-columns: 1fr;
    }

    .chart-block {
      padding: 12px;
    }

    .pie-chart {
      height: 280px;
    }

    .bar-chart {
      height: 180px;
    }

    .scatter-chart {
      height: 360px;
    }
  }
}

.modal-content-shell {
  min-height: 160px;
}

.modal-loading-block {
  min-height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;

  p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 600;
  }
}

.modal-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 18px;
  padding: 14px 16px;
  border-radius: 18px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.72),
    rgba(245, 250, 255, 0.46)
  );
  border: 1px solid rgba(255, 255, 255, 0.65);
  box-shadow:
    0 12px 30px rgba(31, 78, 121, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(18px) saturate(1.35);
}

.modal-stat-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.48);
  border: 1px solid rgba(255, 255, 255, 0.56);
}

.modal-stat-label {
  font-size: 13px;
  color: rgba(37, 54, 74, 0.68);
  font-weight: 600;
}

.modal-stat-value {
  font-size: 17px;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: 0.02em;
  text-shadow: 0 1px 8px rgba(0, 122, 255, 0.16);
}

.modal-locations-list {
  margin-bottom: 20px;
  padding: 16px 18px;
  border-radius: 18px;
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.68),
    rgba(248, 251, 255, 0.42)
  );
  border: 1px solid rgba(255, 255, 255, 0.62);
  box-shadow:
    0 14px 34px rgba(20, 38, 60, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px) saturate(1.3);
}

.modal-location-text {
  display: block;
  font-size: 14px;
  line-height: 1.9;
  color: rgba(28, 43, 61, 0.86);
  font-weight: 500;
  letter-spacing: 0.015em;
  word-break: break-word;
  text-wrap: pretty;
}
</style>