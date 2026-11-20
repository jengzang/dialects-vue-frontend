import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = resolve(import.meta.dirname, '..')
const repoRoot = resolve(projectRoot, '..')

function readRepoFile(relativePath) {
  return readFileSync(resolve(repoRoot, relativePath), 'utf8')
}

function readUpdateNoticeVersion() {
  const source = readRepoFile('project/src/utils/user/updateNoticeConfig.js')
  const match = source.match(/version:\s*'v(\d+\.\d+\.\d+)'/)
  if (!match) throw new Error('updateNoticeConfig.js must define a semver version')
  return match[1]
}

describe('native app version metadata', () => {
  it('keeps Android and iOS versions aligned with the update notice', () => {
    const version = readUpdateNoticeVersion()
    const androidBuild = readRepoFile('android/app/build.gradle')
    const iosProject = readRepoFile('ios/App/App.xcodeproj/project.pbxproj')
    const capacitorConfig = readRepoFile('project/capacitor.config.json')

    expect(androidBuild).toContain(`versionName "${version}"`)
    expect(iosProject).toContain(`MARKETING_VERSION = ${version};`)
    expect(capacitorConfig).toContain(`\"appName\": \"方音圖鑑-v${version}\"`)
  })

  it('uses the versioned Traditional Chinese Android app name', () => {
    const appName = `方音圖鑑-v${readUpdateNoticeVersion()}`

    for (const locale of ['values', 'values-zh-rCN', 'values-zh-rTW']) {
      const strings = readRepoFile(`android/app/src/main/res/${locale}/strings.xml`)
      expect(strings).toContain(`<string name="app_name">${appName}</string>`)
      expect(strings).toContain(`<string name="title_activity_main">${appName}</string>`)
    }
  })
})
