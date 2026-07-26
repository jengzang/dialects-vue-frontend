<template>
  <div class="vocabulary-view-page">
    <div class="top-controls">
        <div class="search-container">
          <div class="search-section">
            <div class="input-wrapper">
              <textarea
                ref="searchInputEl"
                v-model="query"
                class="search-input"
                rows="1"
                :placeholder="t('words.wordList.search.placeholder')"
              ></textarea>
            </div>

            <div class="field-filter">
              <button
                ref="searchFieldTriggerEl"
                class="select-trigger global-select-trigger filter-select-trigger"
                :class="{ 'is-open': searchFieldDropdownOpen }"
                type="button"
                @click="searchFieldDropdownOpen = !searchFieldDropdownOpen"
              >
                <span class="select-label">{{ searchFieldTriggerLabel }}</span>
                <span class="select-arrow" aria-hidden="true">⌄</span>
              </button>
              <MultiSelectDropdown
                v-if="searchFieldDropdownOpen"
                v-model="selectedSearchFields"
                :options="searchFieldOptions"
                :trigger-el="searchFieldTriggerEl"
                align="right"
                direction="down"
                @close="searchFieldDropdownOpen = false"
              />
            </div>
          </div>

          <div class="view-mode-selector">
            <button
              v-for="mode in viewModes"
              :key="mode.key"
              class="mode-btn"
              :class="{ active: viewMode === mode.key }"
              type="button"
              :title="mode.label"
              @click="setViewMode(mode.key)"
            >
              <span>{{ mode.label }}</span>
            </button>
          </div>
        </div>

        <div class="filter-strip">
          <div class="location-filter">
            <button
              ref="locationTriggerEl"
              class="select-trigger global-select-trigger location-select-trigger"
              :class="{ 'is-open': locationDropdownOpen, 'is-disabled': locationOptions.length === 0 }"
              type="button"
              :disabled="locationOptions.length === 0"
              @click="locationDropdownOpen = !locationDropdownOpen"
            >
              <span class="select-label">{{ locationTriggerLabel }}</span>
              <span class="select-arrow" aria-hidden="true">⌄</span>
            </button>
            <MultiSelectDropdown
              v-if="locationDropdownOpen"
              v-model="selectedLocations"
              :options="locationOptions"
              :trigger-el="locationTriggerEl"
              align="left"
              direction="down"
              @close="locationDropdownOpen = false"
            />
          </div>
        </div>

    </div>

    <section v-if="viewMode !== 'table'" class="content-area">
      <div v-if="isLoadingItems" class="loading-state loading-state-base">
        <div class="ui-loading--page" aria-hidden="true"></div>
        <span>{{ t('words.yuBaoPage.states.loadingCards') }}</span>
      </div>

      <div v-else-if="loadError" class="empty-state empty-state-base">
        <p>{{ loadError }}</p>
      </div>

      <div v-else-if="viewMode === 'card'" class="card-mode">
        <div v-if="entries.length" class="cards-grid">
          <article
            v-for="entry in entries"
            :key="entry.id"
            class="card vocabulary-card"
          >
            <div class="card-row row-1">
              <span class="location-chain">{{ entry.location }}</span>
              <span class="category-chain">{{ entry.pronunciationType }}</span>
            </div>
            <div class="card-row row-2">
              <span class="word-text">{{ entry.headword }}</span>
              <span class="pronunciation-text">{{ entry.pronunciation }}</span>
            </div>
            <div class="card-row row-3">
              <span class="definition-text">{{ entry.definition }}</span>
            </div>
            <div class="card-row row-4">
              <span class="memo-text">{{ entry.detail }}</span>
            </div>
          </article>
        </div>
        <div v-else class="empty-state empty-state-base">
          <p>{{ t('words.yuBaoPage.states.noData') }}</p>
        </div>
      </div>

      <div v-else-if="viewMode === 'map'" class="map-mode main-glass-panel">
        <div class="map-canvas-shell">
          <YuBaoMap
            v-if="mapDataForYuBaoMap.length"
            :map-data="mapDataForYuBaoMap"
            active-tab="vocabulary"
            @marker-click="handleMapPointClick"
          />
          <div v-else class="empty-state empty-state-base map-empty-state">
            <p>{{ t('words.yuBaoPage.states.noData') }}</p>
          </div>
        </div>
      </div>

      <button
        v-if="canLoadMore"
        class="load-more-btn main-glass-button"
        data-variant="secondary"
        type="button"
        @click="loadVocabularyItems({ append: true })"
      >
        {{ t('words.yuBaoPage.states.loadingMore') }}
      </button>
    </section>

    <section v-else-if="viewMode === 'table'" class="content-area table-content-area">
      <UniversalTable
        db-key="vocabulary"
        table-name="vocabulary_entries"
        :columns="tableColumns"
        primary-key="id"
        api-adapter="vocabulary"
      />
    </section>

    <AppModal
      v-model="isMapDetailModalOpen"
      size="lg"
      width="720px"
      max-height="80dvh"
      :title="selectedMapPointLabel"
      close-label="關閉"
      @close="clearMapDetailModal"
    >
      <div class="map-detail-modal">
        <p class="map-meta">
          {{ t('words.wordList.map.meta', {
            entries: mapStats.totalEntries,
            omitted: mapStats.omittedWithoutCoordinates
          }) }}
        </p>
        <div v-if="isLoadingMapDetail" class="loading-state loading-state-base">
          <div class="ui-loading--page" aria-hidden="true"></div>
          <span>{{ t('words.yuBaoPage.states.loadingData') }}</span>
        </div>
        <div v-else-if="mapDetailError" class="empty-state empty-state-base">
          <p>{{ mapDetailError }}</p>
        </div>
        <div v-else-if="mapDetailEntries.length" class="map-detail-list">
          <article v-for="entry in mapDetailEntries" :key="entry.id" class="map-detail-item">
            <div class="map-detail-item-head">
              <strong>{{ entry.headword }}</strong>
              <span>{{ entry.pronunciation }}</span>
            </div>
            <p>{{ entry.definition }}</p>
            <small v-if="entry.detail">{{ entry.detail }}</small>
          </article>
        </div>
        <div v-else class="empty-state empty-state-base">
          <p>{{ t('words.yuBaoPage.states.noData') }}</p>
        </div>
      </div>
    </AppModal>

  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { watchDebounced } from '@vueuse/core'
import {
  getVocabularyItems,
  getVocabularyLocationOptions,
  getVocabularyMapPoints
} from '@/api'
import MultiSelectDropdown from '@/components/selector/MultiSelectDropdown.vue'
import AppModal from '@/components/common/AppModal.vue'
import UniversalTable from '@/main/components/TableAndTree/UniversalTable.vue'
import YuBaoMap from '@/main/components/map/YuBaoMap.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const query = ref('')
const viewMode = ref(normalizeViewMode(route.query.tab))
const selectedSearchFields = ref([])
const selectedLocations = ref([])
const searchInputEl = ref(null)
const searchFieldTriggerEl = ref(null)
const locationTriggerEl = ref(null)
const searchFieldDropdownOpen = ref(false)
const locationDropdownOpen = ref(false)
const vocabularyLocationOptions = ref([])
const entries = ref([])
const mapPoints = ref([])
const mapStats = ref({
  totalEntries: 0,
  totalPoints: 0,
  omittedWithoutCoordinates: 0,
})
const total = ref(0)
const page = ref(1)
const pageSize = ref(50)
const isLoadingItems = ref(false)
const loadError = ref('')
const isMapDetailModalOpen = ref(false)
const isLoadingMapDetail = ref(false)
const mapDetailError = ref('')
const mapDetailEntries = ref([])
const selectedMapPointLabel = ref('')


const searchFieldOptions = computed(() => [
  { value: 'definition', label: t('words.wordList.search.fields.definition') },
  { value: 'headword', label: t('words.wordList.search.fields.headword') },
  { value: 'pronunciation', label: t('words.wordList.search.fields.ipa') },
  { value: 'detail', label: t('words.wordList.search.fields.notes') }
])

const locationOptions = computed(() => {
  return vocabularyLocationOptions.value
})

const searchFieldTriggerLabel = computed(() => {
  if (!selectedSearchFields.value.length) {
    return t('words.wordList.search.fields.all')
  }

  return formatMultiSelectLabel(selectedSearchFields.value, searchFieldOptions.value, t('words.wordList.search.fields.all'))
})

const locationTriggerLabel = computed(() => {
  return formatMultiSelectLabel(
    selectedLocations.value,
    locationOptions.value,
    t('words.wordList.search.locationPlaceholder')
  )
})

const canLoadMore = computed(() => {
  return shouldUseVocabularyItemsApi() && !isLoadingItems.value && entries.value.length < total.value
})

const viewModes = computed(() => [
  { key: 'table', icon: '▤', label: t('words.wordList.viewModes.table') },
  { key: 'card', icon: '▦', label: t('words.wordList.viewModes.card') },
  { key: 'map', icon: '⌖', label: t('words.wordList.viewModes.map') }
])

const tableColumns = computed(() => [
  { key: 'standard_word', label: t('words.wordList.columns.definition'), filterable: false, width: 1.2 },
  { key: 'local_expression', label: t('words.wordList.columns.headword'), filterable: false, width: 1 },
  { key: 'ipa', label: t('words.wordList.columns.pronunciation'), filterable: false, width: 1.2 },
  { key: 'notes', label: t('words.wordList.columns.detail'), filterable: false, width: 1.6 },
  { key: 'location_name', label: t('words.wordList.columns.location'), filterable: true, width: 1 },
  { key: 'informations', label: t('words.wordList.columns.informations'), filterable: false, width: 1.2 },
  { key: 'source_filename', label: t('words.wordList.columns.sourceFilename'), filterable: true, width: 1.2 }
])

function normalizeViewMode(value) {
  return ['card', 'map', 'table'].includes(value) ? value : 'card'
}

function setViewMode(mode) {
  const nextMode = normalizeViewMode(mode)
  viewMode.value = nextMode
  router.replace({
    query: {
      ...route.query,
      tab: nextMode,
    }
  })
}

const mapDataForYuBaoMap = computed(() => {
  return mapPoints.value
    .filter((point) => Number.isFinite(point.longitude) && Number.isFinite(point.latitude))
    .map((point) => ({
      longitude: point.longitude,
      latitude: point.latitude,
      locationName: point.locationName,
      location: point.locationName,
      county: point.locationName,
      province: point.locationLabel,
      pronunciation: point.markerLabel,
      note2: point.locationLabel,
      note1: point.entryCount ? String(point.entryCount) : '',
    }))
})

function shouldUseVocabularyItemsApi() {
  return viewMode.value === 'card'
}

function shouldUseVocabularyMapPointsApi() {
  return viewMode.value === 'map'
}

function formatMultiSelectLabel(selectedValues, options, placeholder) {
  const selectedLabels = selectedValues
    .map((value) => options.find((option) => option.value === value)?.label || value)
    .filter(Boolean)

  if (!selectedLabels.length) {
    return placeholder
  }

  if (selectedLabels.length === 1) {
    return selectedLabels[0]
  }

  return `${selectedLabels[0]} +${selectedLabels.length - 1}`
}

function normalizeSelectedSearchFields() {
  const fields = selectedSearchFields.value.filter(Boolean)
  if (!fields.length) {
    return []
  }

  return fields
}

function normalizeNumber(value) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

function normalizeVocabularyEntry(item) {
  const detailParts = [item.notes, item.informations, item.detail]
    .map((value) => String(value || '').trim())
    .filter(Boolean)

  return {
    id: item.id || `${item.location_name || ''}-${item.standard_word || ''}-${item.local_expression || ''}`,
    definition: item.standard_word || item.definition || '',
    headword: item.local_expression || item.headword || '',
    pronunciation: item.ipa || item.pronunciation || '',
    pronunciationType: item.pronunciation_type || '',
    detail: [...new Set(detailParts)].join(' · '),
    information: item.informations || '',
    location: item.location_label || item.location || item.location_name || '',
    locationName: item.location_name || '',
    longitude: normalizeNumber(item.longitude),
    latitude: normalizeNumber(item.latitude),
  }
}

function buildVocabularyQueryParams() {
  return {
    q: query.value.trim(),
    locations: selectedLocations.value,
    search_fields: normalizeSelectedSearchFields(),
  }
}

function buildVocabularyItemsParams(overrides = {}) {
  return {
    ...buildVocabularyQueryParams(),
    page: page.value,
    page_size: pageSize.value,
    ...overrides,
  }
}

function buildVocabularyMapPointsParams() {
  return buildVocabularyQueryParams()
}

function normalizeVocabularyMapPoint(point) {
  const locationName = point.location_name || ''
  const locationLabel = point.location_label || locationName
  const entryCount = Number(point.entry_count) || 0

  return {
    locationName,
    locationLabel,
    longitude: normalizeNumber(point.longitude),
    latitude: normalizeNumber(point.latitude),
    entryCount,
    markerLabel: entryCount ? String(entryCount) : (locationLabel || locationName),
  }
}

function normalizeMapPointLocations(point) {
  if (Array.isArray(point?.locationNames)) {
    return point.locationNames.filter(Boolean)
  }

  if (typeof point?.locationNames === 'string' && point.locationNames.trim()) {
    try {
      const parsedLocations = JSON.parse(point.locationNames)
      if (Array.isArray(parsedLocations)) {
        return parsedLocations.filter(Boolean)
      }
    } catch {
      return [point.locationNames.trim()]
    }
  }

  return point?.locationName ? [point.locationName] : []
}

async function loadVocabularyItems({ append = false } = {}) {
  if (!shouldUseVocabularyItemsApi()) {
    return
  }

  const nextPage = append ? page.value + 1 : 1
  page.value = nextPage
  isLoadingItems.value = true
  loadError.value = ''

  try {
    const response = await getVocabularyItems(buildVocabularyItemsParams())
    const nextEntries = Array.isArray(response.items) ? response.items.map(normalizeVocabularyEntry) : []
    entries.value = append ? entries.value.concat(nextEntries) : nextEntries
    total.value = Number(response.total) || entries.value.length
    page.value = Number(response.page) || nextPage
    pageSize.value = Number(response.page_size) || pageSize.value
  } catch (error) {
    loadError.value = error.message || '獲取詞表條目失敗'
    if (!append) {
      entries.value = []
      total.value = 0
    }
  } finally {
    isLoadingItems.value = false
  }
}

async function loadVocabularyMapPoints() {
  if (!shouldUseVocabularyMapPointsApi()) {
    return
  }

  isLoadingItems.value = true
  loadError.value = ''
  entries.value = []
  total.value = 0

  try {
    const response = await getVocabularyMapPoints(buildVocabularyMapPointsParams())
    mapPoints.value = Array.isArray(response.points) ? response.points.map(normalizeVocabularyMapPoint) : []
    mapStats.value = {
      totalEntries: Number(response.total_entries) || 0,
      totalPoints: Number(response.total_points) || mapPoints.value.length,
      omittedWithoutCoordinates: Number(response.omitted_without_coordinates) || 0,
    }
  } catch (error) {
    loadError.value = error.message || '獲取詞表地圖點失敗'
    mapPoints.value = []
    mapStats.value = {
      totalEntries: 0,
      totalPoints: 0,
      omittedWithoutCoordinates: 0,
    }
  } finally {
    isLoadingItems.value = false
  }
}

async function loadVocabularyLocationOptions() {
  try {
    vocabularyLocationOptions.value = await getVocabularyLocationOptions()
  } catch {
    vocabularyLocationOptions.value = []
  }
}

async function handleMapPointClick(point) {
  const locations = normalizeMapPointLocations(point)

  if (!locations.length) {
    return
  }

  selectedMapPointLabel.value = point.locationLabel || point.locationName || locations[0]
  isMapDetailModalOpen.value = true
  isLoadingMapDetail.value = true
  mapDetailError.value = ''
  mapDetailEntries.value = []

  try {
    const response = await getVocabularyItems(buildVocabularyItemsParams({
      locations,
      page: 1,
      page_size: pageSize.value,
    }))
    mapDetailEntries.value = Array.isArray(response.items) ? response.items.map(normalizeVocabularyEntry) : []
  } catch (error) {
    mapDetailError.value = error.message || '獲取詞表條目失敗'
    mapDetailEntries.value = []
  } finally {
    isLoadingMapDetail.value = false
  }
}

function clearMapDetailModal() {
  selectedMapPointLabel.value = ''
  mapDetailError.value = ''
}

function loadActiveViewMode() {
  if (shouldUseVocabularyItemsApi()) {
    loadVocabularyItems()
  } else if (shouldUseVocabularyMapPointsApi()) {
    loadVocabularyMapPoints()
  }
}

onMounted(() => {
  loadVocabularyLocationOptions()
  loadActiveViewMode()
})

watch(() => route.query.tab, (tab) => {
  const nextMode = normalizeViewMode(tab)
  if (viewMode.value !== nextMode) {
    viewMode.value = nextMode
  }
})

watch(viewMode, () => {
  loadActiveViewMode()
})

watchDebounced([query, selectedSearchFields, selectedLocations], () => {
  if (shouldUseVocabularyItemsApi()) {
    loadVocabularyItems()
  } else if (shouldUseVocabularyMapPointsApi()) {
    loadVocabularyMapPoints()
  }
}, { debounce: 250, maxWait: 800 })
</script>

<style scoped lang="scss" src="./vocabulary.scss"></style>
