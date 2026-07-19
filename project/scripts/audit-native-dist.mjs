import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getNativeDistPruneManifest } from '../src/platform/featureMatrix.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const distRoot = path.resolve(projectRoot, 'dist')
const nativeDistPruneManifest = getNativeDistPruneManifest()

export const NATIVE_DIST_FORBIDDEN_PATHS = nativeDistPruneManifest.paths
export const NATIVE_DIST_FORBIDDEN_GLOB_PATTERNS = nativeDistPruneManifest.globPatterns
export const NATIVE_DIST_FORBIDDEN_GLOBS = NATIVE_DIST_FORBIDDEN_GLOB_PATTERNS.map((pattern) => new RegExp(pattern))

async function pathExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function listFiles(root, prefix = '') {
  const entries = await fs.readdir(path.join(root, prefix), { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const relativePath = path.posix.join(prefix.split(path.sep).join(path.posix.sep), entry.name)
    const absolutePath = path.join(root, prefix, entry.name)

    if (entry.isDirectory()) {
      files.push(...await listFiles(root, path.join(prefix, entry.name)))
    } else {
      files.push(relativePath)
    }
  }

  return files
}

export function auditNativeDistFiles(files) {
  const forbiddenPathSet = new Set(NATIVE_DIST_FORBIDDEN_PATHS)

  return files.filter((filePath) => (
    forbiddenPathSet.has(filePath) ||
    NATIVE_DIST_FORBIDDEN_GLOBS.some((pattern) => pattern.test(filePath))
  ))
}

export async function auditNativeDist() {
  if (!(await pathExists(distRoot))) {
    throw new Error(`Native dist directory does not exist: ${distRoot}`)
  }

  return auditNativeDistFiles(await listFiles(distRoot))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const violations = await auditNativeDist()

  if (violations.length === 0) {
    console.log('Native dist audit passed.')
  } else {
    console.error(`Native dist audit failed with ${violations.length} forbidden file(s):`)
    for (const relativePath of violations) {
      console.error(`- ${relativePath}`)
    }
    process.exitCode = 1
  }
}
