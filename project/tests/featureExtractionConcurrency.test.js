import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'

const mocks = vi.hoisted(() => ({ filter: vi.fn() }))
vi.mock('@/api/index.js', () => ({ fetchSubsetFilter: mocks.filter, extractFeatures: vi.fn() }))
vi.mock('@/main/store/store.js', () => ({ userStore: { isAuthenticated: true } }))
vi.mock('@/utils/ui/message.js', () => ({ showError: vi.fn(), showWarning: vi.fn(), showSuccess: vi.fn() }))
vi.mock('vue-router', () => ({ useRoute: () => ({}), useRouter: () => ({}) }))
vi.mock('echarts', () => ({ init: vi.fn() }))
vi.mock('@/VillagesML/utils/regionPreload.js', () => ({ cityHasCounties: vi.fn() }))
vi.mock('@/VillagesML/components/FilterableSelect.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/selector/SimpleSelectDropdown.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/ToastAndHelp/HelpIcon.vue', () => ({ default: { render: () => null } }))
import FeatureExtraction from '../src/VillagesML/workspace/modules/ml/FeatureExtraction.vue'

let app
afterEach(() => { app?.unmount(); vi.clearAllMocks() })

describe('feature extraction query guard', () => {
  it('blocks repeated Enter events while loading and permits the next query after completion', async () => {
    let finish
    mocks.filter.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
      .mockResolvedValue({ villages: [] })
    const host = document.createElement('div')
    app = createApp(FeatureExtraction)
    app.mount(host)
    const input = host.querySelector('.search-bar input')
    input.value = 'village'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    const enter = () => input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }))
    enter(); enter(); enter()
    expect(mocks.filter).toHaveBeenCalledTimes(1)
    finish({ villages: [] })
    for (let i = 0; i < 5; i++) await nextTick()
    enter()
    expect(mocks.filter).toHaveBeenCalledTimes(2)
    expect(mocks.filter.mock.calls[0][0].maxResults).toBe(50000)
  })
})
