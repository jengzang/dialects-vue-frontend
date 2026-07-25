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

  it('uses vocabulary as the default and first words entry before YuBao pages', () => {
    const wordsPortal = readSource('src/main/views/menu/portals/WordsPage.vue')
    const homePage = readSource('src/main/views/HomePage.vue')
    const exploreBar = readSource('src/main/config/BarAndTabs/ExploreBarConfig.js')
    const sidebar = readSource('src/main/config/BarAndTabs/SideBarConfig.js')
    const menuBar = readSource('src/main/config/BarAndTabs/MenuBarConfig.js')

    expect(exploreBar).toContain("defaultTo: { path: withRouteLocale(route, '/explore/vocabulary') }")
    expect(exploreBar).toContain("defaultChild: '/explore/vocabulary'")
    expect(menuBar).toContain("defaultTo: { path: withRouteLocale(route, '/explore/vocabulary') }")
    expect(sidebar).toContain("path: withRouteLocale(route, '/explore/vocabulary')")
    expect(sidebar).toContain("path: buildLocalePath('zh-Hant', '/explore/vocabulary')")

    expect(wordsPortal.indexOf('handleWordList')).toBeLessThan(wordsPortal.indexOf('handleYuBaoVocabulary'))
    expect(homePage.indexOf("navigateTo('/explore/vocabulary')")).toBeLessThan(homePage.indexOf("navigateTo('/explore/yubao?tab=vocabulary')"))
    expect(exploreBar.indexOf("'/explore/vocabulary'")).toBeLessThan(exploreBar.indexOf("'/explore/yubao?tab=vocabulary'"))
    expect(sidebar.indexOf("'/explore/vocabulary'")).toBeLessThan(sidebar.indexOf("'/explore/yubao?tab=vocabulary'"))
  })

  it('builds the vocabulary workspace with reusable controls and three workflows', () => {
    const vocabularyPage = readSource('src/main/views/explore/word/VocabularyPage.vue')

    expect(vocabularyPage).toContain("import MultiSelectDropdown from '@/components/selector/MultiSelectDropdown.vue'")
    expect(vocabularyPage).toContain('<MultiSelectDropdown')
    expect(vocabularyPage).toContain("key: 'list'")
    expect(vocabularyPage).toContain("key: 'upload'")
    expect(vocabularyPage).toContain("key: 'review'")
    expect(vocabularyPage).toContain("viewMode === 'card'")
    expect(vocabularyPage).toContain("viewMode === 'table'")
    expect(vocabularyPage).toContain("viewMode === 'map'")
  })
})
