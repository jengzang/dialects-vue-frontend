import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = resolve(import.meta.dirname, '..')
const repoRoot = resolve(projectRoot, '..')
const packageJson = JSON.parse(readFileSync(resolve(projectRoot, 'package.json'), 'utf8'))

function readProjectFile(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

describe('platform build scripts', () => {
  it('exposes script entry points for web, native asset, and native app verification', () => {
    expect(packageJson.scripts).toMatchObject({
      'build:web': 'npm run build',
      'build:ios': expect.stringContaining('vite build --mode ios'),
      'build:android': expect.stringContaining('vite build --mode android'),
      'verify:platform:web': 'node ./scripts/verify-platform-builds.mjs web',
      'verify:platform:ios': 'node ./scripts/verify-platform-builds.mjs ios',
      'verify:platform:android': 'node ./scripts/verify-platform-builds.mjs android',
      'verify:platform:all': 'node ./scripts/verify-platform-builds.mjs all',
    })
  })

  it('keeps native app verification in a single scripted build harness', () => {
    const source = readProjectFile('scripts/verify-platform-builds.mjs')

    expect(source).toContain("['run', 'build:web']")
    expect(source).toContain("['run', 'build:ios']")
    expect(source).toContain("['run', 'build:android']")
    expect(source).toContain("['cap', 'sync']")
    expect(source).toContain("['assembleDebug']")
    expect(source).toContain('xcodebuild')
    expect(source).toContain('ANDROID_HOME')
    expect(source).toContain('JAVA_HOME')
    expect(source).toContain('IOS_SIMULATOR_DESTINATION')
    expect(source).toContain('HTTP_PROXY')
    expect(source).toContain('HTTPS_PROXY')
    expect(source).toContain('ALL_PROXY')
  })

  it('runs from project but targets native directories at the repository root', () => {
    const source = readProjectFile('scripts/verify-platform-builds.mjs')

    expect(source).toContain("const repoRoot = path.resolve(projectRoot, '..')")
    expect(source).toContain("path.join(repoRoot, 'android')")
    expect(source).toContain("path.join(repoRoot, 'ios/App/App.xcodeproj')")
    expect(resolve(repoRoot, 'android')).not.toContain('/project/android')
    expect(resolve(repoRoot, 'ios')).not.toContain('/project/ios')
  })
})
