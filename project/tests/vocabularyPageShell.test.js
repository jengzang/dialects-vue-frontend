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
    const exploreRoutes = readSource('src/main/router/exploreRoutes.js')

    expect(exploreRoutes).toContain("path: 'explore/vocabulary'")
    expect(exploreRoutes).toContain("redirect: (to) => ({")
    expect(exploreRoutes).toContain("'/explore/vocabulary/view'")
    expect(exploreRoutes).toContain("path: 'view'")
    expect(exploreRoutes).toContain("path: 'import'")
    expect(exploreRoutes).toContain("path: 'manage'")
    expect(readSource('src/main/App.vue')).toContain("normalizedPath.startsWith('/explore/vocabulary')")
    expect(readSource('src/main/router.js')).toContain("'/explore/vocabulary/view':")
  })

  it('exposes vocabulary page from words entry points and bars', () => {
    expect(readSource('src/main/views/menu/portals/WordsPage.vue')).toContain("'/explore/vocabulary/view'")
    expect(readSource('src/main/views/HomePage.vue')).toContain("navigateTo('/explore/vocabulary/view')")
    expect(readSource('src/main/config/BarAndTabs/ExploreBarConfig.js')).toContain("'/explore/vocabulary/view'")
    expect(readSource('src/main/config/BarAndTabs/SideBarConfig.js')).toContain("'/explore/vocabulary/view'")
  })

  it('keeps the words parent entry on /menu/words while listing vocabulary before YuBao pages', () => {
    const wordsPortal = readSource('src/main/views/menu/portals/WordsPage.vue')
    const homePage = readSource('src/main/views/HomePage.vue')
    const exploreBar = readSource('src/main/config/BarAndTabs/ExploreBarConfig.js')
    const sidebar = readSource('src/main/config/BarAndTabs/SideBarConfig.js')
    const menuBar = readSource('src/main/config/BarAndTabs/MenuBarConfig.js')

    expect(exploreBar).toContain("defaultTo: { path: withRouteLocale(route, '/menu/words') }")
    expect(exploreBar).toContain("defaultChild: '/explore/vocabulary/view'")
    expect(menuBar).toContain("defaultTo: { path: withRouteLocale(route, '/menu/words') }")
    expect(sidebar).toContain("path: withRouteLocale(route, '/menu/words')")
    expect(sidebar).toContain("path: buildLocalePath('zh-Hant', '/explore/vocabulary/view')")

    expect(wordsPortal.indexOf('handleWordList')).toBeLessThan(wordsPortal.indexOf('handleYuBaoVocabulary'))
    expect(homePage.indexOf("navigateTo('/explore/vocabulary/view')")).toBeLessThan(homePage.indexOf("navigateTo('/explore/yubao?tab=vocabulary')"))
    expect(exploreBar.indexOf("'/explore/vocabulary/view'")).toBeLessThan(exploreBar.indexOf("'/explore/yubao?tab=vocabulary'"))
    expect(sidebar.indexOf("'/explore/vocabulary/view'")).toBeLessThan(sidebar.indexOf("'/explore/yubao?tab=vocabulary'"))
  })

  it('keeps the vocabulary shell focused on page-level navigation', () => {
    const vocabularyPage = readSource('src/main/views/explore/word/VocabularyPage.vue')

    expect(vocabularyPage).toContain('<router-view')
    expect(vocabularyPage).toContain('top-controls')
    expect(vocabularyPage).toContain("'/explore/vocabulary/view'")
    expect(vocabularyPage).toContain("'/explore/vocabulary/import'")
    expect(vocabularyPage).toContain("'/explore/vocabulary/manage'")
    expect(vocabularyPage).toContain("t('words.wordList.tabs.manage')")
    expect(vocabularyPage).not.toContain("t('words.wordList.tabs.locations')")
    expect(vocabularyPage).not.toContain('getVocabularyItems')
    expect(vocabularyPage).not.toContain('uploadVocabulary')
    expect(vocabularyPage).not.toContain('getVocabularyLocations')
  })

  it('keeps vocabulary card and map queries separate from the table API', () => {
    const vocabularyPage = readSource('src/main/views/explore/word/vocabulary/VocabularyViewPage.vue')

    expect(vocabularyPage).toContain("return viewMode.value === 'card'")
    expect(vocabularyPage).toContain("return viewMode.value === 'map'")
    expect(vocabularyPage).toContain('getVocabularyItems(buildVocabularyItemsParams())')
    expect(vocabularyPage).toContain('getVocabularyMapPoints(buildVocabularyMapPointsParams())')
    expect(vocabularyPage).toContain('loadActiveViewMode()')
    expect(vocabularyPage).toContain('locations: selectedLocations.value')
    expect(vocabularyPage).toContain('search_fields: normalizeSelectedSearchFields()')
    expect(vocabularyPage).toContain('const selectedSearchFields = ref([])')
    expect(vocabularyPage).toContain('const selectedLocations = ref([])')
    expect(vocabularyPage).toContain('loadVocabularyLocationOptions')
    expect(vocabularyPage).not.toContain('parseLocationFilter')
    expect(vocabularyPage).toContain('const mapPoints = ref([])')
    expect(vocabularyPage).toContain('mapDataForYuBaoMap')
    expect(vocabularyPage).toContain('handleMapPointClick')
    expect(vocabularyPage).toContain('normalizeMapPointLocations')
    expect(vocabularyPage).toContain('@marker-click="handleMapPointClick"')
    expect(vocabularyPage).toContain('isMapDetailModalOpen')
    expect(vocabularyPage).toContain('isLoadingMapDetail')
    expect(vocabularyPage).toContain('mapDetailEntries')
    expect(vocabularyPage).toContain('mapDetailError')
    expect(vocabularyPage).toContain('selectedMapPointLabel')
    expect(vocabularyPage).not.toContain('map-side-panel')
    expect(vocabularyPage).not.toContain('map-result-list')
    expect(vocabularyPage).toContain('locations,')
    expect(vocabularyPage).toContain('location_label')
    expect(vocabularyPage).toContain('standard_word')
    expect(vocabularyPage).toContain('local_expression')
    expect(vocabularyPage).toContain('ipa')
    expect(vocabularyPage).toContain('notes')
    expect(vocabularyPage).toContain("value: 'pronunciation'")
    expect(vocabularyPage).toContain("value: 'detail'")
    expect(vocabularyPage).not.toContain("value: 'ipa'")
    expect(vocabularyPage).not.toContain("value: 'notes'")
    expect(vocabularyPage).not.toContain('const mappableEntries = computed')
    expect(vocabularyPage).toContain('db-key="vocabulary"')
    expect(vocabularyPage).toContain('table-name="vocabulary_entries"')
    expect(vocabularyPage).toContain('api-adapter="vocabulary"')
    expect(vocabularyPage).toContain('primary-key="id"')
    expect(vocabularyPage).not.toContain('uploadVocabulary')
    expect(vocabularyPage).not.toContain('getVocabularyLocations')
    expect(vocabularyPage).not.toContain('sortBy')
    expect(vocabularyPage).not.toContain('sortOptions')
    expect(vocabularyPage).not.toContain('previewEntries')
  })

  it('feeds YuBaoMap drawable aggregate points and a fixed-height canvas', () => {
    const vocabularyPage = readSource('src/main/views/explore/word/vocabulary/VocabularyViewPage.vue')
    const vocabularyScss = readSource('src/main/views/explore/word/vocabulary/vocabulary.scss')

    expect(vocabularyPage).toContain('pronunciation: point.markerLabel')
    expect(vocabularyPage).toContain('markerLabel: entryCount ? String(entryCount) : (locationLabel || locationName)')
    expect(vocabularyScss).toContain('height: 69dvh')
    expect(vocabularyScss).toContain('max-height: 69dvh')
  })

  it('uses dedicated vocabulary locations APIs for location metadata management', () => {
    const vocabularyPage = readSource('src/main/views/explore/word/vocabulary/VocabularyManagePage.vue')

    expect(vocabularyPage).toContain('getVocabularyLocations')
    expect(vocabularyPage).toContain('updateVocabularyLocation')
    expect(vocabularyPage).toContain('loadVocabularyLocations')
    expect(vocabularyPage).toContain('handleSaveLocation')
    expect(vocabularyPage).not.toContain("activeWorkflow === 'locations'")
    expect(vocabularyPage).toContain("t('words.wordList.locations.title')")
    expect(vocabularyPage).not.toContain('reviewSubmissions')
    expect(vocabularyPage).not.toContain("t('words.wordList.review.approve')")
  })

  it('keeps vocabulary import flow isolated from view and manage pages', () => {
    const importPage = readSource('src/main/views/explore/word/vocabulary/VocabularyImportPage.vue')
    const viewPage = readSource('src/main/views/explore/word/vocabulary/VocabularyViewPage.vue')
    const managePage = readSource('src/main/views/explore/word/vocabulary/VocabularyManagePage.vue')

    expect(importPage).toContain('uploadVocabulary')
    expect(importPage).toContain("parser_mode: uploadParserMode.value")
    expect(importPage).toContain('isVocabularyPreviewFile(file)')
    expect(importPage).toContain('isVocabularyUploadFile(file)')
    expect(importPage).toContain('uploadFile.value || importFlow.pendingFile.value')
    expect(importPage).toContain("accept=\".xlsx,.xls,.csv,.tsv,.docx,.doc\"")
    expect(importPage).toContain(':mapping-enabled="isVocabularyPreviewFile(selectedUploadFile)"')
    expect(importPage).toContain('canConfirmUpload')
    expect(importPage).toContain("t('words.wordList.upload.submit')")
    expect(importPage).toContain("t('words.wordList.upload.unsupportedFile')")
    expect(viewPage).not.toContain('uploadVocabulary')
    expect(managePage).not.toContain('uploadVocabulary')
  })

  it('matches the YuBao card grid density and glass card treatment', () => {
    const vocabularyScss = readSource('src/main/views/explore/word/vocabulary/vocabulary.scss')

    expect(vocabularyScss).toContain('grid-template-columns: repeat(auto-fill, minmax(340px, 1fr))')
    expect(vocabularyScss).toContain('background: var(--glass-80)')
    expect(vocabularyScss).toContain('border: 0.5px solid var(--glass-90)')
    expect(vocabularyScss).toContain('transform: translateY(-2px)')
    expect(vocabularyScss).toContain('font-family: var(--font-monospace')
  })
})
