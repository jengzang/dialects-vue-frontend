import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, reactive } from 'vue'
import VocabularyViewPage from '../src/main/views/explore/word/vocabulary/VocabularyViewPage.vue'

const mocks = vi.hoisted(() => ({
  route: null,
  items: vi.fn(async () => ({ items: [], total: 0 })),
  notes: vi.fn(async () => ({ items: [], total: 0 })),
  points: vi.fn(async () => ({ points: [] })),
  words: vi.fn(async () => []),
  counts: vi.fn(async () => ({ total: 95003, locations: 29 })),
  locations: vi.fn(async () => [{ value: '测试地点', label: '测试地点', province: '广东', city: '广州' }]),
  partitions: vi.fn(async region_mode => ({ schema_version: 2, region_mode, nodes: [] })),
  tableMount: vi.fn(),
}))
vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => ({ replace: async ({ query }) => { mocks.route.query = query } }),
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: key => key }),
  I18nT: { setup: (_, { slots }) => () => h('span', Object.values(slots).flatMap(slot => slot())) },
}))
vi.mock('@/api', () => ({
  getVocabularyItems: mocks.items,
  getVocabularyCounts: mocks.counts,
  getVocabularyLocationOptions: mocks.locations,
  getVocabularyPartitionOptions: mocks.partitions,
  getVocabularyMapItems: mocks.points,
  getVocabularyMapPoints: mocks.points,
  getVocabularyStandardWords: mocks.words,
  getLocationDetail: vi.fn(),
  searchNotes: mocks.notes,
}))
vi.mock('@/main/components/TableAndTree/UniversalTable.vue', () => ({
  default: { props: ['defaultFilter'], setup(props) { mocks.tableMount(props.defaultFilter); return () => h('div', { class: 'test-table' }, 'table') } },
}))
vi.mock('@/main/components/map/VocabularyMap.vue', () => ({ default: { render: () => null } }))
vi.mock('@/main/components/geo/popups/LocationDetailPopup.vue', () => ({ default: { render: () => null } }))
let emitScope
vi.mock('@/main/components/geo/LocationAndRegionInput.vue', () => ({ default: {
  props: ['modelValue'],
  setup(props, { emit }) {
    emitScope = emit
    return () => h('div', { class: 'notes-scope-input' })
  },
} }))
vi.mock('@/components/common/AppModal.vue', () => ({ default: {
  props: ['modelValue'],
  setup: props => () => props.modelValue ? h('div', { class: 'open-modal' }) : null,
} }))
vi.mock('../src/main/views/explore/word/vocabulary/VocabularyTopControls.vue', () => ({
  default: {
    props: ['source', 'filterMode', 'selectedRegions', 'selectedLocations', 'selectedProvince', 'selectedCity', 'rememberLocationSelection', 'selectedSearchFields', 'partitionNodes', 'partitionLoading', 'partitionError', 'notesRefreshDisabled', 'standardWordsLoading', 'standardWordsError'],
    emits: ['search', 'refreshNotes', 'openLocationDetails', 'filterOpenChange', 'update:rememberLocationSelection', 'update:query', 'update:selectedLocations', 'update:viewMode', 'update:filterMode', 'update:selectedRegions', 'update:selectedProvince', 'update:selectedCity', 'update:selectedStandardWord'],
    setup(props, { emit }) {
      controlProps = props
      emitControl = emit
      return () => h('div', [
        props.source === 'character-notes' ? h('div', { id: 'vocabulary-notes-scope-filter', class: 'filter-strip notes-scope-filter' }) : null,
        h('button', { class: 'submit', onClick: () => {
          emit('update:query', '')
          if (props.source === 'character-notes') emit('refreshNotes')
          emit('search')
        } }, '搜索'),
        h('button', { class: 'filter', onClick: () => emit('update:selectedLocations', ['测试地点']) }),
        h('button', { class: 'map', onClick: () => emit('update:viewMode', 'map') }),
        h('button', { class: 'details', onClick: () => emit('openLocationDetails') }),
      ])
    },
  },
}))

let app
let host
let entrance
let controlProps, emitControl, pageState
const settle = async () => { for (let i = 0; i < 6; i++) await nextTick() }
async function mount(query = {}) {
  mocks.route = reactive({ path: '/explore/words/vocabulary', query })
  host = document.createElement('div')
  document.body.append(host)
  app = createApp(VocabularyViewPage)
  app.mixin({ mounted() {
    if (this.$options.__name === 'QuerySearchEntrance') entrance = this
    if (this.$options.name === 'VocabularyViewPage') pageState = this.$.setupState
  } })
  app.mount(host)
  await settle()
  await settle()
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.locations.mockReset().mockResolvedValue([{ value: '测试地点', label: '测试地点', province: '广东', city: '广州' }])
  localStorage.clear()
  sessionStorage.clear()
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
    return this.classList.contains('query-intro') ? { top: 180, height: 240 } : { top: 420, height: 140 }
  })
})
afterEach(() => { app?.unmount(); host?.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers() })

describe('vocabulary configuration entrance', () => {
  const memoryKey = 'vocabulary_location_selection'

  it.each(['location', 'administrative', 'yindian', 'map'])('restores remembered %s selection before the first query', async filterMode => {
    const saved = { filterMode, locations: ['测试地点'], province: '广东', city: '广州', regions: ['甲-乙'] }
    localStorage.setItem(memoryKey, JSON.stringify(saved))
    await mount()
    expect(controlProps.rememberLocationSelection).toBe(true)
    expect(controlProps.filterMode).toBe(filterMode)
    if (filterMode === 'location') expect(controlProps.selectedLocations).toEqual(saved.locations)
    else if (filterMode === 'administrative') {
      expect(controlProps.selectedProvince).toBe('广东')
      expect(controlProps.selectedCity).toBe('广州')
    } else expect(controlProps.selectedRegions).toEqual(saved.regions)
    expect(mocks.items).not.toHaveBeenCalled()
    host.querySelector('.submit').click(); await settle()
    const expected = filterMode === 'location' ? { locations: saved.locations }
      : filterMode === 'administrative' ? { province: saved.province, city: saved.city }
        : { region_mode: filterMode, regions: saved.regions }
    expect(mocks.items).toHaveBeenCalledWith(expect.objectContaining(expected))
  })

  it.each(['card', 'map', 'table'])('persists the applied scope in %s view while another mode is still a draft', async tab => {
    vi.useFakeTimers()
    await mount({ tab })
    emitControl('update:rememberLocationSelection', true); await settle()
    emitControl('update:filterMode', 'administrative'); await settle()
    emitControl('update:selectedProvince', '广东'); await settle()
    emitControl('update:selectedCity', '广州'); await settle()
    host.querySelector('.submit').click(); await settle()
    const saved = JSON.parse(localStorage.getItem(memoryKey))
    expect(saved).toEqual({ filterMode: 'administrative', locations: [], province: '广东', city: '广州', regions: [] })
    emitControl('filterOpenChange', true)
    emitControl('update:filterMode', 'map'); await settle()
    emitControl('update:selectedRegions', ['未提交分区']); await settle()
    emitControl('update:viewMode', tab === 'card' ? 'map' : 'card'); await settle()
    expect(JSON.parse(localStorage.getItem(memoryKey))).toEqual(saved)
  })

  it('continues querying if local storage writes fail', async () => {
    await mount()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    emitControl('update:rememberLocationSelection', true); await settle()
    host.querySelector('.submit').click(); await settle()
    expect(mocks.items).toHaveBeenCalled()
    emitControl('update:rememberLocationSelection', false); await settle()
    expect(controlProps.rememberLocationSelection).toBe(false)
  })

  it('remembers on opt-in, saves only queried selections, deduplicates and clears on opt-out', async () => {
    vi.useFakeTimers()
    await mount()
    emitControl('update:selectedLocations', ['测试地点']); await settle()
    expect(localStorage.getItem(memoryKey)).toBeNull()
    emitControl('update:rememberLocationSelection', true); await settle()
    expect(JSON.parse(localStorage.getItem(memoryKey)).locations).toEqual(['测试地点'])
    host.querySelector('.submit').click(); await settle()
    const write = vi.spyOn(Storage.prototype, 'setItem')
    emitControl('filterOpenChange', true)
    emitControl('update:selectedLocations', []); await settle()
    await vi.advanceTimersByTimeAsync(1000)
    expect(JSON.parse(localStorage.getItem(memoryKey)).locations).toEqual(['测试地点'])
    emitControl('filterOpenChange', false); await settle()
    await vi.advanceTimersByTimeAsync(250); await settle()
    expect(JSON.parse(localStorage.getItem(memoryKey)).locations).toEqual([])
    expect(write.mock.calls.filter(([key]) => key === memoryKey)).toHaveLength(1)
    emitControl('update:query', '新查询'); await settle()
    await vi.advanceTimersByTimeAsync(250); await settle()
    expect(write.mock.calls.filter(([key]) => key === memoryKey)).toHaveLength(1)
    emitControl('update:rememberLocationSelection', false); await settle()
    expect(localStorage.getItem(memoryKey)).toBeNull()
    expect(controlProps.selectedLocations).toEqual([])
  })

  it.each(['{bad json', 'null', '{"filterMode":"invalid"}'])('ignores invalid remembered selection %s', async saved => {
    localStorage.setItem(memoryKey, saved)
    await mount()
    expect(controlProps.rememberLocationSelection).toBe(false)
    expect(controlProps.selectedLocations).toEqual([])
  })

  async function submitTable() {
    host.querySelector('.submit').click()
    entrance.$.exposed.progress.value = 1
    await settle()
    await settle()
  }

  it('passes selected location names to the table and clears them when selecting all', async () => {
    await mount({ tab: 'table' })
    emitControl('update:selectedLocations', ['测试地点']); await settle()
    await submitTable()
    expect(mocks.tableMount).toHaveBeenLastCalledWith({ location_name: ['测试地点'] })
    emitControl('update:selectedLocations', []); await settle()
    await submitTable()
    expect(mocks.tableMount).toHaveBeenLastCalledWith({})
  })

  it.each(['administrative', 'yindian', 'map'])('resolves %s filters into concrete table location names', async mode => {
    await mount({ tab: 'table' })
    emitControl('update:filterMode', mode); await settle()
    if (mode === 'administrative') {
      emitControl('update:selectedProvince', '广东'); await settle()
      emitControl('update:selectedCity', '广州'); await settle()
    } else {
      emitControl('update:selectedRegions', ['甲-乙']); await settle()
    }
    const expectedScope = mode === 'administrative'
      ? { province: '广东', city: '广州' }
      : { region_mode: mode, regions: ['甲-乙'] }
    mocks.locations.mockClear()
    await submitTable()
    expect(mocks.locations).toHaveBeenCalledWith(expectedScope)
    expect(mocks.tableMount).toHaveBeenLastCalledWith({ location_name: ['测试地点'] })
  })

  it('does not mount an unfiltered table while resolving, after an empty scope, or after a resolution failure', async () => {
    await mount({ tab: 'table' })
    emitControl('update:filterMode', 'yindian'); await settle()
    emitControl('update:selectedRegions', ['甲-乙']); await settle()
    let finish
    mocks.locations.mockImplementation(() => new Promise(resolve => { finish = resolve }))
    await submitTable()
    expect(mocks.tableMount).not.toHaveBeenCalled()
    finish([]); await settle(); await settle()
    expect(mocks.tableMount).not.toHaveBeenCalled()
    mocks.locations.mockRejectedValue(new Error('scope unavailable'))
    emitControl('update:selectedRegions', ['丙-丁']); await settle()
    await submitTable()
    expect(mocks.tableMount).not.toHaveBeenCalled()
  })

  it('ignores old location resolutions when the applied table scope changes', async () => {
    await mount({ tab: 'table' })
    emitControl('update:filterMode', 'map'); await settle()
    emitControl('update:selectedRegions', ['甲-乙']); await settle()
    const pending = []
    mocks.locations.mockImplementation(params => new Promise(resolve => { pending.push({ params, resolve }) }))
    await submitTable()
    emitControl('update:selectedRegions', ['丙-丁']); await settle()
    await submitTable()
    pending.filter(item => item.params.regions?.[0] === '丙-丁').forEach(item => item.resolve([{ value: '新地点' }]))
    await settle(); await settle()
    expect(mocks.tableMount).toHaveBeenLastCalledWith({ location_name: ['新地点'] })
    pending.filter(item => item.params.regions?.[0] === '甲-乙').forEach(item => item.resolve([{ value: '旧地点' }]))
    await settle(); await settle()
    expect(mocks.tableMount).toHaveBeenLastCalledWith({ location_name: ['新地点'] })
  })

  it('uses the applied scope when switching from cards to table with a selector still open', async () => {
    await mount({ tab: 'card' })
    emitControl('update:selectedLocations', ['测试地点']); await settle()
    host.querySelector('.submit').click(); await settle()
    entrance.$.exposed.progress.value = 1; await settle()
    emitControl('filterOpenChange', true)
    emitControl('update:selectedLocations', ['未提交地点'])
    emitControl('update:viewMode', 'table'); await settle()
    expect(mocks.tableMount).toHaveBeenLastCalledWith({ location_name: ['测试地点'] })
  })

  it('defaults vocabulary search fields to definition and headword only', async () => {
    await mount()

    expect(controlProps.selectedSearchFields).toEqual(['definition', 'headword'])
  })

  it('moves the same notes scope into the compact panel and blocks refresh while resolving', async () => {
    await mount({ source: 'character-notes' })
    const scopeInput = host.querySelector('.notes-scope-input')
    expect(scopeInput).not.toBeNull()
    expect(host.querySelector('.query-search-panel').contains(scopeInput)).toBe(false)
    emitScope('update:modelValue', { locations: ['测试地点'], regions: [], regionUsing: 'map' })
    await settle()
    expect(controlProps.notesRefreshDisabled).toBe(true)
    emitScope('locationsResolved', { locations: ['测试地点'], regions: [], regionUsing: 'map' })
    await settle()
    expect(controlProps.notesRefreshDisabled).toBe(false)
    entrance.$.exposed.progress.value = 1
    await settle()
    expect(host.querySelector('.notes-scope-input')).toBe(scopeInput)
    expect(host.querySelector('.query-search-panel').contains(scopeInput)).toBe(true)
    expect(host.querySelector('.notes-scope-filter').contains(scopeInput)).toBe(true)
    entrance.$.exposed.progress.value = 0
    await settle()
    expect(host.querySelector('.notes-scope-input')).toBe(scopeInput)
    expect(host.querySelector('.query-search-panel').contains(scopeInput)).toBe(false)
  })
  it('migrates the existing administrative preference', async () => {
    localStorage.setItem('vocabulary_filter_by_region', 'true')
    await mount()
    expect(controlProps.filterMode).toBe('administrative')
  })

  it('submits only the active filter, clears paths on mode changes, and resets pagination', async () => {
    await mount({ tab: 'card' })
    emitControl('update:selectedLocations', ['测试地点']); await settle()
    host.querySelector('.submit').click(); await settle()
    expect(mocks.items.mock.calls.at(-1)[0]).toMatchObject({ locations: ['测试地点'], page: 1 })
    emitControl('update:filterMode', 'administrative'); await settle()
    emitControl('update:selectedProvince', '广东'); await settle()
    emitControl('update:selectedCity', '广州'); await settle()
    host.querySelector('.submit').click(); await settle()
    let params = mocks.items.mock.calls.at(-1)[0]
    expect(params).toMatchObject({ province: '广东', city: '广州', page: 1 })
    expect(params).not.toHaveProperty('locations')
    expect(params).not.toHaveProperty('regions')
    for (const mode of ['yindian', 'map']) {
      pageState.page = 4
      emitControl('update:filterMode', mode); await settle()
      expect(controlProps.selectedRegions).toEqual([])
      emitControl('update:selectedRegions', ['嶺南-珠江', '閩-閩南']); await settle()
      host.querySelector('.submit').click(); await settle()
      params = mocks.items.mock.calls.at(-1)[0]
      expect(params).toMatchObject({ region_mode: mode, regions: ['嶺南-珠江', '閩-閩南'], page: 1 })
      expect(params).not.toHaveProperty('locations')
      expect(params).not.toHaveProperty('province')
      expect(params).not.toHaveProperty('city')
      expect(mocks.partitions).toHaveBeenCalledWith(mode)
    }
    emitControl('update:filterMode', 'location'); await settle()
    host.querySelector('.submit').click(); await settle()
    expect(mocks.items.mock.calls.at(-1)[0]).toMatchObject({ locations: [], page: 1 })
    expect(mocks.items.mock.calls.at(-1)[0]).not.toHaveProperty('region_mode')
  })

  it('ignores an old tree response after switching partition systems', async () => {
    let finishYindian
    mocks.partitions.mockImplementationOnce(() => new Promise(resolve => { finishYindian = resolve }))
    await mount()
    emitControl('update:filterMode', 'yindian'); await settle()
    emitControl('update:filterMode', 'map'); await settle()
    expect(controlProps.partitionNodes).toEqual([])
    finishYindian({ schema_version: 2, region_mode: 'yindian', nodes: [{ label: '旧树', path: '旧树', children: [] }] }); await settle()
    expect(controlProps.partitionNodes).toEqual([])
    expect(controlProps.partitionLoading).toBe(false)
  })

  it('refreshes scoped location candidates and keeps partition metadata on entries', async () => {
    mocks.items.mockResolvedValueOnce({ items: [{ id: 1, location_name: '测试地点', yindian_region: '嶺南-珠江', atlas_region: '粵語-廣府片' }], total: 1 })
    await mount()
    emitControl('update:filterMode', 'yindian'); await settle()
    emitControl('update:selectedRegions', ['嶺南-珠江']); await settle()
    await new Promise(resolve => setTimeout(resolve, 350)); await settle()
    expect(mocks.locations).toHaveBeenLastCalledWith({ region_mode: 'yindian', regions: ['嶺南-珠江'] })
    host.querySelector('.submit').click(); await settle()
    expect(pageState.entries[0]).toMatchObject({ yindianRegion: '嶺南-珠江', atlasRegion: '粵語-廣府片' })
  })

  it('deduplicates same-scope location requests, rejects stale scopes, and clears invalid selected locations', async () => {
    await mount()
    let finishOld
    emitControl('update:filterMode', 'yindian'); await settle()
    mocks.locations.mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve }))
    emitControl('update:selectedRegions', ['舊分區']); await settle()
    pageState.applyVocabularyQuery()
    const count = mocks.locations.mock.calls.length
    const first = pageState.loadVocabularyLocationOptions()
    const second = pageState.loadVocabularyLocationOptions()
    expect(mocks.locations.mock.calls.length).toBe(count + 1)
    emitControl('update:filterMode', 'location'); await settle()
    emitControl('update:selectedLocations', ['已不存在']); await settle()
    pageState.applyVocabularyQuery()
    await pageState.loadVocabularyLocationOptions(); await settle()
    expect(controlProps.selectedLocations).toEqual([])
    finishOld([{ value: '舊地點' }]); await Promise.all([first, second]); await settle()
    expect(pageState.locationOptions.map(option => option.value)).toEqual(['测试地点'])
  })

  it('keeps administrative candidates complete after loading filtered location options', async () => {
    await mount()
    emitControl('update:filterMode', 'administrative'); await settle()
    emitControl('update:selectedProvince', '广东'); await settle()
    pageState.applyVocabularyQuery()
    mocks.locations.mockResolvedValueOnce([])
    await pageState.loadVocabularyLocationOptions(); await settle()
    expect(pageState.provinceOptions.some(option => option.value === '广东')).toBe(true)
    expect(pageState.cityOptions.some(option => option.value === '广州')).toBe(true)
  })

  it('does not let pending scoped options prune a newly selected location while its selector is open', async () => {
    vi.useFakeTimers()
    await mount()
    let finishOptions
    mocks.locations.mockImplementationOnce(() => new Promise(resolve => { finishOptions = resolve }))
    emitControl('update:filterMode', 'yindian'); await settle()
    emitControl('update:selectedRegions', ['舊分區']); await settle()
    host.querySelector('.submit').click(); await settle()
    emitControl('update:filterMode', 'location'); await settle()
    emitControl('filterOpenChange', true)
    emitControl('update:selectedLocations', ['测试地点']); await settle()
    finishOptions([{ value: '舊地點' }]); await settle()
    expect(controlProps.selectedLocations).toEqual(['测试地点'])
    expect(pageState.locationOptions.map(option => option.value)).toEqual(['测试地点'])
  })

  it('accepts pending candidates when the draft only reorders the same partition set', async () => {
    vi.useFakeTimers()
    localStorage.setItem('vocabulary_filter_mode', 'yindian')
    await mount()
    let finishOptions
    mocks.locations.mockImplementationOnce(() => new Promise(resolve => { finishOptions = resolve }))
    emitControl('update:selectedRegions', ['甲', '乙']); await settle()
    host.querySelector('.submit').click(); await settle()
    const locationsCount = mocks.locations.mock.calls.length
    emitControl('filterOpenChange', true)
    emitControl('update:selectedRegions', ['乙', '甲']); await settle()
    finishOptions([{ value: '新候選', label: '新候選' }]); await settle()
    expect(pageState.locationOptions.map(option => option.value)).toEqual(['新候選'])
    emitControl('filterOpenChange', false); await settle()
    await vi.advanceTimersByTimeAsync(1000)
    expect(mocks.locations).toHaveBeenCalledTimes(locationsCount)
  })

  it('carries exclusive region filters into map candidates, overview points and detailed items', async () => {
    mocks.words.mockResolvedValueOnce({ standard_words: [{ standard_word: '日', entry_count: 1, location_count: 1 }] })
    await mount({ tab: 'map' })
    emitControl('update:filterMode', 'map'); await settle()
    emitControl('update:selectedRegions', ['粵語-廣府片']); await settle()
    host.querySelector('.submit').click(); await settle()
    for (const request of [mocks.words, mocks.points]) {
      expect(request.mock.calls.at(-1)[0]).toMatchObject({ region_mode: 'map', regions: ['粵語-廣府片'] })
      expect(request.mock.calls.at(-1)[0]).not.toHaveProperty('locations')
      expect(request.mock.calls.at(-1)[0]).not.toHaveProperty('province')
    }
    emitControl('update:selectedStandardWord', '日'); await settle()
    expect(mocks.points.mock.calls.at(-1)[0]).toMatchObject({ region_mode: 'map', regions: ['粵語-廣府片'], standard_words: ['日'] })
  })

  it('keys entries by path and prevents older filter responses replacing current results', async () => {
    let finishOld
    mocks.items.mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve }))
    await mount()
    emitControl('update:filterMode', 'yindian'); await settle()
    emitControl('update:selectedRegions', ['甲-乙']); await settle()
    host.querySelector('.submit').click(); await settle()
    emitControl('update:selectedRegions', ['丙-乙']); await settle()
    host.querySelector('.submit').click(); await settle()
    expect(mocks.items).toHaveBeenCalledTimes(2)
    expect(mocks.items.mock.calls.at(-1)[0]).toMatchObject({ regions: ['丙-乙'], page: 1 })
    finishOld({ items: [{ id: 99, local_expression: '舊結果' }], total: 1 }); await settle()
    expect(pageState.entries).toEqual([])
  })

  it('preserves old results until changed filters take effect after the delay', async () => {
    vi.useFakeTimers()
    mocks.items.mockResolvedValueOnce({ items: [{ id: 1, local_expression: '舊結果' }], total: 100 })
    await mount()
    host.querySelector('.submit').click(); await settle()
    expect(pageState.canLoadMore).toBe(true)
    emitControl('update:filterMode', 'map'); await settle()
    expect(pageState.entries).toHaveLength(1)
    expect(pageState.canLoadMore).toBe(true)
    await vi.advanceTimersByTimeAsync(250); await settle()
    expect(pageState.canLoadMore).toBe(false)
    expect(pageState.entries).toEqual([])
  })

  it.each(['location', 'administrative', 'yindian', 'map'])('waits for %s to close before delaying any refresh', async mode => {
    vi.useFakeTimers()
    localStorage.setItem('vocabulary_filter_mode', mode)
    mocks.items.mockResolvedValueOnce({ items: [{ id: 1, local_expression: '已有結果' }], total: 100 })
    await mount()
    host.querySelector('.submit').click(); await settle()
    expect(mocks.items).toHaveBeenCalledTimes(1)
    const locationsCount = mocks.locations.mock.calls.length
    emitControl('filterOpenChange', true)
    const event = mode === 'location' ? 'update:selectedLocations' : mode === 'administrative' ? 'update:selectedProvince' : 'update:selectedRegions'
    const value = mode === 'administrative' ? '广东' : ['测试地点']
    emitControl(event, value); await settle()
    expect(pageState.isVocabularyFilterOpen).toBe(true)
    await vi.advanceTimersByTimeAsync(1200)
    expect(mocks.items).toHaveBeenCalledTimes(1)
    expect(mocks.locations).toHaveBeenCalledTimes(locationsCount)
    expect(pageState.entries).toHaveLength(1)
    emitControl('filterOpenChange', false); await settle()
    await vi.advanceTimersByTimeAsync(249)
    expect(mocks.items).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1); await settle()
    expect(mocks.items).toHaveBeenCalledTimes(2)
    expect(mocks.locations).toHaveBeenCalledTimes(locationsCount + (mode === 'administrative' ? 0 : 1))
  })

  it.each(['card', 'map'])('does not refresh unchanged partition sets in %s mode', async tab => {
    vi.useFakeTimers()
    localStorage.setItem('vocabulary_filter_mode', 'yindian')
    await mount({ tab })
    emitControl('update:selectedRegions', ['甲', '乙']); await settle()
    host.querySelector('.submit').click(); await settle()
    await vi.advanceTimersByTimeAsync(300); await settle()
    const counts = [mocks.items, mocks.points, mocks.words, mocks.locations].map(mock => mock.mock.calls.length)
    emitControl('filterOpenChange', true)
    emitControl('update:selectedRegions', ['乙', '甲']); await settle()
    emitControl('filterOpenChange', false); await settle()
    await vi.advanceTimersByTimeAsync(1000)
    expect([mocks.items, mocks.points, mocks.words, mocks.locations].map(mock => mock.mock.calls.length)).toEqual(counts)
  })

  it('cancels the province delay while the city selector is open and submits both together', async () => {
    vi.useFakeTimers()
    localStorage.setItem('vocabulary_filter_mode', 'administrative')
    await mount()
    host.querySelector('.submit').click(); await settle()
    emitControl('update:selectedProvince', '广东'); await settle()
    await vi.advanceTimersByTimeAsync(100)
    emitControl('filterOpenChange', true); await settle()
    await vi.advanceTimersByTimeAsync(1000)
    expect(mocks.items).toHaveBeenCalledTimes(1)
    emitControl('update:selectedCity', '广州')
    emitControl('filterOpenChange', false); await settle()
    await vi.advanceTimersByTimeAsync(250); await settle()
    expect(mocks.items).toHaveBeenCalledTimes(2)
    expect(mocks.items.mock.calls.at(-1)[0]).toMatchObject({ province: '广东', city: '广州' })
  })

  it('does not refresh when a pending selection returns to the applied value', async () => {
    vi.useFakeTimers()
    await mount()
    host.querySelector('.submit').click(); await settle()
    const locationsCount = mocks.locations.mock.calls.length
    emitControl('filterOpenChange', true)
    emitControl('update:selectedLocations', ['测试地点']); await settle()
    emitControl('update:selectedLocations', []); await settle()
    emitControl('filterOpenChange', false); await settle()
    await vi.advanceTimersByTimeAsync(1000)
    expect(mocks.items).toHaveBeenCalledTimes(1)
    expect(mocks.locations).toHaveBeenCalledTimes(locationsCount)
  })

  it('loads consecutive pending-total card pages until has_more is false', async () => {
    mocks.items
      .mockResolvedValueOnce({ items: [{ id: 1 }], total: null, has_more: true, page: 1 })
      .mockResolvedValueOnce({ items: [{ id: 2 }], total: null, has_more: true, page: 2 })
      .mockResolvedValueOnce({ items: [{ id: 3 }], total: 3, has_more: false, page: 3 })
    await mount()
    host.querySelector('.submit').click(); await settle()
    expect(mocks.items.mock.calls.at(-1)[0]).toMatchObject({ defer_total: true, page: 1 })
    expect(pageState.total).toBeNull()
    expect(pageState.canLoadMore).toBe(true)
    await pageState.loadVocabularyItems({ append: true }); await settle()
    expect(pageState.canLoadMore).toBe(true)
    await pageState.loadVocabularyItems({ append: true }); await settle()
    expect(pageState.entries.map(item => item.id)).toEqual([1, 2, 3])
    expect(pageState.total).toBe(3)
    expect(pageState.canLoadMore).toBe(false)
  })

  it('retries the same card page after a failed load without skipping data', async () => {
    mocks.items
      .mockResolvedValueOnce({ items: [{ id: 1 }], total: null, has_more: true, page: 1 })
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValueOnce({ items: [{ id: 2 }], total: 2, has_more: false, page: 2 })
    await mount()
    host.querySelector('.submit').click(); await settle()
    await pageState.loadVocabularyItems({ append: true }); await settle()
    expect(pageState.canLoadMore).toBe(true)
    await pageState.loadVocabularyItems({ append: true }); await settle()
    expect(mocks.items.mock.calls.slice(-2).map(([params]) => params.page)).toEqual([2, 2])
    expect(pageState.entries.map(item => item.id)).toEqual([1, 2])
  })

  it('keeps cached pending map details loadable and stops on has_more false', async () => {
    mocks.items
      .mockResolvedValueOnce({ items: [{ id: 1 }], total: null, has_more: true, page: 1 })
      .mockResolvedValueOnce({ items: [{ id: 2 }], total: 2, has_more: false, page: 2 })
    await mount({ tab: 'map' })
    host.querySelector('.submit').click(); await settle()
    await pageState.handleMapPointClick({ locationName: '测试地点' }); await settle()
    expect(mocks.items.mock.calls.at(-1)[0]).toMatchObject({ defer_total: true, page: 1 })
    expect(pageState.mapDetailTotal).toBeNull()
    expect(pageState.canLoadMoreMapDetail).toBe(true)
    await pageState.handleMapPointClick({ locationName: '测试地点' }); await settle()
    expect(mocks.items).toHaveBeenCalledTimes(1)
    expect(pageState.canLoadMoreMapDetail).toBe(true)
    await pageState.loadMoreMapDetail(); await settle()
    expect(pageState.mapDetailEntries.map(item => item.id)).toEqual([1, 2])
    expect(pageState.canLoadMoreMapDetail).toBe(false)
  })

  it('keeps pagination on the applied scope while a new location is being selected', async () => {
    vi.useFakeTimers()
    mocks.items.mockResolvedValueOnce({ items: [{ id: 1 }], total: 100 })
    await mount()
    host.querySelector('.submit').click(); await settle()
    emitControl('filterOpenChange', true)
    emitControl('update:selectedLocations', ['测试地点']); await settle()
    await pageState.loadVocabularyItems({ append: true }); await settle()
    expect(mocks.items.mock.calls.at(-1)[0]).toMatchObject({ locations: [], page: 2 })
  })

  it('does not leave a scheduled refresh after unmount', async () => {
    vi.useFakeTimers()
    await mount()
    host.querySelector('.submit').click(); await settle()
    emitControl('update:selectedLocations', ['测试地点']); await settle()
    const locationsCount = mocks.locations.mock.calls.length
    app.unmount(); app = null
    await vi.advanceTimersByTimeAsync(1000)
    expect(mocks.items).toHaveBeenCalledTimes(1)
    expect(mocks.locations).toHaveBeenCalledTimes(locationsCount)
  })

  it('does not run a pending vocabulary refresh after switching to notes', async () => {
    vi.useFakeTimers()
    await mount()
    host.querySelector('.submit').click(); await settle()
    emitControl('update:selectedLocations', ['测试地点']); await settle()
    mocks.route.query = { source: 'character-notes', tab: 'card' }; await settle()
    const locationsCount = mocks.locations.mock.calls.length
    await vi.advanceTimersByTimeAsync(1000)
    expect(mocks.items).toHaveBeenCalledTimes(1)
    expect(mocks.locations).toHaveBeenCalledTimes(locationsCount)
    expect(mocks.notes).not.toHaveBeenCalled()
  })

  it('applies an explicit search immediately without a duplicate delayed refresh', async () => {
    vi.useFakeTimers()
    await mount()
    host.querySelector('.submit').click(); await settle()
    emitControl('update:selectedLocations', ['测试地点']); await settle()
    host.querySelector('.submit').click(); await settle()
    expect(mocks.items).toHaveBeenCalledTimes(2)
    expect(mocks.items.mock.calls.at(-1)[0]).toMatchObject({ locations: ['测试地点'] })
    const locationsCount = mocks.locations.mock.calls.length
    await vi.advanceTimersByTimeAsync(1000)
    expect(mocks.items).toHaveBeenCalledTimes(2)
    expect(mocks.locations).toHaveBeenCalledTimes(locationsCount)
  })

  it('keeps map view switching on the applied scope and delays draft map requests until closure', async () => {
    vi.useFakeTimers()
    localStorage.setItem('vocabulary_filter_mode', 'yindian')
    await mount()
    host.querySelector('.submit').click(); await settle()
    emitControl('filterOpenChange', true)
    emitControl('update:selectedRegions', ['甲-乙']); await settle()
    emitControl('update:viewMode', 'map'); await settle()
    expect(mocks.words).toHaveBeenCalledTimes(1)
    expect(mocks.points).toHaveBeenCalledTimes(1)
    expect(mocks.points.mock.calls[0][0]).toMatchObject({ regions: [] })
    await vi.advanceTimersByTimeAsync(1000)
    expect(mocks.words).toHaveBeenCalledTimes(1)
    expect(mocks.points).toHaveBeenCalledTimes(1)
    emitControl('filterOpenChange', false); await settle()
    await vi.advanceTimersByTimeAsync(250); await settle()
    expect(mocks.words).toHaveBeenCalledTimes(2)
    expect(mocks.points).toHaveBeenCalledTimes(2)
    expect(mocks.points.mock.calls.at(-1)[0]).toMatchObject({ regions: ['甲-乙'] })
  })

  it('refreshes entries even when location options have not returned', async () => {
    await mount()
    host.querySelector('.submit').click(); await settle()
    let finishOptions
    mocks.locations.mockImplementationOnce(() => new Promise(resolve => { finishOptions = resolve }))
    emitControl('update:filterMode', 'yindian'); await settle()
    emitControl('update:selectedRegions', ['甲-乙']); await settle()
    await new Promise(resolve => setTimeout(resolve, 350)); await settle()
    expect(mocks.items.mock.calls.at(-1)[0]).toMatchObject({ region_mode: 'yindian', regions: ['甲-乙'], page: 1 })
    finishOptions([]); await settle()
  })
  it('keeps the configuration location details dialog available before Search', async () => {
    await mount({ tab: 'card' })
    host.querySelector('.details').click()
    await settle()
    expect(host.querySelector('.open-modal')).not.toBeNull()
    expect(host.querySelector('.content-area')).toBeNull()
  })

  it.each(['card', 'map', 'table'])('does not query or mount results initially in %s mode', async tab => {
    await mount({ tab })
    host.querySelector('.filter').click()
    await new Promise(resolve => setTimeout(resolve, 850))
    expect(mocks.items).not.toHaveBeenCalled()
    expect(mocks.points).not.toHaveBeenCalled()
    expect(mocks.words).not.toHaveBeenCalled()
    expect(mocks.tableMount).not.toHaveBeenCalled()
    expect(host.querySelector('.content-area')).toBeNull()
  })

  it.each(['vocabulary', 'character-notes'])('requires Search even for an empty query in %s', async source => {
    await mount({ source, tab: 'card' })
    expect(mocks.notes).not.toHaveBeenCalled()
    expect(mocks.items).not.toHaveBeenCalled()
    // Scrolling to compact alone must not query or expose results.
    entrance.$.exposed.progress.value = 1
    await settle()
    expect(host.querySelector('.content-area')).toBeNull()
    host.querySelector('.submit').click()
    await settle()
    const request = source === 'vocabulary' ? mocks.items : mocks.notes
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ q: '' }))
    expect(host.querySelector('.content-area')).not.toBeNull()
    // Returning to the large panel hides results but preserves the submitted query.
    entrance.$.exposed.progress.value = 0
    await settle()
    expect(host.querySelector('.content-area')).toBeNull()
    request.mockClear()
    entrance.$.exposed.progress.value = 1
    await settle()
    expect(host.querySelector('.content-area')).not.toBeNull()
    expect(request).not.toHaveBeenCalled()
  })

  it('mounts the table only after Search finishes collapsing and resets when switching source', async () => {
    await mount({ tab: 'table' })
    host.querySelector('.submit').click()
    await settle()
    expect(mocks.tableMount).not.toHaveBeenCalled()
    entrance.$.exposed.progress.value = 1
    await settle()
    expect(mocks.tableMount).toHaveBeenCalledTimes(1)
    mocks.route.query = { source: 'character-notes', tab: 'card' }
    await settle()
    expect(mocks.notes).not.toHaveBeenCalled()
    expect(host.querySelector('.content-area')).toBeNull()
  })

  it('does not query on a draft mode change but searches the selected map mode on submit', async () => {
    await mount({ tab: 'card' })
    host.querySelector('.map').click()
    await settle()
    expect(mocks.points).not.toHaveBeenCalled()
    expect(mocks.words).not.toHaveBeenCalled()
    host.querySelector('.submit').click()
    await settle()
    expect(mocks.points).toHaveBeenCalled()
    expect(mocks.words).toHaveBeenCalled()
  })
})


describe('map first and independent standard-word loading', () => {
  const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }
  it('requests the map first and shows even an empty map while words are pending', async () => {
    const map = deferred(), words = deferred()
    mocks.points.mockImplementationOnce(() => map.promise)
    mocks.words.mockImplementationOnce(() => words.promise)
    await mount({ tab: 'map' })
    host.querySelector('.submit').click(); await settle()
    expect(mocks.points).toHaveBeenCalledTimes(1)
    expect(mocks.words).not.toHaveBeenCalled()
    map.resolve({ points: [], total_entries: 0 }); await settle(); await settle()
    expect(mocks.words).toHaveBeenCalledTimes(1)
    expect(pageState.isMapInitialLoading).toBe(false)
    expect(controlProps.standardWordsLoading).toBe(true)
    words.resolve({ standard_words: [] }); await settle()
    expect(controlProps.standardWordsLoading).toBe(false)
  })
  it('does not launch old words when the applied search changes during the map request', async () => {
    const map = deferred()
    mocks.points.mockImplementationOnce(() => map.promise)
    await mount({ tab: 'map' })
    host.querySelector('.submit').click(); await settle()
    emitControl('update:query', '新词'); pageState.applyVocabularyQuery()
    map.resolve({ points: [] }); await settle(); await settle()
    expect(mocks.words).not.toHaveBeenCalled()
  })
  it('keeps the map and selected words on a standard-word failure and allows a retry', async () => {
    await mount({ tab: 'map' })
    emitControl('update:selectedStandardWord', '太阳'); await settle()
    mocks.words.mockRejectedValueOnce(new Error('offline'))
    host.querySelector('.submit').click(); await settle(); await settle()
    expect(pageState.selectedStandardWord).toBe('太阳')
    expect(controlProps.standardWordsError).toBe(true)
    expect(pageState.loadError).toBe('')
    mocks.words.mockResolvedValueOnce({ standard_words: [{ standard_word: '太阳' }] })
    await pageState.loadVocabularyStandardWords(); await settle()
    expect(controlProps.standardWordsError).toBe(false)
    expect(pageState.selectedStandardWord).toBe('太阳')
  })
})
