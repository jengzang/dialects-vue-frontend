import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, reactive, ref } from 'vue'

const mocks = vi.hoisted(() => ({ matrix: vi.fn(), custom: vi.fn(), replace: vi.fn(), setQuery: vi.fn(), route: null, url: {} }))
vi.mock('@/api', () => ({ getPhonologyMatrix: mocks.matrix, getPhonologyClassificationMatrix: mocks.custom }))
vi.mock('vue-router', () => ({ useRoute: () => mocks.route, useRouter: () => ({ replace: mocks.replace }) }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: key => key }) }))
vi.mock('@/composables/router/useRouteQueryState.js', () => ({ useRouteQueryState: (key, options) => ({
  state: ref(mocks.url[key] ?? options.defaultValue), set: mocks.setQuery, applyToQuery: vi.fn(),
}) }))
vi.mock('@/main/components/geo/LocationMultiInput.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/main/components/TableAndTree/PhonologyTable.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/main/components/pho/HomophoneLexicon.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/selector/SimpleSelectDropdown.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/selector/RadioGroup.vue', () => ({ default: { template: '<div />' } }))

import MatrixPage from '../src/main/components/pho/PhonologyPage.vue'
import CustomPage from '../src/main/components/pho/PhonologyCustom.vue'
import { preferredCharacterTable } from '../src/main/store/store.js'

let app
let vm
const settle = async () => { for (let i = 0; i < 5; i++) await nextTick() }
async function mount(page) {
  app = createApp(page)
  app.config.globalProperties.$t = key => key
  app.mount(document.body.appendChild(document.createElement('div')))
  vm = app._instance.setupState
  await settle()
}
beforeEach(() => {
  localStorage.clear()
  preferredCharacterTable.value = 'characters'
  mocks.url = {}
  mocks.route = reactive({ query: {}, params: { locale: 'zh-CN' } })
  vi.clearAllMocks()
  mocks.matrix.mockResolvedValue({ data: {} })
  mocks.custom.mockResolvedValue({ data: { locations: [], matrix: {} } })
  mocks.replace.mockResolvedValue()
})
afterEach(() => { app?.unmount(); app = null; document.body.innerHTML = '' })

describe('phonology history', () => {
  it.each([['matrix', MatrixPage], ['custom', CustomPage]])('records submitted %s conditions and restores inputs without a query', async (context, page) => {
    await mount(page)
    await vm.loadData()
    expect(localStorage.getItem(`recent-query:v1:pho:${context}`)).toBeNull()
    vm.queryStrings = ['廣州']
    vm.matchedLocations = ['廣州']
    if (context === 'custom') {
      vm.selectedFeatureChinese = '韻母'
      await settle()
      vm.horizontalColumnChinese = '呼'
      vm.verticalColumnChinese = '韻'
      vm.cellRowColumnChinese = '母'
    }
    await settle()
    document.querySelector('.action-btn').click()
    await settle()
    const saved = JSON.parse(localStorage.getItem(`recent-query:v1:pho:${context}`))
    expect(saved?.entries).toHaveLength(1)
    vm.queryStrings = ['北京']
    vm.matchedLocations = ['北京']
    if (context === 'custom') {
      vm.selectedFeatureChinese = '聲調'
      preferredCharacterTable.value = 'fenyun'
    } else {
      vm.pendingUrlAutoQuery = true
      vm.pendingUrlMatchAttempted = true
    }
    await settle()
    vi.clearAllMocks()
    document.querySelector('.pill-btn--history')?.click()
    await settle()
    expect(vm.queryStrings).toEqual(['廣州'])
    if (context === 'custom') {
      expect(preferredCharacterTable.value).toBe('characters')
      expect(vm.selectedFeatureChinese).toBe('韻母')
      expect(vm.horizontalColumnChinese).toBe('呼')
      expect(vm.verticalColumnChinese).toBe('韻')
      expect(vm.cellRowColumnChinese).toBe('母')
    }
    vm.handleMatchedLocations(['廣州'])
    await settle()
    expect(mocks.matrix).not.toHaveBeenCalled()
    expect(mocks.custom).not.toHaveBeenCalled()
    expect(mocks.replace).not.toHaveBeenCalled()
    expect(mocks.setQuery).not.toHaveBeenCalled()
    expect(JSON.parse(localStorage.getItem(`recent-query:v1:pho:${context}`))).toEqual(saved)
    expect(document.querySelector('.location-quick-fill')).not.toBeNull()
  })

  it('does not record automatic matrix queries from the URL', async () => {
    mocks.url = { mloc: ['廣州'] }
    await mount(MatrixPage)
    vm.handleMatchedLocations(['廣州'])
    await settle()
    expect(mocks.matrix).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('recent-query:v1:pho:matrix')).toBeNull()
  })

  it('does not trigger the pending initial custom query after restoring history', async () => {
    mocks.url = { cloc: ['北京'], feature: '聲母', h: '清濁', v: '部位', c: '母' }
    localStorage.setItem('recent-query:v1:pho:custom', JSON.stringify({ version: 1, entries: [{
      summary: '廣州', snapshot: { locations: ['廣州'], table_name: 'characters', feature: '韻母', horizontal_column: '呼', vertical_column: '韻', cell_row_column: '母' },
    }] }))
    await mount(CustomPage)
    document.querySelector('.pill-btn--history')?.click()
    await settle()
    vm.handleMatchedLocations(['廣州'])
    await settle()
    expect(vm.queryStrings).toEqual(['廣州'])
    expect(mocks.custom).not.toHaveBeenCalled()
  })

  it('can restore a supported custom table when the current table is unsupported', async () => {
    preferredCharacterTable.value = 'unsupported'
    localStorage.setItem('recent-query:v1:pho:custom', JSON.stringify({ version: 1, entries: [{
      summary: '廣州', snapshot: { locations: ['廣州'], table_name: 'characters', feature: '韻母', horizontal_column: '呼', vertical_column: '韻', cell_row_column: '母' },
    }] }))
    await mount(CustomPage)
    document.querySelector('.pill-btn--history')?.click()
    await settle()
    expect(preferredCharacterTable.value).toBe('characters')
    expect(vm.queryStrings).toEqual(['廣州'])
    expect(mocks.custom).not.toHaveBeenCalled()
  })

  it.each([['matrix', MatrixPage], ['custom', CustomPage]])('keeps resolved locations when restoring %s history for the same input', async (context, page) => {
    await mount(page)
    vm.queryStrings = ['廣州']
    vm.matchedLocations = ['廣州']
    await settle()
    document.querySelector('.action-btn').click()
    await settle()
    document.querySelector('.pill-btn--history')?.click()
    await settle()
    expect(vm.matchedLocations).toEqual(['廣州'])
    expect(document.querySelector('.action-btn').disabled).toBe(false)
  })
})
