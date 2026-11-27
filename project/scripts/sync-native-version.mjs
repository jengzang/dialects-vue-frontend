import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const repoRoot = path.resolve(projectRoot, '..')

const ANDROID_STRING_LOCALES = ['values', 'values-zh-rCN', 'values-zh-rTW']

export function readUpdateNoticeVersion(root = repoRoot) {
  const configPath = path.resolve(root, 'project/src/utils/user/updateNoticeConfig.js')
  const source = fs.readFileSync(configPath, 'utf8')
  const match = source.match(/version:\s*'v(\d+)\.(\d+)\.(\d+)'/)
  if (!match) {
    throw new Error('project/src/utils/user/updateNoticeConfig.js must define a semver version like v5.3.1')
  }
  const major = Number(match[1])
  const minor = Number(match[2])
  const patch = Number(match[3])
  return {
    version: `${major}.${minor}.${patch}`,
    versionCode: computeVersionCode(major, minor, patch),
  }
}

export function computeVersionCode(major, minor, patch) {
  return major * 10000 + minor * 100 + patch
}

function updateFileIfChanged(filePath, transform) {
  const original = fs.readFileSync(filePath, 'utf8')
  const next = transform(original)
  if (next !== original) {
    fs.writeFileSync(filePath, next, 'utf8')
    return true
  }
  return false
}

export function syncNativeVersion(root = repoRoot) {
  const { version, versionCode } = readUpdateNoticeVersion(root)
  const appName = `方音圖鑑-v${version}`
  const updatedFiles = []

  // 1. project/capacitor.config.json
  const capacitorConfigPath = path.resolve(root, 'project/capacitor.config.json')
  if (updateFileIfChanged(capacitorConfigPath, (content) =>
    content.replace(/"appName":\s*"[^"]*"/, `"appName": "${appName}"`)
  )) {
    updatedFiles.push('project/capacitor.config.json')
  }

  // 2. android/app/build.gradle
  const androidGradlePath = path.resolve(root, 'android/app/build.gradle')
  if (updateFileIfChanged(androidGradlePath, (content) =>
    content
      .replace(/(\bversionCode\s+)\d+/, `$1${versionCode}`)
      .replace(/(\bversionName\s+)"[^"]*"/, `$1"${version}"`)
  )) {
    updatedFiles.push('android/app/build.gradle')
  }

  // 3. android/app/src/main/res/{values,values-zh-rCN,values-zh-rTW}/strings.xml
  for (const locale of ANDROID_STRING_LOCALES) {
    const relPath = `android/app/src/main/res/${locale}/strings.xml`
    const stringsPath = path.resolve(root, relPath)
    if (updateFileIfChanged(stringsPath, (content) =>
      content
        .replace(/(<string name="app_name">)[^<]*(<\/string>)/, `$1${appName}$2`)
        .replace(/(<string name="title_activity_main">)[^<]*(<\/string>)/, `$1${appName}$2`)
    )) {
      updatedFiles.push(relPath)
    }
  }

  // 4. ios/App/App.xcodeproj/project.pbxproj
  const iosPbxprojPath = path.resolve(root, 'ios/App/App.xcodeproj/project.pbxproj')
  if (updateFileIfChanged(iosPbxprojPath, (content) =>
    content
      .replace(/(\bCURRENT_PROJECT_VERSION\s*=\s*)\d+;/g, `$1${versionCode};`)
      .replace(/(\bMARKETING_VERSION\s*=\s*)[^;]+;/g, `$1${version};`)
  )) {
    updatedFiles.push('ios/App/App.xcodeproj/project.pbxproj')
  }

  return { version, versionCode, appName, updatedFiles }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const result = syncNativeVersion()
  if (result.updatedFiles.length === 0) {
    console.log(`Native version already synced: v${result.version} (${result.versionCode})`)
  } else {
    console.log(`Synced native version to v${result.version} (${result.versionCode}):`)
    for (const file of result.updatedFiles) {
      console.log(`- ${file}`)
    }
  }
}
