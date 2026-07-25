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
              <SimpleSelectDropdown
                v-model="selectedSearchField"
                :options="searchFieldOptions"
                match-trigger-width
                width="136px"
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
          <div class="filter-input-wrapper">
            <span class="filter-icon" aria-hidden="true">⌕</span>
            <input
              v-model="locationQuery"
              type="text"
              :placeholder="t('words.wordList.search.locationPlaceholder')"
              class="local-filter-input"
            />
            <button
              v-if="locationQuery"
              class="clear-filter-btn"
              type="button"
              @click="locationQuery = ''"
            >
              ×
            </button>
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
        <div class="map-placeholder">
          <span aria-hidden="true">⌖</span>
          <p>{{ t('words.wordList.map.placeholder', { count: mapPoints.length }) }}</p>
          <p class="map-meta">
            {{ t('words.wordList.map.meta', {
              entries: mapStats.totalEntries,
              omitted: mapStats.omittedWithoutCoordinates
            }) }}
          </p>
        </div>
        <div class="map-side-panel ui-scrollbar">
          <div class="map-result-list">
            <button
              v-for="point in mapPoints"
              :key="point.locationName"
              class="map-result-item"
              type="button"
              @click="handleMapPointClick(point)"
            >
              <strong>{{ point.locationLabel }}</strong>
              <span>{{ point.entryCount }}</span>
            </button>
          </div>

          <div v-if="entries.length" class="map-detail-list">
            <article v-for="entry in entries" :key="entry.id" class="map-detail-item">
              <strong>{{ entry.headword }}</strong>
              <span>{{ entry.pronunciation }}</span>
              <p>{{ entry.definition }}</p>
            </article>
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

    <section v-else-if="activeWorkflow === 'review'" class="content-area">
      <div class="review-mode main-glass-panel">
        <div class="review-head">
          <div>
            <h3>{{ t('words.wordList.review.title') }}</h3>
            <p>{{ t('words.wordList.review.desc') }}</p>
          </div>
          <span class="review-badge">{{ t('words.wordList.review.permissionBadge') }}</span>
        </div>

        <div class="review-list">
          <article v-for="submission in reviewSubmissions" :key="submission.id" class="review-item">
            <div>
              <strong>{{ submission.fileName }}</strong>
              <p>{{ submission.meta }}</p>
            </div>
            <div class="review-actions">
              <button class="main-glass-button" data-variant="secondary" type="button">
                {{ t('words.wordList.review.reject') }}
              </button>
              <button class="main-glass-button" data-variant="primary" type="button">
                {{ t('words.wordList.review.approve') }}
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { watchDebounced } from '@vueuse/core'
import { getVocabularyItems, getVocabularyMapPoints, uploadVocabulary } from '@/api'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import TabularImportPreview from '@/components/import/TabularImportPreview.vue'
import UniversalTable from '@/main/components/TableAndTree/UniversalTable.vue'
import { useTabularImportPreview } from '@/composables/import/useTabularImportPreview.js'
import { useTabularImportFlow } from '@/composables/import/useTabularImportFlow.js'

const { t } = useI18n()

const activeWorkflow = ref('list')
const query = ref('')
const locationQuery = ref('')
const viewMode = ref('card')
const selectedSearchField = ref('all')
const searchInputEl = ref(null)
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
const uploadParserMode = ref('auto')
const uploadFile = ref(null)
const uploadLocation = ref({
  location_name: '',
  coordinates: '',
  province: '',
  city: '',
  county: '',
  yindian_region: '',
  atlas_region: '',
})

const workflowTabs = computed(() => [
  { key: 'list', label: t('words.wordList.tabs.list') },
  { key: 'upload', label: t('words.wordList.tabs.upload') },
  { key: 'review', label: t('words.wordList.tabs.review') }
])

const searchFieldOptions = computed(() => [
  { value: 'all', label: t('words.wordList.search.fields.all') },
  { value: 'definition', label: t('words.wordList.search.fields.definition') },
  { value: 'headword', label: t('words.wordList.search.fields.headword') },
  { value: 'pronunciation', label: t('words.wordList.search.fields.pronunciation') },
  { value: 'detail', label: t('words.wordList.search.fields.detail') },
  { value: 'location', label: t('words.wordList.search.fields.location') }
])

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
  { key: 'yindian_region', label: t('words.wordList.upload.yindianRegion'), placeholder: t('words.wordList.upload.yindianRegion'), required: false },
  { key: 'atlas_region', label: t('words.wordList.upload.atlasRegion'), placeholder: t('words.wordList.upload.atlasRegion'), required: false },
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

const reviewSubmissions = computed(() => [
  {
    id: 'pending-1',
    fileName: t('words.wordList.review.sampleFile'),
    meta: t('words.wordList.review.sampleMeta')
  }
])

function shouldUseVocabularyItemsApi() {
  return activeWorkflow.value === 'list' && viewMode.value === 'card'
}

function shouldUseVocabularyMapPointsApi() {
  return activeWorkflow.value === 'list' && viewMode.value === 'map'
}

function parseLocationFilter(value) {
  return value
    .split(/[,，;；\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)
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
  const params = {
    q: query.value.trim(),
    locations: parseLocationFilter(locationQuery.value),
  }

  if (selectedSearchField.value !== 'all') {
    params.search_fields = selectedSearchField.value
  }

  return params
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

async function handleMapPointClick(point) {
  if (!point?.locationName) {
    return
  }

  isLoadingItems.value = true
  loadError.value = ''
  page.value = 1

  try {
    const response = await getVocabularyItems(buildVocabularyItemsParams({
      locations: point.locationName,
      page: 1,
      page_size: pageSize.value,
    }))
    entries.value = Array.isArray(response.items) ? response.items.map(normalizeVocabularyEntry) : []
    total.value = Number(response.total) || entries.value.length
    page.value = Number(response.page) || 1
    pageSize.value = Number(response.page_size) || pageSize.value
  } catch (error) {
    loadError.value = error.message || '獲取詞表條目失敗'
    entries.value = []
    total.value = 0
  } finally {
    isLoadingItems.value = false
  }
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
  loadVocabularyItems()
})

watch([activeWorkflow, viewMode], () => {
  if (shouldUseVocabularyItemsApi()) {
    loadVocabularyItems()
  } else if (shouldUseVocabularyMapPointsApi()) {
    loadVocabularyMapPoints()
  }
})

watchDebounced([query, selectedSearchField, locationQuery], () => {
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

.search-input,
.local-filter-input {
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

.filter-input-wrapper {
  position: relative;
  flex: 1;
  min-width: 180px;
}

.filter-icon {
  position: absolute;
  top: 50%;
  left: 12px;
  color: var(--text-muted);
  transform: translateY(-50%);
}

.local-filter-input {
  padding-left: 34px;
}

.clear-filter-btn {
  position: absolute;
  top: 50%;
  right: 8px;
  width: 26px;
  height: 26px;
  color: var(--text-secondary);
  cursor: pointer;
  background: transparent;
  border: 0;
  transform: translateY(-50%);
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
.review-mode {
  padding: 16px;
}

.map-mode {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  min-height: 420px;
  overflow: hidden;
}

.map-placeholder {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  color: var(--text-secondary);
  background: var(--glass-10);
}

.map-placeholder span {
  font-size: 42px;
}

.map-side-panel {
  padding: 14px;
  overflow: auto;
  border-left: 1px solid var(--glass-20);
}

.map-result-item {
  display: flex;
  width: 100%;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 0;
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--glass-20);
}

.map-detail-list {
  display: grid;
  gap: 10px;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid var(--glass-20);
}

.map-detail-item {
  padding: 10px;
  background: var(--glass-10);
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-md, 8px);
}

.map-detail-item p {
  margin: 6px 0 0;
  color: var(--text-secondary);
}

.map-meta {
  margin: 0;
  font-size: 0.9rem;
}

.load-more-btn {
  display: flex;
  margin: 14px auto 0;
}

.upload-mode,
.review-mode {
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
.review-head,
.review-item {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
}

.upload-head h3,
.review-head h3 {
  margin: 0;
  font-size: 1.15rem;
}

.upload-head p,
.review-head p,
.review-item p {
  margin: 6px 0 0;
  color: var(--text-secondary);
}

.upload-file-input {
  display: none;
}

.review-badge {
  flex: 0 0 auto;
  padding: 4px 8px;
  color: var(--text-secondary);
  background: var(--glass-20);
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-sm, 6px);
}

.review-list {
  display: grid;
  gap: 10px;
}

.review-item {
  padding: 14px;
  background: var(--glass-10);
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-md, 8px);
}

.review-actions {
  display: flex;
  gap: 8px;
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
  .review-head,
  .review-item {
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

  .map-mode {
    grid-template-columns: 1fr;
  }

  .map-side-panel {
    border-top: 1px solid var(--glass-20);
    border-left: 0;
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
