import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  getPlatformAcceptanceChecklist,
  getPlatformAcceptanceDiagnostics,
} from '../src/platform/featureMatrix.js'
import {
  DEFAULT_NATIVE_DIST_MAX_BYTES,
  formatNativeDistBytes,
} from './audit-native-dist.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const repoRoot = path.resolve(projectRoot, '..')
const appId = 'top.yzup.dialects'
const androidDebugApk = path.join(repoRoot, 'android/app/build/outputs/apk/debug/app-debug.apk')
const iosSimulatorApp = path.join(projectRoot, 'build/ios-derived/Build/Products/Debug-iphonesimulator/App.app')

const VALID_TARGETS = new Set(['web', 'ios', 'android', 'acceptance', 'all'])
const target = process.argv[2] || 'all'

if (!VALID_TARGETS.has(target)) {
  console.error(`Unknown platform verification target: ${target}`)
  console.error('Usage: node ./scripts/verify-platform-builds.mjs [web|ios|android|acceptance|all]')
  process.exit(1)
}

function run(command, args, options = {}) {
  const label = [command, ...args].join(' ')
  console.log(`\n> ${label}`)

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd || projectRoot,
      env: options.env || process.env,
      shell: false,
      stdio: 'inherit',
    })

    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command failed with exit code ${code}: ${label}`))
      }
    })
  })
}

function runCapture(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd || projectRoot,
      env: options.env || process.env,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += chunk
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk
    })
    child.on('error', (error) => {
      resolve({
        code: 1,
        stdout,
        stderr: `${stderr}${error.message}`,
      })
    })
    child.on('close', (code) => {
      resolve({
        code: code ?? 1,
        stdout,
        stderr,
      })
    })
  })
}

function withAndroidEnv() {
  const androidHome = process.env.ANDROID_HOME || path.join(os.homedir(), 'Library/Android/sdk')
  const javaHome = process.env.JAVA_HOME
  const pathEntries = [
    javaHome ? path.join(javaHome, 'bin') : null,
    path.join(androidHome, 'platform-tools'),
    path.join(androidHome, 'emulator'),
    process.env.PATH,
  ].filter(Boolean)

  return {
    ...process.env,
    ANDROID_HOME: androidHome,
    ANDROID_SDK_ROOT: process.env.ANDROID_SDK_ROOT || androidHome,
    PATH: pathEntries.join(path.delimiter),
  }
}

function withIosEnv() {
  const iosProxyEnv = {}
  for (const key of ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'http_proxy', 'https_proxy', 'all_proxy']) {
    if (process.env[key]) {
      iosProxyEnv[key] = process.env[key]
    }
  }

  return {
    ...process.env,
    ...iosProxyEnv,
  }
}

async function syncNativeProjects() {
  await run('npx', ['cap', 'sync'])
}

async function verifyWeb() {
  await run('npm', ['run', 'build:web'])
}

function verifyAcceptanceChecklist() {
  const diagnostics = getPlatformAcceptanceDiagnostics()
  const hasDiagnostics = Object.values(diagnostics).some((items) => items.length > 0)

  if (hasDiagnostics) {
    console.error('Platform acceptance matrix diagnostics failed:')
    console.error(JSON.stringify(diagnostics, null, 2))
    process.exitCode = 1
    return
  }

  for (const platform of ['web', 'ios', 'android']) {
    const checklist = getPlatformAcceptanceChecklist(platform)
    console.log(`\n${platform.toUpperCase()} acceptance checklist:`)

    if (checklist.length === 0) {
      console.log('- No acceptance items configured.')
      continue
    }

    for (const item of checklist) {
      console.log(`- [${item.feature}] ${item.id} (${item.driver}) ${item.label}`)
    }
  }
}

function parseAdbDevices(output) {
  return output
    .split('\n')
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => /\tdevice$/.test(line))
    .map((line) => line.split(/\s+/)[0])
}

function parseBootedIosSimulators(output) {
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes('(Booted)'))
}

async function printNativeSmokeStatus() {
  console.log(`\nNative dist size budget: ${formatNativeDistBytes(DEFAULT_NATIVE_DIST_MAX_BYTES)}`)

  const androidEnv = withAndroidEnv()
  const adbResult = await runCapture('adb', ['devices'], { env: androidEnv })
  const androidDevices = adbResult.code === 0 ? parseAdbDevices(adbResult.stdout) : []

  console.log('\nAndroid native smoke:')
  console.log(`- APK: ${androidDebugApk}`)
  if (fs.existsSync(androidDebugApk)) {
    console.log('- APK status: found')
  } else {
    console.log('- APK status: missing; run npm run verify:platform:android first')
  }

  if (androidDevices.length > 0) {
    console.log(`- Device status: ${androidDevices.length} connected (${androidDevices.join(', ')})`)
  } else {
    console.log('- Device status: no adb device connected')
  }
  console.log(`- Install: adb install -r ${androidDebugApk}`)
  console.log(`- Open: adb shell monkey -p ${appId} -c android.intent.category.LAUNCHER 1`)

  const iosResult = await runCapture('xcrun', ['simctl', 'list', 'devices', 'available'])
  const bootedSimulators = iosResult.code === 0 ? parseBootedIosSimulators(iosResult.stdout) : []

  console.log('\niOS native smoke:')
  console.log(`- App: ${iosSimulatorApp}`)
  if (fs.existsSync(iosSimulatorApp)) {
    console.log('- App status: found')
  } else {
    console.log('- App status: missing; run npm run verify:platform:ios first')
  }

  if (bootedSimulators.length > 0) {
    console.log(`- Simulator status: booted (${bootedSimulators[0]})`)
  } else if (iosResult.code === 0) {
    console.log('- Simulator status: no booted simulator')
  } else {
    console.log(`- Simulator status: unavailable (${String(iosResult.stderr || '').trim() || 'xcrun simctl failed'})`)
  }
  console.log(`- Install: xcrun simctl install booted ${iosSimulatorApp}`)
  console.log(`- Open: xcrun simctl launch booted ${appId}`)
}

async function verifyAndroid() {
  await run('npm', ['run', 'build:android'])
  await syncNativeProjects()
  await run('./gradlew', ['assembleDebug'], {
    cwd: path.join(repoRoot, 'android'),
    env: withAndroidEnv(),
  })
}

async function verifyIos() {
  await run('npm', ['run', 'build:ios'])
  await syncNativeProjects()
  await run('xcodebuild', [
    '-project',
    path.join(repoRoot, 'ios/App/App.xcodeproj'),
    '-scheme',
    'App',
    '-configuration',
    'Debug',
    '-destination',
    process.env.IOS_SIMULATOR_DESTINATION || 'generic/platform=iOS Simulator',
    '-derivedDataPath',
    path.join(projectRoot, 'build/ios-derived'),
    '-quiet',
    'build',
  ], {
    cwd: repoRoot,
    env: withIosEnv(),
  })
}

if (target === 'web' || target === 'all') {
  await verifyWeb()
}

if (target === 'acceptance' || target === 'all') {
  verifyAcceptanceChecklist()
  await printNativeSmokeStatus()
}

if (target === 'ios' || target === 'all') {
  await verifyIos()
}

if (target === 'android' || target === 'all') {
  await verifyAndroid()
}
