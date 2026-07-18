<template>
  <div class="system-info-page">
    <h3 class="villagesml-subtab-title">數據庫概覽與系統健康指標</h3>

    <!-- Header -->
<!--    <div class="page-header">-->
<!--      <p class="subtitle">數據庫概覽與系統健康指標</p>-->
<!--    </div>-->

    <!-- Database Overview -->
    <div class="vml-glass-panel overview-panel">
      <div class="panel-header">
        <h3>數據庫概覽 Database Overview</h3>
        <button @click="refreshOverview" :disabled="loading" class="solid-button small">
          <span v-if="!loading">🔄 刷新</span>
          <span v-else>刷新中...</span>
        </button>
      </div>
      <div v-if="overview" class="overview-content">
        <div class="overview-grid">
          <div class="overview-card">
            <div class="card-icon">🗄️</div>
            <div class="card-info">
              <div class="card-label">數據庫大小</div>
              <div class="card-value">{{ formatSize(overview.database_size) }}</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">📊</div>
            <div class="card-info">
              <div class="card-label">總表數</div>
              <div class="card-value">{{ overview.total_tables }}</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">📝</div>
            <div class="card-info">
              <div class="card-label">總記錄數</div>
              <div class="card-value">{{ formatNumber(overview.total_records) }}</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">🏘️</div>
            <div class="card-info">
              <div class="card-label">村莊總數</div>
              <div class="card-value">{{ formatNumber(overview.village_count) }}</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">🔤</div>
            <div class="card-info">
              <div class="card-label">字符總數</div>
              <div class="card-value">{{ formatNumber(overview.character_count) }}</div>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">🌐</div>
            <div class="card-info">
              <div class="card-label">區域總數</div>
              <div class="card-value">{{ overview.region_count }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- N-gram Significance Statistics -->
    <div class="vml-glass-panel ngram-stats-panel">
      <div class="panel-header">
        <h3>N-gram 顯著性統計 Significance Statistics</h3>
        <button @click="refreshNgramStats" :disabled="loadingNgram" class="solid-button small">
          <span v-if="loadingNgram">加載中...</span>
          <span v-else-if="!ngramStats">加載</span>
          <span v-else>🔄 刷新</span>
        </button>
      </div>
      <div v-if="ngramStats" class="overview-content">
        <!-- 主要统计卡片 -->
        <div class="overview-grid">
          <div class="overview-card large-card">
            <div class="card-icon">📐</div>
            <div class="card-info">
              <div class="card-label">N-gram 總數</div>
              <div class="card-value">{{ formatNumber(ngramStats.ngram_significance?.total || 0) }}</div>
            </div>
          </div>
          <div class="overview-card large-card">
            <div class="card-icon">🔍</div>
            <div class="card-info">
              <div class="card-label">過濾前總數</div>
              <div class="card-value">{{ formatNumber(ngramStats.ngram_significance?.total_before_filter || 0) }}</div>
            </div>
          </div>
          <div class="overview-card large-card">
            <div class="card-icon">📊</div>
            <div class="card-info">
              <div class="card-label">顯著率</div>
              <div class="card-value">{{ calculateSignificanceRate(ngramStats.ngram_significance) }}</div>
            </div>
          </div>
          <div class="overview-card large-card">
            <div class="card-icon">🌐</div>
            <div class="card-info">
              <div class="card-label">區域 N-gram 頻率</div>
              <div class="card-value">{{ formatNumber(ngramStats.regional_ngram_frequency?.total || 0) }}</div>
            </div>
          </div>
        </div>

        <!-- 按行政级别统计 -->
        <div v-if="ngramStats.by_level" class="level-section">
          <h4 class="section-title">按行政級別統計</h4>
          <div class="ngram-level-grid">
            <div v-for="(data, level) in ngramStats.by_level" :key="level" class="level-card">
              <div class="level-name">{{ levelLabel(level) }}</div>
              <div class="level-rate">{{ formatPercentage(data.significant_rate) }}</div>
              <div class="level-detail">
                <div class="level-detail-row">
                  <span class="detail-label">顯著:</span>
                  <span class="detail-value">{{ formatNumber(data.significant) }}</span>
                </div>
<!--                <div class="level-detail-row">-->
<!--                  <span class="detail-label">總數:</span>-->
<!--                  <span class="detail-value">{{ formatNumber(data.total) }}</span>-->
<!--                </div>-->
                <div class="level-detail-row">
                  <span class="detail-label">過濾前:</span>
                  <span class="detail-value">{{ formatNumber(data.total_before_filter) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="loadingNgram" class="vml-loading">
        <div class="ui-loading--page" aria-hidden="true"></div>
      </div>
    </div>

    <!-- Table Statistics -->
    <div class="vml-glass-panel tables-panel">
      <div class="panel-header">
        <h3>表統計信息 Table Statistics</h3>
        <div class="header-controls">
          <button @click="refreshTables" :disabled="loadingTables" class="solid-button small">
            <span v-if="loadingTables">加載中...</span>
            <span v-else-if="tables === null">加載</span>
            <span v-else>🔄 刷新</span>
          </button>
          <input
            v-model="tableSearch"
            type="text"
            placeholder="搜尋表名..."
            class="glass-input small"
          >
          <SimpleSelectDropdown :match-trigger-width="true"
            v-model="tableSortBy"
            :options="sortOptions"
          />
        </div>
      </div>
      <div v-if="tables !== null" class="tables-content">
        <div class="table-wrapper">
          <table class="glass-table">
            <thead>
              <tr>
                <th @click="sortBy('name')" class="sortable">
                  表名 <span v-if="tableSortBy === 'name'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
                </th>
                <th @click="sortBy('records')" class="sortable">
                  記錄數 <span v-if="tableSortBy === 'records'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
                </th>
                <th @click="sortBy('size')" class="sortable">
                  大小 <span v-if="tableSortBy === 'size'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</span>
                </th>
                <th>索引數</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="table in filteredTables" :key="table.name">
                <td class="table-name">{{ table.name }}</td>
                <td>{{ formatNumber(table.records) }}</td>
                <td>{{ formatSize(table.size) }}</td>
                <td>{{ table.indexes }}</td>
                <td>
                  <button @click="viewTableDetails(table)" class="solid-button small">詳情</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination">
          <button @click="prevPage" :disabled="currentPage === 1" class="solid-button small">上一頁</button>
          <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 頁</span>
          <button @click="nextPage" :disabled="currentPage === totalPages" class="solid-button small">下一頁</button>
        </div>
      </div>
      <div v-else-if="loadingTables" class="vml-loading">
        <div class="ui-loading--page" aria-hidden="true"></div>
      </div>
    </div>

    <!-- Table Details Modal -->
    <AppModal
      :model-value="Boolean(selectedTable)"
      size="lg"
      :title="selectedTableTitle"
      close-label="關閉"
      @update:modelValue="closeModal"
    >
      <div v-if="selectedTable">
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">記錄數:</span>
            <span class="detail-value">{{ formatNumber(selectedTable.records) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">大小:</span>
            <span class="detail-value">{{ formatSize(selectedTable.size) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">索引數:</span>
            <span class="detail-value">{{ selectedTable.indexes }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">最後更新:</span>
            <span class="detail-value">{{ formatDate(selectedTable.last_updated) }}</span>
          </div>
        </div>
        <div class="detail-section">
          <h4>列信息 Column Information</h4>
          <table class="glass-table">
            <thead>
              <tr>
                <th>列名</th>
                <th>類型</th>
                <th>可空</th>
                <th>默認值</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="col in selectedTable.columns" :key="col.name">
                <td>{{ col.name }}</td>
                <td>{{ col.type }}</td>
                <td>{{ col.not_null ? '否' : '是' }}</td>
                <td>{{ col.default || 'NULL' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AppModal>

    <!-- Loading -->
    <div v-if="loading" class="initial-state">
      <div class="ui-loading--page" aria-hidden="true"></div>
      <p>載入中...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getVillagesOverview, getVillagesNgrams, getVillagesTables, getCachedVillagesOverview, getCachedVillagesNgrams, getCachedVillagesTables } from '@/composables/data/useVillagesCache.js'
import { showError, showSuccess } from '@/utils/message.js'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import AppModal from '@/components/common/AppModal.vue'
import { useAsyncData } from '@/composables/core/useAsyncData.js'

// State
const overview = ref(null)
const tables = ref(null)
const overviewQuery = useAsyncData()
const tablesQuery = useAsyncData()
const ngramStatsQuery = useAsyncData()
const loading = overviewQuery.loading
const loadingTables = tablesQuery.loading
const selectedTable = ref(null)
const ngramStats = ref(null)
const loadingNgram = ngramStatsQuery.loading

// Table filters
const tableSearch = ref('')
const tableSortBy = ref('name')
const sortOrder = ref('asc')
const currentPage = ref(1)
const pageSize = 20

// Sort options
const sortOptions = [
  { label: '按名稱', value: 'name' },
  { label: '按記錄數', value: 'records' },
  { label: '按大小', value: 'size' }
]

// Computed
const filteredTables = computed(() => {
  if (!tables.value) return []
  let filtered = tables.value

  if (tableSearch.value) {
    filtered = filtered.filter(t => t.name.toLowerCase().includes(tableSearch.value.toLowerCase()))
  }

  // Sort
  filtered.sort((a, b) => {
    let aVal = a[tableSortBy.value]
    let bVal = b[tableSortBy.value]

    if (typeof aVal === 'string') {
      return sortOrder.value === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }

    return sortOrder.value === 'asc' ? aVal - bVal : bVal - aVal
  })

  // Paginate
  const start = (currentPage.value - 1) * pageSize
  return filtered.slice(start, start + pageSize)
})

const totalPages = computed(() => {
  if (!tables.value) return 0
  let count = tables.value.length
  if (tableSearch.value) {
    count = tables.value.filter(t => t.name.toLowerCase().includes(tableSearch.value.toLowerCase())).length
  }
  return Math.ceil(count / pageSize)
})

const selectedTableTitle = computed(() => selectedTable.value ? `表詳情: ${selectedTable.value.name}` : '')

// Methods
function mapOverview(overviewRes) {
  return {
    database_size: (overviewRes.database_size_mb || 0) * 1024 * 1024,
    total_tables: overviewRes.total_tables || 0,
    total_records: overviewRes.total_villages || 0,
    village_count: overviewRes.total_villages || 0,
    character_count: overviewRes.unique_characters || overviewRes.total_characters || 0,
    region_count: (overviewRes.total_cities || 0) + (overviewRes.total_counties || 0) + (overviewRes.total_townships || 0)
  }
}

const refreshOverview = async () => {
  await overviewQuery.load(
    () => getVillagesOverview({ forceRefresh: true }),
    {
      onSuccess: (overviewRes) => {
        overview.value = mapOverview(overviewRes)
        showSuccess('系統信息刷新成功')
      },
      onError: (error) => {
        showError(error.message || '刷新系統信息失敗')
      }
    }
  )
}

const refreshTables = async () => {
  await tablesQuery.load(
    () => getVillagesTables({ forceRefresh: true }),
    {
      onSuccess: (tablesRes) => {
        tables.value = (tablesRes || []).map(table => ({
          name: table.table_name || 'unknown',
          records: table.row_count || 0,
          size: (table.size_mb || 0) * 1024 * 1024,
          indexes: table.index_count || 0,
          last_updated: table.last_modified || new Date().toISOString(),
          columns: table.columns || []
        }))
      },
      onError: (error) => {
        showError(error.message || '加載表信息失敗')
      }
    }
  )
}

const sortBy = (field) => {
  if (tableSortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    tableSortBy.value = field
    sortOrder.value = 'asc'
  }
  currentPage.value = 1
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const viewTableDetails = (table) => {
  selectedTable.value = table
}

const closeModal = () => {
  selectedTable.value = null
}

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024 
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

const formatNumber = (num) => {
  return num.toLocaleString()
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-TW') + ' ' + date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
}

const formatRate = (rate) => rate != null ? (rate * 100).toFixed(1) + '%' : '—'

const formatPercentage = (value) => value != null ? value.toFixed(1) + '%' : '—'

const calculateSignificanceRate = (data) => {
  if (!data || !data.significant || !data.total_before_filter) return '—'
  const rate = (data.significant / data.total_before_filter) * 100
  return rate.toFixed(1) + '%'
}

const levelLabel = (level) => ({ city: '城市', county: '區縣', township: '鄉鎮' }[level] || level)

const refreshNgramStats = async () => {
  await ngramStatsQuery.load(() => getVillagesNgrams({ forceRefresh: true }), {
    onSuccess: (result) => {
      ngramStats.value = result
    },
    onError: () => {
      showError('加載 N-gram 統計失敗')
    }
  })
}

// Lifecycle
onMounted(() => {
  const cachedOverview = getCachedVillagesOverview()
  if (cachedOverview) {
    overview.value = mapOverview(cachedOverview)
  } else {
    refreshOverview()
  }
  const cachedNgrams = getCachedVillagesNgrams()
  if (cachedNgrams) {
    ngramStats.value = cachedNgrams
  }
  const cachedTables = getCachedVillagesTables()
  if (cachedTables) {
    tables.value = cachedTables.map(table => ({
      name: table.table_name || 'unknown',
      records: table.row_count || 0,
      size: (table.size_mb || 0) * 1024 * 1024,
      indexes: table.index_count || 0,
      last_updated: table.last_modified || new Date().toISOString(),
      columns: table.columns || []
    }))
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.system-info-page {
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
  border-bottom: 2px solid rgba(var(--color-primary-rgb), 0.2);
}

.panel-header h3 {
  font-size: 16px;
  color: var(--text-primary);
  margin: 0;
}

.header-controls {
  display: flex;
  gap: 12px;
}

.ngram-level-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.level-section {
  margin-top: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(var(--color-primary-rgb), 0.2);
}

.level-card {
  padding: 16px;
  background: rgba(var(--color-primary-rgb), 0.06);
  border: 1px solid rgba(var(--color-primary-rgb), 0.2);
  border-radius: var(--radius-md);
  text-align: center;
}

.level-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.level-rate {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 12px;
}

.level-detail {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 8px;
}

.level-detail-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid rgba(var(--color-primary-rgb), 0.1);
}

.level-detail-row:last-child {
  border-bottom: none;
}

.level-detail-row .detail-label {
  font-weight: 500;
  color: var(--text-secondary);
}

.level-detail-row .detail-value {
  font-weight: 600;
  color: var(--text-primary);
}

.note-section {
  margin-top: 20px;
  padding: 16px;
  background: rgba(var(--color-warning-rgb), 0.1);
  border: 1px solid rgba(var(--color-warning-rgb), 0.3);
  border-radius: var(--radius-md);
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.note-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.note-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
}




.glass-input,
.glass-select {
  padding: 8px 16px;
  background: var(--glass-50);
  border: 1px solid rgba(var(--color-primary-rgb), 0.3);
  border-radius: var(--radius-sm2);
  font-size: 14px;
  transition: all 0.3s ease;
}

.glass-input:focus,
.glass-select:focus {
  outline: none;
  border-color: var(--color-primary);
  background: var(--glass-80);
}

.glass-input.small,
.glass-select.small {
  padding: 6px 12px;
  font-size: 13px;
}

.solid-button {
  padding: 8px 16px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.solid-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.35);
}

.solid-button:disabled {
  @include disabled-state;
}

.solid-button.small {
  padding: 6px 12px;
  font-size: 13px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: var(--glass-60);
  border-radius: var(--radius-md);
  border: 2px solid rgba(var(--color-primary-rgb), 0.2);
}

.overview-card.large-card {
  flex-direction: column;
  align-items: flex-start;
  padding: 20px;
}

.overview-card.large-card .card-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.overview-card.large-card .card-info {
  width: 100%;
}

.card-meta {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(var(--color-primary-rgb), 0.15);
}

.meta-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 14px;
}

.meta-row span:first-child {
  color: var(--text-secondary);
}

.meta-row span:last-child {
  font-weight: 600;
  color: var(--text-primary);
}

.meta-row .highlight {
  color: var(--color-primary);
  font-weight: 700;
  font-size: 16px;
}

.card-icon {
  font-size: 36px;
}

.card-info {
  flex: 1;
}

.card-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.card-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary);
}

.card-value-dual {
  display: flex;
  gap: 24px;
  margin-top: 8px;
}

.dual-value {
  flex: 1;
  @include flex-col;
  align-items: center;
  padding: 12px;
  background: rgba(var(--color-primary-rgb), 0.05);
  border-radius: var(--radius-sm2);
}

.dual-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.dual-number {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-primary);
}

.dual-number.highlight {
  color: var(--color-primary);
}

.table-wrapper {
  overflow-x: auto;
  margin-bottom: 16px;
}

.glass-table {
  width: 100%;
  border-collapse: collapse;
}

.glass-table thead {
  background: rgba(var(--color-primary-rgb), 0.1);
}

.glass-table th,
.glass-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid rgba(var(--color-primary-rgb), 0.1);
}

.glass-table th {
  font-weight: 600;
  color: var(--text-primary);
}

.glass-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.glass-table th.sortable:hover {
  background: rgba(var(--color-primary-rgb), 0.15);
}

.table-name {
  font-weight: 500;
  color: var(--color-primary);
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

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: rgba(var(--color-primary-rgb), 0.05);
  border-radius: var(--radius-sm2);
}

.detail-label {
  font-weight: 500;
  color: var(--text-secondary);
}

.detail-value {
  font-weight: 600;
  color: var(--text-primary);
}

.detail-section {
  margin-top: 24px;
}

.detail-section h4 {
  margin-bottom: 16px;
  color: var(--text-primary);
}

.initial-state {
  @include flex-col;
  align-items: center;
  justify-content: center;
  height: 60dvh;
  gap: 16px;
}

.initial-state p {
  font-size: 16px;
  color: var(--text-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .system-info-page {
    padding: 12px;
  }

  .header-controls {
    flex-direction: column;
  }
}
</style>
