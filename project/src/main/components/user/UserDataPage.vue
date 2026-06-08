<template>
  <div style="width: 100%">
    <div class="page-header">
      <div class="header-left">
        <button class="btn-back" @click="goBack">{{ t('common.button.back') }}</button>
        <h2>
          📊 {{ t('user.dataPage.title') }}
          <span v-if="username" class="username-badge">{{ username }}</span>
        </h2>
      </div>
      <div class="stats">
        <span>{{ t('user.dataPage.stats.totalRows', { count: totalCount }) }}</span>
        <span>{{ t('user.dataPage.stats.selectedRows', { count: selectedRecords.length }) }}</span>
      </div>
    </div>

    <div class="toolbar">
      <div class="toolbar-left">
        <button class="btn-primary" @click="openBatchCreateModal">
          ➕ {{ t('user.dataPage.toolbar.batchAdd') }}
        </button>
        <button
          class="btn-warning"
          :disabled="selectedRecords.length === 0"
          @click="handleBatchEdit"
        >
          ✏️ {{ t('user.dataPage.toolbar.batchEdit') }}
        </button>
        <button
          class="btn-danger"
          :disabled="selectedRecords.length === 0"
          @click="handleBatchDelete"
        >
          🗑️ {{ t('user.dataPage.toolbar.batchDelete') }}
        </button>
        <button class="btn-secondary" @click="fetchData">
          🔄 {{ t('user.dataPage.toolbar.refresh') }}
        </button>
      </div>
      <div class="toolbar-right">
        <input
          v-model="searchQuery"
          class="search-input"
          :placeholder="t('user.dataPage.searchPlaceholder')"
          @input="handleSearch"
        />
      </div>
    </div>

    <div class="table-container">
      <div v-if="loading" class="loading-overlay">
        <div class="loading-content">
          <div class="ui-loading--page" aria-hidden="true"></div>
          <div class="loading-text">{{ t('common.label.loading') }}</div>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                :checked="isAllSelected"
                @change="toggleSelectAll"
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
            <td colspan="10" style="text-align: center; padding: 40px; color: #999;">
              {{
                searchQuery
                  ? t('user.dataPage.empty.noMatch')
                  : t('common.label.noData')
              }}
            </td>
          </tr>
          <tr v-for="record in paginatedData" :key="record.created_at">
            <td>
              <input
                v-model="selectedRecords"
                type="checkbox"
                :value="record.created_at"
              />
            </td>
            <td>{{ record.簡稱 }}</td>
            <td>{{ record.音典分區 }}</td>
            <td>{{ record.經緯度 }}</td>
            <td>{{ record.聲韻調 || '-' }}</td>
            <td>{{ record.特徵 }}</td>
            <td>{{ record.值 }}</td>
            <td>{{ record.說明 || '-' }}</td>
            <td>{{ formatDate(record.created_at) }}</td>
            <td>
              <button class="btn-edit" @click="openEditModal(record)">
                {{ t('common.button.edit') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="filteredData.length > 0" class="pagination">
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
        <button class="btn-page" :disabled="currentPage === 1" @click="goToPage(1)">
          {{ t('user.dataPage.pagination.first') }}
        </button>
        <button class="btn-page" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
          {{ t('user.dataPage.pagination.previous') }}
        </button>
        <div class="page-numbers">
          <button
            v-for="page in visiblePages"
            :key="page"
            :class="['btn-page', { active: page === currentPage }]"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </div>
        <button class="btn-page" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">
          {{ t('user.dataPage.pagination.next') }}
        </button>
        <button class="btn-page" :disabled="currentPage === totalPages" @click="goToPage(totalPages)">
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
      <div class="batch-table-wrapper">
        <table class="batch-table">
          <thead>
            <tr>
              <th style="width: 50px">#</th>
              <th style="width: 100px">{{ t('user.dataPage.table.shortNameRequired') }}</th>
              <th style="width: 120px">{{ t('user.dataPage.table.regionRequired') }}</th>
              <th style="width: 120px">{{ t('user.dataPage.table.coordinatesRequired') }}</th>
              <th style="width: 100px">{{ t('user.dataPage.table.phonology') }}</th>
              <th style="width: 120px">{{ t('user.dataPage.table.featureRequired') }}</th>
              <th style="width: 100px">{{ t('user.dataPage.table.valueRequired') }}</th>
              <th style="width: 150px">{{ t('user.dataPage.table.note') }}</th>
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
<!--        <div class="user-data-modal-footer">-->
          <button class="btn-primary" :disabled="validBatchEditRows.length === 0" @click="submitBatchEdit">
            {{ t('user.dataPage.batchEdit.save', { count: validBatchEditRows.length }) }}
          </button>
          <button class="btn-secondary" @click="closeBatchEditModal">
            {{ t('common.button.cancel') }}
          </button>
<!--        </div>-->
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
        <button class="btn-add-row" @click="addBatchRow">
          ➕ {{ t('user.dataPage.batchCreate.addRow') }}
        </button>
        <button class="btn-clear" @click="clearBatchRows">
          🗑️ {{ t('user.dataPage.batchCreate.clear') }}
        </button>
        <span class="row-count">
          {{ t('user.dataPage.batchCreate.currentRows', { count: batchRows.length }) }}
        </span>
      </div>
      <div class="batch-table-wrapper" @paste="handlePaste">
        <table class="batch-table">
          <thead>
            <tr>
              <th style="width: 50px">#</th>
              <th style="width: 100px">{{ t('user.dataPage.table.shortNameRequired') }}</th>
              <th style="width: 120px">{{ t('user.dataPage.table.regionRequired') }}</th>
              <th style="width: 120px">{{ t('user.dataPage.table.coordinatesRequired') }}</th>
              <th style="width: 100px">{{ t('user.dataPage.table.phonology') }}</th>
              <th style="width: 120px">{{ t('user.dataPage.table.featureRequired') }}</th>
              <th style="width: 100px">{{ t('user.dataPage.table.valueRequired') }}</th>
              <th style="width: 150px">{{ t('user.dataPage.table.note') }}</th>
              <th style="width: 60px">{{ t('user.dataPage.table.actions') }}</th>
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
                <button class="btn-remove" @click="removeBatchRow(index)">×</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <template #footer>
<!--        <div class="user-data-modal-footer">-->
          <button class="btn-primary" :disabled="validBatchRows.length === 0" @click="submitBatchCreate">
            {{ t('user.dataPage.batchCreate.submit', { count: validBatchRows.length }) }}
          </button>
          <button class="btn-secondary" @click="closeBatchCreateModal">
            {{ t('common.button.cancel') }}
          </button>
<!--        </div>-->
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
<!--        <div class="user-data-modal-footer">-->
          <button class="btn-primary" @click="submitEdit">
            {{ t('common.button.save') }}
          </button>
          <button class="btn-secondary" @click="closeEditModal">
            {{ t('common.button.cancel') }}
          </button>
<!--        </div>-->
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AppModal from '@/components/common/AppModal.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import { batchCreateCustomData, batchDeleteCustomData, editCustomData, getAllCustomData } from '@/api'
import { useAsyncData } from '@/composables/core/useAsyncData.js'
import { userStore } from '@/main/store/store.js'
import { showConfirm, showError, showSuccess, showWarning } from '@/utils/message.js'

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
      setTimeout(() => router.replace('/auth'), 1500)
    }
    }
  })
}

const toggleSelectAll = (event) => {
  if (event.target.checked) {
    selectedRecords.value = paginatedData.value.map((record) => record.created_at)
  } else {
    selectedRecords.value = []
  }
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
  router.push('/auth')
}

onMounted(() => {
  if (!userStore.isAuthenticated) {
    showWarning(t('user.dataPage.messages.authRequired'))
    router.push('/auth')
    return
  }

  void parsedBatchData.value
  fetchData()
})
</script>

<style scoped>
/* Apple liquid glass styling */


.page-header {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 18px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-back {
  padding: 8px 16px;
  background: rgba(142, 142, 147, 0.2);
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-back:hover {
  background: rgba(142, 142, 147, 0.3);
  transform: translateX(-2px);
}

.page-header h2 {
  margin: 0;
  font-size: 28px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 12px;
  justify-self: center;
}

.username-badge {
  font-size: 16px;
  padding: 4px 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 12px;
  font-weight: 600;
}

.stats {
  display: flex;
  gap: 20px;
  font-size: 16px;
  color: #666;
}

.toolbar {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 18px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
}

.toolbar-left {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-right {
  flex: 1;
  max-width: 400px;
  min-width: 200px;
}

.search-input {
  padding: 10px 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.toolbar button,
.user-data-modal-footer button {
  padding: 10px 20px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.toolbar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #007aff, #0051d5);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.btn-warning {
  background: linear-gradient(135deg, #ff9500, #ff6b00);
  color: white;
}

.btn-danger {
  background: linear-gradient(135deg, #ff3b30, #d32f2f);
  color: white;
}

.btn-secondary {
  background: rgba(142, 142, 147, 0.2);
  color: #333;
}

.table-container {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  /* 关键：确保横向滚动 */
  overflow-x: auto;
  overflow-y: visible;
  width: 97%;
  position: relative; /* 为 loading overlay 提供定位上下文 */
}

/* Loading overlay styles */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  border-radius: 18px;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}



.loading-text {
  font-size: 16px;
  font-weight: 600;
  color: #007aff;
  letter-spacing: 0.5px;
}

.data-table {
  width: 100%;
  min-width: 600px; /* 确保表格有最小宽度 */
  border-collapse: collapse;
  table-layout: auto;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  white-space: nowrap; /* 防止内容换行 */
}

.data-table th {
  background: rgba(0, 122, 255, 0.1);
  font-weight: 600;
  color: #333;
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table tr:hover {
  background: rgba(0, 122, 255, 0.05);
}

.btn-edit {
  padding: 6px 12px;
  background: linear-gradient(135deg, #007aff, #0051d5);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
}

/* Modal styles */
.user-data-modal-footer {
  padding: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.batch-textarea {
  width: 100%;
  min-height: 300px;
  padding: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  font-family: monospace;
  font-size: 13px;
  resize: vertical;
  background: rgba(255, 255, 255, 0.5);
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.5);
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.hint {
  color: #666;
  font-size: 13px;
  margin-bottom: 12px;
}

.preview {
  margin-top: 12px;
  padding: 12px;
  background: rgba(0, 122, 255, 0.1);
  border-radius: 8px;
  font-size: 14px;
  color: #007aff;
}

/* Batch table styles */
.batch-table-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.btn-add-row,
.btn-clear {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add-row {
  background: linear-gradient(135deg, #34c759, #28a745);
  color: white;
}

.btn-add-row:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(52, 199, 89, 0.3);
}

.btn-clear {
  background: rgba(142, 142, 147, 0.2);
  color: #333;
}

.row-count {
  margin-left: auto;
  font-size: 14px;
  color: #666;
  font-weight: 600;
}

.batch-table-wrapper {
  max-height: 500px;
  overflow: auto;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  background: white;
}

.batch-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.batch-table thead {
  position: sticky;
  top: 0;
  background: rgba(0, 122, 255, 0.1);
  z-index: 10;
}

.batch-table th {
  padding: 10px 8px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid rgba(0, 0, 0, 0.1);
  white-space: nowrap;
}

.batch-table td {
  padding: 6px 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.batch-table input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.8);
}

.batch-table input:focus {
  outline: none;
  border-color: #007aff;
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.1);
}

.batch-table tr:hover {
  background: rgba(0, 122, 255, 0.03);
}

.btn-remove {
  padding: 4px 8px;
  background: linear-gradient(135deg, #ff3b30, #d32f2f);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.btn-remove:hover {
  background: linear-gradient(135deg, #d32f2f, #b71c1c);
}

/* Pagination styles */
.pagination {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 18px;
  padding: 16px;
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.pagination-info {
  font-size: 14px;
  color: #666;
  font-weight: 600;
}

.pagination-controls {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.btn-page {
  padding: 8px 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.8);
  color: #333;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-page:hover:not(:disabled) {
  background: rgba(0, 122, 255, 0.1);
  border-color: #007aff;
  color: #007aff;
}

.btn-page.active {
  background: linear-gradient(135deg, #007aff, #0051d5);
  color: white;
  border-color: #007aff;
}

.btn-page:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-size {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.pagination-size select {
  padding: 8px 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  cursor: pointer;
}

/* Mobile optimization */
@media (max-width: 768px) {
  .user-data-page {
    padding: 12px;
  }

  .page-header {
    padding: 16px;
    flex-direction: column;
    align-items: stretch;
    gap:5px;
  }

  .header-left {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    width: 100%;
  }

  .btn-back {
    padding: 8px 12px;
    font-size: 13px;
  }

  .header-left h2 {
    font-size: 18px;
    flex: 1;
    min-width: 200px;
  }

  .username-badge {
    font-size: 13px;
    padding: 3px 10px;
  }

  .stats {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    font-size: 14px;
  }

  .toolbar {
    padding: 12px;
  }

  .toolbar-left {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .toolbar-left button {
    padding: 10px 8px;
    font-size: 13px;
    white-space: nowrap;
  }

  .toolbar-right {
    max-width: 100%;
    width: 100%;
    margin-top: 8px;
  }

  .search-input {
    font-size: 16px;
  }

  /* 表格容器 - 关键优化 */
  .table-container {
    padding: 12px;
    border-radius: 12px;
    /* 确保可以横向滚动 */
    overflow-x: scroll;
    overflow-y: visible;
  }

  .data-table {
    min-width: 900px;
    font-size: 13px;
  }

  .data-table th,
  .data-table td {
    padding: 10px 8px;
    font-size: 13px;
  }

  .btn-edit {
    padding: 6px 10px;
    font-size: 12px;
  }

  .pagination {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 12px;
  }

  .pagination-info {
    text-align: center;
    font-size: 13px;
  }

  .pagination-controls {
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn-page {
    padding: 8px 10px;
    font-size: 13px;
    min-width: 40px;
  }

  .page-numbers {
    gap: 4px;
  }

  .pagination-size {
    justify-content: center;
    font-size: 13px;
  }

  .pagination-size select {
    padding: 8px 12px;
    font-size: 13px;
  }

  .user-data-modal-footer {
    padding: 16px;
    flex-direction: column;
  }

  .user-data-modal-footer button {
    width: 100%;
  }

  .batch-table-wrapper {
    max-height: 400px;
    overflow: auto;
  }

  .batch-table {
    font-size: 12px;
    min-width: 600px;
  }

  .batch-table input {
    font-size: 12px;
    padding: 6px 8px;
  }

  .batch-table-controls {
    flex-wrap: wrap;
    gap: 8px;
  }

  .btn-add-row,
  .btn-clear {
    padding: 8px 12px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .user-data-page {
    padding: 8px;
  }

  .page-header {
    padding: 12px;
    gap:5px;
  }

  .header-left {
    align-items: flex-start;
  }

  .header-left h2 {
    font-size: 16px;
    width: 100%;
  }

  .btn-back {
    padding: 6px 10px;
    font-size: 12px;
  }

  .stats {
    font-size: 13px;
    gap: 6px;
  }

  .toolbar {
    padding: 10px;
  }

  .toolbar-left {
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .toolbar-left button {
    padding: 6px 10px;
    font-size: 12px;
  }

  .table-container {
    padding: 10px;
  }

  .data-table {
    min-width: 800px;
  }

  .data-table th,
  .data-table td {
    padding: 8px 6px;
    font-size: 12px;
  }

  .btn-page {
    padding: 6px 8px;
    font-size: 12px;
    min-width: 36px;
  }

  .page-numbers {
    gap: 2px;
  }

  .batch-table {
    min-width: 600px;
  }
}

</style>
