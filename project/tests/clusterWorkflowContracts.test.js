import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

describe('cluster workflow contracts', () => {
  it('keeps a thin page shell and moves workflow responsibilities into local cluster modules', () => {
    const pageSource = readSource('src/main/views/menu/DialectClustering.vue')
    const workspaceSource = readSource('src/main/views/menu/cluster/useClusterWorkspace.js')
    const inputPanelSource = readSource('src/main/views/menu/cluster/ClusterInputPanel.vue')
    const workflowPanelSource = readSource('src/main/views/menu/cluster/ClusterWorkflowPanel.vue')
    const resultPanelSource = readSource('src/main/views/menu/cluster/ClusterResultPanel.vue')
    const taskSidebarSource = readSource('src/main/views/menu/cluster/ClusterTaskSidebar.vue')

    expect(pageSource).toContain('ClusterInputPanel')
    expect(pageSource).toContain('ClusterWorkflowPanel')
    expect(pageSource).toContain('ClusterResultPanel')
    expect(pageSource).toContain('ClusterTaskSidebar')
    expect(pageSource).toContain('useClusterWorkspace')
    expect(pageSource).toContain('provideClusterWorkspace')
    expect(pageSource).toContain('main-glass-panel')

    expect(workspaceSource).toContain('usePollingTask')
    expect(workspaceSource).toContain('useStorageState')
    expect(workspaceSource).toContain('useRouteQueryState')
    expect(workspaceSource).toContain('useClusterApi')
    expect(workspaceSource).toContain('previewCluster')
    expect(workspaceSource).toContain('prepareCluster')
    expect(workspaceSource).toContain('buildClusterDistance')
    expect(workspaceSource).toContain('runClusterStage')
    expect(workspaceSource).toContain('runClusterJob')
    expect(workspaceSource).toContain('getClusterStagedResult')
    expect(workspaceSource).toContain('activeResultSource')
    expect(workspaceSource).toContain('distanceHashByMode')
    expect(workspaceSource).toContain('resultHashByKey')

    expect(inputPanelSource).toContain('LocationAndRegionInput')
    expect(workflowPanelSource).toContain('QUICK_RUN_FALLBACK_LABEL')
    expect(resultPanelSource).toContain('cluster.result.assignments')
    expect(taskSidebarSource).toContain('workspaceState.activeTask')
  })
})
