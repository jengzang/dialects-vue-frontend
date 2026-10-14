import { beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'

const mocks = vi.hoisted(() => ({ persisted: null, run: vi.fn(), setStep: vi.fn() }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: key => key }) }))
vi.mock('@/api', () => ({ useClusterApi: () => ({ runClusterJob: mocks.run }) }))
vi.mock('@/composables/core/useStorageState.js', () => ({ useStorageState: () => ({ state: ref(mocks.persisted), write: vi.fn(), remove: vi.fn() }) }))
vi.mock('@/composables/router/useRouteQueryState.js', () => ({ useRouteQueryState: () => ({ state: ref('preview'), set: mocks.setStep }) }))
vi.mock('@/composables/core/usePollingTask.js', () => ({ usePollingTask: () => ({ start: vi.fn(), stop: vi.fn() }) }))
vi.mock('@/composables/data/useQueryConfig.js', () => ({ useQueryConfig: () => ({}) }))
vi.mock('@/utils/ui/message.js', () => ({ showWarning: vi.fn(), showError: vi.fn(), showSuccess: vi.fn() }))

import { useClusterWorkspace } from '../src/main/views/menu/cluster/useClusterWorkspace.js'
import { createDefaultWorkspaceState } from '../src/main/views/menu/cluster/clusterWorkspaceShared.js'

describe('restored clustering region scope', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.persisted = createDefaultWorkspaceState() })

  it.each([undefined, 'path-v2'])('blocks quick-run before the restored scope is validated (%s)', async semantics => {
    mocks.persisted.currentStep = 'preview'
    mocks.persisted.requestDraft.regions = ['甲']
    mocks.persisted.requestDraft.regions_semantics = semantics
    const scope = effectScope()
    const workspace = scope.run(() => useClusterWorkspace())
    await workspace.handleQuickRun()
    expect(mocks.run).not.toHaveBeenCalled()
    expect(mocks.setStep).toHaveBeenCalledWith('input')
    expect(workspace.locationInputDisabled.value).toBe(true)
    scope.stop()
  })
})
