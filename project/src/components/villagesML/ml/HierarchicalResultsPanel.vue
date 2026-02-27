<template>
  <div class="hierarchical-results-panel glass-panel">
    <h3 class="panel-title">層次聚類結果</h3>

    <div v-if="loading" class="empty-state">
      <span class="loading-spinner">⏳</span> 運行中...
    </div>

    <div v-else-if="results" class="results-content">
      <!-- Summary Metrics -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">市級聚類數</div>
          <div class="metric-value">{{ results.k_city }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">縣級聚類數</div>
          <div class="metric-value">{{ results.k_county }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">鎮級聚類數</div>
          <div class="metric-value">{{ results.k_township }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">市數</div>
          <div class="metric-value">{{ results.n_cities }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">縣數</div>
          <div class="metric-value">{{ results.n_counties }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">鎮數</div>
          <div class="metric-value">{{ results.n_townships }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">執行時間</div>
          <div class="metric-value">{{ (results.execution_time_ms / 1000).toFixed(2) }}s</div>
        </div>
      </div>

      <!-- Tree -->
      <div class="tree-section">
        <h4>層次聚類樹</h4>
        <p class="tree-hint">點擊市/縣節點展開子項</p>

        <div v-for="city in results.tree" :key="city.region_name + city.cluster_id" class="city-node">
          <!-- City row -->
          <div
            class="node-row city-row"
            :class="{ expandable: city.children?.length }"
            @click="city.children?.length && toggleNode('city', city.region_name)"
          >
            <span class="expand-icon">{{ city.children?.length ? (expandedCities[city.region_name] ? '▾' : '▸') : '•' }}</span>
            <span class="cluster-badge" :style="{ background: levelColor('city', city.cluster_id) }">
              C{{ city.cluster_id }}
            </span>
            <span class="node-name">{{ city.region_name || '(未命名)' }}</span>
            <span v-if="city.children?.length" class="child-count">{{ city.children.length }} 縣</span>
          </div>

          <!-- Counties -->
          <div v-if="expandedCities[city.region_name]" class="county-list">
            <div v-for="county in city.children" :key="county.region_name + county.cluster_id" class="county-node">
              <div
                class="node-row county-row"
                :class="{ expandable: county.children?.length }"
                @click="county.children?.length && toggleNode('county', city.region_name + county.region_name)"
              >
                <span class="expand-icon">{{ county.children?.length ? (expandedCounties[city.region_name + county.region_name] ? '▾' : '▸') : '•' }}</span>
                <span class="cluster-badge" :style="{ background: levelColor('county', county.cluster_id) }">
                  C{{ county.cluster_id }}
                </span>
                <span class="node-name">{{ county.region_name || '(未命名)' }}</span>
                <span v-if="county.children?.length" class="child-count">{{ county.children.length }} 鎮</span>
              </div>

              <!-- Townships -->
              <div v-if="expandedCounties[city.region_name + county.region_name]" class="township-list">
                <div
                  v-for="township in county.children"
                  :key="township.region_name + township.cluster_id"
                  class="node-row township-row"
                >
                  <span class="expand-icon">•</span>
                  <span class="cluster-badge" :style="{ background: levelColor('township', township.cluster_id) }">
                    C{{ township.cluster_id }}
                  </span>
                  <span class="node-name">{{ township.region_name || '(未命名)' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>運行聚類後查看結果</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  results: { type: Object, default: null },
  loading: { type: Boolean, default: false }
})

const expandedCities = ref({})
const expandedCounties = ref({})

function toggleNode(level, key) {
  if (level === 'city') {
    expandedCities.value[key] = !expandedCities.value[key]
  } else {
    expandedCounties.value[key] = !expandedCounties.value[key]
  }
}

const levelColors = {
  city:     ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'],
  county:   ['#e67e22', '#1abc9c', '#e74c3c', '#3498db', '#f39c12', '#9b59b6', '#2ecc71', '#34495e', '#16a085', '#c0392b'],
  township: ['#4a90e2', '#50c878', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c', '#e67e22', '#3498db', '#2ecc71', '#34495e']
}

function levelColor(level, clusterId) {
  if (clusterId === -1) return '#95a5a6'
  const palette = levelColors[level] || levelColors.township
  return palette[clusterId % palette.length]
}
</script>

<style scoped>
.hierarchical-results-panel {
  padding: 20px;
  min-height: 400px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 20px 0;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.metric-card {
  padding: 14px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  text-align: center;
}

.metric-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.metric-value {
  font-size: 22px;
  font-weight: 600;
  color: var(--color-primary);
}

.tree-section h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.tree-hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.node-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  transition: background 0.15s;
}

.node-row.expandable {
  cursor: pointer;
}

.node-row.expandable:hover {
  background: rgba(74, 144, 226, 0.08);
}

.city-row {
  font-size: 14px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2);
  margin-bottom: 2px;
}

.county-row {
  font-size: 13px;
  font-weight: 500;
}

.township-row {
  font-size: 12px;
  color: var(--text-secondary);
}

.county-list {
  margin-left: 20px;
  border-left: 2px solid rgba(74, 144, 226, 0.15);
  padding-left: 8px;
  margin-bottom: 4px;
}

.township-list {
  margin-left: 20px;
  border-left: 2px solid rgba(80, 200, 120, 0.15);
  padding-left: 8px;
}

.expand-icon {
  width: 14px;
  font-size: 11px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.cluster-badge {
  padding: 2px 8px;
  border-radius: 10px;
  color: white;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.node-name {
  flex: 1;
  color: var(--text-primary);
}

.child-count {
  font-size: 11px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: var(--text-secondary);
  gap: 8px;
}
</style>
