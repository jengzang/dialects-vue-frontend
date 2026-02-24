<template>
  <div class="spatial-clusters-tab">
    <h2>🎯 空間聚類</h2>
    <div class="cluster-controls">
      <button
        class="load-button"
        :disabled="loadingClusters"
        @click="loadClusters"
      >
        加載聚類數據
      </button>
      <button
        class="load-button"
        :disabled="loadingClustersSummary"
        @click="loadClustersSummary"
      >
        加載統計摘要
      </button>
    </div>

    <div v-if="loadingClusters" class="loading-state">
      <div class="spinner"></div>
      <p>加載中...</p>
    </div>

    <div v-else-if="clusters.length > 0" class="clusters-content">
      <!-- 聚類元數據 -->
      <div v-if="clustersMetadata" class="clusters-metadata">
        <span class="metadata-item">
          <strong>運行ID:</strong> {{ clustersMetadata.run_id }}
        </span>
        <span class="metadata-item">
          <strong>總聚類數:</strong> {{ clustersMetadata.total_clusters }}
        </span>
        <span class="metadata-item">
          <strong>噪聲點:</strong> {{ clustersMetadata.noise_points }}
        </span>
      </div>

      <!-- Clusters Grid -->
      <div class="clusters-grid">
        <div
          v-for="cluster in displayedClusters"
          :key="cluster.cluster_id"
          class="cluster-card"
        >
          <div class="cluster-header">
            <span class="cluster-id">聚類 #{{ cluster.cluster_id }}</span>
            <span class="cluster-count">{{ cluster.size }} 點</span>
          </div>
          <div class="cluster-info">
            <div class="info-row">
              <span class="label">質心:</span>
              <span class="value">
                {{ cluster.centroid_lat?.toFixed(4) || 'N/A' }}, {{ cluster.centroid_lon?.toFixed(4) || 'N/A' }}
              </span>
            </div>
            <div class="info-row">
              <span class="label">平均距離:</span>
              <span class="value">{{ cluster.avg_distance_km?.toFixed(2) || 'N/A' }} km</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="clusters.length > displayLimit" class="more-info">
        顯示前 {{ displayLimit }} 個聚類，共 {{ clusters.length }} 個
        <button class="show-more-btn" @click="showAllClusters">顯示全部</button>
      </div>
      <div v-else-if="showingAll && clusters.length > 20" class="more-info">
        顯示全部 {{ clusters.length }} 個聚類
        <button class="show-more-btn" @click="showLessClusters">顯示前20個</button>
      </div>
    </div>

    <!-- 聚類地圖 -->
    <div v-if="clusters.length > 0" style="margin-top: 20px;">
      <h3>聚類地圖</h3>
      <SpatialMap mode="clusters" :clusters="clusters" />
    </div>

    <!-- Clusters Summary -->
    <div v-if="clustersSummary" class="summary-panel">
      <h3>聚類統計摘要</h3>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-icon">🎯</div>
          <div class="summary-label">總聚類數</div>
          <div class="summary-value">{{ clustersSummary.total_clusters || 0 }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">📊</div>
          <div class="summary-label">噪聲點數</div>
          <div class="summary-value">{{ clustersSummary.noise_points || 0 }}</div>
        </div>
        <div class="summary-card" v-if="clustersSummary.clusters">
          <div class="summary-icon">📈</div>
          <div class="summary-label">平均規模</div>
          <div class="summary-value">
            {{ (clustersSummary.clusters.reduce((sum, c) => sum + c.size, 0) / clustersSummary.clusters.length).toFixed(1) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SpatialMap from './SpatialMap.vue'
import { getSpatialClusters, getSpatialClustersSummary } from '@/api/index.js'
import { showError } from '@/utils/message.js'

// State
const clusters = ref([])
const clustersMetadata = ref(null)
const clustersSummary = ref(null)
const loadingClusters = ref(false)
const loadingClustersSummary = ref(false)
const displayLimit = ref(20)
const showingAll = ref(false)

// Computed
const displayedClusters = computed(() => {
  return clusters.value.slice(0, displayLimit.value)
})

// Methods
const showAllClusters = () => {
  displayLimit.value = clusters.value.length
  showingAll.value = true
}

const showLessClusters = () => {
  displayLimit.value = 20
  showingAll.value = false
}

const loadClusters = async () => {
  loadingClusters.value = true
  try {
    const response = await getSpatialClusters()
    if (response.clusters) {
      clusters.value = response.clusters
      clustersMetadata.value = {
        run_id: response.run_id,
        total_clusters: response.total_clusters,
        noise_points: response.noise_points
      }
    } else {
      clusters.value = response
    }
  } catch (error) {
    showError('加載聚類數據失敗')
  } finally {
    loadingClusters.value = false
  }
}

const loadClustersSummary = async () => {
  loadingClustersSummary.value = true
  try {
    const response = await getSpatialClustersSummary()
    clustersSummary.value = response
  } catch (error) {
    showError('加載統計摘要失敗')
  } finally {
    loadingClustersSummary.value = false
  }
}
</script>

<style scoped>
.spatial-clusters-tab {
  padding: 24px;
  background: var(--glass-medium);
  backdrop-filter: blur(40px) saturate(180%);
  border-radius: var(--radius-xl);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-glass);
}

h2, h3 {
  font-size: 24px;
  margin-bottom: 20px;
  color: var(--text-primary);
  font-weight: 600;
}

h3 {
  font-size: 20px;
  margin-top: 20px;
}

.load-button {
  padding: 10px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.load-button:hover:not(:disabled) {
  background: #3a7bc8;
}

.load-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cluster-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.loading-state {
  text-align: center;
  padding: 40px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(74, 144, 226, 0.2);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.clusters-content {
  margin-top: 20px;
}

.clusters-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
  background: rgba(74, 144, 226, 0.1);
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
}

.metadata-item {
  color: var(--text-primary);
}

.metadata-item strong {
  color: var(--color-primary);
  margin-right: 4px;
}

.clusters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.cluster-card {
  padding: 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.cluster-card:hover {
  background: rgba(74, 144, 226, 0.1);
}

.cluster-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.cluster-id {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.cluster-count {
  padding: 3px 10px;
  background: rgba(80, 200, 120, 0.2);
  color: #2d8659;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.cluster-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cluster-info .info-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.cluster-info .label {
  color: var(--text-secondary);
}

.cluster-info .value {
  color: var(--text-primary);
  font-weight: 500;
}

.more-info {
  text-align: center;
  padding: 16px;
  background: rgba(243, 156, 18, 0.1);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.show-more-btn {
  padding: 6px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.show-more-btn:hover {
  background: #3a7bc8;
}

.summary-panel {
  margin-top: 30px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
}

.summary-panel h3 {
  font-size: 18px;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.summary-card {
  padding: 20px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  text-align: center;
}

.summary-icon {
  font-size: 36px;
  margin-bottom: 10px;
}

.summary-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.summary-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-primary);
}

@media (max-width: 768px) {
  .clusters-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-aspect-ratio: 1/1) {
  .spatial-clusters-tab {
    padding: 12px;
  }
}
</style>
