import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

describe('cluster api contracts', () => {
  it('adds a dedicated tools wrapper for cluster workflows', () => {
    const clusterApiPath = resolve(projectRoot, 'src/api/main/tools/cluster.js')

    expect(existsSync(clusterApiPath)).toBe(true)

    const clusterApiSource = readFileSync(clusterApiPath, 'utf8')
    expect(clusterApiSource).toContain('export function useClusterApi()')
    expect(clusterApiSource).toContain('previewCluster')
    expect(clusterApiSource).toContain('prepareCluster')
    expect(clusterApiSource).toContain('buildClusterDistance')
    expect(clusterApiSource).toContain('runClusterStage')
    expect(clusterApiSource).toContain('runClusterJob')
    expect(clusterApiSource).toContain('getClusterJobStatus')
    expect(clusterApiSource).toContain('getClusterJobResult')
    expect(clusterApiSource).toContain('getClusterStagedResult')
    expect(clusterApiSource).toContain('normalizePercentProgress')
  })

  it('re-exports cluster api from both tool and top-level entry points', () => {
    const toolsIndexSource = readSource('src/api/main/tools/index.js')
    const apiIndexSource = readSource('src/api/index.js')

    expect(toolsIndexSource).toContain("export { useClusterApi } from './cluster.js'")
    expect(apiIndexSource).toContain('useClusterApi')
  })
})
