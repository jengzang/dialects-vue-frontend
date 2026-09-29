import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(path) {
  return readFileSync(resolve(projectRoot, path), 'utf8')
}

describe('Vocabulary character-notes mode', () => {
  it('normalizes notes routes to cards and keeps its request state independent', () => {
    const source = readSource('src/main/views/explore/word/vocabulary/VocabularyViewPage.vue')

    expect(source).toContain("'character-notes'")
    expect(source).toContain('searchNotes')
    expect(source).toContain('const draftScope = ref')
    expect(source).toContain('const appliedScope = ref')
    expect(source).toContain("localStorage.getItem('vocabulary_notes_search_fields')")
    expect(source).toContain('router.replace')
    expect(source).toContain("tab: 'card'")
  })

  it('loads the latest notes when the query is blank', () => {
    const source = readSource('src/main/views/explore/word/vocabulary/VocabularyViewPage.vue')

    expect(source).toContain('q: notesQuery.value.trim()')
    expect(source).not.toContain("if (!notesQuery.value.trim())")
    expect(source).not.toContain('v-else-if="!notesQuery.trim()"')
    expect(source).not.toContain(':notes-refresh-disabled="!notesQuery.trim()"')
  })

  it('uses only the applied scope until the user refreshes notes results', () => {
    const source = readSource('src/main/views/explore/word/vocabulary/VocabularyViewPage.vue')

    expect(source).toContain('function refreshNotes()')
    expect(source).toContain('appliedScope.value = cloneNotesScope(draftScope.value)')
    expect(source).toContain('locations: appliedScope.value.locations')
    expect(source).toContain('regions: appliedScope.value.regions')
    expect(source).toContain('region_mode: appliedScope.value.regionUsing')
  })

  it('keeps the partition source reported by the shared location resolver', () => {
    const source = readSource('src/main/views/explore/word/vocabulary/VocabularyViewPage.vue')

    expect(source).toContain("regionUsing: scope.regionUsing || scope.regionMode || 'map'")
  })

  it('renders note cards with location, character, IPA and annotation only', () => {
    const source = readSource('src/main/views/explore/word/vocabulary/VocabularyViewPage.vue')

    expect(source).toContain('class="glass-card notes-entry-card"')
    expect(source).toContain('{{ entry.locationName }}')
    expect(source).toContain('{{ entry.character }}')
    expect(source).toContain('{{ entry.pronunciation }}')
    expect(source).toContain('{{ entry.notes }}')
    expect(source).toContain(':key="entry.id"')
  })

  it('uses the vocabulary card hierarchy only for character-notes cards', () => {
    const page = readSource('src/main/views/explore/word/vocabulary/VocabularyViewPage.vue')
    const styles = readSource('src/main/views/explore/word/vocabulary/vocabulary.scss')
    const notesSectionStart = page.indexOf('<section v-if="isCharacterNotesMode"')
    const notesSectionEnd = page.indexOf('\n    <section v-else-if="viewMode !== \'table\'"', notesSectionStart)
    const notesSection = page.slice(notesSectionStart, notesSectionEnd)
    const vocabularySection = page.slice(notesSectionEnd)
    const notesCardStyles = styles.slice(
      styles.indexOf('.notes-entry-card'),
      styles.indexOf('.card-location-definition-pair'),
    )

    expect(notesSection).toContain('class="card-location pill-btn card-location-pill"')
    expect(notesSection).toContain('@click="openNotesLocationDetail(entry.locationName)"')
    expect(notesSection).toContain('class="card-pronunciation-pair notes-card-pronunciation-pair"')
    expect(notesSection).toContain('class="notes-card-note"')
    expect(notesSection).toContain('class="notes-card-note-measure"')
    expect(page).toContain('new ResizeObserver')
    expect(page).toContain('watch(notesCardGridEl')
    expect(page).toContain('watch(notesEntries')
    expect(page).toContain('onBeforeUnmount(() =>')
    expect(page).toContain('LocationDetailPopup')
    expect(page).toContain('getLocationDetail')
    expect(page).toContain('function openNotesLocationDetail')
    expect(styles).toContain('.notes-card-note')
    expect(notesCardStyles).not.toContain('.card-location {')
    expect(vocabularySection).toContain('class="card-location-definition-pair"')
    expect(vocabularySection).toContain('shouldShowVocabularyCardNoteToggle')
  })

  it('hides page tabs only for notes source routes', () => {
    const shell = readSource('src/main/views/menu/VocabularyPage.vue')

    expect(shell).toContain('v-if="!isCharacterNotesMode"')
    expect(shell).toContain('const isCharacterNotesMode = computed')
  })

  it('localizes the notes source controls in every supported locale', () => {
    const localeRefreshLabels = {
      'src/i18n/locales/zh-CN/words.json': '刷新',
      'src/i18n/locales/zh-Hant/words.json': '刷新',
      'src/i18n/locales/en/words.json': 'Refresh',
    }

    Object.entries(localeRefreshLabels).forEach(([path, refreshLabel]) => {
      const source = readSource(path)
      expect(source).toContain('"characterNotes"')
      expect(source).toContain(`"refreshResults": "${refreshLabel}"`)
      expect(source).toContain('"enterSearch"')
      expect(source).toContain('"noMatches"')
    })
  })
})
