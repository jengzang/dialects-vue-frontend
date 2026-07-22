import { spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const repoRoot = path.resolve(projectRoot, '..')

const VALID_TARGETS = new Set(['web', 'ios', 'android', 'all'])
const target = process.argv[2] || 'all'

if (!VALID_TARGETS.has(target)) {
  console.error(`Unknown platform verification target: ${target}`)
  console.error('Usage: node ./scripts/verify-platform-builds.mjs [web|ios|android|all]')
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

if (target === 'ios' || target === 'all') {
  await verifyIos()
}

if (target === 'android' || target === 'all') {
  await verifyAndroid()
}
