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
const buttonsPath = resolve(projectRoot, 'src/styles/global/_buttons.scss')
const formsPath = resolve(projectRoot, 'src/styles/global/_forms.scss')
const mainSurfacesPath = resolve(projectRoot, 'src/styles/global/_surfaces.scss')
const globalGlassPath = resolve(projectRoot, 'src/styles/global/_glass.scss')
const basePath = resolve(projectRoot, 'src/styles/global/_base.scss')
const homePagePath = resolve(projectRoot, 'src/main/views/HomePage.vue')
const queryPagePath = resolve(projectRoot, 'src/main/views/menu/QueryPage.vue')
const mapLibrePath = resolve(projectRoot, 'src/main/components/map/MapLibre.vue')
const countphosPath = resolve(projectRoot, 'src/main/components/pho/Countphos.vue')
const regionSelectorPath = resolve(projectRoot, 'src/main/components/geo/RegionSelector.vue')
const jyut2IpaToolPath = resolve(projectRoot, 'src/main/views/explore/tools/Jyut2IpaTool.vue')
const simpleDropdownPath = resolve(projectRoot, 'src/components/selector/SimpleDropdown.vue')
const multiSelectDropdownPath = resolve(projectRoot, 'src/components/selector/MultiSelectDropdown.vue')

function readSource(path) {
  return readFileSync(path, 'utf8')
}

function themeBlock(source, theme) {
  const match = source.match(new RegExp(`:root\\[data-color-theme='${theme}'\\] \\{([\\s\\S]*?)\\n\\}`))
  return match?.[1] || ''
}

function rootBlock(source) {
  const match = source.match(/:root \{([\s\S]*?)\n\}\n\n:root\[data-color-theme='light'\]/)
  return match?.[1] || ''
}

describe('color theme token coverage', () => {
  it('keeps default blue values stable and maps semantic aliases to existing blue tokens', () => {
    const source = readSource(tokensPath)
    const defaultBlock = rootBlock(source)

    expect(defaultBlock).toContain('--color-primary: #007aff;')
    expect(defaultBlock).toContain('--color-primary-hover: #0051d5;')
    expect(defaultBlock).toContain('--color-primary-rgb: 0, 122, 255;')
    expect(defaultBlock).toContain('--bg-page-gradient: radial-gradient(1200px 800px at 10% -10%, #dff1ff, #dff1ff00 60%),')

    expect(defaultBlock).toContain('--surface-glass-button: var(--surface-elevation-0);')
    expect(defaultBlock).toContain('--surface-glass-button-hover: var(--surface-elevation-1);')
    expect(defaultBlock).toContain('--surface-selected: var(--bg-blue-light);')
    expect(defaultBlock).toContain('--action-primary-bg: linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.78), rgba(var(--color-primary-rgb), 0.6));')
    expect(defaultBlock).toContain('--action-primary-bg-hover: linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.86), rgba(var(--color-primary-rgb), 0.68));')
    expect(defaultBlock).toContain('--action-primary-text: white;')
    expect(defaultBlock).toContain('--focus-ring: 0 0 0 4px rgba(var(--color-primary-rgb), 0.1);')
    expect(defaultBlock).toContain('--switch-thumb-background: white;')
    expect(defaultBlock).toContain('--switch-label-text: black;')
  })

  it('uses semantic aliases in high-impact interactive surfaces', () => {
    const buttonsSource = readSource(buttonsPath)
    const formsSource = readSource(formsPath)
    const mainSurfacesSource = readSource(mainSurfacesPath)
    const globalGlassSource = readSource(globalGlassPath)
    const toolbarsSource = readSource(toolbarsPath)

    expect(buttonsSource).toContain('background: var(--surface-glass-button);')
    expect(buttonsSource).toContain('background: var(--action-primary-bg);')
    expect(buttonsSource).toContain('color: var(--action-primary-text);')
    expect(buttonsSource).toContain('background: var(--action-primary-bg-hover);')
    expect(buttonsSource).toContain('box-shadow: var(--action-primary-shadow);')
    expect(formsSource).toContain('background-color: var(--surface-selected);')
    expect(formsSource).toContain('color: var(--text-selected);')
    expect(formsSource).toContain('border-color: var(--glass-field-focus-border-color, var(--border-control-focus));')
    expect(formsSource).toContain('box-shadow: var(--glass-field-focus-shadow, var(--focus-ring));')
    expect(formsSource).toContain('background-color: var(--switch-hover-background);')
    expect(formsSource).toContain('color: var(--switch-label-text);')
    expect(readSource(basePath)).toContain('background: var(--switch-thumb-background);')
    expect(readSource(basePath)).toContain('background-color: var(--switch-thumb-background);')
    expect(mainSurfacesSource).toContain('background: var(--glass-panel-background, var(--surface-panel));')
    expect(globalGlassSource).toContain('background: var(--surface-panel);')
    expect(toolbarsSource).toContain('background: var(--sidebar-item-background);')
    expect(toolbarsSource).toContain('color: var(--sidebar-item-text);')
  })

  it('uses neutral primary accents for light and white primary accents for dark themes', () => {
    const source = readSource(tokensPath)
    const lightBlock = themeBlock(source, 'light')
    const darkBlock = themeBlock(source, 'dark')

    expect(lightBlock).toContain('--color-primary: #1d1d1f;')
    expect(lightBlock).toContain('--color-primary-rgb: 29, 29, 31;')
    expect(lightBlock).toContain('--color-primary-cyan: #6e7681;')
    expect(lightBlock).not.toContain('--color-primary: #5f6368;')
    expect(lightBlock).not.toContain('--color-primary: #2f80ed;')
    expect(lightBlock).not.toContain('--color-primary-rgb: 47, 128, 237;')

    expect(darkBlock).toContain('--color-primary: #f0f6fc;')
    expect(darkBlock).toContain('--color-primary-rgb: 240, 246, 252;')
    expect(darkBlock).toContain('--color-primary-cyan: #79c0ff;')
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
    expect(lightBlock).toContain('--bg-blue-light: #f8fbff;')
    expect(lightBlock).toContain('--surface-panel: rgba(255, 255, 255, 0.88);')
    expect(lightBlock).toContain('--surface-selected: #f5f8fc;')
    expect(lightBlock).not.toContain('#f0eadf')
    expect(lightBlock).not.toContain('#f4efe3')
    expect(lightBlock).not.toContain('#fff8df')
    expect(lightBlock).not.toContain('#fffdf8')
    expect(lightBlock).not.toContain('#f7f7f5')
    expect(lightBlock).not.toContain('#f6f6f4')
    expect(lightBlock).not.toContain('#f3f3f1')
    expect(lightBlock).not.toContain('229, 229, 226')
    expect(lightBlock).not.toContain('210, 210, 206')
    expect(lightBlock).not.toContain('79, 70, 56')
    expect(lightBlock).not.toContain('111, 106, 96')
    expect(lightBlock).not.toContain('112, 106, 96')
    expect(lightBlock).not.toContain('120, 120, 116')
    expect(lightBlock).not.toContain('#d9d9d7')
    expect(lightBlock).not.toContain('#ededeb')
    expect(lightBlock).not.toContain('#e4e4e1')
  })

  it('does not hard-code dark text in high-visibility themed pages', () => {
    expect(readSource(homePagePath)).not.toMatch(/color:\s*rgba\(0,\s*0,\s*0,\s*0\.[^)]+\)/)
    expect(readSource(queryPagePath)).not.toContain('color: #333;')
    expect(readSource(mapLibrePath)).not.toContain('color: black;')
    expect(readSource(mapLibrePath)).not.toContain('border: 0.7px solid black;')
    expect(readSource(countphosPath)).not.toContain('color: #274b73;')
    expect(readSource(countphosPath)).not.toContain('color: #35679b;')
    expect(readSource(regionSelectorPath)).not.toContain('color: rgba(0, 0, 0, 0.55);')
    expect(readSource(jyut2IpaToolPath)).not.toContain('color: #1e40af;')
  })

  it('uses theme-aware text and border tokens in selector dropdowns', () => {
    const simpleDropdownSource = readSource(simpleDropdownPath)
    const multiSelectDropdownSource = readSource(multiSelectDropdownPath)

    for (const source of [simpleDropdownSource, multiSelectDropdownSource]) {
      expect(source).not.toContain('$text-primary: rgba(0, 0, 0')
      expect(source).not.toContain('$text-secondary: rgba(0, 0, 0')
      expect(source).not.toContain('$text-muted: rgba(0, 0, 0')
      expect(source).not.toContain('$divider-color: rgba(0, 0, 0')
      expect(source).not.toContain('border: 1px solid rgba(0, 0, 0, 0.15);')
      expect(source).toContain('$text-primary: var(--text-primary);')
      expect(source).toContain('$text-muted: var(--text-muted);')
      expect(source).toContain('$divider-color: var(--border-light);')
      expect(source).toContain('border: 1px solid var(--border-control);')
    }

    expect(multiSelectDropdownSource).toContain('$text-secondary: var(--text-secondary);')
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

    expect(lightBlock).toContain('--vml-blue: #1d1d1f;')
    expect(lightBlock).toContain('--vml-blue-rgb: 29, 29, 31;')
    expect(lightBlock).toContain('--vml-blue-medium: #64748b;')
    expect(lightBlock).toContain('--vml-blue-highlight: #475569;')
    expect(darkBlock).toContain('--vml-blue: #f5f5f7;')
    expect(darkBlock).toContain('--vml-blue-rgb: 245, 245, 247;')
    expect(darkBlock).toContain('--vml-blue-highlight: #ffffff;')
    expect(darkBlock).not.toContain('#d8c08a')
    expect(darkBlock).not.toContain('216, 192, 138')
    expect(readSource(villagesMlSurfacesPath)).toContain('var(--vml-blue-highlight)')
    expect(readSource(villagesMlSurfacesPath)).not.toContain('#5ba3f5')
  })
})
