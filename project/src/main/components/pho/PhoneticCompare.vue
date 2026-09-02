<template>
  <div class="phonetic-compare-results-container">
    <!-- 错误信息 -->
    <div
      v-if="errorMessage"
      class="error-message"
    >
      {{ errorMessage }}
    </div>

    <!-- 加载中：首次请求接口时使用 -->
    <div
      v-if="isLoading"
      class="loading-state"
    >
      <div
        class="ui-loading--page"
        aria-hidden="true"
      />
      <p>{{ t('phonology.phonology.evolution.states.loading', '正在查询中...') }}</p>
    </div>

    <!-- 结果展示 -->
    <div
      v-else-if="rawData && !errorMessage"
      class="results-area"
    >
      <!-- 声韵调切换 Tab -->
      <div class="feature-control-row">
        <div class="feature-tabs">
          <button
            v-for="feat in ['聲母', '韻母', '聲調']"
            :key="feat"
            :class="['feature-tab', { active: activeFeature === feat }]"
            type="button"
            @click="changeFeature(feat)"
          >
            {{ feat }}
          </button>
        </div>
      </div>

      <!-- 桑基图容器 -->
      <div
        class="sankey-chart-wrapper"
        :class="{ 'is-rendering': isChartRendering }"
      >
        <!-- 局部加载：切换 Tab / 重绘桑基图时使用 -->
        <div
          v-if="isChartRendering"
          class="sankey-rendering-mask"
        >
          <div
            class="ui-loading--page"
            aria-hidden="true"
          />
        </div>

        <div
          ref="sankeyContainerRef"
          class="sankey-chart"
          :style="{ width: sankeyWidth, height: sankeyHeight }"
        />
      </div>
    </div>

    <!-- 详情卡片 (Pin Detail) -->
    <Teleport to="body">
      <HoverDetailCard
        :visible="Boolean(selectedDetail)"
        :is-mobile-layout="isMobileLayout"
        :is-pinned="isCardPinned"
        :desktop-card-position="desktopCardPosition"
        root-class="sankey-detail-card"
        @close="closeDetailCard"
      >
        <template #header>
          <div class="detail-card-meta">
            <div class="detail-card-title-row">
              <div
                class="detail-card-title"
                v-html="selectedDetail?.title"
              />
            </div>
            <div
              class="detail-card-subtitle"
              v-html="selectedDetail?.subtitle"
            />
            <div class="detail-card-count">
              共 <strong>{{ selectedDetail?.count }}</strong> 字
            </div>
          </div>
        </template>

        <template #header-actions>
          <button
            v-show="isMobileLayout || isCardPinned"
            type="button"
            class="close-btn close-btn-sm close-btn-inline"
            @click="closeDetailCard"
          >
            ×
          </button>
        </template>

        <div class="detail-card-chars">
          {{ selectedDetail?.chars.join('、') }}
        </div>
      </HoverDetailCard>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import * as echarts from 'echarts'
import HoverDetailCard from '@/components/ToastAndHelp/HoverDetailCard.vue'
import { resolveHoverDetailCardPosition } from '@/utils/EchartHover/hoverDetailCardPosition.js'
import { getFeatureStats } from '@/api/index.js'
import { setRunning } from '@/main/store/store.js'

const { t } = useI18n()

// ========== Props ==========
const props = defineProps({
  queryLocations: {
    type: Array,
    default: () => []
  },

  // 父组件传入：当前 tab 是否可见（用于延迟渲染隐藏的桑基图）
  active: {
    type: Boolean,
    default: true
  },

  // 父组件传入：是否启用 Sankey 自动布局优化
  // false 时 layoutIterations = 0，节点顺序更接近输入顺序
  // true 时 layoutIterations = 200，ECharts 会尝试优化连线交叉
  enableLinkOptimization: {
    type: Boolean,
    default: false
  },

  // 父组件传入：过滤相邻两地之间存在多归属的字，避免多音字导致交叉连线
  ignorePolyphonicChars: {
    type: Boolean,
    default: false
  },

  // 父组件传入：过滤字数少于该值的连线
  minLinkCharCount: {
    type: Number,
    default: 3
  },

  // 父组件传入：过滤字数少于该值的节点
  minNodeCharCount: {
    type: Number,
    default: 10
  }
})

// ========== 响应式数据 ==========
const rawData = ref(null)
const activeLocations = ref([])
const activeFeature = ref('韻母')
const isLoading = ref(false)
const errorMessage = ref('')

// 图表局部渲染状态：切换 Tab / 重绘图表时显示
const isChartRendering = ref(false)

// 详情卡片状态
const selectedDetail = ref(null)
const isCardPinned = ref(false)
const desktopCardPosition = ref({ left: '0px', top: '0px' })

// ECharts 相关
const sankeyContainerRef = ref(null)
const chartInstance = ref(null)
const isMobileLayout = ref(false)
const MOBILE_LAYOUT_MEDIA_QUERY = '(max-aspect-ratio: 1/1)'

// 父组件控制项在图表渲染期间变化时，记录一次待重绘
let hasPendingRerender = false

// ========== 计算属性 ==========
const normalizeMinCount = (value, fallback) => {
  const num = Number(value)

  if (!Number.isFinite(num) || num < 0) return fallback

  return Math.floor(num)
}

const normalizedMinLinkCharCount = computed(() => {
  return normalizeMinCount(props.minLinkCharCount, 3)
})

const normalizedMinNodeCharCount = computed(() => {
  return normalizeMinCount(props.minNodeCharCount, 10)
})

const sankeyLayoutIterations = computed(() => {
  return props.enableLinkOptimization ? 200 : 0
})

const shouldIgnorePolyphonicChars = computed(() => {
  return !!props.ignorePolyphonicChars
})

// 动态宽度计算
const sankeyWidth = computed(() => {
  if (!rawData.value?.data) return '100%'

  const validLocs = activeLocations.value.filter(loc => rawData.value.data[loc])
  if (validLocs.length < 2) return '100%'

  const minWidthPerColumn = isMobileLayout.value ? 160 : 240
  return `max(100%, ${validLocs.length * minWidthPerColumn}px)`
})

const sankeyHeight = ref('800px')

// ========== 工具函数 ==========
// 等待浏览器真正完成一次绘制。
// 只用一次 requestAnimationFrame 时，回调仍发生在绘制前，loading 可能还没显示就开始同步计算。
const waitForPaint = () =>
  new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve)
    })
  })

// ========== 方法 ==========
const changeFeature = async (feat) => {
  if (activeFeature.value === feat || isChartRendering.value) return

  activeFeature.value = feat
  closeDetailCard()

  // 先显示局部 loading
  isChartRendering.value = true
  await nextTick()
  await waitForPaint()

  try {
    await renderSankey(activeLocations.value)
    // 给浏览器一帧机会完成图表刷新
    await waitForPaint()
  } finally {
    isChartRendering.value = false

    if (hasPendingRerender) {
      await rerenderSankeyOnly()
    }
  }
}

const rerenderSankeyOnly = async () => {
  if (!rawData.value || isLoading.value) return

  if (isChartRendering.value) {
    hasPendingRerender = true
    return
  }

  do {
    hasPendingRerender = false
    closeDetailCard()

    isChartRendering.value = true
    await nextTick()
    await waitForPaint()

    try {
      await renderSankey(activeLocations.value)
      await waitForPaint()
    } finally {
      isChartRendering.value = false
    }
  } while (hasPendingRerender)
}

const closeDetailCard = () => {
  selectedDetail.value = null
  isCardPinned.value = false
}

// 清空图表实例
const clearChart = () => {
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }
}

const handleQuery = async (queryLocs) => {
  demoLoadSeq++
  isLoading.value = true
  isChartRendering.value = false
  hasPendingRerender = false
  errorMessage.value = ''
  rawData.value = null
  clearChart()
  closeDetailCard()
  setRunning('compare', true)

  try {
    const params = {
      locations: queryLocs,
      features: ['聲母', '韻母', '聲調']
    }

    const response = await getFeatureStats(params)

    if (!response || !response.data) {
      throw new Error('接口返回数据无效')
    }

    const validLocs = queryLocs.filter(loc => response.data[loc])
    if (validLocs.length < 2) {
      throw new Error('所选地点中含有有效音值数据的地点不足 2 个，无法进行比较！')
    }

    rawData.value = response
    activeLocations.value = queryLocs

    // 接口 loading 结束，结果区域进入 DOM
    isLoading.value = false

    // 首次图表渲染也显示局部 loading，避免接口 loading 消失后页面空白卡住
    isChartRendering.value = true

    await nextTick()
    await waitForPaint()

    await renderSankey(queryLocs)

    await waitForPaint()
  } catch (error) {
    console.error('Phonetic comparison query failed:', error)
    errorMessage.value = error.message || '查询失败，请重试！'
    isLoading.value = false
  } finally {
    isChartRendering.value = false
    setRunning('compare', false)

    if (hasPendingRerender) {
      await rerenderSankeyOnly()
    }
  }
}

// 渲染桑基图
const renderSankey = async (queryLocs) => {
  clearChart()
  await nextTick()

  const el = sankeyContainerRef.value

  if (!el || !rawData.value) return
  if (el.clientWidth === 0 || el.clientHeight === 0) return

  const raw = rawData.value
  const charsMap = raw.chars_map || []
  const validLocs = queryLocs.filter(loc => raw.data[loc])

  if (validLocs.length < 2) return

  const nodeMap = new Map()
  const links = []
  const usedNodeIds = new Set()

  const buildCharValueMap = (featureData) => {
    const charValueMap = new Map()

    Object.entries(featureData || {}).forEach(([val, info]) => {
      const charIndices = info?.char_indices || []

      charIndices.forEach(idx => {
        if (!charValueMap.has(idx)) {
          charValueMap.set(idx, new Set())
        }

        charValueMap.get(idx).add(val)
      })
    })

    return charValueMap
  }

  const ensureNode = (id, rawLabel, layer, depth, charCount) => {
    if (!nodeMap.has(id)) {
      nodeMap.set(id, {
        name: id,
        rawLabel,
        layer,
        depth,
        charCount
      })
    }
  }

  // 1. 构造所有候选节点
  validLocs.forEach((loc, locIdx) => {
    const featureData = raw.data[loc]?.[activeFeature.value] || {}

    Object.entries(featureData).forEach(([val, info]) => {
      const charIndices = info?.char_indices || []
      const id = `${locIdx}:${loc}:${val}`

      ensureNode(id, val, loc, locIdx, charIndices.length)
    })
  })

  // 2. 构造相邻列连线
  // 注意：这里不能再重复构造 links，否则边会翻倍，ECharts 布局会明显变慢。
  for (let i = 0; i < validLocs.length - 1; i++) {
    const locCurr = validLocs[i]
    const locNext = validLocs[i + 1]

    const dataCurr = raw.data[locCurr]?.[activeFeature.value] || {}
    const dataNext = raw.data[locNext]?.[activeFeature.value] || {}
    const charValueMapCurr = buildCharValueMap(dataCurr)
    const charValueMapNext = buildCharValueMap(dataNext)

    const currEntries = Object.entries(dataCurr)
    const nextEntries = Object.entries(dataNext).map(([valNext, infoNext]) => {
      const indicesNext = infoNext.char_indices || []

      return {
        valNext,
        indicesNext,
        indicesNextSet: new Set(indicesNext)
      }
    })

    currEntries.forEach(([valCurr, infoCurr]) => {
      const indicesCurr = infoCurr.char_indices || []

      if (!indicesCurr.length) return

      nextEntries.forEach(({ valNext, indicesNextSet }) => {
        const intersect = indicesCurr.filter(idx => {
          if (!indicesNextSet.has(idx)) return false
          if (!shouldIgnorePolyphonicChars.value) return true

          return charValueMapCurr.get(idx)?.size === 1 && charValueMapNext.get(idx)?.size === 1
        })

        if (intersect.length > 0) {
          const source = `${i}:${locCurr}:${valCurr}`
          const target = `${i + 1}:${locNext}:${valNext}`

          usedNodeIds.add(source)
          usedNodeIds.add(target)

          links.push({
            source,
            target,
            value: intersect.length,
            charIndices: intersect
          })
        }
      })
    })
  }

  const minLinkCount = normalizedMinLinkCharCount.value
  const minNodeCount = normalizedMinNodeCharCount.value

  // 3. 先按节点自身字数过滤节点。
  // 如果节点被过滤掉，则与它相连的所有连线都不展示，不管连线是否满足 minLinkCount。
  const countPassedNodes = Array.from(nodeMap.values())
    .filter(node => usedNodeIds.has(node.name))
    .filter(node => node.charCount >= minNodeCount)

  const countPassedNodeIds = new Set(countPassedNodes.map(node => node.name))

  const linksAfterNodeFilter = links.filter(link => {
    return countPassedNodeIds.has(link.source) && countPassedNodeIds.has(link.target)
  })

  // 4. 再按连线字数过滤连线。
  const linksAfterLinkFilter = linksAfterNodeFilter.filter(link => {
    return link.charIndices.length >= minLinkCount
  })

  // 5. 最后清理孤立节点。
  // 如果一个节点的所有连线都被过滤了，则该节点也不展示，不管是否满足 minNodeCount。
  const connectedNodeIds = new Set()

  linksAfterLinkFilter.forEach(link => {
    connectedNodeIds.add(link.source)
    connectedNodeIds.add(link.target)
  })

  const nodes = countPassedNodes.filter(node => connectedNodeIds.has(node.name))
  const linksToRender = linksAfterLinkFilter

  if (!nodes.length || !linksToRender.length) {
    clearChart()
    return
  }

  // 6. 根据每层节点数动态计算高度
  const layerNodeCounts = new Map()

  nodes.forEach(node => {
    const depth = node.depth
    layerNodeCounts.set(depth, (layerNodeCounts.get(depth) || 0) + 1)
  })

  const maxNodesInLayer = Math.max(...layerNodeCounts.values(), 1)

  const minHeight = isMobileLayout.value ? 480 : 560
  const maxHeight = isMobileLayout.value ? 1100 : 1400
  const heightPerNode = isMobileLayout.value ? 30 : 36

  const calculatedHeight = Math.min(
    maxHeight,
    Math.max(minHeight, maxNodesInLayer * heightPerNode + 180)
  )

  sankeyHeight.value = `${calculatedHeight}px`

  await nextTick()

  chartInstance.value = echarts.init(el)

  const option = {
    animation: false,
    tooltip: {
      show: false
    },
    series: [{
      type: 'sankey',
      left: '4%',
      right: '10%',
      top: '2%',
      bottom: '4%',
      data: nodes,
      links: linksToRender,
      nodeAlign: 'justify',
      draggable: false,
      emphasis: isMobileLayout.value
        ? {
            disabled: true
          }
        : {
            focus: 'adjacency'
          },
      lineStyle: {
        color: 'gradient',
        curveness: 0.5,
        opacity: 0.25
      },
      label: {
        color: '#333',
        fontSize: 12,
        fontWeight: 'bold',
        formatter: ({ data }) => data.rawLabel
      },
      itemStyle: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)'
      },
      levels: [
        { depth: 0, itemStyle: { color: '#4f7cff' } },
        { depth: 1, itemStyle: { color: '#34a853' } },
        { depth: 2, itemStyle: { color: '#f2994a' } },
        { depth: 3, itemStyle: { color: '#a15cff' } },
        { depth: 4, itemStyle: { color: '#ff5c5c' } }
      ],

      // 这里不要设太大。
      // 100 会明显增加同步布局时间，导致主线程卡住，loading 动画也会停。
      // 如果想更稳定，可改为 0；如果想稍微减少交叉，建议 4、8、16。
      layoutIterations: sankeyLayoutIterations.value
    }]
  }

  chartInstance.value.setOption(option)

  await nextTick()

  requestAnimationFrame(() => {
    chartInstance.value?.resize()
  })

  const updateDetailCardPosition = (params) => {
    if (isMobileLayout.value || !params?.event?.event) return

    const e = params.event.event
    desktopCardPosition.value = resolveHoverDetailCardPosition({
      clientX: e.clientX,
      clientY: e.clientY,
    })
  }

  // 绑定点击详情卡片
  chartInstance.value.on('click', (params) => {
    let title = ''
    let subtitle = ''
    let count = 0
    let chars = []

    if (params.dataType === 'edge') {
      const sourceNode = nodeMap.get(params.data.source)
      const targetNode = nodeMap.get(params.data.target)
      const charIndices = params.data.charIndices || []

      if (!sourceNode || !targetNode) return

      title = `${sourceNode.layer} (${sourceNode.rawLabel}) &rarr; ${targetNode.layer} (${targetNode.rawLabel})`
      subtitle = '两地音值对应汉字'
      count = charIndices.length
      chars = charIndices.map(idx => charsMap[idx])
    } else {
      const node = nodeMap.get(params.data.name)

      if (!node) return

      const featureData = raw.data[node.layer]?.[activeFeature.value]?.[node.rawLabel] || {}
      const charIndices = featureData.char_indices || []

      title = `${node.layer} · ${node.rawLabel}`
      subtitle = `对应音值的所有汉字 (占比: ${((featureData.ratio || 0) * 100).toFixed(2)}%)`
      count = charIndices.length
      chars = charIndices.map(idx => charsMap[idx])
    }

    selectedDetail.value = {
      title,
      subtitle,
      count,
      chars
    }
    updateDetailCardPosition(params)
    isCardPinned.value = true
  })

  // 桌面端 Hover 时临时显示详情 (未钉住时)
  if (!isMobileLayout.value) {
    chartInstance.value.on('mouseover', (params) => {
      if (isCardPinned.value) return

      let title = ''
      let subtitle = ''
      let count = 0
      let chars = []

      if (params.dataType === 'edge') {
        const sourceNode = nodeMap.get(params.data.source)
        const targetNode = nodeMap.get(params.data.target)
        const charIndices = params.data.charIndices || []

        if (!sourceNode || !targetNode) return

        title = `${sourceNode.layer} (${sourceNode.rawLabel}) &rarr; ${targetNode.layer} (${targetNode.rawLabel})`
        subtitle = '两地音值对应汉字'
        count = charIndices.length
        chars = charIndices.map(idx => charsMap[idx])
      } else {
        const node = nodeMap.get(params.data.name)

        if (!node) return

        const featureData = raw.data[node.layer]?.[activeFeature.value]?.[node.rawLabel] || {}
        const charIndices = featureData.char_indices || []

        title = `${node.layer} · ${node.rawLabel}`
        subtitle = `对应音值的所有汉字 (占比: ${((featureData.ratio || 0) * 100).toFixed(2)}%)`
        count = charIndices.length
        chars = charIndices.map(idx => charsMap[idx])
      }

      selectedDetail.value = {
        title,
        subtitle,
        count,
        chars
      }
      updateDetailCardPosition(params)
    })

    chartInstance.value.on('mouseout', () => {
      if (!isCardPinned.value) {
        selectedDetail.value = null
      }
    })
  }
}

// ========== 尺寸自适应 ==========
const handleResize = () => {
  isMobileLayout.value = window.matchMedia(MOBILE_LAYOUT_MEDIA_QUERY).matches
  chartInstance.value?.resize()
}

// ========== 监听父组件传入的图表控制项：只重绘，不重新请求 API ==========
watch(
  () => [
    props.enableLinkOptimization,
    props.ignorePolyphonicChars,
    normalizedMinLinkCharCount.value,
    normalizedMinNodeCharCount.value
  ],
  () => {
    rerenderSankeyOnly()
  }
)

// ========== 演示数据（初始值，与 Evolution 对齐） ==========
const demoDataCache = ref(null)
let demoLoadSeq = 0

const getDemoData = async () => {
  if (demoDataCache.value) return demoDataCache.value

  const response = await fetch('/data/pho_compare.json')
  if (!response.ok) {
    throw new Error(`Failed to load demo data: ${response.status}`)
  }

  const data = await response.json()
  demoDataCache.value = data
  return data
}

const applyDemoData = async () => {
  const seq = ++demoLoadSeq

  try {
    const demoData = await getDemoData()
    if (seq !== demoLoadSeq) return

    const demoLocations = Object.keys(demoData.data || {})
    closeDetailCard()
    clearChart()
    errorMessage.value = ''
    isLoading.value = false
    hasPendingRerender = false
    rawData.value = demoData
    activeLocations.value = demoLocations

    isChartRendering.value = true
    await nextTick()
    await waitForPaint()

    await renderSankey(demoLocations)

    await waitForPaint()
  } catch (error) {
    if (seq !== demoLoadSeq) return
    console.error('Load pho_compare demo failed:', error)
    errorMessage.value = error.message || '加载演示数据失败'
    isLoading.value = false
  } finally {
    if (seq === demoLoadSeq) {
      isChartRendering.value = false
    }
  }
}

// ========== 监听 queryLocations 触发查询 ==========
watch(() => props.queryLocations, (newVal) => {
  if (Array.isArray(newVal) && newVal.length >= 2 && newVal.length <= 5) {
    handleQuery(newVal)
  } else {
    applyDemoData()
  }
}, { deep: true, immediate: true })

// ========== 监听 tab 可见性：进入 tab5 时补渲染 ==========
watch(() => props.active, async (active) => {
  if (!active) return

  if (!rawData.value) return
  if (!Array.isArray(activeLocations.value) || activeLocations.value.length < 2) return

  // 等 v-show 生效、容器恢复可见尺寸后再重绘。
  // 单次双 rAF 可能在布局尚未完成时仍拿到 clientWidth=0，这里轮询至尺寸可用。
  const el = sankeyContainerRef.value
  if (el) {
    for (let i = 0; i < 10; i++) {
      if (el.clientWidth > 0 && el.clientHeight > 0) break
      await waitForPaint()
    }
  }

  // 复用与 changeFeature 相同的可靠渲染路径
  isChartRendering.value = true
  await nextTick()
  await waitForPaint()

  try {
    await renderSankey(activeLocations.value)
    await waitForPaint()
  } finally {
    isChartRendering.value = false
  }
})

onMounted(() => {
  isMobileLayout.value = window.matchMedia(MOBILE_LAYOUT_MEDIA_QUERY).matches
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  clearChart()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$primary: var(--color-primary);
$error: var(--color-error);
$ease-fluid: cubic-bezier(0.25, 0.8, 0.25, 1);.phonetic-compare-results-container {
  width: 100%;
  @include flex-col;
  align-items: center;
}

/* 错误与加载状态 */
.error-message {
  width: 100%;
  max-width: 520px;
  margin-top: 15px;
  padding: 10px 14px;
  background: rgba(var(--color-error-light-rgb), 0.08);
  border-left: 3px solid var(--color-error, #{$error});
  border-radius: var(--radius-sm, var(--radius-sm));
  color: var(--color-error, #{$error});
  text-align: left;
  font-size: 14px;
}

.loading-state {
  min-height: 250px;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;

  @include flex-center;

  p {
    color: var(--text-secondary, var(--text-tertiary));
    font-size: 14px;
  }
}

/* 结果区域 */
.results-area {
  width: 93dvw;
  @include flex-col;
  align-items: center;
  margin-top: 25px;
}

/* 声韵调切换 */
.feature-control-row {
  @include flex-center;
  flex-wrap: wrap;
  gap: 18px;
  margin-bottom: 5px;
}

.feature-tabs {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.feature-tab {
  padding: 8px 18px;
  background: var(--glass-30, var(--glass-30));
  border: 1px solid var(--border-gray-light, rgba(var(--color-silver-rgb), 0.5));
  border-radius: var(--radius-md, var(--radius-md));
  color: var(--text-dark, var(--text-dark));
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;

  @include glass-blur(10px);

  &:hover {
    background: var(--glass-60, var(--glass-50));
    transform: translateY(-1px);
  }

  &.active {
    background: var(--color-primary, #{$primary});
    border-color: var(--color-primary, #{$primary});
    box-shadow: 0 4px 10px rgba(var(--color-primary-rgb), 0.2);
    color: var(--text-white);
  }
}

/* 桑基图 */
.sankey-chart-wrapper {
  position: relative;
  width: 100%;
  max-width: 100%;
  padding: 10px 0;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;

  &.is-rendering {
    .sankey-chart {
      opacity: 0.45;
    }
  }
}

.sankey-rendering-mask {
  position: absolute;
  inset: 0;
  z-index: 20;
  min-height: 400px;
  background: var(--glass-60);
  pointer-events: auto;

  @include flex-center;
  @include glass-blur(2px);
}

.sankey-chart {
  min-height: 400px;
  margin: 0 auto;
  background: transparent;
}

/* 详情卡片根容器 */
:deep(.sankey-detail-card) {
  @include flex-col;
  background: var(--glass-90);
  border: 1px solid var(--border-gray-light, rgba(var(--color-silver-rgb), 0.5));
  border-radius: var(--radius-lg, var(--radius-lg));
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.15);

  @include glass-blur(20px, 180%);
}

:deep(.sankey-detail-card.is-desktop-card) {
  width: 320px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

/* 详情卡片过渡 */
:deep(.sankey-detail-card.hover-detail-card-fade-enter-active),
:deep(.sankey-detail-card.hover-detail-card-fade-leave-active) {
  transition: all 0.25s $ease-fluid;
}

:deep(.sankey-detail-card.hover-detail-card-fade-enter-from),
:deep(.sankey-detail-card.hover-detail-card-fade-leave-to) {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

/* 详情卡片内部结构 */
:deep(.sankey-detail-card .hover-detail-card__header) {
  padding: 14px 16px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

:deep(.sankey-detail-card .hover-detail-card__body) {
  max-height: min(35dvh, 260px);
  padding: 12px 16px 16px;
  overflow-y: auto;
  text-align: left;
}

.detail-card-meta {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.detail-card-title-row {
  width: 100%;
  display: flex;
  align-items: center;
}

.detail-card-title {
  overflow: hidden;
  color: var(--text-dark, var(--text-dark));
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
}

.detail-card-subtitle {
  margin-top: 4px;
  color: var(--text-secondary, var(--text-tertiary));
  font-size: 12px;
  line-height: 1.4;
}

.detail-card-count {
  margin-top: 4px;
  color: var(--color-primary, #{$primary});
  font-size: 11px;
  font-weight: 600;
}

.detail-card-chars {
  color: var(--text-dark, var(--text-dark));
  word-break: break-all;
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.8;
  letter-spacing: 1px;
}
</style>
