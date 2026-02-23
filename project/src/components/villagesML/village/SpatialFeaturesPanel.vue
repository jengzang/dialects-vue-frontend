<template>
  <div class="spatial-features-panel glass-panel">
    <h3 class="panel-title">🗺️ 空間特徵</h3>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加載中...</p>
    </div>

    <div v-else-if="data" class="spatial-content">
      <div class="spatial-grid">
        <div v-if="data.spatial_cluster_id !== undefined" class="spatial-item">
          <div class="item-icon">🎯</div>
          <div class="item-content">
            <div class="item-label">空間聚類ID</div>
            <div class="item-value">{{ data.spatial_cluster_id }}</div>
          </div>
        </div>

        <div v-if="data.cluster_size" class="spatial-item">
          <div class="item-icon">📦</div>
          <div class="item-content">
            <div class="item-label">聚類大小</div>
            <div class="item-value">{{ data.cluster_size }}</div>
          </div>
        </div>

        <div v-if="data.nn_distance_1" class="spatial-item">
          <div class="item-icon">📏</div>
          <div class="item-content">
            <div class="item-label">最近鄰距離</div>
            <div class="item-value">{{ data.nn_distance_1.toFixed(2) }} km</div>
          </div>
        </div>

        <div v-if="data.local_density_1km !== undefined" class="spatial-item">
          <div class="item-icon">📊</div>
          <div class="item-content">
            <div class="item-label">1km密度</div>
            <div class="item-value">{{ data.local_density_1km }}</div>
          </div>
        </div>

        <div v-if="data.local_density_5km !== undefined" class="spatial-item">
          <div class="item-icon">📊</div>
          <div class="item-content">
            <div class="item-label">5km密度</div>
            <div class="item-value">{{ data.local_density_5km }}</div>
          </div>
        </div>

        <div v-if="data.local_density_10km !== undefined" class="spatial-item">
          <div class="item-icon">📊</div>
          <div class="item-content">
            <div class="item-label">10km密度</div>
            <div class="item-value">{{ data.local_density_10km }}</div>
          </div>
        </div>

        <div v-if="data.isolation_score !== undefined" class="spatial-item">
          <div class="item-icon">🏝️</div>
          <div class="item-content">
            <div class="item-label">孤立度</div>
            <div class="item-value">{{ data.isolation_score.toFixed(2) }}</div>
          </div>
        </div>

        <div v-if="data.is_isolated !== undefined" class="spatial-item">
          <div class="item-icon">{{ data.is_isolated ? '⚠️' : '✅' }}</div>
          <div class="item-content">
            <div class="item-label">是否孤立</div>
            <div class="item-value">{{ data.is_isolated ? '是' : '否' }}</div>
          </div>
        </div>
      </div>

      <!-- Coordinates -->
      <div v-if="data.longitude && data.latitude" class="coordinates-line">
        🗺️ 地理坐標: {{ data.longitude.toFixed(6) }}, {{ data.latitude.toFixed(6) }}
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

.coordinates-line {
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-primary);
  text-align: center;
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
