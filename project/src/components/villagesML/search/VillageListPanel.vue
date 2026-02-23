<template>
  <div class="village-list-panel glass-panel">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>載入中...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!villages || villages.length === 0" class="empty-state">
      <div class="empty-icon">🏘️</div>
      <p>{{ emptyMessage }}</p>
    </div>

    <!-- Results Table -->
    <div v-else class="results-container">
      <div class="results-header">
        <span class="results-count">找到 {{ total }} 個村</span>
      </div>

      <div class="table-wrapper">
        <table class="villages-table">
          <thead>
            <tr>
              <th>自然村</th>
              <th>市</th>
              <th>區縣</th>
              <th>鄉鎮</th>
              <th>分析</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="village in villages"
              :key="village.id"
            >
              <td class="village-name">{{ village.name }}</td>
              <td>{{ village.city }}</td>
              <td>{{ village.county }}</td>
              <td>{{ village.township }}</td>
              <td>
                <button class="analyze-button" @click="openDeepAnalysis(village)">
                  🔍
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="totalPages > 1">
        <button
          class="page-button"
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
        >
          ‹ 上一頁
        </button>

        <span class="page-info">
          第 {{ currentPage }} / {{ totalPages }} 頁
        </span>

        <button
          class="page-button"
          :disabled="currentPage === totalPages"
          @click="changePage(currentPage + 1)"
        >
          下一頁 ›
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { villagesMLStore } from '@/utils/villagesMLStore.js'

const props = defineProps({
  villages: {
    type: Array,
    default: () => []
  },
  total: {
    type: Number,
    default: 0
  },
  currentPage: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 20
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['page-change', 'open-deep-analysis'])

const selectedVillage = computed(() => villagesMLStore.selectedVillage)

const totalPages = computed(() => {
  return Math.ceil(props.total / props.pageSize)
})

const emptyMessage = computed(() => {
  if (villagesMLStore.searchKeyword || villagesMLStore.searchFilters.city) {
    return '未找到匹配的村'
  }
  return '請輸入關鍵詞搜尋'
})

const openDeepAnalysis = (village) => {
  emit('open-deep-analysis', village)
}

const changePage = (page) => {
  emit('page-change', page)
}
</script>

<style scoped>
.village-list-panel {
  padding: 20px;
  min-height: 400px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: var(--text-primary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(74, 144, 226, 0.2);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.results-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

.results-count {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.table-wrapper {
  overflow-x: auto;
}

.villages-table {
  width: 100%;
  border-collapse: collapse;
}

.villages-table th {
  padding: 12px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.3);
  border-bottom: 2px solid rgba(255, 255, 255, 0.5);
}

.villages-table td {
  padding: 12px;
  font-size: 13px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.villages-table tbody tr {
  transition: background 0.2s ease;
}

.villages-table tbody tr:hover {
  background: rgba(74, 144, 226, 0.1);
}

.village-name {
  font-weight: 500;
  color: var(--color-primary);
}

.analyze-button {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: rgba(74, 144, 226, 0.2);
  color: var(--color-primary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.analyze-button:hover {
  background: rgba(74, 144, 226, 0.3);
  transform: translateY(-1px);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding-top: 16px;
}

.page-button {
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-button:hover:not(:disabled) {
  background: rgba(74, 144, 226, 0.2);
  border-color: var(--color-primary);
}

.page-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: var(--text-primary);
}
</style>
