<template>
  <div class="system-info-page">
    <!-- Header -->
    <div class="page-header">
      <h2>系統信息 System Information</h2>
      <p class="subtitle">數據庫概覽與系統健康指標</p>
    </div>

    <!-- Database Overview -->
    <div class="glass-panel overview-panel">
      <div class="panel-header">
        <h3>數據庫概覽 Database Overview</h3>
        <button @click="refreshOverview" :disabled="loading" class="glass-button small">
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

    <!-- Table Statistics -->
    <div class="glass-panel tables-panel">
      <div class="panel-header">
        <h3>表統計信息 Table Statistics</h3>
        <div class="header-controls">
          <input
            v-model="tableSearch"
            type="text"
            placeholder="搜尋表名..."
            class="glass-input small"
          >
          <select v-model="tableSortBy" class="glass-select small">
            <option value="name">按名稱</option>
            <option value="records">按記錄數</option>
            <option value="size">按大小</option>
          </select>
        </div>
      </div>
      <div v-if="tables" class="tables-content">
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
                <th>最後更新</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="table in filteredTables" :key="table.name">
                <td class="table-name">{{ table.name }}</td>
                <td>{{ formatNumber(table.records) }}</td>
                <td>{{ formatSize(table.size) }}</td>
                <td>{{ table.indexes }}</td>
                <td>{{ formatDate(table.last_updated) }}</td>
                <td>
                  <button @click="viewTableDetails(table)" class="glass-button small">詳情</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination">
          <button @click="prevPage" :disabled="currentPage === 1" class="glass-button small">上一頁</button>
          <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 頁</span>
          <button @click="nextPage" :disabled="currentPage === totalPages" class="glass-button small">下一頁</button>
        </div>
      </div>
    </div>

    <!-- Table Details Modal -->
    <div v-if="selectedTable" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>表詳情: {{ selectedTable.name }}</h3>
          <button @click="closeModal" class="close-button">✕</button>
        </div>
        <div class="modal-body">
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
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>載入中...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getMetadataOverview, getMetadataTables } from '@/api/index.js'
import { showError, showSuccess } from '@/utils/message.js'

// State
const overview = ref(null)
const tables = ref([])
const loading = ref(false)
const selectedTable = ref(null)

// Table filters
const tableSearch = ref('')
const tableSortBy = ref('name')
const sortOrder = ref('asc')
const currentPage = ref(1)
const pageSize = 20

// Computed
const filteredTables = computed(() => {
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
  let count = tables.value.length
  if (tableSearch.value) {
    count = tables.value.filter(t => t.name.toLowerCase().includes(tableSearch.value.toLowerCase())).length
  }
  return Math.ceil(count / pageSize)
})

// Methods
const refreshOverview = async () => {
  loading.value = true

  try {
    const [overviewRes, tablesRes] = await Promise.all([
      getMetadataOverview(),
      getMetadataTables()
    ])

    // Map API response to component data structure
    overview.value = {
      database_size: (overviewRes.database_size_mb || 0) * 1024 * 1024, // Convert MB to bytes
      total_tables: tablesRes?.length || 0,
      total_records: overviewRes.total_villages || 0, // Use villages as main record count
      village_count: overviewRes.total_villages || 0,
      character_count: overviewRes.unique_characters || overviewRes.total_characters || 0,
      region_count: (overviewRes.total_cities || 0) + (overviewRes.total_counties || 0) + (overviewRes.total_townships || 0)
    }

    // Map table data from API response (use real field names)
    tables.value = (tablesRes || []).map(table => ({
      name: table.table_name || 'unknown',
      records: table.row_count || 0,
      size: (table.size_mb || 0) * 1024 * 1024, // Convert MB to bytes for display
      indexes: table.index_count || 0,
      last_updated: table.last_modified || new Date().toISOString(),
      columns: table.columns || []
    }))

    showSuccess('系統信息刷新成功')
  } catch (error) {
    showError(error.message || '刷新系統信息失敗')
  } finally {
    loading.value = false
  }
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

// Lifecycle
onMounted(() => {
  refreshOverview()
})
</script>

<style scoped>
.system-info-page {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
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
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(74, 144, 226, 0.2);
}

.panel-header h3 {
  font-size: 20px;
  color: var(--text-primary);
  margin: 0;
}

.header-controls {
  display: flex;
  gap: 12px;
}

.glass-input,
.glass-select {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.glass-input:focus,
.glass-select:focus {
  outline: none;
  border-color: #4a90e2;
  background: rgba(255, 255, 255, 0.8);
}

.glass-input.small,
.glass-select.small {
  padding: 6px 12px;
  font-size: 13px;
}

.glass-button {
  padding: 8px 16px;
  background: linear-gradient(135deg, #4a90e2, #50c878);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.glass-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
}

.glass-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.glass-button.small {
  padding: 6px 12px;
  font-size: 13px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  border: 2px solid rgba(74, 144, 226, 0.2);
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
  color: #4a90e2;
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
  background: rgba(74, 144, 226, 0.1);
}

.glass-table th,
.glass-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid rgba(74, 144, 226, 0.1);
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
  background: rgba(74, 144, 226, 0.15);
}

.table-name {
  font-weight: 500;
  color: #4a90e2;
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 24px;
  max-width: 800px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(74, 144, 226, 0.2);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
}

.close-button:hover {
  color: var(--text-primary);
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
  background: rgba(74, 144, 226, 0.05);
  border-radius: 8px;
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

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-overlay p {
  color: white;
  margin-top: 16px;
  font-size: 16px;
}

/* Responsive */
@media (max-width: 768px) {
  .system-info-page {
    padding: 12px;
  }

  .header-controls {
    flex-direction: column;
  }

  .modal-content {
    width: 95%;
    padding: 16px;
  }
}
</style>