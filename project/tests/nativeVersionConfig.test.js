import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { computeVersionCode, readUpdateNoticeVersion } from '../scripts/sync-native-version.mjs'

const projectRoot = resolve(import.meta.dirname, '..')
const repoRoot = resolve(projectRoot, '..')

function readRepoFile(relativePath) {
  return readFileSync(resolve(repoRoot, relativePath), 'utf8')
}

describe('native app version metadata', () => {
  it('keeps Android and iOS versions aligned with the update notice', () => {
    const { version, versionCode } = readUpdateNoticeVersion(repoRoot)
    const androidBuild = readRepoFile('android/app/build.gradle')
    const iosProject = readRepoFile('ios/App/App.xcodeproj/project.pbxproj')
    const capacitorConfig = readRepoFile('project/capacitor.config.json')

    expect(androidBuild).toContain(`versionCode ${versionCode}`)
    expect(androidBuild).toContain(`versionName "${version}"`)
    expect(iosProject).toContain(`CURRENT_PROJECT_VERSION = ${versionCode};`)
    expect(iosProject).toContain(`MARKETING_VERSION = ${version};`)
    expect(capacitorConfig).toContain(`"appName": "方音圖鑑-v${version}"`)
  })

  it('uses the versioned Traditional Chinese Android app name', () => {
    const appName = `方音圖鑑-v${readUpdateNoticeVersion(repoRoot).version}`

    for (const locale of ['values', 'values-zh-rCN', 'values-zh-rTW']) {
      const strings = readRepoFile(`android/app/src/main/res/${locale}/strings.xml`)
      expect(strings).toContain(`<string name="app_name">${appName}</string>`)
      expect(strings).toContain(`<string name="title_activity_main">${appName}</string>`)
    }
  })

  it('syncs native versions automatically in native build scripts', () => {
    const packageJson = JSON.parse(readRepoFile('project/package.json'))

    expect(computeVersionCode(5, 3, 1)).toBe(50301)
    expect(packageJson.scripts['build:native']).toContain('node ./scripts/sync-native-version.mjs')
    expect(packageJson.scripts['build:ios']).toContain('node ./scripts/sync-native-version.mjs')
    expect(packageJson.scripts['build:android']).toContain('node ./scripts/sync-native-version.mjs')
  })
})
