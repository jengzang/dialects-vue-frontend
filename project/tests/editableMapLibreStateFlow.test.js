import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, nextTick, ref } from 'vue'

const drawInstances = []
const mapInstances = []

vi.mock('maplibre-gl', () => {
  class MockMap {
    constructor() {
      this.handlers = new Map()
      this.sources = new Map()
      this.layers = new Map()
      this.canvas = {
        style: {},
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 100,
          height: 100,
        }),
      }
      this.setStyle = vi.fn(() => {
        this.sources.clear()
        this.layers.clear()
      })
      this.queryRenderedFeatures = vi.fn(() => [])
      this.dragPan = {
        enabled: true,
        isEnabled: vi.fn(() => this.dragPan.enabled),
        disable: vi.fn(() => {
          this.dragPan.enabled = false
        }),
        enable: vi.fn(() => {
          this.dragPan.enabled = true
        }),
      }
      mapInstances.push(this)
    }

    addControl() {}
    remove() {}
    getCanvas() {
      return this.canvas
    }
    getCanvasContainer() {
      return {}
    }
    on(eventName, handler) {
      const handlers = this.handlers.get(eventName) ?? []
      handlers.push(handler)
      this.handlers.set(eventName, handlers)
      if (eventName === 'load') {
        handler()
      }
    }
    off() {}
    emit(eventName, payload) {
      ;(this.handlers.get(eventName) ?? []).forEach((handler) => handler(payload))
    }
    once(_eventName, handler) {
      handler()
    }
    triggerRepaint() {}
    getStyle() {
      return { layers: [] }
    }
    getLayer(layerId) {
      return this.layers.get(layerId) ?? false
    }
    addLayer(layer) {
      this.layers.set(layer.id, layer)
    }
    removeLayer(layerId) {
      this.layers.delete(layerId)
    }
    getSource(sourceId) {
      return this.sources.get(sourceId) ?? null
    }
    addSource(sourceId, source) {
      this.sources.set(sourceId, {
        ...source,
        setData: vi.fn((data) => {
          this.sources.get(sourceId).data = data
        }),
      })
    }
    removeSource(sourceId) {
      this.sources.delete(sourceId)
    }
    setLayoutProperty() {}
    flyTo() {}
    fitBounds() {}
    jumpTo() {}
    resize() {}
    getCenter() {
      return { toArray: () => [0, 0] }
    }
    getZoom() {
      return 0
    }
    getBearing() {
      return 0
    }
    getPitch() {
      return 0
    }
    project([longitude, latitude]) {
      return { x: longitude, y: latitude }
    }
  }

  return {
    default: {
      Map: MockMap,
      NavigationControl: class {},
      FullscreenControl: class {},
    },
  }
})

vi.mock('@mapbox/mapbox-gl-draw', () => ({
  default: class MockMapboxDraw {
    constructor(options = {}) {
      this.options = options
      this.features = new Map()
      this.selectedIds = []
      this.set = vi.fn((featureCollection) => {
        this.features = new Map((featureCollection.features ?? []).map((feature) => [String(feature.id), feature]))
      })
      this.changeMode = vi.fn((mode, options = {}) => {
        this.mode = mode
        this.modeOptions = options
        this.selectedIds = Array.isArray(options.featureIds) ? options.featureIds.map(String) : this.selectedIds
      })
      this.setFeatureProperty = vi.fn((featureId, key, value) => {
        const feature = this.get(featureId)
        if (feature) {
          feature.properties = {
            ...(feature.properties ?? {}),
            [key]: value,
          }
        }
      })
      this.getMode = vi.fn(() => this.mode || 'simple_select')
      this.trash = vi.fn(() => {
        const map = mapInstances.at(-1)
        map?.emit('draw.update')
        map?.emit('draw.delete')
      })
      drawInstances.push(this)
    }

    get(featureId) {
      return this.features.get(String(featureId))
    }
    getAll() {
      return {
        type: 'FeatureCollection',
        features: [...this.features.values()],
      }
    }
    getSelectedIds() {
      return this.selectedIds
    }
    deleteAll() {
      this.features.clear()
      this.selectedIds = []
    }
  },
}))

vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}))

import EditableMapLibre from '../src/main/components/map/EditableMapLibre.vue'

function mountEditableMapLibre(modelValue, options = {}) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const events = []
  const componentRef = ref(null)
  const currentStyleKey = ref(options.currentStyleKey ?? 'gaode')
  const activeLayer = ref(options.activeLayer ?? null)
  const allLayers = ref(options.allLayers ?? [])
  const previewLayers = ref(options.previewLayers ?? [])
  const enablePreviewHover = ref(options.enablePreviewHover ?? false)
  const featureBoxSelectEnabled = ref(options.featureBoxSelectEnabled ?? false)

  const Root = defineComponent({
    components: { EditableMapLibre },
    setup() {
      return {
        componentRef,
        modelValue,
        currentStyleKey,
        activeLayer,
        allLayers,
        previewLayers,
        enablePreviewHover,
        featureBoxSelectEnabled,
        events,
      }
    },
    template: `
      <EditableMapLibre
        ref="componentRef"
        :model-value="modelValue"
        :current-style-key="currentStyleKey"
        :active-layer="activeLayer"
        :all-layers="allLayers"
        :preview-layers="previewLayers"
        :enable-preview-hover="enablePreviewHover"
        :feature-box-select-enabled="featureBoxSelectEnabled"
        @before-features-change="events.push(['before-features-change'])"
        @features-change="events.push(['features-change', $event])"
        @feature-select="events.push(['feature-select', $event])"
        @feature-box-select="events.push(['feature-box-select', $event])"
        @mode-change="events.push(['mode-change', $event])"
      />
    `,
  })

  const app = createApp(Root)
  app.mount(host)

  return {
    events,
    get exposed() {
      return componentRef.value
    },
    get draw() {
      return drawInstances.at(-1)
    },
    get map() {
      return mapInstances.at(-1)
    },
    currentStyleKey,
    featureBoxSelectEnabled,
    host,
    unmount() {
      app.unmount()
      host.remove()
    },
  }
}

describe('EditableMapLibre state flow', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    drawInstances.length = 0
    mapInstances.length = 0
    document.body.innerHTML = ''
  })

  it('selects a feature from the panel without entering direct edit mode', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'polygon-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: { type: 'Polygon', coordinates: [] },
      }],
    })
    await nextTick()

    wrapper.exposed.selectFeature('polygon-1', { directEdit: false })

    expect(wrapper.draw.changeMode).toHaveBeenLastCalledWith('simple_select', { featureIds: ['polygon-1'] })
    expect(wrapper.draw.changeMode).not.toHaveBeenCalledWith('direct_select', { featureId: 'polygon-1' })
    expect(wrapper.events).toContainEqual(['mode-change', 'simple_select'])
    expect(wrapper.events).toContainEqual(['feature-select', 'polygon-1'])

    wrapper.unmount()
  })

  it('selects multiple features without emitting a single-selection override', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'polygon-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: { type: 'Polygon', coordinates: [] },
      }, {
        id: 'polygon-2',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: { type: 'Polygon', coordinates: [] },
      }],
    })
    await nextTick()
    wrapper.events.length = 0

    wrapper.exposed.selectFeatures(['polygon-1', 'polygon-2'])
    wrapper.map.emit('draw.selectionchange')

    expect(wrapper.draw.changeMode).toHaveBeenLastCalledWith('simple_select', {
      featureIds: ['polygon-1', 'polygon-2'],
    })
    expect(wrapper.events).toContainEqual(['mode-change', 'simple_select'])
    expect(wrapper.events.some(([eventName]) => eventName === 'feature-select')).toBe(false)

    wrapper.unmount()
  })

  it('emits every naturally selected feature from draw selection changes', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'polygon-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: { type: 'Polygon', coordinates: [] },
      }, {
        id: 'polygon-2',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: { type: 'Polygon', coordinates: [] },
      }],
    })
    await nextTick()
    wrapper.events.length = 0

    wrapper.draw.selectedIds = ['polygon-1', 'polygon-2']
    wrapper.map.emit('draw.selectionchange')

    expect(wrapper.events).toContainEqual(['feature-select', ['polygon-1', 'polygon-2']])

    wrapper.unmount()
  })

  it('keeps programmatic multi-selection quiet when selectionchange arrives after the next tick', async () => {
    vi.useFakeTimers()
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'polygon-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: { type: 'Polygon', coordinates: [] },
      }, {
        id: 'polygon-2',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: { type: 'Polygon', coordinates: [] },
      }],
    })
    await nextTick()
    wrapper.events.length = 0

    wrapper.exposed.selectFeatures(['polygon-1', 'polygon-2'])
    vi.runOnlyPendingTimers()
    wrapper.map.emit('draw.selectionchange')

    expect(wrapper.events.some(([eventName]) => eventName === 'feature-select')).toBe(false)

    wrapper.unmount()
  })

  it('keeps locked or hidden features out of direct edit mode', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'hidden-1',
        type: 'Feature',
        properties: { visible: false, locked: false },
        geometry: { type: 'Polygon', coordinates: [] },
      }],
    })
    await nextTick()

    wrapper.exposed.selectFeature('hidden-1', { directEdit: true })

    expect(wrapper.draw.changeMode).toHaveBeenLastCalledWith('simple_select')
    expect(wrapper.draw.changeMode).not.toHaveBeenCalledWith('direct_select', { featureId: 'hidden-1' })
    expect(wrapper.events).toContainEqual(['mode-change', 'simple_select'])
    expect(wrapper.events).toContainEqual(['feature-select', 'hidden-1'])

    wrapper.unmount()
  })

  it('emits a history checkpoint before Draw update features change', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'polygon-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: { type: 'Polygon', coordinates: [] },
      }],
    })
    await nextTick()
    wrapper.events.length = 0

    wrapper.map.emit('draw.update')

    const eventNames = wrapper.events.map(([eventName]) => eventName)
    expect(eventNames.indexOf('before-features-change')).toBeGreaterThanOrEqual(0)
    expect(eventNames.indexOf('features-change')).toBeGreaterThan(eventNames.indexOf('before-features-change'))

    wrapper.unmount()
  })

  it('preserves direct-select feature identity after Draw update events', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'polygon-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: { type: 'Polygon', coordinates: [] },
      }],
    })
    await nextTick()

    wrapper.exposed.selectFeature('polygon-1', { directEdit: true })
    wrapper.events.length = 0
    wrapper.draw.selectedIds = []
    wrapper.map.emit('draw.update')

    expect(wrapper.events).toContainEqual(['feature-select', 'polygon-1'])
    expect(wrapper.events).not.toContainEqual(['feature-select', ''])

    wrapper.unmount()
  })

  it('delegates selected deletion to Draw trash without a duplicate history checkpoint', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'polygon-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: { type: 'Polygon', coordinates: [] },
      }],
    })
    await nextTick()
    wrapper.events.length = 0

    wrapper.exposed.deleteSelected()

    expect(wrapper.draw.trash).toHaveBeenCalledTimes(1)
    expect(wrapper.events.some(([eventName]) => eventName === 'before-features-change')).toBe(false)
    expect(wrapper.events.some(([eventName]) => eventName === 'features-change')).toBe(true)

    wrapper.unmount()
  })

  it('keeps midpoint handles visible for line and polygon edge editing', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [],
    })
    await nextTick()

    expect(wrapper.draw.options.styles).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'gl-draw-midpoint',
        type: 'circle',
      }),
    ]))
    expect(JSON.stringify(wrapper.draw.options.styles)).toContain('"midpoint"')

    wrapper.unmount()
  })

  it('can sync feature properties without emitting a duplicate history commit', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'line-1',
        type: 'Feature',
        properties: { stroke: '#111111' },
        geometry: { type: 'LineString', coordinates: [] },
      }],
    })
    await nextTick()

    wrapper.exposed.updateFeatureProperties('line-1', { stroke: '#ff0000' }, { commitHistory: false })

    expect(wrapper.draw.setFeatureProperty).toHaveBeenCalledWith('line-1', 'stroke', '#ff0000')
    expect(wrapper.events.some(([eventName]) => eventName === 'before-features-change')).toBe(false)
    expect(wrapper.events.some(([eventName]) => eventName === 'features-change')).toBe(true)

    wrapper.unmount()
  })

  it('can replace draw data without emitting a selection reset', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'line-1',
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: [] },
      }],
    })
    await nextTick()
    wrapper.events.length = 0

    wrapper.exposed.importGeoJson({
      type: 'FeatureCollection',
      features: [{
        id: 'line-2',
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: [] },
      }],
    }, { emitChanges: false, emitSelection: false })

    expect(wrapper.events.some(([eventName]) => eventName === 'feature-select')).toBe(false)

    wrapper.unmount()
  })

  it('captures box selection pointer events above the map without emitting draw updates', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'polygon-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: { type: 'Polygon', coordinates: [[[20, 20], [30, 20], [30, 30], [20, 20]]] },
      }],
    }, { featureBoxSelectEnabled: true })
    await nextTick()
    wrapper.events.length = 0

    const captureLayer = wrapper.host.querySelector('.editable-map-box-select-capture')
    expect(captureLayer).toBeTruthy()
    const wasCanceled = !captureLayer.dispatchEvent(new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      button: 0,
      clientX: 10,
      clientY: 10,
    }))
    document.dispatchEvent(new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
      clientX: 40,
      clientY: 40,
    }))
    document.dispatchEvent(new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
      clientX: 40,
      clientY: 40,
    }))
    await nextTick()

    expect(wasCanceled).toBe(true)
    expect(wrapper.events).toContainEqual([
      'feature-box-select',
      { featureIds: ['polygon-1'], selectionMode: 'replace' },
    ])
    expect(wrapper.events.some(([eventName]) => eventName === 'before-features-change')).toBe(false)
    expect(wrapper.events.some(([eventName]) => eventName === 'features-change')).toBe(false)

    wrapper.unmount()
  })

  it('emits additive and subtractive box selection modes from pointer modifiers', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'polygon-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: { type: 'Polygon', coordinates: [[[20, 20], [30, 20], [30, 30], [20, 20]]] },
      }],
    }, { featureBoxSelectEnabled: true })
    await nextTick()
    const captureLayer = wrapper.host.querySelector('.editable-map-box-select-capture')

    wrapper.events.length = 0
    captureLayer.dispatchEvent(new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      button: 0,
      shiftKey: true,
      clientX: 10,
      clientY: 10,
    }))
    document.dispatchEvent(new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
      clientX: 40,
      clientY: 40,
    }))
    await nextTick()
    expect(wrapper.events).toContainEqual([
      'feature-box-select',
      { featureIds: ['polygon-1'], selectionMode: 'add' },
    ])
    expect(wrapper.events.some(([eventName]) => eventName === 'before-features-change')).toBe(false)
    expect(wrapper.events.some(([eventName]) => eventName === 'features-change')).toBe(false)

    wrapper.events.length = 0
    captureLayer.dispatchEvent(new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      button: 0,
      altKey: true,
      clientX: 10,
      clientY: 10,
    }))
    document.dispatchEvent(new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
      clientX: 40,
      clientY: 40,
    }))
    await nextTick()
    expect(wrapper.events).toContainEqual([
      'feature-box-select',
      { featureIds: ['polygon-1'], selectionMode: 'subtract' },
    ])
    expect(wrapper.events.some(([eventName]) => eventName === 'before-features-change')).toBe(false)
    expect(wrapper.events.some(([eventName]) => eventName === 'features-change')).toBe(false)

    wrapper.unmount()
  })

  it('restores draw data and overlay layers after a basemap style reload', async () => {
    const activeFeature = {
      id: 'active-line-1',
      type: 'Feature',
      properties: { visible: true, locked: false },
      geometry: { type: 'LineString', coordinates: [[113, 23], [114, 24]] },
    }
    const activeLayer = {
      id: 'active-layer',
      geometryType: 'LineString',
      featureCollection: {
        type: 'FeatureCollection',
        features: [activeFeature],
      },
    }
    const readonlyLayer = {
      id: 'readonly-layer',
      geometryType: 'Polygon',
      visible: false,
      locked: false,
      stroke: '#111111',
      strokeWidth: 2,
      fill: '#222222',
      fillOpacity: 0.2,
      featureCollection: {
        type: 'FeatureCollection',
        features: [{
          id: 'readonly-polygon-1',
          type: 'Feature',
          properties: {},
          geometry: { type: 'Polygon', coordinates: [] },
        }],
      },
    }
    const previewLayer = {
      id: 'preview-layer',
      type: 'polygons',
      featureCollection: {
        type: 'FeatureCollection',
        features: [{
          id: 'preview-polygon-1',
          type: 'Feature',
          properties: { partitionKey: 'preview-1' },
          geometry: { type: 'Polygon', coordinates: [] },
        }],
      },
    }
    const wrapper = mountEditableMapLibre(activeLayer.featureCollection, {
      activeLayer,
      allLayers: [activeLayer, readonlyLayer],
      previewLayers: [previewLayer],
      enablePreviewHover: true,
    })
    await nextTick()

    expect(wrapper.map.getSource('readonly-draw-source-readonly-layer')).toBeTruthy()
    expect(wrapper.map.getSource('preview-draw-source-preview-layer')).toBeTruthy()
    wrapper.draw.set.mockClear()

    wrapper.currentStyleKey.value = 'gaode_satellite'
    await nextTick()
    expect(wrapper.map.setStyle).toHaveBeenCalled()
    expect(wrapper.map.getSource('readonly-draw-source-readonly-layer')).toBeNull()

    wrapper.map.emit('style.load')
    await nextTick()

    const restoredFeatureCollection = wrapper.draw.set.mock.calls.at(-1)?.[0]
    expect(restoredFeatureCollection?.type).toBe('FeatureCollection')
    expect(restoredFeatureCollection?.features).toHaveLength(1)
    expect(restoredFeatureCollection?.features[0]).toMatchObject({
      id: activeFeature.id,
      type: activeFeature.type,
      geometry: activeFeature.geometry,
      properties: {
        visible: true,
        locked: false,
      },
    })
    expect(wrapper.map.getSource('readonly-draw-source-readonly-layer')).toBeTruthy()
    expect(wrapper.map.getSource('preview-draw-source-preview-layer')).toBeTruthy()
    expect(wrapper.map.getLayer('readonly-draw-fill-readonly-layer')).toBeTruthy()
    expect(wrapper.map.getLayer('preview-draw-fill-preview-layer')).toBeTruthy()
    expect(wrapper.events.some(([eventName]) => eventName === 'before-features-change')).toBe(false)
    expect(wrapper.events.some(([eventName]) => eventName === 'features-change')).toBe(false)

    wrapper.unmount()
  })
})
