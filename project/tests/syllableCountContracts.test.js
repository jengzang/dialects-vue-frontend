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

  it('keeps syllable heatmap payload isolated from existing mergedData map logic', () => {
    const storeSource = readSource('src/main/store/store.js')
    const mapLibreSource = readSource('src/main/components/map/MapLibre.vue')

    expect(storeSource).toContain('syllableHeatmapPayload')
    expect(mapLibreSource).toContain("mapStore.mode === 'syllableHeatmap'")
    expect(mapLibreSource).toContain('drawSyllableHeatmap')
    expect(mapLibreSource).toContain('mapStore.syllableHeatmapPayload')
    expect(mapLibreSource).toContain('clearSyllableHeatmapLayers')
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

  it('adds an inline syllable section with tone switch and heatmap threshold above ten resolved points', () => {
    const source = readSource('src/main/components/pho/Countphos.vue')

    expect(source).toContain('syllable-section')
    expect(source).toContain('<SwitchToggle')
    expect(source).toContain('syllableMode')
    expect(source).toContain('canShowSyllableHeatmap')
    expect(source).toContain('resolvedLocationCount.value > 10')
    expect(source).toContain('openSyllableHeatmap')
  })

  it('caps the syllable grid at 100 cards with a confirmed load-more button and moves the heatmap button to the summary row', () => {
    const source = readSource('src/main/components/pho/Countphos.vue')

    expect(source).toContain('visibleSyllableStats')
    expect(source).toContain('hasMoreSyllables')
    expect(source).toContain('loadAllSyllables')
    expect(source).toContain("showConfirm(t('phonology.phonology.countphos.syllables.loadAllConfirm'))")
    expect(source).toContain('syllable-summary-row')
    expect(source).toContain('viewHeatmap')
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
    expect(source).toContain('hasSyllableData: hasSyllableResultData')
    expect(source).toContain("t('phonology.phonology.countphos.nav.syllableSummary')")
    expect(composableSource).toContain("kind: 'syllable'")
  })

  it('allows syllable heatmap route query keys on map view', () => {
    const source = readSource('src/main/router/menuRoutes.js')

    expect(source).toContain("'mode'")
    expect(source).toContain("'toneMode'")
    expect(source).toContain("'syllable'")
  })
})
