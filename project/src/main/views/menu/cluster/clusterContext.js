import { inject, provide } from 'vue'

const clusterWorkspaceKey = Symbol('cluster-workspace')

export function provideClusterWorkspace(workspace) {
  provide(clusterWorkspaceKey, workspace)
}

export function useClusterWorkspaceContext() {
  const workspace = inject(clusterWorkspaceKey, null)

  if (!workspace) {
    throw new Error('Cluster workspace context is not available')
  }

  return workspace
}
