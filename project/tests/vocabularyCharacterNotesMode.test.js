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

  it('uses a notes-only keyword placeholder in the shared top controls', () => {
    const source = readSource('src/main/views/explore/word/vocabulary/VocabularyTopControls.vue')

    expect(source).toContain(":placeholder=\"source === 'character-notes' ? t('words.wordList.notes.searchPlaceholder') : t('words.wordList.search.placeholder')\"")
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

    expect(source).toContain('ref="notesCardGridEl" class="cards-grid cards-grid--notes"')
    expect(source).toContain('class="glass-card notes-entry-card"')
    expect(source).toContain('{{ entry.locationName }}')
    expect(source).toContain('{{ entry.character }}')
    expect(source).toContain('{{ entry.pronunciation }}')
    expect(source).toContain('{{ entry.notes }}')
    expect(source).toContain(':key="entry.id"')
  })

  it('uses narrower grid minima only for character-notes cards', () => {
    const styles = readSource('src/main/views/explore/word/vocabulary/vocabulary.scss')
    const portraitStyles = styles.slice(
      styles.indexOf('@media (max-aspect-ratio: 1 / 1)'),
      styles.indexOf('// 格式说明弹窗'),
    )

    expect(styles).toMatch(/\.cards-grid--notes\s*\{\s*grid-template-columns:\s*repeat\(auto-fill, minmax\(200px, 1fr\)\);/)
    expect(portraitStyles).toMatch(/\.cards-grid--notes\s*\{\s*grid-template-columns:\s*repeat\(auto-fill, minmax\(150px, 1fr\)\);/)
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
    const portraitStyles = styles.slice(
      styles.indexOf('@media (max-aspect-ratio: 1 / 1)'),
      styles.indexOf('// 格式说明弹窗'),
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
    expect(notesCardStyles).toContain('text-align: start;')
    expect(notesCardStyles).toMatch(/\.notes-card-pronunciation-pair\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) auto;/)
    expect(notesCardStyles).toMatch(/\.notes-card-pronunciation-pair\s*>\s*span\s*\{[\s\S]*?text-align:\s*start;/)
    expect(notesCardStyles).toMatch(/\.notes-card-note-measure\s*\{[\s\S]*?inset-inline-start:\s*0;/)
    expect(notesCardStyles).toMatch(/\.word-text\s*\{[\s\S]*?font-size:\s*18px;/)
    expect(notesCardStyles).toMatch(/\.pronunciation-text\s*\{[\s\S]*?font-size:\s*16px;/)
    expect(notesCardStyles).toMatch(/\.notes-card-note-text\s*\{[\s\S]*?font-size:\s*15px;/)
    expect(portraitStyles).toContain('.word-text {\n        font-size: 14px;')
    expect(portraitStyles).toContain('.pronunciation-text {\n        font-size: 12px;')
    expect(portraitStyles).toMatch(/\.notes-card-note-text\s*\{\s*font-size:\s*13px;/)
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

    const localeSearchPlaceholderLabels = {
      'src/i18n/locales/zh-CN/words.json': '搜索音标、注释',
      'src/i18n/locales/zh-Hant/words.json': '搜尋音標、註釋',
      'src/i18n/locales/en/words.json': 'Search pronunciation or notes',
    }

    Object.entries(localeSearchPlaceholderLabels).forEach(([path, placeholder]) => {
      const source = readSource(path)
      expect(source).toContain(`"searchPlaceholder": "${placeholder}"`)
    })
  })
})
