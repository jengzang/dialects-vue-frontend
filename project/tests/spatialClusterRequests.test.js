import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'

const mocks = vi.hoisted(() => ({ clusters: vi.fn(), summary: vi.fn(), error: vi.fn() }))
vi.mock('@/api/index.js', () => ({
  getSpatialClusters: mocks.clusters, getSpatialClustersSummary: mocks.summary,
  getSpatialClustersAvailableRuns: async () => ({ available_runs: ['a', 'b'].map(run_id => ({ run_id, unique_clusters: 1, avg_cluster_size: 10 })), active_run_id: 'a' }),
}))
vi.mock('@/utils/ui/message.js', () => ({ showError: mocks.error }))
vi.mock('@/VillagesML/workspace/modules/spatial/SpatialMap.vue', () => ({ default: {
  props: ['clusters'], setup: props => () => h('div', { class: 'test-map' }, JSON.stringify(props.clusters)),
} }))
vi.mock('@/components/ToastAndHelp/HelpIcon.vue', () => ({ default: { render: () => null } }))
let select
vi.mock('@/components/selector/SimpleSelectDropdown.vue', () => ({ default: {
  setup(_, { emit }) { select = id => emit('update:modelValue', id); return () => h('div') },
} }))
import SpatialClustersTab from '../src/VillagesML/workspace/modules/spatial/SpatialClustersTab.vue'

let app, host
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }
async function settle() { for (let i = 0; i < 10; i++) await nextTick() }
async function mount() { host = document.createElement('div'); app = createApp(SpatialClustersTab); app.mount(host); await settle() }
beforeEach(() => { vi.clearAllMocks(); mocks.clusters.mockResolvedValue([{ cluster_id: 'a' }]); mocks.summary.mockResolvedValue({ run_id: 'a' }) })
afterEach(() => { app?.unmount() })

describe('spatial cluster requests', () => {
  it('loads the initial run exactly once', async () => {
    await mount()
    expect(mocks.clusters).toHaveBeenCalledTimes(1)
    expect(mocks.summary).toHaveBeenCalledTimes(1)
    expect(mocks.clusters.mock.calls[0][0]).toEqual({ run_id: 'a', limit: 0 })
  })

  it('ignores an older response after selecting a new run', async () => {
    const old = deferred()
    mocks.clusters.mockReturnValueOnce(old.promise)
    await mount()
    select('b'); await settle()
    old.resolve([{ cluster_id: 'old' }]); await settle()
    expect(host.querySelector('.test-map').textContent).not.toContain('old')
    expect(mocks.clusters.mock.calls[0][1].signal.aborted).toBe(true)
  })

  it('does not show errors from a run replaced by a newer selection', async () => {
    const old = deferred()
    mocks.clusters.mockReturnValueOnce(old.promise)
    await mount(); select('b'); await settle()
    old.reject(new Error('old failure')); await settle()
    expect(mocks.error).not.toHaveBeenCalled()
  })

  it('cancels a pending load when unmounted', async () => {
    const pending = deferred()
    mocks.clusters.mockReturnValueOnce(pending.promise)
    await mount(); app.unmount(); app = null
    expect(mocks.clusters.mock.calls[0][1].signal.aborted).toBe(true)
    pending.reject(new Error('late')); await settle()
    expect(mocks.error).not.toHaveBeenCalled()
  })
})
