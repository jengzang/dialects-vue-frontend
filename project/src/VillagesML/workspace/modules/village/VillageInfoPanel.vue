<template>
  <div class="vml-glass-panel">
    <h3 class="panel-title">📋 完整信息</h3>

    <div v-if="loading" class="vml-loading">
      <div class="ui-loading--page" aria-hidden="true"></div>
      <p>加載中...</p>
    </div>

    <div v-else-if="data" class="info-content">
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">村名:</span>
          <span class="info-value">{{ data.name }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">城市:</span>
          <span class="info-value">{{ data.city }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">區縣:</span>
          <span class="info-value">{{ data.county }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">鄉鎮:</span>
          <span class="info-value">{{ data.township }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">經度:</span>
          <span class="info-value">{{ data.longitude?.toFixed(6) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">緯度:</span>
          <span class="info-value">{{ data.latitude?.toFixed(6) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">村ID:</span>
          <span class="info-value">{{ data.id }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">字符數:</span>
          <span class="info-value">{{ data.name?.length }}</span>
        </div>
      </div>

      <!-- Additional fields if available -->
      <div v-if="data.additional_info" class="additional-info">
        <h4>其他信息</h4>
        <pre>{{ JSON.stringify(data.additional_info, null, 2) }}</pre>
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

<style scoped lang="scss">
.info-content {
  animation: fadeInUp 0.3s ease;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: var(--glass-30);
  border-radius: var(--radius-sm2);
}

.info-label {
  font-weight: 500;
  color: var(--text-secondary);
}

.info-value {
  font-weight: 600;
  color: var(--text-primary);
}

.additional-info {
  margin-top: 20px;
  padding: 16px;
  background: var(--glass-30);
  border-radius: var(--radius-sm2);
}

.additional-info h4 {
  font-size: 16px;
  margin-bottom: 10px;
  color: var(--text-primary);
}

.additional-info pre {
  font-size: 13px;
  color: var(--text-secondary);
  overflow-x: auto;
}

</style>
