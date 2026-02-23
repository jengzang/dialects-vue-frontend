<template>
  <ExploreLayout>
    <div class="semantic-categories-page">
      <h1 class="page-title">🏷️ 語義類別與標籤</h1>

      <!-- Category List -->
      <div class="category-list glass-panel">
        <h2>語義類別</h2>
        <div v-if="loadingCategories" class="loading-state">
          <div class="spinner"></div>
          <p>加載中...</p>
        </div>
        <div v-else class="category-grid">
          <div
            v-for="category in categories"
            :key="category.category_id"
            class="category-card"
            @click="selectedCategory = category"
          >
            <div class="category-icon">{{ getCategoryIcon(category.name) }}</div>
            <div class="category-name">{{ category.name }}</div>
            <div class="category-description">{{ category.description }}</div>
          </div>
        </div>
      </div>

      <!-- VTF Analysis -->
      <div class="vtf-section">
        <div class="vtf-global glass-panel">
          <h3>全局虛擬詞頻 (VTF)</h3>
          <div v-if="loadingVTFGlobal" class="loading-state">
            <div class="spinner"></div>
          </div>
          <div v-else class="vtf-chart">
            <div
              v-for="item in vtfGlobal"
              :key="item.category"
              class="vtf-bar-container"
            >
              <div class="vtf-label">{{ item.category }}</div>
              <div class="vtf-bar">
                <div
                  class="vtf-fill"
                  :style="{ width: `${(item.vtf / maxVTF) * 100}%` }"
                ></div>
              </div>
              <div class="vtf-value">{{ item.vtf.toFixed(2) }}</div>
            </div>
          </div>
        </div>

        <div class="vtf-regional glass-panel">
          <h3>區域虛擬詞頻</h3>
          <div class="region-selector">
            <select v-model="regionLevel" class="select-input">
              <option value="city">城市</option>
              <option value="county">區縣</option>
              <option value="township">鄉鎮</option>
            </select>
            <input
              v-model="regionName"
              type="text"
              placeholder="輸入區域名稱"
              class="text-input"
            />
            <button
              class="query-button"
              :disabled="!regionName || loadingVTFRegional"
              @click="loadVTFRegional"
            >
              查詢
            </button>
          </div>
          <div v-if="loadingVTFRegional" class="loading-state">
            <div class="spinner"></div>
          </div>
          <div v-else-if="vtfRegional.length > 0" class="vtf-chart">
            <div
              v-for="item in vtfRegional"
              :key="item.category"
              class="vtf-bar-container"
            >
              <div class="vtf-label">{{ item.category }}</div>
              <div class="vtf-bar">
                <div
                  class="vtf-fill regional"
                  :style="{ width: `${(item.vtf / maxVTFRegional) * 100}%` }"
                ></div>
              </div>
              <div class="vtf-value">{{ item.vtf.toFixed(2) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Labels Section -->
      <div class="labels-section glass-panel">
        <h3>語義標籤</h3>
        <div class="labels-tabs">
          <button
            class="tab-button"
            :class="{ 'active': labelsMode === 'by-category' }"
            @click="labelsMode = 'by-category'"
          >
            按類別
          </button>
          <button
            class="tab-button"
            :class="{ 'active': labelsMode === 'by-char' }"
            @click="labelsMode = 'by-char'"
          >
            按字符
          </button>
        </div>

        <!-- By Category -->
        <div v-if="labelsMode === 'by-category'" class="labels-content">
          <select v-model="selectedCategoryForLabels" class="select-input" @change="loadLabelsByCategory">
            <option value="">選擇類別</option>
            <option v-for="cat in categories" :key="cat.name" :value="cat.name">
              {{ cat.name }}
            </option>
          </select>
          <div v-if="loadingLabels" class="loading-state">
            <div class="spinner"></div>
          </div>
          <div v-else-if="labels.length > 0" class="labels-cloud">
            <span
              v-for="label in labels"
              :key="label.label"
              class="label-tag"
              :style="{ fontSize: `${12 + (label.count / maxLabelCount) * 12}px` }"
            >
              {{ label.label }} ({{ label.count }})
            </span>
          </div>
        </div>

        <!-- By Character -->
        <div v-else class="labels-content">
          <input
            v-model="charForLabels"
            type="text"
            maxlength="1"
            placeholder="輸入字符"
            class="char-input"
            @input="loadLabelsByChar"
          />
          <div v-if="loadingLabels" class="loading-state">
            <div class="spinner"></div>
          </div>
          <div v-else-if="labels.length > 0" class="labels-list">
            <div
              v-for="label in labels"
              :key="label.label"
              class="label-item"
            >
              <span class="label-name">{{ label.label }}</span>
              <span class="label-category">{{ label.category }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Category Tendency -->
      <div v-if="selectedCategory" class="tendency-section glass-panel">
        <h3>{{ selectedCategory.name }} - 區域傾向性</h3>
        <div class="region-selector">
          <select v-model="tendencyRegionLevel" class="select-input">
            <option value="city">城市</option>
            <option value="county">區縣</option>
            <option value="township">鄉鎮</option>
          </select>
          <input
            v-model="tendencyRegionName"
            type="text"
            placeholder="輸入區域名稱"
            class="text-input"
          />
          <button
            class="query-button"
            :disabled="!tendencyRegionName || loadingTendency"
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
            <div class="tendency-category">{{ item.category }}</div>
            <div class="tendency-bar">
              <div
                class="tendency-fill"
                :style="{
                  width: `${Math.abs(item.z_score) * 10}%`,
                  background: item.z_score >= 0 ? 'var(--primary-color)' : '#e74c3c'
                }"
              ></div>
            </div>
            <div class="tendency-value">Z: {{ item.z_score.toFixed(2) }}</div>
            <div class="tendency-freq">頻率: {{ item.frequency }}</div>
          </div>
        </div>
      </div>
    </div>
  </ExploreLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ExploreLayout from '@/layouts/ExploreLayout.vue'
import {
  getSemanticCategoryList,
  getSemanticCategoryTendency,
  getSemanticVTFGlobal,
  getSemanticVTFRegional,
  getSemanticLabelsByCategory,
  getSemanticLabelsByChar
} from '@/api/index.js'
import { showError } from '@/utils/message.js'

// State
const categories = ref([])
const selectedCategory = ref(null)
const vtfGlobal = ref([])
const vtfRegional = ref([])
const categoryTendency = ref([])
const labels = ref([])

const loadingCategories = ref(false)
const loadingVTFGlobal = ref(false)
const loadingVTFRegional = ref(false)
const loadingTendency = ref(false)
const loadingLabels = ref(false)

const regionLevel = ref('city')
const regionName = ref('')
const tendencyRegionLevel = ref('city')
const tendencyRegionName = ref('')

const labelsMode = ref('by-category')
const selectedCategoryForLabels = ref('')
const charForLabels = ref('')

// Computed
const maxVTF = computed(() => {
  if (vtfGlobal.value.length === 0) return 1
  return Math.max(...vtfGlobal.value.map(item => item.vtf))
})

const maxVTFRegional = computed(() => {
  if (vtfRegional.value.length === 0) return 1
  return Math.max(...vtfRegional.value.map(item => item.vtf))
})

const maxLabelCount = computed(() => {
  if (labels.value.length === 0) return 1
  return Math.max(...labels.value.map(item => item.count || 1))
})

// Methods
const getCategoryIcon = (name) => {
  const icons = {
    '山': '⛰️',
    '水': '💧',
    '聚落': '🏘️',
    '方位': '🧭',
    '植物': '🌿',
    '動物': '🦌',
    '顏色': '🎨',
    '數字': '🔢',
    '其他': '📦'
  }
  return icons[name] || '🏷️'
}

const loadCategories = async () => {
  loadingCategories.value = true
  try {
    categories.value = await getSemanticCategoryList()
  } catch (error) {
    showError('加載類別失敗')
  } finally {
    loadingCategories.value = false
  }
}

const loadVTFGlobal = async () => {
  loadingVTFGlobal.value = true
  try {
    vtfGlobal.value = await getSemanticVTFGlobal({ top_n: 9 })
  } catch (error) {
    showError('加載全局VTF失敗')
  } finally {
    loadingVTFGlobal.value = false
  }
}

const loadVTFRegional = async () => {
  if (!regionName.value) return

  loadingVTFRegional.value = true
  try {
    vtfRegional.value = await getSemanticVTFRegional({
      region_level: regionLevel.value,
      region_name: regionName.value
    })
  } catch (error) {
    showError('加載區域VTF失敗')
  } finally {
    loadingVTFRegional.value = false
  }
}

const loadCategoryTendency = async () => {
  if (!tendencyRegionName.value) return

  loadingTendency.value = true
  try {
    categoryTendency.value = await getSemanticCategoryTendency({
      region_level: tendencyRegionLevel.value,
      region_name: tendencyRegionName.value
    })
  } catch (error) {
    showError('加載傾向性失敗')
  } finally {
    loadingTendency.value = false
  }
}

const loadLabelsByCategory = async () => {
  if (!selectedCategoryForLabels.value) return

  loadingLabels.value = true
  try {
    labels.value = await getSemanticLabelsByCategory(selectedCategoryForLabels.value)
  } catch (error) {
    showError('加載標籤失敗')
  } finally {
    loadingLabels.value = false
  }
}

const loadLabelsByChar = async () => {
  if (!charForLabels.value) return

  loadingLabels.value = true
  try {
    labels.value = await getSemanticLabelsByChar(charForLabels.value)
  } catch (error) {
    showError('加載標籤失敗')
  } finally {
    loadingLabels.value = false
  }
}

onMounted(() => {
  loadCategories()
  loadVTFGlobal()
})
</script>

<style scoped>
.semantic-categories-page {
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

.category-list {
  padding: 24px;
  margin-bottom: 30px;
}

.category-list h2 {
  font-size: 20px;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.loading-state {
  text-align: center;
  padding: 40px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(74, 144, 226, 0.2);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.category-card {
  padding: 20px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.category-card:hover {
  transform: translateY(-5px);
  background: rgba(74, 144, 226, 0.2);
}

.category-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.category-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.category-description {
  font-size: 13px;
  color: var(--text-secondary);
}

.vtf-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.vtf-global,
.vtf-regional {
  padding: 24px;
}

.vtf-global h3,
.vtf-regional h3 {
  font-size: 18px;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.region-selector {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.select-input,
.text-input {
  padding: 10px 16px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.5);
}

.select-input {
  flex: 0 0 120px;
}

.text-input {
  flex: 1;
}

.query-button {
  padding: 10px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.query-button:hover:not(:disabled) {
  background: #3a7bc8;
}

.query-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.vtf-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.vtf-bar-container {
  display: grid;
  grid-template-columns: 80px 1fr 60px;
  align-items: center;
  gap: 12px;
}

.vtf-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.vtf-bar {
  height: 24px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  overflow: hidden;
}

.vtf-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  transition: width 0.5s ease;
}

.vtf-fill.regional {
  background: linear-gradient(90deg, #f39c12, #e74c3c);
}

.vtf-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-color);
  text-align: right;
}

.labels-section {
  padding: 24px;
  margin-bottom: 30px;
}

.labels-section h3 {
  font-size: 18px;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.labels-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.tab-button {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.5);
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-button:hover {
  background: rgba(74, 144, 226, 0.1);
}

.tab-button.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.labels-content {
  margin-top: 20px;
}

.char-input {
  width: 80px;
  padding: 12px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 24px;
  text-align: center;
  background: rgba(255, 255, 255, 0.5);
}

.labels-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
}

.label-tag {
  padding: 6px 14px;
  background: rgba(74, 144, 226, 0.2);
  color: var(--primary-color);
  border-radius: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
}

.label-tag:hover {
  background: rgba(74, 144, 226, 0.3);
  transform: scale(1.05);
}

.labels-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.label-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.3);
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

.tendency-section {
  padding: 24px;
}

.tendency-section h3 {
  font-size: 18px;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.tendency-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tendency-item {
  display: grid;
  grid-template-columns: 100px 1fr 100px 120px;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
}

.tendency-category {
  font-weight: 600;
  color: var(--text-primary);
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
  color: var(--primary-color);
}

.tendency-freq {
  font-size: 13px;
  color: var(--text-secondary);
}

@media (max-width: 1024px) {
  .vtf-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 24px;
  }

  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .region-selector {
    flex-direction: column;
  }

  .select-input {
    flex: 1;
  }
}
</style>
