<template>
  <div class="user-region-page">
    <!-- Header -->
    <div class="page-header">
      <button class="back-btn" @click="goBack">
<!--        <span class="back-icon">←</span>-->
        返回
      </button>
      <h1 class="page-title">🗂️ 個人分區管理</h1>
      <div class="user-badge">{{ username }}</div>
    </div>

    <!-- Stats -->
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">總分區數</span>
        <span class="stat-value">{{ regions.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">總地點數</span>
        <span class="stat-value">{{ totalLocations }}</span>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <button class="btn-primary" @click="openCreateModal">
        <span class="btn-icon">+</span>
        新建分區
      </button>
      <button class="btn-secondary" @click="loadRegions">
        <span class="btn-icon">↻</span>
        刷新
      </button>
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索分區名稱..."
          class="search-input"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>加載中...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && filteredRegions.length === 0" class="empty-state">
      <div class="empty-icon">📭</div>
      <p class="empty-text">{{ searchQuery ? '沒有找到匹配的分區' : '還沒有創建任何分區' }}</p>
      <button v-if="!searchQuery" class="btn-primary" @click="openCreateModal">
        創建第一個分區
      </button>
    </div>

    <!-- Region List -->
    <div v-else class="region-list">
      <div
        v-for="region in filteredRegions"
        :key="region.id"
        class="region-card"
      >
        <div class="region-header">
          <h3 class="region-name">{{ region.region_name }}</h3>
          <div class="region-actions">
            <button class="btn-icon-action" @click="openEditModal(region)" title="編輯">
              ✏️
            </button>
            <button
              class="btn-icon-action danger"
              @click="deleteRegion(region.region_name)"
              :disabled="deletingRegions[region.region_name]"
              title="刪除"
            >
              <span v-if="deletingRegions[region.region_name]" class="btn-spinner-small"></span>
              <span v-else>🗑️</span>
            </button>
          </div>
        </div>
        <div class="region-info">
          <span class="info-badge">
            {{ region.location_count || region.locations?.length || 0 }} 個地點
          </span>
          <span v-if="region.created_at" class="info-date">
            創建於 {{ formatDate(region.created_at) }}
          </span>
          <p v-if="region.description" class="region-description">
            {{ region.description }}
          </p>
        </div>

        <div class="region-locations">
          <span
            v-for="(loc, idx) in (region.locations || []).slice(0, 10)"
            :key="idx"
            class="location-tag"
          >
            {{ loc }}
          </span>
          <span v-if="(region.locations || []).length > 10" class="location-more">
            +{{ (region.locations || []).length - 10 }}
          </span>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <Teleport to="body">
      <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ editingRegion.id ? '編輯分區' : '新建分區' }}</h2>
            <button class="close-btn" @click="closeEditModal">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">分區名稱 *</label>
              <textarea
                v-model="editingRegion.region_name"
                class="form-textarea"
                style="height: 45px"
                placeholder="例如：珠三角粵方言"
                :disabled="!!editingRegion.id"
              />
              <p v-if="editingRegion.id" class="form-hint">
                注意：分區名稱不可修改
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">描述（可選）</label>
              <textarea
                v-model="editingRegion.description"
                class="form-textarea"
                placeholder="簡單描述這個分區的用途..."
                rows="3"
              ></textarea>
            </div>

            <div class="form-group">
              <div class="location-header">
                <label class="form-label">地點 *</label>
                <!-- 打開樹狀圖選擇器按鈕 -->
                <button
                    type="button"
                    class="select-location-btn"
                    @click="openLocationSelector"
                    title="從分區樹狀圖🌳選擇地點"
                >
                  選擇地點
                </button>
              </div>

              <!-- Textarea 輸入框 -->
              <textarea
                v-model="locationInput"
                class="form-input location-input"
                placeholder="請輸入地點名稱，用空格分隔&#10;例如：廣州 香港 深圳 澳門&#10;或點擊按鈕從樹狀圖選擇"
                rows="6"
                @input="updateLocationsFromTextarea"
              ></textarea>
              <p class="form-hint">
                地點之間用空格分隔，系統會自動去重。也可以點擊按鈕從分區樹狀圖選擇。
              </p>

              <!-- 地點統計 -->
              <div class="location-stats">
                <div class="stat-badge">
                  <span class="stat-icon">✍️</span>
                  <span>手動輸入：{{ manualInputCount }} 個</span>
                </div>
                <div class="stat-badge primary">
                  <span class="stat-icon">🌳</span>
                  <span>匹配樹狀：{{ treeSelectedCount }} 個</span>
                </div>
              </div>

              <!-- 顯示已選地點標籤 -->
              <div v-if="editingRegion.locations.length > 0" class="selected-locations-display">
                <div class="location-tags">
                  <span
                    v-for="(loc, idx) in editingRegion.locations"
                    :key="idx"
                    class="location-tag"
                    :class="{ 'from-tree': availableLocations.has(loc) }"
                  >
                    {{ loc }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeEditModal">取消</button>
            <button
              class="btn-primary"
              @click="saveRegion"
              :disabled="!canSave || isSaving"
            >
              <span v-if="isSaving" class="btn-spinner"></span>
              <span v-else>保存</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- PartitionInfoModal -->
    <PartitionInfoModal
      v-model="showPartitionModal"
      initial-tab="map"
      :partition-data="partitionData"
      :is-loading="isLoadingPartitions"
      :error-message="partitionTreeError"
      :auto-enable-selection="autoEnableSelection"
      :initial-selected-locations="editingRegion.locations"
      @locations-selected="handleLocationsSelected"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  getCustomRegions,
  createOrUpdateCustomRegion,
  deleteCustomRegion,
  sqlQuery
} from '@/api'
import {showSuccess, showError, showConfirm, showWarning} from '@/utils/message.js'
import PartitionInfoModal from '@/components/query/PartitionInfoModal.vue'

const router = useRouter()
const route = useRoute()

// State
const regions = ref([])
const loading = ref(false)
const searchQuery = ref('')
const showEditModal = ref(false)
const editingRegion = ref({
  region_name: '',
  locations: [],
  description: ''
})
const isSaving = ref(false)
const deletingRegions = ref({})
const locationInput = ref('')
const username = computed(() => route.query.username || '用戶')

// PartitionInfoModal 相關狀態
const showPartitionModal = ref(false)
const partitionData = ref([])
const isLoadingPartitions = ref(false)
const partitionTreeError = ref('')
const autoEnableSelection = ref(false)

// 從 partitionData 中提取所有可用的地點名稱
const availableLocations = computed(() => {
  if (!partitionData.value || partitionData.value.length === 0) {
    return new Set()
  }
  const locations = partitionData.value
    .map(row => row['簡稱'])
    .filter(name => name && name.trim())
  return new Set(locations)
})

// Computed
const totalLocations = computed(() => {
  const uniqueLocations = new Set()
  regions.value.forEach(region => {
    (region.locations || []).forEach(loc => uniqueLocations.add(loc))
  })
  return uniqueLocations.size
})

const filteredRegions = computed(() => {
  if (!searchQuery.value) return regions.value
  const query = searchQuery.value.toLowerCase()
  return regions.value.filter(region =>
    region.region_name.toLowerCase().includes(query)
  )
})

const canSave = computed(() => {
  return editingRegion.value.region_name.trim() &&
         editingRegion.value.locations.length > 0
})

// 統計從樹狀圖選擇的地點數（實時識別：textarea 中存在於樹狀圖數據中的地點）
const treeSelectedCount = computed(() => {
  // 解析 textarea 中的所有地點
  const allLocations = locationInput.value
    .split(/\s+/)
    .map(loc => loc.trim())
    .filter(loc => loc.length > 0)

  // 去重
  const uniqueLocations = new Set(allLocations)

  // 計算存在於樹狀圖中的地點數量
  const treeCount = [...uniqueLocations].filter(
    loc => availableLocations.value.has(loc)
  ).length

  return treeCount
})

// 統計手動輸入的地點數（實時識別：textarea 中不存在於樹狀圖數據中的地點）
const manualInputCount = computed(() => {
  // 解析 textarea 中的所有地點
  const allLocations = locationInput.value
    .split(/\s+/)
    .map(loc => loc.trim())
    .filter(loc => loc.length > 0)

  // 去重
  const uniqueLocations = new Set(allLocations)

  // 計算不存在於樹狀圖中的地點數量
  const manualCount = [...uniqueLocations].filter(
    loc => !availableLocations.value.has(loc)
  ).length

  return manualCount
})

// Methods
const goBack = () => {
  router.back()
}

const loadRegions = async () => {
  loading.value = true
  try {
    const data = await getCustomRegions()
    regions.value = data.regions || []
    // 判斷數量
    if (regions.value.length > 0) {
      showSuccess(`加載成功，共 ${regions.value.length} 個分區`)
    } else {
      showWarning('請添加自定義分區')
    }
  } catch (error) {
    showError('加載分區失敗：' + error.message)
  } finally {
    loading.value = false
  }
}

// 加載分區數據（用於 PartitionInfoModal）
const fetchPartitionData = async () => {
  isLoadingPartitions.value = true
  partitionTreeError.value = ''

  try {
    // 先檢查 sessionStorage 緩存
    const cachedData = sessionStorage.getItem('partition_data_cache')
    if (cachedData) {
      partitionData.value = JSON.parse(cachedData)
      isLoadingPartitions.value = false
      return
    }

    // 從數據庫獲取
    const response = await sqlQuery({
      db_key: 'query',
      table_name: 'dialects',
      page: 1,
      page_size: 9999,
      sort_by: null,
      sort_desc: false,
      filters: {},
      search_text: '',
      search_columns: []
    })

    partitionData.value = response.data || []

    // 緩存到 sessionStorage
    sessionStorage.setItem('partition_data_cache', JSON.stringify(partitionData.value))
  } catch (error) {
    console.error('獲取分區數據失敗:', error)
    partitionTreeError.value = '獲取分區數據失敗，請稍後再試'
  } finally {
    isLoadingPartitions.value = false
  }
}

// 從 textarea 輸入更新地點列表（用空格分隔，自動去重）
const updateLocationsFromTextarea = () => {
  // 解析 textarea 中的所有地點
  const inputLocations = locationInput.value
    .split(/\s+/)  // 用空格分隔（包括多個空格、tab、換行）
    .map(loc => loc.trim())
    .filter(loc => loc.length > 0)

  // 直接更新 editingRegion.locations（去重）
  editingRegion.value.locations = [...new Set(inputLocations)]
}

// 從 editingRegion.locations 更新到 textarea（雙向綁定的另一半）
const syncLocationsToTextarea = () => {
  // 只顯示所有地點（用空格分隔）
  locationInput.value = editingRegion.value.locations.join(' ')
}

const openCreateModal = () => {
  editingRegion.value = {
    region_name: '',
    locations: [],
    description: ''
  }
  locationInput.value = ''
  showEditModal.value = true

  // 預加載分區數據
  if (partitionData.value.length === 0) {
    fetchPartitionData()
  }
}

const openEditModal = (region) => {
  editingRegion.value = {
    id: region.id,
    region_name: region.region_name,
    locations: [...(region.locations || [])],
    description: region.description || ''
  }
  // 編輯時，將已有地點顯示在 textarea（用空格分隔）
  locationInput.value = (region.locations || []).join(' ')
  showEditModal.value = true

  // 預加載分區數據
  if (partitionData.value.length === 0) {
    fetchPartitionData()
  }
}

const closeEditModal = () => {
  showEditModal.value = false
  locationInput.value = ''
  editingRegion.value = {
    region_name: '',
    locations: [],
    description: ''
  }
}

const saveRegion = async () => {
  if (!canSave.value) return

  isSaving.value = true
  try {
    const data = {
      region_name: editingRegion.value.region_name.trim(),
      locations: editingRegion.value.locations,
      description: editingRegion.value.description?.trim() || ''
    }

    // Check for duplicate name when creating new region
    if (!editingRegion.value.id) {
      const existingRegion = regions.value.find(
        r => r.region_name === data.region_name
      )

      if (existingRegion) {
        const confirmed = await showConfirm(
          `已存在名為「${data.region_name}」的分區，是否覆蓋？`,
          {
            title: '分區名稱重複',
            confirmText: '覆蓋',
            cancelText: '取消'
          }
        )

        if (!confirmed) {
          isSaving.value = false
          return
        }
      }
    }

    await createOrUpdateCustomRegion(data)
    showSuccess(editingRegion.value.id ? '更新成功' : '創建成功')
    closeEditModal()
    await loadRegions()
  } catch (error) {
    showError('保存失敗：' + error.message)
  } finally {
    isSaving.value = false
  }
}

const deleteRegion = async (regionName) => {
  const confirmed = await showConfirm(
    `確定要刪除分區「${regionName}」嗎？此操作不可恢復。`,
    {
      title: '刪除確認',
      confirmText: '刪除',
      cancelText: '取消'
    }
  )

  if (!confirmed) return

  deletingRegions.value[regionName] = true
  try {
    await deleteCustomRegion(regionName)
    showSuccess('刪除成功')
    await loadRegions()
  } catch (error) {
    showError('刪除失敗：' + error.message)
  } finally {
    delete deletingRegions.value[regionName]
  }
}

// 打開地點選擇器（樹狀圖）
const openLocationSelector = () => {
  autoEnableSelection.value = true
  showPartitionModal.value = true
}

// 處理從樹狀圖選擇的地點（雙向綁定：樹狀圖 → textarea）
const handleLocationsSelected = (locations) => {
  // 直接更新 editingRegion.locations
  editingRegion.value.locations = locations

  // 同步到 textarea
  syncLocationsToTextarea()

  showPartitionModal.value = false
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 監聽模態框關閉，重置 autoEnableSelection
watch(showPartitionModal, (isVisible) => {
  if (!isVisible) {
    autoEnableSelection.value = false
  }
})

// Lifecycle
onMounted(() => {
  loadRegions()
})
</script>

<style scoped>
.user-region-page {
  width: 90dvw;
  margin: 0 auto;
  padding: 24px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  min-height: 75dvh;
}

/* Header */
.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.back-btn:hover {
  background: rgba(0, 122, 255, 0.1);
  border-color: rgba(0, 122, 255, 0.3);
}


.page-title {
  flex: 1;
  display: flex;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  white-space: nowrap;
}

.user-badge {
  padding: 6px 16px;
  background: linear-gradient(135deg, #007aff, #0051d5);
  color: white;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

/* Stats Bar */
.stats-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  flex: 1;
  padding: 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}
@media (orientation: portrait) {
  .stat-item {
    padding: 6px 16px;
  }
  .stat-label{
    margin:0;
  }
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 600;
  color: #007aff;
}

/* Toolbar */
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  align-items: center;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #007aff, #0051d5);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.9);
  color: #007aff;
  border: 1px solid rgba(0, 122, 255, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.btn-secondary:hover {
  background: rgba(0, 122, 255, 0.1);
}

.btn-icon {
  font-size: 16px;
}

.search-box {
  flex: 1;
  max-width: 300px;
  margin-left: auto;
}

.search-input {
  width: 90%;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 122, 255, 0.2);
  border-top-color: #007aff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Button spinner for save button */
.btn-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Small spinner for icon buttons (delete) */
.btn-spinner-small {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0, 122, 255, 0.3);
  border-top-color: #007aff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Ensure disabled state is visible */
.btn-primary:disabled,
.btn-icon-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;

}

.empty-text {
  font-size: 16px;
  color: #666;
  margin: 10px;
}

/* Region List */
.region-list {
  display: grid;
  gap: 16px;
}

.region-card {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.region-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
}

.region-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.region-name {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.region-actions {
  display: flex;
  gap: 8px;
}

.btn-icon-action {
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 16px;
}

.btn-icon-action:hover {
  background: rgba(0, 122, 255, 0.1);
  border-color: rgba(0, 122, 255, 0.3);
}

.btn-icon-action.danger {
  background: rgba(255, 59, 48, 0.1);
  border-color: rgba(255, 59, 48, 0.3);
}

.btn-icon-action.danger:hover {
  background: rgba(255, 59, 48, 0.2);
  border-color: rgba(255, 59, 48, 0.5);
}

.region-info {
  display: flex;
  gap: 12px;
  font-size: 13px;
  white-space: nowrap;
  margin-bottom: 12px;
  justify-content: space-between;
}

.info-badge {
  padding: 4px 12px;
  background: rgba(0, 122, 255, 0.1);
  color: #007aff;
  border-radius: 12px;
  font-weight: 500;
}

.info-date {
  color: #999;
}

.region-description {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  margin:0;
}

.region-locations {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.region-locations .location-tag {
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  font-size: 12px;
  color: #666;
}

.location-tags .location-tag {
  padding: 4px 10px;
  background: rgba(0, 122, 255, 0.1);
  color: #007aff;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.location-tags .location-tag.from-tree {
  background: rgba(52, 199, 89, 0.15);
  color: #34c759;
  border: 1px solid rgba(52, 199, 89, 0.3);
}

.location-more {
  padding: 4px 10px;
  background: rgba(0, 122, 255, 0.1);
  color: #007aff;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 18px;
  color: #666;
}

.close-btn:hover {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 8px;
}

.form-input,
.form-textarea {
  height: auto;
  max-height: 120px;
  width: 100%;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.form-input:disabled {
  background: rgba(0, 0, 0, 0.05);
  cursor: not-allowed;
}

.form-hint {
  margin-top: 6px;
  font-size: 12px;
  color: #999;
}

/* 地點輸入框 */
.location-input {
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  line-height: 2;
  resize: vertical;
}

/* 地點統計 */
.location-stats {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  margin-bottom: 12px;
}

.stat-badge {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(0, 122, 255, 0.1);
  border-radius: 8px;
  font-size: 13px;
  color: #007aff;
  font-weight: 500;
}

.stat-badge.primary {
  background: rgba(52, 199, 89, 0.15);
  color: #34c759;
}

.stat-icon {
  font-size: 16px;
}

/* 已選地點顯示區 */
.selected-locations-display {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;
}

.location-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.location-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  gap:6px;
}

.location-header label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-dark);
}

/* 選擇地點按鈕 */
.select-location-btn {
  appearance: none;
  border: 1px solid var(--color-primary-border2);
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  transition: all 0.2s ease;
  font-weight: 500;
}

.select-location-btn:hover {
  background: var(--color-primary-light2);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 122, 255, 0.2);
}

.select-location-btn:active {
  transform: translateY(0);
}


.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .user-region-page {
    padding: 16px;
  }

  .page-header {
    flex-wrap: wrap;
    gap:6px;
  }

  .page-title {
    font-size: 20px;
  }

  .toolbar {
    flex-wrap: wrap;
  }

  .search-box {
    max-width: 100%;
    order: 3;
    flex-basis: 100%;
  }
  .stat-badge{
    padding: 10px 8px;
  }
}
</style>
