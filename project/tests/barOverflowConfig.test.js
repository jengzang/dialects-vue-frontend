import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { getDefaultTabScroll, sortTabsByScroll, useBarOverflow } from '../src/composables/bar/useBarOverflow.js'
import {
  createCommonBarItem,
  createCommonBarSchema,
  getCommonBarTabs,
  normalizeCommonBarSchema,
} from '../src/utils/bar/commonBarNavigation.js'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')
const menuBarPath = resolve(projectRoot, 'src/main/config/BarAndTabs/MenuBarConfig.js')
const exploreBarPath = resolve(projectRoot, 'src/main/config/BarAndTabs/ExploreBarConfig.js')
const villagesMlBarPath = resolve(projectRoot, 'src/VillagesML/config/BarConfig.js')
const navBarPath = resolve(projectRoot, 'src/components/bar/NavBar.vue')
const commonBarPath = resolve(projectRoot, 'src/components/bar/CommonBar.vue')
const exploreBarComponentPath = resolve(projectRoot, 'src/components/bar/ExploreBar.vue')

function readSource(path) {
  return readFileSync(path, 'utf8')
}

function menuTabBlock(source, tabName) {
  const start = source.indexOf(`tab: '${tabName}'`)
  expect(start).toBeGreaterThan(-1)

  const nextTab = source.indexOf('createMenuTab({', start + 1)
  return source.slice(start, nextTab === -1 ? source.indexOf('\n  ])', start) : nextTab)
}

function exploreTabBlock(source, tabName) {
  const start = source.indexOf(`tab: '${tabName}'`)
  expect(start).toBeGreaterThan(-1)

  const nextTab = source.indexOf('createExploreTab({', start + 1)
  const end = nextTab === -1 ? source.length : nextTab
  return source.slice(start, end)
}

describe('bar overflow navigation config', () => {
  it('keeps newly exposed overflow menu shortcuts as literal emoji', () => {
    const source = readSource(menuBarPath)
    const expectedShortcuts = [
      ['tools', '🧰'],
      ['praat', '🎙️'],
      ['charClass', '📚'],
      ['yubao', '📖'],
      ['villages', '🏘️'],
    ]

    for (const [tabName, icon] of expectedShortcuts) {
      const block = menuTabBlock(source, tabName)
      expect(block).not.toMatch(/icon:\s*'\\u/)
      expect(block).toContain(`icon: '${icon}'`)
    }
  })

  it('marks the new edge shortcuts as overflow tabs without changing primary tabs', () => {
    const menuBarSource = readSource(menuBarPath)
    const exploreBarSource = readSource(exploreBarPath)
    const villagesMlBarSource = readSource(villagesMlBarPath)

    expect(menuBarSource).toContain("tab: 'home'")
    expect(menuBarSource).toContain("overrides: { mobileScroll: 'left', weight: 0.7, weightIconOnly: 0.4 }")
    expect(menuBarSource.match(/scroll: 'right'/g) || []).toHaveLength(2)

    expect(exploreBarSource).toContain("tab: 'home'")
    expect(exploreBarSource).toContain("overrides: { scroll: 'left', weightIconOnly: 0.4 }")
    expect(exploreBarSource.match(/scroll: 'right'/g) || []).toHaveLength(5)

    expect(villagesMlBarSource).toContain("id: 'home'")
    expect(villagesMlBarSource).toContain("overrides: { mobileScroll: 'left', weightIconOnly: 0.4, fontSize: 1.0, mobileFontSize: 0.9 }")
  })

  it('keeps existing mobile-only overflow assignments scoped to mobile layouts', () => {
    const cases = [
      { path: menuBarPath, tabName: 'home', assignment: "mobileScroll: 'left'", getBlock: menuTabBlock },
      { path: menuBarPath, tabName: 'charClass', assignment: "mobileScroll: 'right'", getBlock: menuTabBlock },
      { path: exploreBarPath, tabName: 'pho', assignment: "mobileScroll: 'right'", getBlock: exploreTabBlock },
      { path: exploreBarPath, tabName: 'query', assignment: "mobileScroll: 'right'", getBlock: exploreTabBlock },
    ]

    for (const { path, tabName, assignment, getBlock } of cases) {
      const block = getBlock(readSource(path), tabName)
      expect(block).toContain(assignment)
      expect(block).not.toMatch(/\bscroll\s*:/)
    }

    const villagesMlSource = readSource(villagesMlBarPath)
    const homeStart = villagesMlSource.indexOf("id: 'home'")
    const nextItem = villagesMlSource.indexOf("id: 'search'", homeStart + 1)
    expect(homeStart).toBeGreaterThan(-1)
    const homeBlock = villagesMlSource.slice(homeStart, nextItem)
    expect(homeBlock).toContain("mobileScroll: 'left'")
    expect(homeBlock).not.toMatch(/\bscroll\s*:/)
  })

  it('preserves CommonBar overflow roles after schema normalization', () => {
    const schema = createCommonBarSchema({
      items: [
        createCommonBarItem({
          id: 'home',
          label: '首页',
          icon: '🏠',
          display: {
            overrides: { scroll: 'left', weightIconOnly: 0.4 },
          },
          navigation: {
            defaultTo: '/',
          },
        }),
      ],
    })
    const normalizedSchema = normalizeCommonBarSchema(schema)

    expect(getCommonBarTabs(schema)[0].scroll).toBe('left')
    expect(getCommonBarTabs(normalizedSchema)[0].scroll).toBe('left')
  })

  it('preserves mobile-only overflow roles after schema normalization', () => {
    const schema = createCommonBarSchema({
      items: [
        createCommonBarItem({
          id: 'search',
          label: '搜索',
          icon: '🔍',
          display: {
            overrides: { mobileScroll: 'left', weightIconOnly: 0.4 },
          },
          navigation: {
            defaultTo: '/search',
          },
        }),
      ],
    })
    const normalizedSchema = normalizeCommonBarSchema(schema)

    expect(getCommonBarTabs(schema)[0].scroll).toBeUndefined()
    expect(getCommonBarTabs(schema)[0].mobileScroll).toBe('left')
    expect(getCommonBarTabs(normalizedSchema)[0].scroll).toBeUndefined()
    expect(getCommonBarTabs(normalizedSchema)[0].mobileScroll).toBe('left')
  })

  it('uses portrait aspect ratio without a hover gate for CommonBar and ExploreBar mobile layout', () => {
    for (const path of [commonBarPath, exploreBarComponentPath]) {
      const source = readSource(path)

      expect(source).toContain('@media (max-aspect-ratio: 1/1) {')
      expect(source).not.toContain('@media (max-aspect-ratio: 1/1) and (hover: none)')
      expect(source).not.toContain("window.matchMedia('(hover: hover)')")
    }
  })

  it('sizes overflow against rendered primary tabs in both orientations', () => {
    const primary = { tab: 'query', weight: 1 }
    const hidden = { tab: 'hidden', weight: 1, hideOnMobile: true }
    const edge = { tab: 'edge', weight: 1, scroll: 'right' }
    const width = ref(600)
    const overflow = useBarOverflow({
      orderedTabs: ref([primary, hidden, edge]),
      orderedMobileTabs: ref([primary, hidden, edge]),
      hasOverflowDesktop: ref(true), hasOverflowMobile: ref(true),
      navContentWidth: width, getTabScroll: getDefaultTabScroll, resolveIsActive: () => true,
    })
    expect(overflow.getOverflowFlex(primary, true, false)).toBe('0 0 300px')
    expect(overflow.getOverflowFlex(primary, true, true)).toBe('0 0 600px')
    expect(overflow.getOverflowFlex(edge, false, true)).toBe('0 0 auto')
    width.value = 0
    expect(overflow.getOverflowFlex(primary, true, true)).toBe('0 0 100%')
    for (const path of [navBarPath, commonBarPath, exploreBarComponentPath]) {
      expect(readSource(path)).toContain('useBarOverflow({')
    }
  })

  it('does not animate tab flex sizing during overflow layout updates', () => {
    for (const path of [navBarPath, commonBarPath, exploreBarComponentPath]) {
      const source = readSource(path)
      const tabItemStart = path === navBarPath
        ? source.indexOf('.menu-item {')
        : source.indexOf('.tab-item {')
      expect(tabItemStart).toBeGreaterThan(-1)

      const tabItemEnd = source.indexOf('\n.logo-container', tabItemStart)
      const tabItemBlock = source.slice(tabItemStart, tabItemEnd)
      expect(tabItemBlock).not.toContain('transition: all')
      expect(tabItemBlock).toContain('background')
      expect(tabItemBlock).toContain('box-shadow')
    }
  })

  it('uses separate desktop and portrait scroll snap thresholds', () => {
    for (const path of [navBarPath, commonBarPath, exploreBarComponentPath]) {
      const source = readSource(path)

      expect(source).toContain('{ desktop: 30, portrait: 18 }')
      expect(source).not.toContain('useScrollSnap(navRef, orderedTabs, 30, mobileNavRef)')
    }
  })

  it('uses shared overflow spacing with local navbar placement', () => {
    const mixins = readSource(resolve(projectRoot, 'src/components/bar/_bar-shared.scss'))
    expect(mixins).toContain('@mixin bar-overflow-tabs')
    for (const path of [commonBarPath, exploreBarComponentPath]) {
      expect(readSource(path)).toContain('@include bar-overflow-tabs')
    }
    expect(readSource(navBarPath)).toContain('padding-inline: 12px;')
  })

  it('sorts mobile overflow separately while preserving desktop roles', () => {
    const tabs = [{ tab: 'main' }, { tab: 'mobile', mobileScroll: 'left' }, { tab: 'right', scroll: 'right' }]
    expect(sortTabsByScroll(tabs, false, getDefaultTabScroll).map(t => t.tab)).toEqual(['main', 'mobile', 'right'])
    expect(sortTabsByScroll(tabs, true, getDefaultTabScroll).map(t => t.tab)).toEqual(['mobile', 'main', 'right'])
    for (const path of [navBarPath, commonBarPath, exploreBarComponentPath]) {
      const source = readSource(path)
      expect(source).toContain('getDefaultTabScroll(tab, isMobile)')
      expect(source).toContain('sortTabsByScroll(')
      expect(source).toContain('v-for="t in orderedMobileTabs"')
      expect(source).toContain("getTabScroll(t, true) === 'left'")
      expect(source).toContain("getTabScroll(t, false) === 'right'")
    }
  })

})
