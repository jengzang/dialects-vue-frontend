import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const testsDir = dirname(fileURLToPath(import.meta.url))
const componentPath = resolve(
  testsDir,
  '../src/main/views/explore/word/vocabulary/VocabularyTopControls.vue'
)

function readViewSource() {
  return readFileSync(resolve(testsDir, '../src/main/views/explore/word/vocabulary/VocabularyViewPage.vue'), 'utf8')
}

function readComponentSource() {
  return readFileSync(componentPath, 'utf8')
}

describe('VocabularyTopControls character-notes mode', () => {
  it('defaults the source to vocabulary and exposes both modes through the page intro', () => {
    expect(readComponentSource()).toMatch(/source:\s*\{\s*type:\s*String,\s*default:\s*'vocabulary'\s*\}/)
    const source = readViewSource()
    expect(source).toContain('v-model="source"')
    expect(source).toContain('name="vocabulary-query-source"')
    expect(source).toContain("{ value: 'vocabulary', label: t('words.wordList.source.vocabulary') }")
    expect(source).toContain("{ value: 'character-notes', label: t('words.wordList.source.characterNotes') }")
  })

  it('cancels uncommitted keyword input when its source changes', () => {
    const source = readComponentSource()

    expect(source).toMatch(/watch\(\(\) => props\.source, \(\) => \{\s*clearTimeout\(searchTimer\)\s*inputText\.value = props\.query\s*\}\)/)
  })

  it('keeps source selection in the intro while the filter strip receives the notes scope', () => {
    const view = readViewSource()
    const intro = view.slice(view.indexOf('<template #intro>'), view.indexOf('</template>'))
    expect(intro).toContain('name="vocabulary-query-source"')
    expect(readComponentSource()).toContain(":id=\"source === 'character-notes' ? 'vocabulary-notes-scope-filter' : undefined\"")
    expect(view).toContain('to="#vocabulary-notes-scope-filter"')
    expect(view).toContain(':disabled="isSearchExpanded"')
  })

  it('uses a page-owned unlimited notes scope and refreshes manually after resolution', () => {
    const view = readViewSource()
    expect(view).toContain("import LocationAndRegionInput from '@/main/components/geo/LocationAndRegionInput.vue'")
    expect(view).toContain('allow-empty-scope')
    expect(view).toContain('disable-location-limit')
    expect(view).toContain('@locations-resolved="handleNotesScopeResolved"')
    expect(view).toContain(':notes-refresh-disabled="isNotesScopeResolving || isNotesScopeDisabled"')
    expect(view).toContain('appliedScope.value = cloneNotesScope(draftScope.value)')
    expect(readComponentSource()).toContain('@click="refreshNotes"')
    expect(readComponentSource()).toContain('if (props.notesRefreshDisabled || isComposing.value) return')
  })

  it('places the notes refresh and settings beside the keyword input', () => {
    const source = readComponentSource()
    const settings = source.indexOf('class="notes-search-settings"')
    const actions = source.indexOf('class="notes-mode-actions"', settings)
    const refresh = source.indexOf('@click="refreshNotes"', actions)
    const fields = source.indexOf('class="field-filter"', refresh)
    const strip = source.indexOf('class="filter-strip"', fields)
    expect(settings).toBeGreaterThan(source.indexOf('<div class="search-container">'))
    expect(actions).toBeGreaterThan(settings)
    expect(refresh).toBeGreaterThan(actions)
    expect(fields).toBeGreaterThan(refresh)
    expect(strip).toBeGreaterThan(fields)
    expect(source).toMatch(/\.notes-mode-actions\s*\{[\s\S]*@include flex-col;/)
  })

  it('uses the shared refresh action when compact and a search button when expanded', () => {
    const source = readComponentSource()
    expect(source).toContain("import ActionButton from '@/main/components/user/auth/ActionButton.vue'")
    expect(source).toContain(':is="deferQuery ? \'button\' : ActionButton"')
    expect(source).toContain(':variant="deferQuery ? undefined : \'blue\'"')
    expect(source).toContain('viewBox="0 0 24 24"')
    expect(source).toContain("t(deferQuery ? 'common.button.search' : 'words.wordList.notes.refreshResults')")
    expect(source).toContain("if (props.deferQuery) emit('search')")
  })

  it('uses a compact, notes-only style for the refresh action', () => {
    const source = readComponentSource()

    expect(source).toContain('class="notes-refresh-action"')
    expect(source).toMatch(/\.notes-refresh-action\.action-button\s*\{\s*padding:\s*6px 10px;/)
  })

  it('centers every row of shared search fields', () => {
    const source = readComponentSource()

    expect(source).toContain('class="search-field-options"')
    expect(source).toMatch(/\.search-field-options\s*\{[\s\S]*?display:\s*flex;[\s\S]*?flex-wrap:\s*wrap;[\s\S]*?justify-content:\s*center;/)
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
