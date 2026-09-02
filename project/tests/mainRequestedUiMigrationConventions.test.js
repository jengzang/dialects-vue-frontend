import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

function blockFor(source, selector) {
  const start = source.indexOf(selector)
  if (start === -1) return ''
  const open = source.indexOf('{', start)
  if (open === -1) return ''

  let depth = 0
  for (let index = open; index < source.length; index += 1) {
    const char = source[index]
    if (char === '{') depth += 1
    if (char === '}') depth -= 1
    if (depth === 0) return source.slice(start, index + 1)
  }

  return ''
}

function classAttributes(source) {
  return [...source.matchAll(/\bclass=["']([^"']*)["']/g)].map((match) => match[1])
}

function classTokens(className) {
  return className.trim().split(/\s+/)
}

describe('requested main ui primitive migrations', () => {
  it('removes the user liquid and local auth visual systems from the requested files', () => {
    const requestedUserFiles = [
      'src/main/components/user/UserDataPage.vue',
      'src/main/components/user/UserRegionPage.vue',
      'src/main/components/user/auth/LoginForm.vue',
      'src/main/components/user/auth/RegisterForm.vue',
      'src/main/components/user/auth/ProfileOverview.vue',
      'src/main/components/user/auth/ModifyProfileForm.vue',
    ]
    const legacyTokens = [
      'liquid-panel',
      'liquid-btn',
      '@mixin glass-panel',
      'btn-search',
      'benefit-circle-btn',
      'user-profile-card',
      'stats-card',
      'modify-avatar-card',
    ]

    for (const file of requestedUserFiles) {
      const source = readSource(file)

      for (const legacyToken of legacyTokens) {
        expect(source, `${file} should not contain ${legacyToken}`).not.toContain(legacyToken)
      }
    }
  })

  it('removes the requested map custom form visual hooks from templates and styles', () => {
    const requestedMapFiles = [
      'src/main/components/map/custom/CustomDataEntryModal.vue',
      'src/main/components/map/custom/feature/FeatureRecordEditorModal.vue',
      'src/main/components/map/custom/point/PointDetailForm.vue',
    ]
    const legacyTokens = [
      'entry-mode-button',
      'feature-record-input',
      'quick-select-pill',
      'point-field-input',
      'point-row-input',
      'point-row-remove',
      'feature-search-emoji-btn',
    ]

    for (const file of requestedMapFiles) {
      const source = readSource(file)

      for (const legacyToken of legacyTokens) {
        expect(source, `${file} should not contain ${legacyToken}`).not.toContain(legacyToken)
      }
    }
  })

  it('uses glass-field for draw panel text and color inputs without local visual field chrome', () => {
    const panelFiles = [
      'src/main/components/map/Draw/panels/MapDrawToolsPanel.vue',
      'src/main/components/map/Draw/panels/MapDrawLayersPanel.vue',
    ]

    for (const file of panelFiles) {
      const source = readSource(file)
      const drawInputClasses = classAttributes(source).filter((className) => classTokens(className).some((token) => token === 'draw-input' || token === 'draw-color-input'))

      expect(drawInputClasses.length, `${file} should contain draw input hooks`).toBeGreaterThan(0)

      for (const className of drawInputClasses) {
        expect(classTokens(className), `${file} draw inputs should use glass-field`).toContain('glass-field')
      }
    }

    const sharedSource = readSource('src/main/components/map/Draw/panels/panelShared.scss')
    const sharedDrawFieldBlock = blockFor(sharedSource, '.draw-input,')
    const colorInputBlock = blockFor(sharedSource, '.draw-color-input')

    for (const block of [sharedDrawFieldBlock, colorInputBlock]) {
      expect(block).not.toMatch(/\bborder\s*:/)
      expect(block).not.toMatch(/\bborder-radius\s*:/)
      expect(block).not.toMatch(/\bbackground\s*:/)
    }
  })
})
