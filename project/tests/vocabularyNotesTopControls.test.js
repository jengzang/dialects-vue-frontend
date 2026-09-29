import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const testsDir = dirname(fileURLToPath(import.meta.url))
const componentPath = resolve(
  testsDir,
  '../src/main/views/explore/word/vocabulary/VocabularyTopControls.vue'
)

function readComponentSource() {
  return readFileSync(componentPath, 'utf8')
}

describe('VocabularyTopControls character-notes mode', () => {
  it('defaults its source switch to the existing vocabulary mode', () => {
    const source = readComponentSource()

    expect(source).toMatch(/source:\s*\{\s*type:\s*String,\s*default:\s*'vocabulary'\s*\}/)
    expect(source).toContain("emit('update:source', $event ? 'vocabulary' : 'character-notes')")
    expect(source).toContain(':model-value="source === \'vocabulary\'"')
  })

  it('places the source switch in the filter strip with the location filter', () => {
    const source = readComponentSource()
    const filterStripStart = source.indexOf('<div\n      class="filter-strip"')
    const sourceSwitchStart = source.indexOf(':model-value="source === \'vocabulary\'"')
    const locationFilterStart = source.indexOf('class="location-filter"')

    expect(filterStripStart).toBeGreaterThan(-1)
    expect(sourceSwitchStart).toBeGreaterThan(filterStripStart)
    expect(locationFilterStart).toBeGreaterThan(sourceSwitchStart)
  })

  it('uses the shared geographic input as an unlimited notes scope and refreshes manually', () => {
    const source = readComponentSource()

    expect(source).toContain("import LocationAndRegionInput from '@/main/components/geo/LocationAndRegionInput.vue'")
    expect(source).toContain('allow-empty-scope')
    expect(source).toContain('disable-location-limit')
    expect(source).toContain("@locations-resolved=\"handleNotesLocationsResolved\"")
    expect(source).toContain("@click=\"emit('refreshNotes')\"")
    expect(source).toContain('isNotesScopeResolving')
  })

  it('places notes refresh beside the keyword input', () => {
    const source = readComponentSource()
    const searchContainerStart = source.indexOf('<div class="search-container">')
    const searchContainerEnd = source.indexOf('\n    </div>\n\n    <div\n      class="filter-strip"')
    const refreshButtonStart = source.indexOf("{{ t('words.wordList.notes.refreshResults') }}")

    expect(refreshButtonStart).toBeGreaterThan(searchContainerStart)
    expect(refreshButtonStart).toBeLessThan(searchContainerEnd)
  })

  it('uses the shared action button with a refresh SVG for notes refresh', () => {
    const source = readComponentSource()

    expect(source).toContain("import ActionButton from '@/main/components/user/auth/ActionButton.vue'")
    expect(source).toContain('<ActionButton')
    expect(source).toContain('variant="blue"')
    expect(source).toContain('viewBox="0 0 24 24"')
    expect(source).toContain("{{ t('words.wordList.notes.refreshResults') }}")
  })

  it('uses a compact, notes-only style for the refresh action', () => {
    const source = readComponentSource()

    expect(source).toContain('class="notes-refresh-action"')
    expect(source).toMatch(/\.notes-refresh-action\.action-button\s*\{\s*padding:\s*10px 14px;/)
  })

  it('keeps vocabulary-only filters out of notes mode while reusing passed field options', () => {
    const source = readComponentSource()
    const vocabularyBranch = source.indexOf("v-if=\"source === 'vocabulary'\"")

    expect(vocabularyBranch).toBeGreaterThan(-1)
    expect(source).toContain('class="pill-btn location-details-btn"')
    expect(source).toContain('class="standard-word-filter"')
    expect(source).toContain('v-for="field in searchFieldOptions"')
    expect(source).toContain('source === \'character-notes\'')
  })
})
