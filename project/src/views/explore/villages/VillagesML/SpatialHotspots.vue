<template>
<!--  <ExploreLayout>-->
    <div class="spatial-hotspots-page">
      <h1 class="page-title">🗺️ 空間熱點與聚類</h1>

      <!-- Hotspots Section -->
      <div class="hotspots-section glass-panel">
        <h2>空間熱點</h2>
        <button
          class="load-button"
          :disabled="loadingHotspots"
          @click="loadHotspots"
        >
          加載熱點數據
        </button>

        <div v-if="loadingHotspots" class="loading-state">
          <div class="spinner"></div>
          <p>加載中...</p>
        </div>

        <div v-else-if="hotspots.length > 0" class="hotspots-content">
          <!-- Hotspots List -->
          <div class="hotspots-list">
            <div
              v-for="hotspot in hotspots"
              :key="hotspot.hotspot_id"
              class="hotspot-card"
              :class="{ 'selected': selectedHotspot?.hotspot_id === hotspot.hotspot_id }"
              @click="selectHotspot(hotspot)"
            >
              <div class="hotspot-header">
                <span class="hotspot-id">熱點 #{{ hotspot.hotspot_id }}</span>
                <span class="hotspot-count">{{ hotspot.village_count }} 村</span>
              </div>
              <div class="hotspot-info">
                <div class="info-item">
                  <span class="label">中心:</span>
                  <span class="value">
                    {{ hotspot.center_lat.toFixed(4) }}, {{ hotspot.center_lng.toFixed(4) }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="label">半徑:</span>
                  <span class="value">{{ hotspot.radius.toFixed(2) }} km</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Hotspot Detail -->
          <div v-if="selectedHotspot" class="hotspot-detail">
            <h3>熱點詳情 #{{ selectedHotspot.hotspot_id }}</h3>
            <button
              class="load-button"
              :disabled="loadingHotspotDetail"
              @click="loadHotspotDetail"
            >
              加載詳細信息
            </button>

            <div v-if="loadingHotspotDetail" class="loading-state">
              <div class="spinner"></div>
            </div>

            <div v-else-if="hotspotDetail" class="detail-content">
              <div class="detail-stats">
                <div class="stat-card">
                  <div class="stat-label">村莊數量</div>
                  <div class="stat-value">{{ hotspotDetail.villages?.length || 0 }}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">平均密度</div>
                  <div class="stat-value">
                    {{ hotspotDetail.statistics?.avg_density?.toFixed(2) || 'N/A' }}
                  </div>
                </div>
              </div>

              <!-- Map Placeholder -->
              <div class="map-placeholder">
                <p>🗺️ 熱點地圖可視化</p>
                <p class="map-note">顯示熱點範圍和包含的村莊</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Clusters Section -->
      <div class="clusters-section glass-panel">
        <h2>空間聚類</h2>
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
          <!-- Clusters Grid -->
          <div class="clusters-grid">
            <div
              v-for="cluster in clusters.slice(0, 20)"
              :key="cluster.cluster_id"
              class="cluster-card"
            >
              <div class="cluster-header">
                <span class="cluster-id">聚類 #{{ cluster.cluster_id }}</span>
                <span class="cluster-count">{{ cluster.village_count }} 村</span>
              </div>
              <div class="cluster-centroid">
                <span class="label">質心:</span>
                <span class="value">
                  {{ cluster.centroid[0].toFixed(4) }}, {{ cluster.centroid[1].toFixed(4) }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="clusters.length > 20" class="more-info">
            顯示前 20 個聚類，共 {{ clusters.length }} 個
          </div>
        </div>

        <!-- Clusters Summary -->
        <div v-if="clustersSummary" class="summary-panel">
          <h3>聚類統計摘要</h3>
          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-icon">🎯</div>
              <div class="summary-label">總聚類數</div>
              <div class="summary-value">{{ clustersSummary.total_clusters }}</div>
            </div>
            <div class="summary-card">
              <div class="summary-icon">📊</div>
              <div class="summary-label">平均規模</div>
              <div class="summary-value">{{ clustersSummary.avg_size?.toFixed(1) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Visualization Section -->
      <div class="visualization-section glass-panel">
        <h2>空間可視化</h2>
        <div class="viz-placeholder">
          <p>🗺️ 熱點與聚類綜合地圖</p>
          <p class="viz-note">使用 MapLibre GL 展示所有熱點和聚類的空間分佈</p>
          <div class="viz-legend">
            <div class="legend-item">
              <span class="legend-color hotspot-color"></span>
              <span>熱點區域</span>
            </div>
            <div class="legend-item">
              <span class="legend-color cluster-color"></span>
              <span>聚類中心</span>
            </div>
          </div>
        </div>
      </div>
    </div>
<!--  </ExploreLayout>-->
</template>

<script setup>
import { ref } from 'vue'
import ExploreLayout from '@/layouts/ExploreLayout.vue'
import {
  getSpatialHotspots,
  getSpatialHotspotDetail,
  getSpatialClusters,
  getSpatialClustersSummary
} from '@/api/index.js'
import { showError } from '@/utils/message.js'

// State
const hotspots = ref([])
const selectedHotspot = ref(null)
const hotspotDetail = ref(null)
const clusters = ref([])
const clustersSummary = ref(null)

const loadingHotspots = ref(false)
const loadingHotspotDetail = ref(false)
const loadingClusters = ref(false)
const loadingClustersSummary = ref(false)

// Methods
const loadHotspots = async () => {
  loadingHotspots.value = true
  try {
    hotspots.value = await getSpatialHotspots()
  } catch (error) {
    showError('加載熱點數據失敗')
  } finally {
    loadingHotspots.value = false
  }
}

const selectHotspot = (hotspot) => {
  selectedHotspot.value = hotspot
  hotspotDetail.value = null
}

const loadHotspotDetail = async () => {
  if (!selectedHotspot.value) return

  loadingHotspotDetail.value = true
  try {
    hotspotDetail.value = await getSpatialHotspotDetail(selectedHotspot.value.hotspot_id)
  } catch (error) {
    showError('加載熱點詳情失敗')
  } finally {
    loadingHotspotDetail.value = false
  }
}

const loadClusters = async () => {
  loadingClusters.value = true
  try {
    clusters.value = await getSpatialClusters()
  } catch (error) {
    showError('加載聚類數據失敗')
  } finally {
    loadingClusters.value = false
  }
}

const loadClustersSummary = async () => {
  loadingClustersSummary.value = true
  try {
    clustersSummary.value = await getSpatialClustersSummary()
  } catch (error) {
    showError('加載統計摘要失敗')
  } finally {
    loadingClustersSummary.value = false
  }
}
</script>

<style scoped>
.spatial-hotspots-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 30px;
  text-align: center;
}

.hotspots-section,
.clusters-section,
.visualization-section {
  padding: 24px;
  margin-bottom: 30px;
}

.hotspots-section h2,
.clusters-section h2,
.visualization-section h2 {
  font-size: 20px;
  margin-bottom: 20px;
  color: var(--text-primary);
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

.hotspots-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.hotspots-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 600px;
  overflow-y: auto;
}

.hotspot-card {
  padding: 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.hotspot-card:hover {
  background: rgba(74, 144, 226, 0.1);
  transform: translateX(5px);
}

.hotspot-card.selected {
  background: rgba(74, 144, 226, 0.2);
  border-color: var(--color-primary);
}

.hotspot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.hotspot-id {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.hotspot-count {
  padding: 4px 12px;
  background: rgba(243, 156, 18, 0.2);
  color: #c87f0a;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}

.hotspot-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.info-item .label {
  color: var(--text-secondary);
}

.info-item .value {
  color: var(--text-primary);
  font-weight: 500;
}

.hotspot-detail {
  padding: 20px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
}

.hotspot-detail h3 {
  font-size: 18px;
  margin-bottom: 15px;
  color: var(--text-primary);
}

.detail-content {
  margin-top: 20px;
}

.detail-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  padding: 16px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary);
}

.map-placeholder {
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  text-align: center;
}

.map-placeholder p {
  font-size: 20px;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.map-note {
  font-size: 14px !important;
  color: var(--text-secondary);
}

.clusters-content {
  margin-top: 20px;
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
  transform: translateY(-3px);
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

.cluster-centroid {
  font-size: 12px;
  display: flex;
  justify-content: space-between;
}

.cluster-centroid .label {
  color: var(--text-secondary);
}

.cluster-centroid .value {
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

.viz-placeholder {
  padding: 80px 20px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  text-align: center;
}

.viz-placeholder p {
  font-size: 24px;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.viz-note {
  font-size: 14px !important;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.viz-legend {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--text-primary);
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.hotspot-color {
  background: rgba(243, 156, 18, 0.6);
}

.cluster-color {
  background: rgba(74, 144, 226, 0.6);
}

@media (max-width: 1024px) {
  .hotspots-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 24px;
  }

  .cluster-controls {
    flex-direction: column;
  }

  .clusters-grid {
    grid-template-columns: 1fr;
  }
}
</style>
