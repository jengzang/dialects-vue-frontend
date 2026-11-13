import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, reactive } from 'vue'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: key => key }) }))
vi.mock('@/main/store/store.js', () => ({
  mapStore: reactive({}), userStore: reactive({ role: 'user' }), resultCache: reactive({}),
}))
vi.mock('@/api', () => ({ getLocationDetail: vi.fn(async () => ({})), batchDeleteCustomDataById: vi.fn() }))
vi.mock('@/api/auth/httpClient.js', () => ({ api: vi.fn() }))
vi.mock('@/utils/map/MapData.js', () => ({ refreshCurrentCustomLayer: vi.fn() }))
vi.mock('@/main/utils/query/ResultTable.js', () => ({ get_detail: vi.fn() }))
vi.mock('@/utils/ui/message.js', () => ({ showSuccess: vi.fn(), showError: vi.fn(), showWarning: vi.fn(), showConfirm: vi.fn() }))
vi.mock('@/utils/user/customPopupDelete.js', () => ({ createCustomPopupDelete: () => ({ deleteOne: vi.fn() }) }))
vi.mock('@/utils/map/MapSource.js', () => ({
  mapStyleConfig: { test: 'Test' }, mapStyle: () => ({ version: 8, sources: {}, layers: [] }),
  calculateMapCenterAndZoom: () => ({ center: [113, 23], zoom: 8 }),
}))
vi.mock('@/platform/backRegistry.js', () => ({ trackNativeMapPopup: popup => popup }))
vi.mock('/data/gis/china_country.geojson?url', () => ({ default: '/country.geojson' }))
vi.mock('/data/gis/china_provinces.geojson?url', () => ({ default: '/provinces.geojson' }))
vi.mock('/data/gis/china_cities_simplified_balanced.geojson?url', () => ({ default: '/cities.geojson' }))
vi.mock('/data/gis/china_counties_simplified_light.geojson?url', () => ({ default: '/counties.geojson' }))

const maps = []
const popups = []
const markers = []
vi.mock('maplibre-gl', () => {
  class MockMap {
    constructor() {
      this.sources = new Map(); this.layers = new Map(); this.images = new Map(); this.handlers = []
      this.canvas = { style: {} }
      maps.push(this)
    }
    on(type, layer, handler) {
      this.handlers.push({ type, layer: typeof layer === 'string' ? layer : null, handler: handler || layer })
      return this
    }
    once(type, handler) { const once = event => { this.off(type, once); handler(event) }; return this.on(type, once) }
    off(type, layer, handler) {
      this.handlers = this.handlers.filter(entry => !(entry.type === type && entry.layer === (typeof layer === 'string' ? layer : null) && entry.handler === (handler || layer)))
    }
    emit(type, event = {}, layer = null) {
      for (const entry of [...this.handlers]) if (entry.type === type && entry.layer === layer) entry.handler(event)
    }
    addControl() {}
    getCanvas() { return this.canvas }
    project(coordinate) { return { x: coordinate[0], y: coordinate[1] } }
    addSource(id, source) { this.sources.set(id, { ...source, setData: data => { this.sources.get(id).data = data } }) }
    getSource(id) { return this.sources.get(id) }
    removeSource(id) {
      if ([...this.layers.values()].some(layer => layer.source === id)) throw Error('Source still in use')
      this.sources.delete(id)
    }
    addLayer(layer, before) {
      const layers = [...this.layers.entries()]
      const index = layers.findIndex(([id]) => id === before)
      if (index < 0) this.layers.set(layer.id, layer)
      else { layers.splice(index, 0, [layer.id, layer]); this.layers = new Map(layers) }
    }
    getLayer(id) { return this.layers.get(id) }
    removeLayer(id) { this.layers.delete(id) }
    addImage(id, image, options) { this.images.set(id, { image, options }) }
    hasImage(id) { return this.images.has(id) }
    removeImage(id) { this.images.delete(id) }
    setLayoutProperty(id, name, value) { this.layers.get(id).layout[name] = value }
    setPaintProperty(id, name, value) { this.layers.get(id).paint[name] = value }
    setFeatureState() {}
    setStyle() { this.sources.clear(); this.layers.clear(); this.images.clear() }
    flyTo() {}
    resize() {}
    remove() { this.removed = true }
  }
  class Popup {
    constructor(options) { this.options = options; this.handlers = []; this.open = false; popups.push(this) }
    on(type, handler) { this.handlers.push({ type, handler }); return this }
    once(type, handler) { return this.on(type, handler) }
    setLngLat(coordinate) { this.coordinate = coordinate; return this }
    setDOMContent(node) { this.node = node; return this }
    setHTML(html) { this.html = html; return this }
    addTo() { this.open = true; return this }
    isOpen() { return this.open }
    remove() { if (this.open) { this.open = false; this.handlers.filter(entry => entry.type === 'close').forEach(entry => entry.handler()) }; return this }
  }
  class Marker {
    constructor() { markers.push(this) }
    setLngLat() { return this }
    addTo() { return this }
    setPopup() { return this }
    remove() {}
  }
  return { default: { Map: MockMap, Popup, Marker, NavigationControl: class {} } }
})

import MapLibre from '@/main/components/map/MapLibre.vue'
import { mapStore } from '@/main/store/store.js'

const mounted = []
const passive = defineComponent({ template: '<div />' })
const comparePopup = defineComponent({ props: ['item'], template: '<div class="test-compare-popup">{{ item.location }}</div>' })
const stubs = {
  InlineIcon: passive, RadioGroup: passive, SimpleSelectDropdown: passive, CheckBox: passive,
  MapLegend: passive, LocationDetailPopup: passive, AdminBoundaryModal: passive,
  CompareMapPopup: comparePopup,
}

async function mountMap(props = {}) {
  const host = document.createElement('div'); document.body.append(host)
  // Popup render(h(...)) uses the real imported popup components; app stubs cover the main template only.
  const component = { ...MapLibre, components: { ...MapLibre.components, ...stubs } }
  const app = createApp({ render: () => h(component, props) })
  app.config.warnHandler = () => {}
  app.mount(host); mounted.push({ app, host })
  const map = maps.at(-1); map.emit('load'); await nextTick()
  map.component = app._instance.subTree.component.setupState
  return map
}

function pointFeatures(map) { return map.getSource('map-points-source')?.data.features || [] }
function hit(map, index, type = 'click', longitude = 113) {
  const feature = pointFeatures(map).find(feature => feature.properties.index === index)
  map.emit(type, { features: [feature], lngLat: { lng: longitude, lat: 23 }, originalEvent: {} }, 'map-points-layer')
}

beforeEach(() => {
  Object.assign(mapStore, { mode: 'dot', mapData: null, mergedData: [], isoplethPayload: null, showCustomData: false, adminBoundary: null, fitViewKey: 0 })
  maps.length = 0; popups.length = 0; markers.length = 0
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    scale() {}, beginPath() {}, arc() {}, fill() {}, stroke() {}, roundRect() {},
    clearRect() {}, fillRect() {}, getImageData: () => ({ width: 64, height: 64, data: new Uint8ClampedArray(64 * 64 * 4) }),
  })
})
afterEach(() => {
  mounted.splice(0).forEach(({ app, host }) => { app.unmount(); host.remove() })
  vi.restoreAllMocks()
})

describe('main map point layers', () => {
  it('renders thousands of dot points without DOM markers or eager popups, preserving level colors and duplicates', async () => {
    mapStore.mapData = {
      coordinates_locations: Array.from({ length: 2000 }, (_, index) => [`地点${index}`, [113, 23]]),
      region_mappings: Object.fromEntries(Array.from({ length: 2000 }, (_, index) => [`地点${index}`, index % 2 ? '甲-乙-丙' : '甲-丁-戊'])),
    }
    const map = await mountMap({ dotLevel: 2 })
    expect(markers).toHaveLength(0)
    expect(popups).toHaveLength(0)
    expect(pointFeatures(map)).toHaveLength(2000)
    expect(new Set(pointFeatures(map).map(feature => feature.properties.image)).size).toBe(2)
    expect(map.getLayer('map-points-layer').layout['icon-allow-overlap']).toBe(true)
    hit(map, 1999, 'mouseenter')
    expect(popups).toHaveLength(1)
    expect(popups[0].node.textContent).toContain('地点1999')
    map.emit('mouseleave', {}, 'map-points-layer')
    expect(popups[0].open).toBe(false)
    hit(map, 1999)
    expect(popups.at(-1).open).toBe(true)
  })

  it('mounts compare details on demand and releases them on close, rerender and unmount', async () => {
    mapStore.mode = 'compare'
    mapStore.mergedData = [
      { location: '甲', coordinate: [113, 23], color: '#f00', status: 'same' },
      { location: '乙', coordinate: [113, 23], color: '#00f', status: 'diff' },
      { location: '坏点', coordinate: [NaN, 23], color: '#000' },
    ]
    const map = await mountMap()
    expect(markers).toHaveLength(0)
    expect(popups).toHaveLength(0)
    expect(pointFeatures(map)).toHaveLength(2)
    hit(map, 1)
    const popup = popups.at(-1)
    expect(popup.node.textContent).toContain('乙')
    popup.remove()
    expect(popup.node.childNodes).toHaveLength(0)
    hit(map, 0)
    const second = popups.at(-1)
    mapStore.mergedData = []; await nextTick()
    expect(second.open).toBe(false)
    expect(second.node.childNodes).toHaveLength(0)
    expect(pointFeatures(map)).toHaveLength(0)
    expect(map.handlers.filter(entry => entry.layer === 'map-points-layer')).toHaveLength(0)
  })

  it('toggles the clicked popup, uses the clicked world copy, and restores a single set of interactions after style replacement', async () => {
    mapStore.mode = 'compare'
    mapStore.mergedData = [{ location: '甲', coordinate: [113, 23], color: '#f00', status: 'same' }]
    const map = await mountMap()
    expect(pointFeatures(map)).toHaveLength(1)
    hit(map, 0, 'click', -247)
    expect(popups.at(-1).coordinate[0]).toBe(-247)
    hit(map, 0)
    expect(popups.at(-1).open).toBe(false)
    const listenerCount = map.handlers.filter(entry => entry.layer === 'map-points-layer').length
    mapStore.mergedData = [...mapStore.mergedData]; await nextTick()
    expect(map.handlers.filter(entry => entry.layer === 'map-points-layer')).toHaveLength(listenerCount)
    hit(map, 0)
    const oldPopup = popups.at(-1)
    map.component.handleStyleChange()
    expect(oldPopup.open).toBe(false)
    expect(map.handlers.filter(entry => entry.layer === 'map-points-layer')).toHaveLength(0)
    map.emit('style.load'); await nextTick()
    expect(pointFeatures(map)).toHaveLength(1)
    expect(map.handlers.filter(entry => entry.layer === 'map-points-layer')).toHaveLength(listenerCount)
    hit(map, 0)
    expect(popups.at(-1).open).toBe(true)
    // Changing modes away from point rendering must remove all point handlers and images.
    mapStore.mode = 'heatmap'; await nextTick()
    expect(map.getSource('map-points-source')).toBeUndefined()
    expect(map.handlers.filter(entry => entry.layer === 'map-points-layer')).toHaveLength(0)
    expect(map.images.size).toBe(0)
  })

  it('ignores sprite padding and gives an already hovered compare point priority over later overlapping points', async () => {
    mapStore.mode = 'compare'
    mapStore.mergedData = [
      { location: '悬停点', coordinate: [100, 23], color: '#f00' },
      { location: '后绘制点', coordinate: [115, 23], color: '#00f' },
    ]
    const map = await mountMap()
    const features = pointFeatures(map)
    map.emit('click', { features, point: { x: 85, y: 23 }, lngLat: { lng: 85, lat: 23 } }, 'map-points-layer')
    expect(popups).toHaveLength(0)
    map.emit('mousemove', { features, point: { x: 100, y: 23 }, lngLat: { lng: 100, lat: 23 } }, 'map-points-layer')
    map.emit('click', { features, point: { x: 108, y: 23 }, lngLat: { lng: 108, lat: 23 } }, 'map-points-layer')
    expect(popups.at(-1).node.textContent).toContain('悬停点')
  })

  it('keeps administrative boundaries underneath point symbols', async () => {
    mapStore.mode = 'compare'
    mapStore.adminBoundary = { data: { type: 'FeatureCollection', features: [] } }
    mapStore.mergedData = [{ location: '甲', coordinate: [113, 23], color: '#f00' }]
    const map = await mountMap()
    const layers = [...map.layers.keys()]
    expect(layers.indexOf('admin-boundary-line-layer')).toBeLessThan(layers.indexOf('map-points-layer'))
  })
})
