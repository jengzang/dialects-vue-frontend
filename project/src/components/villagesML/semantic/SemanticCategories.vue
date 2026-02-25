<template>
<!--  <ExploreLayout>-->
    <div class="semantic-categories-page">
      <h3 class="villagesml-subtab-title">語義分析 - 類別標籤</h3>
<!--      <h1 class="page-title">🏷️ 語義類別與標籤</h1>-->

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
            :key="category.category"
            class="category-card"
            :class="{ 'selected': selectedCategory?.category === category.category }"
            @click="selectCategory(category)"
          >
            <div class="category-header">
              <span class="category-icon">{{ getCategoryIcon(category.category) }}</span>
              <span class="category-name">{{ getCategoryName(category.category) }}</span>
            </div>
            <div class="category-description">{{ getCategoryDescription(category.category) }}</div>
            <div class="category-count">{{ category.character_count }} 字符</div>
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
              <div class="vtf-label">{{ getCategoryName(item.category) }}</div>
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
            <FilterableSelect
              v-model="regionName"
              :level="regionLevel"
              @update:level="(newLevel) => regionLevel = newLevel"
              @update:hierarchy="(h) => regionHierarchy = h"
              placeholder="請選擇或輸入"
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
              <div class="vtf-label">{{ getCategoryName(item.category) }}</div>
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

      <!-- Category Regional Ranking -->
      <div ref="tendencySection" class="tendency-section glass-panel">
        <div class="section-header-centered" v-if="selectedCategory">
          <div class="category-title-card">
            <span class="category-icon-large">{{ getCategoryIcon(selectedCategory.category) }}</span>
            <h3 class="category-title-large">{{ getCategoryName(selectedCategory.category) }}</h3>
            <span class="category-separator">-</span>
            <p class="category-subtitle">區域排行</p>
          </div>
          <button class="close-button" @click="selectedCategory = null">✕</button>
        </div>

        <!-- Prompt when no category selected -->
        <div v-if="!selectedCategory" class="prompt-message">
          <span class="prompt-icon">👆</span>
          <p>請點擊上方的類別卡片以查看該類別在不同區域的排行</p>
        </div>

        <!-- Content when category selected -->
        <template v-else>
          <div class="level-selector">
            <label>行政級別：</label>
            <select v-model="rankingLevel" class="select-input" @change="loadCategoryRanking">
              <option value="city">市級</option>
              <option value="county">區縣級</option>
              <option value="township">鄉鎮級</option>
            </select>
          </div>
          <div v-if="loadingRanking" class="loading-state">
            <div class="spinner"></div>
          </div>
          <div v-else-if="categoryRanking.length > 0" class="ranking-results">
            <div class="ranking-header">
              <div class="col-rank">排名</div>
              <div class="col-region">區域</div>
              <div class="col-index">語義指數</div>
              <div class="col-normalized">標準化指數</div>
              <div class="col-villages">村莊數</div>
            </div>
            <div
              v-for="(item, index) in categoryRanking"
              :key="index"
              class="ranking-item"
            >
              <div class="col-rank">
                <span class="rank-badge" :class="getRankClass(index + 1)">
                  #{{ index + 1 }}
                </span>
              </div>
              <div class="col-region">{{ item.region_name }}</div>
              <div class="col-index">{{ item.semantic_index?.toFixed(2) || 'N/A' }}</div>
              <div class="col-normalized">{{ item.normalized_index?.toFixed(2) || 'N/A' }}</div>
              <div class="col-villages">{{ item.village_count || 'N/A' }}</div>
            </div>
          </div>
        </template>
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
            <option v-for="cat in categories" :key="cat.category" :value="cat.category">
              {{ getCategoryName(cat.category) }}
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

    </div>
<!--  </ExploreLayout>-->
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import ExploreLayout from '@/layouts/ExploreLayout.vue'
import FilterableSelect from '@/components/common/FilterableSelect.vue'
import {
  getSemanticCategoryList,
  getSemanticVTFGlobal,
  getSemanticVTFRegional,
  getSemanticIndices,
  getSemanticLabelsByCategory,
  getSemanticLabelsByChar
} from '@/api/index.js'
import { showError } from '@/utils/message.js'
import {
  getCategoryIcon,
  getCategoryName,
  getCategoryDescription
} from '@/config/villagesML.js'

// State
const categories = ref([])
const selectedCategory = ref(null)
const tendencySection = ref(null)
const vtfGlobal = ref([])
const vtfRegional = ref([])
const categoryRanking = ref([])
const labels = ref([])

const loadingCategories = ref(false)
const loadingVTFGlobal = ref(false)
const loadingVTFRegional = ref(false)
const loadingRanking = ref(false)
const loadingLabels = ref(false)

const regionLevel = ref('city')
const regionName = ref('')
const regionHierarchy = ref({ city: null, county: null, township: null })
const rankingLevel = ref('city')

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

// Methods - removed getCategoryIcon, getCategoryName, getCategoryDescription (now imported from config)

const selectCategory = async (category) => {
  // Toggle: if clicking the same category, deselect it
  if (selectedCategory.value?.category === category.category) {
    selectedCategory.value = null
    return
  }

  selectedCategory.value = category
  await nextTick()
  // Scroll to tendency section
  if (tendencySection.value) {
    tendencySection.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  // Auto load ranking when category is selected
  loadCategoryRanking()
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
      ...regionHierarchy.value
    })
  } catch (error) {
    showError('加載區域VTF失敗')
  } finally {
    loadingVTFRegional.value = false
  }
}

const loadCategoryRanking = async () => {
  if (!selectedCategory.value) return

  loadingRanking.value = true
  try {
    categoryRanking.value = await getSemanticIndices({
      category: selectedCategory.value.category,
      region_level: rankingLevel.value,
      limit: 50
    })
  } catch (error) {
    showError('加載排行失敗')
  } finally {
    loadingRanking.value = false
  }
}

const getRankClass = (rank) => {
  if (rank === 1) return 'rank-gold'
  if (rank === 2) return 'rank-silver'
  if (rank === 3) return 'rank-bronze'
  return 'rank-normal'
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
  padding: 12px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
  text-align: center;
}

.category-list {
  padding: 16px;
  margin-bottom: 16px;
}

.category-list h2 {
  font-size: 16px;
  margin-bottom: 16px;
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
  border-top-color: var(--color-primary);
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
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.category-card:hover {
  transform: translateY(-5px);
  background: rgba(74, 144, 226, 0.2);
}

.category-card.selected {
  background: rgba(74, 144, 226, 0.3);
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.category-icon {
  font-size: 16px;
}

.category-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.category-description {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
  margin-bottom: 8px;
}

.category-count {
  font-size: 12px;
  color: var(--color-primary);
  font-weight: 600;
}

.vtf-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.vtf-global,
.vtf-regional {
  padding: 16px;
  min-width: 0;
  overflow: hidden;
}

.vtf-global h3,
.vtf-regional h3 {
  font-size: 16px;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.region-selector {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
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
  background: var(--color-primary);
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
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-hover));
  transition: width 0.5s ease;
}

.vtf-fill.regional {
  background: linear-gradient(90deg, #f39c12, #e74c3c);
}

.vtf-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
  text-align: right;
}

.labels-section {
  padding: 16px;
  margin-top: 16px;
}

.labels-section h3 {
  font-size: 16px;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.labels-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
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
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.labels-content {
  margin-top: 20px;
}

.char-input {
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
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
}

.label-tag {
  padding: 6px 14px;
  background: rgba(74, 144, 226, 0.2);
  color: var(--color-primary);
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
  padding: 16px;
  margin-bottom: 16px;
}

.section-header-centered {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
}

.category-title-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.15), rgba(80, 200, 120, 0.15));
  border-radius: 12px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.2);
}

.category-icon-large {
  font-size: 32px;
  line-height: 1;
}

.category-title-large {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.category-separator {
  font-size: 18px;
  color: var(--text-secondary);
  font-weight: 400;
}

.category-subtitle {
  font-size: 16px;
  color: var(--text-dark);
  margin: 0;
  font-weight: 500;
}

.section-header-centered .close-button {
  position: absolute;
  right: 0;
  top: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 16px;
  margin: 0;
  color: var(--text-primary);
}

.close-button {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background: rgba(231, 76, 60, 0.3);
  transform: scale(1.1);
}

.level-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.level-selector label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.prompt-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: var(--text-secondary);
}

.prompt-icon {
  font-size: 48px;
  margin-bottom: 16px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.prompt-message p {
  font-size: 15px;
  margin: 0;
  color: var(--text-secondary);
}

.ranking-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ranking-header,
.ranking-item {
  display: grid;
  grid-template-columns: 80px 2fr 1fr 1.2fr 1fr;
  gap: 12px;
  padding: 12px 16px;
  align-items: center;
}

.ranking-header {
  background: rgba(74, 144, 226, 0.2);
  font-weight: 600;
  color: var(--text-primary);
  border-radius: 8px;
  font-size: 14px;
}

.ranking-item {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  transition: background 0.3s ease;
}

.ranking-item:hover {
  background: rgba(74, 144, 226, 0.1);
}

.col-rank {
  text-align: center;
}

.rank-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.rank-gold {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #8b6914;
}

.rank-silver {
  background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
  color: #5a5a5a;
}

.rank-bronze {
  background: linear-gradient(135deg, #cd7f32, #e8a87c);
  color: #6b3e1a;
}

.rank-normal {
  background: rgba(74, 144, 226, 0.15);
  color: var(--color-primary);
}

.col-region {
  font-weight: 600;
  color: var(--text-primary);
}

.col-index,
.col-normalized {
  font-weight: 600;
  color: var(--color-primary);
}

.col-villages {
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
