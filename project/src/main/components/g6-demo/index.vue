<template>
  <div class="g6-demo">
    <div class="g6-demo__header">
      <h1>G6 树状图 Demo</h1>
      <p class="g6-demo__sub">
        上：网站功能跳转图（<code>antv-dagre</code> 分层 + 跨级/同级跳转箭头）
        ｜ 下：网站历史树（<code>compact-box</code> 树图，一条流向 + 多个子级）
      </p>
    </div>

    <div class="g6-demo__grid">
      <section class="g6-demo__panel">
        <h2>网站功能跳转图</h2>
        <G6Graph :graph-data="functionMapData" :graph-options="functionMapOptions" />
      </section>

      <section class="g6-demo__panel">
        <h2>网站历史树</h2>
        <G6Graph :graph-data="historyData" :graph-options="historyOptions" />
      </section>
    </div>
  </div>
</template>

<script setup>
import G6Graph from './G6Graph.vue'
import { functionMapData, functionMapOptions } from './functionMap.data.js'
import { historyData, historyOptions } from './history.data.js'
</script>

<style scoped>
.g6-demo {
  padding: 24px;
  height: 100%;
  overflow: auto;
  background: #f1f5f9;
}
.g6-demo__header h1 {
  margin: 0 0 8px;
  font-size: 1.4em;
  color: #0f172a;
}
.g6-demo__sub {
  margin: 0 0 20px;
  color: #475569;
  font-size: 0.9em;
}
.g6-demo__sub code {
  background: #e2e8f0;
  padding: 1px 6px;
  border-radius: 4px;
}
.g6-demo__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}
.g6-demo__panel {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.g6-demo__panel h2 {
  margin: 0 0 12px;
  font-size: 1.05em;
  color: #0f172a;
}
</style>
