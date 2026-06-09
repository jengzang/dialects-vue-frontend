import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

describe('cluster request shape contracts', () => {
  it('builds grouped requests for path_strings and resolved_chars', () => {
    const helperSource = readSource('src/main/views/menu/cluster/clusterWorkspaceShared.js')
    const workspaceSource = readSource('src/main/views/menu/cluster/useClusterWorkspace.js')

    expect(helperSource).toContain('export function buildPreviewRequestDraft(requestDraft)')
    expect(helperSource).toContain("source_mode: 'path_strings'")
    expect(helperSource).toContain("compare_dimension: 'final'")
    expect(helperSource).toContain("table_name: 'characters'")
    expect(helperSource).toContain('path_strings:')
    expect(helperSource).toContain('resolved_chars:')
    expect(helperSource).toContain('include_special_locations')
    expect(workspaceSource).toContain('phoneme_mode: workspaceState.selectedPhonemeMode')
  })

  it('branches clustering payloads by algorithm and maps staged rollback targets', () => {
    const helperSource = readSource('src/main/views/menu/cluster/clusterWorkspaceShared.js')
    const workspaceSource = readSource('src/main/views/menu/cluster/useClusterWorkspace.js')

    expect(helperSource).toContain("algorithm === 'agglomerative'")
    expect(helperSource).toContain("algorithm === 'dbscan'")
    expect(helperSource).toContain("algorithm === 'kmeans'")
    expect(helperSource).toContain("algorithm === 'gmm'")
    expect(helperSource).toContain('n_clusters')
    expect(helperSource).toContain('linkage')
    expect(helperSource).toContain('eps')
    expect(helperSource).toContain('min_samples')
    expect(helperSource).toContain('random_state')
    expect(workspaceSource).toContain('handleStageNotFound')
    expect(workspaceSource).toContain("case 'prepare'")
    expect(workspaceSource).toContain("case 'distance'")
    expect(workspaceSource).toContain("case 'cluster'")
  })
})
