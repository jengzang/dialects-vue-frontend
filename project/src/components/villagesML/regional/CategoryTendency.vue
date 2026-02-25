<template>
  <div class="category-tendency-page">
    <h3 class="villagesml-subtab-title">區域分析 - 類別傾向性</h3>

    <div class="tendency-section glass-panel">
      <h3>區域語義類別傾向性</h3>
      <p class="section-description">
        分析特定區域中各語義類別的傾向性，使用Z分數和Lift值衡量該區域對不同語義類別的偏好程度。
      </p>

      <div class="region-selector">
        <FilterableSelect
          v-model="regionName"
          :level="regionLevel"
          @update:level="(newLevel) => regionLevel = newLevel"
          @update:hierarchy="(h) => regionHierarchy = h"
          placeholder="請選擇或輸入區域"
        />
        <button
          class="query-button solid-button"
          :disabled="!regionName || loadingTendency"
          @click="loadCategoryTendency"
        >
          查詢
        </button>
      </div>

      <div v-if="loadingTendency" class="loading-state">
        <div class="spinner"></div>
      </div>

      <div v-else-if="categoryTendency.length > 0" class="tendency-results">
        <div
          v-for="item in categoryTendency"
          :key="item.category"
          class="tendency-item"
        >
          <div class="tendency-category">{{ getCategoryName(item.category) }}</div>
          <div class="tendency-bar">
            <div
              class="tendency-fill"
              :style="{
                width: `${Math.min(Math.abs(item.z_score) * 10, 100)}%`,
                background: item.z_score >= 0 ? 'var(--color-primary)' : '#e74c3c'
              }"
            ></div>
          </div>
          <div class="tendency-value">Z: {{ item.z_score.toFixed(2) }}</div>
          <div class="tendency-freq">Lift: {{ item.lift.toFixed(4) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import FilterableSelect from '@/components/common/FilterableSelect.vue'
import { getSemanticCategoryTendency } from '@/api/index.js'
import { showError } from '@/utils/message.js'
import { getCategoryName } from '@/config/villagesML.js'

// State
const categoryTendency = ref([])
const loadingTendency = ref(false)

const regionLevel = ref('city')
const regionName = ref('')
const regionHierarchy = ref({ city: null, county: null, township: null })

// Methods
const loadCategoryTendency = async () => {
  if (!regionName.value) return

  loadingTendency.value = true
  try {
    categoryTendency.value = await getSemanticCategoryTendency({
      region_level: regionLevel.value,
      ...regionHierarchy.value
    })
  } catch (error) {
    showError('加載傾向性失敗')
  } finally {
    loadingTendency.value = false
  }
}
</script>

<style scoped>
.category-tendency-page {
  padding: 12px;
  max-width: 1400px;
  margin: 0 auto;
}

.tendency-section {
  padding: 16px;
}

.tendency-section h3 {
  font-size: 16px;
  margin-bottom: 10px;
  color: var(--text-primary);
}

.section-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
  line-height: 1.6;
}

.region-selector {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
}

.query-button {
  padding: 10px 20px;
  font-size: 14px;
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

.tendency-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tendency-item {
  display: grid;
  grid-template-columns: 120px 1fr 100px 120px;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  transition: background 0.3s ease;
}

.tendency-item:hover {
  background: rgba(74, 144, 226, 0.1);
}

.tendency-category {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}

.tendency-bar {
  height: 24px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  overflow: hidden;
}

.tendency-fill {
  height: 100%;
  transition: width 0.5s ease;
}

.tendency-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
  text-align: right;
}

.tendency-freq {
  font-size: 13px;
  color: var(--text-secondary);
  text-align: right;
}

@media (max-width: 768px) {
  .region-selector {
    flex-direction: column;
  }

  .tendency-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
