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
})
