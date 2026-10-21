// @vitest-environment node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { pathToFileURL } from 'node:url'
import { compileString } from 'sass'
import { compileStyle, parse as parseVue } from '@vue/compiler-sfc'
import { parse as parseCss } from 'postcss'

const source = readFileSync(resolve(import.meta.dirname, '../src/styles/global/_tokens.scss'), 'utf8')
const vmlSource = readFileSync(resolve(import.meta.dirname, '../src/styles/villagesml/_tokens.scss'), 'utf8')

function declarations(css, theme) {
  const selector = theme === 'blue' ? ':root' : `:root[data-color-theme='${theme}']`
  const block = css.slice(css.indexOf(`${selector} {`)).split('\n}')[0]
  return Object.fromEntries([...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2]]))
}

function palette(theme) {
  return { ...declarations(source, 'blue'), ...(theme === 'blue' ? {} : declarations(source, theme)) }
}

function value(tokens, name) {
  expect(tokens[name], `Missing theme role ${name}`).toBeDefined()
  return tokens[name].replace(/var\((--[\w-]+)\)/g, (_, ref) => value(tokens, ref))
}

function rgba(input) {
  if (input === 'white') return [255, 255, 255, 1]
  if (input.startsWith('#')) {
    const hex = input.length === 4 ? input.slice(1).split('').map(c => c + c).join('') : input.slice(1)
    return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16)).concat(1)
  }
  const channels = input.match(/^rgba?\(([^)]+)\)$/)?.[1].split(',').map(Number)
  if (!channels) throw new Error(`Expected a color, received ${input}`)
  return channels.length === 3 ? [...channels, 1] : channels
}

function over(fg, bg) {
  return fg.slice(0, 3).map((c, i) => c * fg[3] + bg[i] * (1 - fg[3])).concat(1)
}

function luminance(color) {
  const c = color.slice(0, 3).map(x => x / 255).map(x => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)
  return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722
}

function contrast(a, b) {
  const levels = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (levels[0] + 0.05) / (levels[1] + 0.05)
}

function compiledCss(path) {
  const filename = resolve(import.meta.dirname, '../src', path)
  const content = readFileSync(filename, 'utf8')
  const scss = path.endsWith('.vue') ? parseVue(content).descriptor.styles[0].content : content
  return compileString(scss, {
    url: pathToFileURL(filename),
    importers: [{ findFileUrl: url => url.startsWith('@/') ? pathToFileURL(resolve(import.meta.dirname, '../src', url.slice(2))) : null }],
    logger: { warn() {}, debug() {} },
  }).css
}

function compiledRule(path, selector, unconditional = false) {
  const css = compiledCss(path)
  let result
  parseCss(css).walkRules(rule => {
    if (unconditional && rule.parent.type !== 'root') return
    if (rule.selector.split(',').map(s => s.trim()).includes(selector)) result = { ...result, ...Object.fromEntries(rule.nodes.filter(n => n.type === 'decl').map(n => [n.prop, n.value])) }
  })
  expect(result, `${path}: ${selector}`).toBeDefined()
  return result
}

function resolved(input, tokens) {
  let result = input
  while (result.includes('var(')) {
    const next = result.replace(/var\((--[\w-]+)(?:,\s*([^()]+))?\)/g, (_, name, fallback) => tokens[name] || fallback)
    if (next === result) throw new Error(`Unresolved color ${result}`)
    result = next
  }
  return result
}

describe('approved theme palette readability', () => {
  it('limits compiled green settings surface overrides to the setting sections', () => {
    const result = compileStyle({
      source: compiledCss('main/views/menu/support/SettingsPage.vue'),
      id: 'data-v-settings-palette',
      scoped: true,
    })
    expect(result.errors).toEqual([])
    const selectors = []
    parseCss(result.code).walkRules(rule => {
      if (rule.nodes.some(n => n.prop === '--glass-panel-background' && n.value.includes('linear-gradient'))) selectors.push(rule.selector)
    })
    expect(selectors).toEqual([":root[data-color-theme='green'] .setting-section"])
  })

  it('keeps green floating fills readable above a light map', () => {
    const tokens = palette('green')
    for (const name of ['--glass-80', '--glass-90']) {
      const fill = rgba(value(tokens, name))
      expect(fill[3], name).toBeGreaterThanOrEqual(0.85)
      expect(contrast(rgba(value(tokens, '--text-primary')), over(fill, [255, 255, 255, 1])), name).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('separates green glass fills and specular highlights from the night canvas', () => {
    const tokens = palette('green')
    const page = rgba(value(tokens, '--bg-body'))
    const glass = over(rgba(value(tokens, '--glass-50')), page)
    expect(luminance(glass) - luminance(page)).toBeGreaterThan(0.018)
    const highlight = value(tokens, '--shadow-glass-inset').match(/inset[^,]*rgba\([^)]+\)/)?.[0].match(/rgba\([^)]+\)/)?.[0]
    expect(highlight).toBeDefined()
    expect(luminance(over(rgba(highlight), page)) - luminance(page)).toBeGreaterThan(0.025)
  })

  it('gives both secondary navigation bars a green glass fill', () => {
    const tokens = palette('green')
    for (const [component, selector] of [['CommonBar', '.commonbar'], ['ExploreBar', '.explorebar']]) {
      const rule = compiledRule(`components/bar/${component}.vue`, selector, true)
      const background = resolved(rule.background || 'none', tokens)
      expect(background, component).toContain('linear-gradient')
    }
  })

  it('uses an actual dark forest canvas with readable green-theme surface text', () => {
    const tokens = palette('green')
    const page = rgba(value(tokens, '--bg-body'))
    expect(luminance(page)).toBeLessThan(0.04)
    for (const name of ['--surface-panel', '--surface-panel-strong', '--surface-elevation-0', '--glass-50', '--glass-90', '--sidebar-item-background']) {
      const surface = over(rgba(value(tokens, name)), page)
      expect(luminance(surface), name).toBeLessThan(0.08)
      for (const text of ['--text-primary', '--text-secondary', '--text-muted']) {
        expect(contrast(rgba(value(tokens, text)), surface), `${text} on ${name}`).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  for (const theme of ['blue', 'green', 'light', 'dark']) {
    it(`${theme}: gives primary and secondary colors coherent RGB values and readable accents`, () => {
      const tokens = palette(theme)
      const page = rgba(value(tokens, '--bg-body'))
      const panel = over(rgba(value(tokens, '--surface-panel')), page)
      for (const role of ['primary', 'secondary']) {
        expect(value(tokens, `--color-${role}-rgb`).split(',').map(Number)).toEqual(rgba(value(tokens, `--color-${role}`)).slice(0, 3))
      }
      const secondary = rgba(value(tokens, '--color-secondary-text'))
      expect(contrast(secondary, panel)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(secondary, over(rgba(value(tokens, '--color-secondary-bg')), panel))).toBeGreaterThanOrEqual(4.5)
      expect(contrast(rgba(value(tokens, '--color-secondary-hover')), panel)).toBeGreaterThanOrEqual(4.5)
    })

    it(`${theme}: pairs filled primary and entry actions with readable labels`, () => {
      const tokens = palette(theme)
      const panel = over(rgba(value(tokens, '--surface-panel')), rgba(value(tokens, '--bg-body')))
      for (const role of ['action-primary', 'enter-button']) {
        for (const state of ['bg', 'bg-hover']) {
          const fill = value(tokens, `--${role}-${state}`)
          const stops = fill.startsWith('linear-gradient') ? fill.match(/rgba?\([^)]+\)|#[\da-f]+/gi) : [fill]
          for (const stop of stops) {
            const bg = over(rgba(stop), panel)
            expect(contrast(rgba(value(tokens, `--${role}-text`)), bg), `${role}-${state}`).toBeGreaterThanOrEqual(4.5)
          }
        }
      }
    })
  }

  it('keeps VillagesML green interface foregrounds readable on the night canvas', () => {
    const tokens = { ...palette('green'), ...declarations(vmlSource, 'green') }
    const panel = rgba(value(tokens, '--surface-elevation-0'))
    for (const name of ['--vml-blue', '--vml-blue-dark', '--vml-blue-darker', '--vml-blue-darkest', '--vml-blue-highlight']) {
      expect(contrast(rgba(value(tokens, name)), panel), name).toBeGreaterThanOrEqual(4.5)
    }
  })

  for (const [path, selector] of [
    ['styles/main/_buttons.scss', '.run-btn'],
    ['styles/global/_buttons.scss', '.close-btn'],
    ['components/ToastAndHelp/ErrorBoundary.vue', '.error-boundary-btn--primary'],
    ['main/components/pho/PhoneticCompare.vue', '.feature-tab.active'],
    ['main/views/explore/tools/CheckTool.vue', '.tab-btn.active'],
    ['main/components/geo/RegionSelector.vue', '.region-tag.custom-region-tag'],
    ['main/components/geo/RegionSelector.vue', '.topbar-btn'],
    ['main/views/explore/Praat.vue', '.start-button'],
    ['main/views/explore/Praat.vue', '.mode-options .radio-option.active'],
    ['main/components/praat/PitchTonePanel.vue', '.analyze-btn'],
    ['main/components/praat/PitchTonePanel.vue', '.step-header .step-number'],
  ]) {
    it(`keeps actual compiled ${selector} labels readable in all four themes`, () => {
      const rule = compiledRule(path, selector)
      for (const theme of ['blue', 'green', 'light', 'dark']) {
        const tokens = palette(theme)
        const panel = over(rgba(value(tokens, '--surface-panel')), rgba(value(tokens, '--bg-body')))
        const fill = resolved(rule.background, tokens)
        const stops = fill.startsWith('linear-gradient') ? fill.match(/rgba?\([^)]+\)|#[\da-f]+/gi) : [fill]
        for (const stop of stops) {
          const bg = over(rgba(stop), panel)
          const fg = over(rgba(resolved(rule.color, tokens)), bg)
          expect(contrast(fg, bg), `${theme} ${selector}`).toBeGreaterThanOrEqual(4.5)
        }
      }
    })
  }

  it('uses each selected theme for Praat actions and decorative gradient endpoints', () => {
    const start = compiledRule('main/views/explore/Praat.vue', '.start-button')
    const analyze = compiledRule('main/components/praat/PitchTonePanel.vue', '.analyze-btn')
    const title = compiledRule('main/views/explore/Praat.vue', '.page-title')
    const steps = compiledRule('main/components/praat/PitchTonePanel.vue', '.step-header .step-number')
    for (const theme of ['blue', 'green', 'light', 'dark']) {
      const tokens = palette(theme)
      for (const action of [start, analyze]) {
        expect(resolved(action.background, tokens)).toBe(value(tokens, '--action-primary-bg'))
        expect(resolved(action.color, tokens)).toBe(value(tokens, '--action-primary-text'))
      }
      for (const decoration of [title, steps]) {
        const gradient = resolved(decoration.background, tokens)
        expect(gradient).toContain(value(tokens, '--color-primary'))
        expect(gradient).toContain(value(tokens, '--color-secondary-text'))
      }
    }
  })
})
