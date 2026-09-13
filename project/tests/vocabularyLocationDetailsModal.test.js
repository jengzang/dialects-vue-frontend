import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as OpenCCCN2T from 'opencc-js/cn2t'
import * as OpenCCT2CN from 'opencc-js/t2cn'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(path) {
  return readFileSync(resolve(projectRoot, path), 'utf8')
}

describe('vocabulary location details modal', () => {
  it('uses bidirectional OpenCC support for location-name filtering', () => {
    const t2s = OpenCCT2CN.Converter({ from: 'tw', to: 'cn' })
    const s2t = OpenCCCN2T.Converter({ from: 'cn', to: 'tw' })

    expect(t2s('廣州')).toBe('广州')
    expect(s2t('广州')).toBe('廣州')

    const source = readSource('src/main/views/explore/word/vocabulary/VocabularyViewPage.vue')
    expect(source).toContain("import * as OpenCCT2CN from 'opencc-js/t2cn'")
    expect(source).toContain("import * as OpenCCCN2T from 'opencc-js/cn2t'")
    expect(source).toContain('const locationDetailsT2S = OpenCCT2CN.Converter')
    expect(source).toContain('const locationDetailsS2T = OpenCCCN2T.Converter')
    expect(source).toContain('function normalizeLocationDetailsSearchText')
  })

  it('filters and sorts the opened location details modal without using the location multiselect', () => {
    const source = readSource('src/main/views/explore/word/vocabulary/VocabularyViewPage.vue')
    const topControls = readSource('src/main/views/explore/word/vocabulary/VocabularyTopControls.vue')
    const styles = readSource('src/main/views/explore/word/vocabulary/vocabulary.scss')

    expect(source).toContain('v-model="locationDetailsSearchQuery"')
    expect(source).toContain('location-details-sort-btn')
    expect(source).toContain('@click="locationDetailsSortByRegion = !locationDetailsSortByRegion"')
    expect(source).toContain(':title="t(\'words.wordList.search.locationDetailsSortByRegion\')"')
    expect(source).toContain('class="location-details-sort-icon"')
    expect(source).toContain('<svg')
    expect(source).not.toContain('class="location-details-sort-btn glass-button"')
    expect(source).not.toContain('{{ t(\'words.wordList.search.locationDetailsSortByRegion\') }}')
    expect(source).toContain('const locationDetailsDisplayPoints = computed')
    expect(source).toContain('buildLocationDetailsSearchText(point)')
    expect(source).toContain('compareLocationDetailsByRegion')
    expect(source).toContain('v-for="(point, index) in locationDetailsDisplayPoints"')
    expect(source).toContain('locationDetailsDisplayPoints.length')
    expect(topControls).toContain("@click=\"emit('openLocationDetails')\"")
    expect(topControls).not.toContain('locationDetailsSearchQuery')
    expect(styles).toContain('.location-details-toolbar')
    expect(styles).toContain('.location-details-search')
    expect(styles).toContain('.location-details-sort-btn')
    expect(styles).toContain('background: transparent')
    expect(styles).toContain('border: none')
    expect(styles).toContain('&:hover')
  })

  it('opens location details from a vocabulary card with the location name searched and expanded', () => {
    const source = readSource('src/main/views/explore/word/vocabulary/VocabularyViewPage.vue')
    const styles = readSource('src/main/views/explore/word/vocabulary/vocabulary.scss')

    expect(source).toContain('class="card-location pill-btn card-location-pill"')
    expect(source).toContain('class="card-location-pill-text"')
    expect(source).toContain('@click="openLocationDetails(entry.locationName)"')
    expect(source).toContain('{{ entry.locationName }}')
    expect(source).toContain('const locationName = item.location_name || locationContext || \'\'')
    expect(source).toContain('locationName,')
    expect(source).toContain('location: item.location_name || item.location || item.location_label || locationContext || \'\'')
    expect(source).toContain('async function openLocationDetails(focusedLocationName = \'\')')
    expect(source).toContain('const normalizedFocusedLocationName = String(focusedLocationName || \'\').trim()')
    expect(source).toContain('locationDetailsSearchQuery.value = normalizedFocusedLocationName')
    expect(source).toContain('expandedLocationKeys.value = normalizedFocusedLocationName ? new Set([normalizedFocusedLocationName]) : new Set()')
    expect(styles).toContain('.card-location-pill')
  })

  it('caches vocabulary map point requests used by the location details modal', () => {
    const source = readSource('src/main/views/explore/word/vocabulary/VocabularyViewPage.vue')

    expect(source).toContain('const mapPointsCacheKey = ref(\'\')')
    expect(source).toContain('const locationDetailsPointsCacheKey = ref(\'\')')
    expect(source).toContain('const pendingVocabularyMapPointRequests = new Map()')
    expect(source).toContain('function buildVocabularyMapRequestKey(kind, params)')
    expect(source).toContain('async function requestVocabularyMapPoints(params = buildVocabularyMapPointsParams())')
    expect(source).toContain("const requestKey = buildVocabularyMapRequestKey('map-points', requestParams)")
    expect(source).toContain('if (locationDetailsPointsCacheKey.value === requestKey) {')
    expect(source).toContain('if (mapPointsCacheKey.value === requestKey) {')
    expect(source).toContain('locationDetailsPointsCacheKey.value = requestKey')
    expect(source).toContain('mapPointsCacheKey.value = requestKey')
    expect(source).toContain('pendingVocabularyMapPointRequests.set(requestKey, requestPromise)')
    expect(source).toContain('pendingVocabularyMapPointRequests.delete(requestKey)')
    expect(source).not.toContain('const response = await getVocabularyMapPoints(buildVocabularyMapPointsParams())')
  })

  it('deduplicates vocabulary request lifecycles and ignores stale responses', () => {
    const source = readSource('src/main/views/explore/word/vocabulary/VocabularyViewPage.vue')

    expect(source).toContain('const itemsCacheKey = ref(\'\')')
    expect(source).toContain('const standardWordsCacheKey = ref(\'\')')
    expect(source).toContain('const activeVocabularyItemsRequestKey = ref(\'\')')
    expect(source).toContain('const activeStandardWordsRequestKey = ref(\'\')')
    expect(source).toContain('const activeMapPointsRequestKey = ref(\'\')')
    expect(source).toContain('const activeMapDetailRequestKey = ref(\'\')')
    expect(source).toContain('const pendingVocabularyItemRequests = new Map()')
    expect(source).toContain('const pendingVocabularyStandardWordRequests = new Map()')
    expect(source).toContain('const mapDetailItemsCache = new Map()')
    expect(source).toContain('async function requestVocabularyItems(params)')
    expect(source).toContain('async function requestVocabularyStandardWords(params = buildVocabularyStandardWordsParams())')
    expect(source).toContain('async function requestVocabularyMapDetailItems(params)')
    expect(source).toContain('if (!append && itemsCacheKey.value === requestKey) {')
    expect(source).toContain('if (standardWordsCacheKey.value === requestKey) {')
    expect(source).toContain('if (activeVocabularyItemsRequestKey.value !== requestKey || !shouldUseVocabularyItemsApi()) {')
    expect(source).toContain('if (activeStandardWordsRequestKey.value !== requestKey || viewMode.value !== \'map\') {')
    expect(source).toContain('if (activeMapPointsRequestKey.value !== requestKey || (!shouldUseVocabularyMapPointsApi() && !shouldUseVocabularyMapItemsApi())) {')
    expect(source).toContain('if (activeMapDetailRequestKey.value !== requestKey) {')
    expect(source).toContain('async function refreshVocabularyMapData()')
    expect(source).toContain('await loadVocabularyStandardWords()')
    expect(source).toContain('loadVocabularyMapPoints()')
    expect(source).toContain('const requestKey = buildVocabularyMapRequestKey(\'map-detail-items\', params)')
  })
})
