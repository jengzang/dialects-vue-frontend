<template>
  <div class="evolution-page">
    <!-- 控制面板 -->
    <div class="main-glass-panel" data-panel="control">
      <!-- 统计模式选择 -->
      <div class="control-row">
        <label class="control-label">{{ t('phonology.phonology.evolution.queryMode.label', '统计模式') }}：</label>
        <div class="mode-selector">
          <label class="mode-radio-label">
            <input
              type="radio"
              value="by_value"
              v-model="queryMode"
              class="hidden-radio"
            />
            <span class="glass-indicator"></span>
            {{ t('phonology.phonology.evolution.queryMode.byValue') }}
          </label>
          <label class="mode-radio-label">
            <input
              type="radio"
              value="by_status"
              v-model="queryMode"
              class="hidden-radio"
            />
            <span class="glass-indicator"></span>
            {{ t('phonology.phonology.evolution.queryMode.byStatus') }}
          </label>
          <label class="mode-radio-label sankey-toggle">
            <input
                v-model="showSankey"
                type="checkbox"
                class="hidden-radio"
            />
            <span class="glass-indicator"></span>
            {{ t('phonology.phonology.evolution.controls.sankey') }}
          </label>
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
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-state">
      <div class="ui-loading--page" aria-hidden="true"></div>
      <p>{{ t('phonology.phonology.evolution.states.loading') }}</p>
    </div>

    <!-- 饼图展示区域 -->
    <div
      v-else-if="rawData && currentPieData.length > 0"
      class="pie-container"
      :class="{ 'has-mobile-detail-card': showMobilePieDetailCard }"
    >
      <div v-if="showSankey" ref="sankeyContainerRef" class="sankey-chart"></div>
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

    <Transition name="mobile-detail-card-fade">
      <div
          v-if="selectedPieDetail && !showSankey"
          class="mobile-detail-card"
          :class="{ 'is-desktop-card': !isMobileLayout }"
          :style="!isMobileLayout ? desktopCardPosition : {}"
      >
        <div class="mobile-detail-card__header">
          <div class="mobile-detail-card__meta">
            <div class="mobile-detail-card__title-row">
              <div class="mobile-detail-card__title">{{ selectedPieDetail.title }}</div>
              <div class="mobile-detail-card__section-title">
                {{ t('phonology.phonology.evolution.mobileDetail.breakdownBy', { dimension: level2Column }) }}
              </div>
            </div>
            <div class="mobile-detail-card__subtitle">
              {{ selectedPieDetail.pieTitle }} ·
              {{ t('phonology.phonology.evolution.mobileDetail.countAndRatio', {
              count: selectedPieDetail.count,
              unit: t('phonology.phonology.evolution.sankey.unit'),
              percent: selectedPieDetail.percent
            }) }}
            </div>
          </div>
          <button
              v-show="isMobileLayout || isCardPinned"
              type="button"
              class="mobile-detail-card__close"
              @click="closeMobilePieDetail"
          >×</button>
        </div>

        <div class="mobile-detail-card__body ui-scrollbar">
          <div
            v-if="selectedPieDetail.level2Items.length > 0"
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
            v-else-if="selectedPieDetail.displayChars.length > 0"
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
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import LocationMultiInput from '../geo/LocationMultiInput.vue'
import { postPhoPieByValue, postPhoPieByStatus } from '@/api'
import { PHONOLOGY_LOCATION_LIMITS } from '@/main/config/constants.js'
import { TABLE_COLUMN_SCHEMAS } from '../../config/chars_positions/characters.js'
import { userStore } from '@/main/store/store.js'
import { showWarning } from '@/utils/message.js'
import evolutionDemoByStatus from '@/assets/data/evolution_demo_status.json'
import evolutionDemoByValue from '@/assets/data/evolution_demo_value.json'
import { buildEvolutionMobileDetail, isSameEvolutionMobileDetail } from './evolutionDetail.js'

const { t } = useI18n()
const router = useRouter()
const MOBILE_LAYOUT_MEDIA_QUERY = '(max-aspect-ratio: 1/1)'

// ========== 响应式数据 ==========
// 查询参数
const queryMode = ref('by_value')
const selectedTable = ref('characters')
const level1Column = ref('')
const level2Column = ref('')
const selectedLocations = ref([])
const matchedLocations = ref([])
const showSankey = ref(false)

// 查询状态
const isLoading = ref(false)
const isMatching = ref(false)
const errorMessage = ref('')
const rawData = ref(null)
const hasQueriedRealData = ref(false)

// 当前展示
const features = ['聲母', '韻母', '聲調']
const currentFeature = ref('聲母')

// 饼图容器
const pieGridRef = ref(null)
const sankeyContainerRef = ref(null)
const chartInstances = ref([])
const sankeyChartInstance = ref(null)
const containerWidth = ref(1200)
const isMobileLayout = ref(false)
const selectedPieDetail = ref(null)

const desktopCardPosition = ref({ left: '0px', top: '0px' })
const isCardPinned = ref(false) // 记录卡片是否被点击固定

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
const availableColumns = computed(() => {
  const schema = TABLE_COLUMN_SCHEMAS[selectedTable.value]
  const keys = schema?.ui?.available_keys || []
  // 转换为 SimpleSelectDropdown 需要的格式
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
  if (pieCount <= 4) cols = 2
  else if (pieCount <= 9) cols = 3
  else if (pieCount <= 16) cols = 4
  else if (pieCount <= 25) cols = 5
  else cols = 6

  const rows = Math.ceil(pieCount / cols)
  return { cols, rows }
})

const pieSize = computed(() => {
  const { cols } = gridLayout.value
  if (cols === 0) return 200
  const containerW = containerWidth.value
  const gap = 20
  const size = (containerW - (cols + 1) * gap) / cols
  return Math.max(150, Math.min(250, size))
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

const getDemoData = () => (queryMode.value === 'by_value' ? evolutionDemoByValue : evolutionDemoByStatus)

const syncControlsFromData = (data) => {
  selectedLocations.value = Array.isArray(data.locations) ? [...data.locations] : []
  matchedLocations.value = Array.isArray(data.locations) ? [...data.locations] : []
  selectedTable.value = data.table_name || 'characters'
  level1Column.value = data.level1_column || ''
  level2Column.value = data.level2_column || ''
}

const handleMatchedLocations = (locations) => {
  matchedLocations.value = locations
}

const handleIsMatching = (matching) => {
  isMatching.value = matching
}

const getInitialFeature = (data) => {
  const featureKeys = Object.keys(data?.data || {})
  return features.find(feature => featureKeys.includes(feature) && (data.data[feature]?.length || 0) > 0) || features[0]
}

const applyDemoData = async () => {
  const demoData = getDemoData()
  closeMobilePieDetail()
  syncControlsFromData(demoData)
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
    router.push('/auth')
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
      locations: matchedLocations.value,
      level1_column: level1Column.value,
      level2_column: level2Column.value,
      table_name: selectedTable.value
    }

    const apiCall = queryMode.value === 'by_value'
      ? postPhoPieByValue
      : postPhoPieByStatus

    const response = await apiCall(params)
    rawData.value = response
    hasQueriedRealData.value = true
    closeMobilePieDetail()
    currentFeature.value = getInitialFeature(response)
    shouldRefreshVisualization = true
  } catch (error) {
    errorMessage.value = error.message || t('phonology.phonology.evolution.errors.queryFailed')
    console.error('Query error:', error)
  } finally {
    isLoading.value = false
    if (shouldRefreshVisualization) {
      await nextTick()
      updateContainerSize()
      await renderCurrentVisualization()
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
  isCardPinned.value = false // 重置固定状态
}

const updateMobileLayout = () => {
  if (typeof window === 'undefined') {
    return
  }

  isMobileLayout.value = window.matchMedia(MOBILE_LAYOUT_MEDIA_QUERY).matches
}

// ========== 饼图渲染 ==========
const generatePieChartOption = (pieData) => {
  const isByValue = queryMode.value === 'by_value'
  const title = isByValue ? pieData.value : pieData.level1_value
  const total = pieData.total
  const items = isByValue ? pieData.level1 : pieData.phonetic_values

  if (!items) return null

  return {
    animation: false, // 完全禁用动画
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
    //       html += `<div style="border-top: 1px solid #eee; margin: 6px 0; padding-top: 6px;">
    //         <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
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
    //           html += `<div style="margin-left: 16px; font-size: 10px; color: #888;">
    //             字：${displayChars.join('、')}${remaining > 0 ? ` +${remaining}个` : ''}
    //           </div>`
    //         }
    //       })
    //
    //       html += `</div>`
    //     } else if (item.chars && item.chars.length > 0) {
    //       const displayChars = item.chars.slice(0, 15)
    //       const remaining = item.chars.length - displayChars.length
    //       html += `<div style="border-top: 1px solid #eee; margin: 6px 0; padding-top: 6px; font-size: 11px;">
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
      // 1. 缩小外半径，给周围的文字留出充足空间（原来是 ['40%', '70%']）
      radius: ['30%', '55%'],
      // 确保饼图在正中间
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
      const cardWidth = 340
      const cardHeight = 420

      let x = e.clientX + 20
      let y = e.clientY + 20

      // 边缘检测防溢出
      if (x + cardWidth > window.innerWidth) x = e.clientX - cardWidth - 20
      if (y + cardHeight > window.innerHeight) y = window.innerHeight - cardHeight - 20

      desktopCardPosition.value = { left: `${x}px`, top: `${y}px` }
    }
  }

  // 绑定点击：钉住卡片 (注意传 index)
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
  const startTime = performance.now()
  // console.log(`[Evolution] Starting to render ${currentPieData.value.length} pies...`)

  await nextTick()
  clearPieCharts()

  // 强制重新渲染：等待DOM更新后再次触发
  await nextTick()

  // 手动初始化所有饼图 - 分批渲染，避免阻塞UI
  const pieElements = pieGridRef.value?.querySelectorAll('[data-pie-index]')
  if (pieElements) {
    const batchSize = 10 // 每批渲染10个
    for (let i = 0; i < pieElements.length; i += batchSize) {
      const batchStart = performance.now()
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
      // console.log(`[Evolution] Batch ${Math.floor(i / batchSize) + 1} rendered in ${(performance.now() - batchStart).toFixed(2)}ms`)
    }
  }

  const endTime = performance.now()
  // console.log(`[Evolution] Total rendering took ${(endTime - startTime).toFixed(2)}ms`)
}

const buildSankeyData = () => {
  const isByValue = queryMode.value === 'by_value'
  const nodeMap = new Map()
  const linkMap = new Map()

  const ensureNode = (id, rawLabel, layer) => {
    if (!nodeMap.has(id)) {
      nodeMap.set(id, { name: id, rawLabel, layer })
    }
  }

  const addLink = (source, target, value) => {
    if (!value) return
    const key = `${source}__${target}`
    linkMap.set(key, (linkMap.get(key) || 0) + value)
  }

  currentPieData.value.forEach((pie) => {
    const rootLabel = isByValue ? pie.value : pie.level1_value
    const rootLayer = isByValue ? t('phonology.phonology.evolution.sankey.layers.value') : level1Column.value
    const rootId = `${isByValue ? 'value' : 'level1'}:${rootLabel}`
    const items = isByValue ? pie.level1 : pie.phonetic_values

    ensureNode(rootId, rootLabel, rootLayer)

    items?.forEach((item) => {
      const middleLabel = isByValue ? item.label : item.value
      const middleLayer = isByValue ? level1Column.value : t('phonology.phonology.evolution.sankey.layers.value')
      const middleId = `${isByValue ? 'level1' : 'value'}:${middleLabel}`

      ensureNode(middleId, middleLabel, middleLayer)
      addLink(rootId, middleId, item.count)

      item.level2?.forEach((level2Item) => {
        const level2Id = `level2:${level2Item.label}`
        ensureNode(level2Id, level2Item.label, level2Column.value)
        addLink(middleId, level2Id, level2Item.count)
      })
    })
  })

  return {
    nodes: Array.from(nodeMap.values()),
    links: Array.from(linkMap.entries()).map(([key, value]) => {
      const [source, target] = key.split('__')
      return { source, target, value }
    })
  }
}

const generateSankeyOption = () => {
  const sankeyData = buildSankeyData()
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
      trigger: 'item',
      triggerOn: 'mousemove',
      confine: true,
      formatter: (params) => {
        if (params.dataType === 'edge') {
          const sourceNode = sankeyData.nodes.find(node => node.name === params.data.source)
          const targetNode = sankeyData.nodes.find(node => node.name === params.data.target)
          return `${sourceNode?.rawLabel || params.data.source} -> ${targetNode?.rawLabel || params.data.target}<br/>${params.data.value} ${t('phonology.phonology.evolution.sankey.unit')}`
        }

        return `${params.data.rawLabel}<br/>${t('phonology.phonology.evolution.sankey.layer')}: ${params.data.layer}`
      }
    },
    series: [{
      type: 'sankey',
      left: '5%',   // 距离左侧的边距
      right: '12%',  // 距离右侧的边距（覆盖默认的 20%）
      top: '10%',   // 距离顶部的边距（根据你的标题高度微调）
      bottom: '5%', // 距离底部的边距
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

  sankeyChartInstance.value = echarts.init(sankeyContainerRef.value, null, {
    renderer: 'canvas',
    useDirtyRect: true
  })

  sankeyChartInstance.value.setOption(generateSankeyOption(), {
    notMerge: true,
    lazyUpdate: false
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

// 当切换feature时，重新渲染饼图
watch(currentFeature, async () => {
  closeMobilePieDetail()
  if (showSankey.value) {
    await renderCurrentVisualization()
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
  await nextTick()
  updateContainerSize()
  await renderCurrentVisualization()
})

watch(queryMode, async () => {
  if (hasQueriedRealData.value) {
    return
  }

  await applyDemoData()
})

onMounted(async () => {
  updateMobileLayout()
  await applyDemoData()
  window.addEventListener('resize', handleWindowResize)
})

onUnmounted(() => {
  clearPieCharts()
  clearSankeyChart()
  window.removeEventListener('resize', handleWindowResize)
})
</script>

<style scoped lang="scss">
.evolution-page {
  display: flex;
  align-items: center;
  flex-direction: column;
  width: 98%;
  padding: 10px;
}

/* 控制面板 */
.main-glass-panel {
  --main-glass-panel-background: var(--glass-medium2);
  --main-glass-panel-backdrop-filter: blur(12px);
  --main-glass-panel-border-radius: var(--radius-lg);
  --main-glass-panel-border: 1px solid var(--glass-border-weak);
  --main-glass-panel-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.3);
  --main-glass-panel-hover-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.3);
  padding: 20px;
  margin-bottom: 20px;
  max-width: 600px;
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

.control-row--sankey {
  justify-content: flex-end;
}

.sankey-toggle {
  gap: 10px;

  .glass-indicator {
    width: 18px;
    height: 18px;
    border-radius: 4px;
  }

  .glass-indicator::after {
    width: 5px;
    height: 9px;
    background: transparent;
    border-right: 2px solid #fff;
    border-bottom: 2px solid #fff;
    border-radius: 0;
    box-shadow: none;
    transform: translate(-50%, -58%) rotate(45deg) scale(0);
    transform-origin: center;
  }

  .hidden-radio:checked + .glass-indicator {
    border-color: var(--color-primary, #007aff);
    background: var(--color-primary, #007aff);
  }

  .hidden-radio:checked + .glass-indicator::after {
    transform: translate(-50%, -58%) rotate(45deg) scale(1);
  }
}

.dimension-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 16px;
  align-items: start;
}

.dimension-field {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dimension-label {
  min-width: 0;
}

.dimension-select {
  width: 100%;
  max-width: none;
}

.control-label {
  min-width: 80px;
  font-size: 14px;
  color: var(--text-dark, #333);
  font-weight: 500;
}

.control-select {
  flex: 1;
  max-width: 300px;
}

.control-input {
  flex: 1;
}

.control-input-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-hint {
  font-size: 12px;
  color: var(--text-secondary, #999);
  font-style: italic;
}

/* Radio选择器（液态玻璃态） */
.mode-selector {
  display: flex;
  gap: 20px;
}

.mode-radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-dark, #333);
  user-select: none;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
}

.hidden-radio {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + .glass-indicator {
    border-color: var(--color-primary, #007aff);
    background: rgba(255, 255, 255, 0.8);

    &::after {
      transform: translate(-50%, -50%) scale(1);
    }
  }
}

/* 液态玻璃圆圈（外圈） */
.glass-indicator {
  position: relative;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid rgba(150, 150, 150, 0.3);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow:
    inset 0 1px 3px rgba(255, 255, 255, 0.5),
    0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-primary, #007aff);
    transform: translate(-50%, -50%) scale(0);
    transition: transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
}

/* 查询按钮 */
.query-button {
  padding: 10px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 2px 8px var(--color-primary-shadow);

  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px var(--color-primary-shadow-light);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

/* 错误提示 */
.error-message {
  padding: 12px;
  background: rgba(255, 59, 48, 0.1);
  border: 1px solid rgba(255, 59, 48, 0.3);
  border-radius: 8px;
  color: #ff3b30;
  font-size: 13px;
  margin-top: 12px;
}

/* Tab切换 */
.feature-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  justify-content: center;
}

.feature-tab {
  padding: 10px 20px;
  background: var(--glass-light);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border-weak);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-dark);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  &:hover {
    background: var(--glass-medium);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &.active {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
    box-shadow: 0 4px 12px var(--color-primary-shadow);
  }
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 16px;

  p {
    font-size: 14px;
    color: #666;
  }
}

/* 饼图容器 */
.pie-container {
  position: relative;
  width: 100%;
}

.pie-grid {
  width: 90dvw;
  position: relative;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.pie-item {
  position: relative;

  &:hover {
    z-index: 10;
  }
}

.pie-chart {
  width: 100%;
  height: 200px;
  background: transparent;
}

.sankey-chart {
  width: min(92dvw, 1400px);
  height: 680px;
  margin: 0 auto;
}

.mobile-detail-card {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: calc(12px + env(safe-area-inset-bottom));
  z-index: 1200;
  border: 1px solid var(--glass-border-weak);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 16px 44px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
}

.mobile-detail-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 14px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

/* 桌面端弹窗样式覆盖 */
.mobile-detail-card.is-desktop-card {
  position: fixed;
  right: auto;
  bottom: auto;
  width: 320px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-medium);
  z-index: 9999;
  pointer-events: auto;
}

/* 防止 Hover 状态下卡片遮挡鼠标导致图表触发 mouseout 闪烁 */
.mobile-detail-card.is-desktop-card:not(:has(.mobile-detail-card__close:visible)) {
  pointer-events: none;
}

.mobile-detail-card__meta {
  min-width: 0;
  flex:1;
}

.mobile-detail-card__title-row {
  display: flex;
  justify-content: space-between; /* 核心：把子元素推向两端（一左一右） */
  align-items: center; /* 让左右的文字在垂直方向上居中对齐 */
  width: 100%; /* 确保撑满父容器 */
  gap: 12px; /* 加上一点间距，防止文字太长撞在一起 */
}

.mobile-detail-card__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-dark, #333);
  line-height: 1.3;
}

.mobile-detail-card__subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary, #666);
  line-height: 1.4;
}

.mobile-detail-card__close {
  border: none;
  background: rgba(255, 255, 255, 0.55);
  color: var(--text-dark, #333);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
}

.mobile-detail-card__body {
  max-height: min(38dvh, 300px);
  overflow-y: auto;
  padding: 12px 14px 14px;
}

.mobile-detail-card__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mobile-detail-card__section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dark, #333);
}

.mobile-detail-card__item {
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.45);
}

.mobile-detail-card__item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.mobile-detail-card__item-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-dark, #333);
}

.mobile-detail-card__item-value {
  font-size: 12px;
  color: var(--text-secondary, #666);
  white-space: nowrap;
}

.mobile-detail-card__chars {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-secondary, #666);
  line-height: 1.6;
}

.mobile-detail-card__chars--standalone {
  margin-top: 0;
}

.mobile-detail-card-fade-enter-active,
.mobile-detail-card-fade-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.mobile-detail-card-fade-enter-from,
.mobile-detail-card-fade-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

/* 空状态 */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #999;
  font-size: 14px;
}

/* 响应式 */
@media (max-aspect-ratio: 1/1) {
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

  .control-label {
    min-width: auto;
  }

  .control-select {
    max-width: none;
  }

  .mode-selector {
    gap: 10px;
  }

  .feature-tabs {
    flex-wrap: wrap;
  }

  .pie-chart {
    height: 180px;
  }

  .pie-container.has-mobile-detail-card {
    padding-bottom: calc(260px + env(safe-area-inset-bottom));
  }

  .sankey-chart {
    width: 100%;
    height: 520px;
  }
}

</style>
