<template>
  <div class="vocabulary-view-page">
    <VocabularyTopControls
      v-model:query="query"
      v-model:selected-search-fields="selectedSearchFields"
      v-model:selected-locations="selectedLocations"
      v-model:selected-standard-word="selectedStandardWord"
      v-model:selected-standard-words="selectedStandardWordsModel"
      v-model:single-select="singleSelect"
      v-model:filter-by-region="filterByRegion"
      v-model:selected-province="selectedProvince"
      v-model:selected-city="selectedCity"
      :view-mode="viewMode"
      :search-field-options="searchFieldOptions"
      :location-options="locationOptions"
      :standard-word-options="standardWordOptions"
      :province-options="provinceOptions"
      :city-options="cityOptions"
      @open-location-details="openLocationDetails"
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
            class="card glass-card vocabulary-entry-card"
            :class="{ 'is-note-expanded': isVocabularyCardNoteExpanded(entry.id) }"
          >
            <div class="card-location">
              {{ entry.location }}
            </div>
            <div class="card-definition">
              {{ entry.definition }}
            </div>
            <div class="card-pronunciation-pair">
              <span class="pronunciation-text">{{ entry.pronunciation }}</span>
              <span class="word-text">{{ entry.headword }}</span>
            </div>
            <div class="card-note">
              <span class="card-note-text">{{ entry.detail }}</span>
              <button
                v-if="entry.detail"
                class="card-note-toggle"
                :class="{ 'is-expanded': isVocabularyCardNoteExpanded(entry.id) }"
                type="button"
                :aria-expanded="isVocabularyCardNoteExpanded(entry.id)"
                @click="toggleVocabularyCardNote(entry.id)"
              >
                <span aria-hidden="true">&rsaquo;</span>
              </button>
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
        class="load-more-btn glass-button"
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

    <section v-else-if="viewMode === 'table'">
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
        <dl v-if="mapDetailMetaRows.length" class="map-detail-meta">
          <div v-for="row in mapDetailMetaRows" :key="row.key" class="map-detail-meta-item">
            <dt v-if="row.label" class="map-detail-meta-label">{{ row.label }}</dt>
            <dd class="map-detail-meta-value" :class="{ 'map-detail-meta-value--tones': row.tones }">
              <template v-if="row.tones">
                <span v-for="tone in row.tones" :key="tone.key" class="tone-pill">
                  <span class="tone-pill-name">{{ tone.name }}</span>
                  <span class="tone-pill-value">{{ tone.value }}</span>
                </span>
              </template>
              <template v-else>{{ row.value }}</template>
            </dd>
          </div>
        </dl>
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
            class="load-more-btn glass-button"
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

    <AppModal
      v-model="isLocationDetailsModalOpen"
      size="lg"
      width="720px"
      max-height="80dvh"
      :title="t('words.wordList.search.locationDetails')"
      :close-label="t('common.button.close')"
      @close="clearLocationDetailsModal"
    >
      <div class="location-details-modal">
        <div v-if="isLoadingLocationDetails && !locationDetailsSourcePoints.length" class="loading-state loading-state-base">
          <div class="ui-loading--page" aria-hidden="true"></div>
          <span>{{ t('words.wordList.states.loadingData') }}</span>
        </div>
        <div v-else-if="locationDetailsError" class="empty-state empty-state-base">
          <p>{{ locationDetailsError }}</p>
        </div>
        <template v-else-if="locationDetailsSourcePoints.length">
          <div class="location-details-toolbar">
            <input
              v-model="locationDetailsSearchQuery"
              class="location-details-search glass-field"
              type="search"
              :placeholder="t('words.wordList.search.locationDetailsSearchPlaceholder')"
            />
            <button
              class="location-details-sort-btn"
              :class="{ active: locationDetailsSortByRegion }"
              type="button"
              :title="t('words.wordList.search.locationDetailsSortByRegion')"
              @click="locationDetailsSortByRegion = !locationDetailsSortByRegion"
            >
              <svg
                class="location-details-sort-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M7 4v14m0 0 3-3m-3 3-3-3M17 20V6m0 0-3 3m3-3 3 3"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                />
              </svg>
            </button>
          </div>
          <div v-if="locationDetailsDisplayPoints.length" class="location-details-list">
            <article
              v-for="(point, index) in locationDetailsDisplayPoints"
              :key="`${point.locationName}-${index}`"
              class="location-details-item"
            >
              <button
                class="location-details-head"
                type="button"
                :aria-expanded="expandedLocationKeys.has(point.locationName)"
                @click="toggleLocationDetail(point.locationName)"
              >
                <span class="location-details-name">{{ point.locationLabel || point.locationName }}</span>
                <span class="location-details-count">{{ t('words.wordList.map.pointCount', { count: point.entryCount || 0 }) }}</span>
                <span
                  class="location-details-chevron"
                  :class="{ 'is-open': expandedLocationKeys.has(point.locationName) }"
                  aria-hidden="true"
                >⌄</span>
              </button>
              <dl v-if="expandedLocationKeys.has(point.locationName)" class="map-detail-meta">
                <div v-for="row in pointMetaRows(point)" :key="row.key" class="map-detail-meta-item">
                  <dt v-if="row.label" class="map-detail-meta-label">{{ row.label }}</dt>
                  <dd class="map-detail-meta-value" :class="{ 'map-detail-meta-value--tones': row.tones }">
                <template v-if="row.tones">
                  <span v-for="tone in row.tones" :key="tone.key" class="tone-pill">
                    <span class="tone-pill-name">{{ tone.name }}</span>
                    <span class="tone-pill-value">{{ tone.value }}</span>
                  </span>
                </template>
                <template v-else>{{ row.value }}</template>
              </dd>
                </div>
              </dl>
            </article>
          </div>
          <div v-else class="empty-state empty-state-base">
            <p>{{ t('words.wordList.states.noData') }}</p>
          </div>
        </template>
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
import * as OpenCCCN2T from 'opencc-js/cn2t'
import * as OpenCCT2CN from 'opencc-js/t2cn'
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
const STANDARD_WORD_OPTIONS_LIMIT = 1000

const TONE_FIELD_KEYS = Array.from({ length: 10 }, (_, index) => `t${index + 1}`)
const locationDetailsT2S = OpenCCT2CN.Converter({ from: 'tw', to: 'cn' })
const locationDetailsS2T = OpenCCCN2T.Converter({ from: 'cn', to: 'tw' })

const MAP_POINT_META_GROUPS = [
  {
    keys: ['province', 'city', 'county'],
    labelKeys: ['words.wordList.upload.province', 'words.wordList.upload.city', 'words.wordList.upload.county'],
  },
  {
    keys: ['town', 'administrativeVillage', 'naturalVillage'],
    labelKeys: ['words.wordList.upload.town', 'words.wordList.upload.administrativeVillage', 'words.wordList.upload.naturalVillage'],
  },
  { keys: ['yindianRegion'], labelKeys: ['words.wordList.upload.yindianRegion'] },
  { keys: ['atlasRegion'], labelKeys: ['words.wordList.upload.atlasRegion'] },
]

function buildToneMetaRow(source) {
  if (!source) {
    return null
  }

  const tones = TONE_FIELD_KEYS
    .map((key) => {
      const value = String(source[key] || '').trim()
      return value && value !== '-'
        ? { key, name: t(`words.wordList.upload.toneNames.${key}`), value }
        : null
    })
    .filter(Boolean)

  return tones.length ? { key: 'tones', label: t('words.wordList.upload.toneValues'), tones } : null
}

const props = defineProps({
  vocabularyMe: { type: Object, default: null },
  isLoadingVocabularyMe: { type: Boolean, default: false },
  vocabularyMeError: { type: String, default: '' },
})

const query = ref('')
function resolveViewModeFromRoute() {
  const tab = route.query.tab
  if (tab === 'map' || tab === 'table') return tab
  const stored = sessionStorage.getItem('vocabulary_view_mode')
  if (stored === 'map' || stored === 'table') return stored
  return 'card'
}

const viewMode = ref(resolveViewModeFromRoute())
const selectedSearchFields = ref(JSON.parse(localStorage.getItem('vocabulary_search_fields') || '[]'))
const selectedLocations = ref([])
const filterByRegion = ref(localStorage.getItem('vocabulary_filter_by_region') === 'true')
const selectedProvince = ref('')
const selectedCity = ref('')
const selectedStandardWord = ref('')
const singleSelect = ref(localStorage.getItem('vocabulary_single_select') !== 'false')
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
const isLocationDetailsModalOpen = ref(false)
const isLoadingLocationDetails = ref(false)
const locationDetailsError = ref('')
const locationDetailsPoints = ref([])
const locationDetailsSearchQuery = ref('')
const locationDetailsSortByRegion = ref(false)
const expandedLocationKeys = ref(new Set())
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
const activeMapPointMeta = ref(null)
const expandedVocabularyCardNoteIds = ref(new Set())

const mapDetailMetaRows = computed(() => {
  const meta = activeMapPointMeta.value
  if (!meta) {
    return []
  }
  const rows = MAP_POINT_META_GROUPS
    .map(({ keys, labelKeys }) => ({
      key: keys.join('-'),
      label: labelKeys.map((labelKey) => t(labelKey)).join(' / '),
      value: keys
        .map((key) => String(meta[key] || '').trim())
        .filter((value) => value && value !== '-')
        .join(' · '),
    }))
    .filter(({ value }) => value)

  const toneRow = buildToneMetaRow(meta)
  if (toneRow) {
    rows.push(toneRow)
  }

  rows.push({
    key: 'count',
    label: '',
    value: t('words.wordList.map.pointCount', { count: mapDetailEntries.value.length }),
  })

  return rows
})


function pointMetaRows(point) {
  if (!point) {
    return []
  }

  const rows = MAP_POINT_META_GROUPS
    .map(({ keys, labelKeys }) => ({
      key: keys.join('-'),
      label: labelKeys.map((labelKey) => t(labelKey)).join(' / '),
      value: keys
        .map((key) => String(point[key] || '').trim())
        .filter((value) => value && value !== '-')
        .join(' · '),
    }))
    .filter(({ value }) => value)

  const toneRow = buildToneMetaRow(point)
  if (toneRow) {
    rows.push(toneRow)
  }

  return rows
}

function isVocabularyCardNoteExpanded(entryId) {
  return expandedVocabularyCardNoteIds.value.has(entryId)
}

function toggleVocabularyCardNote(entryId) {
  const nextExpandedIds = new Set(expandedVocabularyCardNoteIds.value)
  if (nextExpandedIds.has(entryId)) {
    nextExpandedIds.delete(entryId)
  } else {
    nextExpandedIds.add(entryId)
  }
  expandedVocabularyCardNoteIds.value = nextExpandedIds
}

const locationDetailsSourcePoints = computed(() => {
  return viewMode.value === 'map' ? mapPoints.value : locationDetailsPoints.value
})

const locationDetailsDisplayPoints = computed(() => {
  const queryParts = normalizeLocationDetailsSearchText(locationDetailsSearchQuery.value)
  const points = queryParts.length
    ? locationDetailsSourcePoints.value.filter((point) => {
      const pointParts = normalizeLocationDetailsSearchText(buildLocationDetailsSearchText(point))
      return queryParts.some((queryPart) => pointParts.some((pointPart) => pointPart.includes(queryPart)))
    })
    : [...locationDetailsSourcePoints.value]

  if (locationDetailsSortByRegion.value) {
    points.sort(compareLocationDetailsByRegion)
  }

  return points
})

const searchFieldOptions = computed(() => [
  { value: 'definition', label: t('words.wordList.search.fields.definition') },
  { value: 'headword', label: t('words.wordList.search.fields.headword') },
  { value: 'pronunciation', label: t('words.wordList.search.fields.ipa') },
  { value: 'detail', label: t('words.wordList.search.fields.notes') }
])

const locationOptions = computed(() => {
  return vocabularyLocationOptions.value
})

const provinceOptions = computed(() => {
  const seen = new Set()
  const provinces = vocabularyLocationOptions.value
    .filter((opt) => {
      if (!opt.province || seen.has(opt.province)) return false
      seen.add(opt.province)
      return true
    })
    .map((opt) => ({ value: opt.province, label: opt.province }))
  return [
    { value: '', label: t('words.wordList.search.allProvinces') },
    ...provinces,
  ]
})

const cityOptions = computed(() => {
  const seen = new Set()
  const cities = vocabularyLocationOptions.value
    .filter((opt) => opt.province === selectedProvince.value && opt.city && !seen.has(opt.city) && seen.add(opt.city))
    .map((opt) => ({ value: opt.city, label: opt.city }))
  return [
    { value: '', label: t('words.wordList.search.allCities') },
    ...cities,
  ]
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

const tableColumns = computed(() => [
  { key: 'standard_word', label: t('words.wordList.columns.definition'), filterable: true, width: 1.2 },
  { key: 'local_expression', label: t('words.wordList.columns.headword'), filterable: true, width: 1 },
  { key: 'ipa', label: t('words.wordList.columns.pronunciation'), filterable: false, width: 1.2 },
  { key: 'notes', label: t('words.wordList.columns.detail'), filterable: false, width: 1.6 },
  { key: 'location_name', label: t('words.wordList.columns.location'), filterable: true, width: 1 },
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
      locationLabel: point.locationLabel,
      province: point.province,
      city: point.city,
      county: point.county,
      town: point.town,
      administrativeVillage: point.administrativeVillage,
      naturalVillage: point.naturalVillage,
      yindianRegion: point.yindianRegion,
      atlasRegion: point.atlasRegion,
      ...Object.fromEntries(TONE_FIELD_KEYS.map((key) => [key, point[key] || ''])),

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

function normalizeLocationDetailsSearchText(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) {
    return []
  }

  return [
    raw,
    locationDetailsT2S(raw).toLowerCase(),
    locationDetailsS2T(raw).toLowerCase(),
  ].filter((part, index, parts) => part && parts.indexOf(part) === index)
}

function buildLocationDetailsSearchText(point) {
  return [
    point?.locationName,
    point?.locationLabel,
    point?.province,
    point?.city,
    point?.county,
    point?.town,
    point?.administrativeVillage,
    point?.naturalVillage,
  ].filter(Boolean).join(' ')
}

function compareLocationDetailsByRegion(a, b) {
  const aParts = [
    a?.province,
    a?.city,
    a?.county,
    a?.town,
    a?.administrativeVillage,
    a?.naturalVillage,
    a?.locationName,
  ]
  const bParts = [
    b?.province,
    b?.city,
    b?.county,
    b?.town,
    b?.administrativeVillage,
    b?.naturalVillage,
    b?.locationName,
  ]

  return aParts
    .map((part, index) => String(part || '').localeCompare(String(bParts[index] || ''), 'zh-Hans-CN'))
    .find((result) => result !== 0) || 0
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
  }
}

function buildVocabularyQueryParams() {
  const params = {
    q: query.value.trim(),
    search_fields: normalizeSelectedSearchFields(),
  }
  if (filterByRegion.value) {
    if (selectedProvince.value) params.province = selectedProvince.value
    if (selectedCity.value) params.city = selectedCity.value
  } else {
    params.locations = selectedLocations.value
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
  const entryCount = Number(point.entry_count) || 0
  const locationLabel = [
    point.province,
    point.city,
    point.county,
    point.town,
    point.administrative_village,
    point.natural_village,
  ].filter(Boolean).join(' · ') || locationName

  return {
    locationName,
    locationLabel,
    province: point.province || '',
    city: point.city || '',
    county: point.county || '',
    town: point.town || '',
    administrativeVillage: point.administrative_village || '',
    naturalVillage: point.natural_village || '',
    yindianRegion: point.yindian_region || '',
    atlasRegion: point.atlas_region || '',
    ...Object.fromEntries(TONE_FIELD_KEYS.map((key) => [key, point[key] || ''])),
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
  if (viewMode.value !== 'map') {
    return
  }

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
    const filteredStandardWords = selectedStandardWordsModel.value.filter((value) => optionValues.has(value))
    if (filteredStandardWords.length !== selectedStandardWordsModel.value.length) {
      selectedStandardWordsModel.value = filteredStandardWords
    }
  } catch {
    vocabularyStandardWordOptions.value = []
    selectedStandardWord.value = ''
  }
}

async function handleMapPointClick(point) {
  const locations = normalizeMapPointLocations(point)

  if (!locations.length) {
    return
  }

  const baseLabel = point.locationName || point.locationLabel || locations[0]
  activeMapPointBaseLabel.value = baseLabel
  activeMapPointMeta.value = point
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
    selectedMapPointLabel.value = baseLabel
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
    selectedMapPointLabel.value = baseLabel
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
    selectedMapPointLabel.value = activeMapPointBaseLabel.value
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
  activeMapPointMeta.value = null
}

function toggleLocationDetail(locationName) {
  const next = new Set(expandedLocationKeys.value)
  if (next.has(locationName)) {
    next.delete(locationName)
  } else {
    next.add(locationName)
  }
  expandedLocationKeys.value = next
}

function clearLocationDetailsModal() {
  expandedLocationKeys.value = new Set()
  locationDetailsSearchQuery.value = ''
  locationDetailsError.value = ''
}

async function openLocationDetails() {
  expandedLocationKeys.value = new Set()
  locationDetailsSearchQuery.value = ''
  locationDetailsError.value = ''
  isLocationDetailsModalOpen.value = true

  // 地图模式已加载 mapPoints，直接复用，避免重复请求
  if (viewMode.value === 'map') {
    return
  }

  isLoadingLocationDetails.value = true

  try {
    const response = await getVocabularyMapPoints(buildVocabularyMapPointsParams())
    locationDetailsPoints.value = Array.isArray(response.points)
      ? response.points.map(normalizeVocabularyMapPoint)
      : []
  } catch (error) {
    locationDetailsError.value = error.message || t('words.wordList.states.loadMapFailed')
    locationDetailsPoints.value = []
  } finally {
    isLoadingLocationDetails.value = false
  }
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

onMounted(async () => {
  await loadVocabularyLocationOptions()
  loadVocabularyStandardWords()
  loadActiveViewMode()
})

watch(() => route.query.tab, (tab) => {
  const nextMode = tab ? normalizeViewMode(tab) : resolveViewModeFromRoute()
  if (viewMode.value !== nextMode) {
    viewMode.value = nextMode
  }
})

watch(viewMode, () => {
  loadVocabularyStandardWords()
  loadActiveViewMode()
})

watch(selectedProvince, () => {
  selectedCity.value = ''
})

watch(filterByRegion, (val) => {
  localStorage.setItem('vocabulary_filter_by_region', val ? 'true' : 'false')
})

watch(selectedSearchFields, (val) => {
  localStorage.setItem('vocabulary_search_fields', JSON.stringify(val))
}, { deep: true })

watch(singleSelect, (val) => {
  localStorage.setItem('vocabulary_single_select', val ? 'true' : 'false')
})

watchDebounced([query, selectedSearchFields, selectedLocations, filterByRegion, selectedProvince, selectedCity], () => {
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

<script>
export default {
  name: 'VocabularyViewPage'
}
</script>

<style scoped lang="scss" src="./vocabulary.scss"></style>
