import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, nextTick, reactive, ref } from 'vue'

const mocks = vi.hoisted(() => ({ getPartitions: vi.fn(), resolvePartitions: vi.fn(), getLocations: vi.fn(), getCustomFeature: vi.fn(), user: { role: 'anonymous', id: null, isAuthenticated: false } }))
vi.mock('@/api/index.js', () => ({ ...mocks, batchMatch: vi.fn(async () => []), getLocationPartitions: vi.fn(async () => ({ data: [] })) }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: value => value }) }))
vi.mock('@/main/store/store.js', () => ({ userStore: mocks.user }))
vi.mock('@/main/store/customRegionStore.js', async () => {
  const { ref } = await import('vue')
  return { customRegionStore: () => ({ customRegions: ref([]), loading: ref(false), fetchCustomRegions: vi.fn() }) }
})
vi.mock('@/main/components/geo/RegionSelector.vue', () => ({ default: { props: ['selected'], template: '<div class="region-raw">{{ selected.join(" ") }}</div>' } }))
vi.mock('@/main/components/geo/PartitionInfoModal.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/common/AppModal.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/main/components/geo/RegionInputMode.vue', () => ({ __esModule: true, default: { props: ['modelValue'], emits: ['update:modelValue'], template: '<textarea class="region-text" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />' } }))

import LocationAndRegionInput from '../src/main/components/geo/LocationAndRegionInput.vue'

const node = (path, children = []) => ({ path, label: path.split('-').at(-1), depth: path.split('-').length, children })
const nodes = [node('甲', [node('甲-桂林'), node('甲-唯一')]), node('乙', [node('乙-桂林')])]
let app, state, input
async function settle() { for (let i = 0; i < 8; i++) { await Promise.resolve(); await nextTick() } }
async function flush() { await settle(); await vi.advanceTimersByTimeAsync(400); await settle() }
async function mount(regions = [], textMode = false, semantics) {
  state = reactive({ model: { locations: ['明選'], regions, regionUsing: 'yindian', ...(semantics ? { regions_semantics: semantics } : {}) }, disabled: true, runs: [] })
  input = ref(null)
  const host = document.createElement('div'); document.body.append(host)
  app = createApp(defineComponent({ components: { LocationAndRegionInput }, setup: () => ({ state, input, textMode }),
    template: '<LocationAndRegionInput ref="input" v-model="state.model" :use-input-mode="textMode" @update:run-disabled="state.disabled=$event" /><button class="run" :disabled="state.disabled" @click="state.runs.push([...state.model.regions])">run</button>' }))
  app.config.globalProperties.$t = value => value
  app.mount(host); await flush()
}

describe('partition input canonical paths and execution gating', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mocks.getPartitions.mockImplementation(async mode => ({ schema_version: 2, region_mode: mode, nodes }))
    mocks.getLocations.mockResolvedValue({ locations_result: ['明選'] })
    mocks.getCustomFeature.mockResolvedValue([])
    mocks.resolvePartitions.mockImplementation(async ({ region_mode, items }) => ({ schema_version: 2, region_mode,
      items: items.map(item => {
        const paths = item.text === '桂林' ? ['甲-桂林', '乙-桂林'] : ['甲-桂林', '乙-桂林'].includes(item.text) ? [item.text] : item.text === '唯一' || item.text === '甲-唯一' ? ['甲-唯一'] : item.text === '額外' || item.text === '私人-額外' ? ['私人-額外'] : []
        return { ...item, status: paths.length === 1 ? 'resolved' : paths.length ? 'ambiguous' : 'not_found', candidates: paths.map(path => ({ path, label: path.split('-').at(-1), sources: ['default'] })) }
      }) }))
  })
  afterEach(() => { app?.unmount(); app = null; vi.useRealTimers(); vi.clearAllMocks(); document.body.innerHTML = ''; mocks.user.isAuthenticated = false; mocks.user.id = null })

  it('migrates a unique old name and uses the same canonical scope for preview and actual execution', async () => {
    await mount(['唯一'])
    expect(state.model.regions).toEqual(['甲-唯一'])
    expect(mocks.getLocations.mock.calls.at(-1)[0].regions).toEqual(['甲-唯一'])
    document.querySelector('.run').click()
    expect(state.runs).toEqual([['甲-唯一']])
    expect(state.model.regions_semantics).toBe('path-v2')
  })

  it('shares compact partition navigation and clears selection only when a different source is confirmed', async () => {
    await mount(['唯一'])
    const navigation = document.querySelector('.tabs-wrapper--segmented.tabs-wrapper--compact')
    expect(navigation).not.toBeNull()
    const buttons = navigation.querySelectorAll('.tab')
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true')
    buttons[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    expect(document.activeElement).toBe(buttons[0])
    expect(state.model.regionUsing).toBe('yindian')
    expect(state.model.regions).toEqual(['甲-唯一'])
    buttons[1].click()
    await flush()
    expect(state.model.regions).toEqual(['甲-唯一'])
    buttons[0].click()
    await flush()
    expect(state.model.regionUsing).toBe('map')
    expect(state.model.regions).toEqual([])
    expect(document.querySelector('.region-raw').textContent).toBe('')
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true')
  })

  it('retains ambiguous text and blocks preview and execution until a full path is chosen', async () => {
    await mount(['桂林'], true)
    expect(document.querySelector('.region-text').value).toBe('桂林')
    expect(state.disabled).toBe(true)
    expect(mocks.getLocations).not.toHaveBeenCalled()
    document.querySelector('.run').click(); expect(state.runs).toEqual([])
    const candidate = [...document.querySelectorAll('.region-path-candidate')].find(button => button.title === '乙-桂林')
    candidate.click(); await flush()
    expect(state.model.regions).toEqual(['乙-桂林'])
    expect(state.disabled).toBe(false)
  })

  it('keeps accessible user paths out of the default tree and resolves them only in text mode', async () => {
    mocks.user.isAuthenticated = true; mocks.user.id = 79
    await mount(['額外'], true)
    expect(state.model.regions).toEqual(['私人-額外'])
    expect(mocks.resolvePartitions.mock.calls[0][0].scope).toBe('default_and_user')
    expect(mocks.getCustomFeature.mock.calls.at(-1)[0].regions).toEqual(['私人-額外'])
  })

  it('retains direct user-only locations alongside resolved map locations in the custom preview', async () => {
    mocks.user.isAuthenticated = true; mocks.user.id = 81
    mocks.getLocations.mockResolvedValue({ locations_result: ['地圖地點'] })
    await mount(['唯一'], true)
    state.model = { ...state.model, regionUsing: 'map' }
    await flush()
    expect(mocks.getCustomFeature.mock.calls.at(-1)[0]).toMatchObject({ locations: ['明選', '地圖地點'], regions: [] })
  })

  it('validates saved path values without guessing an old final name', async () => {
    await mount(['舊根-唯一'], false, 'path-v2')
    expect(state.disabled).toBe(true)
    expect(mocks.getLocations).not.toHaveBeenCalled()
    expect(input.value.selectedValue).toEqual([])
    expect(document.querySelector('.region-raw').textContent).toBe('舊根-唯一')
  })

  it('keeps mixed-system text and blocks every query', async () => {
    mocks.resolvePartitions.mockImplementation(async ({ region_mode, items }) => ({ schema_version: 2, region_mode, items: items.map(item => ({ candidates: region_mode === 'map' ? [{ path: '地圖-專用' }] : [] })) }))
    await mount(['地圖-專用'], true)
    expect(document.querySelector('.region-text').value).toBe('地圖-專用')
    expect(state.model.regionUsing).toBe('yindian')
    expect(state.disabled).toBe(true)
    expect(mocks.getLocations).not.toHaveBeenCalled()
  })

  it('forgets an explicit root marker after deleting all input', async () => {
    mocks.resolvePartitions.mockImplementation(async ({ region_mode, items }) => ({ schema_version: 2, region_mode, items: items.map(item => ({ candidates: (item.kind === 'path' ? ['甲'] : ['甲', '乙-甲']).map(path => ({ path })) })) }))
    await mount(['甲'], true, 'path-v2')
    expect(state.disabled).toBe(false)
    const textarea = document.querySelector('.region-text')
    textarea.value = ''; textarea.dispatchEvent(new Event('input')); await flush()
    textarea.value = '甲'; textarea.dispatchEvent(new Event('input')); await flush()
    expect(state.disabled).toBe(true)
    expect(document.querySelectorAll('.region-path-candidate')).toHaveLength(2)
  })

  it('resolves an ambiguous root when its unchanged candidate is selected', async () => {
    mocks.resolvePartitions.mockImplementation(async ({ region_mode, items }) => ({ schema_version: 2, region_mode, items: items.map(item => ({ candidates: (item.kind === 'path' ? ['甲'] : ['甲', '乙-甲']).map(path => ({ path })) })) }))
    await mount(['甲'], true)
    expect(state.disabled).toBe(true)
    document.querySelector('.region-path-candidate[title="甲"]').click(); await flush()
    expect(state.disabled).toBe(false)
    expect(state.model.regions).toEqual(['甲'])
  })

  it('preserves an unresolved selector draft in its parent model', async () => {
    await mount(['桂林'])
    expect(state.model.regions).toEqual([])
    expect(state.model.regionDraft.values).toEqual(['桂林'])
  })

  it('discards a late name response after a different input has resolved', async () => {
    let finish
    const normal = mocks.resolvePartitions.getMockImplementation()
    mocks.resolvePartitions.mockImplementation(payload => payload.items.some(item => item.text === '慢') ? new Promise(resolve => { finish = () => resolve({ schema_version: 2, region_mode: payload.region_mode, items: [{ candidates: [{ path: '甲-桂林' }] }] }) }) : normal(payload))
    await mount(['慢'], true)
    const textarea = document.querySelector('.region-text')
    textarea.value = '唯一'; textarea.dispatchEvent(new Event('input')); await flush()
    expect(state.model.regions).toEqual(['甲-唯一'])
    finish(); await flush()
    expect(state.model.regions).toEqual(['甲-唯一'])
  })

  it('keeps location limit protection when returning to a valid scope', async () => {
    await mount(['唯一'])
    state.model = { ...state.model, locations: Array.from({ length: 1001 }, (_, i) => `地${i}`) }
    await flush()
    expect(state.disabled).toBe(true)
    state.model = { ...state.model, locations: ['明選'] }
    await flush()
    expect(state.disabled).toBe(false)
    expect(state.model.regions).toEqual(['甲-唯一'])
  })

  it('uses the explicit system for a shared full path when restoring and moving a token', async () => {
    const normal = mocks.resolvePartitions.getMockImplementation()
    mocks.resolvePartitions.mockImplementation(async payload => {
      const reply = await normal(payload)
      reply.items = reply.items.map((item, index) => payload.items[index].text === '甲' ? { candidates: [{ path: '甲' }] } : item)
      return reply
    })
    await mount([], true)
    state.model = { ...state.model, regionText: '唯一 甲', regionDraft: { values: ['唯一', '甲'], tokens: [null, { text: '甲', source: 'map' }] } }
    await flush()
    expect(state.disabled).toBe(false)
    const textarea = document.querySelector('.region-text')
    textarea.value = '甲'; textarea.dispatchEvent(new Event('input')); await flush()
    expect(state.disabled).toBe(false)
    expect(state.model.regions).toEqual(['甲'])
    expect(state.model.regionUsing).toBe('yindian')
  })
})
