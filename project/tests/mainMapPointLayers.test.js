import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, KeepAlive, nextTick, reactive, ref } from 'vue'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: key => key }) }))
vi.mock('vue-router', () => ({ useRouter: () => ({}), useRoute: () => ({}) }))
vi.mock('@/main/store/store.js', () => ({
  mapStore: reactive({}), userStore: reactive({ role: 'user' }), resultCache: reactive({}),
}))
vi.mock('@/api', () => ({ getLocationDetail: vi.fn(async () => ({})), batchDeleteCustomDataById: vi.fn() }))
vi.mock('@/api/auth/httpClient.js', () => ({ api: vi.fn() }))
vi.mock('@/utils/map/MapData.js', () => ({ refreshCurrentCustomLayer: vi.fn() }))
vi.mock('@/main/utils/query/ResultTable.js', () => ({ get_detail: vi.fn() }))
vi.mock('@/utils/ui/message.js', () => ({ showSuccess: vi.fn(), showError: vi.fn(), showWarning: vi.fn(), showConfirm: vi.fn() }))
const deleteItem = vi.hoisted(() => vi.fn(async () => null))
vi.mock('@/utils/user/customPopupDelete.js', () => ({ createCustomPopupDelete: () => ({ deleteItem }) }))
vi.mock('@/utils/map/MapSource.js', () => ({
  mapStyleConfig: { test: 'Test' }, mapStyle: () => ({ version: 8, sources: {}, layers: [] }),
  calculateMapCenterAndZoom: () => ({ center: [113, 23], zoom: 8 }),
}))
vi.mock('@/platform/backRegistry.js', () => ({ trackNativeMapPopup: popup => popup, vNativeBack: {} }))
vi.mock('@/main/components/geo/popups/LocationDetailPopup.vue', () => ({ default: { template: '<div />' } }))
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
      this.canvasContainer = document.createElement('div')
      document.body.append(this.canvasContainer)
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
    getCanvasContainer() { return this.canvasContainer }
    getCenter() { return { lng: 113, lat: 23 } }
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
    isSourceLoaded() { return true }
    triggerRepaint() { this.emit('render') }
    remove() { this.removed = true; this.canvasContainer.remove() }
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
import { getLocationDetail } from '@/api'
import { get_detail } from '@/main/utils/query/ResultTable.js'

const mounted = []

async function mountMap(props = {}) {
  const host = document.createElement('div'); document.body.append(host)
  const app = createApp({ render: () => h(MapLibre, props) })
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
  vi.stubGlobal('requestAnimationFrame', callback => { callback(); return 0 })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  Object.assign(mapStore, { mode: 'dot', mapData: null, mergedData: [], isoplethPayload: null, showCustomData: false, adminBoundary: null, fitViewKey: 0, divideMapView: false })
  maps.length = 0; popups.length = 0; markers.length = 0
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    scale() {}, beginPath() {}, arc() {}, fill() {}, stroke() {}, roundRect() {},
    measureText: vi.fn(() => ({ width: 20 })), fillText: vi.fn(),
    clearRect() {}, fillRect() {}, getImageData: (_x, _y, width, height) => ({ width, height, data: new Uint8ClampedArray(4) }),
  })
})
afterEach(() => {
  mounted.splice(0).forEach(({ app, host }) => { app.unmount(); host.remove() })
  vi.restoreAllMocks()
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('main map point layers', () => {
  it('paints loading before preparing a switched mode and keeps it until its source renders', async () => {
    const map = await mountMap()
    const frames = []
    vi.stubGlobal('requestAnimationFrame', callback => { frames.push(callback); return frames.length })
    vi.spyOn(map, 'triggerRepaint').mockImplementation(() => {})
    const loaded = vi.spyOn(map, 'isSourceLoaded').mockReturnValue(false)
    mapStore.mapData = { coordinates_locations: [['广州', [113, 23]]] }
    mapStore.mode = 'base'; await nextTick()
    const host = mounted.at(-1).host
    expect(host.querySelector('.loading-overlay')).not.toBeNull()
    expect(pointFeatures(map)).toHaveLength(0)
    frames.shift()(); await nextTick()
    expect(pointFeatures(map)).toHaveLength(0)
    frames.shift()(); await nextTick()
    expect(pointFeatures(map)).toHaveLength(1)
    map.emit('render'); await nextTick()
    expect(host.querySelector('.loading-overlay')).not.toBeNull()
    map.emit('error', { sourceId: 'basemap' }); await nextTick()
    expect(host.querySelector('.loading-overlay')).not.toBeNull()
    loaded.mockReturnValue(true); map.emit('render'); await nextTick()
    expect(host.querySelector('.loading-overlay')).toBeNull()
    expect(map.handlers.filter(handler => ['render', 'error'].includes(handler.type))).toHaveLength(0)
  })

  it('keeps style-switch loading while query data changes and draws the latest data after style.load', async () => {
    const map = await mountMap()
    const host = mounted.at(-1).host
    map.component.handleStyleChange(); await nextTick()
    expect(host.querySelector('.loading-overlay')).not.toBeNull()
    mapStore.mode = 'base'
    mapStore.mapData = { coordinates_locations: [['广州', [113, 23]]] }
    await nextTick()
    expect(host.querySelector('.loading-overlay')).not.toBeNull()
    map.emit('style.load'); await nextTick()
    expect(pointFeatures(map)).toHaveLength(1)
    expect(host.querySelector('.loading-overlay')).toBeNull()
  })

  it('cancels an obsolete switch and removes pending loading on unmount', async () => {
    const map = await mountMap()
    const frames = []
    vi.stubGlobal('requestAnimationFrame', callback => { frames.push(callback); return frames.length })
    mapStore.mapData = { coordinates_locations: [['广州', [113, 23]]] }
    mapStore.mode = 'base'; await nextTick()
    mapStore.mode = 'heatmap'; await nextTick()
    while (frames.length) frames.shift()()
    await nextTick()
    expect(map.getLayer('map-points-layer')).toBeUndefined()
    mapStore.mode = 'base'; await nextTick()
    const { app, host } = mounted.pop(); app.unmount(); host.remove()
    while (frames.length) frames.shift()()
    expect(map.images.size).toBe(0)
    expect(map.handlers.filter(handler => ['render', 'error'].includes(handler.type))).toHaveLength(0)
  })

  it('defers query redraws while cached and draws the latest feature on reactivation', async () => {
    const visible = ref(true)
    const props = reactive({ activeFeature: '旧中古' })
    mapStore.mode = 'feature'
    mapStore.mergedData = [{ location: '广州', feature: '旧中古', value: 'b', coordinate: [113, 23] }]
    const cachedPage = { render: () => h(MapLibre, props) }
    const host = document.createElement('div'); document.body.append(host)
    const app = createApp({ render: () => h(KeepAlive, null, { default: () => visible.value ? h(cachedPage) : null }) })
    app.mount(host); mounted.push({ app, host })
    const map = maps.at(-1); map.emit('load'); await nextTick()
    hit(map, 0)
    const oldPopup = popups.at(-1)
    const frames = []
    vi.stubGlobal('requestAnimationFrame', callback => { frames.push(callback); return frames.length })
    mapStore.showCustomData = true; await nextTick()
    visible.value = false; await nextTick()
    expect(oldPopup.open).toBe(false)
    expect(oldPopup.node.childNodes).toHaveLength(0)
    vi.stubGlobal('requestAnimationFrame', callback => { callback(); return 0 })
    while (frames.length) frames.shift()()
    const addSource = vi.spyOn(map, 'addSource')
    mapStore.mode = 'feature'
    props.activeFeature = '中古'
    mapStore.mergedData = [{ location: '广州', feature: '中古', value: 'a', coordinate: [113, 23], color: '#ff0' }]
    await nextTick()
    expect(addSource).not.toHaveBeenCalled()
    expect(oldPopup.open).toBe(false)
    expect(oldPopup.node.childNodes).toHaveLength(0)
    visible.value = true; await nextTick(); await nextTick()
    expect(pointFeatures(map).map(feature => feature.properties.label)).toEqual(['a'])
    expect(host.querySelector('#base-switch-container')).not.toBeNull()
  })

  it('restores the place-name switch after leaving a division map for a feature query', async () => {
    mapStore.divideMapView = true
    const map = await mountMap({ activeFeature: '中古' })
    mapStore.mode = 'feature'
    mapStore.mergedData = [{ location: '广州', feature: '中古', value: 'a', coordinate: [113, 23] }]
    await nextTick()
    const host = mounted.at(-1).host
    const toggle = host.querySelector('#base-switch-container input')
    expect(toggle).not.toBeNull()
    toggle.checked = true; toggle.dispatchEvent(new Event('change', { bubbles: true })); await nextTick()
    expect(mapStore.mode).toBe('base')
    expect(host.querySelector('#base-switch-container')).not.toBeNull()
    toggle.checked = false; toggle.dispatchEvent(new Event('change', { bubbles: true })); await nextTick()
    expect(mapStore.mode).toBe('feature')
    expect(pointFeatures(map)).toHaveLength(1)
  })

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

  it('preserves base coordinate deduplication, location font sizes and custom visibility without DOM markers', async () => {
    mapStore.mode = 'base'
    mapStore.mapData = { coordinates_locations: [
      ['广州', [113, 23]], ['重复', [113.0000001, 23]], ['四字地名', [114, 24]], ['五个字地名', [115, 25]],
      ['六个字的地名', [116, 26]], ['空', null], ['   ', [117, 27]],
    ] }
    mapStore.mergedData = [
      { location: '个人', coordinate: [118, 28], iscustoms: 1 },
      { location: '重复个人', coordinate: [118, 28], iscustoms: 1 },
      { location: '已有基础', coordinate: [113, 23], iscustoms: 1 },
    ]
    const map = await mountMap()
    expect(markers).toHaveLength(0)
    expect(pointFeatures(map).map(feature => feature.properties.label)).toEqual(['广州', '四字地名', '五个字地名', '六个字的地名'])
    expect(pointFeatures(map).map(feature => feature.properties.fontSize)).toEqual([12.5, 11.5, 10.5, 10])
    expect(map.images.size).toBe(4)
    hit(map, 0)
    expect(getLocationDetail).toHaveBeenCalledWith('广州')
    expect(popups).toHaveLength(0)
    mapStore.showCustomData = true; await nextTick()
    expect(pointFeatures(map).map(feature => feature.properties.label)).toEqual(['广州', '四字地名', '五个字地名', '六个字的地名', '个人'])
  })

  it('draws each base label and its background together, reusing repeated place names', async () => {
    mapStore.mode = 'base'
    mapStore.mapData = { coordinates_locations: [
      ['广州', [113, 23]], ['广州', [114, 24]], ['英德英城', [115, 25]],
    ] }
    const map = await mountMap()
    expect(pointFeatures(map).map(feature => feature.properties.renderText)).toEqual(['', '', ''])
    const images = pointFeatures(map).map(feature => feature.properties.image)
    expect(images[0]).toBe(images[1])
    expect(images[2]).not.toBe(images[0])
    expect(map.images.size).toBe(2)
    const context = HTMLCanvasElement.prototype.getContext.mock.results[0].value
    expect(context.fillText.mock.calls.map(call => call[0])).toEqual(['广州', '英德英城'])
    expect(map.getLayer('map-points-layer').layout['symbol-sort-key']).toEqual(['get', 'index'])
  })

  it('keeps feature filters, text, color reuse, percentage details and the original detail action', async () => {
    mapStore.mode = 'feature'
    mapStore.mergedData = [
      { location: '甲', feature: '声母', value: 'tɕʰ ŋ̍ 中文', color: '#ff0', coordinate: [113, 23], detailContent: [{ value: 'a', percentage: 0.7 }] },
      { location: '乙', feature: '声母', value: 'ɐ', color: '#ff0', coordinate: [113, 23] },
      { location: '个人', feature: '声母', value: 'a', color: '#0ff', coordinate: [115, 24], iscustoms: 1 },
      { location: '其他', feature: '韵母', value: 'b', coordinate: [116, 25] },
      { location: '空', feature: '声母', value: ' ', coordinate: [116, 25] },
      { location: '坏点', feature: '声母', value: 'b', coordinate: [NaN, 25] },
    ]
    const props = reactive({ activeFeature: '声母' })
    const map = await mountMap(props)
    expect(markers).toHaveLength(0)
    expect(popups).toHaveLength(0)
    expect(pointFeatures(map).map(feature => feature.properties.label)).toEqual(['tɕʰ ŋ̍ 中文', 'ɐ'])
    expect(map.images.size).toBe(2)
    hit(map, 0)
    const popup = popups.at(-1)
    expect(popup.options.offset).toBe(80)
    expect(popup.node.textContent).toContain('70.0%')
    popup.node.querySelector('button').click()
    expect(get_detail).toHaveBeenCalledWith('甲', '声母', false, true)
    props.activeFeature = '韵母'; await nextTick()
    expect(popup.open).toBe(false)
    expect(pointFeatures(map).map(feature => feature.properties.label)).toEqual(['b'])
    props.activeFeature = ''; await nextTick()
    expect(pointFeatures(map)).toHaveLength(0)
  })

  it('preserves the custom feature delete action and closes/unmounts the active popup on component removal', async () => {
    mapStore.mode = 'feature'; mapStore.showCustomData = true
    const item = { location: '个人', feature: '声母', value: 'a', coordinate: [113, 23], iscustoms: 1, notes: '原始备注 📝' }
    mapStore.mergedData = [item]
    const map = await mountMap({ activeFeature: '声母', isCustom: true })
    expect(popups).toHaveLength(0)
    hit(map, 0)
    const popup = popups.at(-1)
    popup.node.querySelector('button').click()
    expect(deleteItem).toHaveBeenCalledWith(item)
    const { app, host } = mounted.pop(); app.unmount(); host.remove()
    expect(popup.open).toBe(false)
    expect(popup.node.childNodes).toHaveLength(0)
    expect(map.removed).toBe(true)
    expect(map.images.size).toBe(0)
    expect(map.handlers.filter(entry => entry.layer === 'map-points-layer')).toHaveLength(0)
  })

  it('keeps keyboard point traversal and Enter/Space popup activation with one reusable focus target', async () => {
    mapStore.mode = 'compare'
    mapStore.mergedData = ['甲', '乙', '丙'].map(location => ({ location, coordinate: [113, 23], color: '#f00' }))
    const map = await mountMap()
    const target = map.getCanvasContainer().querySelector('.map-point-keyboard-target')
    expect(target).not.toBeNull()
    expect(map.getCanvasContainer().querySelectorAll('button')).toHaveLength(1)
    target.focus()
    target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    expect(popups.at(-1).node.textContent).toContain('甲')
    target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }))
    expect(target.getAttribute('aria-label')).toContain('乙')
    target.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }))
    expect(popups.at(-1).node.textContent).toContain('乙')
    target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }))
    expect(target.getAttribute('aria-label')).toContain('甲')
    mapStore.mode = 'heatmap'; await nextTick()
    expect(map.getCanvasContainer().querySelectorAll('button')).toHaveLength(0)
    expect(map.handlers.filter(entry => entry.type === 'move')).toHaveLength(0)
  })

  it('renders complete combining-mark labels once per distinct text and rejects clicks in text shadow padding', async () => {
    mapStore.mode = 'feature'
    mapStore.mergedData = Array.from({ length: 1000 }, (_, index) => ({
      location: `地点${index}`, feature: '声母', value: 'ŋ̍a', coordinate: [113, 23], color: '#ffff99',
    }))
    const map = await mountMap({ activeFeature: '声母' })
    expect(pointFeatures(map)).toHaveLength(1000)
    expect(pointFeatures(map).every(feature => feature.properties.renderText === '')).toBe(true)
    expect(map.images.size).toBe(1)
    const context = HTMLCanvasElement.prototype.getContext.mock.results[0].value
    expect(context.fillText).toHaveBeenCalledTimes(1)
    expect(context.fillText.mock.calls[0][0]).toBe('ŋ̍a')
    map.emit('click', { features: pointFeatures(map), point: { x: 140, y: 23 }, lngLat: { lng: 140, lat: 23 } }, 'map-points-layer')
    expect(popups).toHaveLength(0)
    map.emit('click', { features: pointFeatures(map), point: { x: 113, y: 23 }, lngLat: { lng: 113, lat: 23 } }, 'map-points-layer')
    expect(popups.at(-1).node.textContent).toContain('地点999')
  })

  it('redraws feature labels on resize only when their computed font or pixel density changes', async () => {
    let fontSize = 16
    vi.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
      fontSize: `${fontSize}px`, fontFamily: 'Times New Roman', lineHeight: '20px', color: '#000',
      backgroundColor: 'transparent', borderRadius: '0', borderTopWidth: '0.7px', borderTopColor: '#000', paddingLeft: '4px', paddingTop: '2px',
    }))
    mapStore.mode = 'feature'
    mapStore.mergedData = [{ location: '甲', feature: '声母', value: 'a', coordinate: [113, 23] }]
    const map = await mountMap({ activeFeature: '声母' })
    const addSource = vi.spyOn(map, 'addSource')
    map.emit('resize'); await nextTick()
    expect(addSource).not.toHaveBeenCalled()
    fontSize = 20
    map.emit('resize'); await nextTick()
    expect(pointFeatures(map)[0].properties.fontSize).toBe(20)
  })

  it('preserves flag emoji as a single canvas label instead of two regional indicator glyphs', async () => {
    mapStore.mode = 'feature'
    mapStore.mergedData = [{ location: '甲', feature: '声母', value: '🇨🇳', coordinate: [113, 23] }]
    const map = await mountMap({ activeFeature: '声母' })
    expect(pointFeatures(map)[0].properties.renderText).toBe('')
  })

  it('bounds a very long combining label texture without truncating the displayed string', async () => {
    const context = HTMLCanvasElement.prototype.getContext.mock.results[0]?.value || document.createElement('canvas').getContext('2d')
    context.measureText.mockReturnValue({ width: 1e9 })
    mapStore.mode = 'feature'
    const label = 'ŋ̍'.repeat(2000)
    mapStore.mergedData = [{ location: '甲', feature: '声母', value: label, coordinate: [113, 23] }]
    const map = await mountMap({ activeFeature: '声母' })
    expect(pointFeatures(map)[0].properties.label).toBe(label)
    expect(context.fillText.mock.calls[0][0]).toBe(label)
    expect([...map.images.values()][0].options.pixelRatio).toBeLessThan(1)
    expect([...map.images.values()][0].image.width).toBeLessThanOrEqual(4096)
    expect([...map.images.values()][0].image.height).toBeGreaterThanOrEqual(1)
  })

  it('does not hit the transparent corners around a circular dot', async () => {
    mapStore.mapData = { coordinates_locations: [['甲', [113, 23]]], region_mappings: { 甲: '甲-乙-丙' } }
    const map = await mountMap()
    map.emit('click', { features: pointFeatures(map), point: { x: 119, y: 29 }, lngLat: { lng: 119, lat: 29 } }, 'map-points-layer')
    expect(popups).toHaveLength(0)
  })
})
