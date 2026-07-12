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
const villagesMlSurfacesPath = resolve(projectRoot, 'src/styles/villagesml/_surfaces.scss')
const toolbarsPath = resolve(projectRoot, 'src/styles/main/_toolbars.scss')

function readSource(path) {
  return readFileSync(path, 'utf8')
}

function themeBlock(source, theme) {
  const match = source.match(new RegExp(`:root\\[data-color-theme='${theme}'\\] \\{([\\s\\S]*?)\\n\\}`))
  return match?.[1] || ''
}

describe('color theme token coverage', () => {
  it('uses neutral primary accents for light and white primary accents for dark themes', () => {
    const source = readSource(tokensPath)
    const lightBlock = themeBlock(source, 'light')
    const darkBlock = themeBlock(source, 'dark')

    expect(lightBlock).toContain('--color-primary: #6f6a60;')
    expect(lightBlock).toContain('--color-primary-rgb: 111, 106, 96;')
    expect(lightBlock).toContain('--color-primary-cyan: #8f8a80;')
    expect(lightBlock).not.toContain('--color-primary: #2f80ed;')
    expect(lightBlock).not.toContain('--color-primary-rgb: 47, 128, 237;')

    expect(darkBlock).toContain('--color-primary: #f5f5f7;')
    expect(darkBlock).toContain('--color-primary-rgb: 245, 245, 247;')
    expect(darkBlock).toContain('--color-primary-cyan: #f5f5f7;')
    expect(darkBlock).not.toContain('--color-primary: #62a8ff;')
    expect(darkBlock).not.toContain('--color-primary-rgb: 98, 168, 255;')
    expect(darkBlock).not.toContain('#d8c08a')
    expect(darkBlock).not.toContain('216, 192, 138')
    expect(darkBlock).not.toContain('#191817')
    expect(darkBlock).not.toContain('84, 78, 68')
  })

  it('keeps the light theme off-white instead of yellow', () => {
    const source = readSource(tokensPath)
    const lightBlock = themeBlock(source, 'light')

    expect(lightBlock).toContain('--bg-body: #fdfdfd;')
    expect(lightBlock).toContain('--bg-white: #ffffff;')
    expect(lightBlock).toContain('--bg-page-gradient: radial-gradient(1200px 800px at 8% -12%, #ffffff, #ffffff00 58%),')
    expect(lightBlock).not.toContain('#f0eadf')
    expect(lightBlock).not.toContain('#f4efe3')
    expect(lightBlock).not.toContain('#fff8df')
    expect(lightBlock).not.toContain('#fffdf8')
  })

  it('gives the sidebar shell dedicated theme-aware glass surface tokens', () => {
    const source = readSource(tokensPath)
    const lightBlock = themeBlock(source, 'light')
    const darkBlock = themeBlock(source, 'dark')
    const toolbarsSource = readSource(toolbarsPath)

    expect(lightBlock).toContain('--sidebar-shell-background:')
    expect(lightBlock).toContain('--sidebar-shell-border:')
    expect(lightBlock).toContain('--sidebar-shell-shadow:')
    expect(darkBlock).toContain('--sidebar-shell-background:')
    expect(darkBlock).toContain('--sidebar-shell-border:')
    expect(darkBlock).toContain('--sidebar-shell-shadow:')
    expect(toolbarsSource).toContain('background: var(--sidebar-shell-background);')
    expect(toolbarsSource).toContain('border: 1px solid var(--sidebar-shell-border);')
    expect(toolbarsSource).toContain('box-shadow: var(--sidebar-shell-shadow);')
    expect(toolbarsSource).not.toContain('background: var(--bg-page-gradient);')
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

    expect(lightBlock).toContain('--vml-blue: #6f6a60;')
    expect(lightBlock).toContain('--vml-blue-rgb: 111, 106, 96;')
    expect(lightBlock).toContain('--vml-blue-highlight: #8f8a80;')
    expect(darkBlock).toContain('--vml-blue: #f5f5f7;')
    expect(darkBlock).toContain('--vml-blue-rgb: 245, 245, 247;')
    expect(darkBlock).toContain('--vml-blue-highlight: #ffffff;')
    expect(darkBlock).not.toContain('#d8c08a')
    expect(darkBlock).not.toContain('216, 192, 138')
    expect(readSource(villagesMlSurfacesPath)).toContain('var(--vml-blue-highlight)')
    expect(readSource(villagesMlSurfacesPath)).not.toContain('#5ba3f5')
  })
})
