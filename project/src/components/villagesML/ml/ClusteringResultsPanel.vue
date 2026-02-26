<template>
  <div class="clustering-results-panel glass-panel">
    <h3 class="panel-title">聚類結果</h3>

    <div v-if="results" class="results-content">
      <!-- Metrics Grid -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">輪廓係數</div>
          <div class="metric-value">{{ results.metrics?.silhouette_score?.toFixed(3) || 'N/A' }}</div>
          <div class="metric-hint">越接近1越好</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">聚類數</div>
          <div class="metric-value">{{ results.k || 'N/A' }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">區域數</div>
          <div class="metric-value">{{ results.n_regions || 'N/A' }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">執行時間</div>
          <div class="metric-value">{{ (results.execution_time_ms / 1000).toFixed(2) }}s</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Davies-Bouldin</div>
          <div class="metric-value">{{ results.metrics?.davies_bouldin_index?.toFixed(3) || 'N/A' }}</div>
          <div class="metric-hint">越小越好</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Calinski-Harabasz</div>
          <div class="metric-value">{{ results.metrics?.calinski_harabasz_score?.toFixed(1) || 'N/A' }}</div>
          <div class="metric-hint">越大越好</div>
        </div>
      </div>

      <!-- Cluster Profiles -->
      <div class="cluster-profiles">
        <h4>聚類概況</h4>
        <div class="profiles-grid">
          <div
            v-for="profile in results.cluster_profiles"
            :key="profile.cluster_id"
            class="profile-card"
            :style="{ borderColor: getClusterColor(profile.cluster_id) }"
          >
            <div class="profile-header">
              <span class="cluster-badge" :style="{ background: getClusterColor(profile.cluster_id) }">
                聚類 {{ profile.cluster_id }}
              </span>
              <span class="region-count">{{ profile.region_count }} 個區域</span>
            </div>
            <div class="region-list">
              <span
                v-for="region in profile.regions"
                :key="region"
                class="region-tag"
              >
                {{ region }}
              </span>
            </div>
            <div class="profile-stats">
              <div class="stat-item">
                <span class="stat-label">簇內方差:</span>
                <span class="stat-value">{{ profile.intra_cluster_variance?.toFixed(3) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Assignments Table -->
      <div class="assignments-section">
        <h4>區域分配</h4>
        <div class="table-container">
          <table class="assignments-table">
            <thead>
              <tr>
                <th>區域名稱</th>
                <th>聚類ID</th>
                <th>距離中心</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="assignment in results.assignments" :key="assignment.region_name">
                <td class="region-name">{{ assignment.region_name }}</td>
                <td>
                  <span
                    class="cluster-badge small"
                    :style="{ background: getClusterColor(assignment.cluster_id) }"
                  >
                    {{ assignment.cluster_id }}
                  </span>
                </td>
                <td class="distance">{{ assignment.distance?.toFixed(3) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>運行聚類後查看結果</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  results: { type: Object, default: null }
})

// Cluster color mapping
const clusterColors = [
  '#4a90e2', // Blue
  '#50c878', // Green
  '#f39c12', // Orange
  '#e74c3c', // Red
  '#9b59b6', // Purple
  '#1abc9c', // Teal
  '#34495e', // Dark gray
  '#e67e22', // Dark orange
  '#3498db', // Light blue
  '#2ecc71'  // Light green
]

const getClusterColor = (clusterId) => {
  return clusterColors[clusterId % clusterColors.length]
}
</script>

<style scoped>
.clustering-results-panel {
  padding: 20px;
  min-height: 400px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 20px 0;
}

.results-content h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 24px 0 12px 0;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.metric-card {
  padding: 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  text-align: center;
}

.metric-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.metric-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-primary);
}

.metric-hint {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.profiles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.profile-card {
  padding: 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  border-left: 4px solid;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.cluster-badge {
  padding: 4px 12px;
  border-radius: 12px;
  color: white;
  font-size: 13px;
  font-weight: 600;
}

.cluster-badge.small {
  padding: 2px 8px;
  font-size: 12px;
}

.region-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.region-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.region-tag {
  padding: 4px 10px;
  background: rgba(74, 144, 226, 0.1);
  border-radius: 8px;
  font-size: 12px;
  color: var(--text-primary);
}

.profile-stats {
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.stat-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.stat-label {
  color: var(--text-secondary);
}

.stat-value {
  font-weight: 600;
  color: var(--text-primary);
}

.table-container {
  overflow-x: auto;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 16px;
}

.assignments-table {
  width: 100%;
  border-collapse: collapse;
}

.assignments-table thead {
  background: rgba(74, 144, 226, 0.1);
}

.assignments-table th,
.assignments-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.assignments-table th {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.assignments-table td {
  font-size: 13px;
}

.region-name {
  font-weight: 500;
  color: var(--text-primary);
}

.distance {
  color: var(--text-secondary);
  font-family: monospace;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: var(--text-secondary);
}
</style>
