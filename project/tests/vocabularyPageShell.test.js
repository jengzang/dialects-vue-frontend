import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(path) {
  return readFileSync(resolve(projectRoot, path), 'utf8')
}

describe('vocabulary explore page shell wiring', () => {
  it('registers /explore/vocabulary as a words peer route and layout page', () => {
    expect(readSource('src/main/router/exploreRoutes.js')).toContain("path: 'explore/vocabulary'")
    expect(readSource('src/main/App.vue')).toContain("normalizedPath === '/explore/vocabulary'")
    expect(readSource('src/main/router.js')).toContain("'/explore/vocabulary':")
  })

  it('exposes vocabulary page from words entry points and bars', () => {
    expect(readSource('src/main/views/menu/portals/WordsPage.vue')).toContain("'/explore/vocabulary'")
    expect(readSource('src/main/views/HomePage.vue')).toContain("navigateTo('/explore/vocabulary')")
    expect(readSource('src/main/config/BarAndTabs/ExploreBarConfig.js')).toContain("'/explore/vocabulary'")
    expect(readSource('src/main/config/BarAndTabs/SideBarConfig.js')).toContain("'/explore/vocabulary'")
  })

  it('keeps the words parent entry on /menu/words while listing vocabulary before YuBao pages', () => {
    const wordsPortal = readSource('src/main/views/menu/portals/WordsPage.vue')
    const homePage = readSource('src/main/views/HomePage.vue')
    const exploreBar = readSource('src/main/config/BarAndTabs/ExploreBarConfig.js')
    const sidebar = readSource('src/main/config/BarAndTabs/SideBarConfig.js')
    const menuBar = readSource('src/main/config/BarAndTabs/MenuBarConfig.js')

    expect(exploreBar).toContain("defaultTo: { path: withRouteLocale(route, '/menu/words') }")
    expect(exploreBar).toContain("defaultChild: '/explore/vocabulary'")
    expect(menuBar).toContain("defaultTo: { path: withRouteLocale(route, '/menu/words') }")
    expect(sidebar).toContain("path: withRouteLocale(route, '/menu/words')")
    expect(sidebar).toContain("path: buildLocalePath('zh-Hant', '/explore/vocabulary')")

    expect(wordsPortal.indexOf('handleWordList')).toBeLessThan(wordsPortal.indexOf('handleYuBaoVocabulary'))
    expect(homePage.indexOf("navigateTo('/explore/vocabulary')")).toBeLessThan(homePage.indexOf("navigateTo('/explore/yubao?tab=vocabulary')"))
    expect(exploreBar.indexOf("'/explore/vocabulary'")).toBeLessThan(exploreBar.indexOf("'/explore/yubao?tab=vocabulary'"))
    expect(sidebar.indexOf("'/explore/vocabulary'")).toBeLessThan(sidebar.indexOf("'/explore/yubao?tab=vocabulary'"))
  })

  it('builds the vocabulary workspace with reusable controls and three workflows', () => {
    const vocabularyPage = readSource('src/main/views/explore/word/VocabularyPage.vue')

    expect(vocabularyPage).toContain("import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'")
    expect(vocabularyPage).toContain("import UniversalTable from '@/main/components/TableAndTree/UniversalTable.vue'")
    expect(vocabularyPage).toContain("import { getVocabularyItems, uploadVocabulary } from '@/api'")
    expect(vocabularyPage).toContain('<SimpleSelectDropdown')
    expect(vocabularyPage).toContain('<UniversalTable')
    expect(vocabularyPage).not.toContain('MultiSelectDropdown')
    expect(vocabularyPage).not.toContain('LocationAndRegionInput')
    expect(vocabularyPage).toContain('top-controls')
    expect(vocabularyPage).toContain('search-container')
    expect(vocabularyPage).toContain('view-mode-selector')
    expect(vocabularyPage).toContain("key: 'list'")
    expect(vocabularyPage).toContain("key: 'upload'")
    expect(vocabularyPage).toContain("key: 'review'")
    expect(vocabularyPage).toContain("viewMode === 'card'")
    expect(vocabularyPage).toContain("viewMode === 'table'")
    expect(vocabularyPage).toContain("viewMode === 'map'")
  })

  it('keeps vocabulary card and map queries separate from the table API', () => {
    const vocabularyPage = readSource('src/main/views/explore/word/VocabularyPage.vue')

    expect(vocabularyPage).toContain("return activeWorkflow.value === 'list' && viewMode.value !== 'table'")
    expect(vocabularyPage).toContain('getVocabularyItems(buildVocabularyItemsParams())')
    expect(vocabularyPage).toContain("locations: parseLocationFilter(locationQuery.value)")
    expect(vocabularyPage).toContain("selectedSearchField.value !== 'all'")
    expect(vocabularyPage).toContain('const mappableEntries = computed')
    expect(vocabularyPage).toContain('Number.isFinite(entry.longitude)')
    expect(vocabularyPage).toContain('Number.isFinite(entry.latitude)')
    expect(vocabularyPage).toContain('db-key="vocabulary"')
    expect(vocabularyPage).toContain('table-name="vocabulary_entries"')
    expect(vocabularyPage).toContain('api-adapter="vocabulary"')
    expect(vocabularyPage).toContain('primary-key="id"')
    expect(vocabularyPage).toContain('uploadVocabulary')
    expect(vocabularyPage).toContain("parser_mode: uploadParserMode.value")
    expect(vocabularyPage).toContain('isVocabularyPreviewFile(file)')
    expect(vocabularyPage).toContain('isVocabularyUploadFile(file)')
    expect(vocabularyPage).toContain('uploadFile.value || importFlow.pendingFile.value')
    expect(vocabularyPage).toContain("accept=\".xlsx,.xls,.csv,.tsv,.docx,.doc\"")
    expect(vocabularyPage).toContain(':mapping-enabled="isVocabularyPreviewFile(selectedUploadFile)"')
    expect(vocabularyPage).toContain('canConfirmUpload')
    expect(vocabularyPage).toContain("t('words.wordList.upload.submit')")
    expect(vocabularyPage).toContain("t('words.wordList.upload.unsupportedFile')")
    expect(vocabularyPage).not.toContain('sortBy')
    expect(vocabularyPage).not.toContain('sortOptions')
    expect(vocabularyPage).not.toContain('previewEntries')
  })
})
