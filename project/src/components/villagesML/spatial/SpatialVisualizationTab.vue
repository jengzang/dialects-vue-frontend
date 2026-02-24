<template>
  <div class="spatial-visualization-tab">
    <h2>🗺️ 空間可視化</h2>
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
</template>

<script setup>
// Placeholder for future implementation
</script>

<style scoped>
.spatial-visualization-tab {
  padding: 24px;
  background: var(--glass-medium);
  backdrop-filter: blur(40px) saturate(180%);
  border-radius: var(--radius-xl);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-glass);
}

h2 {
  font-size: 24px;
  margin-bottom: 20px;
  color: var(--text-primary);
  font-weight: 600;
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

@media (max-aspect-ratio: 1/1) {
  .spatial-visualization-tab {
    padding: 12px;
  }
}
</style>
