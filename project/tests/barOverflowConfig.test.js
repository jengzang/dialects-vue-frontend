import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  createCommonBarItem,
  createCommonBarSchema,
  getCommonBarTabs,
  normalizeCommonBarSchema,
} from '../src/components/bar/commonBarNavigation.js'

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

describe('bar overflow navigation config', () => {
  it('keeps newly exposed overflow menu shortcuts as literal emoji', () => {
    const source = readSource(menuBarPath)
    const expectedShortcuts = [
      ['tools', '🧰'],
      ['praat', '🎙️'],
      ['charClass', '📚'],
      ['words', '📖'],
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
    expect(menuBarSource).toContain("overrides: { scroll: 'left', weight: 0.7, weightIconOnly: 0.4 }")
    expect(menuBarSource.match(/scroll: 'right'/g) || []).toHaveLength(5)

    expect(exploreBarSource).toContain("tab: 'home'")
    expect(exploreBarSource).toContain("overrides: { scroll: 'left', weightIconOnly: 0.4 }")
    expect(exploreBarSource.match(/scroll: 'right'/g) || []).toHaveLength(5)

    expect(villagesMlBarSource).toContain("id: 'home'")
    expect(villagesMlBarSource).toContain("overrides: { scroll: 'left', weightIconOnly: 0.4, fontSize: 1.0, mobileFontSize: 0.9 }")
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

  it('uses portrait aspect ratio without a hover gate for CommonBar and ExploreBar mobile layout', () => {
    for (const path of [commonBarPath, exploreBarComponentPath]) {
      const source = readSource(path)

      expect(source).toContain('@media (max-aspect-ratio: 1/1) {')
      expect(source).not.toContain('@media (max-aspect-ratio: 1/1) and (hover: none)')
      expect(source).not.toContain("window.matchMedia('(hover: hover)')")
    }
  })

  it('uses rendered portrait primary tabs when sizing overflow layouts', () => {
    const bars = [
      { path: navBarPath, activeCall: 'isMenuTabActive(t.tab)' },
      { path: commonBarPath, activeCall: 'isActiveComputed(t.tab)' },
      { path: exploreBarComponentPath, activeCall: 'isActiveComputed(t.tab)' },
    ]

    for (const { path, activeCall } of bars) {
      const source = readSource(path)

      expect(source).toContain('const getRenderedPrimaryTabs = (isMobile) =>')
      expect(source).toContain('.filter(t => !isMobile || !t.hideOnMobile)')
      expect(source).toContain('const getPrimaryTotalWeight = (isMobile) =>')
      expect(source).toContain('getRenderedPrimaryTabs(isMobile)')
      expect(source).toContain(`reduce((s, t) => s + getFlexWeight(t, ${activeCall}, isMobile), 0) || 1`)
      expect(source).toContain('getPrimaryTotalWeight(isMobile)')
      expect(source).toContain('if (navContentWidth.value > 0) {')
      expect(source).toContain('return `0 0 ${(w / totalWeight) * 100}%`')
      expect(source).not.toContain('primaryTotalWeight.value')
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
})
