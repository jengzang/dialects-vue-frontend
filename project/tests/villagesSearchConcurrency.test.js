import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { villagesMLStore } from '../src/VillagesML/store/villagesMLStore.js'

const mocks = vi.hoisted(() => ({ search: vi.fn(), error: vi.fn() }))
vi.mock('@/api/index.js', () => ({ searchVillages: mocks.search }))
vi.mock('@/utils/ui/message.js', () => ({ showError: mocks.error, showSuccess: vi.fn() }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/villagesML/gd', query: {} }),
  useRouter: () => ({}),
}))
vi.mock('@/composables/router/useAuthGuard.js', () => ({ useAuthGuard: () => ({}) }))
vi.mock('@/VillagesML/config/BarConfig.js', () => ({
  createVillagesMLCommonBarSchema: () => ({}), getModuleConfig: () => ({}), getVillagesMLModules: () => [],
}))

let app, search, state
const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
async function settle() { for (let i = 0; i < 8; i++) await nextTick() }

beforeEach(async () => {
  mocks.search.mockReset(); mocks.error.mockReset()
  villagesMLStore.searchKeyword = 'old'
  villagesMLStore.searchPage = 1
  villagesMLStore.searchFilters = { city: '', county: '', township: '' }
  villagesMLStore.searchResults = []
  const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../src/VillagesML/workspace/VillagesMLWorkspace.vue'), 'utf8')
  for (const match of source.matchAll(/import \w+ from '([^']+\.vue)'/g)) {
    vi.doMock(match[1], () => ({ default: { render: () => null } }))
  }
  vi.doMock('@/VillagesML/workspace/modules/search/SearchPanel.vue', () => ({ default: {
    setup(_, { emit }) { search = () => emit('search'); return () => h('div') },
  } }))
  vi.doMock('@/VillagesML/workspace/modules/search/VillageListPanel.vue', () => ({ default: {
    props: ['loading', 'villages'], setup(props) { state = props; return () => h('div') },
  } }))
  const { default: Workspace } = await import('../src/VillagesML/workspace/VillagesMLWorkspace.vue')
  app = createApp(Workspace)
  app.mount(document.createElement('div'))
})
afterEach(() => { app?.unmount() })

describe('village searches', () => {
  it('shares an in-flight search for repeated click or Enter submissions', async () => {
    const pending = deferred()
    mocks.search.mockReturnValue(pending.promise)
    search(); search(); search()
    expect(mocks.search).toHaveBeenCalledTimes(1)
    pending.resolve({ data: [], total: 0 }); await settle()
    expect(state.loading).toBe(false)
  })

  it('only commits the newest search and cancels the previous request', async () => {
    const old = deferred(), latest = deferred()
    mocks.search.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise)
    search()
    villagesMLStore.searchKeyword = 'new'
    search()
    latest.resolve({ data: [{ village_id: 2, village_name: 'new' }], total: 1 })
    await settle()
    old.resolve({ data: [{ village_id: 1, village_name: 'old' }], total: 100 })
    await settle()
    expect(villagesMLStore.searchResults[0].name).toBe('new')
    expect(villagesMLStore.searchTotal).toBe(1)
    expect(mocks.search.mock.calls[0][1].signal.aborted).toBe(true)
  })

  it('does not publish failures or results after unmount', async () => {
    const pending = deferred()
    mocks.search.mockReturnValue(pending.promise)
    search(); app.unmount(); app = null
    pending.reject(new Error('late failure')); await settle()
    expect(mocks.error).not.toHaveBeenCalled()
  })

  it('starts a submitted search on page one', () => {
    villagesMLStore.searchPage = 8
    mocks.search.mockResolvedValue({ data: [], total: 0 })
    search()
    expect(mocks.search.mock.calls[0][0].page).toBe(1)
  })
})
