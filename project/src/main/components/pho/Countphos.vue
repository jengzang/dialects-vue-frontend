<script setup>
import InlineIcon from '@/components/common/InlineIcon.vue'
import { ref, computed, nextTick, onMounted, onBeforeUnmount, onActivated, onDeactivated, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import * as echarts from 'echarts'
import { getFeatureCounts, getLocationDetail, getSyllableCounts } from '@/api'
import AppModal from '@/components/common/AppModal.vue'
import LocationDetailPopup from '@/main/components/geo/popups/LocationDetailPopup.vue'
import LocationAndRegionInput from '@/main/components/geo/LocationAndRegionInput.vue'
import CountLocationJumpNav from '@/main/components/pho/CountLocationJumpNav.vue'
import SwitchToggle from '@/components/common/SwitchToggle.vue'
import CheckBox from '@/components/selector/CheckBox.vue'
import { PHONOLOGY_LOCATION_LIMITS } from '@/main/config/constants.js'
import { mapStore, pendingCountphosLocations } from '@/main/store/store.js'
import { useAsyncTask } from '@/composables/core/useAsyncTask.js'
import { useNavAnchorJump } from '@/composables/bar/useNavAnchorJump.js'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import { requestMapFitView } from '@/utils/map/MapData.js'
import { showConfirm } from '@/utils/ui/message.js'
import all_feature_counts from '/data/feature_counts_20260624.json?url'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const loadCountsTask = useAsyncTask()
const loading = loadCountsTask.loading
const error = ref(null)
const matrixData = ref(null)
const countphosLocationQuery = ref({
  locations: [],
  regions: [],
  regionUsing: 'map'
})
const locationInputRef = ref(null)
const queryMode = ref({ featureCounts: true, syllableCounts: true })
const matchedLocations = ref([])
const isLocationInputDisabled = ref(true)
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
const syllableData = ref(null)
const syllableMode = ref('toneless')

//默认加载
const isUsingDefaultCounts = ref(false)
const displayLocationCount = ref(0)

const hasResultData = computed(() => {
  return Object.keys(featureData.value).length > 0 || Object.keys(aggregatedData.value).length > 0 || hasSyllableResultData.value
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
const isSingleLocation = computed(() => displayLocationCount.value === 1)
const isResultsBusy = computed(() => loading.value || rendering.value)
const isCurrentCountRoute = computed(() => route.path === '/menu/pho/count' || route.path.endsWith('/menu/pho/count'))
const isCountphosQueryEmpty = computed(() => {
  return (countphosLocationQuery.value.locations || []).length === 0 && (countphosLocationQuery.value.regions || []).length === 0
})

// 单/多地点判定:优先用输入组件已解析的地点数,未解析时回退到原始输入
const isSingleLocationQuery = computed(() => {
  const resolvedCount = Number(locationInputRef.value?.selectedCount || 0)
  if (resolvedCount > 0) return resolvedCount === 1

  const q = countphosLocationQuery.value
  const locs = Array.isArray(q.locations) ? q.locations : []
  const regs = Array.isArray(q.regions) ? q.regions : []
  return locs.length === 1 && regs.length === 0
})
const isMultiLocationQuery = computed(() => !isSingleLocationQuery.value)

// 多地点的两个统计方式互斥,且始终至少保留一个勾选
const handleQueryModeToggle = (mode, checked) => {
  if (checked) {
    if (mode === 'featureCounts') {
      queryMode.value.featureCounts = true
      if (isMultiLocationQuery.value) queryMode.value.syllableCounts = false
    } else {
      queryMode.value.syllableCounts = true
      if (isMultiLocationQuery.value) queryMode.value.featureCounts = false
    }
  } else if (mode === 'featureCounts' ? queryMode.value.syllableCounts : queryMode.value.featureCounts) {
    queryMode.value[mode] = false
  }
}

// 单地点默认两个都勾选;输入变为多地点且两个都勾选时只保留特徵統計
// 监听 isEmpty 组合:直接从空输入填多个地点时 isSingleLocationQuery 不会变化(false→false),需靠 isEmpty 翻转触发
watch([isSingleLocationQuery, isCountphosQueryEmpty], ([single, empty]) => {
  if (empty) return
  if (single) {
    queryMode.value.featureCounts = true
    queryMode.value.syllableCounts = true
  } else if (queryMode.value.featureCounts && queryMode.value.syllableCounts) {
    queryMode.value.syllableCounts = false
  }
})

const resolvedLocationCount = computed(() => {
  const metaCount = Number(syllableData.value?.meta?.locations_count || 0)
  if (metaCount > 0) return metaCount

  const pointCount = Array.isArray(syllableData.value?.points) ? syllableData.value.points.length : 0
  if (pointCount > 0) return pointCount

  return displayLocationCount.value || matchedLocations.value.length || 0
})

const canShowSyllableHeatmap = computed(() => resolvedLocationCount.value > 10)

const isTonedSyllableMode = computed({
  get: () => syllableMode.value === 'toned',
  set: (value) => {
    syllableMode.value = value ? 'toned' : 'toneless'
  }
})

const syllableModeLabel = computed(() => t(`phonology.phonology.countphos.syllables.modes.${syllableMode.value}`))

const currentSyllableSummary = computed(() => syllableData.value?.[syllableMode.value]?.aggregated || null)
const currentSyllableAggregated = computed(() => currentSyllableSummary.value?.syllables || {})
const hasSyllableResultData = computed(() => Object.keys(currentSyllableAggregated.value || {}).length > 0)

const syllableLocationData = computed(() => syllableData.value?.[syllableMode.value]?.locations || {})
const hasSyllableLocationData = computed(() => Object.keys(syllableLocationData.value).length > 0)
// 与声韵调独立的地点详情互斥,避免两个 section 渲染同一地点锚点 id 重复
const showSyllableLocations = computed(() => hasSyllableLocationData.value && !hasLocationDetailData.value)

const syllableStatsList = computed(() => {
  return Object.entries(currentSyllableAggregated.value || {})
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
})

const currentSyllableUniqueCount = computed(() => {
  const unique = Number(currentSyllableSummary.value?.unique_syllables || 0)
  return unique || syllableStatsList.value.length
})

// 卡片上限:默认只渲染前 100 张,避免大量卡片导致卡顿
const SYLLABLE_GRID_LIMIT = 100
const visibleSyllableLimit = ref(SYLLABLE_GRID_LIMIT)
const visibleSyllableStats = computed(() => syllableStatsList.value.slice(0, visibleSyllableLimit.value))
const hasMoreSyllables = computed(() => syllableStatsList.value.length > visibleSyllableLimit.value)

const loadAllSyllables = async () => {
  if (!hasMoreSyllables.value) return
  const confirmed = await showConfirm(t('phonology.phonology.countphos.syllables.loadAllConfirm'))
  if (confirmed) {
    visibleSyllableLimit.value = Number.POSITIVE_INFINITY
  }
}

// 切换带调/不带调或新数据加载后,重置为默认上限
watch(syllableStatsList, () => {
  visibleSyllableLimit.value = SYLLABLE_GRID_LIMIT
})

const {
  locationNavItems,
  currentVisibleNavId,
  getChartsAnchorId,
  getSyllableAnchorId,
  getAggregatedAnchorId,
  getLocationAnchorId,
  handleLocationNavJump
} = useNavAnchorJump({
  featureData,
  aggregatedData,
  hasChartData,
  hasResultData,
  extraLocationData: computed(() => (showSyllableLocations.value ? syllableLocationData.value : {})),
  hasSyllableData: hasSyllableResultData,
  syllableLabel: t('phonology.phonology.countphos.nav.syllableSummary'),
  isEnabled: isCurrentCountRoute,
  chartsLabel: t('phonology.phonology.countphos.nav.chartsLabel'),
  formatTotalLabel: (featureType) => {
    const map = {
      '聲母': t('phonology.phonology.countphos.nav.totalInitial'),
      '韻母': t('phonology.phonology.countphos.nav.totalFinal'),
      '聲調': t('phonology.phonology.countphos.nav.totalTone'),
    }
    return map[featureType] || featureType
  }
})

const visibleNavItems = computed(() => {
  if (!isSingleLocation.value) return locationNavItems.value
  return locationNavItems.value.filter((item) => item.kind !== 'total' && item.kind !== 'charts')
})

const handleRunDisabled = (disabled) => {
  isLocationInputDisabled.value = disabled
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
  if (!locations.length) return t('phonology.phonology.countphos.states.none')

  const preview = locations.slice(0, limit).join('、')
  return locations.length > limit ? `${preview}…` : preview
}

const isMobileChart = () => {
  return window.matchMedia?.('(max-aspect-ratio: 1 / 1)').matches || false
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
    syllableData.value = null
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

const buildCountRequestPayload = () => ({
  locations: Array.isArray(countphosLocationQuery.value.locations) ? countphosLocationQuery.value.locations : [],
  regions: Array.isArray(countphosLocationQuery.value.regions) ? countphosLocationQuery.value.regions : [],
  region_mode: countphosLocationQuery.value.regionUsing || 'map'
})

const loadData = async () => {
  if (isCountphosQueryEmpty.value) {
    error.value = t('phonology.phonology.countphos.states.minLocationError')
    return
  }

  // 多地点时两个都勾选 → 只请求特徵統計(互斥保底)
  if (isMultiLocationQuery.value && queryMode.value.featureCounts && queryMode.value.syllableCounts) {
    queryMode.value.syllableCounts = false
  }

  error.value = null
  disposeAllCharts()
  featureData.value = {}
  aggregatedData.value = {}
  syllableData.value = null
  isUsingDefaultCounts.value = false
  displayLocationCount.value = 0

  await loadCountsTask.run(async () => {
    const countRequestPayload = buildCountRequestPayload()
    const [result, syllableResult] = await Promise.all([
      queryMode.value.featureCounts ? getFeatureCounts(countRequestPayload) : Promise.resolve(undefined),
      queryMode.value.syllableCounts ? getSyllableCounts(countRequestPayload) : Promise.resolve(undefined)
    ])

    // 存儲原始數據
    featureData.value = result || {}
    syllableData.value = syllableResult || null

    // 計算匯總數據
    aggregatedData.value = calculateAggregatedData(result || {})

    displayLocationCount.value = resolvedLocationCount.value || Object.keys(featureData.value).length
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

// 地点详情弹窗
const locationPopup = ref({
  visible: false,
  locationName: '',
  data: null,
  loading: false
})

const handleLocationClick = async (locationName) => {
  if (!locationName) return

  locationPopup.value.visible = true
  locationPopup.value.locationName = locationName
  locationPopup.value.loading = true
  locationPopup.value.data = null

  try {
    const response = await getLocationDetail(locationName)
    locationPopup.value.data = response
  } catch (error) {
    console.error('查询地名数据失败:', error)
  } finally {
    locationPopup.value.loading = false
  }
}

// 关闭弹窗
const closeLocationModal = () => {
  modalOpenToken += 1
  showLocationModal.value = false
  modalLoading.value = false
  modalLocationText.value = ''
}

const isActive = ref(true)

const consumePendingCountphosLocations = () => {
  const pending = pendingCountphosLocations.value
  if (!Array.isArray(pending) || pending.length === 0) return

  const locations = pending.slice(0, PHONOLOGY_LOCATION_LIMITS.countphos)
  countphosLocationQuery.value = {
    locations: [...locations],
    regions: [],
    regionUsing: countphosLocationQuery.value.regionUsing || 'map'
  }
  matchedLocations.value = [...locations]
  isLocationInputDisabled.value = false
  pendingCountphosLocations.value = []

  loadData()
}

const openSyllableHeatmap = () => {
  if (!canShowSyllableHeatmap.value) return

  mapStore.mode = 'syllableHeatmap'
  mapStore.syllableHeatmapPayload = {
    toneMode: syllableMode.value,
    points: Array.isArray(syllableData.value?.points) ? syllableData.value.points : []
  }
  requestMapFitView()

  router.push({
    path: buildLocalePath(resolveRouteLocale(route), '/menu/map/view'),
    query: {
      mode: 'syllableHeatmap',
      toneMode: syllableMode.value
    }
  })
}

onMounted(async () => {
  window.addEventListener('resize', resizeCharts)

  if (pendingCountphosLocations.value.length > 0) {
    consumePendingCountphosLocations()
  } else {
    await loadDefaultCountsData()
  }
})

onActivated(() => {
  isActive.value = true
  if (pendingCountphosLocations.value.length > 0) {
    consumePendingCountphosLocations()
  }
})

onDeactivated(() => {
  isActive.value = false
})

watch(pendingCountphosLocations, () => {
  if (isActive.value) {
    consumePendingCountphosLocations()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  disposeAllCharts()
})
</script>

<template>
  <div class="phonology-page">
    <!-- <div class="page-header">
      <h2 class="page-title"><InlineIcon icon="🧮" />音節統計</h2>
    </div> -->

    <!-- 地点输入组件 -->
    <div class="input-section">
      <LocationAndRegionInput
        ref="locationInputRef"
        v-model="countphosLocationQuery"
        limit-context="countphos"
        @update:runDisabled="handleRunDisabled"
      />
      <div class="query-mode-row">
        <span class="query-mode-title">{{ $t('phonology.phonology.countphos.queryModes.title') }}</span>
        <CheckBox
          :model-value="queryMode.featureCounts"
          :label="$t('phonology.phonology.countphos.queryModes.featureCounts')"
          @change="(checked) => handleQueryModeToggle('featureCounts', checked)"
        />
        <CheckBox
          :model-value="queryMode.syllableCounts"
          :label="$t('phonology.phonology.countphos.queryModes.syllableCounts')"
          @change="(checked) => handleQueryModeToggle('syllableCounts', checked)"
        />
        <span
          v-if="!isCountphosQueryEmpty"
          class="query-mode-hint"
        >
          {{ isMultiLocationQuery
            ? $t('phonology.phonology.countphos.queryModes.multiHint')
            : $t('phonology.phonology.countphos.queryModes.singleHint') }}
        </span>
      </div>
      <button
        class="action-btn"
        @click="loadData"
        :disabled="isCountphosQueryEmpty || loading || isLocationInputDisabled"
      >
        <span v-if="loading">{{ $t('phonology.phonology.countphos.actions.loading') }}</span>
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
      <section v-if="!isSingleLocation && hasChartData" class="aggregated-section glass-panel">
        <!-- <h3 class="section-title">匯總統計</h3> -->
        <h3 class="section-title section-title--with-pill">
          <span>{{ $t('phonology.phonology.countphos.titlePrefix') }}</span>
          <span class="section-title-pill">{{ $t('phonology.phonology.countphos.locationPill', { count: displayLocationCount }) }}</span>
        </h3>

        <!-- 圖表統計部分 -->
        <div v-if="hasChartData" :id="getChartsAnchorId()" class="charts-section">
          <div class="chart-block glass-card">
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

          <div v-if="!isSingleLocation" class="chart-block glass-card">
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

          <div v-if="!isSingleLocation" class="chart-block glass-card">
            <h4 class="chart-block-title">{{ $t('phonology.phonology.countphos.charts.scatter.title') }}</h4>
            <p class="chart-block-desc">
              {{ $t('phonology.phonology.countphos.charts.scatter.description') }}
            </p>

            <div class="chart-card chart-card--wide">
              <h5 class="chart-title">{{ $t('phonology.phonology.countphos.charts.scatter.subtitle') }}</h5>
              <div
                :ref="(el) => setScatterChartRef(el)"
                class="echart-container scatter-chart"
              ></div>
            </div>
          </div>
        </div>

        <template v-if="!isSingleLocation">
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
                class="syllable-card glass-card"
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
        </template>
      </section>

      <section
        v-if="hasSyllableResultData"
        :id="getSyllableAnchorId()"
        class="syllable-section glass-panel"
      >
        <div class="syllable-section-header">
          <div>
            <h3 class="section-title">{{ $t('phonology.phonology.countphos.syllables.title') }}</h3>
            <p class="section-subtitle">
              {{ $t('phonology.phonology.countphos.syllables.subtitle') }}
            </p>
          </div>
          <div class="syllable-section-controls">
            <SwitchToggle
              v-model="isTonedSyllableMode"
              :active-text="$t('phonology.phonology.countphos.syllables.modes.toned')"
              :inactive-text="$t('phonology.phonology.countphos.syllables.modes.toneless')"
              :aria-label="$t('phonology.phonology.countphos.syllables.modeSwitch')"
              color="green"
              show-label
            />
          </div>
        </div>

        <div class="syllable-summary-row">
          <span class="summary-pill">
            <span class="stat-label">{{ $t('phonology.phonology.countphos.syllables.currentMode') }}:</span>
            <span class="stat-value">{{ syllableModeLabel }}</span>
          </span>
          <span class="summary-pill">
            <span class="stat-label">{{ $t('phonology.phonology.countphos.syllables.tokens') }}:</span>
            <span class="stat-value">{{ currentSyllableUniqueCount }}</span>
          </span>
          <button
            v-if="canShowSyllableHeatmap"
            class="expand-btn heatmap-btn"
            @click="openSyllableHeatmap"
          >
            {{ $t('phonology.phonology.countphos.syllables.viewHeatmap') }}
          </button>
        </div>

        <div class="syllable-grid">
          <div
            v-for="item in visibleSyllableStats"
            :key="`${syllableMode}-${item.syllable}`"
            class="syllable-card glass-card"
          >
            <div class="syllable-top">
              <div class="syllable-name">{{ item.syllable }}</div>
              <div class="syllable-stats">
                <span class="stat-item">
                  <span class="stat-label">{{ $t('phonology.phonology.countphos.stats.total') }}:</span>
                  <span class="stat-value">{{ item.totalCount }}</span>
                </span>
                <span class="stat-item">
                  <span class="stat-label">{{ $t('phonology.phonology.countphos.stats.locationCount') }}:</span>
                  <span class="stat-value">{{ item.locationCount }}</span>
                </span>
              </div>
            </div>
            <div class="location-tags">
              <!-- 显示前10个地点 -->
              <span
                v-for="loc in item.locations.slice(0, 10)"
                :key="loc"
                class="location-tag"
              >
                {{ loc }}
              </span>
              <!-- 如果超过10个，显示展开按钮 -->
              <button
                v-if="item.locations.length > 10"
                class="expand-btn"
                @click="openLocationModal(item.syllable, syllableModeLabel, item)"
              >
                {{ $t('phonology.phonology.countphos.stats.more', { count: item.locations.length - 10 }) }}
              </button>
            </div>
          </div>
        </div>

        <button
          v-if="hasMoreSyllables"
          class="load-more-btn"
          @click="loadAllSyllables"
        >
          {{ $t('phonology.phonology.countphos.syllables.loadMore') }}
        </button>
      </section>

      <!-- 地點詳情部分 -->
      <section v-if="hasLocationDetailData" class="locations-section glass-panel">
        <h3 class="section-title">{{ $t('phonology.phonology.countphos.sections.locations') }}</h3>
        <p class="section-subtitle">
          {{ $t('phonology.phonology.countphos.sections.locationsSubtitle') }}
        </p>

        <div
          v-for="(locationData, locationName) in featureData"
          :key="locationName"
          :id="getLocationAnchorId(locationName)"
          class="location-detail glass-card"
        >
          <h4 class="location-name" @click.stop="handleLocationClick(locationName)">{{ locationName }}</h4>

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

      <!-- 音節地點詳情 -->
      <section v-if="showSyllableLocations" class="locations-section glass-panel">
        <h3 class="section-title">{{ $t('phonology.phonology.countphos.sections.locations') }}</h3>
        <p class="section-subtitle">
          {{ $t('phonology.phonology.countphos.sections.locationsSubtitle') }}
        </p>

        <div
          v-for="(locationData, locationName) in syllableLocationData"
          :key="locationName"
          :id="getLocationAnchorId(locationName)"
          class="location-detail glass-card"
        >
          <h4 class="location-name" @click.stop="handleLocationClick(locationName)">{{ locationName }}</h4>

          <div class="feature-group">
            <h5 class="feature-type">{{ syllableModeLabel }}</h5>
            <div class="feature-tags">
              <span
                v-for="(count, syllable) in locationData.syllables"
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

    <LocationDetailPopup
      :visible="locationPopup.visible"
      :location-name="locationPopup.locationName"
      :data="locationPopup.data"
      :loading="locationPopup.loading"
      @close="locationPopup.visible = false"
    />

    <CountLocationJumpNav
      v-if="isCurrentCountRoute && hasResultData && visibleNavItems.length > 0"
      :items="visibleNavItems"
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

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;


$primary: var(--color-primary);
$primary-dark: var(--color-primary-hover);
$primary-deep: #003d9e;
.phonology-page {
  min-width: 80dvw;
  max-width: min(1000px, 98%);
  margin-top: 20px;

  /* 输入与查询 */
  .input-section {
    max-width: min(600px,90%);
    @include flex-col;
    align-items: center;
    justify-content: center;
    gap: 5px;
    margin: 0 auto 30px;
  }

  .query-mode-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .query-mode-title {
    font-weight: 600;
    color: var(--text-secondary);
  }

  .query-mode-hint {
    width: 100%;
    text-align: center;
    color: var(--text-secondary);
    font-size: 12px;
  }

  /* 页面加载与错误状态 */
  .loading,
  .error {
    min-height: 50dvh;
    @include flex-col;
    align-items: center;
    justify-content: center;
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
    border: none;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    color: var(--text-white);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: var(--color-primary-hover);
      box-shadow: var(--shadow-lg);
      transform: translateY(-1px);
    }
  }

  /* 结果区域 */
  .results-container {
    position: relative;
    @include flex-col;
    gap: 32px;
    margin-top: 24px;

    &--busy {
      pointer-events: none;
    }
  }

  .results-loading-overlay {
    position: absolute;
    inset: 0;
    z-index: 5;
    @include flex-col;
    align-items: center;
    justify-content: center;
    gap: 15px;
    background: var(--glass-60);
    border-radius: var(--radius-lg);
    backdrop-filter: blur(10px);

    p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 15px;
    }
  }

  /* 标题 */
  .section-title {
    display:flex;
    justify-content: center;
    margin: 8px 0;
    color: var(--text-dark);
    font-size: 20px;
    font-weight: 700;

    &--with-pill {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
  }

  .section-title-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 10px;
    background: rgba(var(--color-primary-rgb), 0.12);
    border-radius: var(--radius-pill);
    color: var(--color-primary);
    white-space: nowrap;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.4;
  }

  .section-subtitle {
    display:flex;
    justify-content: center;
    margin-bottom: 20px;
    color: var(--text-dark-light);
    font-size: 14px;
  }

  /* 汇总与地点详情玻璃容器 */
  .aggregated-section,
  .syllable-section,
  .locations-section {
    background: none;
    border: none;
    box-shadow: none;
    // border: 1px solid var(--border-gray-light);
    // border-radius: var(--radius-lg);
    // backdrop-filter: blur(12px);
  }

  .aggregated-section {
    padding: 12px;
  }

  .syllable-section {
    padding: 12px;
  }

  .syllable-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 14px;
  }

  .syllable-section-controls {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .syllable-summary-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    margin-bottom: 16px;
  }

  .summary-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    background: var(--glass-70);
    border: 1px solid var(--glass-60);
    border-radius: var(--radius-pill);
  }

  .syllable-card-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .locations-section {
    padding: 24px;
  }

  /* 图表区域 */
  .charts-section {
    @include flex-col;
    gap: 24px;
    margin: 18px 0 28px;
  }

  .chart-block {
    padding: 16px;
    // background: var(--glass-60);
    // border: 1px solid rgba(var(--color-primary-rgb), 0.1);
    // border-radius: 14px;
    // box-shadow: 0 10px 24px rgba(20, 38, 60, 0.04);
  }

  .chart-block-title {
    margin: 0 0 6px;
    color: var(--text-dark);
    font-size: 17px;
    font-weight: 700;
  }

  .chart-block-desc {
    margin: 0 0 14px;
    color: var(--text-dark-light);
    font-size: 13px;
    line-height: 1.6;
  }

  .pie-chart-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .bar-chart-list {
    @include flex-col;
    gap: 16px;
  }

  .chart-card {
    min-width: 0;
    padding: 12px;
    background: var(--glass-80);
    border: 1px solid rgba(var(--color-primary-rgb), 0.1);
    border-radius: var(--radius-md);

    &--wide {
      // width: 100%;
    }
  }

  .chart-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    color: var(--color-primary-hover);
    font-size: 15px;
    font-weight: 700;
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

  /* 汇总分类 */
  .feature-category {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .category-title {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--border-gray-light);
    color: var(--text-dark);
    font-size: 18px;
    font-weight: 600;
  }

  .syllable-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 10px;
  }

  .syllable-card {
    padding: 12px;
    background: var(--glass-60);
    // border: 1px solid var(--border-gray-lighter);
    // border-radius: var(--radius-sm2);
    transition: all 0.2s ease;

    &:hover {
      background: var(--glass-90);
      box-shadow: var(--shadow-sm);
      transform: translateY(-2px);
    }
  }

  .syllable-name {
    margin-bottom: 8px;
    color: var(--text-dark);
    font-size: 20px;
    font-weight: 700;
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
    padding: 2px 8px;
    background: rgba(var(--color-primary-rgb), 0.1);
    border-radius: var(--radius-xs);
    color: var(--color-primary);
    font-size: 12px;
  }

  .expand-btn {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    background: linear-gradient(135deg, $primary, $primary-dark);
    border: none;
    border-radius: var(--radius-md);
    box-shadow: 0 2px 6px rgba(var(--color-primary-rgb), 0.3);
    color: var(--action-primary-text);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: linear-gradient(
        135deg,
        $primary-dark,
        $primary-deep
      );
      box-shadow: 0 4px 8px rgba(var(--color-primary-rgb), 0.4);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .heatmap-btn {
    background: var(--color-success);
    box-shadow: 0 2px 6px rgba(var(--color-primary-rgb), 0.18);

    &:hover {
      background: var(--color-success-hover, var(--color-success));
      box-shadow: var(--shadow-sm);
    }
  }

  .load-more-btn {
    display: block;
    margin: 16px auto 0;
    padding: 10px 24px;
    background: linear-gradient(135deg, $primary, $primary-dark);
    border: none;
    border-radius: var(--radius-md);
    box-shadow: 0 2px 6px rgba(var(--color-primary-rgb), 0.3);
    color: var(--action-primary-text);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: linear-gradient(
        135deg,
        $primary-dark,
        $primary-deep
      );
      box-shadow: 0 4px 8px rgba(var(--color-primary-rgb), 0.4);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }
  }

  /* 单地点详情 */
  .location-detail {
    margin-bottom: 16px;
    padding: 18px;
    // border: 1px solid rgba(var(--color-primary-rgb), 0.12);
    // border-radius: var(--radius-md);
    box-shadow: 0 10px 24px rgba(20, 38, 60, 0.06);

    &:last-child {
      margin-bottom: 0;
    }
  }

  .location-name {
    display: flex;
    justify-content: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(var(--color-primary-rgb), 0.12);
    color: var(--color-primary);
    font-size: 20px;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s ease;

    &::after {
      display: flex;
      content: '\00A0🔍';
      align-items: center;
      font-size: 0.7em;
    }

    &:hover {
      color: var(--color-primary-hover);
      scale: (1.1);
      // text-decoration: underline;
    }
  }

  .feature-group {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .feature-type {
    margin-bottom: 10px;
    color: var(--color-primary);
    font-size: 15px;
    font-weight: 700;
  }

  .feature-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .feature-tag {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background: var(--glass-90);
    border: 1px solid rgba(var(--color-primary-rgb), 0.12);
    border-radius: var(--radius-pill);
    transition: all 0.2s ease;

    &:hover {
      background: var(--glass-90);
      box-shadow: 0 8px 18px rgba(var(--color-primary-rgb), 0.08);
      transform: translateY(-1px);
    }
  }

  .tag-syllable {
    color: var(--color-primary-hover);
    font-size: 14px;
    font-weight: 700;
  }

  .tag-count {
    padding: 2px 8px;
    background: rgba(var(--color-primary-rgb), 0.12);
    border-radius: var(--radius-pill);
    color: var(--color-primary);
    font-size: 12px;
    font-weight: 700;
  }

  /* 空状态 */
  .empty {
    @include flex-col;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--text-secondary);
    text-align: center;
    font-size: 16px;

    p {
      margin: 0;
      line-height: 1.6;
    }
  }

  /* 移动端 */
  @media (max-aspect-ratio: #{1 / 1}) {
    min-width: 0;

    .syllable-section-header {
      @include flex-col;
      align-items: center;
    }

    .syllable-grid {
      grid-template-columns: 1fr;
      gap: 10px;
    }

    .syllable-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .location-tag {
      padding: 2px 4px;
    }

    .pie-chart-row {
      grid-template-columns: 1fr;
    }

    .chart-block {
      padding: 8px;
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

/* 地点详情弹窗 */
.modal-content-shell {
  min-height: 160px;
}

.modal-loading-block {
  min-height: 160px;
  @include flex-col;
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
  background: linear-gradient(
    135deg,
    var(--glass-70),
    rgba(245, 250, 255, 0.46)
  );
  border: 1px solid var(--glass-70);
  border-radius: 18px;
  box-shadow:
    0 12px 30px rgba(31, 78, 121, 0.12),
    inset 0 1px 0 var(--glass-90);
  backdrop-filter: blur(18px) saturate(1.35);
}

.modal-stat-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  background: var(--glass-50);
  border: 1px solid var(--glass-60);
  border-radius: var(--radius-pill);
}

.modal-stat-label {
  color: rgba(37, 54, 74, 0.68);
  font-size: 13px;
  font-weight: 600;
}

.modal-stat-value {
  color: var(--color-primary);
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 8px rgba(var(--color-primary-rgb), 0.16);
}

.modal-locations-list {
  margin-bottom: 20px;
  padding: 16px 18px;
  background: linear-gradient(
    145deg,
    var(--glass-70),
    rgba(248, 251, 255, 0.42)
  );
  border: 1px solid var(--glass-60);
  border-radius: 18px;
  box-shadow:
    0 14px 34px rgba(20, 38, 60, 0.1),
    inset 0 1px 0 var(--glass-90);
  backdrop-filter: blur(18px) saturate(1.3);
}

.modal-location-text {
  display: block;
  color: rgba(28, 43, 61, 0.86);
  word-break: break-word;
  text-wrap: pretty;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.9;
  letter-spacing: 0.015em;
}
</style>
