<template>
  <div class="clustering-results-panel glass-panel">
    <h3 class="panel-title">聚類結果</h3>

    <div v-if="results" class="results-content">
      <!-- Parameter Suggestion Alert (DBSCAN only) -->
      <div
        v-if="results.param_suggestion && results.param_suggestion.status !== 'good'"
        class="param-suggestion-alert"
        :class="`alert-${results.param_suggestion.status}`"
      >
        <div class="alert-header">
          <span class="alert-icon">{{ getAlertIcon(results.param_suggestion.status) }}</span>
          <strong class="alert-title">{{ results.param_suggestion.message }}</strong>
        </div>
        <p class="alert-message">{{ results.param_suggestion.suggestion }}</p>
        <button
          v-if="results.param_suggestion.recommended_action"
          class="quick-adjust-button"
          @click="handleQuickAdjust(results.param_suggestion.recommended_action)"
        >
          {{ getAdjustButtonText(results.param_suggestion.recommended_action) }}
        </button>
      </div>

      <!-- Metrics Grid -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">輪廓係數</div>
          <div class="metric-value">{{ results.metrics?.silhouette_score?.toFixed(3) || 'N/A' }}</div>
          <div class="metric-hint">越接近1越好</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">聚類數</div>
          <div class="metric-value">{{ results.metrics?.n_clusters ?? results.k ?? 'N/A' }}</div>
        </div>
        <div class="metric-card" v-if="results.metrics?.n_noise !== undefined">
          <div class="metric-label">噪聲點數</div>
          <div class="metric-value">{{ results.metrics.n_noise }}</div>
          <div class="metric-hint">DBSCAN 未分類點</div>
        </div>
        <div class="metric-card" v-if="results.metrics?.noise_ratio !== undefined">
          <div class="metric-label">噪聲比例</div>
          <div class="metric-value">{{ (results.metrics.noise_ratio * 100).toFixed(1) }}%</div>
          <div class="metric-hint">噪聲點佔比</div>
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
                v-for="region in getDisplayedRegions(profile.regions)"
                :key="region"
                class="region-tag"
              >
                {{ region }}
              </span>
              <button
                v-if="getActualRegionCount(profile) > maxDisplayRegions"
                class="expand-button"
                @click="openRegionModal(profile)"
              >
                +{{ getActualRegionCount(profile) - maxDisplayRegions }} 更多
              </button>
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

    <!-- Region Modal (Teleported to body) -->
    <Teleport to="body">
      <div v-if="showRegionModal" class="modal-overlay" @click="closeRegionModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>
              <span class="cluster-badge" :style="{ background: getClusterColor(selectedProfile?.cluster_id) }">
                聚類 {{ selectedProfile?.cluster_id }}
              </span>
              <span class="modal-title">所有區域 ({{ selectedProfile?.region_count }})</span>
            </h3>
            <button class="modal-close" @click="closeRegionModal">✕</button>
          </div>
          <div class="modal-body">
            <div class="region-grid">
              <span
                v-for="region in selectedProfile?.regions"
                :key="region"
                class="region-tag"
              >
                {{ region }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  results: { type: Object, default: null }
})

const emit = defineEmits(['adjust-params'])

// Region display settings
const maxDisplayRegions = 8 // 默認顯示8個區域
const showRegionModal = ref(false)
const selectedProfile = ref(null)

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

// Get displayed regions (limited)
const getDisplayedRegions = (regions) => {
  return regions.slice(0, maxDisplayRegions)
}

// Get all regions for a cluster from assignments
const getAllRegionsForCluster = (clusterId) => {
  if (!props.results?.assignments) return []
  return props.results.assignments
    .filter(a => a.cluster_id === clusterId)
    .map(a => a.region_name)
}

// Get actual region count for display
const getActualRegionCount = (profile) => {
  // If profile.regions is truncated, use region_count
  // Otherwise use the actual array length
  if (profile.regions.length < profile.region_count) {
    return profile.region_count
  }
  return profile.regions.length
}

// Modal handlers
const openRegionModal = (profile) => {
  // Get all regions from assignments table
  const allRegions = getAllRegionsForCluster(profile.cluster_id)
  selectedProfile.value = {
    ...profile,
    regions: allRegions.length > 0 ? allRegions : profile.regions,
    region_count: allRegions.length > 0 ? allRegions.length : profile.region_count
  }
  showRegionModal.value = true
}

const closeRegionModal = () => {
  showRegionModal.value = false
  selectedProfile.value = null
}

// Alert helpers
const getAlertIcon = (status) => {
  const icons = {
    'too_loose': '⚠️',
    'too_strict': '⚠️',
    'high_noise': '⚠️',
    'good': '✅'
  }
  return icons[status] || '💡'
}

const getAdjustButtonText = (action) => {
  const texts = {
    'decrease_eps': '🔽 減小 eps',
    'increase_eps': '🔼 增大 eps',
    'decrease_min_samples': '🔽 減小 min_samples',
    'increase_min_samples': '🔼 增大 min_samples'
  }
  return texts[action] || '調整參數'
}

const handleQuickAdjust = (action) => {
  emit('adjust-params', action)
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
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
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

.expand-button {
  padding: 4px 10px;
  background: rgba(74, 144, 226, 0.15);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 12px;
  color: #4a90e2;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.expand-button:hover {
  background: rgba(74, 144, 226, 0.25);
  border-color: rgba(74, 144, 226, 0.5);
  transform: translateY(-1px);
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
  overflow: auto;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 16px;
  max-height: 500px;
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

/* Parameter Suggestion Alert */
.param-suggestion-alert {
  padding: 16px 20px;
  margin-bottom: 20px;
  border-radius: 12px;
  border-left: 4px solid;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
}

.alert-too_loose,
.alert-too_strict,
.alert-high_noise {
  border-left-color: #f39c12;
  background: rgba(243, 156, 18, 0.1);
}

.alert-good {
  border-left-color: #50c878;
  background: rgba(80, 200, 120, 0.1);
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.alert-icon {
  font-size: 18px;
}

.alert-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.alert-message {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 12px 28px;
  line-height: 1.5;
}

.quick-adjust-button {
  margin-left: 28px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  background: rgba(74, 144, 226, 0.15);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-adjust-button:hover {
  background: rgba(74, 144, 226, 0.25);
  border-color: rgba(74, 144, 226, 0.5);
  transform: translateY(-1px);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85));
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 800px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.modal-header h3 {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-secondary);
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  font-size: 18px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.1);
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.region-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.region-grid .region-tag {
  padding: 6px 12px;
  font-size: 13px;
}
</style>
