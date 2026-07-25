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
                ref="searchFieldButton"
                class="field-filter-btn"
                type="button"
                @click="isSearchFieldOpen = !isSearchFieldOpen"
              >
                {{ selectedSearchFieldLabel }}
              </button>
              <MultiSelectDropdown
                v-if="isSearchFieldOpen"
                v-model="selectedSearchFields"
                :options="searchFieldOptions"
                :triggerEl="searchFieldButton"
                align="right"
                direction="down"
                @close="isSearchFieldOpen = false"
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

          <label class="sort-control">
            <span>{{ t('words.wordList.sort.label') }}</span>
            <select v-model="sortBy">
              <option v-for="option in sortOptions" :key="option.key" :value="option.key">
                {{ option.label }}
              </option>
            </select>
          </label>
        </div>
      </template>
    </div>

    <section v-if="activeWorkflow === 'list'" class="content-area">
      <div v-if="viewMode === 'card'" class="card-mode">
        <div class="cards-grid">
          <article
            v-for="entry in visibleEntries"
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
      </div>

      <div v-else-if="viewMode === 'table'" class="table-mode main-glass-panel">
        <div class="vocabulary-table ui-scrollbar" role="table" :aria-label="t('words.wordList.table.label')">
          <div class="vocabulary-table__row vocabulary-table__row--head" role="row">
            <span v-for="column in tableColumns" :key="column.key" role="columnheader">{{ column.label }}</span>
          </div>
          <div v-for="entry in visibleEntries" :key="entry.id" class="vocabulary-table__row" role="row">
            <span>{{ entry.headword }}</span>
            <span>{{ entry.definition }}</span>
            <span>{{ entry.pronunciation }}</span>
            <span>{{ entry.location }}</span>
            <span>{{ entry.detail }}</span>
          </div>
        </div>
      </div>

      <div v-else-if="viewMode === 'map'" class="map-mode main-glass-panel">
        <div class="map-placeholder">
          <span aria-hidden="true">🗺️</span>
          <p>{{ t('words.wordList.map.placeholder') }}</p>
        </div>
        <div class="map-result-list ui-scrollbar">
          <div v-for="entry in visibleEntries" :key="entry.id" class="map-result-item">
            <strong>{{ entry.headword }}</strong>
            <span>{{ entry.location }}</span>
          </div>
        </div>
      </div>
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
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import MultiSelectDropdown from '@/components/selector/MultiSelectDropdown.vue'
import TabularImportPreview from '@/components/import/TabularImportPreview.vue'
import { useTabularImportPreview } from '@/composables/import/useTabularImportPreview.js'
import { useTabularImportFlow } from '@/composables/import/useTabularImportFlow.js'

const { t } = useI18n()

const activeWorkflow = ref('list')
const query = ref('')
const locationQuery = ref('')
const viewMode = ref('card')
const sortBy = ref('location')
const selectedSearchFields = ref(['all'])
const isSearchFieldOpen = ref(false)
const searchFieldButton = ref(null)
const searchInputEl = ref(null)

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

const selectedSearchFieldLabel = computed(() => {
  if (selectedSearchFields.value.includes('all') || selectedSearchFields.value.length === 0) {
    return t('words.wordList.search.fields.all')
  }
  return t('words.wordList.search.fieldCount', { count: selectedSearchFields.value.length })
})

const sortOptions = computed(() => [
  { key: 'location', label: t('words.wordList.sort.location') },
  { key: 'definition', label: t('words.wordList.sort.definition') },
  { key: 'headword', label: t('words.wordList.sort.headword') },
  { key: 'updated_at', label: t('words.wordList.sort.updatedAt') }
])

const viewModes = computed(() => [
  { key: 'table', icon: '▤', label: t('words.wordList.viewModes.table') },
  { key: 'card', icon: '▦', label: t('words.wordList.viewModes.card') },
  { key: 'map', icon: '⌖', label: t('words.wordList.viewModes.map') }
])

const tableColumns = computed(() => [
  { key: 'headword', label: t('words.wordList.columns.headword') },
  { key: 'definition', label: t('words.wordList.columns.definition') },
  { key: 'pronunciation', label: t('words.wordList.columns.pronunciation') },
  { key: 'location', label: t('words.wordList.columns.location') },
  { key: 'detail', label: t('words.wordList.columns.detail') }
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

const previewEntries = computed(() => [
  {
    id: 'sample-1',
    headword: t('words.wordList.samples.one.headword'),
    definition: t('words.wordList.samples.one.definition'),
    pronunciation: t('words.wordList.samples.one.pronunciation'),
    pronunciationType: 'IPA',
    detail: t('words.wordList.samples.one.detail'),
    location: t('words.wordList.samples.one.location')
  },
  {
    id: 'sample-2',
    headword: t('words.wordList.samples.two.headword'),
    definition: t('words.wordList.samples.two.definition'),
    pronunciation: t('words.wordList.samples.two.pronunciation'),
    pronunciationType: 'IPA',
    detail: t('words.wordList.samples.two.detail'),
    location: t('words.wordList.samples.two.location')
  }
])

const visibleEntries = computed(() => {
  const place = locationQuery.value.trim().toLowerCase()
  const text = query.value.trim().toLowerCase()

  return previewEntries.value.filter((entry) => {
    const matchesLocation = !place || entry.location.toLowerCase().includes(place)
    const fields = selectedSearchFields.value.includes('all') || selectedSearchFields.value.length === 0
      ? ['definition', 'headword', 'pronunciation', 'detail', 'location']
      : selectedSearchFields.value
    const matchesText = !text || fields.some((field) => String(entry[field] ?? '').toLowerCase().includes(text))
    return matchesLocation && matchesText
  })
})

const reviewSubmissions = computed(() => [
  {
    id: 'pending-1',
    fileName: t('words.wordList.review.sampleFile'),
    meta: t('words.wordList.review.sampleMeta')
  }
])

function handleUploadFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  importFlow.loadPreview(file)
  event.target.value = ''
}

function handleConfirmUpload() {
  // Backend submission will be connected after the vocabulary API is implemented.
}
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
.local-filter-input,
.sort-control select {
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

.field-filter-btn {
  min-height: 40px;
  min-width: 116px;
  padding: 0 12px;
  color: var(--text-secondary);
  cursor: pointer;
  background: var(--glass-10);
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-md, 8px);
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

.sort-control {
  display: flex;
  flex: 0 0 220px;
  gap: 8px;
  align-items: center;
  color: var(--text-secondary);
  white-space: nowrap;
}

.content-area {
  width: min(100%, 1180px);
  margin: 0 auto;
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

.table-mode,
.map-mode,
.upload-mode,
.review-mode {
  padding: 16px;
}

.vocabulary-table {
  overflow: auto;
}

.vocabulary-table__row {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr 1fr 1.6fr;
  min-width: 760px;
  border-bottom: 1px solid var(--glass-20);
}

.vocabulary-table__row span {
  min-width: 0;
  padding: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vocabulary-table__row--head {
  position: sticky;
  top: 0;
  color: var(--text-secondary);
  font-weight: 600;
  background: var(--glass-20);
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

  .field-filter,
  .field-filter-btn,
  .sort-control {
    width: 100%;
  }

  .sort-control {
    flex: 1 1 auto;
    align-items: stretch;
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
