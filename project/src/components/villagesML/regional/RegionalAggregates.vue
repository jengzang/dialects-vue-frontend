<template>
<!--  <ExploreLayout>-->
    <div class="regional-aggregates-page">
      <h3 class="villagesml-subtab-title">區域分析 - 聚合統計</h3>
      <h1 class="page-title">🌍 區域聚合統計</h1>

      <!-- Level Selector -->
      <div class="level-selector glass-panel">
        <button
          class="level-button"
          :class="{ 'active': currentLevel === 'city' }"
          @click="switchLevel('city')"
        >
          城市級
        </button>
        <button
          class="level-button"
          :class="{ 'active': currentLevel === 'county' }"
          @click="switchLevel('county')"
        >
          區縣級
        </button>
        <button
          class="level-button"
          :class="{ 'active': currentLevel === 'township' }"
          @click="switchLevel('township')"
        >
          鄉鎮級
        </button>
      </div>

      <!-- Filters -->
      <div class="filters-section glass-panel">
        <h3>篩選條件</h3>
        <div class="filter-controls">
          <input
            v-if="currentLevel === 'city'"
            v-model="filters.city"
            type="text"
            placeholder="城市名稱（可選）"
            class="filter-input"
          />
          <template v-if="currentLevel === 'county'">
            <input
              v-model="filters.city"
              type="text"
              placeholder="城市名稱（可選）"
              class="filter-input"
            />
            <input
              v-model="filters.county"
              type="text"
              placeholder="區縣名稱（可選）"
              class="filter-input"
            />
          </template>
          <template v-if="currentLevel === 'township'">
            <input
              v-model="filters.city"
              type="text"
              placeholder="城市名稱（可選）"
              class="filter-input"
            />
            <input
              v-model="filters.county"
              type="text"
              placeholder="區縣名稱（可選）"
              class="filter-input"
            />
            <input
              v-model="filters.township"
              type="text"
              placeholder="鄉鎮名稱（可選）"
              class="filter-input"
            />
          </template>
          <button
            class="query-button"
            :disabled="loading"
            @click="loadAggregates"
          >
            查詢
          </button>
        </div>
      </div>

      <!-- Aggregates Table -->
      <div v-if="loading" class="loading-state glass-panel">
        <div class="spinner"></div>
        <p>加載中...</p>
      </div>

      <div v-else-if="aggregates.length > 0" class="aggregates-section glass-panel">
        <h2>聚合統計結果</h2>

        <!-- Summary Stats -->
        <div class="summary-stats">
          <div class="stat-card">
            <div class="stat-label">總數量</div>
            <div class="stat-value">{{ aggregates.length }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">總村莊數</div>
            <div class="stat-value">{{ totalVillages }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">平均村莊數</div>
            <div class="stat-value">{{ avgVillages.toFixed(1) }}</div>
          </div>
        </div>

        <!-- Aggregates Table -->
        <div class="aggregates-table">
          <div class="table-header">
            <div class="col-region">區域</div>
            <div class="col-villages">村莊數</div>
            <div class="col-categories">語義類別</div>
            <div class="col-actions">操作</div>
          </div>
          <div class="table-body">
            <div
              v-for="(item, index) in paginatedAggregates"
              :key="index"
              class="table-row"
            >
              <div class="col-region">
                <span v-if="currentLevel === 'city'">{{ item.city }}</span>
                <span v-else-if="currentLevel === 'county'">{{ item.city }} / {{ item.county }}</span>
                <span v-else>{{ item.city }} / {{ item.county }} / {{ item.township }}</span>
              </div>
              <div class="col-villages">{{ item.village_count }}</div>
              <div class="col-categories">
                <div class="categories-mini">
                  <span
                    v-for="(value, key) in item.semantic_categories"
                    :key="key"
                    class="category-badge"
                    :title="`${key}: ${value}`"
                  >
                    {{ key.charAt(0) }}
                  </span>
                </div>
              </div>
              <div class="col-actions">
                <button
                  class="detail-button"
                  @click="showDetail(item)"
                >
                  詳情
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div class="pagination">
          <button
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            上一頁
          </button>
          <span>第 {{ currentPage }} / {{ totalPages }} 頁</span>
          <button
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            下一頁
          </button>
        </div>
      </div>

      <!-- Detail Modal -->
      <div v-if="selectedItem" class="detail-modal" @click.self="selectedItem = null">
        <div class="modal-content glass-panel">
          <div class="modal-header">
            <h3>區域詳情</h3>
            <button class="close-button" @click="selectedItem = null">✕</button>
          </div>
          <div class="modal-body">
            <div class="detail-info">
              <div class="info-item">
                <span class="info-label">區域:</span>
                <span class="info-value">
                  <span v-if="currentLevel === 'city'">{{ selectedItem.city }}</span>
                  <span v-else-if="currentLevel === 'county'">{{ selectedItem.city }} / {{ selectedItem.county }}</span>
                  <span v-else>{{ selectedItem.city }} / {{ selectedItem.county }} / {{ selectedItem.township }}</span>
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">村莊數量:</span>
                <span class="info-value">{{ selectedItem.village_count }}</span>
              </div>
            </div>

            <!-- Semantic Categories Chart -->
            <div class="categories-chart">
              <h4>語義類別分佈</h4>
              <div class="chart-bars">
                <div
                  v-for="(value, key) in selectedItem.semantic_categories"
                  :key="key"
                  class="chart-bar"
                >
                  <div class="bar-label">{{ key }}</div>
                  <div class="bar-container">
                    <div
                      class="bar-fill"
                      :style="{ width: `${(value / maxCategoryValue) * 100}%` }"
                    ></div>
                  </div>
                  <div class="bar-value">{{ value }}</div>
                </div>
              </div>
            </div>

            <!-- Statistics -->
            <div v-if="selectedItem.statistics" class="statistics-section">
              <h4>統計信息</h4>
              <div class="stats-grid">
                <div
                  v-for="(value, key) in selectedItem.statistics"
                  :key="key"
                  class="stat-item"
                >
                  <div class="stat-label">{{ formatStatKey(key) }}</div>
                  <div class="stat-value">{{ formatStatValue(value) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Spatial Aggregates -->
      <div class="spatial-section glass-panel">
        <h2>空間聚合</h2>
        <div class="controls">
          <select v-model="spatialLevel" class="select-input">
            <option value="city">城市</option>
            <option value="county">區縣</option>
            <option value="township">鄉鎮</option>
          </select>
          <button
            class="query-button"
            :disabled="loadingSpatial"
            @click="loadSpatialAggregates"
          >
            加載空間數據
          </button>
        </div>

        <div v-if="loadingSpatial" class="loading-state">
          <div class="spinner"></div>
        </div>

        <div v-else-if="spatialAggregates.length > 0" class="spatial-results">
          <div class="map-placeholder">
            <p>🗺️ 空間聚合地圖</p>
            <p class="map-note">
              顯示 {{ spatialAggregates.length }} 個區域的空間分佈和統計數據
            </p>
          </div>
        </div>
      </div>
    </div>
<!--  </ExploreLayout>-->
</template>

<script setup>
import { ref, computed } from 'vue'
import ExploreLayout from '@/layouts/ExploreLayout.vue'
import {
  getRegionalAggregatesCity,
  getRegionalAggregatesCounty,
  getRegionalAggregatesTown,
  getRegionalSpatialAggregates
} from '@/api/index.js'
import { showError } from '@/utils/message.js'

// State
const currentLevel = ref('city')
const filters = ref({
  city: '',
  county: '',
  township: ''
})

const aggregates = ref([])
const selectedItem = ref(null)
const spatialAggregates = ref([])

const loading = ref(false)
const loadingSpatial = ref(false)

const currentPage = ref(1)
const pageSize = 20
const spatialLevel = ref('city')

// Computed
const totalVillages = computed(() => {
  return aggregates.value.reduce((sum, item) => sum + (item.village_count || 0), 0)
})

const avgVillages = computed(() => {
  if (aggregates.value.length === 0) return 0
  return totalVillages.value / aggregates.value.length
})

const totalPages = computed(() => {
  return Math.ceil(aggregates.value.length / pageSize)
})

const paginatedAggregates = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return aggregates.value.slice(start, end)
})

const maxCategoryValue = computed(() => {
  if (!selectedItem.value?.semantic_categories) return 1
  return Math.max(...Object.values(selectedItem.value.semantic_categories))
})

// Methods
const switchLevel = (level) => {
  currentLevel.value = level
  filters.value = { city: '', county: '', township: '' }
  aggregates.value = []
  currentPage.value = 1
}

const loadAggregates = async () => {
  loading.value = true
  try {
    const params = {}
    if (filters.value.city) params.city = filters.value.city
    if (filters.value.county) params.county = filters.value.county
    if (filters.value.township) params.township = filters.value.township

    if (currentLevel.value === 'city') {
      aggregates.value = await getRegionalAggregatesCity(params)
    } else if (currentLevel.value === 'county') {
      aggregates.value = await getRegionalAggregatesCounty(params)
    } else {
      aggregates.value = await getRegionalAggregatesTown(params)
    }

    currentPage.value = 1
  } catch (error) {
    showError('加載聚合數據失敗')
  } finally {
    loading.value = false
  }
}

const showDetail = (item) => {
  selectedItem.value = item
}

const loadSpatialAggregates = async () => {
  loadingSpatial.value = true
  try {
    spatialAggregates.value = await getRegionalSpatialAggregates({
      region_level: spatialLevel.value
    })
  } catch (error) {
    showError('加載空間數據失敗')
  } finally {
    loadingSpatial.value = false
  }
}

const formatStatKey = (key) => {
  const keyMap = {
    avg_length: '平均長度',
    max_length: '最大長度',
    min_length: '最小長度',
    diversity: '多樣性',
    entropy: '熵值'
  }
  return keyMap[key] || key
}

const formatStatValue = (value) => {
  if (typeof value === 'number') {
    return value.toFixed(2)
  }
  return value
}
</script>

<style scoped>
.regional-aggregates-page {
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

.level-selector {
  display: flex;
  gap: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.level-button {
  flex: 1;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.5);
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.level-button:hover {
  background: rgba(74, 144, 226, 0.1);
}

.level-button.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.filters-section {
  padding: 24px;
  margin-bottom: 20px;
}

.filters-section h3 {
  font-size: 18px;
  margin-bottom: 15px;
  color: var(--text-primary);
}

.filter-controls {
  display: flex;
  gap: 12px;
}

.filter-input {
  flex: 1;
  padding: 10px 16px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.5);
}

.filter-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(255, 255, 255, 0.8);
}

.query-button {
  padding: 10px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
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

.loading-state {
  text-align: center;
  padding: 60px 20px;
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

.aggregates-section {
  padding: 24px;
  margin-bottom: 30px;
}

.aggregates-section h2 {
  font-size: 20px;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 20px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  text-align: center;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-primary);
}

.aggregates-table {
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1fr;
  gap: 12px;
  padding: 12px 16px;
  align-items: center;
}

.table-header {
  background: rgba(74, 144, 226, 0.2);
  font-weight: 600;
  color: var(--text-primary);
}

.table-row {
  background: rgba(255, 255, 255, 0.3);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background 0.3s ease;
}

.table-row:hover {
  background: rgba(74, 144, 226, 0.1);
}

.col-region {
  font-weight: 500;
  color: var(--text-primary);
}

.categories-mini {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.category-badge {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(74, 144, 226, 0.2);
  color: var(--color-primary);
  border-radius: 50%;
  font-size: 11px;
  font-weight: 600;
  cursor: help;
}

.detail-button {
  padding: 6px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.detail-button:hover {
  background: #3a7bc8;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 16px;
}

.pagination button {
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination button:hover:not(:disabled) {
  background: #3a7bc8;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.modal-header h3 {
  font-size: 20px;
  color: var(--text-primary);
}

.close-button {
  width: 32px;
  height: 32px;
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  border: none;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-button:hover {
  background: rgba(231, 76, 60, 0.2);
}

.modal-body {
  padding: 24px;
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
}

.info-label {
  font-weight: 500;
  color: var(--text-secondary);
}

.info-value {
  font-weight: 600;
  color: var(--text-primary);
}

.categories-chart {
  margin-bottom: 24px;
}

.categories-chart h4 {
  font-size: 16px;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.chart-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chart-bar {
  display: grid;
  grid-template-columns: 80px 1fr 60px;
  gap: 12px;
  align-items: center;
}

.bar-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.bar-container {
  height: 24px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--secondary-color));
  transition: width 0.5s ease;
}

.bar-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
  text-align: right;
}

.statistics-section h4 {
  font-size: 16px;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.stat-item {
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  text-align: center;
}

.stat-item .stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.stat-item .stat-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-primary);
}

.spatial-section {
  padding: 24px;
}

.spatial-section h2 {
  font-size: 20px;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.controls {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.select-input {
  width: 150px;
  padding: 10px 16px;
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.5);
}

.map-placeholder {
  padding: 80px 20px;
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

@media (max-width: 768px) {
  .page-title {
    font-size: 24px;
  }

  .level-selector {
    flex-direction: column;
  }

  .filter-controls {
    flex-direction: column;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .modal-content {
    max-height: 95vh;
  }
}
</style>
