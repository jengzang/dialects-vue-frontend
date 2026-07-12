<template>
  <div class="subset-analysis-page">
      <h3 class="villagesml-subtab-title">
        ML計算 - 子集分析
        <HelpIcon content="對自訂村莊子集進行聚類分析。支持多條件篩選（區域、語義、結構、長度等），提取特徵向量後使用K-Means、DBSCAN或GMM算法聚類。適合比較不同子集的聚類模式差異" />
      </h3>
    <!-- Header -->
    <div class="page-header">
<!--      <h2>🔐 子集分析 Subset Analysis</h2>-->
<!--      <p class="subtitle">對自訂村莊子集進行聚類與比較分析</p>-->
      <div v-if="!isAuthenticated" class="auth-warning">
        <span class="lock-icon">🔒</span>
        <span>此功能需要登錄</span>
        <button @click="goToAuth" class="solid-button small">前往登錄</button>
      </div>
    </div>

    <!-- Filter Builder -->
    <div class="vml-glass-panel filter-panel">
      <div class="panel-header">
        <h3>📋 步驟 1：篩選器構建</h3>
        <button @click="addFilter" class="solid-button small">+ 添加篩選條件</button>
      </div>
      <div class="filter-content">
        <div class="usage-hint">
          <span class="hint-icon">💡</span>
          <span class="hint-text">添加篩選條件，定義你想要分析的村莊集合</span>
        </div>
        <div v-for="(filter, idx) in filters" :key="idx" class="filter-row">
          <SimpleSelectDropdown
            v-model="filter.field"
            :options="fieldOptions"
            @update:modelValue="handleFieldChange(idx)"
          />

          <SimpleSelectDropdown
            v-model="filter.operator"
            :options="getOperatorsForFilter(filter)"
          />

          <!-- Region field: use FilterableSelect -->
          <FilterableSelect
            v-if="getFieldInputType(filter.field) === 'region'"
            v-model="filter.value"
            :level="filter.level || 'city'"
            :parent="filter.parent"
            :show-level-selector="true"
            placeholder="選擇區域"
            @update:level="(level) => filter.level = level"
            @update:hierarchy="(hierarchy) => filter.hierarchy = hierarchy"
          />

          <!-- Select field: use SimpleSelectDropdown (semantic, structure) -->
          <SimpleSelectDropdown
            v-else-if="getFieldInputType(filter.field) === 'select'"
            v-model="filter.value"
            :options="getFieldOptions(filter.field)"
            :placeholder="`選擇${FILTER_FIELDS.find(f => f.value === filter.field)?.label}`"
          />

          <!-- Number field: use number input (length) -->
          <input
            v-else-if="getFieldInputType(filter.field) === 'number'"
            v-model.number="filter.value"
            type="number"
            min="2"
            max="10"
            placeholder="2-10"
            class="glass-input"
          >

          <!-- Text field: use text input (name, suffix, prefix) -->
          <input
            v-else
            v-model="filter.value"
            type="text"
            placeholder="值"
            class="glass-input"
          >

          <button @click="removeFilter(idx)" class="solid-button small danger">刪除</button>
        </div>
        <div class="filter-actions">
          <button @click="applyFilters" :disabled="filters.length === 0 || loading" class="solid-button primary">
            應用篩選
          </button>
          <button @click="clearFilters" class="solid-button secondary">清空篩選</button>
        </div>
<!--        <div v-if="subsetA.villages.length > 0" class="subset-info">-->
<!--          <span class="info-label">子集 A:</span>-->
<!--          <span class="info-value">{{ subsetA.villages.length }} 個村莊</span>-->
<!--        </div>-->
      </div>
    </div>

    <!-- Filtered Villages List -->
    <div v-if="currentFilteredVillages.length > 0" class="vml-glass-panel villages-list-panel">
      <div class="panel-header">
        <h3>📊 步驟 2：查看篩選結果</h3>
        <div class="header-info">
          <span class="total-count">
            共 {{ currentFilteredVillages.length }} 個村莊
          </span>
        </div>
      </div>
      <div class="villages-list-content">
        <div class="usage-hint">
          <span class="hint-icon">💡</span>
          <span class="hint-text">確認篩選結果無誤後，點擊下方「保存為子集 A/B」按鈕</span>
        </div>
        <div class="save-actions">
          <button @click="saveAsSubsetA" :disabled="!canSaveSubset" class="solid-button primary">
            💾 保存為子集 A
          </button>
          <button @click="saveAsSubsetB" :disabled="!canSaveSubset" class="solid-button primary">
            💾 保存為子集 B
          </button>
        </div>
        <div class="villages-table-wrapper">
          <table class="glass-table">
            <thead>
              <tr>
                <th>序號</th>
                <th>村名</th>
                <th>區域</th>
                <th>長度</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(village, idx) in paginatedVillages" :key="village.id">
                <td>{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
                <td class="village-name">{{ village.name }}</td>
                <td class="village-region">{{ village.region }}</td>
                <td>{{ village.length }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <button @click="prevPage" :disabled="currentPage === 1" class="solid-button small">上一頁</button>
          <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 頁</span>
          <button @click="nextPage" :disabled="currentPage === totalPages" class="solid-button small">下一頁</button>
        </div>
      </div>
    </div>

    <!-- Subset Comparison -->
    <div class="vml-glass-panel comparison-panel">
      <div class="panel-header">
        <h3>⚖️ 步驟 3：子集比較</h3>
      </div>
      <div class="comparison-content">
        <div class="usage-hint">
          <span class="hint-icon">💡</span>
          <span class="hint-text">保存兩個不同的子集後，點擊「比較子集」按鈕，系統會分析兩個子集的語義和形態差異</span>
        </div>
        <div class="subset-selector">
          <div class="subset-card">
            <h4>子集 A</h4>
            <div class="subset-stats">
              <div class="stat-item">
                <span class="label">村莊數:</span>
                <span class="value">{{ subsetA.villages.length }}</span>
              </div>
              <div class="stat-item">
                <span class="label">篩選條件:</span>
                <span class="value">{{ formatFilterSummary(subsetA.filterParams) }}</span>
              </div>
            </div>
            <button @click="saveAsSubsetA" :disabled="!canSaveSubset" class="solid-button small">
              💾 更新子集 A
            </button>
          </div>
          <div class="vs-divider">VS</div>
          <div class="subset-card">
            <h4>子集 B</h4>
            <div class="subset-stats">
              <div class="stat-item">
                <span class="label">村莊數:</span>
                <span class="value">{{ subsetB.villages.length }}</span>
              </div>
              <div class="stat-item">
                <span class="label">篩選條件:</span>
                <span class="value">{{ formatFilterSummary(subsetB.filterParams) }}</span>
              </div>
            </div>
            <button @click="saveAsSubsetB" :disabled="!canSaveSubset" class="solid-button small">
              💾 更新子集 B
            </button>
          </div>
        </div>
        <div class="comparison-actions">
          <button
            @click="compareSubsets"
            :disabled="!canCompare || loading"
            class="solid-button primary large"
          >
            比較子集
          </button>
        </div>
      </div>
    </div>

    <!-- Comparison Results -->
    <div v-if="comparisonResults" class="vml-glass-panel results-panel">
      <div class="panel-header">
        <h3>比較結果</h3>
      </div>
      <div class="results-content">
        <!-- Performance Timings -->
        <div v-if="comparisonResults.timings" class="timings-section">
          <h4>⏱️ 性能統計</h4>
          <div class="timings-grid">
            <div class="timing-card">
              <div class="timing-icon">📊</div>
              <div class="timing-info">
                <div class="timing-label">數據加載</div>
                <div class="timing-value">{{ comparisonResults.timings.data_loading }}ms</div>
              </div>
            </div>
            <div class="timing-card">
              <div class="timing-icon">🏷️</div>
              <div class="timing-info">
                <div class="timing-label">語義分析</div>
                <div class="timing-value">{{ comparisonResults.timings.semantic }}ms</div>
              </div>
            </div>
            <div class="timing-card">
              <div class="timing-icon">📐</div>
              <div class="timing-info">
                <div class="timing-label">形態學分析</div>
                <div class="timing-value">{{ comparisonResults.timings.morphology }}ms</div>
              </div>
            </div>
            <div class="timing-card">
              <div class="timing-icon">🔤</div>
              <div class="timing-info">
                <div class="timing-label">字符分析</div>
                <div class="timing-value">{{ comparisonResults.timings.character }}ms</div>
              </div>
            </div>
            <div class="timing-card">
              <div class="timing-icon">🗺️</div>
              <div class="timing-info">
                <div class="timing-label">空間分析</div>
                <div class="timing-value">{{ comparisonResults.timings.spatial }}ms</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Metrics -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">子集 A 大小</div>
            <div class="metric-value">{{ comparisonResults.group_a_size }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">子集 B 大小</div>
            <div class="metric-value">{{ comparisonResults.group_b_size }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">執行時間</div>
            <div class="metric-value">{{ comparisonResults.execution_time_ms }}ms</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">緩存狀態</div>
            <div class="metric-value">{{ comparisonResults.from_cache ? '✓' : '✗' }}</div>
          </div>
        </div>

        <!-- Comparison Chart -->
        <div class="comparison-chart">
          <div ref="comparisonChart" class="chart-container"></div>
        </div>

        <!-- Semantic Comparison Table -->
        <div v-if="comparisonResults.semantic_comparison" class="feature-diff-table">
          <h4>🏷️ 語義類別比較</h4>
          <table class="glass-table">
            <thead>
              <tr>
                <th>類別</th>
                <th>子集 A 數量</th>
                <th>子集 A 比例</th>
                <th>子集 B 數量</th>
                <th>子集 B 比例</th>
                <th>差異</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in comparisonResults.semantic_comparison" :key="item.category">
                <td>
                  <span class="category-cell">
                    {{ getCategoryIcon(item.category) }} {{ getCategoryName(item.category) }}
                  </span>
                </td>
                <td>{{ item.group_a_count }}</td>
                <td>{{ formatPercent(item.group_a_pct) }}</td>
                <td>{{ item.group_b_count }}</td>
                <td>{{ formatPercent(item.group_b_pct) }}</td>
                <td :class="['diff-value', item.difference > 0 ? 'positive' : 'negative']">
                  {{ formatPercent(item.difference) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Morphology Comparison Table -->
        <div v-if="comparisonResults.morphology_comparison" class="feature-diff-table">
          <h4>📐 形態學特徵比較</h4>
          <table class="glass-table">
            <thead>
              <tr>
                <th>特徵</th>
                <th>子集 A</th>
                <th>子集 B</th>
                <th>差異</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in comparisonResults.morphology_comparison" :key="item.feature">
                <td>{{ formatFeatureName(item.feature) }}</td>
                <td>{{ formatFeatureValue(item.feature, item.group_a_value) }}</td>
                <td>{{ formatFeatureValue(item.feature, item.group_b_value) }}</td>
                <td :class="['diff-value', item.difference > 0 ? 'positive' : 'negative']">
                  {{ formatFeatureValue(item.feature, item.difference) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Character Comparison Table -->
        <div v-if="comparisonResults.character_comparison" class="feature-diff-table">
          <h4>🔤 字符特徵比較 (Top 20)</h4>
          <table class="glass-table">
            <thead>
              <tr>
                <th>字符</th>
                <th>子集 A 頻率</th>
                <th>子集 B 頻率</th>
                <th>差異</th>
                <th>Lift</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in comparisonResults.character_comparison.slice(0, 20)" :key="item.char">
                <td class="char-cell">{{ item.char }}</td>
                <td>{{ formatPercent(item.group_a_freq) }}</td>
                <td>{{ formatPercent(item.group_b_freq) }}</td>
                <td :class="['diff-value', item.difference > 0 ? 'positive' : 'negative']">
                  {{ formatPercent(item.difference) }}
                </td>
                <td :class="['lift-value', getLiftClass(item.lift)]">
                  {{ formatLift(item.lift) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Spatial Comparison -->
        <div v-if="comparisonResults.spatial_comparison" class="spatial-comparison-section">
          <h4>🗺️ 空間特徵比較</h4>
          <div class="spatial-metrics">
            <div class="spatial-group">
              <h5>子集 A 地理範圍</h5>
              <div class="spatial-stats">
                <div class="stat-row">
                  <span class="stat-label">經度範圍:</span>
                  <span class="stat-value">
                    {{ comparisonResults.spatial_comparison.group_a.lon_min.toFixed(3) }} ~
                    {{ comparisonResults.spatial_comparison.group_a.lon_max.toFixed(3) }}
                    (跨度 {{ (comparisonResults.spatial_comparison.group_a.lon_max - comparisonResults.spatial_comparison.group_a.lon_min).toFixed(3) }}°)
                  </span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">緯度範圍:</span>
                  <span class="stat-value">
                    {{ comparisonResults.spatial_comparison.group_a.lat_min.toFixed(3) }} ~
                    {{ comparisonResults.spatial_comparison.group_a.lat_max.toFixed(3) }}
                    (跨度 {{ (comparisonResults.spatial_comparison.group_a.lat_max - comparisonResults.spatial_comparison.group_a.lat_min).toFixed(3) }}°)
                  </span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">中心點:</span>
                  <span class="stat-value">
                    ({{ comparisonResults.spatial_comparison.group_a.lon_mean.toFixed(3) }},
                     {{ comparisonResults.spatial_comparison.group_a.lat_mean.toFixed(3) }})
                  </span>
                </div>
              </div>
            </div>
            <div class="spatial-group">
              <h5>子集 B 地理範圍</h5>
              <div class="spatial-stats">
                <div class="stat-row">
                  <span class="stat-label">經度範圍:</span>
                  <span class="stat-value">
                    {{ comparisonResults.spatial_comparison.group_b.lon_min.toFixed(3) }} ~
                    {{ comparisonResults.spatial_comparison.group_b.lon_max.toFixed(3) }}
                    (跨度 {{ (comparisonResults.spatial_comparison.group_b.lon_max - comparisonResults.spatial_comparison.group_b.lon_min).toFixed(3) }}°)
                  </span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">緯度範圍:</span>
                  <span class="stat-value">
                    {{ comparisonResults.spatial_comparison.group_b.lat_min.toFixed(3) }} ~
                    {{ comparisonResults.spatial_comparison.group_b.lat_max.toFixed(3) }}
                    (跨度 {{ (comparisonResults.spatial_comparison.group_b.lat_max - comparisonResults.spatial_comparison.group_b.lat_min).toFixed(3) }}°)
                  </span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">中心點:</span>
                  <span class="stat-value">
                    ({{ comparisonResults.spatial_comparison.group_b.lon_mean.toFixed(3) }},
                     {{ comparisonResults.spatial_comparison.group_b.lat_mean.toFixed(3) }})
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="centroid-distance">
            <span class="distance-label">兩組中心點距離:</span>
            <span class="distance-value">{{ comparisonResults.spatial_comparison.centroid_distance_km.toFixed(2) }} km</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Subset Clustering -->
    <div class="vml-glass-panel clustering-panel">
      <div class="panel-header">
        <h3>子集聚類</h3>
      </div>
      <div class="clustering-content">
        <div class="clustering-controls">
          <div class="control-row">
            <label>選擇子集:</label>
            <SimpleSelectDropdown
              v-model="clusteringSubset"
              :options="clusteringSubsetOptions"
            />
          </div>
          <div class="control-row">
            <label>聚類數 K:</label>
            <input v-model.number="clusterK" type="number" min="2" max="20" class="glass-input small">
          </div>
          <div class="control-row">
            <label>演算法:</label>
            <SimpleSelectDropdown :match-trigger-width="true"
              v-model="clusterAlgorithm"
              :options="clusterAlgorithmOptions"
            />
          </div>
          <div class="control-row feature-selector">
            <label>聚類特徵:</label>
            <div class="feature-checkboxes">
              <CheckBox
                v-for="option in clusterFeatureOptions"
                :key="option.value"
                :model-value="clusterFeatures.includes(option.value)"
                class="feature-checkbox"
                @update:modelValue="toggleClusterFeature(option.value, $event)"
              >
                <span class="checkbox-label">{{ option.label }}</span>
                <span class="checkbox-desc">{{ option.description }}</span>
              </CheckBox>
            </div>
          </div>
          <button
            @click="runSubsetClustering"
            :disabled="!canCluster || loading || clusterFeatures.length === 0"
            class="solid-button primary"
          >
            執行聚類
          </button>
        </div>

        <div v-if="clusteringResults" class="clustering-results">
          <!-- Clustering Stats -->
          <div class="clustering-stats">
            <div class="stat-card">
              <div class="stat-label">匹配村莊</div>
              <div class="stat-value">{{ clusteringResults.matched_villages }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">採樣村莊</div>
              <div class="stat-value">{{ clusteringResults.sampled_villages }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">聚類數量</div>
              <div class="stat-value">{{ clusteringResults.clusters.length }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">執行時間</div>
              <div class="stat-value">{{ clusteringResults.execution_time_ms }}ms</div>
            </div>
          </div>

          <!-- Cluster Details -->
          <div class="cluster-summary">
            <h4>聚類詳情</h4>
            <div class="clusters-grid">
              <div v-for="cluster in clusteringResults.clusters" :key="cluster.cluster_id" class="cluster-card">
                <div class="cluster-header">
                  <span class="cluster-id">聚類 {{ cluster.cluster_id }}</span>
                  <span class="cluster-size">{{ cluster.size }} 個村莊</span>
                </div>
                <div class="cluster-samples">
                  <div class="sample-label">樣本村莊:</div>
                  <div class="sample-villages">
                    <span v-for="(village, idx) in cluster.sample_villages" :key="idx" class="village-tag">
                      {{ village }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="vml-loading">
      <div class="ui-loading--page" aria-hidden="true"></div>
      <p>{{ loadingMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onBeforeUnmount } from 'vue'
import CheckBox from '@/components/selector/CheckBox.vue'
import { useRoute, useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { clusterSubset, compareSubsets as compareSubsetsAPI, fetchSubsetFilter } from '@/api/index.js'
import { showError, showSuccess, showWarning } from '@/utils/message.js'
import { userStore } from '@/main/store/store.js'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import FilterableSelect from '@/VillagesML/components/FilterableSelect.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import { FILTER_FIELDS, getOperatorOptions, getDefaultOperator, getFieldInputType, getFieldOptions } from '@/VillagesML/config/subsetFilters.js'
import { getCategoryName, getCategoryIcon } from '@/VillagesML/config/villagesML.js'

// Router
const router = useRouter()
const route = useRoute()

// ECharts instances
let comparisonChartInstance = null
let clusteringChartInstance = null

// Authentication
const isAuthenticated = computed(() => userStore.isAuthenticated)

// State
const filters = ref([])
const subsetA = ref({
  label: '',
  filter: {
    cities: [],
    counties: [],
    name_pattern: null
  },
  villages: []
})
const subsetB = ref({
  label: '',
  filter: {
    cities: [],
    counties: [],
    name_pattern: null
  },
  villages: []
})
const currentFilteredVillages = ref([])
const comparisonResults = ref(null)
const clusteringResults = ref(null)
const loading = ref(false)
const loadingMessage = ref('載入中...')

// Clustering params
const clusteringSubset = ref('A')
const clusterK = ref(5)
const clusterAlgorithm = ref('kmeans')
const clusterFeatures = ref(['semantic', 'morphology'])  // 默认使用两种特征

// Pagination for villages list
const currentPage = ref(1)
const pageSize = ref(50)

// Computed
const paginatedVillages = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return currentFilteredVillages.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(currentFilteredVillages.value.length / pageSize.value)
})

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

// Options
const fieldOptions = FILTER_FIELDS.map(f => ({
  label: f.label,
  value: f.value
}))

// Dynamic operator options based on selected field
const getOperatorsForFilter = (filter) => {
  return getOperatorOptions(filter.field)
}

const clusteringSubsetOptions = [
  { label: '子集 A', value: 'A' },
  { label: '子集 B', value: 'B' },
  { label: '兩者', value: 'both' }
]

const clusterAlgorithmOptions = [
  { label: 'K-Means', value: 'kmeans' },
  { label: 'Hierarchical', value: 'hierarchical' },
  { label: 'DBSCAN', value: 'dbscan' }
]

const clusterFeatureOptions = [
  { label: '語義特徵', value: 'semantic', description: '九大語義類別（水系、山地、方位等）' },
  { label: '形態學特徵', value: 'morphology', description: '名稱長度' }
]

const toggleClusterFeature = (value, checked) => {
  if (checked) {
    if (!clusterFeatures.value.includes(value)) {
      clusterFeatures.value.push(value)
    }
    return
  }
  clusterFeatures.value = clusterFeatures.value.filter(item => item !== value)
}

// Chart refs
const comparisonChart = ref(null)
const clusteringChart = ref(null)

// Computed
const canSaveSubset = computed(() => currentFilteredVillages.value.length > 0)

const canCompare = computed(() => {
  return isAuthenticated.value && subsetA.value.villages.length > 0 && subsetB.value.villages.length > 0
})

const canCluster = computed(() => {
  return isAuthenticated.value && (
    (clusteringSubset.value === 'A' && subsetA.value.villages.length > 0) ||
    (clusteringSubset.value === 'B' && subsetB.value.villages.length > 0) ||
    (clusteringSubset.value === 'both' && subsetA.value.villages.length > 0 && subsetB.value.villages.length > 0)
  )
})

// Methods
const goToAuth = () => {
  router.push({
    path: '/auth',
    query: {
      redirect: route.fullPath || '/villagesML?module=compute&subtab=subset'
    }
  })
}

const addFilter = () => {
  const defaultField = 'name'
  filters.value.push({
    field: defaultField,
    operator: getDefaultOperator(defaultField),
    value: '',
    level: 'city',      // For region field
    parent: null,       // For region field
    hierarchy: null     // For region field
  })
}

const handleFieldChange = (idx) => {
  const filter = filters.value[idx]

  // Reset value when field changes
  filter.value = ''

  // Set default operator for the new field
  filter.operator = getDefaultOperator(filter.field)

  // Reset region-specific fields
  if (filter.field === 'region') {
    filter.level = 'city'
    filter.parent = null
    filter.hierarchy = null
  }
}

const removeFilter = (idx) => {
  filters.value.splice(idx, 1)
}

const clearFilters = () => {
  filters.value = []
  currentFilteredVillages.value = []
  showSuccess('已清空篩選條件')
}

const applyFilters = async () => {
  if (filters.value.length === 0) return

  loading.value = true
  loadingMessage.value = '正在應用篩選...'
  currentPage.value = 1

  try {
    const apiParams = {}

    filters.value.forEach(filter => {
      if (filter.field === 'region' && filter.operator === 'equals') {
        if (filter.hierarchy) {
          if (filter.hierarchy.city) apiParams.city = filter.hierarchy.city
          if (filter.hierarchy.county) apiParams.county = filter.hierarchy.county
          if (filter.hierarchy.township) apiParams.township = filter.hierarchy.township
        } else if (filter.value) {
          apiParams.city = filter.value
        }
      } else if (filter.field === 'name') {
        if (filter.value) {
          apiParams.keyword = filter.value
          if (filter.operator !== 'contains') {
            apiParams.nameMatchMode = filter.operator === 'startsWith' ? 'startsWith'
              : filter.operator === 'endsWith' ? 'endsWith'
              : filter.operator === 'equals' ? 'equals'
              : undefined
          }
        }
      } else if (filter.field === 'length') {
        const val = parseInt(filter.value)
        if (!isNaN(val) && val >= 2 && val <= 10) {
          apiParams.minLength = val
          apiParams.maxLength = val
        }
      } else if (filter.field === 'semantic') {
        if (filter.value) {
          apiParams.semanticCategories = [filter.value]
        }
      } else if (filter.field === 'structure') {
        if (filter.value) {
          apiParams.structurePatterns = [filter.value]
        }
      } else if (filter.field === 'suffix') {
        if (filter.value) apiParams.suffix = filter.value
      } else if (filter.field === 'prefix') {
        if (filter.value) apiParams.prefix = filter.value
      }
    })

    const response = await fetchSubsetFilter({ ...apiParams, maxResults: 100000 })

    let results = (response.villages || []).map(v => ({
      id: v.id,
      name: v.name,
      region: v.county ? `${v.city}-${v.county}` : v.city,
      length: v.name_length ?? v.nameLength ?? v.name.length
    }))

    currentFilteredVillages.value = results
    currentFilteredVillages.value.filterParams = apiParams
    currentFilteredVillages.value.totalCount = response.total

    showSuccess(`篩選完成，共 ${results.length} 個村莊`)
  } catch (error) {
    showError(error.message || '篩選失敗')
  } finally {
    loading.value = false
  }
}

const saveAsSubsetA = () => {
  if (!currentFilteredVillages.value.filterParams) {
    showError('請先應用篩選條件')
    return
  }

  const count = currentFilteredVillages.value.length

  subsetA.value = {
    label: `子集A (${count}個村莊)`,
    filterParams: { ...currentFilteredVillages.value.filterParams },
    villages: [...currentFilteredVillages.value],
    totalCount: count
  }

  showSuccess(`已保存為子集 A (${count} 個村莊)`)
}

const saveAsSubsetB = () => {
  if (!currentFilteredVillages.value.filterParams) {
    showError('請先應用篩選條件')
    return
  }

  const count = currentFilteredVillages.value.length

  subsetB.value = {
    label: `子集B (${count}個村莊)`,
    filterParams: { ...currentFilteredVillages.value.filterParams },
    villages: [...currentFilteredVillages.value],
    totalCount: count
  }

  showSuccess(`已保存為子集 B (${count} 個村莊)`)
}

const buildGroupParams = (subset) => {
  return {
    label: subset.label,
    village_ids: subset.villages.map(v => v.id),
    filterParams: subset.filterParams
  }
}

const compareSubsets = async () => {
  if (!canCompare.value) return

  // Validate that both subsets have data
  if (!subsetA.value.villages || subsetA.value.villages.length === 0) {
    showError('子集 A 為空，請先構建子集')
    return
  }
  if (!subsetB.value.villages || subsetB.value.villages.length === 0) {
    showError('子集 B 為空，請先構建子集')
    return
  }

  loading.value = true
  loadingMessage.value = '正在比較子集...'

  try {
    // 构建参数，启用所有对比维度
    const params = {
      group_a: buildGroupParams(subsetA.value),
      group_b: buildGroupParams(subsetB.value),
      analysis: {
        semantic_distribution: true,      // 九大语义类别对比
        morphology_patterns: true,        // 形态学对比（扩展）
        character_distribution: true,     // 字符特征对比（新增）
        spatial_distribution: true,       // 空间特征对比（新增）
        statistical_test: 'chi_square'    // 统计检验
      }
    }

    const response = await compareSubsetsAPI(params)

    // 保存完整的响应数据
    comparisonResults.value = response

    await nextTick()
    renderComparisonChart()
    showSuccess(`子集比較完成${response.from_cache ? ' (使用緩存)' : ''}`)
  } catch (error) {
    handleApiError(error)
  } finally {
    loading.value = false
  }
}

const runSubsetClustering = async () => {
  if (!canCluster.value) return

  loading.value = true
  loadingMessage.value = '正在執行聚類...'

  try {
    // Select the subset to cluster
    let subset = null
    if (clusteringSubset.value === 'A') {
      subset = subsetA.value
    } else if (clusteringSubset.value === 'B') {
      subset = subsetB.value
    } else {
      // For 'both', merge filters (this is a simplified approach)
      showError('暫不支持同時聚類兩個子集，請選擇單個子集')
      loading.value = false
      return
    }

    if (!subset.villages || subset.villages.length === 0) {
      showError('請先構建子集')
      loading.value = false
      return
    }

    // 验证特征选择
    if (clusterFeatures.value.length === 0) {
      showError('請至少選擇一種聚類特徵')
      loading.value = false
      return
    }

    // Build parameters matching backend API spec
    const params = {
      village_ids: subset.villages.map(v => v.id),
      filter: {
        ...subset.filterParams,
        sample_size: 1000
      },
      clustering: {
        algorithm: clusterAlgorithm.value,
        k: clusterK.value,
        features: clusterFeatures.value,
        random_state: 42
      }
    }

    const response = await clusterSubset(params)

    // 保存完整的响应数据
    clusteringResults.value = response

    await nextTick()
    renderClusteringChart()
    showSuccess(`聚類分析完成 (${response.execution_time_ms}ms)`)
  } catch (error) {
    handleApiError(error)
  } finally {
    loading.value = false
  }
}

const renderComparisonChart = () => {
  if (!comparisonChart.value || !comparisonResults.value) return

  // Dispose existing instance if any
  if (comparisonChartInstance) {
    comparisonChartInstance.dispose()
    comparisonChartInstance = null
  }

  comparisonChartInstance = echarts.init(comparisonChart.value)

  // 使用 semantic_comparison 數據構建雷達圖
  const semanticData = comparisonResults.value.semantic_comparison || []

  if (semanticData.length === 0) {
    showWarning('沒有語義比較數據')
    return
  }

  // 提取数据并过滤 null/undefined
  const groupAValues = semanticData.map(item => item.group_a_pct || 0)
  const groupBValues = semanticData.map(item => item.group_b_pct || 0)

  // 动态计算最大值（取所有数据的最大值，并向上取整到合适的刻度）
  const allValues = [...groupAValues, ...groupBValues]
  const maxValue = Math.max(...allValues)
  const radarMax = Math.ceil(maxValue * 10) / 10  // 向上取整到 0.1

  // 使用中文類別名稱和动态最大值
  const indicators = semanticData.map(item => ({
    name: `${getCategoryIcon(item.category)} ${getCategoryName(item.category)}`,
    max: radarMax
  }))

  comparisonChartInstance.setOption({
    title: { text: '子集語義特徵比較', left: 'center', textStyle: { color: '#0b2540', fontWeight: 600 } },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const idx = params.dataIndex
        const item = semanticData[idx]
        const categoryName = getCategoryName(item.category)
        return `${getCategoryIcon(item.category)} ${categoryName}<br/>
                ${params.seriesName}: ${(params.value * 100).toFixed(1)}%<br/>
                數量: ${params.seriesName === '子集 A' ? item.group_a_count : item.group_b_count}`
      }
    },
    legend: { data: ['子集 A', '子集 B'], bottom: 10 },
    radar: {
      indicator: indicators,
      axisLabel: {
        show: true,
        formatter: (value) => `${(value * 100).toFixed(0)}%`
      }
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: groupAValues,
          name: '子集 A',
          itemStyle: { color: '#4a90e2' },
          areaStyle: { color: 'rgba(74, 144, 226, 0.3)' }
        },
        {
          value: groupBValues,
          name: '子集 B',
          itemStyle: { color: '#ff9500' },
          areaStyle: { color: 'rgba(255, 152, 0, 0.3)' }
        }
      ]
    }]
  })
}

const renderClusteringChart = () => {
  // 新的聚类 API 响应不包含坐标数据，暂时不渲染图表
  // 如果后续 API 添加了 PCA 坐标，可以在这里实现可视化
  return
}

// Cleanup on unmount
onBeforeUnmount(() => {
  if (comparisonChartInstance) {
    comparisonChartInstance.dispose()
    comparisonChartInstance = null
  }
  if (clusteringChartInstance) {
    clusteringChartInstance.dispose()
    clusteringChartInstance = null
  }
})

const formatNumber = (num) => {
  return typeof num === 'number' ? num.toFixed(4) : 'N/A'
}

const formatPercent = (num) => {
  return typeof num === 'number' ? `${(num * 100).toFixed(2)}%` : 'N/A'
}

const formatFeatureName = (feature) => {
  const nameMap = {
    'avg_name_length': '平均名稱長度',
    'length_1_pct': '1字名稱占比',
    'length_2_pct': '2字名稱占比',
    'length_3_pct': '3字名稱占比',
    'length_4_pct': '4字名稱占比',
    'length_5_pct': '5字名稱占比',
    'length_6_pct': '6字名稱占比',
    'length_7_pct': '7字名稱占比',
    'length_8_pct': '8字名稱占比',
    'length_9_pct': '9字名稱占比'
  }

  // 处理后缀特征（如 suffix_村）
  if (feature.startsWith('suffix_')) {
    const suffix = feature.replace('suffix_', '')
    return `後綴「${suffix}」占比`
  }

  return nameMap[feature] || feature
}

const formatFeatureValue = (feature, value) => {
  if (typeof value !== 'number') return 'N/A'

  // 平均长度保留2位小数
  if (feature === 'avg_name_length') {
    return value.toFixed(2)
  }

  // 百分比特征
  if (feature.includes('_pct') || feature.startsWith('suffix_')) {
    return `${(value * 100).toFixed(2)}%`
  }

  return value.toFixed(4)
}

const formatLift = (lift) => {
  if (lift === null || lift === undefined) {
    return '∞'  // 无穷大符号，表示分母为0
  }
  if (lift === 0) {
    return '0.00'
  }
  return lift.toFixed(2)
}

const getLiftClass = (lift) => {
  if (lift === null || lift === undefined) {
    return 'infinite'
  }
  if (lift > 1) {
    return 'high'
  }
  if (lift === 0) {
    return 'zero'
  }
  return 'low'
}

const formatVector = (vec) => {
  if (!Array.isArray(vec)) return 'N/A'
  return vec.map(v => v.toFixed(2)).join(', ')
}

const formatFilterSummary = (filter) => {
  if (!filter) return 'N/A'
  const parts = []
  if (filter.city) parts.push(`城市: ${filter.city}`)
  if (filter.county) parts.push(`區縣: ${filter.county}`)
  if (filter.township) parts.push(`鄉鎮: ${filter.township}`)
  if (filter.keyword) parts.push(`關鍵詞: ${filter.keyword}`)
  if (filter.minLength) parts.push(`最小長度: ${filter.minLength}`)
  if (filter.maxLength) parts.push(`最大長度: ${filter.maxLength}`)
  if (filter.semanticCategories && filter.semanticCategories.length > 0) {
    parts.push(`語義: ${filter.semanticCategories.join(', ')}`)
  }
  if (filter.structurePatterns && filter.structurePatterns.length > 0) {
    parts.push(`結構: ${filter.structurePatterns.join(', ')}`)
  }
  if (filter.suffix) parts.push(`後綴: ${filter.suffix}`)
  if (filter.prefix) parts.push(`前綴: ${filter.prefix}`)
  return parts.length > 0 ? parts.join(' | ') : '無篩選條件'
}

const handleApiError = (error) => {
  if (error.status === 401) {
    showError('此功能需要登錄，請先登錄')
    setTimeout(() => {
      goToAuth()
    }, 2000)
  } else if (error.status === 408) {
    showError('請求超時，請減少數據量或稍後重試')
  } else if (error.status === 500) {
    showError(`服務器錯誤：${error.message}`)
  } else {
    showError(error.message || '操作失敗')
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

/* ========================================
   Apple Liquid Glass Blue Style
   ======================================== */

.subset-analysis-page {
  padding: 12px;
  max-width: 1600px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  margin-bottom: 20px;
  text-align: center;
}

.page-header h2 {
  font-size: 28px;
  color: var(--text-primary);
  margin-bottom: 10px;
  font-weight: 600;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 16px;
}

.auth-warning {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(var(--color-error-rgb), 0.1);
  border: 2px solid rgba(var(--color-error-rgb), 0.3);
  border-radius: var(--radius-md);
  color: var(--color-error);
  font-weight: 500;
}

.lock-icon {
  font-size: 16px;
}

/* Glass Panel */
.glass-panel {
  padding: 20px;
  margin-bottom: 24px;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.glass-panel:hover {
  box-shadow: 0 12px 40px rgba(var(--vml-blue-rgb), 0.15);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(var(--vml-blue-rgb), 0.2);
}

.panel-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

/* Filter Row */
.filter-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

/* Width ratio: 1:1:2:1 for field:operator:value:button */
.filter-row > *:nth-child(1) {
  flex: 1;
  min-width: 120px;
  max-width: 100%;
}

.filter-row > *:nth-child(2) {
  flex: 1;
  min-width: 120px;
  max-width: 100%;
}

.filter-row > *:nth-child(3) {
  flex: 2;
  min-width: 200px;
  max-width: 100%;
}

.filter-row > *:nth-child(4) {
  flex: 1;
  min-width: 80px;
  max-width: 100%;
}

/* Input Styles */
.glass-input {
  width: 100%;
  padding: 10px 16px;
  background: var(--glass-50);
  border: 1px solid rgba(var(--vml-blue-rgb), 0.3);
  border-radius: var(--radius-md);
  font-size: 14px;
  transition: all 0.3s ease;
}

.glass-input:focus {
  outline: none;
  border-color: var(--vml-blue);
  background: var(--glass-80);
  box-shadow: 0 0 0 3px rgba(var(--vml-blue-rgb), 0.1);
}

.glass-input.small {
  max-width: 120px;
}

.solid-button.danger {
  background: linear-gradient(135deg, var(--color-error-light), var(--color-error));
  box-shadow: 0 4px 12px rgba(229, 115, 115, 0.25);
}

.solid-button.danger:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--color-error-light), var(--color-error-dark));
  box-shadow: 0 6px 20px rgba(229, 115, 115, 0.45);
}

/* Filter Actions */
.filter-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.subset-info {
  margin-top: 20px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(var(--vml-blue-rgb), 0.12), rgba(91, 163, 245, 0.08));
  border-radius: var(--radius-md);
  border: 1px solid rgba(var(--vml-blue-rgb), 0.25);
}

.info-label {
  font-weight: 600;
  color: var(--text-primary);
  margin-right: 8px;
}

.info-value {
  color: var(--vml-blue);
  font-weight: 600;
  font-size: 16px;
}

.info-note {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 400;
  margin-left: 8px;
}

/* Subset Comparison */
.subset-selector {
  display: flex;
  gap: 24px;
  align-items: center;
  margin-bottom: 24px;
}

.subset-card {
  flex: 1;
  padding: 20px;
  background: linear-gradient(145deg, var(--glass-70), var(--glass-50));
  backdrop-filter: blur(10px);
  border-radius: var(--radius-lg);
  border: 2px solid rgba(var(--vml-blue-rgb), 0.2);
  transition: all 0.3s ease;
}

.subset-card:hover {
  border-color: rgba(var(--vml-blue-rgb), 0.4);
  box-shadow: 0 8px 24px rgba(var(--vml-blue-rgb), 0.15);
}

.subset-card h4 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.subset-stats {
  @include flex-col;
  gap: 12px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-item .label {
  font-size: 14px;
  color: var(--text-secondary);
}

.stat-item .value {
  font-weight: 600;
  font-size: 16px;
  color: var(--vml-blue);
}

.vs-divider {
  font-size: 28px;
  font-weight: 700;
  color: var(--vml-blue);
  text-shadow: 0 2px 8px rgba(var(--vml-blue-rgb), 0.3);
}

.comparison-actions {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.metric-card {
  padding: 20px;
  background: linear-gradient(145deg, var(--glass-70), var(--glass-50));
  backdrop-filter: blur(10px);
  border-radius: var(--radius-lg);
  text-align: center;
  border: 2px solid rgba(var(--vml-blue-rgb), 0.2);
  transition: all 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(var(--vml-blue-rgb), 0.2);
  border-color: rgba(var(--vml-blue-rgb), 0.4);
}

.metric-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--vml-blue);
  text-shadow: 0 2px 8px rgba(var(--vml-blue-rgb), 0.2);
}

/* Chart Container */
.chart-container {
  width: 100%;
  height: 400px;
  margin-bottom: 24px;
  border-radius: var(--radius-md);
  overflow: hidden;
}

/* Table Styles */
.glass-table {
  width: 100%;
  min-width: 600px;
  border-collapse: collapse;
  margin-top: 16px;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.glass-table thead {
  background: linear-gradient(135deg, rgba(var(--vml-blue-rgb), 0.15), rgba(91, 163, 245, 0.1));
}

.glass-table th,
.glass-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid rgba(var(--vml-blue-rgb), 0.1);
}

.glass-table th {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.glass-table tbody tr {
  transition: background 0.2s ease;
}

.glass-table tbody tr:hover {
  background: rgba(var(--vml-blue-rgb), 0.05);
}

.diff-value {
  font-weight: 600;
}

.diff-value.positive {
  color: var(--vml-blue);
}

.diff-value.negative {
  color: var(--vml-blue-darker);
}

/* Clustering Controls */
.clustering-controls {
  display: flex;
  gap: 16px;
  // align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 10px;
  // width: 100%;
  max-width: 100%;
}

.control-row label {
  font-weight: 500;
  font-size: 14px;
  color: var(--text-primary);
  white-space: nowrap;
}

.control-row.feature-selector {
  flex-direction: column;
  align-items: flex-start;
  padding: 12px;
  background: rgba(var(--vml-blue-rgb), 0.05);
  border-radius: var(--radius-md);
  border: 1px solid rgba(var(--vml-blue-rgb), 0.2);
}

.feature-checkboxes {
  @include flex-col;
  gap: 8px;
  margin-top: 8px;
}

.feature-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--glass-50);
  border-radius: var(--radius-sm2);
  cursor: pointer;
  transition: all 0.2s ease;
  max-width: 100%;
  box-sizing: border-box;
}

.feature-checkbox:hover {
  background: rgba(var(--vml-blue-rgb), 0.1);
}

.checkbox-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.checkbox-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

/* Clustering Results */
.clustering-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 16px;
  background: linear-gradient(145deg, var(--glass-70), var(--glass-50));
  border-radius: var(--radius-md);
  border: 2px solid rgba(var(--vml-blue-rgb), 0.2);
  text-align: center;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--vml-blue-rgb), 0.2);
  border-color: rgba(var(--vml-blue-rgb), 0.4);
}

.stat-card .stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-card .stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--vml-blue);
}

.clusters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.cluster-card {
  padding: 16px;
  background: linear-gradient(145deg, var(--glass-70), var(--glass-50));
  border-radius: var(--radius-md);
  border: 2px solid rgba(var(--vml-blue-rgb), 0.2);
  transition: all 0.3s ease;
}

.cluster-card:hover {
  border-color: rgba(var(--vml-blue-rgb), 0.4);
  box-shadow: 0 4px 12px rgba(var(--vml-blue-rgb), 0.15);
}

.cluster-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(var(--vml-blue-rgb), 0.2);
}

.cluster-id {
  font-size: 16px;
  font-weight: 600;
  color: var(--vml-blue);
}

.cluster-size {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.cluster-samples {
  @include flex-col;
  gap: 8px;
}

.sample-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.sample-villages {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.village-tag {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(var(--vml-blue-rgb), 0.1);
  border: 1px solid rgba(var(--vml-blue-rgb), 0.2);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.village-tag:hover {
  background: rgba(var(--vml-blue-rgb), 0.2);
  border-color: rgba(var(--vml-blue-rgb), 0.4);
}

/* Responsive Design */
@media (max-width: 768px) {
  .subset-analysis-page {
    padding: 12px;
  }

  .glass-panel {
    padding: 16px;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    gap: 8px;
  }

  .filter-row > * {
    min-width: 0 !important;
    width: 100%;
    max-width: 100%;
    flex: none;
  }

  .subset-selector {
    flex-direction: column;
    gap:6px;
  }

  .vs-divider {
    transform: rotate(90deg);
    margin: 16px 0;
  }

  .clustering-controls {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    padding: 0;
  }

  .control-row {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    gap: 8px;
  }

  .control-row label {
    width: 100%;
  }

  .control-row .glass-input,
  .control-row input {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .glass-panel {
    padding: 16px;
    overflow-x: hidden;
  }

  .glass-panel * {
    max-width: 100%;
    box-sizing: border-box;
  }

  .glass-table {
    min-width: 500px;
  }

  .villages-table-wrapper,
  .feature-diff-table {
    overflow-x: auto;
  }

  .feature-checkbox {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    padding: 8px;
  }

  .feature-checkboxes {
    width: 100%;
  }

  .solid-button {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    padding: 10px 16px;
  }

  .solid-button.primary {
    width: 100%;
  }

  .chart-container {
    height: 300px;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }
}

/* Villages List Panel */
.villages-list-panel {
  margin-bottom: 24px;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.total-count {
  font-size: 14px;
  font-weight: 600;
  color: var(--vml-blue);
}

.display-note {
  font-size: 13px;
  color: var(--text-secondary);
}

.villages-table-wrapper {
  overflow: auto;
  overflow-x: auto;
  max-height: 400px;
  margin-bottom: 16px;
  width: 100%;
}

.feature-diff-table {
  overflow-x: auto;
  width: 100%;
  margin-bottom: 16px;
}

.village-name {
  font-weight: 600;
  color: var(--text-primary);
}

.village-region {
  color: var(--text-secondary);
  font-size: 13px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(var(--vml-blue-rgb), 0.1);
}

.page-info {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* Usage Hints */
.usage-hint {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(var(--vml-blue-rgb), 0.08), rgba(91, 163, 245, 0.05));
  border-left: 3px solid var(--vml-blue);
  border-radius: var(--radius-sm2);
  margin-bottom: 16px;
}

.hint-icon {
  font-size: 18px;
}

.hint-text {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.5;
}

/* Save Actions */
.save-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin: 20px 0;
  padding: 16px;
  background: rgba(var(--vml-blue-rgb), 0.05);
  border-radius: var(--radius-md);
}

/* Category Cell */
.category-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

/* Performance Timings */
.timings-section {
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(145deg, var(--glass-70), var(--glass-50));
  border-radius: var(--radius-lg);
  border: 2px solid rgba(var(--vml-blue-rgb), 0.2);
}

.timings-section h4 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.timings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.timing-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(var(--vml-blue-rgb), 0.05);
  border-radius: var(--radius-md);
  border: 1px solid rgba(var(--vml-blue-rgb), 0.15);
  transition: all 0.3s ease;
}

.timing-card:hover {
  background: rgba(var(--vml-blue-rgb), 0.1);
  border-color: rgba(var(--vml-blue-rgb), 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--vml-blue-rgb), 0.15);
}

.timing-icon {
  font-size: 24px;
  line-height: 1;
}

.timing-info {
  flex: 1;
  @include flex-col;
  gap: 4px;
}

.timing-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.timing-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--vml-blue);
  font-family: 'Courier New', monospace;
}

.char-cell {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
}

.lift-value {
  font-weight: 600;
}

.lift-value.high {
  color: var(--vml-blue);
}

.lift-value.low {
  color: var(--text-slate-light);
}

.lift-value.zero {
  color: var(--color-error-light);
}

.lift-value.infinite {
  color: var(--color-warning);
  font-size: 16px;
}

/* Spatial Comparison */
.spatial-comparison-section {
  margin-top: 24px;
  padding: 20px;
  background: linear-gradient(145deg, var(--glass-70), var(--glass-50));
  border-radius: var(--radius-lg);
  border: 2px solid rgba(var(--vml-blue-rgb), 0.2);
}

.spatial-comparison-section h4 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.spatial-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.spatial-group h5 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--vml-blue);
}

.spatial-stats {
  @include flex-col;
  gap: 8px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(var(--vml-blue-rgb), 0.05);
  border-radius: var(--radius-sm2);
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.stat-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.centroid-distance {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(var(--vml-blue-rgb), 0.15), rgba(91, 163, 245, 0.1));
  border-radius: var(--radius-md);
  border: 2px solid rgba(var(--vml-blue-rgb), 0.3);
}

.distance-label {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.distance-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--vml-blue);
  text-shadow: 0 2px 8px rgba(var(--vml-blue-rgb), 0.2);
}

@media (max-width: 768px) {
  .spatial-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
