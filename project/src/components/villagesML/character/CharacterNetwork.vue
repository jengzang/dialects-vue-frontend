<template>
  <div class="character-network-page">
    <h3 class="villagesml-subtab-title">字符分析 - 字符網絡</h3>

    <!-- Auth warning -->
    <div v-if="!isAuthenticated" class="auth-warning">
      <span>此功能需要登入才能使用</span>
      <button @click="goToAuth" class="solid-button small">前往登入</button>
    </div>

    <!-- Controls -->
    <div class="controls-panel glass-panel">
      <div class="controls-row">
        <div class="control-group">
          <label>字符</label>
          <input v-model="rootChar" maxlength="1" class="char-input" placeholder="字" />
        </div>
        <div class="control-group">
          <label>擴展深度</label>
          <select v-model.number="depth" class="glass-select">
            <option :value="1">1 層</option>
            <option :value="2">2 層</option>
            <option :value="3">3 層</option>
            <option :value="4">4 層</option>
          </select>
        </div>
        <div class="control-group">
          <label>每節點 Top-K（1-10）</label>
          <input v-model.number="topK" type="number" min="1" max="10" class="glass-input small" />
        </div>
        <div class="control-group">
          <label>最低相似度</label>
          <input v-model.number="minSimilarity" type="number" min="0.1" max="0.99" step="0.05" class="glass-input small" />
        </div>
        <div class="control-group">
          <label>最大節點數</label>
          <input v-model.number="maxNodes" type="number" min="10" max="100" class="glass-input small" />
        </div>
        <button
          class="solid-button"
          :disabled="!rootChar || loading || !isAuthenticated"
          @click="buildNetwork"
        >
          生成網絡
        </button>
      </div>
    </div>

    <!-- Progress -->
    <div v-if="loading" class="progress-panel glass-panel">
      <div class="spinner"></div>
      <p class="progress-text">{{ progressText }}</p>
      <div class="progress-bar-track">
        <div class="progress-bar-fill" :style="{ width: progressPct + '%' }"></div>
      </div>
    </div>

    <!-- Graph -->
    <div v-if="graphReady" class="graph-panel glass-panel">
      <div class="graph-stats">
        <span class="stat-item">節點 <strong>{{ graphNodes.length }}</strong></span>
        <span class="stat-item">邊 <strong>{{ graphLinks.length }}</strong></span>
        <span class="stat-item">深度 <strong>{{ depth }}</strong> 層</span>
      </div>
      <div class="depth-legend">
        <span v-for="(color, d) in DEPTH_COLORS" :key="d" class="legend-item">
          <span class="legend-dot" :style="{ background: color }"></span>
          {{ ['根節點', '第1層', '第2層', '第3層', '第4層'][d] }}
        </span>
      </div>
      <div ref="chartRef" class="network-chart"></div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!loading" class="empty-state glass-panel">
      <p>輸入字符並點擊「生成網絡」開始分析</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { getCharSimilarities } from '@/api/index.js'
import { showWarning } from '@/utils/message.js'
import { userStore } from '@/utils/store.js'

const router = useRouter()

// Auth
const isAuthenticated = computed(() => userStore.isAuthenticated)
const goToAuth = () => router.push('/auth?redirect=/explore?tab=villages')

// Controls
const rootChar = ref('')
const depth = ref(2)
const topK = ref(5)
const minSimilarity = ref(0.6)
const maxNodes = ref(50)

// State
const loading = ref(false)
const progressText = ref('')
const progressPct = ref(0)
const graphNodes = ref([])
const graphLinks = ref([])
const graphReady = ref(false)
const chartRef = ref(null)
let chartInstance = null

const DEPTH_COLORS = { 0: '#007aff', 1: '#34c759', 2: '#ff9500', 3: '#ff3b30', 4: '#af52de' }

// BFS network builder
const buildNetwork = async () => {
  if (!rootChar.value || !isAuthenticated.value) return
  loading.value = true
  graphReady.value = false
  progressText.value = '正在查詢根節點...'
  progressPct.value = 0

  const nodesMap = new Map()
  const linksSet = new Set()
  const linksArr = []

  nodesMap.set(rootChar.value, { depth: 0, similarity: 1.0 })
  let currentQueue = [{ char: rootChar.value, depth: 0 }]

  for (let hop = 1; hop <= depth.value; hop++) {
    if (!currentQueue.length) break
    const nextQueue = []
    let processed = 0

    for (const { char } of currentQueue) {
      if (nodesMap.size >= maxNodes.value) break
      progressText.value = `正在擴展第 ${hop} 層... 已加載 ${nodesMap.size}/${maxNodes.value} 節點`
      progressPct.value = Math.round(((hop - 1) / depth.value + processed / (currentQueue.length * depth.value)) * 100)

      try {
        const result = await getCharSimilarities({ char, top_k: topK.value, min_similarity: minSimilarity.value })
        const similarities = result.similarities || []

        for (const item of similarities) {
          if (nodesMap.size >= maxNodes.value) break
          if (!item.character || item.similarity < minSimilarity.value) continue

          const linkKey = [char, item.character].sort().join('->')
          if (!linksSet.has(linkKey)) {
            linksSet.add(linkKey)
            linksArr.push({ source: char, target: item.character, value: item.similarity })
          }
          if (!nodesMap.has(item.character)) {
            nodesMap.set(item.character, { depth: hop, similarity: item.similarity })
            if (hop < depth.value) nextQueue.push({ char: item.character, depth: hop })
          }
        }
      } catch { /* skip failed nodes */ }
      processed++
    }
    currentQueue = nextQueue
  }

  graphNodes.value = Array.from(nodesMap.entries()).map(([char, meta]) => ({
    id: char, name: char, value: meta.similarity, depth: meta.depth,
    symbolSize: meta.depth === 0 ? 60 : 28 + meta.similarity * 22,
    itemStyle: { color: DEPTH_COLORS[meta.depth] ?? DEPTH_COLORS[4] },
    label: { fontSize: meta.depth === 0 ? 20 : 14, fontWeight: meta.depth === 0 ? 'bold' : 'normal' }
  }))
  graphLinks.value = linksArr.map(l => ({
    source: l.source, target: l.target, value: l.value,
    lineStyle: { width: 1 + l.value * 3, opacity: 0.25 + l.value * 0.5 }
  }))

  if (nodesMap.size <= 1) showWarning('未找到足夠相似的字符，請降低相似度閾值')

  progressText.value = `完成！共 ${nodesMap.size} 個節點，${linksArr.length} 條邊`
  progressPct.value = 100
  loading.value = false
  graphReady.value = true
  await nextTick()
  renderChart()
}

const renderChart = () => {
  if (!chartRef.value) return
  if (chartInstance) chartInstance.dispose()
  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption({
    tooltip: {
      formatter: (params) => {
        if (params.dataType === 'edge')
          return `${params.data.source} → ${params.data.target}<br/>相似度: ${(params.data.value * 100).toFixed(1)}%`
        const depthLabel = ['根節點', '第1層', '第2層', '第3層', '第4層'][params.data.depth] ?? ''
        return `${params.data.name}  ${depthLabel}<br/>相似度: ${(params.data.value * 100).toFixed(1)}%`
      }
    },
    series: [{
      type: 'graph', layout: 'force',
      data: graphNodes.value, links: graphLinks.value,
      roam: true, label: { show: true },
      force: { repulsion: 300, edgeLength: [80, 200], gravity: 0.1 },
      emphasis: { focus: 'adjacency', lineStyle: { width: 5 } },
      lineStyle: { curveness: 0.1 }
    }]
  })
}

const onResize = () => chartInstance?.resize()

onMounted(() => window.addEventListener('resize', onResize))
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  if (chartInstance) chartInstance.dispose()
})
</script>

<style scoped>
.character-network-page { padding: 12px; max-width: 1400px; margin: 0 auto; }

.auth-warning {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 16px; margin-bottom: 12px;
  background: rgba(255, 59, 48, 0.1); border: 1px solid rgba(255, 59, 48, 0.3);
  border-radius: 10px; font-size: 14px; color: #ff3b30;
}

.controls-panel, .progress-panel, .graph-panel, .empty-state {
  margin-bottom: 16px; padding: 16px;
}

.controls-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }

.control-group { display: flex; flex-direction: column; gap: 4px; }
.control-group label { font-size: 12px; color: var(--text-secondary, #666); }

.char-input {
  width: 56px; padding: 10px; font-size: 22px; text-align: center;
  border: 2px solid rgba(0, 122, 255, 0.3); border-radius: 12px;
  background: rgba(255, 255, 255, 0.5);
}

.glass-select, .glass-input {
  padding: 8px 10px; border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}
.glass-input.small { width: 80px; }

.progress-panel { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.spinner {
  width: 28px; height: 28px; border: 3px solid rgba(0, 122, 255, 0.2);
  border-top-color: #007aff; border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.progress-text { font-size: 13px; color: var(--text-secondary, #666); margin: 0; }
.progress-bar-track {
  width: 100%; height: 6px; background: rgba(0, 0, 0, 0.08);
  border-radius: 3px; margin-top: 4px;
}
.progress-bar-fill {
  height: 100%; background: var(--color-primary, #4a90e2);
  border-radius: 3px; transition: width 0.3s ease;
}

.graph-stats { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 12px; font-size: 13px; color: var(--text-secondary, #666); }
.depth-legend { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; font-size: 13px; }
.legend-item { display: flex; align-items: center; gap: 4px; }
.legend-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }

.network-chart { width: 100%; height: 520px; }

.empty-state { text-align: center; color: var(--text-secondary, #888); padding: 40px; }
</style>
