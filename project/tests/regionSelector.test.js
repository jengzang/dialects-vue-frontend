import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, nextTick, reactive } from 'vue'

const mocks = vi.hoisted(() => ({ getPartitions: vi.fn(), showError: vi.fn(), user: { isAuthenticated: false, role: 'anonymous', id: null } }))
vi.mock('@/api/index.js', () => ({ getPartitions: mocks.getPartitions }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn(), currentRoute: { value: {} } }) }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: value => value }) }))
vi.mock('@/composables/router/useAuthGuard.js', () => ({ useAuthGuard: () => ({ requireAuth: vi.fn() }) }))
vi.mock('@/main/store/store.js', () => ({ userStore: mocks.user }))
vi.mock('@/main/store/customRegionStore.js', async () => {
  const { ref } = await import('vue')
  return { customRegionStore: () => ({ customRegions: ref([]), loading: ref(false), fetchCustomRegions: vi.fn() }) }
})
vi.mock('@/utils/ui/message.js', () => ({ showError: mocks.showError, showSuccess: vi.fn(), showConfirm: vi.fn() }))
vi.mock('@/components/common/AppModal.vue', () => ({ default: { template: '<div />' } }))

import RegionSelector from '../src/main/components/geo/RegionSelector.vue'

function node(path, children = []) { return { label: path.split('-').at(-1), path, depth: path.split('-').length, children } }
const nodes = [node('甲', [node('甲-同名', [node('甲-同名-三', [node('甲-同名-三-四', [node('甲-同名-三-四-五')])])])]), node('乙', [node('乙-同名')])]
let app, state
async function settle() { await Promise.resolve(); await Promise.resolve(); await nextTick(); await nextTick() }
function click(element) { element.dispatchEvent(new MouseEvent('click', { bubbles: true })) }
function item(path) { return [...document.querySelectorAll('.partition-item')].find(el => el.title === path) }
function expand(path) { click(item(path).closest('.partition-line').querySelector('.partition-arrow')) }

async function mount(mode = 'yindian', selected = [], options = {}) {
  state = reactive({ mode, selected, options })
  const host = document.createElement('div'); document.body.append(host)
  app = createApp(defineComponent({ components: { RegionSelector }, setup: () => ({ state }),
    template: '<RegionSelector :mode="state.mode" v-model:selected="state.selected" v-bind="state.options" />' }))
  app.config.globalProperties.$t = value => value
  app.mount(host)
  await settle()
  click(document.querySelector('.region-select-box'))
  await settle()
}

describe('complete-path default selector', () => {
  beforeEach(() => { mocks.getPartitions.mockImplementation(async mode => ({ schema_version: 2, region_mode: mode, nodes, max_depth: 5 })) })
  afterEach(() => { app?.unmount(); app = null; mocks.user.id = null; document.body.innerHTML = ''; vi.clearAllMocks() })

  it('reports visibility for confirmation, Escape, trigger closing and unmount', async () => {
    const onOpenChange = vi.fn()
    await mount('map', [], { nodes, allowCustomRegions: false, onOpenChange })
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
    click(document.querySelector('.topbar-btn:not(.ghost)')); await settle()
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    for (const close of [
      () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })),
      () => click(document.querySelector('.region-select-box')),
      () => { app.unmount(); app = null },
    ]) {
      click(document.querySelector('.region-select-box')); await settle()
      expect(onOpenChange).toHaveBeenLastCalledWith(true)
      close(); await settle()
      expect(onOpenChange).toHaveBeenLastCalledWith(false)
    }
  })

  it('uses vocabulary-provided nodes without loading default trees or showing custom regions', async () => {
    await mount('map', [], { nodes: [node('詞表專屬')], allowCustomRegions: false })
    expect(mocks.getPartitions).not.toHaveBeenCalled()
    expect(item('詞表專屬')).toBeDefined()
    expect(item('甲')).toBeUndefined()
    expect(document.querySelector('.custom-region-trigger')).toBeNull()
    expect(document.querySelector('.custom-region-btn')).toBeNull()
    click(item('詞表專屬')); click(document.querySelector('.topbar-btn:not(.ghost)')); await nextTick()
    expect(state.selected).toEqual(['詞表專屬'])
  })

  it('keeps an external empty/loading/error tree separate from defaults', async () => {
    await mount('yindian', [], { nodes: [], loading: true, allowCustomRegions: false })
    expect(mocks.getPartitions).not.toHaveBeenCalled()
    expect(document.querySelector('.partition-tree-state')).not.toBeNull()
    state.options.loading = false; state.options.error = '詞表載入失敗'; await nextTick()
    expect(document.querySelector('.partition-tree-state').textContent).toBe('詞表載入失敗')
    expect(document.querySelectorAll('.partition-item')).toHaveLength(0)
  })

  it('clears external nodes while switching to a delayed default source', async () => {
    mocks.user.id = 1234
    let resolveDefault
    mocks.getPartitions.mockImplementation(() => new Promise(resolve => { resolveDefault = resolve }))
    await mount('map', [], { nodes: [node('詞表舊樹')], allowCustomRegions: false })
    state.options.nodes = null; await settle()
    expect(item('詞表舊樹')).toBeUndefined()
    resolveDefault({ schema_version: 2, region_mode: 'map', nodes: [node('通用新樹')] }); await settle(); await settle()
    expect(item('通用新樹')).toBeDefined()
  })

  it('rejects excess paths and long paths while still allowing deselection', async () => {
    const tooLong = '甲'.repeat(201)
    await mount('map', [], { nodes: [node('甲'), node('乙'), node(tooLong)], maxSelected: 1, maxPathLength: 200 })
    click(item('甲')); click(item('乙')); click(item(tooLong))
    click(document.querySelector('.topbar-btn:not(.ghost)')); await nextTick()
    expect(state.selected).toEqual(['甲'])
    expect(mocks.showError).toHaveBeenCalledTimes(2)
    click(document.querySelector('.region-select-box')); await nextTick()
    click(item('甲')); click(item('乙')); click(document.querySelector('.topbar-btn:not(.ghost)')); await nextTick()
    expect(state.selected).toEqual(['乙'])
  })

  it('expands five levels, keeps parent/child selections and confirms complete paths', async () => {
    await mount()
    for (const path of ['甲', '甲-同名', '甲-同名-三', '甲-同名-三-四']) { expand(path); await nextTick() }
    expect(document.querySelectorAll('.partition-popup')).toHaveLength(5)
    click(item('甲-同名')); click(item('甲-同名-三-四-五'))
    item('甲-同名-三-四-五').dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(document.querySelector('.partition-overlay')).not.toBeNull()
    click(document.querySelector('.topbar-btn:not(.ghost)')); await nextTick()
    expect(state.selected).toEqual(['甲-同名', '甲-同名-三-四-五'])
    expect(document.querySelector('.region-tag').textContent).toContain('甲·同名')
    expect(document.querySelector('.region-tag').title).toBe('甲-同名')
  })

  it('selects and removes repeated names independently and cancels draft with Escape', async () => {
    await mount('map')
    expand('甲'); await nextTick(); click(item('甲-同名'))
    expand('乙'); await nextTick()
    expect(item('乙-同名').classList.contains('chosen')).toBe(false)
    click(item('乙-同名')); click(document.querySelector('.topbar-btn:not(.ghost)')); await nextTick()
    expect(state.selected).toEqual(['甲-同名', '乙-同名'])
    click(document.querySelector('.region-tag .tag-remove')); await nextTick()
    expect(state.selected).toEqual(['乙-同名'])
    click(document.querySelector('.region-select-box')); await nextTick()
    click(item('甲')); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); await nextTick()
    expect(state.selected).toEqual(['乙-同名'])
  })

  it.each(['.partition-stage', '.partition-overlay'])('confirms and closes on blank space in %s', async target => {
    await mount()
    click(item('甲'))
    document.querySelector('.partition-popup').dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    document.querySelector('.partition-topbar').dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await nextTick()
    expect(document.querySelector('.partition-overlay')).not.toBeNull()
    expect(state.selected).toEqual([])

    document.querySelector(target).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await nextTick()
    expect(document.querySelector('.partition-overlay')).toBeNull()
    expect(state.selected).toEqual(['甲'])
  })

  it('keeps the horizontal scrollbar usable while closing on the stage blank space', async () => {
    await mount()
    const stage = document.querySelector('.partition-stage')
    Object.defineProperties(stage, {
      scrollWidth: { value: 800 }, clientWidth: { value: 400 }, clientHeight: { value: 280 },
    })
    vi.spyOn(stage, 'getBoundingClientRect').mockReturnValue({ top: 0 })
    stage.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientY: 290 }))
    await nextTick()
    expect(document.querySelector('.partition-overlay')).not.toBeNull()
    stage.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientY: 100 }))
    await nextTick()
    expect(document.querySelector('.partition-overlay')).toBeNull()
  })

  it('invalidates delayed hover on close', async () => {
    vi.useFakeTimers()
    try {
      await mount('yindian', ['乙-同名'])
      item('甲').closest('.partition-line').dispatchEvent(new MouseEvent('mouseenter'))
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await vi.advanceTimersByTimeAsync(150)
      expect(document.querySelector('.partition-overlay')).toBeNull()
      click(document.querySelector('.region-select-box')); await settle()
      expect(document.querySelectorAll('.partition-popup')).toHaveLength(1)
      expect(state.selected).toEqual(['乙-同名'])
    } finally { vi.useRealTimers() }
  })

  it('preserves invalidated paths when a new identity cannot load its default tree', async () => {
    mocks.user.id = 87
    mocks.getPartitions.mockRejectedValueOnce(new Error('load failed'))
    await mount('map', ['舊根-舊分區'])
    expect(document.querySelector('.partition-tree-state').textContent).toContain('load failed')
    click(document.querySelector('.topbar-btn:not(.ghost)')); await nextTick()
    expect(state.selected).toEqual(['舊根-舊分區'])
    mocks.user.id = null
  })

  it('does not let a delayed response replace the tree after a mode change', async () => {
    mocks.user.id = 93
    let mapDone, yindianDone
    mocks.getPartitions.mockImplementation(mode => new Promise(resolve => {
      if (mode === 'map') mapDone = resolve
      else yindianDone = resolve
    }))
    await mount('map')
    state.mode = 'yindian'; await settle()
    yindianDone({ schema_version: 2, region_mode: 'yindian', nodes: [node('音典新樹')] }); await settle()
    click(document.querySelector('.region-select-box')); await settle()
    mapDone({ schema_version: 2, region_mode: 'map', nodes: [node('地圖舊樹')] }); await settle()
    expect(item('音典新樹')).toBeDefined()
    expect(item('地圖舊樹')).toBeUndefined()
  })
})
