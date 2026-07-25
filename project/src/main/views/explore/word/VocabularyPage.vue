<template>
  <section class="vocabulary-page">
    <header class="vocabulary-page__header main-glass-panel">
      <div class="vocabulary-page__title-block">
        <span class="vocabulary-page__icon" aria-hidden="true">📒</span>
        <div>
          <h2 class="vocabulary-page__title">{{ t('words.wordList.name') }}</h2>
          <p class="vocabulary-page__desc">{{ t('words.wordList.desc') }}</p>
        </div>
      </div>

      <div class="vocabulary-page__tabs" role="tablist" :aria-label="t('words.wordList.tabs.label')">
        <button
          v-for="tab in workflowTabs"
          :key="tab.key"
          class="vocabulary-page__tab"
          :class="{ 'is-active': activeWorkflow === tab.key }"
          type="button"
          role="tab"
          :aria-selected="activeWorkflow === tab.key"
          @click="activeWorkflow = tab.key"
        >
          <span aria-hidden="true">{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
        </button>
      </div>
    </header>

    <section v-if="activeWorkflow === 'list'" class="vocabulary-workspace">
      <div class="vocabulary-toolbar main-glass-panel">
        <div class="vocabulary-toolbar__search">
          <label class="vocabulary-toolbar__label" for="vocabulary-search">
            {{ t('words.wordList.search.label') }}
          </label>
          <div class="vocabulary-toolbar__search-row">
            <textarea
              id="vocabulary-search"
              v-model="query"
              class="vocabulary-toolbar__input"
              rows="1"
              :placeholder="t('words.wordList.search.placeholder')"
            ></textarea>

            <button
              ref="searchFieldButton"
              class="main-glass-button vocabulary-toolbar__field-btn"
              data-variant="secondary"
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

        <div class="vocabulary-toolbar__filters">
          <div class="vocabulary-toolbar__location">
            <LocationAndRegionInput
              v-model="locationFilter"
              limit-context="default"
            />
          </div>

          <div class="vocabulary-toolbar__side-controls">
            <label class="vocabulary-toolbar__label" for="vocabulary-sort">
              {{ t('words.wordList.sort.label') }}
            </label>
            <select id="vocabulary-sort" v-model="sortBy" class="vocabulary-toolbar__select">
              <option v-for="option in sortOptions" :key="option.key" :value="option.key">
                {{ option.label }}
              </option>
            </select>

            <div class="vocabulary-toolbar__view-modes" :aria-label="t('words.wordList.viewModes.label')">
              <button
                v-for="mode in viewModes"
                :key="mode.key"
                class="vocabulary-toolbar__mode"
                :class="{ 'is-active': viewMode === mode.key }"
                type="button"
                :title="mode.label"
                @click="viewMode = mode.key"
              >
                <span aria-hidden="true">{{ mode.icon }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="viewMode === 'card'" class="vocabulary-results vocabulary-results--cards">
        <article
          v-for="entry in previewEntries"
          :key="entry.id"
          class="vocabulary-card main-glass-panel"
        >
          <div class="vocabulary-card__head">
            <div>
              <h3>{{ entry.headword }}</h3>
              <p>{{ entry.pronunciation }}</p>
            </div>
            <span>{{ entry.pronunciationType }}</span>
          </div>
          <p class="vocabulary-card__definition">{{ entry.definition }}</p>
          <p class="vocabulary-card__detail">{{ entry.detail }}</p>
          <div class="vocabulary-card__meta">
            <span>{{ entry.location }}</span>
            <span>{{ entry.updatedAt }}</span>
          </div>
        </article>
      </div>

      <div v-else-if="viewMode === 'table'" class="vocabulary-results main-glass-panel">
        <div class="vocabulary-table ui-scrollbar" role="table" :aria-label="t('words.wordList.table.label')">
          <div class="vocabulary-table__row vocabulary-table__row--head" role="row">
            <span v-for="column in tableColumns" :key="column.key" role="columnheader">{{ column.label }}</span>
          </div>
          <div v-for="entry in previewEntries" :key="entry.id" class="vocabulary-table__row" role="row">
            <span>{{ entry.headword }}</span>
            <span>{{ entry.definition }}</span>
            <span>{{ entry.pronunciation }}</span>
            <span>{{ entry.location }}</span>
            <span>{{ entry.detail }}</span>
          </div>
        </div>
      </div>

      <div v-else-if="viewMode === 'map'" class="vocabulary-results vocabulary-map main-glass-panel">
        <div class="vocabulary-map__placeholder">
          <span aria-hidden="true">🗺️</span>
          <p>{{ t('words.wordList.map.placeholder') }}</p>
        </div>
        <div class="vocabulary-map__list">
          <div v-for="entry in previewEntries" :key="entry.id" class="vocabulary-map__item">
            <strong>{{ entry.headword }}</strong>
            <span>{{ entry.location }}</span>
          </div>
        </div>
      </div>
    </section>

    <section v-else-if="activeWorkflow === 'upload'" class="vocabulary-workspace">
      <div class="vocabulary-upload main-glass-panel">
        <div class="vocabulary-upload__intro">
          <h3>{{ t('words.wordList.upload.title') }}</h3>
          <p>{{ t('words.wordList.upload.desc') }}</p>
          <label class="main-glass-button" data-variant="primary">
            {{ t('words.wordList.upload.chooseFile') }}
            <input class="vocabulary-upload__file" type="file" accept=".xlsx,.xls,.csv" @change="handleUploadFile" />
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

    <section v-else-if="activeWorkflow === 'review'" class="vocabulary-workspace">
      <div class="vocabulary-review main-glass-panel">
        <div class="vocabulary-review__head">
          <div>
            <h3>{{ t('words.wordList.review.title') }}</h3>
            <p>{{ t('words.wordList.review.desc') }}</p>
          </div>
          <span class="vocabulary-review__badge">{{ t('words.wordList.review.permissionBadge') }}</span>
        </div>

        <div class="vocabulary-review__list">
          <article v-for="submission in reviewSubmissions" :key="submission.id" class="vocabulary-review__item">
            <div>
              <strong>{{ submission.fileName }}</strong>
              <p>{{ submission.meta }}</p>
            </div>
            <div class="vocabulary-review__actions">
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
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import MultiSelectDropdown from '@/components/selector/MultiSelectDropdown.vue'
import TabularImportPreview from '@/components/import/TabularImportPreview.vue'
import { useTabularImportPreview } from '@/composables/import/useTabularImportPreview.js'
import { useTabularImportFlow } from '@/composables/import/useTabularImportFlow.js'
import LocationAndRegionInput from '@/main/components/geo/LocationAndRegionInput.vue'

const { t } = useI18n()

const activeWorkflow = ref('list')
const query = ref('')
const viewMode = ref('card')
const sortBy = ref('location')
const selectedSearchFields = ref(['all'])
const isSearchFieldOpen = ref(false)
const searchFieldButton = ref(null)
const locationFilter = ref({ locations: [], regions: [], regionUsing: 'map' })

const workflowTabs = computed(() => [
  { key: 'list', icon: '🔍', label: t('words.wordList.tabs.list') },
  { key: 'upload', icon: '⬆️', label: t('words.wordList.tabs.upload') },
  { key: 'review', icon: '✓', label: t('words.wordList.tabs.review') }
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
  { key: 'card', icon: '▦', label: t('words.wordList.viewModes.card') },
  { key: 'table', icon: '☷', label: t('words.wordList.viewModes.table') },
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
    location: t('words.wordList.samples.one.location'),
    updatedAt: '2026-07-25'
  },
  {
    id: 'sample-2',
    headword: t('words.wordList.samples.two.headword'),
    definition: t('words.wordList.samples.two.definition'),
    pronunciation: t('words.wordList.samples.two.pronunciation'),
    pronunciationType: 'IPA',
    detail: t('words.wordList.samples.two.detail'),
    location: t('words.wordList.samples.two.location'),
    updatedAt: '2026-07-25'
  }
])

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
  width: min(100%, 1180px);
  margin: 0 auto;
  padding: 20px;
  color: var(--text-primary);
}

.vocabulary-page__header {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 18px;
}

.vocabulary-page__title-block {
  display: flex;
  min-width: 0;
  gap: 14px;
  align-items: center;
}

.vocabulary-page__icon {
  display: inline-grid;
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  place-items: center;
  font-size: 26px;
  background: var(--glass-20);
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-md, 8px);
}

.vocabulary-page__title {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 700;
}

.vocabulary-page__desc {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.vocabulary-page__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.vocabulary-page__tab {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  min-height: 36px;
  padding: 0 12px;
  color: var(--text-secondary);
  cursor: pointer;
  background: var(--glass-10);
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-md, 8px);
}

.vocabulary-page__tab.is-active {
  color: var(--text-primary);
  background: var(--glass-30);
  border-color: var(--color-primary-hover);
}

.vocabulary-workspace {
  margin-top: 16px;
}

.vocabulary-toolbar {
  display: grid;
  gap: 16px;
  padding: 18px;
}

.vocabulary-toolbar__label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.vocabulary-toolbar__search-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
}

.vocabulary-toolbar__input,
.vocabulary-toolbar__select {
  width: 100%;
  min-height: 40px;
  padding: 10px 12px;
  color: var(--text-primary);
  background: var(--glass-10);
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-md, 8px);
}

.vocabulary-toolbar__input {
  resize: vertical;
}

.vocabulary-toolbar__field-btn {
  min-width: 116px;
}

.vocabulary-toolbar__filters {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 16px;
  align-items: start;
}

.vocabulary-toolbar__side-controls {
  display: grid;
  gap: 10px;
}

.vocabulary-toolbar__view-modes {
  display: flex;
  gap: 6px;
}

.vocabulary-toolbar__mode {
  display: inline-grid;
  width: 38px;
  height: 38px;
  place-items: center;
  color: var(--text-secondary);
  cursor: pointer;
  background: var(--glass-10);
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-md, 8px);
}

.vocabulary-toolbar__mode.is-active {
  color: var(--text-primary);
  background: var(--glass-30);
  border-color: var(--color-primary-hover);
}

.vocabulary-results {
  margin-top: 16px;
}

.vocabulary-results--cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}

.vocabulary-card {
  padding: 16px;
}

.vocabulary-card__head,
.vocabulary-card__meta {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.vocabulary-card__head h3 {
  margin: 0;
  font-size: 1.35rem;
}

.vocabulary-card__head p,
.vocabulary-card__detail,
.vocabulary-card__meta {
  color: var(--text-secondary);
}

.vocabulary-card__head p {
  margin: 4px 0 0;
}

.vocabulary-card__head span,
.vocabulary-review__badge {
  flex: 0 0 auto;
  padding: 4px 8px;
  color: var(--text-secondary);
  background: var(--glass-20);
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-sm, 6px);
}

.vocabulary-card__definition {
  margin: 14px 0 8px;
  font-weight: 600;
}

.vocabulary-card__detail {
  margin: 0;
  line-height: 1.6;
}

.vocabulary-card__meta {
  margin-top: 14px;
  font-size: 0.88rem;
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

.vocabulary-map {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  min-height: 420px;
  overflow: hidden;
}

.vocabulary-map__placeholder {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  color: var(--text-secondary);
  background: var(--glass-10);
}

.vocabulary-map__placeholder span {
  font-size: 42px;
}

.vocabulary-map__list {
  padding: 14px;
  border-left: 1px solid var(--glass-20);
}

.vocabulary-map__item {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--glass-20);
}

.vocabulary-upload,
.vocabulary-review {
  display: grid;
  gap: 16px;
  padding: 18px;
}

.vocabulary-upload__intro h3,
.vocabulary-review__head h3 {
  margin: 0;
  font-size: 1.15rem;
}

.vocabulary-upload__intro p,
.vocabulary-review__head p,
.vocabulary-review__item p {
  margin: 6px 0 0;
  color: var(--text-secondary);
}

.vocabulary-upload__file {
  display: none;
}

.vocabulary-review__head,
.vocabulary-review__item {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
}

.vocabulary-review__list {
  display: grid;
  gap: 10px;
}

.vocabulary-review__item {
  padding: 14px;
  background: var(--glass-10);
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-md, 8px);
}

.vocabulary-review__actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
  .vocabulary-page {
    padding: 14px;
  }

  .vocabulary-page__header,
  .vocabulary-review__head,
  .vocabulary-review__item {
    align-items: stretch;
    flex-direction: column;
  }

  .vocabulary-toolbar__search-row,
  .vocabulary-toolbar__filters,
  .vocabulary-map {
    grid-template-columns: 1fr;
  }

  .vocabulary-toolbar__field-btn {
    width: 100%;
  }

  .vocabulary-map__list {
    border-top: 1px solid var(--glass-20);
    border-left: 0;
  }
}
</style>
