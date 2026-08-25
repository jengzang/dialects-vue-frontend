<template>
  <div class="graph-page glass-panel">
    <div class="graph-page__header">
      <h1>网站历史</h1>
      <p>版本时间线 · 每个版本下展示摘要、更新类型与用户可感知的主要变化</p>
    </div>
    <G6Graph
      :graph-data="historyData"
      :graph-options="historyOptions"
      height="640px"
    />
  </div>
</template>

<script setup>
import G6Graph from '@/main/components/g6-demo/G6Graph.vue'
import { historyData, historyOptions } from './history.data.js'
</script>

<style scoped>
.graph-page {
  padding: 24px;
  height: 100%;
  width: 100%;
  overflow: auto;
  background: #f1f5f9;
}
.graph-page__header h1 {
  margin: 0 0 6px;
  font-size: 1.4em;
  color: #0f172a;
}
.graph-page__header p {
  margin: 0 0 16px;
  color: #475569;
  font-size: 0.9em;
}
</style>
