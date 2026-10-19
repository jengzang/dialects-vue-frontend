import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, reactive } from 'vue'
import VocabularyViewPage from '../src/main/views/explore/word/vocabulary/VocabularyViewPage.vue'

const mocks = vi.hoisted(() => ({
  route: null,
  items: vi.fn(async () => ({ items: [], total: 0 })),
  notes: vi.fn(async () => ({ items: [], total: 0 })),
  points: vi.fn(async () => ({ points: [] })),
  words: vi.fn(async () => []),
  tableMount: vi.fn(),
}))
vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => ({ replace: async ({ query }) => { mocks.route.query = query } }),
}))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: key => key }) }))
vi.mock('@/api', () => ({
  getVocabularyItems: mocks.items,
  getVocabularyLocationOptions: async () => [],
  getVocabularyMapItems: mocks.points,
  getVocabularyMapPoints: mocks.points,
  getVocabularyStandardWords: mocks.words,
  getLocationDetail: vi.fn(),
  searchNotes: mocks.notes,
}))
vi.mock('@/main/components/TableAndTree/UniversalTable.vue', () => ({
  default: { setup() { mocks.tableMount(); return () => h('div', 'table') } },
}))
vi.mock('@/main/components/map/VocabularyMap.vue', () => ({ default: { render: () => null } }))
vi.mock('@/main/components/geo/popups/LocationDetailPopup.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/common/AppModal.vue', () => ({ default: {
  props: ['modelValue'],
  setup: props => () => props.modelValue ? h('div', { class: 'open-modal' }) : null,
} }))
vi.mock('../src/main/views/explore/word/vocabulary/VocabularyTopControls.vue', () => ({
  default: {
    props: ['source'],
    emits: ['search', 'refreshNotes', 'openLocationDetails', 'update:query', 'update:selectedLocations', 'update:viewMode'],
    setup(props, { emit }) {
      return () => h('div', [
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
const settle = async () => { for (let i = 0; i < 6; i++) await nextTick() }
async function mount(query = {}) {
  mocks.route = reactive({ path: '/explore/words/vocabulary', query })
  host = document.createElement('div')
  document.body.append(host)
  app = createApp(VocabularyViewPage)
  app.mixin({ mounted() { if (this.$options.__name === 'QuerySearchEntrance') entrance = this } })
  app.mount(host)
  await settle()
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
    return this.classList.contains('query-intro') ? { top: 180, height: 240 } : { top: 420, height: 140 }
  })
})
afterEach(() => { app?.unmount(); host?.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('vocabulary configuration entrance', () => {
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
    // Returning to the large panel suspends queries and removes results.
    entrance.$.exposed.progress.value = 0
    await settle()
    expect(host.querySelector('.content-area')).toBeNull()
    request.mockClear()
    host.querySelector('.filter').click()
    await new Promise(resolve => setTimeout(resolve, 850))
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
