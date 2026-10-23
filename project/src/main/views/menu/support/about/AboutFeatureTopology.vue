<template>
  <section class="feature-topology" data-feature-topology aria-labelledby="feature-topology-title">
    <h2 id="feature-topology-title" class="tabs-title">功能拓扑图</h2>
    <p class="feature-topology-hint">选择分类和分组展开；拖动画布浏览，点击节点进入功能。地图图型需在进入地图后选择。</p>
    <div class="topology-controls" aria-label="选择功能分类">
      <button
        v-for="branch in branches"
        :key="branch.id"
        type="button"
        class="glass-button topology-control"
        :data-topology-focus="branch.id"
        :aria-pressed="activeBranchId === branch.id"
        :data-active="activeBranchId === branch.id"
        @click="selectBranch(branch.id)"
      >{{ branch.label }}</button>
    </div>
    <div v-if="activeBranch" class="topology-controls topology-controls--groups" aria-label="选择功能分组">
      <button
        v-for="group in activeBranch.groups"
        :key="group.id"
        type="button"
        class="glass-button topology-control"
        :data-topology-group="group.id"
        :aria-pressed="activeGroupId === group.id"
        :data-active="activeGroupId === group.id"
        @click="activeGroupId = group.id"
      >{{ group.label }}</button>
    </div>
    <div class="topology-graph-frame glass-panel">
      <G6Graph
        :key="graphKey"
        :graph-data="graphData"
        :graph-options="graphOptions"
        height="100%"
        @node-click="openNode"
      />
    </div>
    <details class="topology-link-list">
      <summary class="glass-button">文字版功能链接</summary>
      <nav aria-label="当前拓扑图的功能链接">
        <RouterLink
          v-for="node in graphData.nodes"
          :key="node.id"
          :to="buildLocalePath(resolveRouteLocale(route), node.data.route)"
          class="glass-button topology-link"
          data-topology-link
        >{{ node.data.label }}</RouterLink>
      </nav>
    </details>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import G6Graph from '@/main/components/g6-demo/G6Graph.vue'
import { NODE_COLORS, nodeStyle, treeEdgeStyle } from '@/main/components/g6-demo/g6Styles.js'

const props = defineProps({
  branches: { type: Array, required: true },
  bridgeNodes: { type: Array, required: true },
})

const route = useRoute()
const router = useRouter()
const activeBranchId = ref('')
const activeGroupId = ref('')
const portrait = ref(false)
const activeBranch = computed(() => props.branches.find(branch => branch.id === activeBranchId.value))
const graphKey = computed(() => `${portrait.value}-${activeBranchId.value}-${activeGroupId.value}`)

function selectBranch(id) {
  activeBranchId.value = id
  activeGroupId.value = ''
}

function updateOrientation() {
  portrait.value = window.matchMedia?.('(max-aspect-ratio: 1 / 1)').matches ?? false
}

onMounted(() => {
  updateOrientation()
  window.addEventListener('resize', updateOrientation)
})
onBeforeUnmount(() => window.removeEventListener('resize', updateOrientation))

const graphData = computed(() => {
  const nodes = [{ id: 'site', data: { label: '方音图鉴', kind: 'root', route: '/menu/about/intro' } }]
  const edges = []
  const addNode = (node, kind = 'feature') => nodes.push({ id: node.id, data: { label: node.label, kind, route: node.route } })
  const addEdge = (source, target, kind = 'tree') => edges.push({ source, target, data: { kind } })

  props.branches.forEach(branch => {
    addNode(branch, 'module')
    addEdge('site', branch.id)
  })
  props.bridgeNodes.forEach(node => addNode(node, 'module'))

  let bridgeSource = 'multi-analysis'
  if (activeBranch.value) {
    activeBranch.value.groups.forEach(group => {
      addNode(group, 'module')
      addEdge(activeBranch.value.id, group.id)
      if (group.id === 'compare') bridgeSource = 'compare'
      if (group.id !== activeGroupId.value) return
      const addChildren = (parent, items) => {
        items?.forEach(item => {
          addNode(item)
          addEdge(parent, item.id)
          addChildren(item.id, item.items)
        })
      }
      addChildren(group.id, group.items)
    })
  }

  props.bridgeNodes.forEach(node => {
    addEdge(bridgeSource, node.id, 'bridge')
    addEdge(node.id, 'single-analysis', 'bridge')
  })
  return { nodes, edges }
})

const graphOptions = computed(() => ({
  autoFit: activeBranchId.value ? 'center' : 'view',
  autoResize: true,
  node: { type: 'rect', style: nodeStyle() },
  edge: {
    type: 'cubic-horizontal',
    style: {
      stroke: edge => edge.data?.kind === 'bridge' ? NODE_COLORS.module.fill : treeEdgeStyle().stroke,
      lineWidth: edge => edge.data?.kind === 'bridge' ? 1.8 : 1.2,
    },
  },
  layout: {
    type: 'antv-dagre',
    rankdir: portrait.value ? 'TB' : 'LR',
    nodesep: portrait.value ? 20 : 26,
    ranksep: portrait.value ? 40 : 58,
  },
  behaviors: ['drag-canvas', 'zoom-canvas'],
}))

function openNode(id) {
  const path = graphData.value.nodes.find(node => node.id === id)?.data.route
  if (path) router.push(buildLocalePath(resolveRouteLocale(route), path))
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.feature-topology {
  margin: 2rem 0;
  text-align: left;
}

.feature-topology > .tabs-title,
.feature-topology-hint {
  text-align: center;
}

.feature-topology-hint {
  margin: 0 0 1rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.topology-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 0.65rem;
}

.topology-controls--groups {
  margin-bottom: 0.9rem;
}

.topology-control {
  --glass-button-padding: 0.45rem 0.75rem;
  --glass-button-font-size: 0.875rem;
}

.topology-control[data-active='true'] {
  color: var(--color-primary);
  border-color: var(--color-primary-border2);
}

.topology-graph-frame {
  height: min(68dvh, 540px);
  min-height: 360px;
  padding: 0.5rem;
}

.topology-link-list {
  margin-top: 0.75rem;
  text-align: center;

  nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
    margin-top: 0.75rem;
  }
}

.topology-link {
  --glass-button-padding: 0.45rem 0.75rem;
  --glass-button-font-size: 0.875rem;
}

@media (max-aspect-ratio: #{1 / 1}) {
  .topology-controls {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .topology-control {
    min-width: 0;
    white-space: normal;
  }

  .topology-graph-frame {
    height: min(62dvh, 480px);
    min-height: 340px;
  }
}
</style>
