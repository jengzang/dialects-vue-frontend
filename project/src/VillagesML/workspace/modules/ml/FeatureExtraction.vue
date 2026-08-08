<template>
  <div class="feature-extraction-page">
      <h3 class="villagesml-subtab-title">
        ML計算 - 特徵提取
        <HelpIcon content="為自訂村莊集合提取多維特徵向量。特徵包括：語義類別（9維VTF）、字符嵌入（100維Word2Vec）、結構特徵（長度、前後綴）、空間特徵（坐標、密度）。支持導出特徵矩陣用於外部分析" />
      </h3>
    <!-- Header -->
    <div class="page-header">
<!--      <h2><InlineIcon icon="🔐" />特徵提取 Feature Extraction</h2>-->
<!--      <p class="subtitle">為自訂村莊集合提取特徵向量</p>-->
      <div v-if="!isAuthenticated" class="auth-warning">
        <span class="lock-icon"><InlineIcon icon="🔒" /></span>
        <span>此功能需要登錄</span>
        <button @click="goToAuth" class="solid-button small">前往登錄</button>
      </div>
    </div>

    <!-- Village Selector -->
    <div class="vml-glass-panel selector-panel">
      <div class="panel-header">
        <h3>選擇村莊</h3>
        <span class="count-badge">已選擇: {{ selectedVillages.length }}</span>
      </div>
      <div class="selector-content">
        <!-- Search Input -->
        <div class="search-bar vml-control-surface">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜尋村莊名稱..."
            class="glass-input small"
            @keyup.enter="loadVillages"
          >
        </div>

        <!-- Region Filters -->
        <div class="filters-row vml-control-surface">
          <div class="vml-control-row">
            <div class="filter-group vml-control-field">
              <label>城市:</label>
              <FilterableSelect
                v-model="filterCity"
                level="city"
                :show-level-selector="false"
                placeholder="選擇城市"
                @update:modelValue="handleCityChange"
              />
            </div>

            <div class="filter-group vml-control-field">
              <label>區縣:</label>
              <FilterableSelect
                v-model="filterCounty"
                level="county"
                :parent="filterCity"
                :show-level-selector="false"
                :disabled="!filterCity"
                placeholder="選擇區縣"
                @update:modelValue="handleCountyChange"
              />
            </div>

            <div class="filter-group vml-control-field">
              <label>鄉鎮:</label>
              <FilterableSelect
                v-model="filterTownship"
                level="township"
                :parent="townshipParent"
                :show-level-selector="false"
                :disabled="!canSelectTownship"
                placeholder="選擇鄉鎮"
                @update:modelValue="loadVillages"
              />
            </div>

            <div class="vml-control-actions">
              <button
                @click="loadVillages"
                :disabled="(!searchKeyword && !hasFilters) || loading"
                class="solid-button primary load-btn"
              >
                {{ loading ? '載入中...' : '載入村莊' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Quick Select -->
        <div class="quick-select-row vml-control-surface" v-if="allVillages.length > 0">
          <label>快速選擇:</label>
          <button @click="selectTop100" class="solid-button small">前 100 個</button>
          <button @click="selectRandom50" class="solid-button small">隨機 50 個</button>
          <button @click="selectAll" class="solid-button small">全選</button>
          <button @click="clearSelection" :disabled="selectedVillages.length === 0" class="solid-button small secondary">清空選擇</button>
        </div>

        <!-- Empty State -->
        <div v-if="allVillages.length === 0 && !loading" class="empty-hint">
          <p><InlineIcon icon="👆" />請輸入搜索關鍵詞或選擇區域，然後點擊「載入村莊」按鈕</p>
        </div>

        <!-- Village List -->
        <div v-else-if="allVillages.length > 0" class="village-list">
          <div
            v-for="village in filteredVillages"
            :key="village.id"
            @click="toggleVillage(village)"
            :class="['village-item', { selected: isSelected(village.id) }]"
          >
            <CheckBox :model-value="isSelected(village.id)" @update:modelValue="toggleVillage(village)" />
            <div class="village-info">
              <div class="village-main">
                <span class="village-name">{{ village.name }}</span>
                <span class="village-id">ID: {{ village.id }}</span>
              </div>
              <div class="village-location">
                <span v-if="village.city" class="location-item">{{ village.city }}</span>
                <span v-if="village.county" class="location-item">{{ village.county }}</span>
                <span v-if="village.township" class="location-item">{{ village.township }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div class="pagination">
          <button @click="prevPage" :disabled="currentPage === 1" class="solid-button small">上一頁</button>
          <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 頁</span>
          <button @click="nextPage" :disabled="currentPage === totalPages" class="solid-button small">下一頁</button>
        </div>
      </div>
    </div>

    <!-- Feature Type Selector -->
    <div class="vml-glass-panel feature-type-panel">
      <div class="panel-header">
        <h3>特徵類型</h3>
      </div>
      <div class="feature-types">
        <CheckBox
          v-for="type in featureTypes"
          :key="type.value"
          :model-value="selectedFeatureTypes.includes(type.value)"
          class="feature-type-item"
          @update:modelValue="toggleFeatureType(type.value, $event)"
        >
          <span class="type-label">{{ type.label }}</span>
          <span class="type-desc">{{ type.description }}</span>
        </CheckBox>
      </div>
    </div>

    <!-- Extraction Controls -->
    <div class="vml-glass-panel controls-panel">
      <div class="panel-header">
        <h3>提取控制</h3>
      </div>
      <div class="controls-content vml-control-surface">
        <div class="controls-row vml-control-row">
          <div class="control-item vml-control-field">
            <label>聚合方法:</label>
            <SimpleSelectDropdown
              v-model="aggregationMethod"
              :options="aggregationMethodOptions"
            />
          </div>
          <div class="control-item vml-control-field">
            <label>標準化:</label>
            <CheckBox :model-value="normalize" @update:modelValue="normalize = $event" />
            <span>對特徵向量進行標準化</span>
          </div>
        </div>
        <div class="button-group vml-control-actions">
          <button
            @click="extractFeatures"
            :disabled="!canExtract || loading"
            class="solid-button primary large"
          >
            <span v-if="!loading">提取特徵</span>
            <span v-else>提取中...</span>
          </button>
          <button
            @click="aggregateFeatures"
            :disabled="!extractionResults || loading"
            class="solid-button secondary large"
          >
            聚合特徵
          </button>
        </div>
      </div>
    </div>

    <!-- Extraction Results -->
    <div v-if="extractionResults" class="vml-glass-panel results-panel">
      <div class="panel-header">
        <h3>提取結果</h3>
        <button @click="exportResults" class="solid-button small">導出CSV</button>
      </div>
      <div class="results-content">
        <!-- Summary Stats -->
        <div class="summary-stats">
          <div class="stat-card">
            <div class="stat-label">村莊數量</div>
            <div class="stat-value">{{ extractionResults.village_count }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">特徵維度</div>
            <div class="stat-value">{{ extractionResults.feature_dimension }}</div>
            <div v-if="extractionResults.dimension_breakdown" class="stat-breakdown">
              <span v-for="(dim, key) in extractionResults.dimension_breakdown" :key="key" class="breakdown-item">
                {{ key }}: {{ dim }}
              </span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">提取時間</div>
            <div class="stat-value">{{ extractionResults.extraction_time }}ms</div>
          </div>
        </div>

        <!-- Feature Table -->
        <div class="feature-table-wrapper">
          <table class="glass-table">
            <thead>
              <tr>
                <th>村名</th>
                <th>ID</th>
                <th>區域</th>
                <th v-for="(type, idx) in selectedFeatureTypes" :key="idx">{{ getFeatureLabel(type) }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="result in paginatedResults" :key="result.village_id">
                <td>{{ result.village_name }}</td>
                <td>{{ result.village_id }}</td>
                <td>{{ result.region }}</td>
                <td v-for="(type, idx) in selectedFeatureTypes" :key="idx">
                  {{ formatFeatureValue(result.features[type]) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Results Pagination -->
        <div class="pagination">
          <button @click="prevResultsPage" :disabled="resultsPage === 1" class="solid-button small">上一頁</button>
          <span class="page-info">第 {{ resultsPage }} / {{ totalResultsPages }} 頁</span>
          <button @click="nextResultsPage" :disabled="resultsPage === totalResultsPages" class="solid-button small">下一頁</button>
        </div>
      </div>
    </div>

    <!-- Aggregation Results -->
    <div v-if="aggregationResults" class="vml-glass-panel aggregation-panel">
      <div class="panel-header">
        <h3>聚合結果 - 特徵分布分析</h3>
        <span class="stat-badge">共 {{ aggregationResults.village_count }} 個村莊</span>
      </div>
      <div class="aggregation-content">
        <!-- 语义特征分布 -->
        <div v-if="aggregationResults.aggregates.semantic" class="agg-section">
          <h4>語義特徵分布</h4>
          <div class="category-grid">
            <div v-for="cat in aggregationResults.aggregates.semantic.data" :key="cat.name" class="category-card">
              <div class="category-name">{{ cat.name }}</div>
              <div class="category-count">{{ cat.count }} 個村莊</div>
              <div class="category-percentage">{{ cat.percentage }}%</div>
            </div>
          </div>
        </div>

        <!-- 结构特征分布 -->
        <div v-if="aggregationResults.aggregates.structural" class="agg-section">
          <h4>結構特徵分布</h4>
          <div class="struct-grid">
            <div class="struct-subsection">
              <h5>村名長度分布</h5>
              <table class="mini-table">
                <thead>
                  <tr>
                    <th>長度</th>
                    <th>數量</th>
                    <th>占比</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in aggregationResults.aggregates.structural.length_distribution" :key="item.length">
                    <td>{{ item.length }} 字</td>
                    <td>{{ item.count }}</td>
                    <td>{{ item.percentage }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="struct-subsection">
              <h5>Top 10 後綴</h5>
              <table class="mini-table">
                <thead>
                  <tr>
                    <th>後綴</th>
                    <th>數量</th>
                    <th>占比</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in aggregationResults.aggregates.structural.top_suffixes" :key="item.suffix">
                    <td>{{ item.suffix }}</td>
                    <td>{{ item.count }}</td>
                    <td>{{ item.percentage }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- N-gram聚类分布 -->
        <div v-if="aggregationResults.aggregates.ngram" class="agg-section">
          <h4>N-gram 聚類分布</h4>
          <div v-if="aggregationResults.aggregates.ngram.kmeans_clusters.length === 0 && aggregationResults.aggregates.ngram.dbscan_clusters.length === 0" class="empty-cluster-hint">
            <p><InlineIcon icon="⚠️" />所選村莊暫無聚類數據</p>
            <p class="hint-text">這些村莊可能尚未進行聚類分析，或聚類數據未同步到數據庫</p>
          </div>
          <div v-else class="cluster-grid">
            <div v-if="aggregationResults.aggregates.ngram.kmeans_clusters.length > 0" class="cluster-subsection">
              <h5>KMeans 聚類</h5>
              <div class="cluster-badges">
                <div v-for="item in aggregationResults.aggregates.ngram.kmeans_clusters" :key="item.cluster_id" class="cluster-badge">
                  <span class="cluster-id">Cluster {{ item.cluster_id }}</span>
                  <span class="cluster-count">{{ item.count }} ({{ item.percentage }}%)</span>
                </div>
              </div>
            </div>
            <div v-if="aggregationResults.aggregates.ngram.dbscan_clusters.length > 0" class="cluster-subsection">
              <h5>DBSCAN 聚類</h5>
              <div class="cluster-badges">
                <div v-for="item in aggregationResults.aggregates.ngram.dbscan_clusters" :key="item.cluster_id" class="cluster-badge">
                  <span class="cluster-id">Cluster {{ item.cluster_id }}</span>
                  <span class="cluster-count">{{ item.count }} ({{ item.percentage }}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 空间特征覆盖 -->
        <div v-if="aggregationResults.aggregates.spatial" class="agg-section">
          <h4>空間特徵覆蓋率</h4>
          <div class="coverage-stats">
            <div class="coverage-item">
              <div class="coverage-label">有坐標</div>
              <div class="coverage-value">{{ aggregationResults.aggregates.spatial.with_coordinates }}</div>
            </div>
            <div class="coverage-item">
              <div class="coverage-label">無坐標</div>
              <div class="coverage-value">{{ aggregationResults.aggregates.spatial.without_coordinates }}</div>
            </div>
            <div class="coverage-item highlight">
              <div class="coverage-label">覆蓋率</div>
              <div class="coverage-value">{{ aggregationResults.aggregates.spatial.coverage_percentage }}%</div>
            </div>
          </div>
        </div>

        <!-- 字符特征 -->
        <div v-if="aggregationResults.aggregates.character" class="agg-section">
          <h4>Top 20 高頻字符</h4>
          <div class="char-grid">
            <div v-for="item in aggregationResults.aggregates.character.top_characters" :key="item.char" class="char-card">
              <div class="char-text">{{ item.char }}</div>
              <div class="char-percentage">{{ item.percentage }}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="ui-loading--page" aria-hidden="true"></div>
      <p>{{ loadingMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import InlineIcon from '@/components/common/InlineIcon.vue'
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import CheckBox from '@/components/selector/CheckBox.vue'
import { useRoute, useRouter } from 'vue-router'
import * as echarts from 'echarts'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import FilterableSelect from '@/VillagesML/components/FilterableSelect.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import { extractFeatures as apiExtractFeatures, fetchSubsetFilter } from '@/api/index.js'
import { showError, showSuccess, showWarning } from '@/utils/ui/message.js'
import { userStore } from '@/main/store/store.js'
import { cityHasCounties } from '@/VillagesML/utils/regionPreload.js'
import { SEMANTIC_CATEGORY_NAMES, isSemanticFeature } from '@/VillagesML/config/villagesML.js'
import { buildCurrentVillagesMLPath } from '@/VillagesML/utils/currentDataset.js'

// Router
const router = useRouter()
const route = useRoute()

// Authentication
const isAuthenticated = computed(() => userStore.isAuthenticated)

// State - Region Filters (参考 SearchPanel 逻辑)
const searchKeyword = ref('')
const filterCity = ref('')
const filterCounty = ref('')
const filterTownship = ref('')
const hasCounties = ref(true)  // 标记当前城市是否有区县

// State - Villages
const selectedVillages = ref([])
const allVillages = ref([])
const currentPage = ref(1)
const pageSize = 20

// State - Feature Extraction
const selectedFeatureTypes = ref(['semantic', 'structural'])
const aggregationMethod = ref('mean')
const normalize = ref(true)
const loading = ref(false)
const loadingMessage = ref('載入中...')
const extractionResults = ref(null)
const aggregationResults = ref(null)

// Results pagination
const resultsPage = ref(1)
const resultsPageSize = 20

// Chart ref
const aggregationChart = ref(null)
let aggregationChartInstance = null

// Feature types (现在后端已支持所有类型)
const featureTypes = [
  { value: 'semantic', label: '語義特徵', description: '9 個語義類別向量' },
  { value: 'structural', label: '結構特徵', description: '村名結構模式' },
  { value: 'ngram', label: 'N-gram 特徵', description: '1-3 字符組合' },
  { value: 'spatial', label: '空間特徵', description: '經緯度坐標' },
  { value: 'character', label: '字符特徵', description: 'Top-20 高頻字符' }
]

const toggleFeatureType = (value, checked) => {
  if (checked) {
    if (!selectedFeatureTypes.value.includes(value)) {
      selectedFeatureTypes.value.push(value)
    }
    return
  }
  selectedFeatureTypes.value = selectedFeatureTypes.value.filter(item => item !== value)
}

const aggregationMethodOptions = [
  { label: '平均值 (Mean)', value: 'mean' },
  { label: '總和 (Sum)', value: 'sum' },
  { label: '最大值 (Max)', value: 'max' },
  { label: '最小值 (Min)', value: 'min' }
]

// Computed
const canExtract = computed(() => {
  return isAuthenticated.value && selectedVillages.value.length > 0 && selectedFeatureTypes.value.length > 0
})

const hasFilters = computed(() => {
  return filterCity.value || filterCounty.value || filterTownship.value
})

// 判断是否可以选择乡镇 (参考 SearchPanel)
const canSelectTownship = computed(() => {
  if (filterCounty.value) return true
  if (filterCity.value && !hasCounties.value) return true
  return false
})

// 乡镇选择器的 parent (参考 SearchPanel)
const townshipParent = computed(() => {
  if (filterCounty.value) return filterCounty.value
  if (filterCity.value && !hasCounties.value) return filterCity.value
  return null
})

const filteredVillages = computed(() => {
  // 直接分页显示，不在前端过滤（搜索由 API 处理）
  const start = (currentPage.value - 1) * pageSize
  return allVillages.value.slice(start, start + pageSize)
})

const totalPages = computed(() => {
  return Math.ceil(allVillages.value.length / pageSize)
})

const paginatedResults = computed(() => {
  if (!extractionResults.value || !extractionResults.value.results) return []
  const start = (resultsPage.value - 1) * resultsPageSize
  return extractionResults.value.results.slice(start, start + resultsPageSize)
})

const totalResultsPages = computed(() => {
  if (!extractionResults.value || !extractionResults.value.results) return 0
  return Math.ceil(extractionResults.value.results.length / resultsPageSize)
})

// Methods
const goToAuth = () => {
  router.push({
    path: '/auth',
    query: {
      redirect: route.fullPath || buildCurrentVillagesMLPath({ module: 'compute', subtab: 'features' })
    }
  })
}

// 城市变化处理 (参考 SearchPanel)
const handleCityChange = async () => {
  filterCounty.value = ''
  filterTownship.value = ''
  allVillages.value = []
  selectedVillages.value = []

  if (filterCity.value) {
    hasCounties.value = await cityHasCounties(filterCity.value)
  } else {
    hasCounties.value = true
  }
}

// 区县变化处理 (参考 SearchPanel)
const handleCountyChange = () => {
  filterTownship.value = ''
  allVillages.value = []
  selectedVillages.value = []
}

// 载入村庄列表
const loadVillages = async () => {
  if (!searchKeyword.value && !hasFilters.value) {
    showWarning('請輸入搜索關鍵詞或選擇區域')
    return
  }

  loading.value = true
  loadingMessage.value = '載入村莊列表...'
  try {
    const params = { maxResults: 50000 }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (filterCity.value) params.city = filterCity.value
    if (filterCounty.value) params.county = filterCounty.value
    if (filterTownship.value) params.township = filterTownship.value

    const response = await fetchSubsetFilter(params)

    allVillages.value = (response.villages || []).map(v => ({
      id: String(v.id),
      name: v.name,
      city: v.city,
      county: v.county,
      township: null,
      region: v.county || v.city
    }))

    if (allVillages.value.length >= 50000) {
      showWarning(`已達到單次查詢上限，僅載入 ${allVillages.value.length} 個村莊`)
    } else {
      showSuccess(`載入了 ${allVillages.value.length} 個村莊`)
    }
    currentPage.value = 1
  } catch (error) {
    showError('載入村莊列表失敗: ' + error.message)
    allVillages.value = []
  } finally {
    loading.value = false
  }
}

// 村庄选择相关
const toggleVillage = (village) => {
  const idx = selectedVillages.value.findIndex(v => v.id === village.id)
  if (idx >= 0) {
    selectedVillages.value.splice(idx, 1)
  } else {
    selectedVillages.value.push(village)
  }
}

const isSelected = (villageId) => {
  return selectedVillages.value.some(v => v.id === villageId)
}

const selectTop100 = () => {
  const count = Math.min(100, allVillages.value.length)
  selectedVillages.value = allVillages.value.slice(0, count)
  showSuccess(`已選擇前 ${count} 個村莊`)
}

const selectRandom50 = () => {
  const count = Math.min(50, allVillages.value.length)
  const shuffled = [...allVillages.value].sort(() => 0.5 - Math.random())
  selectedVillages.value = shuffled.slice(0, count)
  showSuccess(`已隨機選擇 ${count} 個村莊`)
}

const selectAll = () => {
  selectedVillages.value = [...allVillages.value]
  showSuccess(`已選擇全部 ${allVillages.value.length} 個村莊`)
}

const clearSelection = () => {
  selectedVillages.value = []
  showSuccess('已清空選擇')
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const prevResultsPage = () => {
  if (resultsPage.value > 1) resultsPage.value--
}

const nextResultsPage = () => {
  if (resultsPage.value < totalResultsPages.value) resultsPage.value++
}

const extractFeatures = async () => {
  if (!canExtract.value) return

  if (selectedVillages.value.length > 50000) {
    showWarning('選擇的村莊數量超過上限（50,000），請減少選擇後再提取')
    return
  }

  loading.value = true
  loadingMessage.value = '正在提取特徵...'

  try {
    // Build parameters matching backend API spec (使用 village_id，确保是字符串)
    const params = {
      villages: selectedVillages.value.map(v => ({
        village_id: String(v.id)  // 确保 village_id 是字符串类型
      })),
      features: {
        semantic_tags: selectedFeatureTypes.value.includes('semantic'),
        morphology: selectedFeatureTypes.value.includes('structural'),
        clustering: selectedFeatureTypes.value.includes('ngram'),
        spatial: selectedFeatureTypes.value.includes('spatial'),
        character: selectedFeatureTypes.value.includes('character')
      }
    }

    const response = await apiExtractFeatures(params)

    // 处理响应数据，将 features 数组转换为统一格式
    const processedResults = (response.features || []).map((item, index) => ({
      village_id: item.village_id || `v_${index + 1}`,  // 使用后端返回的 village_id
      village_name: item.village_name,
      city: item.city,
      county: item.county,
      region: item.county || item.city,
      // 将特征数据映射到统一的 features 对象
      features: {
        semantic: item.semantic_tags,
        structural: item.morphology,
        ngram: item.clustering,
        spatial: item.spatial,
        character: item.character
      }
    }))

    extractionResults.value = {
      extraction_id: response.extraction_id,
      village_count: response.village_count,
      feature_dimension: response.feature_dimension,
      dimension_breakdown: response.dimension_breakdown,
      extraction_time: response.execution_time_ms,
      results: processedResults,
      from_cache: response.from_cache || false
    }

    resultsPage.value = 1
    showSuccess(`特徵提取完成${response.from_cache ? ' (使用緩存)' : ''}`)
  } catch (error) {
    handleApiError(error)
  } finally {
    loading.value = false
  }
}

const aggregateFeatures = async () => {
  if (!extractionResults.value) return

  loading.value = true
  loadingMessage.value = '正在聚合特徵...'

  try {
    const aggregates = {}

    selectedFeatureTypes.value.forEach(type => {
      if (type === 'semantic') {
        // 语义特征：统计每个类别的出现频率
        const categoryCount = {}
        const totalVillages = extractionResults.value.results.length

        extractionResults.value.results.forEach(result => {
          const feature = result.features.semantic
          if (isSemanticFeature(feature)) {
            Object.keys(feature).forEach(key => {
              if (feature[key] === 1) {
                const categoryKey = key.replace('sem_', '')
                const categoryName = SEMANTIC_CATEGORY_NAMES[categoryKey] || categoryKey
                categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1
              }
            })
          }
        })

        // 转换为百分比并排序
        const sortedCategories = Object.entries(categoryCount)
          .map(([name, count]) => ({
            name,
            count,
            percentage: (count / totalVillages * 100).toFixed(1)
          }))
          .sort((a, b) => b.count - a.count)

        aggregates.semantic = {
          type: 'category_distribution',
          data: sortedCategories,
          total_villages: totalVillages
        }

      } else if (type === 'structural') {
        // 结构特征：统计村名长度分布和后缀分布
        const lengthCount = {}
        const suffixCount = {}
        const totalVillages = extractionResults.value.results.length

        extractionResults.value.results.forEach(result => {
          const feature = result.features.structural
          if (feature && feature.name_length !== undefined) {
            const length = feature.name_length
            lengthCount[length] = (lengthCount[length] || 0) + 1

            if (feature.suffix_1) {
              suffixCount[feature.suffix_1] = (suffixCount[feature.suffix_1] || 0) + 1
            }
          }
        })

        aggregates.structural = {
          type: 'pattern_distribution',
          length_distribution: Object.entries(lengthCount)
            .map(([length, count]) => ({
              length: parseInt(length),
              count,
              percentage: (count / totalVillages * 100).toFixed(1)
            }))
            .sort((a, b) => a.length - b.length),
          top_suffixes: Object.entries(suffixCount)
            .map(([suffix, count]) => ({
              suffix,
              count,
              percentage: (count / totalVillages * 100).toFixed(1)
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10),
          total_villages: totalVillages
        }

      } else if (type === 'ngram') {
        // N-gram特征：统计聚类分布
        const kmeansCount = {}
        const dbscanCount = {}
        const totalVillages = extractionResults.value.results.length

        extractionResults.value.results.forEach(result => {
          const feature = result.features.ngram
          if (feature && feature.kmeans_cluster_id !== undefined) {
            if (feature.kmeans_cluster_id !== null) {
              const clusterId = feature.kmeans_cluster_id
              kmeansCount[clusterId] = (kmeansCount[clusterId] || 0) + 1
            }
            if (feature.dbscan_cluster_id !== null) {
              const clusterId = feature.dbscan_cluster_id
              dbscanCount[clusterId] = (dbscanCount[clusterId] || 0) + 1
            }
          }
        })

        aggregates.ngram = {
          type: 'cluster_distribution',
          kmeans_clusters: Object.entries(kmeansCount)
            .map(([id, count]) => ({
              cluster_id: parseInt(id),
              count,
              percentage: (count / totalVillages * 100).toFixed(1)
            }))
            .sort((a, b) => a.cluster_id - b.cluster_id),
          dbscan_clusters: Object.entries(dbscanCount)
            .map(([id, count]) => ({
              cluster_id: parseInt(id),
              count,
              percentage: (count / totalVillages * 100).toFixed(1)
            }))
            .sort((a, b) => a.cluster_id - b.cluster_id),
          total_villages: totalVillages
        }

      } else if (type === 'spatial') {
        // 空间特征：统计有坐标的村庄数量
        let withCoords = 0
        let withoutCoords = 0

        extractionResults.value.results.forEach(result => {
          const feature = result.features.spatial
          if (feature && feature.longitude !== null && feature.latitude !== null) {
            withCoords++
          } else {
            withoutCoords++
          }
        })

        aggregates.spatial = {
          type: 'coverage',
          with_coordinates: withCoords,
          without_coordinates: withoutCoords,
          coverage_percentage: (withCoords / (withCoords + withoutCoords) * 100).toFixed(1)
        }

      } else if (type === 'character') {
        // 字符特征：统计高频字符
        const charCount = {}
        let totalChars = 0

        extractionResults.value.results.forEach(result => {
          const feature = result.features.character
          if (feature && feature.top_chars && Array.isArray(feature.top_chars)) {
            feature.top_chars.forEach(item => {
              charCount[item.char] = (charCount[item.char] || 0) + item.frequency
              totalChars++
            })
          }
        })

        aggregates.character = {
          type: 'character_frequency',
          top_characters: Object.entries(charCount)
            .map(([char, freq]) => ({
              char,
              frequency: freq,
              percentage: (freq / totalChars * 100).toFixed(1)
            }))
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 20)
        }
      }
    })

    aggregationResults.value = {
      aggregation_id: `agg_${Date.now()}`,
      village_count: extractionResults.value.village_count,
      execution_time: 0,
      aggregates: aggregates,
      from_cache: false
    }

    await nextTick()
    renderAggregationChart()
    showSuccess('特徵聚合完成')
  } catch (error) {
    handleApiError(error)
  } finally {
    loading.value = false
  }
}

const renderAggregationChart = () => {
  if (!aggregationChart.value || !aggregationResults.value) return

  if (aggregationChartInstance) aggregationChartInstance.dispose()
  aggregationChartInstance = echarts.init(aggregationChart.value)
  const types = Object.keys(aggregationResults.value.aggregates)
  const values = types.map(t => aggregationResults.value.aggregates[t].value)

  aggregationChartInstance.setOption({
    title: { text: '聚合特徵分布', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: types.map(t => getFeatureLabel(t)),
      axisLabel: { rotate: 45 }
    },
    yAxis: { type: 'value', name: '聚合值' },
    series: [{
      type: 'bar',
      data: values,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#4a90e2' },
          { offset: 1, color: '#34c759' }
        ])
      }
    }]
  })
}

const getFeatureLabel = (type) => {
  const feature = featureTypes.find(f => f.value === type)
  return feature ? feature.label : type
}

const formatFeatureValue = (value) => {
  if (!value) return 'N/A'

  // 如果是对象（semantic_tags, morphology, clustering, spatial, character）
  if (typeof value === 'object') {
    // semantic_tags: 显示激活的标签（映射为中文）
    if (isSemanticFeature(value)) {
      const activeTags = Object.keys(value)
        .filter(key => value[key] === 1)
        .map(key => {
          // 去掉 "sem_" 前缀，查找中文名称
          const categoryKey = key.replace('sem_', '')
          return SEMANTIC_CATEGORY_NAMES[categoryKey] || categoryKey
        })
      return activeTags.length > 0 ? activeTags.join(', ') : '无'
    }

    // morphology: 显示关键信息
    if (value.name_length !== undefined) {
      return `长度:${value.name_length}, 后缀:${value.suffix_1 || '无'}`
    }

    // clustering: 显示聚类ID（检查所有可能的字段）
    if (value.kmeans_cluster_id !== undefined || value.dbscan_cluster_id !== undefined || value.gmm_cluster_id !== undefined) {
      const clusters = []

      // 检查各种可能的聚类ID字段
      if (value.kmeans_cluster_id !== null && value.kmeans_cluster_id !== undefined) {
        clusters.push(`K:${value.kmeans_cluster_id}`)
      }
      if (value.dbscan_cluster_id !== null && value.dbscan_cluster_id !== undefined) {
        clusters.push(`D:${value.dbscan_cluster_id}`)
      }
      if (value.gmm_cluster_id !== null && value.gmm_cluster_id !== undefined) {
        clusters.push(`G:${value.gmm_cluster_id}`)
      }

      // 如果没有任何聚类ID，显示原始数据以便调试
      if (clusters.length === 0) {
        // 检查是否有其他聚类相关字段
        const clusterKeys = Object.keys(value).filter(k => k.includes('cluster') || k.includes('label'))
        if (clusterKeys.length > 0) {
          return clusterKeys.map(k => `${k}:${value[k]}`).join(', ')
        }
        return '无聚类数据'
      }

      return clusters.join(', ')
    }

    // spatial: 显示经纬度
    if (value.longitude !== undefined && value.latitude !== undefined) {
      if (value.longitude === null || value.latitude === null) {
        return '无坐标数据'
      }
      return `${value.longitude.toFixed(4)}, ${value.latitude.toFixed(4)}`
    }

    // character: 显示 Top-N 高频字符
    if (value.top_chars !== undefined) {
      if (!Array.isArray(value.top_chars) || value.top_chars.length === 0) {
        return '无字符数据'
      }
      // 显示前5个高频字符
      const topChars = value.top_chars.slice(0, 5)
        .map(item => `${item.char}(${(item.frequency * 100).toFixed(1)}%)`)
        .join(', ')
      return topChars + (value.top_chars.length > 5 ? '...' : '')
    }

    return JSON.stringify(value)
  }

  return typeof value === 'number' ? value.toFixed(4) : String(value)
}

const formatNumber = (num) => {
  return typeof num === 'number' ? num.toFixed(4) : 'N/A'
}

const exportResults = () => {
  if (!extractionResults.value) {
    showWarning('請先執行特徵提取')
    return
  }

  // Build CSV header
  const headers = ['Village ID', 'Village Name', 'Region', ...selectedFeatureTypes.value.map(t => getFeatureLabel(t))]
  let csv = headers.join(',') + '\n'

  // Build CSV rows
  extractionResults.value.results.forEach(result => {
    const row = [
      result.village_id,
      `"${result.village_name}"`, // Quote names with commas
      `"${result.region}"`,
      ...selectedFeatureTypes.value.map(type => result.features[type] || '')
    ]
    csv += row.join(',') + '\n'
  })

  // Download file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `feature_extraction_${Date.now()}.csv`
  link.click()
  URL.revokeObjectURL(link.href)

  showSuccess('CSV 導出成功')
}

const formatVector = (vec) => {
  if (!Array.isArray(vec)) return 'N/A'
  return vec.map(v => v.toFixed(2)).join(', ')
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

// Lifecycle
onMounted(() => {
  // FilterableSelect 会自动加载区域列表，无需手动加载
})

onBeforeUnmount(() => {
  if (aggregationChartInstance) {
    aggregationChartInstance.dispose()
    aggregationChartInstance = null
  }
})
</script>

<style scoped lang="scss">
.feature-extraction-page {
  padding: 12px;
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 16px;
  text-align: center;
}

.page-header h2 {
  font-size: 28px;
  color: var(--text-primary);
  margin-bottom: 10px;
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

.glass-panel {
  margin-bottom: 24px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(var(--vml-blue-rgb), 0.2);
}

.panel-header h3 {
  font-size: 16px;
  color: var(--text-primary);
  margin: 0;
}

.count-badge {
  background: var(--vml-blue);
  color: white;
  padding: 4px 12px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
}

.search-bar {
  margin-bottom: 16px;
}

.filters-row {
  margin-bottom: 16px;
}

.load-btn {
  padding: 10px 20px;
  white-space: nowrap;
}

.quick-select-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
}

.quick-select-row label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.empty-hint {
  padding: 40px 20px;
  text-align: center;
  background: rgba(var(--color-warning-rgb), 0.1);
  border: 2px dashed rgba(var(--color-warning-rgb), 0.3);
  border-radius: var(--radius-sm2);
  margin-bottom: 16px;
}

.empty-hint p {
  font-size: 15px;
  color: var(--color-warning);
  margin: 0;
  font-weight: 500;
}

.filter-controls {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-item label {
  font-weight: 500;
  color: var(--text-primary);
}

.glass-select {
  padding: 8px 16px;
  background: var(--glass-50);
  border: 1px solid rgba(var(--vml-blue-rgb), 0.3);
  border-radius: var(--radius-sm2);
  font-size: 14px;
  transition: all 0.3s ease;
}

.glass-select:focus {
  outline: none;
  border-color: var(--vml-blue);
  background: var(--glass-80);
}

.village-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid rgba(var(--vml-blue-rgb), 0.2);
  border-radius: var(--radius-sm2);
  margin-bottom: 16px;
}

.village-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid rgba(var(--vml-blue-rgb), 0.1);
  cursor: pointer;
  transition: background 0.2s ease;
}

.village-item:hover {
  background: rgba(var(--vml-blue-rgb), 0.05);
}

.village-item.selected {
  background: rgba(var(--vml-blue-rgb), 0.1);
}

.village-info {
  flex: 1;
  display: flex;
  gap: 6px;
  min-width: 0;
}

.village-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.village-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}

.village-id {
  font-size: 11px;
  color: var(--text-secondary);
  background: rgba(var(--vml-blue-rgb), 0.1);
  padding: 2px 8px;
  border-radius: var(--radius-sm2);
  font-family: monospace;
}

.village-location {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
}

.location-item {
  color: var(--text-secondary);
  background: var(--glass-50);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(var(--vml-blue-rgb), 0.2);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.page-info {
  font-size: 14px;
  color: var(--text-secondary);
}

.feature-types {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.feature-type-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--glass-50);
  border: 2px solid rgba(var(--vml-blue-rgb), 0.2);
  border-radius: var(--radius-sm2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.feature-type-item:hover {
  background: var(--glass-70);
  border-color: rgba(var(--vml-blue-rgb), 0.4);
}

.type-label {
  font-weight: 600;
  color: var(--text-primary);
  min-width: 80px;
  font-size: 14px;
}

.type-desc {
  font-size: 12px;
  color: var(--text-secondary);
  flex: 1;
}

.controls-panel {
  @include flex-col;
}

.controls-panel .panel-header h3 {
  white-space: nowrap;
  flex-shrink: 0;
}

.controls-content {
  gap: 16px;
}

.controls-row {
  margin-bottom: 8px;
}

.control-item span {
  font-size: 14px;
  color: var(--text-secondary);
}

.button-group {
  margin-top: 8px;
  justify-content: center;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 16px;
  background: var(--glass-60);
  border-radius: var(--radius-md);
  text-align: center;
  border: 2px solid rgba(var(--vml-blue-rgb), 0.2);
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--vml-blue);
}

.stat-breakdown {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 11px;
}

.breakdown-item {
  background: rgba(var(--vml-blue-rgb), 0.1);
  padding: 2px 8px;
  border-radius: var(--radius-sm2);
  color: var(--text-secondary);
}

.feature-table-wrapper {
  overflow-x: auto;
  margin-bottom: 16px;
}

.glass-table {
  width: 100%;
  min-width: 800px;
  border-collapse: collapse;
}

.glass-table thead {
  background: rgba(var(--vml-blue-rgb), 0.1);
  position: sticky;
  top: 0;
  z-index: 10;
}

.glass-table th,
.glass-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid rgba(var(--vml-blue-rgb), 0.1);
  white-space: nowrap;
}

.glass-table th {
  font-weight: 600;
  color: var(--text-primary);
  min-width: 100px;
}

.glass-table td {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chart-container {
  width: 100%;
  height: 400px;
  margin-bottom: 24px;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-overlay);
  @include flex-col;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}


.loading-overlay p {
  color: white;
  margin-top: 16px;
  font-size: 16px;
}

/* Aggregation Results Styles */
.stat-badge {
  background: rgba(var(--vml-blue-rgb), 0.2);
  color: var(--vml-blue);
  padding: 6px 12px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
}

.agg-section {
  margin-bottom: 32px;
  padding: 12px;
  background: var(--glass-30);
  border-radius: var(--radius-md);
}

.agg-section h4 {
  font-size: 16px;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(var(--vml-blue-rgb), 0.2);
}

.agg-section h5 {
  font-size: 14px;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.category-card {
  padding: 12px;
  background: var(--glass-60);
  border-radius: var(--radius-sm2);
  text-align: center;
  border: 2px solid rgba(var(--vml-blue-rgb), 0.2);
}

.category-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.category-count {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.category-percentage {
  font-size: 16px;
  font-weight: 700;
  color: var(--vml-blue);
}

.struct-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.struct-subsection {
  background: var(--glass-40);
  padding: 16px;
  border-radius: var(--radius-sm2);
}

.mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.mini-table th,
.mini-table td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid rgba(var(--vml-blue-rgb), 0.1);
}

.mini-table th {
  font-weight: 600;
  color: var(--text-primary);
  background: rgba(var(--vml-blue-rgb), 0.1);
}

.cluster-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.cluster-subsection {
  background: var(--glass-40);
  padding: 12px;
  border-radius: var(--radius-sm2);
}

.cluster-badges {
  display: flex;
  flex-wrap: wrap;
  max-height: 400px;
  overflow: auto;
  gap: 8px;
}

.cluster-badge {
  @include flex-col;
  padding: 10px 14px;
  background: rgba(var(--vml-blue-rgb), 0.1);
  border-radius: var(--radius-sm2);
  border: 1px solid rgba(var(--vml-blue-rgb), 0.3);
}

.cluster-id {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.cluster-count {
  font-size: 13px;
  color: var(--vml-blue);
  font-weight: 500;
}

.coverage-stats {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.coverage-item {
  padding: 20px;
  background: var(--glass-50);
  border-radius: var(--radius-md);
  text-align: center;
  min-width: 120px;
  border: 2px solid rgba(var(--vml-blue-rgb), 0.2);
}

.coverage-item.highlight {
  background: rgba(var(--vml-blue-rgb), 0.1);
  border-color: var(--vml-blue);
}

.coverage-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.coverage-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--vml-blue);
}

.char-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
}

.char-card {
  padding: 12px;
  background: var(--glass-60);
  border-radius: var(--radius-sm2);
  text-align: center;
  border: 2px solid rgba(var(--vml-blue-rgb), 0.2);
}

.char-text {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.char-percentage {
  font-size: 12px;
  color: var(--vml-blue);
  font-weight: 500;
}

.empty-cluster-hint {
  padding: 30px 20px;
  text-align: center;
  background: rgba(var(--color-warning-rgb), 0.1);
  border: 2px dashed rgba(var(--color-warning-rgb), 0.3);
  border-radius: var(--radius-sm2);
}

.empty-cluster-hint p {
  margin: 8px 0;
  font-size: 14px;
  color: var(--color-warning);
}

.empty-cluster-hint .hint-text {
  font-size: 12px;
  color: var(--text-secondary);
}

/* Responsive - Landscape orientation */
@media (min-aspect-ratio: 1/1) {
  .controls-panel {
    flex-direction: row;
    align-items: center;
  }

  .controls-panel .panel-header {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
}

/* Responsive - Portrait orientation */
@media (max-aspect-ratio: 1/1) {
  .feature-extraction-page {
    padding: 8px;
  }

  .button-group {
    flex-direction: column;
  }

  .chart-container {
    height: 300px;
  }

  .feature-types {
    grid-template-columns: 1fr;
  }
}

/* Responsive - Small screens */
@media (max-width: 768px) {
  .feature-extraction-page {
    padding: 12px;
  }

  .filter-controls {
    flex-direction: column;
  }

  .button-group {
    flex-direction: column;
  }

  .chart-container {
    height: 300px;
  }

  /* 移动端表格优化 */
  .feature-table-wrapper {
    margin: 0 -12px;
    padding: 0 12px;
  }

  .glass-table {
    min-width: 600px;
    font-size: 13px;
  }

  .glass-table th,
  .glass-table td {
    padding: 8px;
    min-width: 80px;
  }

  .glass-table th:first-child,
  .glass-table td:first-child {
    position: sticky;
    left: 0;
    background: var(--glass-90);
    z-index: 5;
    box-shadow: 2px 0 4px var(--bg-hover);
  }

  .glass-table thead th:first-child {
    z-index: 15;
  }

  /* 聚合结果移动端优化 */
  .category-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .struct-grid,
  .cluster-grid {
    grid-template-columns: 1fr;
  }

  .coverage-stats {
    flex-direction: column;
  }

  .char-grid {
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  }
}
</style>
