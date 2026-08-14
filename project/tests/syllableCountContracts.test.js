import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

const readSource = (path) => readFileSync(resolve(projectRoot, path), 'utf8')

describe('syllable count frontend contracts', () => {
  it('adds API wrappers for region-aware feature counts and syllable counts', () => {
    const apiSource = readSource('src/api/main/core/query.js')
    const indexSource = readSource('src/api/index.js')

    expect(apiSource).toContain('export async function getSyllableCounts(params)')
    expect(apiSource).toContain("api('/api/syllable_counts'")
    expect(apiSource).toContain("method: 'POST'")
    expect(apiSource).toContain("query.append('regions', reg)")
    expect(apiSource).toContain("query.append('region_mode', params.region_mode)")
    expect(indexSource).toContain('getSyllableCounts')
  })

  it('keeps syllable isopleth payload isolated from existing mergedData map logic', () => {
    const storeSource = readSource('src/main/store/store.js')
    const mapLibreSource = readSource('src/main/components/map/MapLibre.vue')

    expect(storeSource).toContain('isoplethPayload')
    expect(mapLibreSource).toContain("mapStore.mode === 'isopleth'")
    expect(mapLibreSource).toContain('drawIsopleth')
    expect(mapLibreSource).toContain('mapStore.isoplethPayload')
    expect(mapLibreSource).toContain('clearIsoplethLayers')
  })

  it('wires Countphos through LocationAndRegionInput and fetches both count APIs with the same request payload', () => {
    const source = readSource('src/main/components/pho/Countphos.vue')

    expect(source).toContain("import LocationAndRegionInput from '@/main/components/geo/LocationAndRegionInput.vue'")
    expect(source).not.toContain('LocationMultiInput')
    expect(source).toContain('<LocationAndRegionInput')
    expect(source).toContain('countphosLocationQuery')
    expect(source).toContain('getFeatureCounts(countRequestPayload)')
    expect(source).toContain('getSyllableCounts(countRequestPayload)')
    expect(source).toContain("region_mode: countphosLocationQuery.value.regionUsing")
  })

  it('lets Countphos select which count API to request, one at a time for multiple locations', () => {
    const source = readSource('src/main/components/pho/Countphos.vue')

    expect(source).toContain("import CheckBox from '@/components/selector/CheckBox.vue'")
    expect(source).toContain('<CheckBox')
    expect(source).toContain('queryMode')
    expect(source).toContain('isSingleLocationQuery')
    expect(source).toContain('handleQueryModeToggle')
    expect(source).toContain('watch([isSingleLocationQuery, isCountphosQueryEmpty]')
  })

  it('adds an inline syllable section with tone switch and isopleth threshold above ten resolved points', () => {
    const source = readSource('src/main/components/pho/Countphos.vue')

    expect(source).toContain('syllable-section')
    expect(source).toContain('<SwitchToggle')
    expect(source).toContain('syllableMode')
    expect(source).toContain('canShowIsopleth')
    expect(source).toContain('resolvedLocationCount.value > 10')
    expect(source).toContain('openIsopleth')
  })

  it('caps the syllable grid at 100 cards with a confirmed load-more button and moves the isopleth button to the summary row', () => {
    const source = readSource('src/main/components/pho/Countphos.vue')

    expect(source).toContain('visibleSyllableStats')
    expect(source).toContain('hasMoreSyllables')
    expect(source).toContain('loadAllSyllables')
    expect(source).toContain("showConfirm(t('phonology.phonology.countphos.syllables.loadAllConfirm'))")
    expect(source).toContain('syllable-summary-row')
    expect(source).toContain('viewIsopleth')
  })

  it('shows per-location syllable details and feeds them to the location jump nav', () => {
    const source = readSource('src/main/components/pho/Countphos.vue')
    const composableSource = readSource('src/composables/bar/useNavAnchorJump.js')

    expect(source).toContain('syllableLocationData')
    expect(source).toContain('hasSyllableLocationData')
    expect(source).toContain('showSyllableLocations')
    expect(source).toContain('extraLocationData')
    expect(source).toContain('syllableModeLabel')
    expect(composableSource).toContain('extraLocationData')
  })

  it('adds a nav point for the syllable aggregate summary', () => {
    const source = readSource('src/main/components/pho/Countphos.vue')
    const composableSource = readSource('src/composables/bar/useNavAnchorJump.js')

    expect(source).toContain('getSyllableAnchorId')
    expect(source).toContain('hasSyllableData: computed(() => (queryMode.value.syllableCounts && hasSyllableResultData.value))')
    expect(source).toContain("t('phonology.phonology.countphos.nav.syllableSummary')")
    expect(composableSource).toContain("kind: 'syllable'")
  })

  it('allows syllable heatmap route query keys on map view', () => {
    const source = readSource('src/main/router/menuRoutes.js')

    expect(source).toContain("'mode'")
    expect(source).toContain("'toneMode'")
    expect(source).toContain("'syllable'")
  })

  it('defaults Countphos to the syllable snapshot view with feature snapshot loaded in the background', () => {
    const source = readSource('src/main/components/pho/Countphos.vue')

    expect(source).toContain("import all_syllable_counts from '/data/syllable_counts_20260814.json?url'")
    expect(source).toContain('const queryMode = ref({ featureCounts: false, syllableCounts: true })')
    expect(source).toContain('normalizeSyllableSnapshot')
    expect(source).toContain('getDefaultSyllableData')
    expect(source).toContain('getDefaultCountsData')
    expect(source).toContain('if (!isUsingDefaultCounts.value) return')
    expect(source).toContain('v-if="queryMode.featureCounts && !isSingleLocation && hasChartData"')
    expect(source).toContain('v-if="queryMode.syllableCounts && !isSingleLocation && hasSyllableResultData"')
    expect(source).toContain('v-if="queryMode.featureCounts && hasLocationDetailData"')
    expect(source).toContain('v-if="queryMode.syllableCounts && showSyllableLocations"')

    // 导航项也按模式门控:特徵統計 nav 数据只在 featureCounts 时透出
    expect(source).toContain('featureData: computed(() => (queryMode.value.featureCounts ? featureData.value : {}))')
    expect(source).toContain('aggregatedData: computed(() => (queryMode.value.featureCounts ? aggregatedData.value : {}))')
    expect(source).toContain('hasChartData: computed(() => (queryMode.value.featureCounts && hasChartData.value))')
    expect(source).toContain('extraLocationData: computed(() => (queryMode.value.syllableCounts && showSyllableLocations.value ? syllableLocationData.value : {}))')
  })
})
