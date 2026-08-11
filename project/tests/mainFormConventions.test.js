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

function trackedMainStyleAndVueFiles() {
  const output = execFileSync('git', ['ls-files', 'src/main', 'src/styles/main'], {
    cwd: projectRoot,
    encoding: 'utf8',
  })

  return output
    .split('\n')
    .filter((file) => file.endsWith('.vue') || file.endsWith('.scss'))
    .map((file) => resolve(projectRoot, file))
}

function legacyTokenPattern(token) {
  return new RegExp(`(?<![\\w-])${token}(?![\\w-])`)
}

describe('main form conventions', () => {
  it('defines glass-field and glass-dropdown as the canonical main form primitives', () => {
    const source = readSource('src/styles/main/_forms.scss')

    expect(source).toContain('.glass-field')
    expect(source).toContain("&[data-shape='search']")
    expect(source).toContain("&[data-size='compact']")
    expect(source).toContain('.glass-dropdown-panel')
    expect(source).toContain('.glass-dropdown-item')
    expect(source).toContain('.glass-range')
  })

  it('does not define legacy main field selectors', () => {
    const source = readSource('src/styles/main/_forms.scss')
    const legacySelectors = ['.main-search-field', '.main-input-field', '.glass-input', '.choice-dropdown-panel', '.choice-dropdown-item']

    for (const selector of legacySelectors) {
      expect(source, `main forms should not define ${selector}`).not.toContain(selector)
    }
  })

  it('does not keep legacy main field tokens in tracked main source files', () => {
    const legacyTokens = ['main-search-field', 'main-input-field', 'glass-input', 'choice-dropdown-panel', 'choice-dropdown-item']

    for (const file of trackedMainStyleAndVueFiles()) {
      const source = readFileSync(file, 'utf8')

      for (const legacyToken of legacyTokens) {
        expect(source, `${file} should not contain ${legacyToken}`).not.toMatch(legacyTokenPattern(legacyToken))
      }
    }
  })
})
