<template>
  <div class="vml-glass-panel">
    <h3 class="panel-title">語義網絡圖</h3>

    <!-- 网络元数据 -->
    <div v-if="network && !loading" class="network-metadata">
      <span class="metadata-item">
        <strong>節點數:</strong> {{ network.node_count }}
      </span>
      <span class="metadata-item">
        <strong>邊數:</strong> {{ network.edge_count }}
      </span>
      <span class="metadata-item">
        <strong>社區數:</strong> {{ network.communities?.length || 0 }}
      </span>
      <span class="metadata-item" v-if="network.execution_time_ms">
        <strong>執行時間:</strong> {{ network.execution_time_ms }}ms
      </span>
      <span class="metadata-item" v-if="network.from_cache">
        <span class="cache-badge">📦 來自緩存</span>
      </span>
    </div>

    <div v-if="loading" class="vml-loading">
      <div class="ui-loading--page" aria-hidden="true"></div>
      <p>生成網絡中...</p>
    </div>

    <div v-else-if="network" ref="chartRef" class="chart-container"></div>

    <div v-else class="empty-state">
      <p>點擊"生成網絡"查看結果</p>
    </div>

    <!-- 社区图例 -->
    <div v-if="network && network.communities" class="communities-legend">
      <h4>社區分佈</h4>
      <div class="legend-items">
        <div
          v-for="community in network.communities"
          :key="community.id"
          class="legend-item"
        >
          <span
            class="legend-color"
            :style="{ background: getCommunityColor(community.id) }"
          ></span>
          <span class="legend-label">
            社區 {{ community.id }} ({{ community.size }} 個節點)
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getCategoryDisplayName, getCategoryIcon } from '@/VillagesML/config/villagesML.js'

const props = defineProps({
  network: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  detailMode: { type: Boolean, default: false }  // 添加 detailMode prop
})

const chartRef = ref(null)
let chartInstance = null

// Helper function to get category name based on detail mode
const getCategoryName = (category) => getCategoryDisplayName(category, props.detailMode)

// 社区颜色映射
const communityColors = [
  '#4a90e2', // 蓝色
  '#50c878', // 绿色
  '#f39c12', // 橙色
  '#e74c3c', // 红色
  '#9b59b6', // 紫色
  '#1abc9c', // 青色
  '#e67e22', // 深橙
  '#3498db', // 天蓝
  '#2ecc71', // 翠绿
  '#f1c40f'  // 黄色
]

const getCommunityColor = (communityId) => {
  return communityColors[communityId % communityColors.length]
}

// 构建节点到社区的映射
const buildNodeCommunityMap = (communities) => {
  const map = {}
  if (!communities) return map

  communities.forEach(community => {
    community.nodes.forEach(nodeId => {
      map[nodeId] = community.id
    })
  })
  return map
}

// 转换节点数据为 ECharts 格式
const transformNodes = (nodes, communities) => {
  if (!nodes || nodes.length === 0) return []

  const nodeCommunityMap = buildNodeCommunityMap(communities)
  const maxDegree = Math.max(...nodes.map(node => node.degree || 1), 1)

  return nodes.map(node => {
    const communityId = nodeCommunityMap[node.id]
    const normalizedSize = ((node.degree || 1) / maxDegree) * 40 + 20
    const chineseName = getCategoryName(node.id)
    const icon = getCategoryIcon(node.id)

    return {
      id: node.id,
      name: node.id, // ⚠️ 必须保持和 edges 的 source/target 一致
      symbolSize: normalizedSize,
      value: node.degree,
      itemStyle: {
        color: communityId !== undefined ? getCommunityColor(communityId) : '#95a5a6'
      },
      label: {
        show: true,
        // ⚠️ 使用 formatter 来展示带图标的中文名
        formatter: () => `${icon}${chineseName}`,
        fontSize: 12,
        fontWeight: 'bold'
      },
      rawData: {
        englishName: node.id,
        chineseName: chineseName,
        degree: node.degree,
        betweenness: node.betweenness?.toFixed(4),
        closeness: node.closeness?.toFixed(4),
        eigenvector: node.eigenvector?.toFixed(4),
        community: communityId
      }
    }
  })
}

// 转换边数据为 ECharts 格式
const transformEdges = (edges) => {
  if (!edges || edges.length === 0) return []

  // 找出最大权重用于归一化边宽度
  const maxWeight = Math.max(...edges.map(e => e.weight || 1))

  return edges.map(edge => {
    const normalizedWidth = ((edge.weight || 1) / maxWeight) * 8 + 1 // 1-9 范围

    return {
      source: edge.source,
      target: edge.target,
      value: edge.weight,
      lineStyle: {
        width: normalizedWidth,
        curveness: edge.source === edge.target ? 0.3 : 0.1, // 自环边弯曲
      },
      label: {
        show: false,
        formatter: '{c}'
      },
      // 保存中文名称用于 tooltip
      rawData: {
        sourceChinese: getCategoryName(edge.source),
        targetChinese: getCategoryName(edge.target)
      }
    }
  })
}

const renderChart = () => {
  if (!chartRef.value || !props.network) return

  if (chartInstance) chartInstance.dispose()
  chartInstance = echarts.init(chartRef.value)

  const nodes = transformNodes(props.network.nodes, props.network.communities)
  const edges = transformEdges(props.network.edges)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (params.dataType === 'node') {
          const data = params.data.rawData
          let html = `<strong>${data.chineseName}</strong> (${data.englishName})<br/>`
          html += `度中心性: ${data.degree}<br/>`
          if (data.betweenness) html += `介數中心性: ${data.betweenness}<br/>`
          if (data.closeness) html += `接近中心性: ${data.closeness}<br/>`
          if (data.eigenvector) html += `特徵向量中心性: ${data.eigenvector}<br/>`
          if (data.community !== undefined) html += `社區: ${data.community}`
          return html
        } else if (params.dataType === 'edge') {
          const raw = params.data.rawData
          return `${raw.sourceChinese} → ${raw.targetChinese}<br/>權重: ${params.value?.toFixed(3)}`
        }
      }
    },
    series: [{
      type: 'graph',
      layout: 'force',
      data: nodes,
      edges: edges,
      roam: true,
      draggable: true,
      focusNodeAdjacency: true,
      force: {
        repulsion: 200,
        gravity: 0.1,
        edgeLength: [80, 150],
        layoutAnimation: true
      },
      emphasis: {
        focus: 'adjacency',
        lineStyle: {
          width: 5
        }
      }
    }]
  }

  chartInstance.setOption(option)
}

watch(
    [() => props.network, () => props.loading],
    ([newNetwork, newLoading]) => {
      // 只有在有数据，且不在 loading 状态下（此时 chartRef 的 DOM 才真正渲染出来）才绘制
      if (newNetwork && !newLoading) {
        nextTick(() => {
          renderChart()
        })
      }
    },
    { deep: true, immediate: true } // ⚠️ immediate 确保初始就包含数据的场景也能渲染
)

const handleResize = () => {
  chartInstance?.resize()
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.vml-glass-panel {
  padding: 20px;
  min-height: 500px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

.network-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 12px 16px;
  background: rgba(74, 144, 226, 0.1);
  border-radius: 10px;
  margin-bottom: 16px;
  font-size: 13px;
}

.metadata-item {
  color: var(--text-primary);
}

.metadata-item strong {
  color: var(--color-primary);
  margin-right: 4px;
}

.cache-badge {
  padding: 4px 10px;
  background: rgba(80, 200, 120, 0.2);
  color: #2d8659;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.chart-container {
  width: 100%;
  height: 600px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  margin-bottom: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: var(--text-primary);
}



.communities-legend {
  padding: 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
}

.communities-legend h4 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  font-size: 13px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.8);
}

.legend-label {
  color: var(--text-primary);
  font-weight: 500;
}

@media (max-width: 768px) {
  .chart-container {
    height: 400px;
  }

  .network-metadata {
    gap: 8px;
  }
}
</style>
