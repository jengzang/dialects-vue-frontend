import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = resolve(import.meta.dirname, '..')
const repoRoot = resolve(projectRoot, '..')

function readRepoFile(relativePath) {
  return readFileSync(resolve(repoRoot, relativePath), 'utf8')
}

describe('platform build documentation', () => {
  it('documents where web, iOS, and Android builds are run from', () => {
    const docPath = resolve(repoRoot, 'docs/PLATFORM_BUILD.md')
    expect(existsSync(docPath)).toBe(true)

    const doc = readRepoFile('docs/PLATFORM_BUILD.md')

    expect(doc).toContain('cd dialects-vue-frontend/project')
    expect(doc).toContain('npm run build:web')
    expect(doc).toContain('npm run build:ios')
    expect(doc).toContain('npm run build:android')
    expect(doc).toContain('npm run verify:platform:web')
    expect(doc).toContain('npm run verify:platform:ios')
    expect(doc).toContain('npm run verify:platform:android')
    expect(doc).toContain('npm run verify:platform:acceptance')
    expect(doc).toContain('npm run verify:platform:all')
    expect(doc).toContain('Praat 真機 / 模擬器交互驗收')
    expect(doc).toContain('adb install -r')
    expect(doc).toContain('xcrun simctl install booted')
    expect(doc).toContain('android/')
    expect(doc).toContain('ios/')
    expect(doc).toContain('project/android')
    expect(doc).toContain('project/ios')
  })

  it('links the platform build guide from the main documentation indexes', () => {
    expect(readRepoFile('README.md')).toContain('./docs/PLATFORM_BUILD.md')
    expect(readRepoFile('docs/README.md')).toContain('./PLATFORM_BUILD.md')
  })
})
