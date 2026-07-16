import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const distRoot = path.resolve(projectRoot, 'dist')

export const NATIVE_DIST_PRUNE_PATHS = [
  'data/国界面.kmz',
]

export const NATIVE_DIST_PRUNE_GLOBS = [
  /^assets\/voronoiClip\.worker-[\w-]+\.js$/,
]

async function pathExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function removeIfExists(relativePath) {
  const absolutePath = path.resolve(distRoot, relativePath)

  if (!absolutePath.startsWith(distRoot + path.sep)) {
    throw new Error(`Refusing to prune outside dist: ${relativePath}`)
  }

  if (!(await pathExists(absolutePath))) {
    return false
  }

  await fs.rm(absolutePath, { force: true, recursive: true })
  return true
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

export async function pruneNativeDist() {
  const removed = []

  for (const relativePath of NATIVE_DIST_PRUNE_PATHS) {
    if (await removeIfExists(relativePath)) {
      removed.push(relativePath)
    }
  }

  if (await pathExists(distRoot)) {
    const files = await listFiles(distRoot)
    for (const filePath of files) {
      if (NATIVE_DIST_PRUNE_GLOBS.some((pattern) => pattern.test(filePath))) {
        if (await removeIfExists(filePath)) {
          removed.push(filePath)
        }
      }
    }
  }

  return removed
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const removed = await pruneNativeDist()
  if (removed.length === 0) {
    console.log('No native-only dist files pruned.')
  } else {
    console.log(`Pruned ${removed.length} native-only dist path(s):`)
    for (const relativePath of removed) {
      console.log(`- ${relativePath}`)
    }
  }
}
