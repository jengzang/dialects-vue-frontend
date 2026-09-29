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
    expect(source).toContain("if (!notesQuery.value.trim())")
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

  it('hides page tabs only for notes source routes', () => {
    const shell = readSource('src/main/views/menu/VocabularyPage.vue')

    expect(shell).toContain('v-if="!isCharacterNotesMode"')
    expect(shell).toContain('const isCharacterNotesMode = computed')
  })

  it('localizes the notes source controls in every supported locale', () => {
    const localePaths = [
      'src/i18n/locales/zh-CN/words.json',
      'src/i18n/locales/zh-Hant/words.json',
      'src/i18n/locales/en/words.json',
    ]

    localePaths.forEach((path) => {
      const source = readSource(path)
      expect(source).toContain('"characterNotes"')
      expect(source).toContain('"refreshResults"')
      expect(source).toContain('"enterSearch"')
      expect(source).toContain('"noMatches"')
    })
  })
})
