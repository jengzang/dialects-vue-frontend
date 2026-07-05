<template>
  <div class="vml-glass-panel">
    <h3 class="panel-title">🎯 特徵向量</h3>

    <div v-if="loading" class="vml-loading">
      <div class="ui-loading--page" aria-hidden="true"></div>
      <p>加載中...</p>
    </div>

    <div v-else-if="data" class="feature-content">
      <!-- Feature Types -->
      <div class="feature-types">
        <div v-if="data.features?.semantic" class="feature-type">
          <h4>語義特徵</h4>
          <div class="feature-list">
            <div v-for="(value, key) in data.features.semantic" :key="key" class="feature-item">
              <span class="feature-name">{{ key }}</span>
              <span class="feature-value">{{ formatValue(value) }}</span>
            </div>
          </div>
        </div>

        <div v-if="data.features?.morphology" class="feature-type">
          <h4>形態特徵</h4>
          <div class="feature-list">
            <div v-for="(value, key) in data.features.morphology" :key="key" class="feature-item">
              <span class="feature-name">{{ key }}</span>
              <span class="feature-value">{{ formatValue(value) }}</span>
            </div>
          </div>
        </div>

        <div v-if="data.features?.diversity" class="feature-type">
          <h4>多樣性特徵</h4>
          <div class="feature-list">
            <div v-for="(value, key) in data.features.diversity" :key="key" class="feature-item">
              <span class="feature-name">{{ key }}</span>
              <span class="feature-value">{{ formatValue(value) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Feature Vector Visualization -->
      <div v-if="data.feature_vector" class="vector-visualization">
        <h4>特徵向量 ({{ data.feature_vector.length }} 維)</h4>
        <div class="vector-display">
          <div
            v-for="(value, index) in data.feature_vector.slice(0, 50)"
            :key="index"
            class="vector-bar"
            :style="{ height: `${Math.abs(value) * 100}%`, background: value >= 0 ? 'var(--color-primary)' : '#e74c3c' }"
            :title="`維度 ${index}: ${value.toFixed(2)}`"
          ></div>
        </div>
        <p class="vector-note">顯示前 50 維特徵向量</p>
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

const formatValue = (value) => {
  if (typeof value === 'number') {
    return value.toFixed(2)
  }
  return value
}
</script>

<style scoped>
.feature-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.feature-types {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.feature-type {
  padding: 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
}

.feature-type h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feature-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
  font-size: 14px;
}

.feature-name {
  color: var(--text-secondary);
}

.feature-value {
  font-weight: 600;
  color: var(--color-primary);
}

.vector-visualization {
  padding: 20px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
}

.vector-visualization h4 {
  font-size: 16px;
  margin-bottom: 15px;
  color: var(--text-primary);
}

.vector-display {
  display: flex;
  align-items: flex-end;
  height: 100px;
  gap: 2px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
}

.vector-bar {
  flex: 1;
  min-width: 2px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.vector-bar:hover {
  opacity: 0.7;
}

.vector-note {
  margin-top: 10px;
  font-size: 13px;
  color: var(--text-secondary);
  text-align: center;
}

</style>
