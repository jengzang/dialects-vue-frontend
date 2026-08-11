import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

function extractSelectorBlocks(source, selector) {
  const blocks = []
  let searchFrom = 0
  const selectorPattern = new RegExp(`(^|[^\\w-])${selector.replace('.', '\\.')}(?![\\w-])`, 'g')

  while (searchFrom < source.length) {
    selectorPattern.lastIndex = searchFrom
    const match = selectorPattern.exec(source)
    if (!match) break

    const selectorIndex = match.index + match[1].length

    const openBraceIndex = source.indexOf('{', selectorIndex)
    if (openBraceIndex === -1) break

    let depth = 0
    for (let index = openBraceIndex; index < source.length; index += 1) {
      if (source[index] === '{') depth += 1
      if (source[index] === '}') depth -= 1

      if (depth === 0) {
        blocks.push(source.slice(openBraceIndex + 1, index))
        searchFrom = index + 1
        break
      }
    }

    if (searchFrom <= selectorIndex) break
  }

  return blocks
}

function topLevelDeclarations(block) {
  let depth = 0
  let current = ''
  const declarations = []

  for (const char of block) {
    if (char === '{') {
      depth += 1
      current = ''
      continue
    }

    if (char === '}') {
      depth -= 1
      current = ''
      continue
    }

    if (depth === 0) {
      current += char

      if (char === ';') {
        const declaration = current.trim()
        if (declaration) declarations.push(declaration)
        current = ''
      }
    }
  }

  return declarations
}

describe('main style structure conventions', () => {
  it('keeps layout helpers out of surface primitives', () => {
    const surfaces = readSource('src/styles/main/_surfaces.scss')
    const layout = readSource('src/styles/main/_layout.scss')
    const entry = readSource('src/styles/main-entry.scss')

    expect(surfaces).not.toContain('.main-card-grid')
    expect(layout).toContain('.main-card-grid')
    expect(entry).toContain("@use './main/layout' as main-layout;")
  })

  it('keeps shared page title rules in info utilities', () => {
    const surfaces = readSource('src/styles/main/_surfaces.scss')
    const info = readSource('src/styles/main/_info.scss')

    expect(surfaces).not.toContain('.panel-title')
    expect(info).not.toContain('.panel-title')
    expect(info).toContain('.page-title')
    expect(info).not.toMatch(/@media\s*\(\s*(?:max|min)-width:/)
  })

  it('uses the global page title utility for repeated tab page titles', () => {
    for (const file of [
      'src/main/views/menu/PhoPage.vue',
      'src/main/views/menu/QueryPage.vue',
      'src/main/views/menu/ComparePage.vue',
      'src/main/views/menu/MapPage.vue',
    ]) {
      expect(readSource(file), file).not.toContain('.page-title {')
    }
  })

  it('keeps page title local overrides limited to size, margin, and color', () => {
    const allowedProperties = new Set([
      'font-size',
      'margin',
      'margin-top',
      'margin-right',
      'margin-bottom',
      'margin-left',
      'color',
    ])

    for (const file of [
      'src/main/views/menu/support/SettingsPage.vue',
      'src/main/views/explore/charClass/CharacterClassification.vue',
      'src/main/views/explore/Praat.vue',
      'src/main/views/explore/word/YuBaoPage.vue',
      'src/main/views/explore/word/vocabulary/vocabulary.scss',
      'src/main/components/user/UserRegionPage.vue',
      'src/main/components/user/LeaderboardPanel.vue',
    ]) {
      const source = readSource(file)

      for (const block of extractSelectorBlocks(source, '.page-title')) {
        expect(block, `${file} page-title does not use local mixins`).not.toContain('@include')

        for (const declaration of topLevelDeclarations(block)) {
          const property = declaration.split(':')[0]?.trim()
          expect(allowedProperties.has(property), `${file} page-title local declaration "${declaration}"`).toBe(true)
        }
      }
    }
  })
})
