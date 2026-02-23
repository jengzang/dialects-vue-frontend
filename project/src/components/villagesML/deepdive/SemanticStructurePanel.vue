<template>
  <div class="semantic-structure-panel glass-panel">
    <h3 class="panel-title">🏷️ 語義結構</h3>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加載中...</p>
    </div>

    <div v-else-if="data" class="semantic-content">
      <!-- Categories -->
      <div v-if="data.semantic_structure?.categories" class="section">
        <h4>語義類別</h4>
        <div class="category-tags">
          <span
            v-for="category in data.semantic_structure.categories"
            :key="category"
            class="category-tag"
          >
            {{ category }}
          </span>
        </div>
      </div>

      <!-- Labels -->
      <div v-if="data.semantic_structure?.labels" class="section">
        <h4>語義標籤</h4>
        <div class="label-list">
          <div
            v-for="label in data.semantic_structure.labels"
            :key="label.label"
            class="label-item"
          >
            <span class="label-name">{{ label.label }}</span>
            <span class="label-category">{{ label.category }}</span>
          </div>
        </div>
      </div>

      <!-- Composition -->
      <div v-if="data.semantic_structure?.composition" class="section">
        <h4>組合模式</h4>
        <div class="composition-list">
          <div
            v-for="(comp, index) in data.semantic_structure.composition"
            :key="index"
            class="composition-item"
          >
            <span class="comp-pattern">{{ comp.pattern }}</span>
            <span class="comp-description">{{ comp.description }}</span>
          </div>
        </div>
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
.semantic-structure-panel {
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

.semantic-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.section {
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
}

.section h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-tag {
  padding: 6px 16px;
  background: var(--color-primary);
  color: white;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.label-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
}

.label-name {
  font-weight: 600;
  color: var(--text-primary);
}

.label-category {
  font-size: 13px;
  color: var(--text-secondary);
  padding: 2px 10px;
  background: rgba(74, 144, 226, 0.1);
  border-radius: 12px;
}

.composition-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.composition-item {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
}

.comp-pattern {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: 4px;
}

.comp-description {
  font-size: 14px;
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}
</style>
