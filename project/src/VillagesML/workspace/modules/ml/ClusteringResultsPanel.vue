<template>
  <div class="vml-glass-panel">
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
          <div class="metric-value">{{ displayNClusters }}</div>
        </div>
        <div class="metric-card" v-if="displayNNoise !== undefined">
          <div class="metric-label">噪聲點數</div>
          <div class="metric-value">{{ displayNNoise }}</div>
          <div class="metric-hint">DBSCAN 未分類點</div>
        </div>
        <div class="metric-card" v-if="displayNoiseRatio !== undefined">
          <div class="metric-label">噪聲比例</div>
          <div class="metric-value">{{ (displayNoiseRatio * 100).toFixed(1) }}%</div>
          <div class="metric-hint">噪聲點佔比</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">{{ assignmentLabel }}數</div>
          <div class="metric-value">{{ displayCount }}</div>
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
        <div v-if="displayNClusters === 0" class="all-noise-notice">
          所有區域均為噪聲點，請嘗試調大 eps 或減小 min_samples
        </div>
        <div class="profiles-grid">
          <div
            v-for="profile in clusterProfiles"
            :key="profile.cluster_id"
            class="profile-card"
            :style="{ borderColor: getClusterColor(profile.cluster_id) }"
          >
            <div class="profile-header">
              <span class="cluster-badge" :style="{ background: getClusterColor(profile.cluster_id) }">
                {{ profile.cluster_id === -1 ? '噪聲' : `聚類 ${profile.cluster_id}` }}
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
        <h4>分配詳情</h4>
        <div class="table-container">
          <table class="assignments-table">
            <thead>
              <tr>
                <th>{{ assignmentLabel }}</th>
                <th>聚類ID</th>
                <th>距離中心</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="assignment in results.assignments" :key="assignment[assignmentNameKey] + assignment.cluster_id">
                <td class="region-name">{{ assignment[assignmentNameKey] }}</td>
                <td>
                  <span
                    class="cluster-badge small"
                    :style="{ background: getClusterColor(assignment.cluster_id) }"
                  >
                    {{ assignment.cluster_id === -1 ? '噪聲' : assignment.cluster_id }}
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

    <!-- Region Modal -->
    <AppModal
      :model-value="showRegionModal"
      size="lg"
      :show-close="false"
      @update:modelValue="closeRegionModal"
    >
      <template #header>
        <div class="cluster-region-modal-header">
          <h3 class="cluster-region-modal-heading">
            <span class="cluster-badge" :style="{ background: getClusterColor(selectedProfile?.cluster_id) }">
              聚類 {{ selectedProfile?.cluster_id }}
            </span>
            <span class="cluster-region-modal-title">所有區域 ({{ selectedProfile?.region_count }})</span>
          </h3>
          <button class="close-btn close-btn-lg close-btn-inline" aria-label="關閉" @click="closeRegionModal">✕</button>
        </div>
      </template>

      <div class="region-grid">
        <span
          v-for="region in selectedProfile?.regions"
          :key="region"
          class="region-tag"
        >
          {{ region }}
        </span>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppModal from '@/components/common/AppModal.vue'

const props = defineProps({
  results: { type: Object, default: null }
})

const emit = defineEmits(['adjust-params'])

// Region display settings
const maxDisplayRegions = 8
const showRegionModal = ref(false)
const selectedProfile = ref(null)

// Cluster color mapping
const clusterColors = [
  '#4a90e2', '#50c878', '#f39c12', '#e74c3c', '#9b59b6',
  '#1abc9c', '#34495e', '#e67e22', '#3498db', '#2ecc71'
]

const getClusterColor = (clusterId) => {
  if (clusterId === -1) return '#95a5a6' // gray for noise
  return clusterColors[clusterId % clusterColors.length]
}

// Derive metrics from assignments when not provided by API
const derivedNClusters = computed(() => {
  if (!props.results?.assignments) return null
  const ids = new Set(props.results.assignments.map(a => a.cluster_id).filter(id => id !== -1))
  return ids.size
})

const displayNClusters = computed(() => {
  return props.results?.metrics?.n_clusters ?? derivedNClusters.value ?? props.results?.k ?? 'N/A'
})

const displayNNoise = computed(() => {
  if (props.results?.metrics?.n_noise !== undefined) return props.results.metrics.n_noise
  if (props.results?.algorithm !== 'dbscan') return undefined
  if (!props.results?.assignments) return undefined
  return props.results.assignments.filter(a => a.cluster_id === -1).length
})

const displayNoiseRatio = computed(() => {
  if (props.results?.metrics?.noise_ratio !== undefined) return props.results.metrics.noise_ratio
  if (props.results?.algorithm !== 'dbscan') return undefined
  if (!props.results?.assignments?.length) return undefined
  return props.results.assignments.filter(a => a.cluster_id === -1).length / props.results.assignments.length
})

// Generate cluster profiles from assignments when not provided by API
const clusterProfiles = computed(() => {
  if (props.results?.cluster_profiles?.length) return props.results.cluster_profiles
  if (!props.results?.assignments) return []
  const key = assignmentNameKey.value
  const clusterMap = {}
  for (const a of props.results.assignments) {
    if (!clusterMap[a.cluster_id]) {
      clusterMap[a.cluster_id] = { cluster_id: a.cluster_id, regions: [], region_count: 0 }
    }
    clusterMap[a.cluster_id].regions.push(a[key])
    clusterMap[a.cluster_id].region_count++
  }
  return Object.values(clusterMap).sort((a, b) => a.cluster_id - b.cluster_id)
})

// Detect assignment name key (region_name vs village_name)
const assignmentNameKey = computed(() => {
  const first = props.results?.assignments?.[0]
  if (!first) return 'region_name'
  return 'village_name' in first ? 'village_name' : 'region_name'
})

const assignmentLabel = computed(() => {
  return assignmentNameKey.value === 'village_name' ? '村莊名稱' : '區域名稱'
})

// Display count: n_regions for region-level, sampled/spatial counts for others
const displayCount = computed(() => {
  return props.results?.n_regions
    ?? props.results?.n_spatial_clusters
    ?? props.results?.sampled_village_count
    ?? props.results?.original_village_count
    ?? 'N/A'
})

// Get displayed regions (limited)
const getDisplayedRegions = (regions) => {
  return regions.slice(0, maxDisplayRegions)
}

// Get all regions for a cluster from assignments
const getAllRegionsForCluster = (clusterId) => {
  if (!props.results?.assignments) return []
  const key = assignmentNameKey.value
  return props.results.assignments
    .filter(a => a.cluster_id === clusterId)
    .map(a => a[key])
}

// Get actual region count for display
const getActualRegionCount = (profile) => {
  if (profile.regions.length < profile.region_count) return profile.region_count
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
.vml-glass-panel {
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
  grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
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
  border-left-color: var(--color-success);
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

.cluster-region-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.cluster-region-modal-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.cluster-region-modal-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-secondary);
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

@media (max-width: 768px) {
  .metric-value {
    font-size: 18px;
  }

  .metric-card {
    padding: 12px;
  }
}
</style>
