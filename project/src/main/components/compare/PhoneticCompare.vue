<template>
  <div class="phonetic-compare-container">
    <div class="page-content-stack">
      <div class="tone-tip">
        {{ t('compare.messages.tab5Hint') }}
      </div>
      <div class="compare-group tab5-location-group">
        <LocationMultiInput
          v-model="locations"
          :max-locations="5"
          @update:matched-locations="handleMatchedLocations"
        />
      </div>
    </div>

    <!-- 运行按钮 -->
    <div class="run-container">
      <button
        class="run-btn"
        :disabled="isLoading || isRunDisabled"
        :class="{ disabled: isRunDisabled }"
        @click="handleQuery"
      >
        <span v-if="isLoading">🔄 {{ t('compare.button.running') }}</span>
        <span v-else-if="isRunDisabled">🚫 {{ t('compare.button.invalid') }}</span>
        <span v-else>🚀 {{ t('compare.button.startCompare') }}</span>
      </button>
    </div>

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
    <Transition name="detail-card-fade">
      <div
        v-if="selectedDetail"
        class="sankey-detail-card"
        :class="{ 'is-desktop-card': !isMobileLayout }"
        :style="!isMobileLayout ? desktopCardPosition : {}"
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import * as echarts from 'echarts'
import LocationMultiInput from '../geo/LocationMultiInput.vue'
import { getFeatureStats } from '@/api/index.js'

const { t } = useI18n()

// ========== 响应式数据 ==========
const locations = ref([])
const matchedLocations = ref([])
const rawData = ref(null)
const activeFeature = ref('聲母')
const isLoading = ref(false)
const errorMessage = ref('')

// 详情卡片状态
const selectedDetail = ref(null)
const isCardPinned = ref(false)
const desktopCardPosition = ref({ left: '0px', top: '0px' })

// ECharts 相关
const sankeyContainerRef = ref(null)
const chartInstance = ref(null)
const isMobileLayout = ref(false)
const MOBILE_LAYOUT_MEDIA_QUERY = '(max-aspect-ratio: 1/1)'

// ========== 计算属性 ==========
const isRunDisabled = computed(() => {
  return matchedLocations.value.length < 2 || matchedLocations.value.length > 5
})

// 动态宽度计算
const sankeyWidth = computed(() => {
  if (!rawData.value?.data) return '100%'
  const validLocs = locations.value.filter(loc => rawData.value.data[loc])
  if (validLocs.length < 2) return '100%'
  const minWidthPerColumn = isMobileLayout.value ? 160 : 240
  return `${validLocs.length * minWidthPerColumn}px`
})

// ========== 方法 ==========
const handleMatchedLocations = (locs) => {
  matchedLocations.value = locs
}

const changeFeature = async (feat) => {
  activeFeature.value = feat
  closeDetailCard()
  await nextTick()
  await renderSankey()
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

// 请求接口数据
const handleQuery = async () => {
  if (isRunDisabled.value) return

  isLoading.value = true
  errorMessage.value = ''
  rawData.value = null
  closeDetailCard()

  try {
    const params = {
      locations: matchedLocations.value,
      features: ['聲母', '韻母', '聲調']
    }

    const response = await getFeatureStats(params)

    if (!response || !response.data) {
      throw new Error('接口返回数据无效')
    }

    // 过滤出真正含有音值数据的有效地点
    const validLocs = matchedLocations.value.filter(loc => response.data[loc])
    if (validLocs.length < 2) {
      throw new Error('所选地点中含有有效音值数据的地点不足 2 个，无法进行比较！')
    }

    rawData.value = response
    await nextTick()
    await renderSankey()
  } catch (error) {
    console.error('Phonetic comparison query failed:', error)
    errorMessage.value = error.message || '查询失败，请重试！'
  } finally {
    isLoading.value = false
  }
}

// 渲染桑基图
const renderSankey = async () => {
  clearChart()
  if (!sankeyContainerRef.value || !rawData.value) return

  const raw = rawData.value
  const charsMap = raw.chars_map || []
  const allLocs = matchedLocations.value
  const validLocs = allLocs.filter(loc => raw.data[loc])

  if (validLocs.length < 2) return

  chartInstance.value = echarts.init(sankeyContainerRef.value)

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
      trigger: 'item',
      triggerOn: 'mousemove',
      confine: true,
      formatter: (params) => {
        if (params.dataType === 'edge') {
          const sourceNode = nodeMap.get(params.data.source)
          const targetNode = nodeMap.get(params.data.target)
          const charIndices = params.data.charIndices || []
          const displayChars = charIndices.slice(0, 15).map(idx => charsMap[idx])
          const remaining = charIndices.length - displayChars.length

          return `
            <div style="padding: 6px; font-size: 13px; font-family: sans-serif; line-height: 1.6;">
              <div style="font-weight: bold; margin-bottom: 4px; color: #007aff;">
                ${sourceNode.layer} (${sourceNode.rawLabel}) &rarr; ${targetNode.layer} (${targetNode.rawLabel})
              </div>
              <div style="border-top: 1px solid #eee; margin: 4px 0; padding-top: 4px;">
                共 <strong>${charIndices.length}</strong> 字
              </div>
              <div style="color: #666; margin-top: 4px; max-width: 250px; white-space: normal;">
                字：${displayChars.join('、')}${remaining > 0 ? ` ...等（共${charIndices.length}字，点击查看全部）` : ''}
              </div>
            </div>
          `
        }

        const node = nodeMap.get(params.data.name)
        const featureData = raw.data[node.layer]?.[activeFeature.value]?.[node.rawLabel] || {}
        const charIndices = featureData.char_indices || []
        const displayChars = charIndices.slice(0, 15).map(idx => charsMap[idx])
        const remaining = charIndices.length - displayChars.length

        return `
          <div style="padding: 6px; font-size: 13px; font-family: sans-serif; line-height: 1.6;">
            <div style="font-weight: bold; margin-bottom: 4px; color: #333;">
              地点：${node.layer} <br/>
              音值：<strong style="color: #007aff;">${node.rawLabel}</strong>
            </div>
            <div style="border-top: 1px solid #eee; margin: 4px 0; padding-top: 4px;">
              字数：<strong>${featureData.count || charIndices.length}</strong> <br/>
              占比：<strong>${((featureData.ratio || 0) * 100).toFixed(2)}%</strong>
            </div>
            <div style="color: #666; margin-top: 4px; max-width: 250px; white-space: normal;">
              字：${displayChars.join('、')}${remaining > 0 ? ` ...等（共${charIndices.length}字，点击查看全部）` : ''}
            </div>
          </div>
        `
      }
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

    // 桌面端点击时计算卡片浮动位置
    if (!isMobileLayout.value && params.event?.event) {
      const e = params.event.event
      const cardWidth = 340
      const cardHeight = 300

      let x = e.clientX + 20
      let y = e.clientY + 20

      if (x + cardWidth > window.innerWidth) x = e.clientX - cardWidth - 20
      if (y + cardHeight > window.innerHeight) y = window.innerHeight - cardHeight - 20
      if (y < 10) y = 10

      desktopCardPosition.value = { left: `${x}px`, top: `${y}px` }
    }
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

      if (params.event?.event) {
        const e = params.event.event
        let x = e.clientX + 20
        let y = e.clientY + 20
        desktopCardPosition.value = { left: `${x}px`, top: `${y}px` }
      }
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
.phonetic-compare-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-content-stack {
  width: 100%;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.tone-tip {
  font-size: 14px;
  color: var(--text-secondary, #666);
  text-align: left;
}

.tab5-location-group {
  width: 100%;
  text-align: left;
}

/* 运行按钮放置 */
.run-container {
  position: fixed;
  bottom: 25px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  pointer-events: none;

  .run-btn {
    pointer-events: auto;
  }
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
  height: 480px;
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
    right: auto;
    bottom: auto;
    width: 320px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    z-index: 9999;
    pointer-events: auto;
  }

  /* 当 Hover 预览未钉住且不是移动端时，允许穿透点击图表 */
  &.is-desktop-card:not(:has(.detail-card-close:visible)) {
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
