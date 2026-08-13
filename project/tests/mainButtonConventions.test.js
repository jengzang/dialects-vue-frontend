import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

function trackedStyleAndVueFilesUnder(relativePath) {
  const output = execFileSync('git', ['ls-files', relativePath], {
    cwd: projectRoot,
    encoding: 'utf8',
  })

  return output
    .split('\n')
    .filter((file) => file.endsWith('.vue') || file.endsWith('.scss'))
    .filter((file) => existsSync(resolve(projectRoot, file)))
    .map((file) => resolve(projectRoot, file))
}

function legacyTokenPattern(token) {
  return new RegExp(`(?<![\\w-])${token}(?![\\w-])`)
}

describe('main button conventions', () => {
  it('defines glass-button as the canonical main button primitive', () => {
    const source = readSource('src/styles/global/_buttons.scss')

    expect(source).toContain('.glass-button')
    expect(source).toContain("&[data-variant='primary']")
    expect(source).toContain("&[data-variant='secondary']")
    expect(source).toContain("&[data-variant='danger']")
    expect(source).toContain("&[data-variant='run']")
    expect(source).toContain("&[data-variant='enter']")
    expect(source).toContain("&[data-size='compact']")
  })

  it('does not keep legacy shared button selectors or variables', () => {
    const source = readSource('src/styles/global/_buttons.scss')
    const legacySelectors = ['.main-glass-button', '.run-btn', '.enter-btn', '.entry-button']
    const legacyVariables = ['--main-glass-button']

    for (const selector of legacySelectors) {
      expect(source, `shared buttons should not define ${selector}`).not.toContain(selector)
    }

    for (const variable of legacyVariables) {
      expect(source, `shared buttons should not fallback to ${variable}`).not.toContain(variable)
    }
  })

  it('does not keep legacy button tokens in tracked source files', () => {
    const legacyTokens = ['main-glass-button', 'run-btn', 'enter-btn', 'entry-button']

    for (const file of trackedStyleAndVueFilesUnder('src')) {
      const source = readFileSync(file, 'utf8')

      for (const legacyToken of legacyTokens) {
        expect(source, `${file} should not contain ${legacyToken}`).not.toMatch(legacyTokenPattern(legacyToken))
      }

      expect(source, `${file} should not contain legacy button variables`).not.toContain('--main-glass-button')
    }
  })
})
