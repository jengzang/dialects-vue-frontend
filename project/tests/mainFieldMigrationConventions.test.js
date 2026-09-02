import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

const requestedFieldFiles = [
  'src/main/components/map/custom/feature/FeatureRecordEditorModal.vue',
  'src/main/components/map/custom/point/PointDetailForm.vue',
  'src/main/components/map/custom/CustomDataPanel.vue',
  'src/main/components/map/custom/feature/FeatureDetailTable.vue',
  'src/main/components/map/custom/feature/FeatureScopeSelectionModal.vue',
  'src/main/components/map/Draw/modals/AdminBoundaryModal.vue',
  'src/main/components/map/Draw/modals/VoronoiFieldMergeModal.vue',
  'src/main/components/map/Draw/modals/VoronoiIgnorePointsModal.vue',
  'src/main/components/map/Draw/panels/MapDrawToolsPanel.vue',
  'src/main/components/map/Draw/panels/MapDrawLayersPanel.vue',
]

const nonFieldInputTypes = new Set(['checkbox', 'radio', 'range', 'file', 'color', 'hidden'])

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

function lineNumberFor(source, index) {
  return source.slice(0, index).split('\n').length
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

function classTokensFor(tag) {
  const staticClass = tag.match(/\bclass\s*=\s*["']([^"']*)["']/)?.[1] ?? ''
  return staticClass.trim().split(/\s+/).filter(Boolean)
}

function fieldLikeControls(source) {
  return [...source.matchAll(/<(input|select|textarea)\b[^>]*>/g)]
    .filter((match) => {
      const tag = match[0]
      const element = match[1]
      const type = tag.match(/\btype\s*=\s*["']([^"']*)["']/)?.[1] ?? 'text'
      return element !== 'input' || !nonFieldInputTypes.has(type)
    })
    .map((match) => ({
      line: lineNumberFor(source, match.index),
      tag: match[0],
    }))
}

describe('main field migration conventions', () => {
  it('uses glass-field for requested map custom and draw panel ordinary fields', () => {
    for (const file of requestedFieldFiles) {
      const source = readSource(file)
      const controls = fieldLikeControls(source)

      expect(controls.length, `${file} should have ordinary field controls`).toBeGreaterThan(0)

      for (const control of controls) {
        expect(classTokensFor(control.tag), `${file}:${control.line} should include glass-field`).toContain('glass-field')
      }
    }
  })

  it('keeps draw input shared styles as layout hooks instead of field chrome', () => {
    const source = readSource('src/main/components/map/Draw/panels/panelShared.scss')
    const blocks = [
      blockFor(source, '.draw-input,'),
      blockFor(source, '.draw-input {'),
      blockFor(source, '.draw-color-input {'),
    ]

    for (const block of blocks) {
      expect(block).not.toMatch(/\bborder\s*:/)
      expect(block).not.toMatch(/\bborder-radius\s*:/)
      expect(block).not.toMatch(/\bbackground\s*:/)
    }
  })
})
