import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'

vi.mock('/data/gis/china_country.geojson?url', () => ({ default: '/country.geojson' }))
vi.mock('/data/gis/china_provinces.geojson?url', () => ({ default: '/provinces.geojson' }))
vi.mock('/data/gis/china_cities_simplified_balanced.geojson?url', () => ({ default: '/cities.geojson' }))
vi.mock('/data/gis/china_counties_simplified_light.geojson?url', () => ({ default: '/counties.geojson' }))

const maps = []
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: key => key }) }))
vi.mock('vue-router', () => ({ useRouter: () => ({}), useRoute: () => ({}) }))
vi.mock('@/components/common/AppModal.vue', () => ({ default: {
  setup: (_, { slots }) => () => h('div', [slots.default?.(), slots.footer?.()]),
} }))
vi.mock('maplibre-gl', () => ({ default: {
  Map: class {
    constructor() { this.sources = new Map(); this.layers = new Map(); this.events = {}; maps.push(this) }
    addControl() {}
    on(name, handler) { this.events[name] = handler }
    once(name, handler) { this.events[name] = handler }
    off() {}
    remove() {}
    flyTo() {}
    getSource(id) { return this.sources.get(id) }
    getLayer(id) { return this.layers.get(id) }
    addSource(id, source) { this.sources.set(id, source) }
    addLayer(layer) { this.layers.set(layer.id, layer) }
    removeLayer(id) { this.layers.delete(id) }
    removeSource(id) { this.sources.delete(id) }
    setStyle() { this.sources.clear(); this.layers.clear() }
  },
  NavigationControl: class {},
} }))
vi.mock('@/main/store/store.js', async () => {
  const { reactive } = await import('vue')
  return { mapStore: reactive({}), userStore: {}, resultCache: reactive({}) }
})
vi.mock('@/utils/map/MapSource.js', () => ({ mapStyle: () => ({}), mapStyleConfig: {}, calculateMapCenterAndZoom: () => ({}) }))
vi.mock('@/main/utils/query/ResultTable.js', () => ({ get_detail: vi.fn() }))
vi.mock('@/utils/map/MapData.js', () => ({ refreshCurrentCustomLayer: vi.fn() }))
vi.mock('@/api', () => ({ getLocationDetail: vi.fn(), batchDeleteCustomDataById: vi.fn() }))
vi.mock('@/api/auth/httpClient.js', () => ({ api: vi.fn() }))
vi.mock('@/utils/ui/message.js', () => ({ showSuccess: vi.fn(), showError: vi.fn(), showWarning: vi.fn(), showConfirm: vi.fn() }))
vi.mock('@/main/components/map/Draw/modals/AdminBoundaryModal.vue', () => ({ default: { render: () => null } }))
vi.mock('@/main/components/geo/popups/LocationDetailPopup.vue', () => ({ default: { render: () => null } }))

import MapLibre from '@/main/components/map/MapLibre.vue'
import { mapStore } from '@/main/store/store.js'

const boundary = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { name: '中国' }, geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [0, 1], [0, 0]]] } }] }
const sourceId = 'admin-boundary-source'
let mounted = []
function mountMap() {
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp(MapLibre)
  app.mount(host)
  const state = app._instance.setupState
  const map = maps.at(-1)
  map.events.load()
  const wrapper = { state, map, host, unmount: () => { app.unmount(); host.remove() } }
  mounted.push(wrapper)
  return wrapper
}

beforeEach(() => {
  Object.assign(mapStore, { mode: 'base', mapData: null, mergedData: [], isoplethPayload: null, adminBoundary: null, featureLabels: {} })
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => boundary })))
})
afterEach(() => { mounted.forEach(w => w.unmount()); mounted = []; vi.unstubAllGlobals() })

describe('administrative boundary overlay', () => {
  it('does not download static files on open and loads only the requested level', async () => {
    const w = mountMap()
    w.state.openAdminBoundaryModal()
    await nextTick()
    expect(fetch).not.toHaveBeenCalled()
    await w.state.ensureAdminBoundaryOptions('cities')
    expect(fetch).toHaveBeenCalledExactlyOnceWith('/cities.geojson')
    await w.state.ensureAdminBoundaryOptions('cities')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('loads the country on explicit request and reuses that geometry on confirm', async () => {
    const w = mountMap()
    w.state.openAdminBoundaryModal()
    expect(fetch).not.toHaveBeenCalled()
    await w.state.ensureAdminBoundaryOptions('country')
    expect(fetch).toHaveBeenCalledExactlyOnceWith('/country.geojson')
    await w.state.handleAdminBoundaryConfirm({ level: 'country', selectedNames: ['中国'] })
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(w.map.getSource(sourceId)?.data).toEqual(boundary)
  })
  it('offers the boundary control in every rendering mode', async () => {
    const w = mountMap()
    for (const mode of ['base', 'dot', 'heatmap', 'feature', 'compare', 'isopleth']) {
      mapStore.mode = mode
      await nextTick()
      expect(w.host.querySelector('.admin-boundary-btn'), mode).not.toBeNull()
    }
  })

  it('retains the selected geometry across data redraws, all modes, style changes and remounts', async () => {
    const w = mountMap()
    await w.state.handleAdminBoundaryConfirm({ level: 'country', selectedNames: ['中国'] })
    for (const mode of ['dot', 'heatmap', 'feature', 'compare', 'isopleth', 'base']) {
      mapStore.mode = mode
      mapStore.mapData = { coordinates_locations: [] }
      await nextTick()
      expect(w.map.getSource(sourceId)?.data, mode).toEqual(boundary)
    }
    w.state.handleStyleChange()
    w.map.events['style.load']()
    expect(w.map.getSource(sourceId)?.data).toEqual(boundary)
    mounted = mounted.filter(item => item !== w)
    w.unmount()
    const restored = mountMap()
    expect(restored.map.getSource(sourceId)?.data).toEqual(boundary)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('clears persisted geometry so redraws cannot restore it', async () => {
    const w = mountMap()
    await w.state.handleAdminBoundaryConfirm({ level: 'country', selectedNames: ['中国'] })
    w.state.handleAdminBoundaryClear()
    mapStore.mode = 'dot'
    await nextTick()
    expect(mapStore.adminBoundary).toBeNull()
    expect(w.map.getSource(sourceId)).toBeUndefined()
  })

  it('does not restore an in-flight selection after clearing', async () => {
    let finish
    fetch.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    const w = mountMap()
    const pending = w.state.handleAdminBoundaryConfirm({ level: 'country', selectedNames: ['中国'] })
    w.state.handleAdminBoundaryClear()
    finish({ ok: true, json: async () => boundary })
    await pending
    expect(mapStore.adminBoundary).toBeNull()
    expect(w.map.getSource(sourceId)).toBeUndefined()
  })

  it('restores boundaries selected while a new map style is loading', async () => {
    const w = mountMap()
    w.state.handleStyleChange()
    await w.state.handleAdminBoundaryConfirm({ level: 'country', selectedNames: ['中国'] })
    expect(w.map.getSource(sourceId)).toBeUndefined()
    w.map.events['style.load']()
    expect(w.map.getSource(sourceId)?.data).toEqual(boundary)
  })

  it('ignores an older boundary request that finishes after a newer selection', async () => {
    let finish
    fetch.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    const w = mountMap()
    const pending = w.state.handleAdminBoundaryConfirm({ level: 'country', selectedNames: ['中国'] })
    await w.state.handleAdminBoundaryConfirm({ level: 'provinces', selectedNames: ['中国'] })
    finish({ ok: true, json: async () => ({ ...boundary, features: [] }) })
    await pending
    expect(mapStore.adminBoundary.config.level).toBe('provinces')
    expect(w.map.getSource(sourceId)?.data).toEqual(boundary)
  })
})

describe('boundary modal clear control', () => {
  it('is opt-in and clears the overlay without confirming a new selection', async () => {
    const { default: Modal } = await vi.importActual('@/main/components/map/Draw/modals/AdminBoundaryModal.vue')
    const events = []
    const host = document.createElement('div')
    const app = createApp(Modal, {
      modelValue: true, mode: 'import',
      onClear: () => events.push('clear'),
      'onUpdate:modelValue': value => events.push(value),
      onConfirm: () => events.push('confirm'),
    })
    app.mount(host)
    mounted.push({ unmount: () => app.unmount() })
    const findClear = () => [...host.querySelectorAll('button')].find(b => b.textContent.includes('clearAdminBoundary'))
    expect(findClear()).toBeUndefined()
    app._instance.props.clearable = true
    await nextTick()
    findClear().click()
    expect(events).toEqual(['clear', false])
  })
})
