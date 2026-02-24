<template>
  <div class="spatial-hotspots-tab">
<!--      <h3 class="villagesml-subtab-title">空間分析 - 空間熱點</h3>-->
    <h2>🔥 空間熱點</h2>
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
                {{ hotspot.center_lat?.toFixed(4) || 'N/A' }}, {{ hotspot.center_lon?.toFixed(4) || 'N/A' }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">半徑:</span>
              <span class="value">{{ hotspot.radius_km?.toFixed(2) || 'N/A' }} km</span>
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
              <div class="stat-value">{{ hotspotDetail.village_count || 0 }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">密度分數</div>
              <div class="stat-value">
                {{ hotspotDetail.density_score?.toFixed(4) || 'N/A' }}
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-label">半徑</div>
              <div class="stat-value">
                {{ hotspotDetail.radius_km?.toFixed(2) || 'N/A' }} km
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-label">中心坐標</div>
              <div class="stat-value">
                {{ hotspotDetail.center_lat?.toFixed(4) || 'N/A' }}, {{ hotspotDetail.center_lon?.toFixed(4) || 'N/A' }}
              </div>
            </div>
          </div>

          <!-- 熱點地圖 -->
          <SpatialMap mode="hotspot" :hotspot="hotspotDetail" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SpatialMap from './SpatialMap.vue'
import { getSpatialHotspots, getSpatialHotspotDetail } from '@/api/index.js'
import { showError } from '@/utils/message.js'

// State
const hotspots = ref([])
const selectedHotspot = ref(null)
const hotspotDetail = ref(null)
const loadingHotspots = ref(false)
const loadingHotspotDetail = ref(false)

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
</script>

<style scoped>
.spatial-hotspots-tab {
  padding: 16px;
  background: var(--glass-medium);
  backdrop-filter: blur(40px) saturate(180%);
  border-radius: var(--radius-xl);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-glass);
}

h2 {
  font-size: 24px;
  margin-bottom: 16px;
  color: var(--text-primary);
  font-weight: 600;
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
  margin-bottom: 16px;
}

.load-button:hover:not(:disabled) {
  background: #3a7bc8;
}

.load-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  gap: 16px;
}

.hotspots-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
}

.hotspot-detail h3 {
  font-size: 16px;
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
  margin-bottom: 16px;
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

@media (max-width: 1024px) {
  .hotspots-content {
    grid-template-columns: 1fr;
  }
}

@media (max-aspect-ratio: 1/1) {
  .spatial-hotspots-tab {
    padding: 12px;
  }

  .hotspot-detail {
    padding: 12px;
  }
}
</style>
