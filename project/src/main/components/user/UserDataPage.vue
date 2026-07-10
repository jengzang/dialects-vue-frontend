<template>
  <div class="user-data-page">
    <div class="page-header liquid-panel">
      <div class="header-left">
        <button class="liquid-btn btn-back" type="button" @click="goBack">
          {{ t('common.button.back') }}
        </button>
        <h2>
          <span class="title-icon">📊</span>
          <span>{{ t('user.dataPage.title') }}</span>
          <span v-if="username" class="username-badge">{{ username }}</span>
        </h2>
      </div>
      <div class="stats">
        <span>{{ t('user.dataPage.stats.totalRows', { count: totalCount }) }}</span>
        <span>{{ t('user.dataPage.stats.selectedRows', { count: selectedRecords.length }) }}</span>
      </div>
    </div>

    <div class="toolbar liquid-panel">
      <div class="toolbar-left">
        <button class="liquid-btn btn-primary" type="button" @click="openBatchCreateModal">
          ➕ {{ t('user.dataPage.toolbar.batchAdd') }}
        </button>
        <button
          class="liquid-btn btn-warning"
          type="button"
          :disabled="selectedRecords.length === 0"
          @click="handleBatchEdit"
        >
          ✏️ {{ t('user.dataPage.toolbar.batchEdit') }}
        </button>
        <button
          class="liquid-btn btn-danger"
          type="button"
          :disabled="selectedRecords.length === 0"
          @click="handleBatchDelete"
        >
          🗑️ {{ t('user.dataPage.toolbar.batchDelete') }}
        </button>
        <button class="liquid-btn btn-secondary" type="button" @click="fetchData">
          🔄 {{ t('user.dataPage.toolbar.refresh') }}
        </button>
      </div>
      <div class="toolbar-right">
        <input
          v-model="searchQuery"
          class="search-input liquid-input"
          :placeholder="t('user.dataPage.searchPlaceholder')"
          @input="handleSearch"
        />
      </div>
    </div>

    <div class="table-container liquid-panel">
      <div v-if="loading" class="loading-overlay">
        <div class="loading-content">
          <div class="ui-loading--page" aria-hidden="true"></div>
          <div class="loading-text">{{ t('common.label.loading') }}</div>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th class="col-check">
              <CheckBox
                :model-value="isAllSelected"
                @update:modelValue="toggleSelectAll"
              />
            </th>
            <th>{{ t('user.dataPage.table.shortName') }}</th>
            <th>{{ t('user.dataPage.table.region') }}</th>
            <th>{{ t('user.dataPage.table.coordinates') }}</th>
            <th>{{ t('user.dataPage.table.phonology') }}</th>
            <th>{{ t('user.dataPage.table.feature') }}</th>
            <th>{{ t('user.dataPage.table.value') }}</th>
            <th>{{ t('user.dataPage.table.note') }}</th>
            <th>{{ t('user.dataPage.table.createdAt') }}</th>
            <th>{{ t('user.dataPage.table.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="paginatedData.length === 0">
            <td colspan="10" class="table-empty-cell">
              {{
                searchQuery
                  ? t('user.dataPage.empty.noMatch')
                  : t('common.label.noData')
              }}
            </td>
          </tr>
          <tr v-for="record in paginatedData" :key="record.created_at">
            <td class="col-check">
              <CheckBox
                :model-value="selectedRecords.includes(record.created_at)"
                @update:modelValue="toggleRecordSelection(record.created_at, $event)"
              />
            </td>
            <td>{{ record.簡稱 }}</td>
            <td>{{ record.音典分區 }}</td>
            <td>{{ record.經緯度 }}</td>
            <td>{{ record.聲韻調 || '-' }}</td>
            <td>{{ record.特徵 }}</td>
            <td>{{ record.值 }}</td>
            <td class="cell-note">{{ record.說明 || '-' }}</td>
            <td>{{ formatDate(record.created_at) }}</td>
            <td>
              <button class="liquid-btn btn-edit" type="button" @click="openEditModal(record)">
                {{ t('common.button.edit') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="filteredData.length > 0" class="pagination liquid-panel">
      <div class="pagination-info">
        {{
          t('user.dataPage.pagination.showing', {
            start: startIndex + 1,
            end: endIndex,
            total: filteredData.length
          })
        }}
      </div>
      <div class="pagination-controls">
        <button class="btn-page" type="button" :disabled="currentPage === 1" @click="goToPage(1)">
          {{ t('user.dataPage.pagination.first') }}
        </button>
        <button class="btn-page" type="button" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
          {{ t('user.dataPage.pagination.previous') }}
        </button>
        <div class="page-numbers">
          <button
            v-for="page in visiblePages"
            :key="page"
            type="button"
            :class="['btn-page', { active: page === currentPage }]"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </div>
        <button class="btn-page" type="button" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">
          {{ t('user.dataPage.pagination.next') }}
        </button>
        <button class="btn-page" type="button" :disabled="currentPage === totalPages" @click="goToPage(totalPages)">
          {{ t('user.dataPage.pagination.last') }}
        </button>
      </div>
      <div class="pagination-size">
        <label>{{ t('user.dataPage.pagination.pageSizeLabel') }}</label>
        <SimpleSelectDropdown
          v-model.number="pageSize"
          :options="pageSizeOptions"
          @update:modelValue="handlePageSizeChange"
        />
      </div>
    </div>

    <AppModal
      :model-value="showBatchEditModal"
      size="lg"
      :title="t('user.dataPage.batchEdit.title', { count: batchEditRows.length })"
      close-label="關閉"
      @update:modelValue="closeBatchEditModal"
    >
      <p class="hint">💡 {{ t('user.dataPage.batchEdit.hint') }}</p>
      <div class="batch-table-wrapper" data-variant="edit">
        <table class="batch-table">
          <thead>
            <tr>
              <th class="col-index">#</th>
              <th class="col-short-name">{{ t('user.dataPage.table.shortNameRequired') }}</th>
              <th class="col-region">{{ t('user.dataPage.table.regionRequired') }}</th>
              <th class="col-coordinates">{{ t('user.dataPage.table.coordinatesRequired') }}</th>
              <th class="col-phonology">{{ t('user.dataPage.table.phonology') }}</th>
              <th class="col-feature">{{ t('user.dataPage.table.featureRequired') }}</th>
              <th class="col-value">{{ t('user.dataPage.table.valueRequired') }}</th>
              <th class="col-note">{{ t('user.dataPage.table.note') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in batchEditRows" :key="index">
              <td>{{ index + 1 }}</td>
              <td><input v-model="row.簡稱" :placeholder="t('user.dataPage.form.shortName')" /></td>
              <td><input v-model="row.音典分區" :placeholder="t('user.dataPage.form.regionPlaceholder')" /></td>
              <td><input v-model="row.經緯度" :placeholder="t('user.dataPage.form.coordinatesPlaceholder')" /></td>
              <td><input v-model="row.聲韻調" :placeholder="t('user.dataPage.form.phonologyPlaceholder')" /></td>
              <td><input v-model="row.特徵" :placeholder="t('user.dataPage.form.featurePlaceholder')" /></td>
              <td><input v-model="row.值" :placeholder="t('user.dataPage.form.valuePlaceholder')" /></td>
              <td><input v-model="row.說明" :placeholder="t('user.dataPage.form.notePlaceholder')" /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <template #footer>
        <div class="user-data-modal-footer">
          <button class="liquid-btn btn-primary" type="button" :disabled="validBatchEditRows.length === 0" @click="submitBatchEdit">
            {{ t('user.dataPage.batchEdit.save', { count: validBatchEditRows.length }) }}
          </button>
          <button class="liquid-btn btn-secondary" type="button" @click="closeBatchEditModal">
            {{ t('common.button.cancel') }}
          </button>
        </div>
      </template>
    </AppModal>

    <AppModal
      :model-value="showBatchCreateModal"
      size="lg"
      :title="t('user.dataPage.batchCreate.title')"
      close-label="關閉"
      @update:modelValue="closeBatchCreateModal"
    >
      <p class="hint">💡 {{ t('user.dataPage.batchCreate.hint') }}</p>
      <div class="batch-table-controls">
        <button class="liquid-btn btn-add-row" type="button" @click="addBatchRow">
          ➕ {{ t('user.dataPage.batchCreate.addRow') }}
        </button>
        <button class="liquid-btn btn-clear" type="button" @click="clearBatchRows">
          🗑️ {{ t('user.dataPage.batchCreate.clear') }}
        </button>
        <span class="row-count">
          {{ t('user.dataPage.batchCreate.currentRows', { count: batchRows.length }) }}
        </span>
      </div>
      <div class="batch-table-wrapper" data-variant="create" @paste="handlePaste">
        <table class="batch-table">
          <thead>
            <tr>
              <th class="col-index">#</th>
              <th class="col-short-name">{{ t('user.dataPage.table.shortNameRequired') }}</th>
              <th class="col-region">{{ t('user.dataPage.table.regionRequired') }}</th>
              <th class="col-coordinates">{{ t('user.dataPage.table.coordinatesRequired') }}</th>
              <th class="col-phonology">{{ t('user.dataPage.table.phonology') }}</th>
              <th class="col-feature">{{ t('user.dataPage.table.featureRequired') }}</th>
              <th class="col-value">{{ t('user.dataPage.table.valueRequired') }}</th>
              <th class="col-note">{{ t('user.dataPage.table.note') }}</th>
              <th class="col-action">{{ t('user.dataPage.table.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in batchRows" :key="index">
              <td>{{ index + 1 }}</td>
              <td><input v-model="row.簡稱" :placeholder="t('user.dataPage.form.shortName')" /></td>
              <td><input v-model="row.音典分區" :placeholder="t('user.dataPage.form.regionPlaceholder')" /></td>
              <td><input v-model="row.經緯度" :placeholder="t('user.dataPage.form.coordinatesPlaceholder')" /></td>
              <td><input v-model="row.聲韻調" :placeholder="t('user.dataPage.form.phonologyPlaceholder')" /></td>
              <td><input v-model="row.特徵" :placeholder="t('user.dataPage.form.featurePlaceholder')" /></td>
              <td><input v-model="row.值" :placeholder="t('user.dataPage.form.valuePlaceholder')" /></td>
              <td><input v-model="row.說明" :placeholder="t('user.dataPage.form.notePlaceholder')" /></td>
              <td>
                <button class="btn-remove" type="button" @click="removeBatchRow(index)">×</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <template #footer>
        <div class="user-data-modal-footer">
          <button class="liquid-btn btn-primary" type="button" :disabled="validBatchRows.length === 0" @click="submitBatchCreate">
            {{ t('user.dataPage.batchCreate.submit', { count: validBatchRows.length }) }}
          </button>
          <button class="liquid-btn btn-secondary" type="button" @click="closeBatchCreateModal">
            {{ t('common.button.cancel') }}
          </button>
        </div>
      </template>
    </AppModal>

    <AppModal
      :model-value="showEditModal"
      size="sm"
      :title="t('user.dataPage.singleEdit.title')"
      close-label="關閉"
      @update:modelValue="closeEditModal"
    >
      <div class="form-group">
        <label>{{ t('user.dataPage.table.shortNameRequired') }}</label>
        <input v-model="editingRecord.簡稱" />
      </div>
      <div class="form-group">
        <label>{{ t('user.dataPage.table.regionRequired') }}</label>
        <input v-model="editingRecord.音典分區" />
      </div>
      <div class="form-group">
        <label>{{ t('user.dataPage.table.coordinatesRequired') }}</label>
        <input v-model="editingRecord.經緯度" :placeholder="t('user.dataPage.form.coordinatesPlaceholder')" />
      </div>
      <div class="form-group">
        <label>{{ t('user.dataPage.table.phonology') }}</label>
        <input v-model="editingRecord.聲韻調" />
      </div>
      <div class="form-group">
        <label>{{ t('user.dataPage.table.featureRequired') }}</label>
        <input v-model="editingRecord.特徵" />
      </div>
      <div class="form-group">
        <label>{{ t('user.dataPage.table.valueRequired') }}</label>
        <input v-model="editingRecord.值" />
      </div>
      <div class="form-group">
        <label>{{ t('user.dataPage.table.note') }}</label>
        <textarea v-model="editingRecord.說明" rows="3"></textarea>
      </div>
      <template #footer>
        <div class="user-data-modal-footer">
          <button class="liquid-btn btn-primary" type="button" @click="submitEdit">
            {{ t('common.button.save') }}
          </button>
          <button class="liquid-btn btn-secondary" type="button" @click="closeEditModal">
            {{ t('common.button.cancel') }}
          </button>
        </div>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AppModal from '@/components/common/AppModal.vue'
import CheckBox from '@/components/selector/CheckBox.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import { batchCreateCustomData, batchDeleteCustomData, editCustomData, getAllCustomData } from '@/api'
import { invalidateCustomDataPresence, markCustomDataExists } from '@/composables/custom/useCustomDataPresence.js'
import { useAsyncData } from '@/composables/core/useAsyncData.js'
import { userStore } from '@/main/store/store.js'
import { showConfirm, showError, showSuccess, showWarning } from '@/utils/message.js'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()

const username = computed(() => route.query.username || userStore.username || t('user.dataPage.usernameFallback'))

const dataList = ref([])
const totalCount = ref(0)
const selectedRecords = ref([])
const showBatchCreateModal = ref(false)
const showBatchEditModal = ref(false)
const showEditModal = ref(false)
const batchCreateText = ref('')
const batchRows = ref([])
const batchEditRows = ref([])
const editingRecord = ref({})
const dataQuery = useAsyncData({
  initialValue: []
})
const loading = dataQuery.loading

const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

const pageSizeOptions = computed(() => [10, 20, 50, 100].map((value) => ({
  label: t('user.dataPage.pagination.pageSizeOption', { count: value }),
  value
})))

const isAllSelected = computed(() => (
  paginatedData.value.length > 0 &&
  selectedRecords.value.length === paginatedData.value.length
))

const filteredData = computed(() => {
  if (!searchQuery.value.trim()) {
    return dataList.value
  }

  const query = searchQuery.value.toLowerCase()
  return dataList.value.filter((record) => (
    record.簡稱?.toLowerCase().includes(query) ||
    record.音典分區?.toLowerCase().includes(query) ||
    record.經緯度?.toLowerCase().includes(query) ||
    record.聲韻調?.toLowerCase().includes(query) ||
    record.特徵?.toLowerCase().includes(query) ||
    record.值?.toLowerCase().includes(query) ||
    record.說明?.toLowerCase().includes(query)
  ))
})

const totalPages = computed(() => Math.ceil(filteredData.value.length / pageSize.value))

const startIndex = computed(() => (currentPage.value - 1) * pageSize.value)

const endIndex = computed(() => Math.min(startIndex.value + pageSize.value, filteredData.value.length))

const paginatedData = computed(() => filteredData.value.slice(startIndex.value, endIndex.value))

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  return pages
})

const parsedBatchData = computed(() => {
  if (!batchCreateText.value.trim()) return []

  const lines = batchCreateText.value.trim().split('\n')
  return lines.map((line) => {
    const parts = line.split('\t')
    return {
      簡稱: parts[0]?.trim() || '',
      音典分區: parts[1]?.trim() || '',
      經緯度: parts[2]?.trim() || '',
      聲韻調: parts[3]?.trim() || '',
      特徵: parts[4]?.trim() || '',
      值: parts[5]?.trim() || '',
      說明: parts[6]?.trim() || '',
      username: userStore.username
    }
  }).filter((item) => item.簡稱 && item.音典分區 && item.經緯度 && item.特徵 && item.值)
})

const validBatchRows = computed(() => batchRows.value.filter((row) => (
  row.簡稱 && row.音典分區 && row.經緯度 && row.特徵 && row.值
)))

const validBatchEditRows = computed(() => batchEditRows.value.filter((row) => (
  row.簡稱 && row.音典分區 && row.經緯度 && row.特徵 && row.值
)))

const fetchData = async () => {
  await dataQuery.load(() => getAllCustomData(), {
    onSuccess: (response) => {
      dataList.value = response.data || []
      totalCount.value = response.total || 0

      if (dataList.value.length > 0) {
        showSuccess(t('user.dataPage.messages.fetchSuccess'))
      } else {
        showWarning(t('user.dataPage.messages.noDataWarning'))
      }
    },
    onError: (error) => {
      dataList.value = []
      totalCount.value = 0
      showError(t('user.dataPage.messages.fetchFailed', { message: error.message }))

      if (error.message.includes('401') || error.message.includes('登錄') || error.message.includes('登录')) {
        setTimeout(() => router.replace(buildLocalePath(resolveRouteLocale(route), '/auth')), 1500)
      }
    }
  })
}

const toggleSelectAll = (checked) => {
  if (checked) {
    selectedRecords.value = paginatedData.value.map((record) => record.created_at)
  } else {
    selectedRecords.value = []
  }
}

const toggleRecordSelection = (recordId, checked) => {
  if (checked) {
    if (!selectedRecords.value.includes(recordId)) {
      selectedRecords.value = [...selectedRecords.value, recordId]
    }
    return
  }

  selectedRecords.value = selectedRecords.value.filter((id) => id !== recordId)
}

const handleSearch = () => {
  currentPage.value = 1
}

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const handlePageSizeChange = () => {
  currentPage.value = 1
}

const openEditModal = (record) => {
  editingRecord.value = { ...record }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editingRecord.value = {}
}

const submitEdit = async () => {
  try {
    await editCustomData(editingRecord.value)
    invalidateCustomDataPresence()
    showSuccess(t('user.dataPage.messages.updateSuccess'))
    closeEditModal()
    await fetchData()
  } catch (error) {
    showError(t('user.dataPage.messages.updateFailed', { message: error.message }))
  }
}

const openBatchCreateModal = () => {
  showBatchCreateModal.value = true
  if (batchRows.value.length === 0) {
    addBatchRow()
  }
}

const closeBatchCreateModal = () => {
  showBatchCreateModal.value = false
  batchCreateText.value = ''
  batchRows.value = []
}

const addBatchRow = () => {
  batchRows.value.push({
    簡稱: '',
    音典分區: '',
    經緯度: '',
    聲韻調: '',
    特徵: '',
    值: '',
    說明: ''
  })
}

const removeBatchRow = (index) => {
  batchRows.value.splice(index, 1)
}

const clearBatchRows = async () => {
  if (batchRows.value.length === 0) return

  const confirmed = await showConfirm(t('user.dataPage.messages.clearRowsConfirm'), {
    title: t('user.dataPage.messages.clearRowsTitle'),
    confirmText: t('common.button.confirm'),
    cancelText: t('common.button.cancel')
  })

  if (confirmed) {
    batchRows.value = []
  }
}

const handlePaste = (event) => {
  const clipboardData = event.clipboardData || window.clipboardData
  const pastedText = clipboardData.getData('text')

  if (!pastedText) return

  const lines = pastedText.trim().split('\n')
  const newRows = lines.map((line) => {
    const parts = line.split('\t')
    return {
      簡稱: parts[0]?.trim() || '',
      音典分區: parts[1]?.trim() || '',
      經緯度: parts[2]?.trim() || '',
      聲韻調: parts[3]?.trim() || '',
      特徵: parts[4]?.trim() || '',
      值: parts[5]?.trim() || '',
      說明: parts[6]?.trim() || ''
    }
  })

  if (batchRows.value.length === 0) {
    batchRows.value = newRows
  } else {
    batchRows.value.push(...newRows)
  }

  event.preventDefault()
  showSuccess(t('user.dataPage.messages.pastedRows', { count: newRows.length }))
}

const submitBatchCreate = async () => {
  const data = validBatchRows.value.map((row) => ({
    ...row,
    username: userStore.username
  }))

  if (data.length === 0) {
    showWarning(t('user.dataPage.messages.invalidBatchData'))
    return
  }

  if (data.length > 50) {
    showWarning(t('user.dataPage.messages.maxBatchLimit'))
    return
  }

  try {
    const response = await batchCreateCustomData(data)
    markCustomDataExists(true)
    showSuccess(response.message || t('user.dataPage.messages.batchCreateSuccess', { count: data.length }))
    closeBatchCreateModal()
    await fetchData()
  } catch (error) {
    showError(t('user.dataPage.messages.batchCreateFailed', { message: error.message }))
  }
}

const handleBatchEdit = () => {
  if (selectedRecords.value.length === 0) {
    showWarning(t('user.dataPage.messages.selectForEdit'))
    return
  }

  const selectedData = dataList.value.filter((record) => selectedRecords.value.includes(record.created_at))

  batchEditRows.value = selectedData.map((record) => ({
    簡稱: record.簡稱,
    音典分區: record.音典分區,
    經緯度: record.經緯度,
    聲韻調: record.聲韻調 || '',
    特徵: record.特徵,
    值: record.值,
    說明: record.說明 || '',
    created_at: record.created_at
  }))

  showBatchEditModal.value = true
}

const closeBatchEditModal = () => {
  showBatchEditModal.value = false
  batchEditRows.value = []
}

const submitBatchEdit = async () => {
  const validRows = validBatchEditRows.value

  if (validRows.length === 0) {
    showWarning(t('user.dataPage.messages.invalidBatchData'))
    return
  }

  const confirmed = await showConfirm(
    t('user.dataPage.messages.batchEditConfirm', { count: validRows.length }),
    {
      title: t('user.dataPage.messages.batchEditTitle'),
      confirmText: t('common.button.confirm'),
      cancelText: t('common.button.cancel')
    }
  )

  if (!confirmed) return

  try {
    const deleteIds = batchEditRows.value.map((row) => row.created_at)
    await batchDeleteCustomData(deleteIds)

    const newData = validRows.map((row) => ({
      簡稱: row.簡稱,
      音典分區: row.音典分區,
      經緯度: row.經緯度,
      聲韻調: row.聲韻調,
      特徵: row.特徵,
      值: row.值,
      說明: row.說明,
      username: userStore.username
    }))

    await batchCreateCustomData(newData)
    markCustomDataExists(true)

    showSuccess(t('user.dataPage.messages.batchEditSuccess', { count: validRows.length }))
    closeBatchEditModal()
    selectedRecords.value = []
    await fetchData()
  } catch (error) {
    showError(t('user.dataPage.messages.batchEditFailed', { message: error.message }))
  }
}

const handleBatchDelete = async () => {
  if (selectedRecords.value.length === 0) {
    showWarning(t('user.dataPage.messages.selectForDelete'))
    return
  }

  const confirmed = await showConfirm(
    t('user.dataPage.messages.batchDeleteConfirm', { count: selectedRecords.value.length }),
    {
      title: t('user.dataPage.messages.batchDeleteTitle'),
      confirmText: t('common.button.delete'),
      cancelText: t('common.button.cancel')
    }
  )

  if (!confirmed) return

  try {
    const response = await batchDeleteCustomData(selectedRecords.value)
    invalidateCustomDataPresence()
    showSuccess(response.message || t('user.dataPage.messages.deleteSuccess'))
    selectedRecords.value = []
    await fetchData()
  } catch (error) {
    showError(t('user.dataPage.messages.deleteFailed', { message: error.message }))
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'

  const formattedStr = (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+') && !/-\d{2}:?\d{2}$/.test(dateStr))
    ? (dateStr.includes('T') ? dateStr + 'Z' : dateStr.replace(' ', 'T') + 'Z')
    : dateStr

  const currentLocale = locale.value === 'en' ? 'en-US' : locale.value
  return new Intl.DateTimeFormat(currentLocale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(formattedStr))
}

const goBack = () => {
  router.push(buildLocalePath(resolveRouteLocale(route), '/auth'))
}

onMounted(() => {
  if (!userStore.isAuthenticated) {
    showWarning(t('user.dataPage.messages.authRequired'))
    router.push(buildLocalePath(resolveRouteLocale(route), '/auth'))
    return
  }

  void parsedBatchData.value
  void fetchData()
})
</script>


$user-text: var(--text-deep);
$user-muted: var(--text-tertiary);
$user-border: rgba(var(--text-slate-light-rgb), 0.24);
$user-glass-border: var(--glass-60);
$user-accent: var(--color-primary);
$user-danger: var(--color-error-light);
$user-warning: var(--color-warning);
$user-success: var(--color-success);

@mixin glass-panel($radius: 24px, $padding: 18px) {
  position: relative;
  padding: $padding;
  border: 1px solid $user-glass-border;
  border-radius: $radius;
  background:
    linear-gradient(135deg, var(--glass-80), var(--glass-40)),
    linear-gradient(180deg, var(--glass-70), var(--glass-30));
  box-shadow:
    0 24px 70px rgba(var(--color-shadow-rgb), 0.12),
    0 8px 22px rgba(var(--color-shadow-rgb), 0.08),
    inset 0 1px 0 var(--glass-80),
    inset 0 -1px 0 var(--glass-30);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
}

@mixin control-glass {
  border: 1px solid var(--glass-60);
  background:
    linear-gradient(135deg, var(--glass-80), var(--glass-40)),
    var(--glass-60);
  box-shadow:
    inset 0 1px 0 var(--glass-80),
    0 8px 22px rgba(var(--color-shadow-rgb), 0.08);
  backdrop-filter: blur(18px) saturate(180%);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
}

@mixin liquid-button-base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 9px 16px;
  border: none;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease,
    opacity 0.18s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.985);
  }

  &:disabled {
    opacity: 0.48;
    cursor: not-allowed;
    box-shadow: none;
  }

  &:focus-visible {
    outline: none;
    box-shadow:
      0 0 0 3px rgba(var(--color-primary-rgb), 0.18),
      0 10px 26px rgba(var(--color-shadow-rgb), 0.12);
  }
}

.user-data-page {
  position: relative;
  isolation: isolate;
  box-sizing: border-box;
  width: 100%;
  min-height: 100%;
  padding: clamp(12px, 2vw, 22px);
  color: $user-text;

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  &::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: -2;
    pointer-events: none;
    background:
      radial-gradient(circle at 12% 8%, rgba(var(--color-primary-rgb), 0.16), transparent 30%),
      radial-gradient(circle at 82% 12%, rgba(88, 86, 214, 0.15), transparent 32%),
      radial-gradient(circle at 70% 86%, rgba(var(--color-success-rgb), 0.12), transparent 34%),
      linear-gradient(180deg, var(--bg-blue-tint) 0%, var(--bg-blue-light) 48%, var(--bg-light-gray) 100%);
  }

  &::after {
    content: '';
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background-image:
      linear-gradient(var(--glass-30) 1px, transparent 1px),
      linear-gradient(90deg, var(--glass-20) 1px, transparent 1px);
    background-size: 42px 42px;
    mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.32), transparent 72%);
  }
}

.liquid-panel {
  @include glass-panel;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.header-left {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 16px;

  h2 {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 10px;
    margin: 0;
    color: $user-text;
    font-size: clamp(20px, 2.4vw, 28px);
    font-weight: 800;
    letter-spacing: -0.04em;
  }
}

.title-icon {
  display: inline-flex;
  filter: drop-shadow(0 8px 18px rgba(var(--color-primary-rgb), 0.2));
}

.username-badge {
  display: inline-flex;
  align-items: center;
  max-width: 220px;
  padding: 5px 12px;
  border: 1px solid var(--glass-50);
  border-radius: var(--radius-pill);
  overflow: hidden;
  color: var(--text-white);
  font-size: 14px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
  background:
    linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.9), rgba(88, 86, 214, 0.86)),
    rgba(var(--color-primary-rgb), 0.72);
  box-shadow:
    inset 0 1px 0 var(--glass-40),
    0 10px 24px rgba(var(--color-primary-rgb), 0.24);
}

.stats {
  display: flex;
  align-items: center;
  gap: 10px;
  color: $user-muted;
  font-size: 14px;
  font-weight: 700;

  span {
    @include control-glass;

    display: inline-flex;
    align-items: center;
    min-height: 34px;
    padding: 7px 12px;
    border-radius: var(--radius-pill);
  }
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
}

.toolbar-left {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.toolbar-right {
  flex: 1;
  min-width: 220px;
  max-width: 420px;
}

.liquid-btn {
  @include liquid-button-base;
}

.btn-back,
.btn-secondary,
.btn-clear {
  @include control-glass;

  color: $user-text;

  &:hover:not(:disabled) {
    border-color: rgba(var(--color-primary-rgb), 0.28);
    background:
      linear-gradient(135deg, var(--glass-90), var(--glass-50)),
      rgba(var(--color-primary-rgb), 0.08);
  }
}

.btn-back:hover:not(:disabled) {
  transform: translateX(-2px);
}

.btn-primary {
  color: var(--text-white);
  background:
    linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.96), rgba(0, 81, 213, 0.92)),
    $user-accent;
  box-shadow:
    inset 0 1px 0 var(--glass-30),
    0 12px 28px rgba(var(--color-primary-rgb), 0.26);

  &:hover:not(:disabled) {
    box-shadow:
      inset 0 1px 0 var(--glass-30),
      0 16px 36px rgba(var(--color-primary-rgb), 0.34);
  }
}

.btn-warning {
  color: var(--text-white);
  background:
    linear-gradient(135deg, rgba(var(--color-warning-rgb), 0.96), rgba(255, 107, 0, 0.9)),
    $user-warning;
  box-shadow:
    inset 0 1px 0 var(--glass-30),
    0 12px 28px rgba(var(--color-warning-rgb), 0.22);
}

.btn-danger {
  color: var(--text-white);
  background:
    linear-gradient(135deg, rgba(var(--color-error-light-rgb), 0.96), rgba(var(--color-error-rgb), 0.92)),
    $user-danger;
  box-shadow:
    inset 0 1px 0 var(--glass-30),
    0 12px 28px rgba(var(--color-error-light-rgb), 0.22);
}

.btn-add-row {
  color: var(--text-white);
  background:
    linear-gradient(135deg, rgba(var(--color-success-rgb), 0.96), rgba(40, 167, 69, 0.9)),
    $user-success;
  box-shadow:
    inset 0 1px 0 var(--glass-30),
    0 12px 28px rgba(var(--color-success-rgb), 0.22);
}

.btn-edit {
  min-height: 30px;
  padding: 7px 12px;
  border-radius: 11px;
  color: var(--text-white);
  font-size: 12px;
  background:
    linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.96), rgba(0, 81, 213, 0.92)),
    $user-accent;
  box-shadow:
    inset 0 1px 0 var(--glass-30),
    0 8px 18px rgba(var(--color-primary-rgb), 0.24);
}

.liquid-input,
.form-group input,
.form-group textarea,
.batch-table input {
  width: 100%;
  border: 1px solid rgba(var(--text-slate-light-rgb), 0.28);
  color: $user-text;
  background:
    linear-gradient(135deg, var(--glass-80), var(--glass-50)),
    var(--glass-60);
  box-shadow:
    inset 0 1px 0 var(--glass-70),
    0 8px 18px rgba(var(--color-shadow-rgb), 0.04);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease;

  &::placeholder {
    color: var(--text-slate-light);
  }

  &:focus {
    outline: none;
    border-color: rgba(var(--color-primary-rgb), 0.56);
    background: var(--glass-90);
    box-shadow:
      0 0 0 4px rgba(var(--color-primary-rgb), 0.11),
      inset 0 1px 0 var(--glass-80);
  }
}

.search-input {
  height: 42px;
  padding: 10px 15px;
  border-radius: 15px;
  font-size: 14px;
}

.table-container {
  width: 100%;
  max-width: 100%;
  padding: 10px;
  overflow: auto;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 30;
  @include flex-center;
  border-radius: inherit;
  background: var(--glass-70);
  backdrop-filter: blur(18px) saturate(180%);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
}

.loading-content {
  @include glass-panel(20px, 18px 22px);

  @include flex-col;
  align-items: center;
  gap: 14px;
}

.loading-text {
  color: $user-accent;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.data-table {
  width: 100%;
  min-width: 1120px;
  border-collapse: separate;
  border-spacing: 0 8px;
  table-layout: auto;
  font-size: 13px;

  th,
  td {
    padding: 12px 13px;
    text-align: left;
    vertical-align: middle;
    white-space: nowrap;
  }

  th {
    position: sticky;
    top: 0;
    z-index: 10;
    color: var(--text-slate);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.02em;
    background:
      linear-gradient(135deg, var(--glass-90), rgba(241, 245, 249, 0.68)),
      var(--glass-80);
    backdrop-filter: blur(18px) saturate(180%);
    -webkit-backdrop-filter: blur(18px) saturate(180%);

    &:first-child {
      border-radius: 14px 0 0 14px;
    }

    &:last-child {
      border-radius: 0 14px 14px 0;
    }
  }

  tbody tr {
    transition:
      transform 0.16s ease,
      filter 0.16s ease;

    &:hover {
      transform: translateY(-1px);

      td {
        background: var(--glass-70);
        box-shadow:
          inset 0 1px 0 var(--glass-80),
          0 10px 24px rgba(var(--color-shadow-rgb), 0.08);
      }
    }
  }

  tbody td {
    color: var(--text-dark);
    background: var(--glass-50);
    border-top: 1px solid var(--glass-50);
    border-bottom: 1px solid rgba(var(--text-slate-light-rgb), 0.12);
    transition:
      background-color 0.16s ease,
      box-shadow 0.16s ease;

    &:first-child {
      border-left: 1px solid var(--glass-50);
      border-radius: 14px 0 0 14px;
    }

    &:last-child {
      border-right: 1px solid var(--glass-50);
      border-radius: 0 14px 14px 0;
    }
  }
}

.col-check {
  width: 44px;
  text-align: center;
}

.cell-note {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.table-empty-cell {
  padding: 42px 20px !important;
  color: var(--text-slate-light) !important;
  text-align: center !important;
  font-weight: 700;
  background: var(--glass-50) !important;
  border-radius: var(--radius-lg) !important;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 18px;
}

.pagination-info {
  color: $user-muted;
  font-size: 14px;
  font-weight: 700;
}

.pagination-controls,
.page-numbers,
.pagination-size {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-controls {
  flex-wrap: wrap;
  justify-content: center;
}

.pagination-size {
  color: $user-muted;
  font-size: 14px;
  font-weight: 700;
}

.btn-page {
  @include liquid-button-base;
  @include control-glass;

  min-width: 38px;
  min-height: 36px;
  padding: 8px 12px;
  color: var(--text-dark);
  font-size: 13px;

  &:hover:not(:disabled) {
    border-color: rgba(var(--color-primary-rgb), 0.38);
    color: $user-accent;
    background:
      linear-gradient(135deg, var(--glass-90), var(--glass-50)),
      rgba(var(--color-primary-rgb), 0.08);
  }

  &.active {
    color: var(--text-white);
    border-color: rgba(var(--color-primary-rgb), 0.45);
    background:
      linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.96), rgba(0, 81, 213, 0.92)),
      $user-accent;
    box-shadow:
      inset 0 1px 0 var(--glass-30),
      0 12px 24px rgba(var(--color-primary-rgb), 0.24);
  }
}

.hint {
  margin: 0 0 14px;
  padding: 10px 12px;
  border: 1px solid rgba(var(--color-primary-rgb), 0.12);
  border-radius: 14px;
  color: var(--text-slate);
  font-size: 13px;
  font-weight: 600;
  background: rgba(var(--color-primary-rgb), 0.06);
}

.batch-table-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.row-count {
  margin-left: auto;
  color: $user-muted;
  font-size: 14px;
  font-weight: 800;
}

.batch-table-wrapper {
  max-height: 500px;
  overflow: auto;
  border: 1px solid var(--glass-50);
  border-radius: 18px;
  background:
    linear-gradient(135deg, var(--glass-70), var(--glass-40)),
    var(--glass-50);
  box-shadow:
    inset 0 1px 0 var(--glass-70),
    0 16px 34px rgba(var(--color-shadow-rgb), 0.08);
}

.batch-table {
  width: 100%;
  min-width: 860px;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;

  thead {
    position: sticky;
    top: 0;
    z-index: 10;
  }

  th,
  td {
    padding: 9px 8px;
    border-bottom: 1px solid rgba(var(--text-slate-light-rgb), 0.14);
    text-align: left;
    white-space: nowrap;
  }

  th {
    color: var(--text-slate);
    font-weight: 800;
    background:
      linear-gradient(135deg, var(--glass-90), rgba(241, 245, 249, 0.76)),
      var(--glass-80);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
  }

  td {
    color: var(--text-dark);
    background: var(--glass-30);
  }

  tr:hover td {
    background: rgba(var(--color-primary-rgb), 0.045);
  }

  input {
    min-width: 0;
    height: 34px;
    padding: 7px 9px;
    border-radius: var(--radius-md);
    font-size: 13px;
  }

  .col-index {
    width: 52px;
  }

  .col-short-name {
    width: 110px;
  }

  .col-region,
  .col-coordinates,
  .col-feature {
    width: 130px;
  }

  .col-phonology,
  .col-value {
    width: 110px;
  }

  .col-note {
    width: 160px;
  }

  .col-action {
    width: 72px;
  }
}

.btn-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-white);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  background:
    linear-gradient(135deg, rgba(var(--color-error-light-rgb), 0.96), rgba(var(--color-error-rgb), 0.92)),
    $user-danger;
  box-shadow:
    inset 0 1px 0 var(--glass-20),
    0 8px 18px rgba(var(--color-error-light-rgb), 0.2);
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow:
      inset 0 1px 0 var(--glass-30),
      0 12px 24px rgba(var(--color-error-light-rgb), 0.26);
  }
}

.form-group {
  margin-bottom: 15px;

  label {
    display: block;
    margin-bottom: 7px;
    color: var(--text-dark);
    font-size: 13px;
    font-weight: 800;
  }

  input,
  textarea {
    padding: 10px 12px;
    border-radius: 13px;
    font-size: 14px;
  }

  textarea {
    min-height: 86px;
    resize: vertical;
  }
}

.user-data-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  width: 100%;
}

.preview {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid rgba(var(--color-primary-rgb), 0.14);
  border-radius: 14px;
  color: $user-accent;
  font-size: 14px;
  font-weight: 700;
  background: rgba(var(--color-primary-rgb), 0.07);
}

@media (max-width: 768px) {
  .user-data-page {
    padding: 12px;
  }

  .page-header {
    align-items: stretch;
    padding: 16px;
    gap: 12px;
    flex-direction: column;
  }

  .header-left {
    width: 100%;
    gap: 12px;
    flex-wrap: wrap;

    h2 {
      flex: 1;
      min-width: 200px;
      font-size: 18px;
    }
  }

  .username-badge {
    max-width: 160px;
    font-size: 13px;
  }

  .stats {
    width: 100%;
    justify-content: space-between;
    gap: 8px;

    span {
      flex: 1;
      justify-content: center;
      font-size: 13px;
    }
  }

  .toolbar {
    align-items: stretch;
    padding: 14px;
    flex-direction: column;
  }

  .toolbar-left {
    display: grid;
    width: 100%;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .toolbar-right {
    width: 100%;
    max-width: none;
    min-width: 0;
  }

  .liquid-btn {
    padding-inline: 10px;
    font-size: 13px;
  }

  .search-input {
    height: 42px;
    font-size: 16px;
  }

  .table-container {
    padding: 8px;
    border-radius: 18px;
  }

  .data-table {
    min-width: 940px;
    font-size: 12px;

    th,
    td {
      padding: 10px 9px;
      font-size: 12px;
    }
  }

  .pagination {
    align-items: stretch;
    flex-direction: column;
    padding: 14px;
  }

  .pagination-info,
  .pagination-size {
    justify-content: center;
    text-align: center;
    font-size: 13px;
  }

  .pagination-controls {
    justify-content: center;
  }

  .btn-page {
    min-width: 36px;
    padding: 7px 9px;
    font-size: 12px;
  }

  .user-data-modal-footer {
    flex-direction: column;

    button {
      width: 100%;
    }
  }

  .batch-table-controls {
    gap: 8px;
  }

  .row-count {
    width: 100%;
    margin-left: 0;
  }

  .batch-table-wrapper {
    max-height: 400px;
  }

  .batch-table {
    min-width: 780px;
    font-size: 12px;

    input {
      font-size: 12px;
    }
  }
}

@media (max-width: 480px) {
  .user-data-page {
    padding: 8px;
  }

  .page-header,
  .toolbar,
  .pagination {
    border-radius: var(--radius-lg);
  }

  .header-left {
    align-items: flex-start;

    h2 {
      width: 100%;
      min-width: 0;
      font-size: 16px;
    }
  }

  .btn-back {
    min-height: 34px;
    padding: 7px 11px;
    font-size: 12px;
  }

  .toolbar-left {
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .liquid-btn {
    min-height: 34px;
    padding: 7px 8px;
    font-size: 12px;
  }

  .data-table {
    min-width: 860px;

    th,
    td {
      padding: 8px 7px;
      font-size: 12px;
    }
  }

  .page-numbers {
    gap: 3px;
  }

  .btn-page {
    min-width: 34px;
    padding: 6px 8px;
  }

  .batch-table {
    min-width: 720px;
  }
}
