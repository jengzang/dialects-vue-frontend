<template>
  <div class="graph-page glass-panel">
    <div class="graph-page__header">
      <h1>网站功能思维导图</h1>
      <p>十大功能模块 · 红色虚线箭头为功能间跳转</p>
    </div>
    <G6Graph :graph-data="featuresData" :graph-options="featuresOptions" height="760px" />
  </div>
</template>

<script setup>
import G6Graph from '@/main/components/g6-demo/G6Graph.vue'
import { featuresData, featuresOptions } from './features.data.js'
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
