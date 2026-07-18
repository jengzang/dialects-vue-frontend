<template>
  <div class="evolution-page">
    <!-- 控制面板 -->
    <div class="main-glass-panel" data-panel="control">
      <!-- 统计模式选择 -->
      <div class="control-row">
        <label class="control-label">{{ t('phonology.phonology.evolution.queryMode.label', '统计模式') }}：</label>
        <div class="mode-selector">
          <RadioGroup
            v-model="queryMode"
            :options="queryModeOptions"
            name="evolution-query-mode"
            class="query-mode-radio"
          />

          <CheckBox
            v-model="showSankey"
            :label="t('phonology.phonology.evolution.controls.sankey')"
          />

          <CheckBox
            v-model="optimizeSankeyLayout"
            :label="t('phonology.phonology.evolution.controls.optimizeLinks')"
          />
        </div>
      </div>

      <div class="dimension-grid">
        <div class="dimension-field">
          <label class="control-label dimension-label">{{ t('phonology.phonology.evolution.controls.table') }}：</label>
          <SimpleSelectDropdown
            v-model="selectedTable"
            :options="tableOptions"
            class="control-select dimension-select"
          />
        </div>

        <div class="dimension-field">
          <label class="control-label dimension-label">{{ t('phonology.phonology.evolution.controls.level1') }}：</label>
          <SimpleSelectDropdown
            v-model="level1Column"
            :options="availableColumns"
            :placeholder="t('phonology.phonology.evolution.controls.level1')"
            :disabled="!selectedTable"
            class="control-select dimension-select"
          />
        </div>

        <div class="dimension-field">
          <label class="control-label dimension-label">{{ t('phonology.phonology.evolution.controls.level2') }}：</label>
          <SimpleSelectDropdown
            v-model="level2Column"
            :options="level2Options"
            :placeholder="t('phonology.phonology.evolution.controls.level2')"
            :disabled="!level1Column"
            class="control-select dimension-select"
          />
        </div>
      </div>

      <!-- 地点输入 -->
      <div class="control-row">
        <!-- <label class="control-label">{{ t('phonology.phonology.evolution.controls.location') }}：</label> -->
        <div class="control-input-wrapper">
          <LocationMultiInput
            v-model="selectedLocations"
            :max-locations="PHONOLOGY_LOCATION_LIMITS.evolution"
            @update:matched-locations="handleMatchedLocations"
            @update:is-matching="handleIsMatching"
            class="control-input"
          />
          <div class="input-hint">{{ t('phonology.phonology.evolution.controls.locationHint') }}</div>
        </div>
      </div>

      <!-- 查询按钮 -->
      <div class="control-row control-row--query">
        <button
          @click="handleQuery"
          :disabled="isLoading || isMatching || !canQuery"
          class="query-button"
        >
          {{ isLoading ? t('phonology.phonology.evolution.controls.loading') : t('phonology.phonology.evolution.controls.query') }}
        </button>
      </div>

      <!-- 错误提示 -->
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
    </div>

    <!-- Tab切换 -->
    <div v-if="rawData" class="feature-tabs">
      <button
        v-for="feature in features"
        :key="feature"
        @click="currentFeature = feature"
        :class="['feature-tab', { active: currentFeature === feature }]"
      >
        {{ feature }} ({{ pieCountByFeature[feature] || 0 }})
      </button>

      <div v-if="currentDataLocationName" class="feature-tabs-location">
        📍 {{ currentDataLocationName }}
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading && !rawData" class="loading-state">
      <div class="ui-loading--page" aria-hidden="true"></div>
      <p>{{ t('phonology.phonology.evolution.states.loading') }}</p>
    </div>

    <!-- 饼图展示区域 -->
    <div
      v-else-if="rawData && currentPieData.length > 0"
      class="pie-container"
      :class="{
        'has-mobile-detail-card': showMobilePieDetailCard,
        'is-rendering': isLoading
      }"
    >
      <div
        v-if="isLoading"
        class="visualization-rendering-mask"
      >
        <div class="ui-loading--page" aria-hidden="true"></div>
      </div>

      <div
        v-if="showSankey"
        ref="sankeyContainerRef"
        class="sankey-chart"
        :style="{ height: sankeyHeight }"
      ></div>

      <div v-else class="pie-grid" :style="gridStyle" ref="pieGridRef">
        <div
          v-for="(pie, index) in currentPieData"
          :key="index"
          class="pie-item"
          :data-index="index"
        >
          <div class="pie-chart" :data-pie-index="index"></div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="rawData && currentPieData.length === 0" class="empty-state">
      <p>{{ t('phonology.phonology.evolution.states.empty') }}</p>
    </div>

    <HoverDetailCard
      :visible="(showSankey ? Boolean(selectedSankeyDetail) : Boolean(selectedPieDetail))"
      :is-mobile-layout="isMobileLayout"
      :is-pinned="isCardPinned"
      :desktop-card-position="desktopCardPosition"
      @close="closeMobilePieDetail"
    >
      <template #header>
        <template v-if="showSankey && selectedSankeyDetail">
          <div class="mobile-detail-card__meta">
            <div class="mobile-detail-card__title-row">
              <div class="mobile-detail-card__title">{{ selectedSankeyDetail.title }}</div>
              <div class="mobile-detail-card__section-title">
                {{ selectedSankeyDetail.layerLabel }}
              </div>
            </div>
            <div class="mobile-detail-card__subtitle">
              {{ selectedSankeyDetail.subtitle }}
            </div>
          </div>
        </template>
        <template v-else>
          <div class="mobile-detail-card__meta">
            <div class="mobile-detail-card__title-row">
              <div class="mobile-detail-card__title">{{ selectedPieDetail?.title }}</div>
              <div class="mobile-detail-card__section-title">
                {{ t('phonology.phonology.evolution.mobileDetail.breakdownBy', { dimension: level2Column }) }}
              </div>
            </div>
            <div class="mobile-detail-card__subtitle">
              {{ selectedPieDetail?.pieTitle }} ·
              {{ t('phonology.phonology.evolution.mobileDetail.countAndRatio', {
                count: selectedPieDetail?.count,
                unit: t('phonology.phonology.evolution.sankey.unit'),
                percent: selectedPieDetail?.percent
              }) }}
            </div>
          </div>
        </template>
      </template>

      <template v-if="showSankey && selectedSankeyDetail">
        <div class="mobile-detail-card__section">
          <div class="mobile-detail-card__chars mobile-detail-card__chars--standalone">
            {{ selectedSankeyDetail.displayChars.join('、') }}
            <template v-if="selectedSankeyDetail.remainingChars > 0">
              {{ t('phonology.phonology.evolution.mobileDetail.moreChars', { count: selectedSankeyDetail.remainingChars }) }}
            </template>
          </div>
        </div>
      </template>
      <template v-else>
        <div
          v-if="selectedPieDetail?.level2Items.length > 0"
          class="mobile-detail-card__section"
        >
          <div
            v-for="level2Item in selectedPieDetail.level2Items"
            :key="`${selectedPieDetail.key}-${level2Item.label}`"
            class="mobile-detail-card__item"
          >
            <div class="mobile-detail-card__item-row">
              <span class="mobile-detail-card__item-label">{{ level2Item.label }}</span>
              <span class="mobile-detail-card__item-value">
                {{ t('phonology.phonology.evolution.mobileDetail.countAndRatio', {
                  count: level2Item.count,
                  unit: t('phonology.phonology.evolution.sankey.unit'),
                  percent: level2Item.percent
                }) }}
              </span>
            </div>
            <div v-if="level2Item.displayChars.length > 0" class="mobile-detail-card__chars">
              {{ t('phonology.phonology.evolution.mobileDetail.characters') }}：
              {{ level2Item.displayChars.join('、') }}
              <template v-if="level2Item.remainingChars > 0">
                {{ t('phonology.phonology.evolution.mobileDetail.moreChars', { count: level2Item.remainingChars }) }}
              </template>
            </div>
          </div>
        </div>

        <div
          v-else-if="selectedPieDetail?.displayChars.length > 0"
          class="mobile-detail-card__section"
        >
          <div class="mobile-detail-card__section-title">
            {{ t('phonology.phonology.evolution.mobileDetail.characters') }}
          </div>
          <div class="mobile-detail-card__chars mobile-detail-card__chars--standalone">
            {{ selectedPieDetail.displayChars.join('、') }}
            <template v-if="selectedPieDetail.remainingChars > 0">
              {{ t('phonology.phonology.evolution.mobileDetail.moreChars', { count: selectedPieDetail.remainingChars }) }}
            </template>
          </div>
        </div>
      </template>
    </HoverDetailCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import * as echarts from 'echarts'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import RadioGroup from '@/components/selector/RadioGroup.vue'
import CheckBox from '@/components/selector/CheckBox.vue'
import HoverDetailCard from '@/components/ToastAndHelp/HoverDetailCard.vue'
import { resolveHoverDetailCardPosition } from '@/utils/EchartHover/hoverDetailCardPosition.js'
import LocationMultiInput from '../geo/LocationMultiInput.vue'
import { postPhoPieByValue, postPhoPieByStatus } from '@/api'
import { PHONOLOGY_LOCATION_LIMITS } from '@/main/config/constants.js'
import { TABLE_COLUMN_SCHEMAS } from '../../config/chars_positions/characters.js'
import { userStore } from '@/main/store/store.js'
import { showWarning } from '@/utils/ui/message.js'
import { buildEvolutionMobileDetail, isSameEvolutionMobileDetail } from '@/utils/EchartHover/evolutionDetail.js'
import { useRouteQueryState } from '@/composables/router/useRouteQueryState.js'
import {
  encodeQueryValueBase64Url,
  parseLocationsFromUrl
} from '@/utils/urlParams.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const MOBILE_LAYOUT_MEDIA_QUERY = '(max-aspect-ratio: 1/1)'

const EVOLUTION_LOCATION_LIMIT = PHONOLOGY_LOCATION_LIMITS.evolution

const parseEvolutionLocationQuery = (value) => {
  return parseLocationsFromUrl(
    {
      query: {
        loc: value
      }
    },
    {
      limit: EVOLUTION_LOCATION_LIMIT
    }
  )
}

const serializeEvolutionLocationQuery = (locations) => {
  if (!Array.isArray(locations)) return []

  return locations
    .filter(Boolean)
    .slice(0, EVOLUTION_LOCATION_LIMIT)
    .map((location) => encodeQueryValueBase64Url(location))
}

const { state: locationQuery, set: setLocationQuery } = useRouteQueryState('loc', {
  defaultValue: [],
  parse: parseEvolutionLocationQuery,
  serialize: serializeEvolutionLocationQuery,
  replace: true,
  removeIf: (locations) => !Array.isArray(locations) || locations.length === 0,
})

// ========== 响应式数据 ==========
// 查询参数
const queryMode = ref('by_value')
const selectedTable = ref('characters')
const level1Column = ref('')
const level2Column = ref('')
const selectedLocations = ref([...locationQuery.value])
const matchedLocations = ref([])
const showSankey = ref(false)
const optimizeSankeyLayout = ref(false)

// 查询状态
const isLoading = ref(false)
const isMatching = ref(false)
const errorMessage = ref('')
const rawData = ref(null)
const hasQueriedRealData = ref(false)
const pendingUrlAutoQuery = ref(false)

// 当前展示
const features = ['聲母', '韻母', '聲調']
const currentFeature = ref('聲母')

// 饼图容器
const pieGridRef = ref(null)
const sankeyContainerRef = ref(null)
const chartInstances = ref([])
const sankeyChartInstance = ref(null)
const containerWidth = ref(1200)
const sankeyHeight = ref('680px')
const isMobileLayout = ref(false)
const selectedPieDetail = ref(null)
const selectedSankeyDetail = ref(null)

const desktopCardPosition = ref({ left: '0px', top: '0px' })
const isCardPinned = ref(false)

// ========== 配置数据 ==========
const tableOptions = [
  { value: 'characters', label: '中古音（廣韻）' },
  { value: 'fenyun', label: '分韻撮要' },
  { value: 'hongwu', label: '洪武正韻' },
  { value: 'menggu', label: '蒙古字韻' },
  { value: 'old_chinese', label: '上古音' },
  { value: 'zhongyuan', label: '中原音韻' }
]

// ========== 计算属性 ==========
const queryModeOptions = computed(() => [
  {
    value: 'by_value',
    label: t('phonology.phonology.evolution.queryMode.byValue')
  },
  {
    value: 'by_status',
    label: t('phonology.phonology.evolution.queryMode.byStatus')
  }
])

const availableColumns = computed(() => {
  const schema = TABLE_COLUMN_SCHEMAS[selectedTable.value]
  const keys = schema?.ui?.available_keys || []
  return keys.map(key => ({ label: key, value: key }))
})

const level2Options = computed(() => {
  return availableColumns.value.filter(option => option.value !== level1Column.value)
})

const currentPieData = computed(() => {
  if (!rawData.value?.data) return []
  return rawData.value.data[currentFeature.value] || []
})

const pieCountByFeature = computed(() => {
  if (!rawData.value?.data) return {}
  return {
    聲母: rawData.value.data.聲母?.length || 0,
    韻母: rawData.value.data.韻母?.length || 0,
    聲調: rawData.value.data.聲調?.length || 0
  }
})

const currentDataLocationName = computed(() => {
  const locations = Array.isArray(rawData.value?.locations)
    ? rawData.value.locations.slice(0, EVOLUTION_LOCATION_LIMIT)
    : []

  return locations[0] || ''
})

const showMobilePieDetailCard = computed(() => {
  return isMobileLayout.value && !showSankey.value && Boolean(selectedPieDetail.value)
})

const canQuery = computed(() => {
  return matchedLocations.value.length > 0 &&
    level1Column.value &&
    level2Column.value &&
    level1Column.value !== level2Column.value
})

const gridLayout = computed(() => {
  const pieCount = currentPieData.value.length
  if (pieCount === 0) return { cols: 0, rows: 0 }

  let cols
  const containerW = containerWidth.value

  if (containerW <= 480) {
    cols = 1
  } else if (containerW <= 768) {
    cols = 2
  } else {
    if (pieCount <= 4) cols = 2
    else if (pieCount <= 9) cols = 3
    else if (pieCount <= 16) cols = 4
    else if (pieCount <= 25) cols = 5
    else cols = 6
  }

  const rows = Math.ceil(pieCount / cols)
  return { cols, rows }
})

const pieSize = computed(() => {
  const { cols } = gridLayout.value
  if (cols === 0) return 200
  const containerW = containerWidth.value
  const gap = 20
  const size = (containerW - (cols + 1) * gap) / cols
  return Math.max(200, Math.min(280, size))
})

const gridStyle = computed(() => {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fit, minmax(${pieSize.value}px, 1fr))`,
    gap: '20px',
    padding: '5px',
    justifyContent: 'center'
  }
})

const demoDataCache = {
  byStatus: null,
  byValue: null,
}

const loadDemoData = async (mode) => {
  const cacheKey = mode === 'by_value' ? 'byValue' : 'byStatus'
  if (demoDataCache[cacheKey]) {
    return demoDataCache[cacheKey]
  }

  const fileName = mode === 'by_value'
    ? 'evolution_demo_value.json'
    : 'evolution_demo_status.json'
  const response = await fetch(`/data/${fileName}`)
  if (!response.ok) {
    throw new Error(`Failed to load demo data: ${response.status}`)
  }

  const data = await response.json()
  demoDataCache[cacheKey] = data
  return data
}

const getDemoData = async () => loadDemoData(queryMode.value)

const syncControlsFromData = (data, { syncLocations = true } = {}) => {
  if (syncLocations) {
    const locations = Array.isArray(data.locations)
      ? data.locations.slice(0, EVOLUTION_LOCATION_LIMIT)
      : []

    selectedLocations.value = [...locations]
    matchedLocations.value = [...locations]
  }

  selectedTable.value = data.table_name || 'characters'
  level1Column.value = data.level1_column || ''
  level2Column.value = data.level2_column || ''
}

const handleMatchedLocations = (locations) => {
  matchedLocations.value = Array.isArray(locations)
    ? locations.slice(0, EVOLUTION_LOCATION_LIMIT)
    : []
}

const handleIsMatching = (matching) => {
  isMatching.value = matching
}

const getInitialFeature = (data) => {
  const featureKeys = Object.keys(data?.data || {})
  return features.find(feature => featureKeys.includes(feature) && (data.data[feature]?.length || 0) > 0) || features[0]
}

const applyDemoData = async ({ syncLocations = locationQuery.value.length === 0 } = {}) => {
  const demoData = await getDemoData()
  closeMobilePieDetail()
  syncControlsFromData(demoData, { syncLocations })
  currentFeature.value = getInitialFeature(demoData)
  rawData.value = demoData
  errorMessage.value = ''

  await nextTick()
  updateContainerSize()
  await renderCurrentVisualization()
}

const handleQuery = async () => {
  if (!userStore.isAuthenticated) {
    showWarning(t('user.dataPage.messages.authRequired'))
    router.push(buildLocalePath(resolveRouteLocale(route), '/auth'))
    return
  }

  if (!matchedLocations.value.length) {
    errorMessage.value = t('phonology.phonology.evolution.errors.minLocation')
    return
  }
  if (matchedLocations.value.length > 1) {
    errorMessage.value = t('phonology.phonology.evolution.errors.maxLocation')
    return
  }
  if (!level1Column.value || !level2Column.value) {
    errorMessage.value = t('phonology.phonology.evolution.errors.selectDimensions')
    return
  }
  if (level1Column.value === level2Column.value) {
    errorMessage.value = t('phonology.phonology.evolution.errors.sameDimensions')
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  let shouldRefreshVisualization = false

  try {
    const params = {
      locations: matchedLocations.value.slice(0, EVOLUTION_LOCATION_LIMIT),
      level1_column: level1Column.value,
      level2_column: level2Column.value,
      table_name: selectedTable.value
    }

    const apiCall = queryMode.value === 'by_value'
      ? postPhoPieByValue
      : postPhoPieByStatus

    const response = await apiCall(params)
    const responseData = response || {}

    rawData.value = {
      ...responseData,
      locations: Array.isArray(responseData.locations) && responseData.locations.length > 0
        ? responseData.locations.slice(0, EVOLUTION_LOCATION_LIMIT)
        : params.locations.slice(0, EVOLUTION_LOCATION_LIMIT)
    }

    hasQueriedRealData.value = true
    closeMobilePieDetail()
    currentFeature.value = getInitialFeature(rawData.value)
    await setLocationQuery(matchedLocations.value.slice(0, EVOLUTION_LOCATION_LIMIT))
    shouldRefreshVisualization = true
  } catch (error) {
    errorMessage.value = error.message || t('phonology.phonology.evolution.errors.queryFailed')
    console.error('Query error:', error)
  } finally {
    if (shouldRefreshVisualization) {
      await renderCurrentVisualizationWithLoading()
    } else {
      isLoading.value = false
    }
  }
}

// ========== 容器尺寸更新 ==========
const updateContainerSize = () => {
  if (showSankey.value && sankeyContainerRef.value) {
    const rect = sankeyContainerRef.value.getBoundingClientRect()
    containerWidth.value = rect.width || 1200
    return
  }

  if (pieGridRef.value) {
    const rect = pieGridRef.value.getBoundingClientRect()
    containerWidth.value = rect.width || 1200
  }
}

const clearPieCharts = () => {
  chartInstances.value.forEach(chart => chart?.dispose())
  chartInstances.value = []
}

const clearSankeyChart = () => {
  sankeyChartInstance.value?.dispose()
  sankeyChartInstance.value = null
}

const closeMobilePieDetail = () => {
  selectedPieDetail.value = null
  selectedSankeyDetail.value = null
  isCardPinned.value = false
}

const updateMobileLayout = () => {
  if (typeof window === 'undefined') {
    return
  }

  isMobileLayout.value = window.matchMedia(MOBILE_LAYOUT_MEDIA_QUERY).matches
}

const waitForPaint = () =>
  new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve)
    })
  })

// ========== 饼图渲染 ==========
const generatePieChartOption = (pieData) => {
  const isByValue = queryMode.value === 'by_value'
  const title = isByValue ? pieData.value : pieData.level1_value
  const total = pieData.total
  const items = isByValue ? pieData.level1 : pieData.phonetic_values

  if (!items) return null

  return {
    animation: false,
    title: {
      text: title,
      subtext: `${total}条`,
      left: 'center',
      top: 'center',
      itemGap: 4,
      textStyle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        lineHeight: 14
      },
      subtextStyle: {
        fontSize: 11,
        color: '#666'
      }
    },
    tooltip: {
      show: false // 彻底移除自带 tooltip
    },
    // tooltip: {
    //   show: !isMobileLayout.value,
    //   trigger: 'item',
    //   triggerOn: isMobileLayout.value ? 'none' : 'mousemove|click',
    //   confine: true,
    //   formatter: (params) => {
    //     const item = items[params.dataIndex]
    //     if (!item) return ''
    //
    //     let html = `<div style="padding: 8px;">
    //       <div style="font-weight: bold; margin-bottom: 6px;">
    //         ${params.name}: ${item.count}条 (${item.percent}%)
    //       </div>`
    //
    //     if (item.level2 && item.level2.length > 0) {
    //       html += `<div style="border-top: 1px solid var(--border-divider); margin: 6px 0; padding-top: 6px;">
    //         <div style="font-size: 12px; color: var(--text-tertiary); margin-bottom: 4px;">
    //           细分（按${level2Column.value}）：
    //         </div>`
    //
    //       item.level2.forEach(l2 => {
    //         html += `<div style="margin-left: 8px; font-size: 11px;">
    //           • ${l2.label}：${l2.count} (${l2.percent}%)
    //         </div>`
    //
    //         if (l2.chars && l2.chars.length > 0) {
    //           const displayChars = l2.chars.slice(0, 10)
    //           const remaining = l2.chars.length - displayChars.length
    //           html += `<div style="margin-left: 16px; font-size: 10px; color: var(--text-muted);">
    //             字：${displayChars.join('、')}${remaining > 0 ? ` +${remaining}个` : ''}
    //           </div>`
    //         }
    //       })
    //
    //       html += `</div>`
    //     } else if (item.chars && item.chars.length > 0) {
    //       const displayChars = item.chars.slice(0, 15)
    //       const remaining = item.chars.length - displayChars.length
    //       html += `<div style="border-top: 1px solid var(--border-divider); margin: 6px 0; padding-top: 6px; font-size: 11px;">
    //         字：${displayChars.join('、')}${remaining > 0 ? ` +${remaining}个` : ''}
    //       </div>`
    //     }
    //
    //     html += `</div>`
    //     return html
    //   }
    // },
    series: [{
      type: 'pie',
      radius: ['30%', '55%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 4,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        position: 'outside',
        formatter: '{b}\n{d}%',
        fontSize: 10,
        lineHeight: 14, // 增加行高，让文字看起来不那么挤
        // 2. 优化：如果文字太长，允许换行截断 (Echarts 5+ 特性)
        overflow: 'break',
        // 根据你的小容器，限制标签最大宽度
        width: 50
      },
      // 3. 关键：大幅缩短牵引线（Guide Line）
      labelLine: {
        show: true,
        length: 8,       // 第一段线（靠近饼图的直线）长度
        length2: 12,     // 第二段线（靠近文字的横线）长度
        smooth: false,   // 关闭平滑，用折线更省空间
        maxSurfaceAngle: 80 // 控制线的最大倾斜角，防止线乱飘
      },
      emphasis: {
        scale: false,
        focus: 'none'
      },
      data: items.map(item => ({
        name: isByValue ? item.label : item.value,
        value: item.count
      }))
    }]
  }
}

const initPieChart = (container, pieData, index) => {
  if (!container) return null

  // 确保容器有宽度和高度
  const width = container.clientWidth
  const height = container.clientHeight
  if (width === 0 || height === 0) {
    // console.warn(`[Evolution] Container ${index} has zero size, skipping initialization`)
    return null
  }

  const chart = echarts.init(container, null, {
    renderer: 'canvas',
    useDirtyRect: true // 启用脏矩形优化
  })
  const option = generatePieChartOption(pieData)

  if (option) {
    chart.setOption(option, {
      notMerge: true,
      lazyUpdate: false
    })
  }

  // 替换原来的 chart.on('click', ...)
  const handleInteraction = (pieIndex, params, isClick) => {
    if (showSankey.value || params?.dataIndex == null) return

    // 如果当前已经是点击固定状态，且触发的只是 Hover，则忽略，避免打断用户的固定查看
    if (!isClick && isCardPinned.value) return

    const detail = buildEvolutionMobileDetail({
      pie: currentPieData.value[pieIndex],
      pieIndex: pieIndex,
      itemIndex: params.dataIndex,
    })

    if (!detail) return
    // 优化：如果是重复点击同一个，且没有换位置，可以不用重新赋值（复用你之前的逻辑）
    if (isClick && isSameEvolutionMobileDetail(selectedPieDetail.value, detail)) {
      // 你可以选择再次点击关闭，或者什么都不做。这里我们保持简单的更新即可。
    }

    selectedPieDetail.value = detail

    if (isClick) {
      isCardPinned.value = true // 点击时，钉住卡片
    }

    // 更新位置 (仅桌面端)
    if (!isMobileLayout.value && params.event?.event) {
      const e = params.event.event
      desktopCardPosition.value = resolveHoverDetailCardPosition({
        clientX: e.clientX,
        clientY: e.clientY,
      })
    }
  }

  chart.on('click', (params) => handleInteraction(index, params, true))

  if (!isMobileLayout.value) {
    // 绑定悬浮：展示卡片 (注意传 index)
    chart.on('mouseover', (params) => handleInteraction(index, params, false))

    // 绑定离开：如果没钉住，就关闭卡片
    chart.on('mouseout', () => {
      if (!isCardPinned.value) {
        selectedPieDetail.value = null
      }
    })
  }

  return chart
}

// 不再使用setPieRef，改用renderAllPies统一初始化
// const setPieRef = (el, index) => {
//   if (el && currentPieData.value[index]) {
//     if (chartInstances.value[index]) {
//       chartInstances.value[index].dispose()
//     }
//     chartInstances.value[index] = initPieChart(
//       el,
//       currentPieData.value[index],
//       index
//     )
//   }
// }

const renderAllPies = async () => {
  await nextTick()
  clearPieCharts()

  // 强制重新渲染：等待DOM更新后再次触发
  await nextTick()

  // 手动初始化所有饼图 - 分批渲染，避免阻塞UI
  const pieElements = pieGridRef.value?.querySelectorAll('[data-pie-index]')
  if (pieElements) {
    const batchSize = 10 // 每批渲染10个
    for (let i = 0; i < pieElements.length; i += batchSize) {
      const batch = Array.from(pieElements).slice(i, i + batchSize)
      batch.forEach((el) => {
        const index = parseInt(el.getAttribute('data-pie-index'))
        if (currentPieData.value[index]) {
          chartInstances.value[index] = initPieChart(
            el,
            currentPieData.value[index],
            index
          )
        }
      })

      // 每批之间让出控制权，避免阻塞UI
      await nextTick()
    }
  }
}

const buildSankeyData = () => {
  const isByValue = queryMode.value === 'by_value'
  const nodeMap = new Map()
  const linkMap = new Map()

  const mergeChars = (...charLists) => {
    return [
      ...new Set(
        charLists
          .flat()
          .filter(Boolean)
      )
    ]
  }

  const ensureNode = (id, rawLabel, layer, chars = []) => {
    if (!nodeMap.has(id)) {
      nodeMap.set(id, {
        name: id,
        rawLabel,
        layer,
        chars: mergeChars(chars)
      })
      return
    }

    const existingNode = nodeMap.get(id)
    existingNode.chars = mergeChars(existingNode.chars || [], chars)
  }

  const addLink = (source, target, value, chars = []) => {
    if (!value) return

    const key = `${source}__${target}`

    if (!linkMap.has(key)) {
      linkMap.set(key, {
        source,
        target,
        value: 0,
        chars: []
      })
    }

    const link = linkMap.get(key)
    link.value += value
    link.chars = mergeChars(link.chars || [], chars)
  }

  currentPieData.value.forEach((pie) => {
    const items = isByValue ? pie.level1 : pie.phonetic_values

    if (isByValue) {
      const rootLabel = pie.value
      const rootLayer = t('phonology.phonology.evolution.sankey.layers.value')
      const rootId = `value:${rootLabel}`

      const rootChars = mergeChars(
        (items || []).flatMap(item => item.chars || [])
      )

      ensureNode(rootId, rootLabel, rootLayer, rootChars)

      items?.forEach((item) => {
        const level1Label = item.label
        const level2Items = item.level2 || []

        // 正常情况：一级维度 × 二级维度组合
        if (level2Items.length > 0) {
          level2Items.forEach((level2Item) => {
            const level2Label = level2Item.label
            const comboLabel = `${level1Label}｜${level2Label}`
            const comboLayer = `${level1Column.value} × ${level2Column.value}`
            const comboId = `combo:${level1Label}__${level2Label}`
            const chars = level2Item.chars || []

            ensureNode(comboId, comboLabel, comboLayer, chars)
            addLink(rootId, comboId, level2Item.count, chars)
          })

          return
        }

        // 兜底：如果某个一级维度下面没有 level2，也不要完全丢掉
        const comboLabel = `${level1Label}｜未分类`
        const comboLayer = `${level1Column.value} × ${level2Column.value}`
        const comboId = `combo:${level1Label}__未分类`
        const chars = item.chars || []

        ensureNode(comboId, comboLabel, comboLayer, chars)
        addLink(rootId, comboId, item.count, chars)
      })

      return
    }

    // by_status 原逻辑保持不变：一级维度 → 音值 → 二级维度
    const rootLabel = pie.level1_value
    const rootLayer = level1Column.value
    const rootId = `level1:${rootLabel}`

    const rootChars = mergeChars(
      (items || []).flatMap(item => item.chars || [])
    )

    ensureNode(rootId, rootLabel, rootLayer, rootChars)

    items?.forEach((item) => {
      const middleLabel = item.value
      const middleLayer = t('phonology.phonology.evolution.sankey.layers.value')
      const middleId = `value:${middleLabel}`

      ensureNode(middleId, middleLabel, middleLayer, item.chars || [])
      addLink(rootId, middleId, item.count, item.chars || [])

      item.level2?.forEach((level2Item) => {
        const level2Id = `level2:${level2Item.label}`

        ensureNode(level2Id, level2Item.label, level2Column.value, level2Item.chars || [])
        addLink(middleId, level2Id, level2Item.count, level2Item.chars || [])
      })
    })
  })

  const level1Order = []
  const level2Order = []

  currentPieData.value.forEach((pie) => {
    ;(pie.level1 || []).forEach((item) => {
      if (item.label && !level1Order.includes(item.label)) {
        level1Order.push(item.label)
      }

      ;(item.level2 || []).forEach((level2Item) => {
        if (level2Item.label && !level2Order.includes(level2Item.label)) {
          level2Order.push(level2Item.label)
        }
      })
    })
  })

  const nodes = Array.from(nodeMap.values()).sort((a, b) => {
    const aIsCombo = a.name.startsWith('combo:')
    const bIsCombo = b.name.startsWith('combo:')

    // 左侧音值节点保持在组合节点前面
    if (aIsCombo !== bIsCombo) {
      return aIsCombo ? 1 : -1
    }

    // 非 combo 节点之间保持原顺序
    if (!aIsCombo && !bIsCombo) {
      return 0
    }

    const [aLevel1 = '', aLevel2 = ''] = a.name.replace('combo:', '').split('__')
    const [bLevel1 = '', bLevel2 = ''] = b.name.replace('combo:', '').split('__')

    const aLevel1Index = level1Order.indexOf(aLevel1)
    const bLevel1Index = level1Order.indexOf(bLevel1)

    if (aLevel1Index !== bLevel1Index) {
      return aLevel1Index - bLevel1Index
    }

    const aLevel2Index = level2Order.indexOf(aLevel2)
    const bLevel2Index = level2Order.indexOf(bLevel2)

    return aLevel2Index - bLevel2Index
  })

  return {
    nodes,
    links: Array.from(linkMap.values())
  }
}

const updateSankeyHeight = (nodes) => {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    sankeyHeight.value = isMobileLayout.value ? '520px' : '680px'
    return
  }

  const layerNodeCounts = new Map()

  nodes.forEach(node => {
    const layer = node.layer || 'default'
    layerNodeCounts.set(layer, (layerNodeCounts.get(layer) || 0) + 1)
  })

  const maxNodesInLayer = Math.max(...layerNodeCounts.values(), 1)

  const minHeight = isMobileLayout.value ? 520 : 680
  const maxHeight = isMobileLayout.value ? 1100 : 1400
  const heightPerNode = isMobileLayout.value ? 30 : 36

  const calculatedHeight = Math.min(
    maxHeight,
    Math.max(minHeight, maxNodesInLayer * heightPerNode + 180)
  )

  sankeyHeight.value = `${calculatedHeight}px`
}

const generateSankeyOption = () => {
  const sankeyData = buildSankeyData()
  updateSankeyHeight(sankeyData.nodes)

  const title = queryMode.value === 'by_value'
    ? t('phonology.phonology.evolution.sankey.titles.byValue', { feature: currentFeature.value })
    : t('phonology.phonology.evolution.sankey.titles.byStatus', { feature: currentFeature.value })

  return {
    animation: false,
    title: {
      text: title,
      left: 'center',
      top: 12,
      textStyle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333'
      }
    },
    tooltip: {
      show: false,
    },
    // tooltip: {
    //   trigger: 'item',
    //   triggerOn: 'mousemove',
    //   confine: true,
    //   formatter: (params) => {
    //     if (params.dataType === 'edge') {
    //       const sourceNode = sankeyData.nodes.find(node => node.name === params.data.source)
    //       const targetNode = sankeyData.nodes.find(node => node.name === params.data.target)
    //       return `${sourceNode?.rawLabel || params.data.source} -> ${targetNode?.rawLabel || params.data.target}<br/>${params.data.value} ${t('phonology.phonology.evolution.sankey.unit')}`
    //     }

    //     return `${params.data.rawLabel}<br/>${t('phonology.phonology.evolution.sankey.layer')}: ${params.data.layer}`
    //   }
    // },
    series: [{
      type: 'sankey',
      left: '5%',
      right: '12%',
      top: '10%',
      bottom: '5%',
      layoutIterations: optimizeSankeyLayout.value ? 300 : 0,
      data: sankeyData.nodes,
      links: sankeyData.links,
      nodeAlign: 'justify',
      draggable: false,
      emphasis: {
        focus: 'adjacency'
      },
      lineStyle: {
        color: 'gradient',
        curveness: 0.5,
        opacity: 0.35
      },
      label: {
        color: '#333',
        fontSize: 12,
        formatter: ({ data }) => data.rawLabel
      },
      itemStyle: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)'
      },
      levels: [
        { depth: 0, itemStyle: { color: '#4f7cff' }, lineStyle: { opacity: 0.35 } },
        { depth: 1, itemStyle: { color: '#34a853' }, lineStyle: { opacity: 0.35 } },
        { depth: 2, itemStyle: { color: '#f2994a' }, lineStyle: { opacity: 0.35 } }
      ]
    }]
  }
}

const renderSankey = async () => {
  await nextTick()
  clearPieCharts()
  clearSankeyChart()

  if (!sankeyContainerRef.value || currentPieData.value.length === 0) {
    return
  }

  const option = generateSankeyOption()
  const sankeyData = buildSankeyData()

  await nextTick()

  sankeyChartInstance.value = echarts.init(sankeyContainerRef.value, null, {
    renderer: 'canvas',
    useDirtyRect: true
  })

  sankeyChartInstance.value.setOption(option, {
    notMerge: true,
    lazyUpdate: false
  })

  const buildSankeyDetail = (params) => {
    if (params?.dataType === 'edge') {
      const sourceNode = sankeyData.nodes.find(node => node.name === params.data.source)
      const targetNode = sankeyData.nodes.find(node => node.name === params.data.target)
      const chars = Array.isArray(params.data.chars) ? params.data.chars : []

      if (!sourceNode || !targetNode) return null

      return {
        title: `${sourceNode.rawLabel} → ${targetNode.rawLabel}`,
        subtitle: `${sourceNode.layer} → ${targetNode.layer} · ${params.data.value} ${t('phonology.phonology.evolution.sankey.unit')}`,
        layerLabel: t('phonology.phonology.evolution.sankey.layer'),
        displayChars: chars,
        remainingChars: 0
      }
    }

    const node = sankeyData.nodes.find(item => item.name === params?.data?.name)
    if (!node) return null

    const chars = Array.isArray(node.chars) ? node.chars : []
    return {
      title: node.rawLabel,
      subtitle: `${t('phonology.phonology.evolution.sankey.layer')}: ${node.layer} · ${chars.length} ${t('phonology.phonology.evolution.sankey.unit')}`,
      layerLabel: node.layer,
      displayChars: chars,
      remainingChars: 0
    }
  }

  const updateSankeyDetailPosition = (params) => {
    if (isMobileLayout.value || !params?.event?.event) return

    const e = params.event.event
    desktopCardPosition.value = resolveHoverDetailCardPosition({
      clientX: e.clientX,
      clientY: e.clientY,
    })
  }

  const handleSankeyInteraction = (params, isClick) => {
    if (!params) return
    if (!isClick && isCardPinned.value) return

    const detail = buildSankeyDetail(params)
    if (!detail) return

    selectedSankeyDetail.value = detail
    selectedPieDetail.value = null
    updateSankeyDetailPosition(params)

    if (isClick) {
      isCardPinned.value = true
    }
  }

  sankeyChartInstance.value.on('click', (params) => handleSankeyInteraction(params, true))

  if (!isMobileLayout.value) {
    sankeyChartInstance.value.on('mouseover', (params) => handleSankeyInteraction(params, false))
    sankeyChartInstance.value.on('mouseout', () => {
      if (!isCardPinned.value) {
        selectedSankeyDetail.value = null
      }
    })
  }

  requestAnimationFrame(() => {
    sankeyChartInstance.value?.resize()
  })
}

const renderCurrentVisualization = async () => {
  if (showSankey.value) {
    await renderSankey()
    return
  }

  clearSankeyChart()
  await renderAllPies()
}

const renderCurrentVisualizationWithLoading = async () => {
  isLoading.value = true

  await nextTick()
  await waitForPaint()

  try {
    updateContainerSize()
    await renderCurrentVisualization()
    await waitForPaint()
  } finally {
    isLoading.value = false
  }
}

const handleWindowResize = async () => {
  const previousMobileLayout = isMobileLayout.value
  updateMobileLayout()

  if (previousMobileLayout !== isMobileLayout.value) {
    if (!isMobileLayout.value) {
      closeMobilePieDetail()
    }
    await renderCurrentVisualization()
    return
  }

  updateContainerSize()

  if (showSankey.value) {
    sankeyChartInstance.value?.resize()
    return
  }

  chartInstances.value.forEach(chart => chart?.resize())
}

const tryRunUrlAutoQuery = async () => {
  if (!pendingUrlAutoQuery.value) return
  if (isLoading.value) return
  if (isMatching.value) return
  if (!matchedLocations.value.length) return

  pendingUrlAutoQuery.value = false
  matchedLocations.value = matchedLocations.value.slice(0, EVOLUTION_LOCATION_LIMIT)

  await handleQuery()
}

// 当切换feature时，重新渲染饼图
watch(currentFeature, async () => {
  closeMobilePieDetail()

  if (showSankey.value) {
    await renderCurrentVisualizationWithLoading()
    return
  }

  await nextTick()

  // 清空旧的图表实例
  chartInstances.value.forEach(chart => chart?.dispose())
  chartInstances.value = []

  await nextTick()

  // 分批重新初始化所有饼图
  const pieElements = pieGridRef.value?.querySelectorAll('[data-pie-index]')
  if (pieElements) {
    const batchSize = 10
    for (let i = 0; i < pieElements.length; i += batchSize) {
      const batch = Array.from(pieElements).slice(i, i + batchSize)
      batch.forEach((el) => {
        const index = parseInt(el.getAttribute('data-pie-index'))
        if (currentPieData.value[index]) {
          chartInstances.value[index] = initPieChart(
            el,
            currentPieData.value[index],
            index
          )
        }
      })
      await nextTick()
    }
  }
})

// ========== 生命周期 ==========
watch(showSankey, async () => {
  if (showSankey.value) {
    closeMobilePieDetail()
  }
  await renderCurrentVisualizationWithLoading()
})

watch(optimizeSankeyLayout, async () => {
  if (!showSankey.value) return

  await renderCurrentVisualizationWithLoading()
})

watch(queryMode, async () => {
  if (hasQueriedRealData.value) {
    return
  }

  await applyDemoData()
})

watch(matchedLocations, async () => {
  await tryRunUrlAutoQuery()
})

watch(isMatching, async () => {
  await tryRunUrlAutoQuery()
})

watch(locationQuery, async (urlLocations) => {
  const limitedUrlLocations = Array.isArray(urlLocations)
    ? urlLocations.slice(0, EVOLUTION_LOCATION_LIMIT)
    : []

  if (JSON.stringify(limitedUrlLocations) === JSON.stringify(selectedLocations.value)) {
    return
  }

  selectedLocations.value = [...limitedUrlLocations]
  matchedLocations.value = [...limitedUrlLocations]
  errorMessage.value = ''
  closeMobilePieDetail()

  if (limitedUrlLocations.length === 0) {
    pendingUrlAutoQuery.value = false
    hasQueriedRealData.value = false
    await applyDemoData()
    return
  }

  await applyDemoData({ syncLocations: false })
  pendingUrlAutoQuery.value = true
  await nextTick()
  await tryRunUrlAutoQuery()
})

onMounted(async () => {
  updateMobileLayout()

  const urlLocations = locationQuery.value.slice(0, EVOLUTION_LOCATION_LIMIT)

  if (urlLocations.length > 0) {
    selectedLocations.value = [...urlLocations]
    await applyDemoData({ syncLocations: false })
    pendingUrlAutoQuery.value = true
    await nextTick()
    await tryRunUrlAutoQuery()
  } else {
    await applyDemoData()
  }

  window.addEventListener('resize', handleWindowResize)
})

onUnmounted(() => {
  clearPieCharts()
  clearSankeyChart()
  window.removeEventListener('resize', handleWindowResize)
})
</script>



<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$primary: var(--color-primary);
$danger: var(--color-error-light);

$text-primary: var(--text-dark);
$text-secondary: var(--text-tertiary);
$text-muted: var(--text-lightest);

$ease-fluid: cubic-bezier(0.25, 0.8, 0.25, 1);
$portrait-ratio: 1;

@mixin text-primary {
  color: var(--text-dark, #{$text-primary});
}

@mixin text-secondary {
  color: var(--text-secondary, #{$text-secondary});
}

/* 页面主体 */
.evolution-page {
  width: 98%;
  @include flex-col;
  align-items: center;
  padding: 10px;
}

/* 控制面板 */
.main-glass-panel {
  --main-glass-panel-background: var(--glass-60);
  --main-glass-panel-backdrop-filter: blur(12px);
  --main-glass-panel-border-radius: var(--radius-lg);
  --main-glass-panel-border: 1px solid var(--glass-30);
  --main-glass-panel-shadow:
    0 4px 16px rgba(0, 0, 0, 0.08),
    inset 0 0 0 1px var(--glass-30);
  --main-glass-panel-hover-shadow:
    0 4px 16px rgba(0, 0, 0, 0.08),
    inset 0 0 0 1px var(--glass-30);

  max-width: 600px;
  margin-bottom: 20px;
  padding: 20px;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }

  &--query {
    justify-content: center;
  }
}

.dimension {
  &-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: start;
    gap: 14px;
    margin-bottom: 16px;
  }

  &-field {
    min-width: 0;
    @include flex-col;
    gap: 8px;
  }

  &-label {
    min-width: 0;
  }

  &-select {
    width: 100%;
    max-width: none;
  }
}

.control {
  &-label {
    min-width: 80px;
    font-size: 14px;
    font-weight: 500;

    @include text-primary;
  }

  &-select {
    flex: 1;
    max-width: 300px;
  }

  &-input {
    flex: 1;
  }

  &-input-wrapper {
    flex: 1;
    @include flex-col;
    gap: 4px;
  }
}

.input-hint {
  font-size: 12px;
  font-style: italic;

  @include text-secondary;
}

/* 统计模式 */
.mode-selector {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.query-mode-radio {
  justify-content: flex-start;
  gap: 20px;

  :deep(.liquid-radio-label) {
    padding: 0;
    font-size: 15px;
    font-weight: 500;
  }
}

/* 查询按钮 */
.query-button {
  padding: 10px 24px;
  background: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);
  box-shadow: 0 2px 8px var(--color-primary-shadow);
  color: var(--action-primary-text);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s $ease-fluid;

  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
    box-shadow: 0 4px 12px var(--color-primary-shadow-light);
    transform: translateY(-1px);
  }

  &:disabled {
    @include disabled-state;
  }
}

/* 错误提示 */
.error-message {
  margin-top: 12px;
  padding: 12px;
  background: rgba(var(--color-error-light-rgb), 0.1);
  border: 1px solid rgba(var(--color-error-light-rgb), 0.3);
  border-radius: var(--radius-sm2);
  color: $danger;
  font-size: 13px;
}

/* 特征切换 */
.feature-tabs {
  @include flex-center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;

  &-location {
    display: inline-flex;
    align-items: center;
    padding: 8px 14px;
    background: rgba(var(--color-primary-rgb), 0.1);
    border: 1px solid rgba(var(--color-primary-rgb), 0.18);
    border-radius: var(--radius-md);
    color: var(--color-primary);
    white-space: nowrap;
    font-size: 14px;
    font-weight: 700;

    :root[data-color-theme='dark'] & {
      color: var(--text-primary);
    }
  }
}

.feature-tab {
  padding: 10px 20px;
  background: var(--glass-30);
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-md);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  color: var(--text-dark);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s $ease-fluid;

  @include glass-blur;

  &:hover {
    background: var(--glass-60);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }

  &.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    box-shadow: 0 4px 12px var(--color-primary-shadow);
    color: var(--action-primary-text);
  }
}

/* 加载与空状态 */
.loading-state,
.empty-state {
  min-height: 300px;

  @include flex-center;
}

.loading-state {
  flex-direction: column;
  gap: 16px;

  p {
    color: $text-secondary;
    font-size: 14px;
  }
}

.empty-state {
  color: $text-muted;
  font-size: 14px;
}

/* 图表区域 */
.pie-container {
  position: relative;
  width: 100%;

  &.is-rendering {
    .pie-grid,
    .sankey-chart {
      opacity: 0.45;
    }
  }
}

.visualization-rendering-mask {
  position: absolute;
  inset: 0;
  z-index: 30;
  min-height: 300px;
  background: var(--glass-50);
  pointer-events: auto;

  @include flex-center;
  @include glass-blur(2px);
}

.pie-grid {
  position: relative;
  width: 90dvw;
  backface-visibility: hidden;
  transform: translateZ(0);
}

.pie-item {
  position: relative;

  &:hover {
    z-index: 10;
  }
}

.pie-chart {
  width: 100%;
  height: 230px;
  background: transparent;
}

.sankey-chart {
  width: min(92dvw, 1400px);
  min-height: 520px;
  margin: 0 auto;
}

/* 详情卡片内容 */
.mobile-detail-card {
  &__meta {
    flex: 1;
    min-width: 0;
  }

  &__title-row {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  &__title {
    font-size: 16px;
    font-weight: 700;
    line-height: 1.3;

    @include text-primary;
  }

  &__subtitle {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.4;

    @include text-secondary;
  }

  &__section {
    @include flex-col;
    gap: 10px;
  }

  &__section-title {
    font-size: 13px;
    font-weight: 600;

    @include text-primary;
  }

  &__item {
    padding: 10px 12px;
    background: var(--glass-60);
    border: 1px solid var(--glass-50);
    border-radius: var(--radius-md);
  }

  &__item-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  &__item-label {
    font-size: 14px;
    font-weight: 600;

    @include text-primary;
  }

  &__item-value {
    white-space: nowrap;
    font-size: 12px;

    @include text-secondary;
  }

  &__chars {
    margin-top: 8px;
    font-size: 12px;
    line-height: 1.6;

    @include text-secondary;

    &--standalone {
      margin-top: 0;
    }
  }
}

/* 竖屏布局 */
@media (max-aspect-ratio: $portrait-ratio) {
  .evolution-page {
    padding: 3px;
  }

  .main-glass-panel {
    padding: 16px;
  }

  .control-row {
    align-items: stretch;
    gap: 8px;
  }

  .control {
    &-label {
      min-width: auto;
    }

    &-select {
      max-width: none;
    }
  }

  .mode-selector {
    gap: 10px 14px;
  }

  .query-mode-radio {
    gap: 14px;
  }

  .feature-tab {
    padding: 10px 8px;
  }

  .feature-tabs-location {
    padding: 10px 6px;
  }

  .pie-chart {
    height: 270px;
  }

  .pie-container {
    &.has-mobile-detail-card {
      padding-bottom: calc(260px + env(safe-area-inset-bottom));
    }
  }

  .sankey-chart {
    width: 100%;
    min-height: 520px;
  }
}
</style>
