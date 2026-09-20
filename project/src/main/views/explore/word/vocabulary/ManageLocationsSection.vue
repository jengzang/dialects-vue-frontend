<template>
  <section class="content-area">
    <div class="locations-mode glass-panel">
      <div class="top-controls">
        <div class="locations-head">
          <div>
            <h3>{{ t('words.wordList.locations.title') }}</h3>
            <p>{{ t('words.wordList.locations.desc') }}</p>
          </div>
        </div>

        <form
          v-if="canShowLocationFilters"
          class="manage-filter-grid locations-filter-grid"
          @submit.prevent="applyLocationFilters"
        >
          <label class="upload-field">
            <span>{{ t('words.wordList.locations.filters.userName') }}</span>
            <input v-model="locationFilters.username" type="text" :placeholder="t('words.wordList.locations.filters.userName')" />
          </label>
          <label class="upload-field">
            <span>{{ t('words.wordList.locations.filters.locationName') }}</span>
            <input v-model="locationFilters.location_name" type="text" :placeholder="t('words.wordList.locations.filters.locationName')" />
          </label>
          <div class="filter-actions">
            <button class="glass-button" data-variant="primary" type="submit">
              {{ t('common.button.search') }}
            </button>
            <button class="glass-button" data-variant="secondary" type="button" @click="resetLocationFilters">
              {{ t('common.button.reset') }}
            </button>
          </div>
        </form>
      </div>

      <div v-if="locationsLoadError" class="empty-state empty-state-base">
        <p>{{ locationsLoadError }}</p>
      </div>

      <div v-else-if="isLoadingLocations" class="loading-state loading-state-base">
        <div class="ui-loading--page" aria-hidden="true"></div>
        <span>{{ t('words.wordList.states.loadingData') }}</span>
      </div>

      <div v-else-if="locationRows.length" class="locations-list">
        <article v-for="location in locationRows" :key="`${location.username || location.user_id || ''}-${location.location_name}`" class="location-item">
          <div class="location-item-head">
            <div class="location-item-info">
              <strong>{{ location.location_name }}</strong>
              <p>{{ location.location_label || location.location_name }}</p>
              <span class="location-item-username">{{ location.username }}</span>
            </div>
            <button class="glass-button" data-variant="primary" type="button" @click="openLocationEditor(location)">
              {{ t('common.button.edit') }}
            </button>
            <button
              v-if="hasVocabularyPermission"
              class="glass-button"
              data-variant="success"
              type="button"
              :disabled="isExportingLocation"
              @click="handleExportLocation(location)"
            >
              {{ t('words.wordList.locations.export') }}
            </button>
            <button v-if="canDeleteLocation" class="glass-button" data-variant="danger" type="button" @click="handleDeleteLocation(location)">
              {{ t('common.button.delete') }}
            </button>
            <button
              v-if="canDeleteLocation"
              class="glass-button"
              style="background-color: var(--color-primary-light);"
              data-variant="secondary"
              type="button"
              @click="openTransferModal(location)"
            >
              {{ t('words.wordList.locations.transfer.action') }}
            </button>
          </div>
        </article>
      </div>
      <div v-else class="empty-state empty-state-base">
        <p>{{ t('words.wordList.locations.empty') }}</p>
      </div>
      <div class="pagination-row">
        <span>{{ t('words.wordList.pagination.total', { count: locationPagination.total }) }}</span>
        <span>{{ t('words.wordList.pagination.page', { page: locationPagination.page }) }}</span>
        <label class="page-size-select">
          <span>{{ t('words.wordList.pagination.pageSize') }}</span>
          <select v-model.number="locationPagination.pageSize" @change="applyLocationFilters">
            <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
          </select>
        </label>
        <span class="pagination-nav-group">
          <button class="glass-button" data-variant="secondary" type="button" :disabled="!canGoPreviousLocationPage" @click="goToLocationPage(-1)">
            {{ t('words.wordList.pagination.previous') }}
          </button>
          <button class="glass-button" data-variant="secondary" type="button" :disabled="!canGoNextLocationPage" @click="goToLocationPage(1)">
            {{ t('words.wordList.pagination.next') }}
          </button>
        </span>
      </div>
      <p v-if="locationsStatusText" class="upload-status">{{ locationsStatusText }}</p>
    </div>
  </section>

  <LocationEditorModal
    v-model="isLocationEditorOpen"
    v-model:draft="editingLocationDraft"
    width="720px"
    max-height="80dvh"
    :title="editingLocationDraft?.location_name || t('words.wordList.locations.title')"
    :description="editingLocationDraft?.location_label || editingLocationDraft?.location_name"
    :close-label="t('common.button.close')"
    :fields="locationEditFields"
    :cancel-text="t('common.button.cancel')"
    :confirm-text="t('words.wordList.locations.save')"
    @close="closeLocationEditor"
    @cancel="closeLocationEditor"
    @confirm="handleSaveEditingLocation"
  />

  <AppModal
    v-model="isTransferModalOpen"
    size="sm"
    width="420px"
    max-height="70dvh"
    :title="transferModalTitle"
    :close-label="t('common.button.close')"
    @close="closeTransferModal"
  >
    <div
      v-if="transferLocationSource"
      class="location-transfer-modal"
    >
      <p class="location-edit-modal-desc">
        {{ t('words.wordList.locations.transfer.desc', { user: transferSourceLabel }) }}
      </p>
      <label class="upload-field">
        <span>{{ t('words.wordList.locations.transfer.targetUserid') }}</span>
        <input
          v-model="transferTargetUserId"
          type="text"
          :placeholder="t('words.wordList.locations.transfer.IDplaceholder')"
          autocomplete="off"
          @keydown.enter.prevent="handleConfirmTransferLocation"
        >
      </label>
      <label class="upload-field">
        <span>{{ t('words.wordList.locations.transfer.targetUsername') }}</span>
        <input
          v-model="transferTargetUsername"
          type="text"
          :placeholder="t('words.wordList.locations.transfer.NAMEplaceholder')"
          autocomplete="off"
          @keydown.enter.prevent="handleConfirmTransferLocation"
        >
      </label>
      <p
        v-if="transferErrorText"
        class="upload-status"
      >
        {{ transferErrorText }}
      </p>
    </div>

    <template #footer>
      <div class="location-edit-modal-actions">
        <button
          class="glass-button"
          data-variant="secondary"
          type="button"
          @click="closeTransferModal"
        >
          {{ t('common.button.cancel') }}
        </button>
        <button
          class="glass-button"
          data-variant="primary"
          type="button"
          :disabled="isTransferringLocation || (!transferTargetUserId.trim() && !transferTargetUsername.trim())"
          @click="handleConfirmTransferLocation"
        >
          {{ isTransferringLocation ? t('common.label.loading') : t('common.button.confirm') }}
        </button>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { deleteVocabularyLocation, exportVocabularyLocation, getVocabularyLocations, transferVocabularyLocation, updateVocabularyLocation } from '@/api'
import AppModal from '@/components/common/AppModal.vue'
import LocationEditorModal from './LocationEditorModal.vue'
import { LOCATION_BASE_FIELDS, TONE_FIELDS } from './vocabularyLocationFields.js'
import { showConfirm, showError, showSuccess } from '@/utils/ui/message.js'

const { t } = useI18n()
const pageSizeOptions = [20, 50, 100, 200]

const props = defineProps({
  hasVocabularyPermission: { type: Boolean, default: false },
  canViewVocabularyLogs: { type: Boolean, default: false },
  canDeleteLocation: { type: Boolean, default: false },
  managePermissionLevel: { type: String, default: null },
})

const isLoadingLocations = ref(false)
const locationsLoadError = ref('')
const locationsStatusText = ref('')
const locationRows = ref([])
const isLocationEditorOpen = ref(false)
const editingLocationSource = ref(null)
const editingLocationDraft = ref(null)
const isTransferModalOpen = ref(false)
const transferLocationSource = ref(null)
const transferTargetUserId = ref('')
const transferTargetUsername = ref('')
const transferErrorText = ref('')
const isTransferringLocation = ref(false)
const isExportingLocation = ref(false)
const locationFilters = reactive({
  username: '',
  location_name: '',
})
const locationPagination = reactive({
  page: 1,
  pageSize: 50,
  total: 0,
})

const canGoPreviousLocationPage = computed(() => locationPagination.page > 1)
const canGoNextLocationPage = computed(() => locationPagination.page * locationPagination.pageSize < locationPagination.total)
const canShowLocationFilters = computed(() => props.managePermissionLevel === 'manage')
const transferModalTitle = computed(() => {
  const locationName = transferLocationSource.value?.location_name
  return locationName
    ? t('words.wordList.locations.transfer.title', { name: locationName })
    : t('words.wordList.locations.transfer.action')
})
const transferSourceLabel = computed(() => (
  transferLocationSource.value?.username
  || transferLocationSource.value?.user_id
  || t('words.wordList.locations.transfer.unknownUser')
))

const locationEditFields = computed(() => [
  ...LOCATION_BASE_FIELDS.map((field) => ({ key: field.key, label: t(field.labelKey) })),
  ...TONE_FIELDS.map((field) => ({ key: field.key, label: t(field.labelKey) })),
])

function appendFilledFilters(target, filters) {
  Object.entries(filters).forEach(([key, value]) => {
    const normalized = String(value || '').trim()
    if (normalized) {
      target[key] = normalized
    }
  })
  return target
}

function buildLocationQueryParams(overrides = {}) {
  return appendFilledFilters({
    page: locationPagination.page,
    page_size: locationPagination.pageSize,
    ...overrides,
  }, locationFilters)
}

async function loadVocabularyLocations() {
  isLoadingLocations.value = true
  locationsLoadError.value = ''

  try {
    const params = buildLocationQueryParams()
    const response = await getVocabularyLocations(params)
    locationRows.value = Array.isArray(response.locations)
      ? response.locations.map((location) => ({ ...location }))
      : []
    locationPagination.total = Number(response.total) || locationRows.value.length
    locationPagination.page = Number(response.page) || params.page
    locationPagination.pageSize = Number(response.page_size) || params.page_size
  } catch (error) {
    locationsLoadError.value = error.message || t('words.wordList.locations.loadFailed')
    showError(locationsLoadError.value)
    locationRows.value = []
    locationPagination.total = 0
  } finally {
    isLoadingLocations.value = false
  }
}

function applyLocationFilters() {
  locationPagination.page = 1
  return loadVocabularyLocations()
}

function resetLocationFilters() {
  locationFilters.username = ''
  locationFilters.location_name = ''
  return applyLocationFilters()
}

function goToLocationPage(delta) {
  const nextPage = locationPagination.page + delta
  if (nextPage < 1) {
    return
  }
  if (delta > 0 && !canGoNextLocationPage.value) {
    return
  }
  locationPagination.page = nextPage
  loadVocabularyLocations()
}

function openLocationEditor(location) {
  editingLocationSource.value = location
  editingLocationDraft.value = location ? { ...location } : null
  locationsStatusText.value = ''
  isLocationEditorOpen.value = Boolean(location)
}

function closeLocationEditor() {
  isLocationEditorOpen.value = false
  editingLocationSource.value = null
  editingLocationDraft.value = null
}

function openTransferModal(location) {
  transferLocationSource.value = location
  transferTargetUserId.value = ''
  transferTargetUsername.value = ''
  transferErrorText.value = ''
  locationsStatusText.value = ''
  isTransferModalOpen.value = Boolean(location)
}

function closeTransferModal() {
  if (isTransferringLocation.value) return
  isTransferModalOpen.value = false
  transferLocationSource.value = null
  transferTargetUserId.value = ''
  transferTargetUsername.value = ''
  transferErrorText.value = ''
}

async function handleSaveLocation(location, originalLocationName) {
  const sourceName = String(originalLocationName || '').trim()
  if (!location || !sourceName) {
    return
  }

  const nextName = String(location.location_name || '').trim()
  if (!nextName) {
    locationsStatusText.value = t('words.wordList.locations.renameEmpty')
    showError(locationsStatusText.value)
    return
  }

  const payload = Object.fromEntries(
    locationEditFields.value
      .filter((field) => field.key !== 'location_name')
      .map((field) => [field.key, String(location[field.key] || '').trim()])
  )
  if (nextName !== sourceName) {
    payload.new_location_name = nextName
  }
  const params = location.user_id ? { user_id: location.user_id } : {}
  locationsStatusText.value = ''

  try {
    await updateVocabularyLocation(sourceName, payload, params)
    locationsStatusText.value = t('words.wordList.locations.saveSuccess')
    showSuccess(locationsStatusText.value)
    await loadVocabularyLocations()
    closeLocationEditor()
  } catch (error) {
    locationsStatusText.value = error.message || t('words.wordList.locations.saveFailed')
    showError(locationsStatusText.value)
  }
}

async function handleConfirmTransferLocation() {
  const targetUserId = transferTargetUserId.value.trim()
  const targetUsername = transferTargetUsername.value.trim()

  if (
    !transferLocationSource.value
    || (!targetUserId && !targetUsername)
    || isTransferringLocation.value
  ) return

  transferErrorText.value = ''
  locationsStatusText.value = ''
  isTransferringLocation.value = true

  try {
    const result = await transferVocabularyLocation(
      {
        location_name: transferLocationSource.value.location_name,
        user_id: transferLocationSource.value.user_id,
      },
      {
        target_user_id: targetUserId,
        target_username: targetUsername,
      },
    )
    locationsStatusText.value = t('words.wordList.locations.transfer.success', {
      name: result.location_name || transferLocationSource.value.location_name,
      user: result.target_username || result.target_user_id || targetUsername || targetUserId,
      count: result.transferred_entries_count ?? 0,
    })
    showSuccess(locationsStatusText.value)
    await loadVocabularyLocations()
    isTransferModalOpen.value = false
    transferLocationSource.value = null
    transferTargetUserId.value = ''
    transferTargetUsername.value = ''
  } catch (error) {
    transferErrorText.value = error.message || t('words.wordList.locations.transfer.failed')
    locationsStatusText.value = transferErrorText.value
    showError(transferErrorText.value)
  } finally {
    isTransferringLocation.value = false
  }
}

function handleSaveEditingLocation() {
  return handleSaveLocation(
    editingLocationDraft.value || editingLocationSource.value,
    editingLocationSource.value?.location_name,
  )
}

function triggerBlobDownload(blob, fileName) {
  const url = URL.createObjectURL(blob)
  try {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function handleExportLocation(location) {
  if (!location?.location_name || isExportingLocation.value) return

  isExportingLocation.value = true
  locationsStatusText.value = ''
  try {
    const params = location.user_id ? { user_id: location.user_id } : {}
    const blob = await exportVocabularyLocation(location.location_name, params)
    triggerBlobDownload(blob, `${location.location_name}词表.xlsx`)
    locationsStatusText.value = t('words.wordList.locations.exportSuccess', { name: location.location_name })
    showSuccess(locationsStatusText.value)
  } catch (error) {
    locationsStatusText.value = error.message || t('words.wordList.locations.exportFailed')
    showError(locationsStatusText.value)
  } finally {
    isExportingLocation.value = false
  }
}

async function handleDeleteLocation(location) {
  if (!location?.location_name) return

  const confirmed = await showConfirm(
    t('words.wordList.locations.deleteConfirm', { name: location.location_name }),
    { confirmText: t('common.button.delete'), cancelText: t('common.button.cancel') },
  )
  if (!confirmed) return

  locationsStatusText.value = ''
  try {
    const params =  {}
    const result = await deleteVocabularyLocation(location.location_name, params)
    locationsStatusText.value = t('words.wordList.locations.deleteSuccess', { count: result.deleted_entries })
    showSuccess(locationsStatusText.value)
    await loadVocabularyLocations()
  } catch (error) {
    locationsStatusText.value = error.message || t('words.wordList.locations.deleteFailed')
    showError(locationsStatusText.value)
  }
}

watch(() => props.hasVocabularyPermission, (has) => {
  if (has) loadVocabularyLocations()
}, { immediate: true })
</script>

<script>
export default {
  name: 'ManageLocationsSection'
}
</script>

<style scoped lang="scss" src="./vocabulary.scss"></style>
