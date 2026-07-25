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
          <p>{{ t('words.wordList.map.placeholder', { count: mappableEntries.length }) }}</p>
        </div>
        <div class="map-result-list ui-scrollbar">
          <div v-for="entry in entries" :key="entry.id" class="map-result-item">
            <strong>{{ entry.headword }}</strong>
            <span>{{ entry.location }}</span>
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
        table-name="entries"
        :columns="tableColumns"
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
            <input class="upload-file-input" type="file" accept=".xlsx,.xls,.csv" @change="handleUploadFile" />
          </label>
        </div>

        <TabularImportPreview
          embedded
          :title="t('words.wordList.upload.previewTitle')"
          :description="t('words.wordList.upload.previewDesc')"
          :file="importFlow.pendingFile"
          :schema="importSchema"
          :loading="importPreview.loading"
          :preview-table="importPreview.previewTable"
          :diagnostics="importPreview.diagnostics"
          :mapping="importPreview.mapping"
          @update:mapping="importFlow.updateManualMapping"
          @reset="importFlow.clearPreview"
          @confirm="handleConfirmUpload"
        />
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
import { getVocabularyItems } from '@/api'
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
const total = ref(0)
const page = ref(1)
const pageSize = ref(50)
const isLoadingItems = ref(false)
const loadError = ref('')

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
  { key: 'definition', label: t('words.wordList.columns.definition'), filterable: false, width: 1.2 },
  { key: 'headword', label: t('words.wordList.columns.headword'), filterable: false, width: 1 },
  { key: 'pronunciation', label: t('words.wordList.columns.pronunciation'), filterable: false, width: 1.2 },
  { key: 'detail', label: t('words.wordList.columns.detail'), filterable: false, width: 1.6 },
  { key: 'location_name', label: t('words.wordList.columns.location'), filterable: true, width: 1 },
  { key: 'location', label: t('words.wordList.columns.locationFull'), filterable: true, width: 1.6 },
  { key: 'pronunciation_type', label: t('words.wordList.columns.pronunciationType'), filterable: true, width: 0.8 }
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
    key: 'location',
    label: t('words.wordList.columns.location'),
    required: true,
    aliases: ['地点', '地點', '方言点', 'location', 'place'],
    example: t('words.wordList.import.examples.location')
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
  return activeWorkflow.value === 'list' && viewMode.value !== 'table' && entries.value.length < total.value
})

const mappableEntries = computed(() => {
  return entries.value.filter((entry) => Number.isFinite(entry.longitude) && Number.isFinite(entry.latitude))
})

const reviewSubmissions = computed(() => [
  {
    id: 'pending-1',
    fileName: t('words.wordList.review.sampleFile'),
    meta: t('words.wordList.review.sampleMeta')
  }
])

function shouldUseVocabularyItemsApi() {
  return activeWorkflow.value === 'list' && viewMode.value !== 'table'
}

function parseLocationFilter(value) {
  return value
    .split(/[,，;；\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeNumber(value) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

function normalizeVocabularyEntry(item) {
  return {
    id: item.id,
    definition: item.definition || '',
    headword: item.headword || '',
    pronunciation: item.pronunciation || '',
    pronunciationType: item.pronunciation_type || '',
    detail: item.detail || '',
    location: item.location || item.location_name || '',
    locationName: item.location_name || '',
    longitude: normalizeNumber(item.longitude),
    latitude: normalizeNumber(item.latitude),
  }
}

function buildVocabularyItemsParams() {
  const params = {
    q: query.value.trim(),
    locations: parseLocationFilter(locationQuery.value),
    page: page.value,
    page_size: pageSize.value,
  }

  if (selectedSearchField.value !== 'all') {
    params.search_fields = selectedSearchField.value
  }

  return params
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

function handleUploadFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  importFlow.loadPreview(file)
  event.target.value = ''
}

function handleConfirmUpload() {
  // Backend submission will be connected after the vocabulary API is implemented.
}

onMounted(() => {
  loadVocabularyItems()
})

watch([activeWorkflow, viewMode], () => {
  if (shouldUseVocabularyItemsApi()) {
    loadVocabularyItems()
  }
})

watchDebounced([query, selectedSearchField, locationQuery], () => {
  if (shouldUseVocabularyItemsApi()) {
    loadVocabularyItems()
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
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}

.card {
  padding: 14px 16px;
  background: var(--glass-10);
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-lg, 8px);
}

.card-row {
  display: flex;
  gap: 10px;
  align-items: baseline;
  justify-content: space-between;
}

.row-2,
.row-3,
.row-4 {
  margin-top: 10px;
}

.location-chain,
.category-chain,
.pronunciation-text,
.memo-text {
  color: var(--text-secondary);
}

.category-chain {
  flex: 0 0 auto;
  padding: 2px 7px;
  font-size: 0.82rem;
  background: var(--glass-20);
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-sm, 6px);
}

.word-text {
  font-size: 1.45rem;
  font-weight: 700;
}

.definition-text {
  font-weight: 600;
}

.memo-text {
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

.map-result-list {
  padding: 14px;
  overflow: auto;
  border-left: 1px solid var(--glass-20);
}

.map-result-item {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--glass-20);
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

  .map-mode {
    grid-template-columns: 1fr;
  }

  .map-result-list {
    border-top: 1px solid var(--glass-20);
    border-left: 0;
  }
}
</style>
