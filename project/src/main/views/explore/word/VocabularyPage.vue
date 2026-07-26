<template>
  <div class="vocabulary-page">
    <div class="top-controls">
      <div class="header-container">
        <div class="tab-container" role="tablist" :aria-label="t('words.wordList.tabs.label')">
          <button
            v-for="tab in workflowTabs"
            :key="tab.key"
            class="tab-btn"
            :class="{ active: activeWorkflow === tab.key }"
            type="button"
            role="tab"
            :aria-selected="activeWorkflow === tab.key"
            @click="activeWorkflow = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <template v-if="activeWorkflow === 'list'">
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
              @click="viewMode = mode.key"
            >
              <span aria-hidden="true">{{ mode.icon }}</span>
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
      </template>
    </div>

    <section v-if="activeWorkflow === 'list' && viewMode !== 'table'" class="content-area">
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

    <section v-else-if="activeWorkflow === 'list' && viewMode === 'table'" class="content-area table-content-area">
      <UniversalTable
        db-key="vocabulary"
        table-name="vocabulary_entries"
        :columns="tableColumns"
        primary-key="id"
        api-adapter="vocabulary"
      />
    </section>

    <section v-else-if="activeWorkflow === 'upload'" class="content-area">
      <div class="upload-mode main-glass-panel">
        <div class="upload-head">
          <div>
            <h3>{{ t('words.wordList.upload.title') }}</h3>
            <p>{{ t('words.wordList.upload.desc') }}</p>
          </div>
          <label class="main-glass-button" data-variant="primary">
            {{ t('words.wordList.upload.chooseFile') }}
            <input class="upload-file-input" type="file" accept=".xlsx,.xls,.csv,.tsv,.docx,.doc" @change="handleUploadFile" />
          </label>
        </div>

        <div class="upload-location-grid">
          <label v-for="field in uploadLocationFields" :key="field.key" class="upload-field">
            <span>{{ field.label }}</span>
            <input
              v-model="uploadLocation[field.key]"
              type="text"
              :required="field.required"
              :placeholder="field.placeholder"
            />
          </label>
          <label class="upload-field">
            <span>{{ t('words.wordList.upload.parserMode') }}</span>
            <select v-model="uploadParserMode">
              <option v-for="option in parserModeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
        </div>

        <TabularImportPreview
          embedded
          :title="t('words.wordList.upload.previewTitle')"
          :description="t('words.wordList.upload.previewDesc')"
          :file="selectedUploadFile"
          :schema="importSchema"
          :mapping-enabled="isVocabularyPreviewFile(selectedUploadFile)"
          :loading="importPreview.loading"
          :preview-table="importPreview.previewTable"
          :diagnostics="importPreview.diagnostics"
          :mapping="importPreview.mapping"
          @update:mapping="importFlow.updateManualMapping"
          @reset="clearUploadFile"
          @confirm="handleConfirmUpload"
        />
        <div class="upload-actions">
          <button
            class="main-glass-button"
            data-variant="primary"
            type="button"
            :disabled="!canConfirmUpload"
            @click="handleConfirmUpload"
          >
            {{ isUploading ? t('common.label.loading') : t('words.wordList.upload.submit') }}
          </button>
        </div>
        <p v-if="uploadStatusText" class="upload-status">{{ uploadStatusText }}</p>
      </div>
    </section>

    <section v-else-if="activeWorkflow === 'locations'" class="content-area">
      <div class="locations-mode main-glass-panel">
        <div class="locations-head">
          <div>
            <h3>{{ t('words.wordList.locations.title') }}</h3>
            <p>{{ t('words.wordList.locations.desc') }}</p>
          </div>
          <button class="main-glass-button" data-variant="secondary" type="button" @click="loadVocabularyLocations">
            {{ t('words.wordList.locations.refresh') }}
          </button>
        </div>

        <div v-if="locationsLoadError" class="empty-state empty-state-base">
          <p>{{ locationsLoadError }}</p>
        </div>

        <div v-else-if="isLoadingLocations" class="loading-state loading-state-base">
          <div class="ui-loading--page" aria-hidden="true"></div>
          <span>{{ t('words.yuBaoPage.states.loadingData') }}</span>
        </div>

        <div v-else class="locations-list">
          <article v-for="location in locationRows" :key="`${location.user_id || ''}-${location.location_name}`" class="location-item">
            <div class="location-item-head">
              <div>
                <strong>{{ location.location_name }}</strong>
                <p>{{ location.location_label || location.location_name }}</p>
              </div>
              <button class="main-glass-button" data-variant="primary" type="button" @click="handleSaveLocation(location)">
                {{ t('words.wordList.locations.save') }}
              </button>
            </div>
            <div class="locations-edit-grid">
              <label v-for="field in locationEditFields" :key="field.key" class="upload-field">
                <span>{{ field.label }}</span>
                <input v-model="location[field.key]" type="text" />
              </label>
            </div>
          </article>
        </div>
        <p v-if="locationsStatusText" class="upload-status">{{ locationsStatusText }}</p>
      </div>
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
import { useI18n } from 'vue-i18n'
import { watchDebounced } from '@vueuse/core'
import {
  getVocabularyItems,
  getVocabularyLocationOptions,
  getVocabularyLocations,
  getVocabularyMapPoints,
  updateVocabularyLocation,
  uploadVocabulary
} from '@/api'
import MultiSelectDropdown from '@/components/selector/MultiSelectDropdown.vue'
import AppModal from '@/components/common/AppModal.vue'
import TabularImportPreview from '@/components/import/TabularImportPreview.vue'
import UniversalTable from '@/main/components/TableAndTree/UniversalTable.vue'
import YuBaoMap from '@/main/components/map/YuBaoMap.vue'
import { useTabularImportPreview } from '@/composables/import/useTabularImportPreview.js'
import { useTabularImportFlow } from '@/composables/import/useTabularImportFlow.js'

const { t } = useI18n()

const activeWorkflow = ref('list')
const query = ref('')
const viewMode = ref('card')
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
const isUploading = ref(false)
const uploadStatusText = ref('')
const isLoadingLocations = ref(false)
const locationsLoadError = ref('')
const locationsStatusText = ref('')
const isMapDetailModalOpen = ref(false)
const isLoadingMapDetail = ref(false)
const mapDetailError = ref('')
const mapDetailEntries = ref([])
const selectedMapPointLabel = ref('')
const uploadParserMode = ref('auto')
const uploadFile = ref(null)
const uploadLocation = ref({
  location_name: '',
  coordinates: '',
  province: '',
  city: '',
  county: '',
  town: '',
  administrative_village: '',
  natural_village: '',
  yindian_region: '',
  atlas_region: '',
})
const locationRows = ref([])

const workflowTabs = computed(() => [
  { key: 'list', label: t('words.wordList.tabs.list') },
  { key: 'upload', label: t('words.wordList.tabs.upload') },
  { key: 'locations', label: t('words.wordList.tabs.locations') }
])

const searchFieldOptions = computed(() => [
  { value: 'definition', label: t('words.wordList.search.fields.definition') },
  { value: 'headword', label: t('words.wordList.search.fields.headword') },
  { value: 'ipa', label: t('words.wordList.search.fields.ipa') },
  { value: 'notes', label: t('words.wordList.search.fields.notes') }
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

const uploadLocationFields = computed(() => [
  {
    key: 'location_name',
    label: t('words.wordList.upload.locationName'),
    placeholder: t('words.wordList.upload.locationNamePlaceholder'),
    required: true
  },
  {
    key: 'coordinates',
    label: t('words.wordList.upload.coordinates'),
    placeholder: t('words.wordList.upload.coordinatesPlaceholder'),
    required: true
  },
  { key: 'province', label: t('words.wordList.upload.province'), placeholder: t('words.wordList.upload.province'), required: false },
  { key: 'city', label: t('words.wordList.upload.city'), placeholder: t('words.wordList.upload.city'), required: false },
  { key: 'county', label: t('words.wordList.upload.county'), placeholder: t('words.wordList.upload.county'), required: false },
  { key: 'town', label: t('words.wordList.upload.town'), placeholder: t('words.wordList.upload.town'), required: false },
  { key: 'administrative_village', label: t('words.wordList.upload.administrativeVillage'), placeholder: t('words.wordList.upload.administrativeVillage'), required: false },
  { key: 'natural_village', label: t('words.wordList.upload.naturalVillage'), placeholder: t('words.wordList.upload.naturalVillage'), required: false },
  { key: 'yindian_region', label: t('words.wordList.upload.yindianRegion'), placeholder: t('words.wordList.upload.yindianRegion'), required: false },
  { key: 'atlas_region', label: t('words.wordList.upload.atlasRegion'), placeholder: t('words.wordList.upload.atlasRegion'), required: false },
])

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

const parserModeOptions = computed(() => [
  { value: 'auto', label: t('words.wordList.upload.parserModes.auto') },
  { value: 'table', label: t('words.wordList.upload.parserModes.table') },
  { value: 'doc_whitespace', label: t('words.wordList.upload.parserModes.docWhitespace') },
  { value: 'doc_bracket', label: t('words.wordList.upload.parserModes.docBracket') },
])

const importSchema = computed(() => [
  {
    key: 'definition',
    label: t('words.wordList.columns.definition'),
    required: true,
    aliases: ['释义', '釋義', 'definition', 'gloss'],
    example: t('words.wordList.import.examples.definition')
  },
  {
    key: 'headword',
    label: t('words.wordList.columns.headword'),
    required: true,
    aliases: ['词条', '詞條', '方言词', 'headword', 'word'],
    example: t('words.wordList.import.examples.headword')
  },
  {
    key: 'pronunciation',
    label: t('words.wordList.columns.pronunciation'),
    required: true,
    aliases: ['发音', '發音', '读音', 'pronunciation', 'ipa'],
    example: t('words.wordList.import.examples.pronunciation')
  },
  {
    key: 'detail',
    label: t('words.wordList.columns.detail'),
    required: false,
    aliases: ['详情', '詳情', '描述', 'detail', 'description'],
    example: t('words.wordList.import.examples.detail')
  }
])

const importPreview = useTabularImportPreview({
  schema: importSchema,
  requireExplicitConfirmation: true
})

const importFlow = useTabularImportFlow({
  previewState: importPreview
})

const canLoadMore = computed(() => {
  return activeWorkflow.value === 'list' && viewMode.value === 'card' && entries.value.length < total.value
})

const selectedUploadFile = computed(() => uploadFile.value || importFlow.pendingFile.value)

const canConfirmUpload = computed(() => {
  const file = selectedUploadFile.value
  if (!file || isUploading.value) {
    return false
  }
  return !isVocabularyPreviewFile(file) || importPreview.diagnostics.value.isComplete
})

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
      pronunciation: String(point.entryCount || ''),
      note2: point.locationLabel,
      note1: point.entryCount ? String(point.entryCount) : '',
    }))
})

function shouldUseVocabularyItemsApi() {
  return activeWorkflow.value === 'list' && viewMode.value === 'card'
}

function shouldUseVocabularyMapPointsApi() {
  return activeWorkflow.value === 'list' && viewMode.value === 'map'
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

function isVocabularyPreviewFile(file) {
  return Boolean(file?.name && /\.(xlsx|xls|csv|tsv)$/i.test(file.name))
}

function isVocabularyUploadFile(file) {
  return Boolean(file?.name && /\.(xlsx|xls|csv|tsv|docx|doc)$/i.test(file.name))
}

function clearUploadFile() {
  uploadFile.value = null
  importFlow.clearPreview()
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
  return {
    locationName: point.location_name || '',
    locationLabel: point.location_label || point.location_name || '',
    longitude: normalizeNumber(point.longitude),
    latitude: normalizeNumber(point.latitude),
    entryCount: Number(point.entry_count) || 0,
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

async function loadVocabularyLocations() {
  isLoadingLocations.value = true
  locationsLoadError.value = ''

  try {
    const response = await getVocabularyLocations({ page: 1, page_size: 200 })
    locationRows.value = Array.isArray(response.locations)
      ? response.locations.map((location) => ({ ...location }))
      : []
  } catch (error) {
    locationsLoadError.value = error.message || '獲取詞表地點信息失敗'
    locationRows.value = []
  } finally {
    isLoadingLocations.value = false
  }
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
    await loadVocabularyLocationOptions()
  } catch (error) {
    locationsStatusText.value = error.message || t('words.wordList.locations.saveFailed')
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

function handleUploadFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  uploadStatusText.value = ''
  clearUploadFile()

  if (!isVocabularyUploadFile(file)) {
    uploadStatusText.value = t('words.wordList.upload.unsupportedFile')
    event.target.value = ''
    return
  }

  if (isVocabularyPreviewFile(file)) {
    importFlow.loadPreview(file)
  } else {
    uploadFile.value = file
  }

  event.target.value = ''
}

async function handleConfirmUpload() {
  const file = uploadFile.value || importFlow.pendingFile.value

  if (!file || isUploading.value) {
    return
  }

  const location = Object.fromEntries(
    Object.entries(uploadLocation.value).map(([key, value]) => [key, String(value || '').trim()])
  )

  if (!location.location_name || !location.coordinates) {
    uploadStatusText.value = t('words.wordList.upload.missingLocation')
    return
  }

  isUploading.value = true
  uploadStatusText.value = ''

  try {
    const response = await uploadVocabulary({
      file,
      location,
      parser_mode: uploadParserMode.value,
    })
    uploadStatusText.value = t('words.wordList.upload.success', { count: response.imported_count || 0 })
    clearUploadFile()
  } catch (error) {
    uploadStatusText.value = error.message || t('words.wordList.upload.failed')
  } finally {
    isUploading.value = false
  }
}

onMounted(() => {
  loadVocabularyLocationOptions()
  loadVocabularyItems()
})

watch([activeWorkflow, viewMode], () => {
  if (shouldUseVocabularyItemsApi()) {
    loadVocabularyItems()
  } else if (shouldUseVocabularyMapPointsApi()) {
    loadVocabularyMapPoints()
  } else if (activeWorkflow.value === 'locations') {
    loadVocabularyLocations()
  }
})

watchDebounced([query, selectedSearchFields, selectedLocations], () => {
  if (shouldUseVocabularyItemsApi()) {
    loadVocabularyItems()
  } else if (shouldUseVocabularyMapPointsApi()) {
    loadVocabularyMapPoints()
  }
}, { debounce: 250, maxWait: 800 })
</script>

<style scoped lang="scss">
.vocabulary-page {
  width: 100%;
  min-height: 100%;
  padding: 16px 20px 24px;
  color: var(--text-primary);
}

.top-controls {
  position: sticky;
  top: 0;
  z-index: 20;
  display: grid;
  gap: 12px;
  padding: 12px;
  margin: 0 auto 16px;
  background: var(--glass-20);
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-lg, 8px);
  box-shadow: var(--shadow-soft, 0 8px 24px rgba(0, 0, 0, 0.08));
  backdrop-filter: blur(10px);
}

.header-container,
.search-container,
.search-section,
.filter-strip {
  display: flex;
  gap: 10px;
  align-items: center;
}

.header-container {
  justify-content: space-between;
}

.tab-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tab-btn {
  min-height: 36px;
  padding: 0 14px;
  color: var(--text-secondary);
  cursor: pointer;
  background: var(--glass-10);
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-md, 8px);
}

.tab-btn.active {
  color: var(--text-primary);
  background: var(--glass-30);
  border-color: var(--color-primary-hover);
}

.search-container {
  align-items: flex-start;
}

.search-section {
  flex: 1;
  min-width: 0;
}

.input-wrapper {
  flex: 1;
  min-width: 0;
}

.search-input {
  width: 100%;
  min-height: 40px;
  padding: 10px 12px;
  color: var(--text-primary);
  background: var(--glass-10);
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-md, 8px);
}

.search-input {
  resize: vertical;
}

.field-filter {
  position: relative;
  flex: 0 0 auto;
}

.location-filter {
  position: relative;
  width: min(100%, 360px);
}

.filter-select-trigger {
  width: 176px;
}

.location-select-trigger {
  width: 100%;
}

.select-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--text-primary);
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-arrow {
  flex: 0 0 auto;
  margin-left: 8px;
  color: var(--text-tertiary);
  font-size: 12px;
  transition: transform 0.18s ease;
}

.select-trigger.is-open .select-arrow {
  transform: rotate(180deg);
}

.view-mode-selector {
  display: flex;
  gap: 6px;
}

.mode-btn {
  display: inline-grid;
  width: 40px;
  height: 40px;
  place-items: center;
  color: var(--text-secondary);
  cursor: pointer;
  background: var(--glass-10);
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-md, 8px);
}

.mode-btn.active {
  color: var(--text-primary);
  background: var(--glass-30);
  border-color: var(--color-primary-hover);
}

.filter-strip {
  justify-content: space-between;
}

.content-area {
  width: min(100%, 1180px);
  margin: 0 auto;
}

.table-content-area {
  width: 100%;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
  min-height: 100px;
  padding: 4px;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 20px;
  overflow: hidden;
  background: var(--glass-80);
  border: 0.5px solid var(--glass-90);
  border-radius: var(--radius-lg);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.06),
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 var(--text-white);
  backdrop-filter: blur(20px) saturate(180%);
  transition: all 0.2s ease;
}

.card:hover {
  border-color: rgba(var(--color-primary-rgb), 0.2);
  box-shadow:
    0 12px 48px rgba(0, 0, 0, 0.08),
    0 4px 12px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 var(--text-white);
  transform: translateY(-2px);
}

.card-row {
  display: flex;
  gap: 12px;
  align-items: center;
  line-height: 1.5;
}

.row-1 {
  flex-wrap: wrap;
  color: var(--text-secondary);
  font-size: 12px;
}

.row-2 {
  flex-wrap: wrap;
  font-size: 16px;
  font-weight: 600;
}

.location-chain {
  flex: 1;
  min-width: 0;
  color: var(--text-primary);
  font-weight: 500;
}

.category-chain {
  flex: 0 0 auto;
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.word-text {
  color: var(--text-primary);
  font-size: 20px;
}

.definition-text {
  color: var(--text-primary);
  font-weight: 600;
}

.pronunciation-text {
  color: var(--color-primary);
  font-family: var(--font-monospace, 'SF Mono', Monaco, Consolas, monospace);
  font-size: 14px;
  font-weight: 500;
}

.memo-text {
  color: var(--text-secondary);
  line-height: 1.6;
}

.map-mode,
.upload-mode,
.locations-mode {
  padding: 16px;
}

.map-mode {
  min-height: 520px;
  overflow: hidden;
}

.map-canvas-shell {
  min-height: 488px;
  overflow: hidden;
  border-radius: var(--radius-md, 8px);
}

.map-detail-modal {
  display: grid;
  gap: 12px;
}

.map-detail-list {
  display: grid;
  gap: 10px;
}

.map-detail-item {
  padding: 10px;
  background: var(--glass-10);
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-md, 8px);
}

.map-detail-item-head {
  display: flex;
  gap: 10px;
  align-items: baseline;
  justify-content: space-between;
}

.map-detail-item p {
  margin: 6px 0 0;
  color: var(--text-primary);
}

.map-detail-item small {
  display: block;
  margin-top: 6px;
  color: var(--text-secondary);
}

.map-meta {
  margin: 0 0 10px;
  font-size: 0.9rem;
}

.map-empty-state {
  height: 100%;
}

.load-more-btn {
  display: flex;
  margin: 14px auto 0;
}

.upload-mode,
.locations-mode {
  display: grid;
  gap: 16px;
}

.upload-location-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.upload-field {
  display: grid;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.upload-field input,
.upload-field select {
  min-height: 38px;
  padding: 8px 10px;
  color: var(--text-primary);
  background: var(--glass-10);
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-md, 8px);
}

.upload-status {
  margin: 0;
  color: var(--text-secondary);
}

.upload-actions {
  display: flex;
  justify-content: flex-end;
}

.upload-head,
.locations-head,
.location-item {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
}

.upload-head h3,
.locations-head h3 {
  margin: 0;
  font-size: 1.15rem;
}

.upload-head p,
.locations-head p,
.location-item p {
  margin: 6px 0 0;
  color: var(--text-secondary);
}

.upload-file-input {
  display: none;
}

.locations-list {
  display: grid;
  gap: 10px;
}

.location-item {
  align-items: stretch;
  flex-direction: column;
  padding: 14px;
  background: var(--glass-10);
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-md, 8px);
}

.location-item-head {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.locations-edit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

@media (max-width: 768px) {
  .vocabulary-page {
    padding: 12px;
  }

  .top-controls {
    position: static;
  }

  .search-container,
  .search-section,
  .filter-strip,
  .upload-head,
  .locations-head,
  .location-item-head {
    align-items: stretch;
    flex-direction: column;
  }

  .field-filter {
    width: 100%;
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }

  .card {
    padding: 16px 18px;
  }

  .word-text {
    font-size: 18px;
  }

  .map-canvas-shell {
    min-height: 420px;
  }
}

@media (max-width: 480px) {
  .cards-grid {
    gap: 12px;
  }

  .card {
    gap: 12px;
    padding: 14px 16px;
  }

  .row-1 {
    font-size: 11px;
  }

  .word-text {
    font-size: 16px;
  }

  .pronunciation-text {
    font-size: 13px;
  }
}
</style>
