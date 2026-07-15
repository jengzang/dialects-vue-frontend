import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')
const menuBarPath = resolve(projectRoot, 'src/main/config/BarAndTabs/MenuBarConfig.js')
const exploreBarPath = resolve(projectRoot, 'src/main/config/BarAndTabs/ExploreBarConfig.js')
const villagesMlBarPath = resolve(projectRoot, 'src/VillagesML/config/BarConfig.js')

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
})
