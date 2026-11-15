import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, reactive, ref } from 'vue'

const { maps, markers } = vi.hoisted(() => ({ maps: [], markers: [] }))
const partition = vi.hoisted(() => ({ load: vi.fn(), get: vi.fn(), version: { value: 0 } }))
vi.mock('@/composables/data/usePartitionColors.js', () => ({
  usePartitionColors: () => ({ loadPartitionColors: partition.load, getPartitionColor: partition.get, colorVersion: ref(0) }),
}))
vi.mock('@/main/store/store.js', () => ({ userStore: reactive({ role: 'anonymous', id: null }) }))
vi.mock('@/utils/map/MapSource.js', () => ({ mapStyle: () => ({ version: 8, sources: {}, layers: [] }) }))
vi.mock('maplibre-gl', () => {
  class Map {
    constructor() { this.sources = {}; this.layers = {}; this.images = {}; this.handlers = {}; maps.push(this) }
    once(type, callback) { this.handlers[type] = callback }
    load() { this.handlers.load() }
    addSource(id, source) { this.sources[id] = source }
    getSource(id) { return this.sources[id] }
    removeSource(id) { delete this.sources[id] }
    addLayer(layer) { this.layers[layer.id] = layer }
    getLayer(id) { return this.layers[id] }
    removeLayer(id) { delete this.layers[id] }
    addImage(id, image, options) { this.images[id] = { image, options } }
    hasImage(id) { return id in this.images }
    removeImage(id) { delete this.images[id] }
    fitBounds = vi.fn()
    resize = vi.fn()
    remove = vi.fn()
  }
  class Marker {
    constructor() { markers.push(this) }
    setLngLat() { return this }
    addTo() { return this }
    remove() {}
  }
  class LngLatBounds {
    coordinates = []
    extend(coordinate) { this.coordinates.push(coordinate) }
    isEmpty() { return !this.coordinates.length }
  }
  return { default: { Map, Marker, LngLatBounds } }
})

import DialectPointMap from '@/main/components/map/DialectPointMap.vue'

let app, host, state, context
const points = [
  { longitude: 113, latitude: 23, locationName: '广州', entryCount: 12345, yindianRegion: '粤语' },
  { longitude: 113, latitude: 23, locationName: 'ŋ̍ 中文', entryCount: 12, yindianRegion: '客家话' },
]
function mount(props = {}) {
  host = document.createElement('div'); document.body.append(host)
  state = reactive({ points: [...points], ...props })
  app = createApp({ render: () => h(DialectPointMap, state) }); app.mount(host)
  return maps[0]
}
function features(map) { return Object.values(map.sources)[0]?.data.features || [] }

beforeEach(() => {
  maps.length = 0; markers.length = 0
  partition.load.mockReset().mockResolvedValue(undefined)
  partition.get.mockReset()
  context = {
    scale() {}, beginPath() {}, roundRect() {}, fillRect: vi.fn(function () { this.fillColors.push(this.fillStyle) }), stroke() {}, fillColors: [],
    measureText: vi.fn(text => ({ width: text.length * 8 })),
    fillText: vi.fn(), drawImage: vi.fn(),
    getImageData: vi.fn((x, y, width, height) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) })),
  }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => context)
})
afterEach(() => { app?.unmount(); host?.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('homepage dialect map', () => {
  it('loads yindian colors and redraws using the configured partition color', async () => {
    let finish
    partition.load.mockReturnValue(new Promise(resolve => { finish = resolve }))
    partition.get.mockImplementation((_mode, _identity, path) => path === '粤语' ? '#123456' : undefined)
    const map = mount(); map.load()
    const fits = map.fitBounds.mock.calls.length
    expect(partition.load).toHaveBeenCalledWith('yindian', JSON.stringify(['anonymous', null]))
    context.fillText.mockClear()
    finish(); await Promise.resolve(); await nextTick()
    expect(partition.get).toHaveBeenCalledWith('yindian', JSON.stringify(['anonymous', null]), '粤语')
    expect(context.fillColors).toContain('#123456')
    expect(context.fillText).toHaveBeenCalled()
    expect(map.fitBounds).toHaveBeenCalledTimes(fits)
  })
  it('keeps every coincident point with no collision hiding, filtering or DOM markers', () => {
    const map = mount({ points: Array.from({ length: 3000 }, (_, i) => ({ ...points[i % 2], locationName: '地点' + i })) })
    map.load()
    expect(markers).toHaveLength(0)
    expect(features(map)).toHaveLength(3000)
    expect(context.getImageData.mock.calls.length).toBeLessThan(30)
    const layout = Object.values(map.layers)[0].layout
    expect(layout).toMatchObject({
      'icon-allow-overlap': true, 'icon-ignore-placement': true,
      'symbol-sort-key': ['get', 'index'], 'symbol-z-order': 'source',
    })
    expect(layout['text-field']).toBeUndefined()
    expect(features(map).at(-1).properties).toMatchObject({ index: 2999, name: '地点2999', count: '12' })
  })

  it('draws each complete name and count into the same texture, including combining characters', () => {
    const map = mount(); map.load()
    expect(Object.keys(map.images)).toHaveLength(2)
    expect(context.fillText.mock.calls.map(call => call[0])).toEqual(['广州', '12345', 'ŋ̍ 中文', '12'])
    expect(context.drawImage).toHaveBeenCalledTimes(2)
    expect(features(map)[0].properties.image).not.toBe(features(map)[1].properties.image)
  })

  it('reuses identical whole labels but separates different counts and region colors', () => {
    const map = mount({ points: [points[0], points[0], { ...points[0], entryCount: 7 }, { ...points[0], yindianRegion: '闽语' }] })
    map.load()
    const ids = features(map).map(f => f.properties.image)
    expect(ids[0]).toBe(ids[1])
    expect(new Set(ids).size).toBe(3)
    expect(Object.keys(map.images)).toHaveLength(3)
  })

  it('bounds texture memory while retaining every unique label', () => {
    vi.stubGlobal('devicePixelRatio', 3)
    const map = mount({ points: Array.from({ length: 3000 }, (_, i) => ({ ...points[0], locationName: '较长地名' + i, entryCount: i })) })
    map.load()
    expect(features(map)).toHaveLength(3000)
    expect(Object.keys(map.images)).toHaveLength(3000)
    const pixels = Object.values(map.images).reduce((total, { image }) => total + image.width * image.height, 0)
    expect(pixels).toBeLessThan(16 * 1024 * 1024 * 1.05)
    expect(Object.values(map.images).every(({ image }) => image.width <= 4096 && image.height <= 4096)).toBe(true)
  })

  it('waits for load and renders the latest data that arrived beforehand', async () => {
    const map = mount()
    state.points = [points[1]]; await nextTick()
    expect(Object.keys(map.sources)).toHaveLength(0)
    map.load()
    expect(features(map).map(f => f.properties.name)).toEqual(['ŋ̍ 中文'])
  })

  it('updates nested data and clears obsolete images without recreating the map', async () => {
    const map = mount(); map.load()
    state.points[0].entryCount = 99; await nextTick()
    expect(features(map)[0].properties.count).toBe('99')
    state.points = []; await nextTick()
    expect(features(map)).toEqual([])
    expect(Object.keys(map.images)).toHaveLength(0)
    expect(maps).toHaveLength(1)
  })

  it('keeps original nowrap whitespace handling', () => {
    const map = mount({ points: [{ ...points[0], locationName: ' \t广州\n 城区\t甲  ' }] }); map.load()
    expect(features(map)[0].properties.name).toBe('广州 城区 甲')
    expect(context.fillText.mock.calls[0][0]).toBe('广州 城区 甲')
  })

  it('keeps finite-coordinate conversion and ignores nonfinite values', () => {
    const map = mount({ points: [...points, { ...points[0], longitude: NaN }, { ...points[0], latitude: Infinity }, { ...points[0], longitude: '114' }] })
    map.load()
    expect(features(map)).toHaveLength(3)
    expect(features(map).at(-1).geometry.coordinates).toEqual([114, 23])
  })

  it('resizes fullscreen without resetting the view and disposes the map', async () => {
    const map = mount(); map.load()
    const fits = map.fitBounds.mock.calls.length
    state.fullscreen = true; await nextTick(); await nextTick()
    state.fullscreen = false; await nextTick(); await nextTick()
    expect(map.resize).toHaveBeenCalledTimes(2)
    expect(map.fitBounds).toHaveBeenCalledTimes(fits)
    app.unmount(); app = null
    expect(map.remove).toHaveBeenCalledTimes(1)
  })
})
