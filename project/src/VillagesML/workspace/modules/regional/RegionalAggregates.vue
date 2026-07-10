<template>
<!--  <ExploreLayout>-->
    <div class="regional-aggregates-page">
      <h3 class="villagesml-subtab-title">
        區域分析 - 🌍聚合統計
        <HelpIcon content="按行政級別聚合村莊統計數據。包含村莊總數、平均名稱長度、語義類別分布等。空間聚合展示村莊密度、隔離指數和空間分散度的關係" />
      </h3>
<!--      <h1 class="page-title">🌍 區域聚合統計</h1>-->

      <!-- Aggregates Table -->
      <div class="aggregates-section vml-glass-panel">
        <h2>聚合结果表格</h2>
        <div class="aggregates-header">
          <SimpleSelectDropdown
            v-model="currentLevel"
            :options="levelOptions"
          />
          <button class="query-button" :disabled="loading" @click="loadAggregates">查詢</button>
        </div>

        <div v-if="loading" class="vml-loading">
          <div class="ui-loading--page" aria-hidden="true"></div>
        </div>

        <template v-else-if="aggregates.length > 0">
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
        <div class="table-scroll-wrapper">
          <div class="aggregates-table">
            <div class="table-header">
              <div class="col-region">區域</div>
              <div class="col-villages">村莊數</div>
              <div class="col-avg">均長</div>
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
                  <RegionDisplay :item="item" :skip-city="currentLevel !== 'city'" />
                </div>
                <div class="col-villages">{{ item.total_villages }}</div>
                <div class="col-avg">{{ item.avg_name_length?.toFixed(2) }}</div>
                <div class="col-categories">
                  <div class="categories-mini">
                    <span
                      v-for="cat in getSemCategories(item)"
                      :key="cat.key"
                      class="category-badge"
                      :title="`${cat.label}: ${cat.pct.toFixed(1)}%`"
                    >
                    {{ cat.label }}
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
      </template>
    </div>

      <!-- Detail Modal -->
      <AppModal
        :model-value="Boolean(selectedItem)"
        size="sm"
        :show-close="false"
        @update:modelValue="selectedItem = null"
      >
        <template #header>
          <h3 class="regional-detail-title">&#x5340;&#x57DF;&#x8A73;&#x60C5;</h3>
          <button
            type="button"
            class="close-btn close-btn-lg close-btn-inline"
            @click="selectedItem = null"
          >
            &#x2715;
          </button>
        </template>
        <div>
            <div class="detail-info">
              <div class="info-item">
                <span class="info-label">區域:</span>
                <span class="info-value">
                  <RegionDisplay :item="selectedItem" :skip-city="currentLevel !== 'city'" />
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">村莊數量:</span>
                <span class="info-value">{{ selectedItem.total_villages }}</span>
              </div>
            </div>

            <!-- Semantic Categories Chart -->
            <div class="categories-chart">
              <h4>語義類別分佈</h4>
              <div class="chart-bars">
                <div
                  v-for="cat in getSemCategories(selectedItem)"
                  :key="cat.key"
                  class="chart-bar"
                >
                  <div class="bar-label">{{ cat.label }}</div>
                  <div class="bar-container">
                    <div
                      class="bar-fill"
                      :style="{ width: `${(cat.pct / maxCategoryValue) * 100}%` }"
                    ></div>
                  </div>
                  <div class="bar-value">{{ cat.pct.toFixed(1) }}%</div>
                </div>
              </div>
            </div>
          </div>
      </AppModal>

      <!-- Spatial Aggregates -->
      <div class="spatial-section vml-glass-panel">
        <div class="spatial-header">
          <h2 style="white-space: nowrap">空間聚合</h2>
          <div class="controls">
            <SimpleSelectDropdown
              v-model="spatialLevel"
              :options="spatialLevelOptions"
            />
            <button class="query-button" :disabled="loadingSpatial" @click="loadSpatialAggregates">查詢</button>
          </div>
        </div>

        <div v-if="loadingSpatial" class="vml-loading">
          <div class="ui-loading--page" aria-hidden="true"></div>
        </div>

        <div v-show="!loadingSpatial && spatialAggregates.length > 0" style="width: 100%">
          <p class="spatial-desc">X軸：村莊密度 Y軸：隔離指數 氣泡大小：村莊總數 顏色：空間分散度</p>
          <div ref="spatialChart" class="spatial-chart"></div>
        </div>
      </div>

    </div>
<!--  </ExploreLayout>-->
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import AppModal from '@/components/common/AppModal.vue'
import RegionDisplay from '@/VillagesML/components/RegionDisplay.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'
import * as echarts from 'echarts'
import {
    getRegionalAggregatesCity,
    getRegionalAggregatesCounty,
  getRegionalAggregatesTown,
  getRegionalSpatialAggregates
} from '@/api/index.js'
import { showError } from '@/utils/message.js'
import { useAsyncData } from '@/composables/core/useAsyncData.js'

// State
const currentLevel = ref('city')

// 父级选择器的 level：township 查询 → 选县; 其余 → 选市
const aggregates = ref([])
const selectedItem = ref(null)
const spatialAggregates = ref([])

const aggregatesQuery = useAsyncData({
  initialValue: [],
})
const spatialAggregatesQuery = useAsyncData({
  initialValue: [],
})
const loading = aggregatesQuery.loading
const loadingSpatial = spatialAggregatesQuery.loading
const spatialChart = ref(null)
let spatialChartInstance = null

const currentPage = ref(1)
const pageSize = 30
const spatialLevel = ref('city')

// Options for SimpleSelectDropdown
const levelOptions = [
  { label: '市級', value: 'city' },
  { label: '區縣級', value: 'county' },
  { label: '鄉鎮級', value: 'township' }
]

const spatialLevelOptions = [
  { label: '城市', value: 'city' },
  { label: '區縣', value: 'county' }
]

const SEM_LABELS = {
  mountain: '山地',
  water: '水系',
  settlement: '聚落',
  direction: '方位',
  clan: '宗族',
  symbolic: '象徵',
  agriculture: '農業',
  vegetation: '植被',
  infrastructure: '基建'
}

const getSemCategories = (item) =>
  Object.entries(SEM_LABELS).map(([key, label]) => ({
    key, label,
    pct: item[`sem_${key}_pct`] || 0,
    count: item[`sem_${key}_count`] || 0
  }))

// Computed
const totalVillages = computed(() => {
  return aggregates.value.reduce((sum, item) => sum + (item.total_villages || 0), 0)
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
  if (!selectedItem.value) return 1
  return Math.max(...Object.keys(SEM_LABELS).map(k => selectedItem.value[`sem_${k}_pct`] || 0))
})

// Methods
const loadAggregates = async () => {
  aggregates.value = []
  currentPage.value = 1
  await aggregatesQuery.load(async () => {
    if (currentLevel.value === 'city') {
      return await getRegionalAggregatesCity()
    }
    if (currentLevel.value === 'county') {
      return await getRegionalAggregatesCounty()
    }

    const raw = await getRegionalAggregatesTown()
    return raw.map(item => ({ ...item, township: item.town }))
  }, {
    resetOnLoad: true,
    onSuccess: (result) => {
      aggregates.value = result
    },
    onError: () => {
      showError('加載聚合數據失敗')
    }
  })
}

const showDetail = (item) => {
  selectedItem.value = item
}

const loadSpatialAggregates = async () => {
  spatialAggregates.value = []
  await spatialAggregatesQuery.load(
    () => getRegionalSpatialAggregates({ region_level: spatialLevel.value }),
    {
      resetOnLoad: true,
      onSuccess: (result) => {
        spatialAggregates.value = result
      },
      onError: () => {
        showError('加載空間數據失敗')
      }
    }
  )
}

function renderSpatialChart() {
  if (!spatialChart.value || !spatialAggregates.value.length) return
  if (spatialChartInstance) spatialChartInstance.dispose()
  spatialChartInstance = echarts.init(spatialChart.value)

  const seen = new Set()
  const items = spatialAggregates.value.filter(d => {
    if (seen.has(d.region_name)) return false
    seen.add(d.region_name)
    return true
  })

  const maxCount = Math.max(...items.map(d => d.village_count))
  const maxDisp = Math.max(...items.map(d => d.spatial_dispersion))
  const minDisp = Math.min(...items.map(d => d.spatial_dispersion))

  const seriesData = items.map(d => ({
    name: d.region_name,
    value: [d.avg_density, d.avg_isolation_score, d.village_count, d.spatial_dispersion, d.avg_nn_distance, d.n_spatial_clusters, d.n_isolated_villages]
  }))

  spatialChartInstance.setOption({
    tooltip: {
      trigger: 'item',
      formatter: (p) => {
        const [density, isolation, count, disp, nn, clusters, isolated] = p.data.value
        return `<b>${p.data.name}</b><br/>
          村莊數：${count}<br/>
          密度：${density.toFixed(2)}<br/>
          隔離指數：${isolation.toFixed(2)}<br/>
          空間分散度：${disp.toFixed(2)}<br/>
          最近鄰距離：${nn.toFixed(2)} km<br/>
          空間聚類數：${clusters}<br/>
          孤立村莊數：${isolated}`
      }
    },
    dataZoom: [
      { type: 'inside', xAxisIndex: 0, zoomOnMouseWheel: true },
      { type: 'inside', yAxisIndex: 0, zoomOnMouseWheel: true },
      { type: 'slider', xAxisIndex: 0, bottom: 8, height: 20 },
      { type: 'slider', yAxisIndex: 0, right: 8, width: 20 }
    ],
    grid: { left: 70, right: 60, top: 40, bottom: 80 },
    xAxis: {
      type: 'value', name: '密度', nameLocation: 'middle', nameGap: 50,
      min: 'dataMin', max: 'dataMax', scale: true,
      axisLabel: { formatter: v => v.toFixed(2) }
    },
    yAxis: {
      type: 'value', name: '隔離指數', nameLocation: 'middle', nameGap: 50,
      min: 'dataMin', max: 'dataMax', scale: true,
      axisLabel: { formatter: v => v.toFixed(2) }
    },
    series: [{
      type: 'scatter',
      data: seriesData,
      symbolSize: d => Math.sqrt(d[2] / maxCount) * 60 + 10,
      itemStyle: {
        color: (p) => {
          const ratio = (p.data.value[3] - minDisp) / (maxDisp - minDisp || 1)
          const r = Math.round(74 + ratio * (213 - 74))
          const g = Math.round(144 - ratio * (144 - 76))
          const b = Math.round(226 - ratio * (226 - 60))
          return `rgba(${r},${g},${b},0.75)`
        }
      },
      label: {
        show: true,
        formatter: p => p.data.name,
        position: 'top',
        fontSize: 11,
        color: 'var(--text-medium)'
      },
      emphasis: { scale: 1.2 }
    }]
  })
}


watch(currentLevel, loadAggregates)

watch(spatialAggregates, async (val) => {
  if (!val.length) return
  await nextTick()
  requestAnimationFrame(() => {
    renderSpatialChart()
  })
})

onBeforeUnmount(() => {
  if (spatialChartInstance) {
    spatialChartInstance.dispose()
    spatialChartInstance = null
  }
})
</script>

<style scoped>
.regional-aggregates-page {
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

.aggregates-section {
  margin-bottom: 16px;
}

.aggregates-section h2 {
  margin-bottom: 16px;
}

.aggregates-header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.filter-controls {
  display: flex;
  gap: 12px;
}

.filter-input {
  flex: 1;
  padding: 10px 16px;
  border: 2px solid rgba(var(--vml-blue-rgb), 0.3);
  border-radius: 8px;
  font-size: 14px;
  background: var(--glass-50);
}

.filter-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: var(--glass-80);
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 12px;
  background: var(--glass-30);
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

/* 移动端横向滚动容器 */
.table-scroll-wrapper {
  width: 100%;
  overflow-x: auto;
  margin-bottom: 16px;
}

.aggregates-table {
  border-radius: 12px;
  overflow: hidden;
  min-width: 600px;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 6fr 1.5fr;
  gap: 12px;
  padding: 12px 16px;
  align-items: center;
  min-width: 0;
}

.table-header {
  background: rgba(var(--vml-blue-rgb), 0.2);
  font-weight: 600;
  color: var(--text-primary);
}

.table-row {
  background: var(--glass-30);
  border-bottom: 1px solid var(--bg-hover);
  transition: background 0.3s ease;
}

.table-row:hover {
  background: rgba(var(--vml-blue-rgb), 0.1);
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
  padding: 2px 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--vml-blue-rgb), 0.2);
  color: var(--color-primary);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  cursor: help;
  white-space: nowrap;
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
  background: var(--vml-blue-dark);
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
  background: var(--vml-blue-dark);
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.regional-detail-title {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
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
  background: var(--glass-30);
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
  background: var(--glass-50);
  border-radius: 12px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-hover));
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
  background: var(--glass-30);
  border-radius: 8px;
  text-align: center;
}

.stat-item .stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.stat-item .stat-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary);
}

.spatial-section {
  margin-bottom: 16px;
}

.spatial-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.spatial-header h2 {
  margin: 0;
}

.spatial-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0 0 8px 0;
}

.spatial-chart {
  position: relative;
  z-index: 0;
  width: 100%;
  height: 500px;
}


.controls {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
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

}

/* 移动端横向滚动条样式 */
@media (max-aspect-ratio: 1/1) {
}
</style>
