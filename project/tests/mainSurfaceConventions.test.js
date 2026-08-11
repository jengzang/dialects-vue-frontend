import { execFileSync } from 'node:child_process'
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

function trackedVueFilesUnder(relativePath) {
  const output = execFileSync('git', ['ls-files', relativePath], {
    cwd: projectRoot,
    encoding: 'utf8',
  })

  return output
    .split('\n')
    .filter((file) => file.endsWith('.vue'))
    .map((file) => resolve(projectRoot, file))
}

describe('main surface conventions', () => {
  it('defines the canonical main glass surface primitives without the legacy main prefix', () => {
    const source = readSource('src/styles/main/_surfaces.scss')

    expect(source).toContain('.glass-shell')
    expect(source).toContain('.glass-panel')
    expect(source).toContain('.glass-card')
    expect(source).toContain('.glass-subpanel')
  })

  it('defines non-glass surface primitives for solid/plain containers', () => {
    const source = readSource('src/styles/main/_surfaces.scss')
    const panelBlock = blockFor(source, '.surface-panel')

    expect(source).toContain('.surface-shell')
    expect(source).toContain('.surface-panel')
    expect(source).toContain('.surface-card')
    expect(source).toContain('.surface-subpanel')
    expect(panelBlock).not.toContain('backdrop-filter')
    expect(panelBlock).toContain('var(--surface-panel')
  })

  it('keeps legacy main surface classes as compatibility aliases only', () => {
    const source = readSource('src/styles/main/_surfaces.scss')

    expect(source).toMatch(/\.glass-panel,\s*\n\.main-glass-panel\s*\{/)
    expect(source).toMatch(/\.glass-subpanel,\s*\n\.main-glass-panel-inner,\s*\n\.glass-panel-inner\s*\{/)
    expect(source).toMatch(/\.glass-shell,\s*\n\.main-glass-shell,\s*\n\.tool-glass-container,\s*\n\.glass-container-shell\s*\{/)
  })

  it('uses canonical surface class names in main Vue templates', () => {
    const legacyTokens = ['main-glass-panel', 'main-glass-panel-inner', 'main-glass-shell', 'glass-panel-inner']

    for (const file of trackedVueFilesUnder('src/main')) {
      const source = readFileSync(file, 'utf8')
      const classTokens = classAttributes(source).flatMap((className) => className.trim().split(/\s+/))

      for (const legacyToken of legacyTokens) {
        expect(classTokens, `${file} should not use ${legacyToken}`).not.toContain(legacyToken)
      }
    }
  })
})
