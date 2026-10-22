import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getNativeDistPruneManifest } from '../src/platform/featureMatrix.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const distRoot = path.resolve(projectRoot, 'dist')
const nativeDistPruneManifest = getNativeDistPruneManifest()

export const DEFAULT_NATIVE_DIST_MAX_BYTES = 45 * 1024 * 1024
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

    if (entry.isDirectory()) {
      files.push(...await listFiles(root, path.join(prefix, entry.name)))
    } else {
      files.push(relativePath)
    }
  }

  return files
}

async function listFileEntries(root, prefix = '') {
  const entries = await fs.readdir(path.join(root, prefix), { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const relativePath = path.posix.join(prefix.split(path.sep).join(path.posix.sep), entry.name)
    const absolutePath = path.join(root, prefix, entry.name)

    if (entry.isDirectory()) {
      files.push(...await listFileEntries(root, path.join(prefix, entry.name)))
    } else {
      const stats = await fs.stat(absolutePath)
      files.push({
        path: relativePath,
        sizeBytes: stats.size,
      })
    }
  }

  return files
}

export function auditNativeDistSizeBudget(totalBytes, maxBytes = DEFAULT_NATIVE_DIST_MAX_BYTES) {
  return {
    passed: totalBytes <= maxBytes,
    totalBytes,
    maxBytes,
    overageBytes: Math.max(0, totalBytes - maxBytes),
  }
}

export function formatNativeDistBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`
}

export function auditNativeDistFiles(files) {
  const forbiddenPathSet = new Set(NATIVE_DIST_FORBIDDEN_PATHS)

  return files.filter((filePath) => (
    forbiddenPathSet.has(filePath) ||
    NATIVE_DIST_FORBIDDEN_PATHS.some((forbiddenPath) => filePath.startsWith(`${forbiddenPath}/`)) ||
    NATIVE_DIST_FORBIDDEN_GLOBS.some((pattern) => pattern.test(filePath))
  ))
}

export async function auditNativeDist() {
  if (!(await pathExists(distRoot))) {
    throw new Error(`Native dist directory does not exist: ${distRoot}`)
  }

  return auditNativeDistFiles(await listFiles(distRoot))
}

export async function auditNativeDistSize() {
  if (!(await pathExists(distRoot))) {
    throw new Error(`Native dist directory does not exist: ${distRoot}`)
  }

  const files = await listFileEntries(distRoot)
  const totalBytes = files.reduce((sum, file) => sum + file.sizeBytes, 0)

  return auditNativeDistSizeBudget(totalBytes)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const violations = await auditNativeDist()
  const sizeBudget = await auditNativeDistSize()

  console.log(`Native dist size: ${formatNativeDistBytes(sizeBudget.totalBytes)} / ${formatNativeDistBytes(sizeBudget.maxBytes)}`)

  if (violations.length === 0 && sizeBudget.passed) {
    console.log('Native dist audit passed.')
  }

  if (violations.length > 0) {
    console.error(`Native dist audit failed with ${violations.length} forbidden file(s):`)
    for (const relativePath of violations) {
      console.error(`- ${relativePath}`)
    }
  }

  if (!sizeBudget.passed) {
    console.error(`Native dist size budget exceeded by ${formatNativeDistBytes(sizeBudget.overageBytes)}.`)
  }

  if (violations.length > 0 || !sizeBudget.passed) {
    process.exitCode = 1
  }
}
