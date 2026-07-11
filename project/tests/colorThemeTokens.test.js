import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')
const tokensPath = resolve(projectRoot, 'src/styles/global/_tokens.scss')
const commonBarPath = resolve(projectRoot, 'src/components/bar/CommonBar.vue')
const exploreBarPath = resolve(projectRoot, 'src/components/bar/ExploreBar.vue')
const navBarPath = resolve(projectRoot, 'src/components/bar/NavBar.vue')
const villagesMlTokensPath = resolve(projectRoot, 'src/styles/villagesml/_tokens.scss')

function readSource(path) {
  return readFileSync(path, 'utf8')
}

function themeBlock(source, theme) {
  const match = source.match(new RegExp(`:root\\[data-color-theme='${theme}'\\] \\{([\\s\\S]*?)\\n\\}`))
  return match?.[1] || ''
}

describe('color theme token coverage', () => {
  it('uses non-blue primary accents for light and dark themes', () => {
    const source = readSource(tokensPath)
    const lightBlock = themeBlock(source, 'light')
    const darkBlock = themeBlock(source, 'dark')

    expect(lightBlock).toContain('--color-primary: #8a6a2f;')
    expect(lightBlock).toContain('--color-primary-rgb: 138, 106, 47;')
    expect(lightBlock).toContain('--color-primary-cyan: #9a7a3a;')
    expect(lightBlock).not.toContain('--color-primary: #2f80ed;')
    expect(lightBlock).not.toContain('--color-primary-rgb: 47, 128, 237;')

    expect(darkBlock).toContain('--color-primary: #d8c08a;')
    expect(darkBlock).toContain('--color-primary-rgb: 216, 192, 138;')
    expect(darkBlock).toContain('--color-primary-cyan: #d8c08a;')
    expect(darkBlock).not.toContain('--color-primary: #62a8ff;')
    expect(darkBlock).not.toContain('--color-primary-rgb: 98, 168, 255;')
  })

  it('does not hard-code darkblue navigation accents', () => {
    expect(readSource(commonBarPath)).not.toContain('darkblue')
    expect(readSource(exploreBarPath)).not.toContain('darkblue')
    expect(readSource(navBarPath)).not.toContain('darkblue')
  })

  it('maps VillagesML blue tokens to non-blue theme accents', () => {
    const source = readSource(villagesMlTokensPath)
    const lightBlock = themeBlock(source, 'light')
    const darkBlock = themeBlock(source, 'dark')

    expect(lightBlock).toContain('--vml-blue: #8a6a2f;')
    expect(lightBlock).toContain('--vml-blue-rgb: 138, 106, 47;')
    expect(darkBlock).toContain('--vml-blue: #d8c08a;')
    expect(darkBlock).toContain('--vml-blue-rgb: 216, 192, 138;')
  })
})
