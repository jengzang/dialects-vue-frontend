<template>
  <div class="spatial-features-panel glass-panel">
    <h3 class="panel-title">🗺️ 空間特徵</h3>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加載中...</p>
    </div>

    <div v-else-if="data" class="spatial-content">
      <div class="spatial-grid">
        <div v-if="data.spatial_features?.hotspot_id" class="spatial-item">
          <div class="item-icon">🔥</div>
          <div class="item-content">
            <div class="item-label">熱點ID</div>
            <div class="item-value">{{ data.spatial_features.hotspot_id }}</div>
          </div>
        </div>

        <div v-if="data.spatial_features?.cluster_id" class="spatial-item">
          <div class="item-icon">🎯</div>
          <div class="item-content">
            <div class="item-label">聚類ID</div>
            <div class="item-value">{{ data.spatial_features.cluster_id }}</div>
          </div>
        </div>

        <div v-if="data.spatial_features?.distance_to_center" class="spatial-item">
          <div class="item-icon">📏</div>
          <div class="item-content">
            <div class="item-label">距中心距離</div>
            <div class="item-value">{{ data.spatial_features.distance_to_center.toFixed(2) }} km</div>
          </div>
        </div>

        <div v-if="data.spatial_features?.density" class="spatial-item">
          <div class="item-icon">📊</div>
          <div class="item-content">
            <div class="item-label">密度指數</div>
            <div class="item-value">{{ data.spatial_features.density.toFixed(4) }}</div>
          </div>
        </div>
      </div>

      <!-- Map placeholder -->
      <div class="map-placeholder">
        <p>🗺️ 地圖可視化</p>
        <p class="map-note">經度: {{ data.longitude }}, 緯度: {{ data.latitude }}</p>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>暫無數據</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  villageId: {
    type: Number,
    required: true
  },
  data: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.spatial-features-panel {
  padding: 24px;
}

.panel-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
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

.spatial-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.spatial-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.spatial-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  transition: transform 0.3s ease;
}

.spatial-item:hover {
  transform: translateY(-3px);
}

.item-icon {
  font-size: 32px;
  margin-right: 15px;
}

.item-content {
  flex: 1;
}

.item-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.item-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-primary);
}

.map-placeholder {
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  text-align: center;
}

.map-placeholder p {
  font-size: 24px;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.map-note {
  font-size: 14px !important;
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}
</style>
