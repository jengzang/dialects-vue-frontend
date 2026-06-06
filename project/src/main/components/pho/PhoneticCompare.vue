<template>
  <div class="phonetic-compare-results-container">
    <!-- 错误信息 -->
    <div
      v-if="errorMessage"
      class="error-message"
    >
      {{ errorMessage }}
    </div>

    <!-- 加载中 -->
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
      <div class="feature-tabs">
        <button
          v-for="feat in ['聲母', '韻母', '聲調']"
          :key="feat"
          :class="['feature-tab', { active: activeFeature === feat }]"
          @click="changeFeature(feat)"
        >
          {{ feat }}
        </button>
      </div>

      <!-- 桑基图容器 -->
      <div class="sankey-chart-wrapper">
        <div
          ref="sankeyContainerRef"
          class="sankey-chart"
          :style="{ width: sankeyWidth }"
        />
      </div>
    </div>

    <!-- 详情卡片 (Pin Detail) -->
    <Teleport to="body">
      <Transition name="detail-card-fade">
        <div
          v-if="selectedDetail"
          class="sankey-detail-card"
          :class="{
            'is-desktop-card': !isMobileLayout,
            'is-hover-preview': !isMobileLayout && !isCardPinned
          }"
        >
          <div class="detail-card-header">
            <div class="detail-card-meta">
              <div class="detail-card-title-row">
                <div
                  class="detail-card-title"
                  v-html="selectedDetail.title"
                />
              </div>
              <div
                class="detail-card-subtitle"
                v-html="selectedDetail.subtitle"
              />
              <div class="detail-card-count">
                共 <strong>{{ selectedDetail.count }}</strong> 字
              </div>
            </div>
            <button
              v-show="isMobileLayout || isCardPinned"
              type="button"
              class="detail-card-close"
              @click="closeDetailCard"
            >
              ×
            </button>
          </div>

          <div class="detail-card-body ui-scrollbar">
            <div class="detail-card-chars">
              {{ selectedDetail.chars.join('、') }}
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import * as echarts from 'echarts'
import { getFeatureStats } from '@/api/index.js'
import { setRunning } from '@/main/store/store.js'

const { t } = useI18n()

// ========== Props ==========
const props = defineProps({
  queryLocations: {
    type: Array,
    default: () => []
  }
})

// ========== 响应式数据 ==========
const rawData = ref(null)
const activeFeature = ref('聲母')
const isLoading = ref(false)
const errorMessage = ref('')

// 详情卡片状态
const selectedDetail = ref(null)
const isCardPinned = ref(false)

// ECharts 相关
const sankeyContainerRef = ref(null)
const chartInstance = ref(null)
const isMobileLayout = ref(false)
const MOBILE_LAYOUT_MEDIA_QUERY = '(max-aspect-ratio: 1/1)'

// ========== 计算属性 ==========
// 动态宽度计算
const sankeyWidth = computed(() => {
  if (!rawData.value?.data) return '100%'
  const validLocs = props.queryLocations.filter(loc => rawData.value.data[loc])
  if (validLocs.length < 2) return '100%'
  const minWidthPerColumn = isMobileLayout.value ? 160 : 240
  return `${validLocs.length * minWidthPerColumn}px`
})

// ========== 方法 ==========
const changeFeature = async (feat) => {
  activeFeature.value = feat
  closeDetailCard()
  await nextTick()
  await renderSankey(props.queryLocations)
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

const waitForFrame = () => new Promise(resolve => requestAnimationFrame(resolve))

const handleQuery = async (queryLocs) => {
  isLoading.value = true
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

    // 关键：先让 loading 结束，使图表容器进入 DOM
    isLoading.value = false

    // 等 Vue 更新 DOM
    await nextTick()

    // 再等一帧，确保浏览器完成布局计算，ECharts 能拿到真实宽高
    await waitForFrame()

    await renderSankey(queryLocs)
  } catch (error) {
    console.error('Phonetic comparison query failed:', error)
    errorMessage.value = error.message || '查询失败，请重试！'
    isLoading.value = false
  } finally {
    setRunning('compare', false)
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

  chartInstance.value = echarts.init(el)

  const nodeMap = new Map()
  const links = []

  const ensureNode = (id, rawLabel, layer, depth) => {
    if (!nodeMap.has(id)) {
      nodeMap.set(id, { name: id, rawLabel, layer, depth })
    }
  }

  // 1. 构造节点
  validLocs.forEach((loc, locIdx) => {
    const featureData = raw.data[loc]?.[activeFeature.value] || {}
    Object.keys(featureData).forEach(val => {
      const id = `${locIdx}:${loc}:${val}`
      ensureNode(id, val, loc, locIdx)
    })
  })

  // 2. 构造相邻列连线
  for (let i = 0; i < validLocs.length - 1; i++) {
    const locCurr = validLocs[i]
    const locNext = validLocs[i + 1]
    const dataCurr = raw.data[locCurr]?.[activeFeature.value] || {}
    const dataNext = raw.data[locNext]?.[activeFeature.value] || {}

    Object.entries(dataCurr).forEach(([valCurr, infoCurr]) => {
      Object.entries(dataNext).forEach(([valNext, infoNext]) => {
        const indicesCurr = infoCurr.char_indices || []
        const indicesNext = infoNext.char_indices || []

        // 求交集
        const intersect = indicesCurr.filter(idx => indicesNext.includes(idx))
        if (intersect.length > 0) {
          links.push({
            source: `${i}:${locCurr}:${valCurr}`,
            target: `${i + 1}:${locNext}:${valNext}`,
            value: intersect.length,
            charIndices: intersect
          })
        }
      })
    })
  }

  const nodes = Array.from(nodeMap.values())

  const option = {
    animation: false,
    tooltip: {
      show: false
    },
    series: [{
      type: 'sankey',
      left: '4%',
      right: '4%',
      top: '8%',
      bottom: '8%',
      data: nodes,
      links: links,
      nodeAlign: 'justify',
      draggable: false,
      emphasis: {
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
      ]
    }]
  }

  chartInstance.value.setOption(option)

  await nextTick()
  requestAnimationFrame(() => {
    chartInstance.value?.resize()
  })

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

      title = `${sourceNode.layer} (${sourceNode.rawLabel}) &rarr; ${targetNode.layer} (${targetNode.rawLabel})`
      subtitle = '两地音值对应汉字'
      count = charIndices.length
      chars = charIndices.map(idx => charsMap[idx])
    } else {
      const node = nodeMap.get(params.data.name)
      const featureData = raw.data[node.layer]?.[activeFeature.value]?.[node.rawLabel] || {}
      const charIndices = featureData.char_indices || []

      title = `${node.layer} · ${node.rawLabel}`
      subtitle = `对应音值的所有汉字 (占比: ${((featureData.ratio || 0) * 100).toFixed(2)}%)`
      count = charIndices.length
      chars = charIndices.map(idx => charsMap[idx])
    }

    selectedDetail.value = { title, subtitle, count, chars }
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

        title = `${sourceNode.layer} (${sourceNode.rawLabel}) &rarr; ${targetNode.layer} (${targetNode.rawLabel})`
        subtitle = '两地音值对应汉字'
        count = charIndices.length
        chars = charIndices.map(idx => charsMap[idx])
      } else {
        const node = nodeMap.get(params.data.name)
        const featureData = raw.data[node.layer]?.[activeFeature.value]?.[node.rawLabel] || {}
        const charIndices = featureData.char_indices || []

        title = `${node.layer} · ${node.rawLabel}`
        subtitle = `对应音值的所有汉字 (占比: ${((featureData.ratio || 0) * 100).toFixed(2)}%)`
        count = charIndices.length
        chars = charIndices.map(idx => charsMap[idx])
      }

      selectedDetail.value = { title, subtitle, count, chars }
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

// ========== 监听 queryLocations 触发查询 ==========
watch(() => props.queryLocations, (newVal) => {
  if (Array.isArray(newVal) && newVal.length >= 2 && newVal.length <= 5) {
    handleQuery(newVal)
  } else {
    rawData.value = null
    clearChart()
  }
}, { deep: true, immediate: true })

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
.phonetic-compare-results-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 错误与加载 */
.error-message {
  color: var(--color-error, #d32f2f);
  background: rgba(255, 59, 48, 0.08);
  border-left: 3px solid var(--color-error, #d32f2f);
  padding: 10px 14px;
  border-radius: var(--radius-sm, 6px);
  margin-top: 15px;
  font-size: 14px;
  width: 100%;
  max-width: 520px;
  text-align: left;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 250px;
  gap: 15px;
  margin-top: 20px;

  p {
    font-size: 14px;
    color: var(--text-secondary, #666);
  }
}

/* 结果区域 */
.results-area {
  width: 100%;
  margin-top: 25px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.feature-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  justify-content: center;
}

.feature-tab {
  padding: 8px 18px;
  background: var(--glass-light, rgba(255, 255, 255, 0.3));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--border-gray-light, rgba(200, 200, 200, 0.5));
  border-radius: var(--radius-md, 12px);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-dark, #333);
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    background: var(--glass-medium, rgba(255, 255, 255, 0.5));
    transform: translateY(-1px);
  }

  &.active {
    background: var(--color-primary, #007aff);
    color: white;
    border-color: var(--color-primary, #007aff);
    box-shadow: 0 4px 10px rgba(0, 122, 255, 0.2);
  }
}

.sankey-chart-wrapper {
  width: 100%;
  overflow-x: auto;
  display: flex;
  justify-content: center;
  padding: 10px 0;
}

.sankey-chart {
  height: 800px;
  min-height: 400px;
  background: transparent;
  flex-shrink: 0;
  transition: width 0.3s ease;
}

/* 详情卡片样式 */
.sankey-detail-card {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: calc(12px + env(safe-area-inset-bottom));
  z-index: 1200;
  border: 1px solid var(--border-gray-light, rgba(200, 200, 200, 0.5));
  border-radius: var(--radius-lg, 16px);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  display: flex;
  flex-direction: column;

  &.is-desktop-card {
    position: fixed;
    top: 100px;
    right: 24px;
    left: auto;
    bottom: auto;
    width: 320px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    z-index: 9999;
    pointer-events: auto;
  }

  /* 当 Hover 预览未钉住且不是移动端时，允许穿透点击图表 */
    &.is-hover-preview {
      pointer-events: none;
    }
}

.detail-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.detail-card-meta {
  min-width: 0;
  flex: 1;
  text-align: left;
}

.detail-card-title-row {
  display: flex;
  align-items: center;
  width: 100%;
}

.detail-card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-dark, #333);
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail-card-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary, #666);
  line-height: 1.4;
}

.detail-card-count {
  margin-top: 4px;
  font-size: 11px;
  color: var(--color-primary, #007aff);
  font-weight: 600;
}

.detail-card-close {
  border: none;
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-dark, #333);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
}

.detail-card-body {
  max-height: min(35dvh, 260px);
  overflow-y: auto;
  padding: 12px 16px 16px;
  text-align: left;
}

.detail-card-chars {
  font-size: 14px;
  color: var(--text-dark, #333);
  line-height: 1.8;
  word-break: break-all;
  white-space: pre-wrap;
  letter-spacing: 1px;
}

/* Detail Card Fade Animation */
.detail-card-fade-enter-active,
.detail-card-fade-leave-active {
  transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.detail-card-fade-enter-from,
.detail-card-fade-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

/* 适配移动端面板滚动条 */
.ui-scrollbar {
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 3px;
  }
}
</style>
