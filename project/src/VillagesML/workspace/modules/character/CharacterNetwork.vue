<template>
  <div class="character-network-page">
    <h3 class="villagesml-subtab-title">
      字符分析 - 字符網絡
      <HelpIcon
        content="基於字符嵌入向量構建相似性網絡圖。節點表示字符，邊表示相似關係，邊粗細反映相似度強度。支持多層擴展（深度1-4），從根節點逐層展開相似字符。顏色表示層級：根節點（藍色）→第1層（綠色）→第2層（黃色）→第3層（紅色）→第4層（紫色）"
        size="md"
        fontSize="16px"
        trigger="both"
      />
    </h3>

    <!-- Auth warning -->
    <div v-if="!isAuthenticated" class="auth-warning">
      <span>此功能需要登錄才能使用</span>
      <button @click="goToAuth" class="solid-button small">前往登錄</button>
    </div>

    <!-- Controls -->
    <div class="controls-panel vml-glass-panel">
      <div class="vml-control-surface">
        <div class="vml-control-row vml-control-row--center">
          <div class="vml-control-field vml-control-field--compact">
            <label>字符</label>
            <input v-model="rootChar" maxlength="1" class="vml-char-input" placeholder="請輸入單個漢字" />
          </div>
          <div class="vml-control-field vml-control-field--compact">
            <label>擴展深度</label>
            <SimpleSelectDropdown
              v-model.number="depth"
              :options="depthOptions"
            />
          </div>
          <div class="vml-control-field vml-control-field--compact">
            <label>每節點 Top-K（1-10）</label>
            <input v-model.number="topK" type="number" min="1" max="10" class="glass-input small" />
          </div>
          <div class="vml-control-field vml-control-field--compact">
            <label>最低相似度</label>
            <input v-model.number="minSimilarity" type="number" min="0.1" max="0.99" step="0.05" class="glass-input small" />
          </div>
          <div class="vml-control-field vml-control-field--compact">
            <label>最大節點數</label>
            <input v-model.number="maxNodes" type="number" min="10" max="1000" class="glass-input small" />
          </div>
          <div class="vml-control-actions">
            <button
              class="solid-button"
              :disabled="!rootChar || loading || !isAuthenticated"
              @click="buildNetwork"
            >
              生成網絡
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Progress -->
    <div v-if="loading" class="progress-panel vml-glass-panel">
      <div class="ui-loading--page" aria-hidden="true"></div>
      <p class="progress-text">{{ progressText }}</p>
      <div class="progress-bar-track">
        <div class="progress-bar-fill" :style="{ width: progressPct + '%' }"></div>
      </div>
    </div>

    <!-- Graph -->
    <div v-if="graphReady" class="graph-panel vml-glass-panel">
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
    <div v-else-if="!loading" class="empty-state vml-glass-panel">
      <p>輸入字符並點擊「生成網絡」開始分析</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as echarts from 'echarts'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import { fetchCharacterNetwork } from '@/api/index.js'
import { showWarning } from '@/utils/ui/message.js'
import { userStore } from '@/main/store/store.js'
import { buildCurrentVillagesMLPath } from '@/VillagesML/utils/currentDataset.js'

const router = useRouter()
const route = useRoute()

// Auth
const isAuthenticated = computed(() => userStore.isAuthenticated)
const goToAuth = () => router.push({
  path: '/auth',
  query: {
    redirect: route.fullPath || buildCurrentVillagesMLPath({ module: 'character', subtab: 'network' })
  }
})

// Controls
const rootChar = ref('')
const depth = ref(2)
const topK = ref(5)
const minSimilarity = ref(0.3)
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

// Options for SimpleSelectDropdown
const depthOptions = [
  { label: '1 層', value: 1 },
  { label: '2 層', value: 2 },
  { label: '3 層', value: 3 },
  { label: '4 層', value: 4 }
]

const buildNetwork = async () => {
  if (!rootChar.value || !isAuthenticated.value) return
  if (maxNodes.value > 1000) {
    showWarning('最大節點數不能超過 1000，已自動調整')
    maxNodes.value = 1000
  }
  loading.value = true
  graphReady.value = false
  progressText.value = '正在請求網絡數據...'
  progressPct.value = 30

  try {
    const data = await fetchCharacterNetwork({
      rootChar: rootChar.value,
      depth: depth.value,
      topK: topK.value,
      minSimilarity: minSimilarity.value,
      maxNodes: maxNodes.value
    })

    progressPct.value = 80
    progressText.value = '正在渲染圖表...'

    const nodes = (data.nodes || []).map(n => ({
      id: n.character, name: n.character, value: n.similarity, depth: n.depth,
      symbolSize: n.depth === 0 ? 60 : 28 + n.similarity * 22,
      itemStyle: { color: DEPTH_COLORS[n.depth] ?? DEPTH_COLORS[4] },
      label: { fontSize: n.depth === 0 ? 20 : 14, fontWeight: n.depth === 0 ? 'bold' : 'normal' }
    }))

    const links = (data.edges || []).map(l => ({
      source: l.source, target: l.target, value: l.similarity,
      lineStyle: { width: 1 + l.similarity * 3, opacity: 0.25 + l.similarity * 0.5 }
    }))

    graphNodes.value = nodes
    graphLinks.value = links

    if (nodes.length <= 1) showWarning('未找到足夠相似的字符，請降低相似度閾值')

    progressText.value = `完成！共 ${nodes.length} 個節點，${links.length} 條邊`
    progressPct.value = 100
    loading.value = false
    graphReady.value = true
    await nextTick()
    renderChart()
  } catch {
    loading.value = false
    progressText.value = '網絡請求失敗，請稍後重試'
  }
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

<style scoped lang="scss">
.character-network-page { padding: 12px; max-width: 1400px; margin: 0 auto; }

.auth-warning {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 16px; margin-bottom: 12px;
  background: rgba(var(--color-error-light-rgb), 0.1); border: 1px solid rgba(var(--color-error-light-rgb), 0.3);
  border-radius: var(--radius-md); font-size: 14px; color: var(--color-error-light);
}

.controls-panel, .progress-panel, .graph-panel, .empty-state {
  margin-bottom: 16px; padding: 16px;
}

.vml-char-input {
  min-width: 56px;
  width: 100%;
  font-size: 14px;
  border-color: rgba(var(--color-primary-rgb), 0.3);
}

.glass-select, .glass-input {
  padding: 8px 10px; border-radius: var(--radius-sm2);
  border: 1px solid var(--glass-60);
  background: var(--glass-50);
  font-size: 14px;
}
.glass-input.small { min-width: 56px; width: 100%; flex: 1; }

.progress-panel { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.progress-text { font-size: 13px; color: var(--text-secondary, var(--text-tertiary)); margin: 0; }
.progress-bar-track {
  width: 100%; height: 6px; background: rgba(0, 0, 0, 0.08);
  border-radius: 3px; margin-top: var(--radius-xs);
}
.progress-bar-fill {
  height: 100%; background: var(--color-primary, var(--vml-blue));
  border-radius: 3px; transition: width 0.3s ease;
}

.graph-stats { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 12px; font-size: 13px; color: var(--text-secondary, var(--text-tertiary)); }
.depth-legend { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; font-size: 13px; }
.legend-item { display: flex; align-items: center; gap: 4px; }
.legend-dot { display: inline-block; width: 10px; height: 10px; border-radius: var(--radius-full); }

.network-chart { width: 100%; height: clamp(320px, 70dvh, 520px); }

.empty-state { text-align: center; color: var(--text-secondary, var(--text-muted)); padding: 40px; }
</style>
