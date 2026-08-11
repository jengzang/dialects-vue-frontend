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

        <form class="manage-filter-grid locations-filter-grid" @submit.prevent="applyLocationFilters">
          <label class="upload-field">
            <span>{{ t('words.wordList.locations.filters.userName') }}</span>
            <input v-model="locationFilters.username" type="text" :placeholder="t('words.wordList.locations.filters.userName')" />
          </label>
          <label class="upload-field">
            <span>{{ t('words.wordList.locations.filters.locationName') }}</span>
            <input v-model="locationFilters.location_name" type="text" :placeholder="t('words.wordList.locations.filters.locationName')" />
          </label>
          <div class="filter-actions">
            <button class="main-glass-button" data-variant="primary" type="submit">
              {{ t('common.button.search') }}
            </button>
            <button class="main-glass-button" data-variant="secondary" type="button" @click="resetLocationFilters">
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
            </div>
            <span class="location-item-username">{{ location.username }}</span>
            <button class="main-glass-button" data-variant="primary" type="button" @click="openLocationEditor(location)">
              {{ t('common.button.edit') }}
            </button>
            <button v-if="canDeleteLocation" class="main-glass-button" data-variant="danger" type="button" @click="handleDeleteLocation(location)">
              {{ t('common.button.delete') }}
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
          <button class="main-glass-button" data-variant="secondary" type="button" :disabled="!canGoPreviousLocationPage" @click="goToLocationPage(-1)">
            {{ t('words.wordList.pagination.previous') }}
          </button>
          <button class="main-glass-button" data-variant="secondary" type="button" :disabled="!canGoNextLocationPage" @click="goToLocationPage(1)">
            {{ t('words.wordList.pagination.next') }}
          </button>
        </span>
      </div>
      <p v-if="locationsStatusText" class="upload-status">{{ locationsStatusText }}</p>
    </div>
  </section>

  <AppModal
    v-model="isLocationEditorOpen"
    size="lg"
    width="720px"
    max-height="80dvh"
    :title="editingLocationDraft?.location_name || t('words.wordList.locations.title')"
    :close-label="t('common.button.close')"
    @close="closeLocationEditor"
  >
    <div v-if="editingLocationDraft" class="location-edit-modal">
      <p class="location-edit-modal-desc">
        {{ editingLocationDraft.location_label || editingLocationDraft.location_name }}
      </p>

      <div class="yindian-match-section">
        <h4 class="yindian-match-title">{{ t('words.wordList.upload.useYindianData') }}</h4>
        <div class="yindian-match-row">
          <div class="yindian-input-wrapper">
            <input
              v-model="yindianQuery"
              type="text"
              :placeholder="t('words.wordList.upload.yindianHint')"
              autocomplete="off"
              @input="onYindianInput"
              @keydown.enter.prevent="confirmYindianQuery"
              @blur="onYindianBlur"
            />
            <div v-if="yindianSuggestions.length" class="yindian-suggestions">
              <div
                v-for="item in yindianSuggestions"
                :key="item"
                class="yindian-suggest-item"
                @mousedown.prevent="applyYindianSuggestion(item)"
              >
                {{ item }}
              </div>
            </div>
          </div>
          <button
            class="main-glass-button"
            data-variant="primary"
            type="button"
            :disabled="!yindianQuery.trim() || isLoadingYindian"
            @click="confirmYindianQuery"
          >
            {{ isLoadingYindian ? t('common.label.loading') : t('common.button.confirm') }}
          </button>
        </div>
      </div>

      <div class="locations-edit-grid">
        <label v-for="field in locationEditFields" :key="field.key" class="upload-field">
          <span>{{ field.label }}</span>
          <input v-model="editingLocationDraft[field.key]" type="text" />
        </label>
      </div>
    </div>

    <template #footer>
      <div class="location-edit-modal-actions">
        <button class="main-glass-button" data-variant="secondary" type="button" @click="closeLocationEditor">
          {{ t('common.button.cancel') }}
        </button>
        <button class="main-glass-button" data-variant="primary" type="button" @click="handleSaveEditingLocation">
          {{ t('words.wordList.locations.save') }}
        </button>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { batchMatch, deleteVocabularyLocation, getLocationDetail, getVocabularyLocations, updateVocabularyLocation } from '@/api'
import AppModal from '@/components/common/AppModal.vue'
import { showConfirm, showError, showSuccess, showWarning } from '@/utils/ui/message.js'

const { t } = useI18n()
const pageSizeOptions = [20, 50, 100, 200]

const props = defineProps({
  hasVocabularyPermission: { type: Boolean, default: false },
  canViewVocabularyLogs: { type: Boolean, default: false },
  canDeleteLocation: { type: Boolean, default: false },
})

const isLoadingLocations = ref(false)
const locationsLoadError = ref('')
const locationsStatusText = ref('')
const locationRows = ref([])
const isLocationEditorOpen = ref(false)
const editingLocationSource = ref(null)
const editingLocationDraft = ref(null)
const yindianQuery = ref('')
const yindianSuggestions = ref([])
const isLoadingYindian = ref(false)
let yindianDebounceTimer = null
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

const locationEditFields = computed(() => [
  { key: 'coordinates', label: t('words.wordList.upload.coordinates') },
  { key: 'province', label: t('words.wordList.upload.province') },
  { key: 'city', label: t('words.wordList.upload.city') },
  { key: 'county', label: t('words.wordList.upload.county') },
  { key: 'town', label: t('words.wordList.upload.town') },
  { key: 'administrative_village', label: t('words.wordList.upload.administrativeVillage') },
  { key: 'natural_village', label: t('words.wordList.upload.naturalVillage') },
  { key: 'yindian_region', label: t('words.wordList.upload.yindianRegion') },
  { key: 'atlas_region', label: t('words.wordList.upload.atlasRegion') },
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
  yindianQuery.value = ''
  yindianSuggestions.value = []
}

function getLocationDetailRow(response) {
  if (Array.isArray(response?.data)) return response.data[0] || null
  if (response?.data && typeof response.data === 'object') return response.data
  return response && typeof response === 'object' ? response : null
}

function applyYindianDetail(detail) {
  if (!editingLocationDraft.value || !detail) return
  editingLocationDraft.value = {
    ...editingLocationDraft.value,
    location_name: editingLocationDraft.value.location_name || detail?.['語言'] || '',
    coordinates: detail?.['經緯度'] || editingLocationDraft.value.coordinates,
    province: detail?.['省'] || editingLocationDraft.value.province,
    city: detail?.['市'] || editingLocationDraft.value.city,
    county: detail?.['縣'] || editingLocationDraft.value.county,
    town: detail?.['鎮'] || editingLocationDraft.value.town,
    administrative_village: detail?.['行政村'] || editingLocationDraft.value.administrative_village,
    natural_village: detail?.['自然村'] || editingLocationDraft.value.natural_village,
    yindian_region: detail?.['音典分區'] || editingLocationDraft.value.yindian_region,
  }
}

async function fillFromYindian(name) {
  if (!name || isLoadingYindian.value) return
  isLoadingYindian.value = true
  try {
    const response = await getLocationDetail(name)
    const detail = getLocationDetailRow(response)
    if (!detail) {
      showWarning(t('words.wordList.upload.yindianNotFound'))
      return
    }
    applyYindianDetail(detail)
    showSuccess(t('words.wordList.upload.yindianFilled'))
  } catch (error) {
    showError(error.message || t('words.wordList.upload.yindianFailed'))
  } finally {
    isLoadingYindian.value = false
  }
}

function onYindianInput() {
  clearTimeout(yindianDebounceTimer)
  const query = yindianQuery.value.trim()
  if (!query) {
    yindianSuggestions.value = []
    return
  }
  yindianDebounceTimer = setTimeout(async () => {
    try {
      const results = await batchMatch(query, false)
      const items = Array.isArray(results) ? results.flatMap((r) => r.items || []) : []
      yindianSuggestions.value = [...new Set(items)]
    } catch {
      yindianSuggestions.value = []
    }
  }, 300)
}

function onYindianBlur() {
  setTimeout(() => {
    yindianSuggestions.value = []
  }, 200)
}

function applyYindianSuggestion(item) {
  yindianQuery.value = item
  yindianSuggestions.value = []
  return fillFromYindian(item)
}

function confirmYindianQuery() {
  const name = yindianQuery.value.trim()
  if (!name || isLoadingYindian.value) return
  return fillFromYindian(name)
}

async function handleSaveLocation(location) {
  if (!location?.location_name) {
    return
  }

  const payload = Object.fromEntries(
    locationEditFields.value.map((field) => [field.key, String(location[field.key] || '').trim()])
  )
  const params = location.user_id ? { user_id: location.user_id } : {}
  locationsStatusText.value = ''

  try {
    await updateVocabularyLocation(location.location_name, payload, params)
    locationsStatusText.value = t('words.wordList.locations.saveSuccess')
    showSuccess(locationsStatusText.value)
    await loadVocabularyLocations()
    closeLocationEditor()
  } catch (error) {
    locationsStatusText.value = error.message || t('words.wordList.locations.saveFailed')
    showError(locationsStatusText.value)
  }
}

function handleSaveEditingLocation() {
  return handleSaveLocation(editingLocationDraft.value || editingLocationSource.value)
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
    const params = location.user_id ? { user_id: location.user_id } : {}
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
