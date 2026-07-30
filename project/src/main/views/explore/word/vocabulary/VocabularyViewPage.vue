<template>
  <div class="vocabulary-view-page">
    <VocabularyTopControls
      v-model:query="query"
      v-model:selected-search-fields="selectedSearchFields"
      v-model:selected-locations="selectedLocations"
      v-model:selected-standard-word="selectedStandardWord"
      v-model:selected-standard-words="selectedStandardWordsModel"
      v-model:single-select="singleSelect"
      v-model:view-mode="viewMode"
      :search-field-options="searchFieldOptions"
      :location-options="locationOptions"
      :standard-word-options="standardWordOptions"
      :view-modes="viewModes"
    />

    <section v-if="viewMode !== 'table'" class="content-area">
      <div v-if="isInitialLoading" class="loading-state loading-state-base">
        <div class="ui-loading--page" aria-hidden="true"></div>
        <span>{{ t('words.wordList.states.loadingCards') }}</span>
      </div>

      <div v-else-if="loadError && !entries.length" class="empty-state empty-state-base">
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
          <p>{{ t('words.wordList.states.noData') }}</p>
        </div>
      </div>

      <div v-else-if="viewMode === 'map'" class="map-mode">
        <div v-if="isInitialLoading" class="empty-state empty-state-base map-empty-state">
          <div class="ui-loading--page" aria-hidden="true"></div>
          <span>{{ t('words.wordList.states.loadingData') }}</span>
        </div>
        <div v-else-if="loadError && !mapDataForVocabularyMap.length" class="empty-state empty-state-base map-empty-state">
          <p>{{ loadError }}</p>
        </div>
        <div v-else class="map-canvas-shell">
          <VocabularyMap
            v-if="mapDataForVocabularyMap.length"
            :map-data="mapDataForVocabularyMap"
            active-tab="vocabulary"
            v-model:display-mode="mapDisplayMode"
            @marker-click="handleMapPointClick"
          />
          <div v-else class="empty-state empty-state-base map-empty-state">
            <p>{{ t('words.wordList.states.noData') }}</p>
          </div>
        </div>
      </div>

      <button
        v-if="canLoadMore"
        class="load-more-btn main-glass-button"
        data-variant="secondary"
        type="button"
        :disabled="isLoadingMore"
        @click="loadVocabularyItems({ append: true })"
      >
        <template v-if="isLoadingMore">
          <span class="btn-loading-dot" aria-hidden="true"></span>
          {{ t('words.wordList.states.loadingData') }}
        </template>
        <template v-else>
          {{ t('words.wordList.states.loadingMore') }}
        </template>
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
      :close-label="t('common.button.close')"
      @close="clearMapDetailModal"
    >
      <div class="map-detail-modal">
        <p class="map-meta" v-if="mapDetailEntries.length">
          {{ t('words.wordList.map.pointCount', { count: mapDetailEntries.length }) }}
        </p>
        <div v-if="isLoadingMapDetail && !mapDetailEntries.length" class="loading-state loading-state-base">
          <div class="ui-loading--page" aria-hidden="true"></div>
          <span>{{ t('words.wordList.states.loadingData') }}</span>
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
            <p v-if="!selectedStandardWords.length">{{ entry.definition }}</p>
            <small v-if="entry.information">{{ entry.information }}</small>
          </article>
          <button
            v-if="canLoadMoreMapDetail"
            class="load-more-btn main-glass-button"
            data-variant="secondary"
            type="button"
            :disabled="isLoadingMapDetail"
            @click="loadMoreMapDetail"
          >
            <template v-if="isLoadingMapDetail">
              <span class="btn-loading-dot" aria-hidden="true"></span>
              {{ t('words.wordList.states.loadingData') }}
            </template>
            <template v-else>
              {{ t('words.wordList.states.loadingMore') }}
            </template>
          </button>
        </div>
        <div v-else class="empty-state empty-state-base">
          <p>{{ t('words.wordList.states.noData') }}</p>
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
  getVocabularyMapItems,
  getVocabularyMapPoints,
  getVocabularyStandardWords
} from '@/api'
import AppModal from '@/components/common/AppModal.vue'
import UniversalTable from '@/main/components/TableAndTree/UniversalTable.vue'
import VocabularyMap from '@/main/components/map/VocabularyMap.vue'
import VocabularyTopControls from './VocabularyTopControls.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const STANDARD_WORD_OPTIONS_LIMIT = 200

const props = defineProps({
  vocabularyMe: { type: Object, default: null },
  isLoadingVocabularyMe: { type: Boolean, default: false },
  vocabularyMeError: { type: String, default: '' },
})

const query = ref('')
const viewMode = ref(normalizeViewMode(route.query.tab))
const selectedSearchFields = ref([])
const selectedLocations = ref([])
const selectedStandardWord = ref('')
const singleSelect = ref(true)
const selectedStandardWordsModel = ref([])
const selectedStandardWords = computed(() => {
  if (singleSelect.value) {
    return selectedStandardWord.value ? [selectedStandardWord.value] : []
  }
  return selectedStandardWordsModel.value
})
const mapDisplayMode = ref('overview')
const vocabularyLocationOptions = ref([])
const vocabularyStandardWordOptions = ref([])
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
const mapDetailTotal = ref(0)
const mapDetailPage = ref(1)
const selectedMapPointLabel = ref('')
const activeMapPointLocations = ref([])
const activeMapPointBaseLabel = ref('')


const searchFieldOptions = computed(() => [
  { value: 'definition', label: t('words.wordList.search.fields.definition') },
  { value: 'headword', label: t('words.wordList.search.fields.headword') },
  { value: 'pronunciation', label: t('words.wordList.search.fields.ipa') },
  { value: 'detail', label: t('words.wordList.search.fields.notes') }
])

const locationOptions = computed(() => {
  return vocabularyLocationOptions.value
})

const standardWordOptions = computed(() => {
  if (!vocabularyStandardWordOptions.value.length) {
    return []
  }

  return [
    { value: '', label: t('words.wordList.search.standardWordPlaceholder') },
    ...vocabularyStandardWordOptions.value,
  ]
})

const isInitialLoading = computed(() => isLoadingItems.value && !entries.value.length && !loadError.value)
const isLoadingMore = computed(() => isLoadingItems.value && entries.value.length > 0)

const canLoadMore = computed(() => {
  return shouldUseVocabularyItemsApi() && !isLoadingItems.value && entries.value.length < total.value
})

const canLoadMoreMapDetail = computed(() => {
  return !isLoadingMapDetail.value && mapDetailEntries.value.length < mapDetailTotal.value
})

const viewModes = computed(() => [
  { key: 'card', icon: '▦', label: t('words.wordList.viewModes.card') },
  { key: 'map', icon: '⌖', label: t('words.wordList.viewModes.map') },
  { key: 'table', icon: '▤', label: t('words.wordList.viewModes.table') },
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

watch(viewMode, (nextMode) => {
  router.replace({
    query: {
      ...route.query,
      tab: nextMode,
    }
  })
})

const mapDataForVocabularyMap = computed(() => {
  return mapPoints.value
    .filter((point) => Number.isFinite(point.longitude) && Number.isFinite(point.latitude))
    .map((point) => ({
      longitude: point.longitude,
      latitude: point.latitude,
      entryCount: point.entryCount,
      locationName: point.locationName,
      location: point.locationName,
      county: point.locationName,
      province: point.locationLabel,
      pronunciation: point.pronunciation || point.markerLabel,
      localExpression: point.localExpression || '',
      standardWord: point.definition || '',
      items: point.items || [],
    }))
})

function shouldUseVocabularyItemsApi() {
  return viewMode.value === 'card'
}

function shouldUseVocabularyMapPointsApi() {
  return viewMode.value === 'map' && !selectedStandardWords.value.length
}

function shouldUseVocabularyMapItemsApi() {
  return viewMode.value === 'map' && selectedStandardWords.value.length > 0
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

function normalizeVocabularyEntry(item, index = 0, locationContext = '') {
  const detailParts = [item.notes, item.informations, item.detail]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
  const locationName = item.location_name || locationContext || ''
  const entryKey = [
    locationName,
    item.standard_word || item.definition || '',
    item.local_expression || item.headword || '',
    item.ipa || item.pronunciation || '',
    item.notes || item.detail || '',
    item.informations || '',
    index,
  ].join('|')

  return {
    id: item.id || entryKey,
    definition: item.standard_word || item.definition || '',
    headword: item.local_expression || item.headword || '',
    pronunciation: item.ipa || item.pronunciation || '',
    pronunciationType: item.pronunciation_type || '',
    detail: [...new Set(detailParts)].join(' · '),
    information: item.informations || '',
    location: item.location_label || item.location || item.location_name || '',
    locationName,
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

function buildVocabularyStandardWordsParams() {
  return {
    ...buildVocabularyQueryParams(),
    limit: STANDARD_WORD_OPTIONS_LIMIT,
  }
}

function buildVocabularyMapItemsParams() {
  return {
    ...buildVocabularyQueryParams(),
    standard_words: selectedStandardWords.value,
  }
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

function normalizeVocabularyMapItemPoint(point) {
  const normalizedPoint = normalizeVocabularyMapPoint(point)
  const items = Array.isArray(point.items)
    ? point.items.map((item, index) => normalizeVocabularyEntry(item, index, normalizedPoint.locationName))
    : []
  const pronunciations = items.map((item) => item.pronunciation).filter(Boolean)
  const definitions = items.map((item) => item.definition).filter(Boolean)
  const localExpressions = items.map((item) => item.headword).filter(Boolean)

  return {
    ...normalizedPoint,
    entryCount: Number(point.entry_count) || items.length || normalizedPoint.entryCount,
    pronunciation: [...new Set(pronunciations)].join(' / '),
    definition: [...new Set(definitions)].join(' / '),
    localExpression: [...new Set(localExpressions)].join(' / '),
    items,
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
    const nextEntries = Array.isArray(response.items) ? response.items.map((item, index) => normalizeVocabularyEntry(item, index)) : []
    entries.value = append ? entries.value.concat(nextEntries) : nextEntries
    total.value = Number(response.total) || entries.value.length
    page.value = Number(response.page) || nextPage
    pageSize.value = Number(response.page_size) || pageSize.value
  } catch (error) {
    loadError.value = error.message || t('words.wordList.states.loadItemsFailed')
    if (!append) {
      entries.value = []
      total.value = 0
    }
  } finally {
    isLoadingItems.value = false
  }
}

async function loadVocabularyMapPoints() {
  if (!shouldUseVocabularyMapPointsApi() && !shouldUseVocabularyMapItemsApi()) {
    return
  }

  isLoadingItems.value = true
  loadError.value = ''
  entries.value = []
  total.value = 0

  try {
    const shouldLoadMapItems = shouldUseVocabularyMapItemsApi()
    const response = shouldLoadMapItems
      ? await getVocabularyMapItems(buildVocabularyMapItemsParams())
      : await getVocabularyMapPoints(buildVocabularyMapPointsParams())
    mapPoints.value = Array.isArray(response.points)
      ? response.points.map(shouldLoadMapItems ? normalizeVocabularyMapItemPoint : normalizeVocabularyMapPoint)
      : []
    mapStats.value = {
      totalEntries: Number(response.total_entries) || 0,
      totalPoints: Number(response.total_points) || mapPoints.value.length,
      omittedWithoutCoordinates: Number(response.omitted_without_coordinates) || 0,
    }
  } catch (error) {
    loadError.value = error.message || t('words.wordList.states.loadMapFailed')
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

async function loadVocabularyStandardWords() {
  try {
    const response = await getVocabularyStandardWords(buildVocabularyStandardWordsParams())
    const standardWords = Array.isArray(response.standard_words) ? response.standard_words : []
    vocabularyStandardWordOptions.value = standardWords
      .map((item) => {
        const standardWord = String(item.standard_word || '').trim()
        if (!standardWord) {
          return null
        }

        const entryCount = Number(item.entry_count) || 0
        const locationCount = Number(item.location_count) || 0
        return {
          value: standardWord,
          label: `${standardWord}（${entryCount} / ${locationCount}）`,
        }
      })
      .filter(Boolean)
    const optionValues = new Set(vocabularyStandardWordOptions.value.map((option) => option.value))
    if (selectedStandardWord.value && !optionValues.has(selectedStandardWord.value)) {
      selectedStandardWord.value = ''
    }
    selectedStandardWordsModel.value = selectedStandardWordsModel.value.filter((value) => optionValues.has(value))
  } catch {
    vocabularyStandardWordOptions.value = []
    selectedStandardWord.value = ''
  }
}

function buildMapDetailTitle(baseLabel, count) {
  const parts = [baseLabel]
  if (selectedStandardWords.value.length > 0) {
    parts.push(selectedStandardWords.value.join('、'))
  }
  parts.push(t('words.wordList.map.pointCount', { count }))
  return parts.join(' · ')
}

async function handleMapPointClick(point) {
  const locations = normalizeMapPointLocations(point)

  if (!locations.length) {
    return
  }

  const baseLabel = point.locationLabel || point.locationName || locations[0]
  activeMapPointBaseLabel.value = baseLabel
  isMapDetailModalOpen.value = true
  isLoadingMapDetail.value = true
  mapDetailError.value = ''
  mapDetailEntries.value = []
  mapDetailTotal.value = 0
  mapDetailPage.value = 1
  activeMapPointLocations.value = locations

  // map-items mode: count entries from the matching points directly
  if (selectedStandardWords.value.length > 0) {
    const locationSet = new Set(locations)
    const matchingPoints = mapPoints.value.filter((p) => locationSet.has(p.locationName))
    const allItems = matchingPoints.flatMap((p) => (Array.isArray(p.items) ? p.items : []))
    mapDetailEntries.value = allItems
    mapDetailTotal.value = allItems.length
    selectedMapPointLabel.value = buildMapDetailTitle(baseLabel, allItems.length)
    isLoadingMapDetail.value = false
    return
  }

  // overview mode: fetch entries, then set title with real count
  try {
    const response = await getVocabularyItems({
      ...buildVocabularyQueryParams(),
      locations,
      page: 1,
      page_size: pageSize.value,
    })
    mapDetailEntries.value = Array.isArray(response.items) ? response.items.map((item, index) => normalizeVocabularyEntry(item, index)) : []
    mapDetailTotal.value = Number(response.total) || mapDetailEntries.value.length
    mapDetailPage.value = Number(response.page) || 1
    selectedMapPointLabel.value = buildMapDetailTitle(baseLabel, mapDetailEntries.value.length)
  } catch (error) {
    mapDetailError.value = error.message || t('words.wordList.states.loadItemsFailed')
    mapDetailEntries.value = []
  } finally {
    isLoadingMapDetail.value = false
  }
}

async function loadMoreMapDetail() {
  if (isLoadingMapDetail.value || mapDetailEntries.value.length >= mapDetailTotal.value) {
    return
  }

  const nextPage = mapDetailPage.value + 1
  isLoadingMapDetail.value = true

  try {
    const response = await getVocabularyItems({
      ...buildVocabularyQueryParams(),
      locations: activeMapPointLocations.value,
      page: nextPage,
      page_size: pageSize.value,
    })
    const nextEntries = Array.isArray(response.items)
      ? response.items.map((item, index) => normalizeVocabularyEntry(item, mapDetailEntries.value.length + index))
      : []
    mapDetailEntries.value = mapDetailEntries.value.concat(nextEntries)
    mapDetailTotal.value = Number(response.total) || mapDetailEntries.value.length
    mapDetailPage.value = Number(response.page) || nextPage
    selectedMapPointLabel.value = buildMapDetailTitle(activeMapPointBaseLabel.value, mapDetailEntries.value.length)
  } catch (error) {
    mapDetailError.value = error.message || t('words.wordList.states.loadItemsFailed')
  } finally {
    isLoadingMapDetail.value = false
  }
}

function clearMapDetailModal() {
  selectedMapPointLabel.value = ''
  mapDetailError.value = ''
  activeMapPointLocations.value = []
  activeMapPointBaseLabel.value = ''
}

function loadActiveViewMode() {
  if (shouldUseVocabularyItemsApi()) {
    loadVocabularyItems()
  } else if (shouldUseVocabularyMapPointsApi()) {
    loadVocabularyMapPoints()
  } else if (shouldUseVocabularyMapItemsApi()) {
    loadVocabularyMapPoints()
  }
}

onMounted(() => {
  loadVocabularyLocationOptions()
  loadVocabularyStandardWords()
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
  loadVocabularyStandardWords()

  if (shouldUseVocabularyItemsApi()) {
    loadVocabularyItems()
  } else if (shouldUseVocabularyMapPointsApi()) {
    loadVocabularyMapPoints()
  } else if (shouldUseVocabularyMapItemsApi()) {
    loadVocabularyMapPoints()
  }
}, { debounce: 250, maxWait: 800 })

watch(singleSelect, (isSingle) => {
  if (isSingle) {
    selectedStandardWord.value = selectedStandardWordsModel.value[0] || ''
  } else {
    selectedStandardWordsModel.value = selectedStandardWord.value ? [selectedStandardWord.value] : []
  }
})

watch(selectedStandardWords, (words) => {
  if (mapDisplayMode.value === 'overview' && words.length) {
    mapDisplayMode.value = 'definition'
  } else if (!words.length && !['overview', 'location'].includes(mapDisplayMode.value)) {
    mapDisplayMode.value = 'overview'
  }
  if (shouldUseVocabularyMapPointsApi() || shouldUseVocabularyMapItemsApi()) {
    loadVocabularyMapPoints()
  }
})
</script>

<style scoped lang="scss" src="./vocabulary.scss"></style>
