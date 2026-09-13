import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(path) {
  return readFileSync(resolve(projectRoot, path), 'utf8')
}

describe('vocabulary map integration', () => {
  it('uses YuBaoMap marker clicks to fetch vocabulary point details', () => {
    const yuBaoMap = readSource('src/main/components/map/YuBaoMap.vue')

    expect(yuBaoMap).toContain("const emit = defineEmits(['marker-click'])")
    expect(yuBaoMap).toContain("emit('marker-click',")
    expect(yuBaoMap).toContain('locationName: properties.locationName')
    expect(yuBaoMap).toContain('locationNames: properties.locationNames')
  })

  it('renders vocabulary overview markers as log-percentile-scaled location count labels', () => {
    const vocabularyMap = readSource('src/main/components/map/VocabularyMap.vue')

    expect(vocabularyMap).toContain('const OVERVIEW_MARKER_COLORS = [')
    expect(vocabularyMap).toContain('const OVERVIEW_MARKER_TEXT_COLORS = [')
    expect(vocabularyMap).toContain("'#fef08a'")
    expect(vocabularyMap).toContain("'#ea580c'")
    expect(vocabularyMap).toContain("'#991b1b'")
    expect(vocabularyMap).toContain('function calculatePercentile')
    expect(vocabularyMap).toContain('function getOverviewScaleValue(count)')
    expect(vocabularyMap).toContain('return Math.log1p(count)')
    expect(vocabularyMap).toContain('calculatePercentile(counts, 0.05)')
    expect(vocabularyMap).toContain('calculatePercentile(counts, 0.95)')
    expect(vocabularyMap).toContain('function calculateOverviewMarkerScaleBounds')
    expect(vocabularyMap).toContain('const trimCount = Math.max(1, Math.floor(sortedValues.length * 0.05))')
    expect(vocabularyMap).toContain('const overviewCounts = Array.from(coordinatesMap.values())')
    expect(vocabularyMap).toContain('const overviewScale = buildOverviewMarkerScale(overviewCounts)')
    expect(vocabularyMap).toContain('const overviewCount = items.reduce(')
    expect(vocabularyMap).toContain('overviewLocationName: isOverviewMode ? getOverviewLocationName(items) : null')
    expect(vocabularyMap).toContain('markerMode: displayMode.value')
    expect(vocabularyMap).toContain('overviewStyle: isOverviewMode ? getOverviewMarkerStyle(overviewCount, overviewScale) : null')
    expect(vocabularyMap).toContain("const nameEl = document.createElement('div')")
    expect(vocabularyMap).toContain("nameEl.className = 'vocabulary-marker__overview-name'")
    expect(vocabularyMap).toContain("countEl.className = 'vocabulary-marker__overview-count'")
    expect(vocabularyMap).toContain('countEl.textContent = label')
    expect(vocabularyMap).toContain("el.className = `vocabulary-marker vocabulary-marker--${markerMode}`")
    expect(vocabularyMap).toContain("nameEl.style.backgroundColor = overviewStyle.color")
    expect(vocabularyMap).toContain('nameEl.style.color = overviewStyle.textColor')
    expect(vocabularyMap).toContain('el.style.setProperty(\'--overview-marker-font-size\', overviewStyle.fontSize)')
    expect(vocabularyMap).toContain(':deep(.vocabulary-marker--overview)')
    expect(vocabularyMap).toContain(':deep(.vocabulary-marker__overview-name)')
    expect(vocabularyMap).toContain(':deep(.vocabulary-marker__overview-count)')
    expect(vocabularyMap).not.toContain('-webkit-text-stroke')
    expect(vocabularyMap).not.toContain("if (displayMode.value === 'overview') {\n       bgColor = assignColor")
  })
})
