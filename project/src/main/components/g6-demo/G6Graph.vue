<template>
  <div ref="containerRef" class="g6-graph" :style="{ height }"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { Graph } from '@antv/g6'

const props = defineProps({
  graphData: { type: Object, required: true },
  graphOptions: { type: Object, default: () => ({}) },
  height: { type: String, default: '640px' },
})

const containerRef = ref(null)
let graph = null

onMounted(() => {
  graph = new Graph({
    container: containerRef.value,
    data: props.graphData,
    autoFit: 'view',
    padding: 24,
    ...props.graphOptions,
  })
  graph.render()
})

onBeforeUnmount(() => {
  graph?.destroy()
  graph = null
})
</script>

<style scoped>
.g6-graph {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}
</style>
