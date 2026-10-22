import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, createApp, defineComponent, h, nextTick, reactive, ref, watch } from 'vue'

const mocks = vi.hoisted(() => ({ route: null, replace: vi.fn(), compareChars: vi.fn(), compareZhongGu: vi.fn(), compareTones: vi.fn() }))
vi.mock('vue-router', () => ({ useRoute: () => mocks.route, useRouter: () => ({ replace: mocks.replace }) }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key, params) => params?.summary || key }) }))
vi.mock('@/composables/data/useQueryConfig.js', () => ({ useQueryConfig: () => ({
  keyValueMap: ref({ 攝: ['流', '深'], 母: ['精'] }), availableKeys: ref(['攝', '母']), exclusiveRules: ref([]), singleSelectKeys: ref([]),
}) }))
vi.mock('@/main/config/BarAndTabs/MenuBarConfig.js', () => ({ readMenuBarMemory: () => null, writeMenuBarMemory: vi.fn() }))
vi.mock('@/utils/ui/message.js', () => ({ showWarning: vi.fn() }))
vi.mock('@/utils/map/MapData.js', () => ({ requestMapFitView: vi.fn() }))
vi.mock('@/api/index.js', () => ({
  compareChars: mocks.compareChars, compareZhongGu: mocks.compareZhongGu, compareTones: mocks.compareTones,
  getCoordinates: vi.fn().mockResolvedValue({ coordinates_locations: [] }),
}))
vi.mock('@/api', () => ({
  compareChars: mocks.compareChars, compareZhongGu: mocks.compareZhongGu, compareTones: mocks.compareTones,
  getCoordinates: vi.fn().mockResolvedValue({ coordinates_locations: [] }),
}))
vi.mock('@/composables/router/useRouteQueryState.js', () => ({ useRouteQueryState: (_key, options) => ({ state: ref(options.defaultValue), set: vi.fn(), applyToQuery: vi.fn() }) }))
vi.mock('@/components/common/TabSwitcher.vue', () => ({ default: defineComponent({ inheritAttrs: false, props: ['modelValue'], setup: (props, { slots }) => () => slots.default({ currentTab: props.modelValue }) }) }))
vi.mock('@/main/components/tutorial/TutorialQuickStartPill.vue', () => ({ default: { template: '<button class="existing-quick-start">Quick start</button>' } }))
vi.mock('@/main/components/geo/LocationAndRegionInput.vue', () => ({ default: defineComponent({
  props: ['modelValue'], setup(props, { expose }) {
    expose({ selectedValue: computed(() => props.modelValue.regions), allLocationsString: computed(() => props.modelValue.locations.join(' ')), regionUsing: computed(() => props.modelValue.regionUsing), runDisabled: false })
    return () => h('div')
  },
}) }))
vi.mock('@/main/components/query/ZhongguSelector.vue', () => ({ default: defineComponent({
  setup(_props, { expose }) { expose({ combinations: ['流[攝]'] }); return () => h('div') },
}) }))
vi.mock('@/main/components/query/ZhongGuDirectInput.vue', () => ({ default: defineComponent({
  setup(_props, { expose }) {
    const positionInput = ref(''); const charInput = ref('')
    expose({ positionInput, charInput, pathStrings: computed(() => [positionInput.value]), chars: charInput })
    return () => h('div')
  },
}) }))
vi.mock('@/main/components/query/YinweiSelector.vue', () => ({ default: defineComponent({
  props: ['selectedCard'],
  setup(props, { expose }) {
    const tab3KeyInput = ref('')
    watch(() => props.selectedCard, () => { tab3KeyInput.value = '' })
    expose({ tab3KeyInput, normalizedPhoInput: tab3KeyInput, ensureReady: vi.fn(), restoreInput: value => { tab3KeyInput.value = value } })
    return () => h('div')
  },
}) }))
vi.mock('@/main/components/pho/PhoneticCompare.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/main/components/geo/LocationMultiInput.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/selector/SimpleSelectDropdown.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/selector/RadioGroup.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/selector/CheckBox.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/selector/ChoiceSelector.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/main/components/query/KeyButtonGroup.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/main/components/query/DropdownValueSelector.vue', () => ({ default: { template: '<div />' } }))

import QueryPage from '../src/main/views/menu/QueryPage.vue'
import ComparePage from '../src/main/views/menu/ComparePage.vue'
import { globalPayload, preferredCharacterTable, setZhongguInputMode, uiStore, tutorialEnabled } from '../src/main/store/store.js'

let app
let vm
const loc = () => ({ locations: ['廣州'], regions: ['粵語-廣府片'], regionUsing: 'map', regions_semantics: 'path-v2' })
async function settle() { await nextTick(); await nextTick(); await nextTick() }
async function mount(page, sub) {
  mocks.route = reactive({ params: { sub, locale: 'zh-CN' }, query: {}, path: `/zh-CN/menu/query/${sub}` })
  app = createApp(page)
  app.config.globalProperties.$t = key => key
  app.mount(document.body.appendChild(document.createElement('div')))
  vm = app._instance.setupState
  await settle()
  return vm
}
function enable(group, tab) {
  const buttons = uiStore.buttonStates[group]
  buttons.isRunning = false
  buttons.isLocationDisabled = false
  buttons.tabContentDisabled[tab] = false
}
beforeEach(() => {
  localStorage.clear(); globalPayload.value = null; preferredCharacterTable.value = 'characters'; setZhongguInputMode('selector'); tutorialEnabled.value = false
  vi.clearAllMocks()
  mocks.replace.mockResolvedValue()
  for (const api of [mocks.compareChars, mocks.compareZhongGu, mocks.compareTones]) api.mockResolvedValue({ results: [] })
})
afterEach(() => { app?.unmount(); app = null; document.body.innerHTML = '' })

describe('query recent conditions', () => {
  it('does not record rejected input or quick-fill alone and preserves the effective fallback location', async () => {
    await mount(QueryPage, 'char')
    enable('query', 'tab1')
    await vm.runAction()
    expect(localStorage.getItem('recent-query:v1:query:tab1')).toBeNull()
    vm.hanziInput = '山'
    await settle()
    expect(localStorage.getItem('recent-query:v1:query:tab1')).toBeNull()
    enable('query', 'tab1')
    await vm.runAction()
    const saved = JSON.parse(localStorage.getItem('recent-query:v1:query:tab1'))
    expect(saved.entries[0].snapshot.loc.locations).toEqual(['query.tab3.defaultLocation'])
  })

  it.each(['char', 'zhonggu', 'yinwei', 'tone'])('records and restores complete %s conditions without submitting', async sub => {
    await mount(QueryPage, sub)
    vm.locationModel = loc()
    vm.hanziInput = '山水'
    vm.tabStates.tab2 = { card: '聲母', keys: ['母'], valueMap: { 母: ['精'] }, excludeColumns: ['多韻'] }
    vm.tabStates.tab3 = { card: '韻母', keys: ['攝'], valueMap: {}, excludeColumns: ['多等'] }
    await settle()
    vm.YinweiSelectorRef.tab3KeyInput = 'a'
    await settle()
    enable('query', vm.currentTab)
    await vm.runAction()
    await settle()
    const key = `recent-query:v1:query:${vm.currentTab}`
    const saved = JSON.parse(localStorage.getItem(key))
    expect(saved?.entries).toHaveLength(1)
    vm.locationModel = { locations: [], regions: [], regionUsing: 'yindian' }
    vm.hanziInput = '火'
    vm.tabStates.tab2.excludeColumns = []
    vm.YinweiSelectorRef.tab3KeyInput = 'z'
    if (sub === 'yinwei') vm.tabStates.tab3.card = '聲母'
    await settle()
    const previousPayload = JSON.stringify(globalPayload.value)
    mocks.replace.mockClear()
    document.querySelector('.pill-btn--history').click()
    await settle()
    expect(vm.locationModel).toEqual(loc())
    if (sub === 'char') expect(vm.hanziInput).toBe('山水')
    if (sub === 'zhonggu') {
      expect(vm.tabStates.tab2.valueMap).toEqual({ 母: ['精'] })
      expect(vm.tabStates.tab2.excludeColumns).toEqual(['多韻'])
    }
    if (sub === 'yinwei') {
      expect(vm.YinweiSelectorRef.tab3KeyInput).toBe('a')
      expect(vm.tabStates.tab3.excludeColumns).toEqual(['多等'])
    }
    expect(mocks.replace).not.toHaveBeenCalled()
    expect(JSON.stringify(globalPayload.value)).toBe(previousPayload)
    expect(JSON.parse(localStorage.getItem(key))).toEqual(saved)
    expect(document.querySelector('.existing-quick-start')).not.toBeNull()
  })

  it('restores direct zhonggu input and table after mode changes', async () => {
    setZhongguInputMode('direct')
    await mount(QueryPage, 'zhonggu')
    vm.locationModel = loc()
    vm.ZhongguDirectInputRef.positionInput = '流攝'
    vm.ZhongguDirectInputRef.charInput = '山'
    vm.tabStates.tab2.excludeColumns = ['多韻']
    enable('query', 'tab2')
    await vm.runAction()
    setZhongguInputMode('selector')
    preferredCharacterTable.value = 'other'
    await settle()
    document.querySelector('.pill-btn--history')?.click()
    await settle()
    expect(preferredCharacterTable.value).toBe('characters')
    expect(vm.ZhongguDirectInputRef.positionInput).toBe('流攝')
    expect(vm.ZhongguDirectInputRef.charInput).toBe('山')
    expect(vm.tabStates.tab2.excludeColumns).toEqual(['多韻'])
  })
})

describe('compare recent conditions', () => {
  it.each(['char', 'zhonggu', 'tone'])('restores both groups and all %s conditions without comparing', async sub => {
    await mount(ComparePage, sub)
    vm.locationModel = loc()
    vm.tabStates.tab1 = { group1: { chars: '包' }, group2: { chars: '好' }, features: '韻母' }
    vm.tabStates.tab4.selectedToneClasses = ['陰平', '陽平']
    vm.tabStates.tab2.current = { card: '聲母', keys: ['母'], valueMap: { 母: ['精'] }, excludeColumns: ['多韻'] }
    await settle()
    const group = { card: '聲母', keys: ['母'], valueMap: { 母: ['精'] }, excludeColumns: ['多韻'], combinations: ['精[母]'] }
    vm.tabStates.tab2.group1Items = [group]
    vm.tabStates.tab2.group2Items = [{ ...group, valueMap: { 母: ['幫'] }, combinations: ['幫[母]'] }]
    await settle()
    const expected = JSON.parse(JSON.stringify(vm.tabStates[vm.currentTab]))
    enable('compare', vm.currentTab)
    await vm.runAction()
    const key = `recent-query:v1:compare:${vm.currentTab}`
    expect(JSON.parse(localStorage.getItem(key))?.entries).toHaveLength(1)
    vm.tabStates.tab1.group1.chars = '水'
    vm.tabStates.tab4.selectedToneClasses = []
    vm.tabStates.tab2.current.card = '韻母'
    vm.locationModel = { locations: [], regions: [], regionUsing: 'map' }
    await settle()
    mocks.replace.mockClear()
    for (const api of [mocks.compareChars, mocks.compareZhongGu, mocks.compareTones]) api.mockClear()
    document.querySelector('.pill-btn--history')?.click()
    await settle()
    expect(vm.tabStates[vm.currentTab]).toEqual(expected)
    expect(vm.locationModel).toEqual(loc())
    expect(mocks.replace).not.toHaveBeenCalled()
    for (const api of [mocks.compareChars, mocks.compareZhongGu, mocks.compareTones]) expect(api).not.toHaveBeenCalled()
  })

  it('restores direct drafts and groups after table and input-mode reset watchers', async () => {
    setZhongguInputMode('direct')
    await mount(ComparePage, 'zhonggu')
    vm.locationModel = loc()
    vm.tabStates.tab2.current.card = '聲母'
    await settle()
    const group = { type: 'direct', card: '聲母', pathStrings: ['流攝'], chars: '山', excludeColumns: ['多韻'] }
    vm.tabStates.tab2.group1Items = [group]
    vm.tabStates.tab2.group2Items = [{ ...group, chars: '水' }]
    vm.CompareDirectInputRef.positionInput = '深攝'
    vm.CompareDirectInputRef.charInput = '火'
    await settle()
    enable('compare', 'tab2')
    await vm.runAction()
    setZhongguInputMode('selector')
    preferredCharacterTable.value = 'other'
    await settle()
    document.querySelector('.pill-btn--history')?.click()
    await settle()
    expect(preferredCharacterTable.value).toBe('characters')
    expect(vm.tabStates.tab2.group1Items).toEqual([group])
    expect(vm.tabStates.tab2.group2Items[0].chars).toBe('水')
    expect(vm.CompareDirectInputRef.positionInput).toBe('深攝')
    expect(vm.CompareDirectInputRef.charInput).toBe('火')
  })

  it('does not add history to phonetic comparison', async () => {
    localStorage.setItem('recent-query:v1:compare:tab5', JSON.stringify({ version: 1, entries: [{ snapshot: {}, summary: 'excluded' }] }))
    await mount(ComparePage, 'phonetic')
    expect(document.querySelector('.pill-btn--history')).toBeNull()
    expect(document.querySelector('.existing-quick-start')).not.toBeNull()
  })
})
