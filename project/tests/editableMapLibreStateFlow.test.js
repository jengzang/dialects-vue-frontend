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
      if ([...this.layers.values()].some((layer) => layer.source === sourceId)) {
        throw new Error(`Source "${sourceId}" is still in use`)
      }
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
    unproject(point) {
      const x = Array.isArray(point) ? point[0] : point?.x
      const y = Array.isArray(point) ? point[1] : point?.y
      return { toArray: () => [x, y] }
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
      this.selectedPoints = []
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
    getSelectedPoints() {
      return {
        type: 'FeatureCollection',
        features: this.selectedPoints,
      }
    }
    deleteAll() {
      this.features.clear()
      this.selectedIds = []
      this.selectedPoints = []
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
  const snappingEnabled = ref(options.snappingEnabled ?? true)
  const snapTolerance = ref(options.snapTolerance ?? 12)
  const snapGridSize = ref(options.snapGridSize ?? 0)

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
        snappingEnabled,
        snapTolerance,
        snapGridSize,
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
        :snapping-enabled="snappingEnabled"
        :snap-tolerance="snapTolerance"
        :snap-grid-size="snapGridSize"
        @before-features-change="events.push(['before-features-change'])"
        @features-change="events.push(['features-change', $event])"
        @feature-select="events.push(['feature-select', $event])"
        @shape-edit-state-change="events.push(['shape-edit-state-change', $event])"
        @feature-box-select="events.push(['feature-box-select', $event])"
        @mode-change="events.push(['mode-change', $event])"
        @geometry-edit-feedback="events.push(['geometry-edit-feedback', $event])"
        @snap-state-change="events.push(['snap-state-change', $event])"
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
    activeLayer,
    allLayers,
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
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [0, 0],
            [2, 0],
            [2, 2],
            [0, 2],
            [0, 0],
          ]],
        },
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

  it('keeps locked or hidden features out of map selection modes', async () => {
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

    expect(wrapper.draw.changeMode).toHaveBeenLastCalledWith('simple_select', { featureIds: [] })
    expect(wrapper.draw.changeMode).not.toHaveBeenCalledWith('direct_select', { featureId: 'hidden-1' })
    expect(wrapper.draw.changeMode).not.toHaveBeenCalledWith('simple_select', { featureIds: ['hidden-1'] })
    expect(wrapper.events).toContainEqual(['mode-change', 'simple_select'])
    expect(wrapper.events).not.toContainEqual(['feature-select', 'hidden-1'])

    wrapper.draw.changeMode.mockClear()
    wrapper.events.length = 0
    wrapper.exposed.selectFeature('hidden-1', { directEdit: false })

    expect(wrapper.draw.changeMode).toHaveBeenLastCalledWith('simple_select', { featureIds: [] })
    expect(wrapper.draw.changeMode).not.toHaveBeenCalledWith('simple_select', { featureIds: ['hidden-1'] })
    expect(wrapper.events).toContainEqual(['mode-change', 'simple_select'])
    expect(wrapper.events).not.toContainEqual(['feature-select', 'hidden-1'])

    wrapper.unmount()
  })

  it('filters hidden and locked features out of natural Draw selection changes', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'visible-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: { type: 'Polygon', coordinates: [] },
      }, {
        id: 'hidden-1',
        type: 'Feature',
        properties: { visible: false, locked: false },
        geometry: { type: 'Polygon', coordinates: [] },
      }, {
        id: 'locked-1',
        type: 'Feature',
        properties: { visible: true, locked: true },
        geometry: { type: 'Polygon', coordinates: [] },
      }],
    })
    await nextTick()
    wrapper.events.length = 0

    wrapper.draw.selectedIds = ['hidden-1', 'locked-1', 'visible-1']
    wrapper.map.emit('draw.selectionchange')

    expect(wrapper.events).toContainEqual(['feature-select', 'visible-1'])
    expect(wrapper.events).not.toContainEqual(['feature-select', ['hidden-1', 'locked-1', 'visible-1']])

    wrapper.unmount()
  })

  it('filters hidden and locked features out of programmatic multi-selection', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'visible-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: { type: 'Polygon', coordinates: [] },
      }, {
        id: 'hidden-1',
        type: 'Feature',
        properties: { visible: false, locked: false },
        geometry: { type: 'Polygon', coordinates: [] },
      }, {
        id: 'locked-1',
        type: 'Feature',
        properties: { visible: true, locked: true },
        geometry: { type: 'Polygon', coordinates: [] },
      }],
    })
    await nextTick()
    wrapper.events.length = 0

    wrapper.exposed.selectFeatures(['hidden-1', 'visible-1', 'locked-1'])

    expect(wrapper.draw.changeMode).toHaveBeenLastCalledWith('simple_select', { featureIds: ['visible-1'] })
    expect(wrapper.events).toContainEqual(['mode-change', 'simple_select'])

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

  it('emits direct-select vertex selection count from Draw selected points', async () => {
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
    wrapper.draw.selectedPoints = [{
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [1, 1] },
    }]
    wrapper.map.emit('draw.selectionchange')

    expect(wrapper.events).toContainEqual([
      'shape-edit-state-change',
      {
        mode: 'direct_select',
        featureId: 'polygon-1',
        selectedVertexCount: 1,
        selectedVertex: null,
        canDeleteSelectedVertices: true,
      },
    ])

    wrapper.unmount()
  })

  it('clears selected vertex count when leaving direct select mode', async () => {
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
    wrapper.draw.selectedPoints = [{
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [1, 1] },
    }]
    wrapper.map.emit('draw.selectionchange')
    wrapper.events.length = 0

    wrapper.draw.selectedPoints = []
    wrapper.draw.mode = 'simple_select'
    wrapper.map.emit('draw.modechange', { mode: 'simple_select' })

    expect(wrapper.events).toContainEqual([
      'shape-edit-state-change',
      {
        mode: 'simple_select',
        featureId: '',
        selectedVertexCount: 0,
        selectedVertex: null,
        canDeleteSelectedVertices: false,
      },
    ])

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

  it('disables Draw native keybindings so page shortcuts own delete semantics', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [],
    })
    await nextTick()

    expect(wrapper.draw.options.keybindings).toBe(false)

    wrapper.unmount()
  })

  it('prevents selected vertex deletion when a line would become invalid', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'line-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
      }],
    })
    await nextTick()

    wrapper.exposed.selectFeature('line-1', { directEdit: true })
    wrapper.draw.selectedIds = []
    wrapper.draw.selectedPoints = [{
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [1, 1] },
    }]
    wrapper.exposed.deleteSelected()

    expect(wrapper.draw.trash).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('prevents selected vertex deletion when a polygon ring would become invalid', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'polygon-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [0, 0],
            [1, 0],
            [0, 1],
            [0, 0],
          ]],
        },
      }],
    })
    await nextTick()

    wrapper.exposed.selectFeature('polygon-1', { directEdit: true })
    wrapper.draw.selectedIds = []
    wrapper.draw.selectedPoints = [{
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [1, 0] },
    }]
    wrapper.exposed.deleteSelected()

    expect(wrapper.draw.trash).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('allows selected vertex deletion when line geometry remains valid', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'line-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1], [2, 2]] },
      }],
    })
    await nextTick()

    wrapper.exposed.selectFeature('line-1', { directEdit: true })
    wrapper.draw.selectedIds = []
    wrapper.draw.selectedPoints = [{
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [1, 1] },
    }]
    wrapper.exposed.deleteSelected()

    expect(wrapper.draw.trash).toHaveBeenCalledTimes(1)

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

  it('selects a specific line vertex by coordinate path', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'line-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1], [2, 2]] },
      }],
    })
    await nextTick()
    wrapper.events.length = 0

    const didSelect = wrapper.exposed.selectVertex('line-1', '1')

    expect(didSelect).toBe(true)
    expect(wrapper.draw.changeMode).toHaveBeenLastCalledWith('direct_select', {
      featureId: 'line-1',
      coordPath: '1',
    })
    expect(wrapper.events).toContainEqual(['feature-select', 'line-1'])
    expect(wrapper.events).toContainEqual([
      'shape-edit-state-change',
      {
        mode: 'direct_select',
        featureId: 'line-1',
        selectedVertexCount: 1,
        selectedVertex: {
          featureId: 'line-1',
          coordPath: '1',
          coordinate: [1, 1],
        },
        canDeleteSelectedVertices: true,
      },
    ])

    wrapper.unmount()
  })

  it('emits selected vertex coordinates for exact coordinate editing', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'polygon-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [113, 23],
            [114, 23],
            [114, 24],
            [113, 23],
          ]],
        },
      }],
    })
    await nextTick()
    wrapper.events.length = 0

    const didSelect = wrapper.exposed.selectVertex('polygon-1', '0.2')

    expect(didSelect).toBe(true)
    expect(wrapper.events).toContainEqual([
      'shape-edit-state-change',
      {
        mode: 'direct_select',
        featureId: 'polygon-1',
        selectedVertexCount: 1,
        selectedVertex: {
          featureId: 'polygon-1',
          coordPath: '0.2',
          coordinate: [114, 24],
        },
        canDeleteSelectedVertices: false,
      },
    ])

    wrapper.unmount()
  })

  it('inserts a line vertex on an edge and keeps the inserted vertex selected', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'line-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: { type: 'LineString', coordinates: [[0, 0], [2, 2]] },
      }],
    })
    await nextTick()
    wrapper.events.length = 0

    const didInsert = wrapper.exposed.insertVertex('line-1', '1', [1, 1])

    expect(didInsert).toBe(true)
    expect(wrapper.events.map(([eventName]) => eventName)).toEqual(expect.arrayContaining([
      'before-features-change',
      'features-change',
    ]))
    expect(wrapper.events.find(([eventName]) => eventName === 'features-change')?.[1].features[0].geometry.coordinates)
      .toEqual([[0, 0], [1, 1], [2, 2]])
    expect(wrapper.draw.changeMode).toHaveBeenLastCalledWith('direct_select', {
      featureId: 'line-1',
      coordPath: '1',
    })

    wrapper.unmount()
  })

  it('moves a polygon vertex while keeping the ring closed', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'polygon-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [0, 0],
            [2, 0],
            [1, 1],
            [0, 0],
          ]],
        },
      }],
    })
    await nextTick()
    wrapper.events.length = 0

    const didMove = wrapper.exposed.moveVertex('polygon-1', '0.0', [0, 2])

    expect(didMove).toBe(true)
    const nextRing = wrapper.events.find(([eventName]) => eventName === 'features-change')?.[1]
      .features[0].geometry.coordinates[0]
    expect(nextRing).toEqual([
      [0, 2],
      [2, 0],
      [1, 1],
      [0, 2],
    ])
    expect(wrapper.draw.changeMode).toHaveBeenLastCalledWith('direct_select', {
      featureId: 'polygon-1',
      coordPath: '0.0',
    })

    wrapper.unmount()
  })

  it('snaps inserted vertices to visible reference points', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'line-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: { type: 'LineString', coordinates: [[0, 0], [10, 0]] },
      }],
    }, {
      allLayers: [{
        id: 'reference-points',
        visible: true,
        locked: true,
        featureCollection: {
          type: 'FeatureCollection',
          features: [{
            id: 'reference-point-1',
            type: 'Feature',
            properties: { visible: true, locked: true },
            geometry: { type: 'Point', coordinates: [5, 5] },
          }],
        },
      }],
    })
    await nextTick()
    wrapper.events.length = 0

    const didInsert = wrapper.exposed.insertVertex('line-1', '1', [5.4, 5.3])

    expect(didInsert).toBe(true)
    expect(wrapper.events.find(([eventName]) => eventName === 'features-change')?.[1].features[0].geometry.coordinates)
      .toEqual([[0, 0], [5, 5], [10, 0]])

    wrapper.unmount()
  })

  it('snaps moved vertices to visible reference edges', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'polygon-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [0, 0],
            [10, 0],
            [5, 8],
            [0, 0],
          ]],
        },
      }],
    }, {
      allLayers: [{
        id: 'reference-lines',
        visible: true,
        locked: true,
        featureCollection: {
          type: 'FeatureCollection',
          features: [{
            id: 'reference-line-1',
            type: 'Feature',
            properties: { visible: true, locked: true },
            geometry: { type: 'LineString', coordinates: [[0, 5], [10, 5]] },
          }],
        },
      }],
    })
    await nextTick()
    wrapper.events.length = 0

    const didMove = wrapper.exposed.moveVertex('polygon-1', '0.2', [3, 5.4])

    expect(didMove).toBe(true)
    const nextRing = wrapper.events.find(([eventName]) => eventName === 'features-change')?.[1]
      .features[0].geometry.coordinates[0]
    expect(nextRing).toEqual([
      [0, 0],
      [10, 0],
      [3, 5],
      [0, 0],
    ])

    wrapper.unmount()
  })

  it('renders a snap preview marker and guide line when a vertex edit snaps', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'polygon-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [0, 0],
            [10, 0],
            [5, 8],
            [0, 0],
          ]],
        },
      }],
    }, {
      allLayers: [{
        id: 'reference-lines',
        visible: true,
        locked: true,
        featureCollection: {
          type: 'FeatureCollection',
          features: [{
            id: 'reference-line-1',
            type: 'Feature',
            properties: { visible: true, locked: true },
            geometry: { type: 'LineString', coordinates: [[0, 5], [10, 5]] },
          }],
        },
      }],
    })
    await nextTick()

    wrapper.exposed.moveVertex('polygon-1', '0.2', [3, 5.4])

    expect(wrapper.map.getLayer('draw-snap-preview-guide')).toBeTruthy()
    expect(wrapper.map.getLayer('draw-snap-preview-point')).toBeTruthy()
    const snapPreview = wrapper.map.getSource('draw-snap-preview-source')?.data
    expect(snapPreview.features.map((feature) => feature.geometry.type)).toEqual(['LineString', 'Point'])
    expect(snapPreview.features[0].geometry.coordinates).toEqual([[3, 5.4], [3, 5]])
    expect(snapPreview.features[1].properties.snapType).toBe('edge')
    expect(snapPreview.features[1].geometry.coordinates).toEqual([3, 5])

    wrapper.unmount()
  })

  it('prefers snap midpoints over nearby reference edges and reports the snap target', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'line-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: { type: 'LineString', coordinates: [[0, 0], [10, 0]] },
      }],
    }, {
      allLayers: [{
        id: 'reference-lines',
        name: '参考线',
        visible: true,
        locked: true,
        featureCollection: {
          type: 'FeatureCollection',
          features: [{
            id: 'reference-line-1',
            type: 'Feature',
            properties: { name: '边界线', visible: true, locked: true },
            geometry: { type: 'LineString', coordinates: [[0, 5], [10, 5]] },
          }],
        },
      }],
    })
    await nextTick()
    wrapper.events.length = 0

    const didInsert = wrapper.exposed.insertVertex('line-1', '1', [5.2, 5.1])

    expect(didInsert).toBe(true)
    expect(wrapper.events.find(([eventName]) => eventName === 'features-change')?.[1].features[0].geometry.coordinates)
      .toEqual([[0, 0], [5, 5], [10, 0]])
    expect(wrapper.events).toContainEqual(['snap-state-change', {
      active: true,
      type: 'midpoint',
      source: 'reference-lines',
      layerName: '参考线',
      featureName: '边界线',
      coordinate: [5, 5],
      originalCoordinate: [5.2, 5.1],
    }])

    wrapper.unmount()
  })

  it('does not snap to hidden reference layers or hidden reference features', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'line-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: { type: 'LineString', coordinates: [[0, 0], [10, 0]] },
      }],
    }, {
      allLayers: [{
        id: 'hidden-reference',
        visible: false,
        locked: false,
        featureCollection: {
          type: 'FeatureCollection',
          features: [{
            id: 'hidden-point',
            type: 'Feature',
            properties: { visible: true, locked: false },
            geometry: { type: 'Point', coordinates: [5, 5] },
          }],
        },
      }, {
        id: 'hidden-feature-reference',
        visible: true,
        locked: false,
        featureCollection: {
          type: 'FeatureCollection',
          features: [{
            id: 'hidden-feature-point',
            type: 'Feature',
            properties: { visible: false, locked: false },
            geometry: { type: 'Point', coordinates: [6, 6] },
          }],
        },
      }],
    })
    await nextTick()
    wrapper.events.length = 0

    wrapper.exposed.insertVertex('line-1', '1', [5.2, 5.1])

    expect(wrapper.events.find(([eventName]) => eventName === 'features-change')?.[1].features[0].geometry.coordinates)
      .toEqual([[0, 0], [5.2, 5.1], [10, 0]])
    expect(wrapper.events).toContainEqual(['snap-state-change', { active: false }])

    wrapper.unmount()
  })

  it('reports grid snap targets when grid snapping wins', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'line-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: { type: 'LineString', coordinates: [[0, 0], [10, 0]] },
      }],
    }, {
      snapGridSize: 1,
    })
    await nextTick()
    wrapper.events.length = 0

    wrapper.exposed.insertVertex('line-1', '1', [5.2, 5.1])

    expect(wrapper.events.find(([eventName]) => eventName === 'features-change')?.[1].features[0].geometry.coordinates)
      .toEqual([[0, 0], [5, 5], [10, 0]])
    expect(wrapper.events).toContainEqual(['snap-state-change', {
      active: true,
      type: 'grid',
      source: 'grid',
      layerName: '',
      featureName: '',
      coordinate: [5, 5],
      originalCoordinate: [5.2, 5.1],
    }])

    wrapper.unmount()
  })

  it('does not snap to hidden reference features or when snapping is disabled', async () => {
    const referenceLayer = {
      id: 'reference-points',
      visible: true,
      locked: true,
      featureCollection: {
        type: 'FeatureCollection',
        features: [{
          id: 'hidden-reference-point',
          type: 'Feature',
          properties: { visible: false, locked: true },
          geometry: { type: 'Point', coordinates: [5, 5] },
        }],
      },
    }
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'line-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: { type: 'LineString', coordinates: [[0, 0], [10, 0]] },
      }],
    }, { allLayers: [referenceLayer] })
    await nextTick()
    wrapper.events.length = 0

    wrapper.exposed.insertVertex('line-1', '1', [5.4, 5.3])

    expect(wrapper.events.find(([eventName]) => eventName === 'features-change')?.[1].features[0].geometry.coordinates)
      .toEqual([[0, 0], [5.4, 5.3], [10, 0]])
    wrapper.unmount()

    const disabledWrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'line-2',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: { type: 'LineString', coordinates: [[0, 0], [10, 0]] },
      }],
    }, {
      snappingEnabled: false,
      allLayers: [{
        ...referenceLayer,
        featureCollection: {
          type: 'FeatureCollection',
          features: [{
            id: 'visible-reference-point',
            type: 'Feature',
            properties: { visible: true, locked: true },
            geometry: { type: 'Point', coordinates: [5, 5] },
          }],
        },
      }],
    })
    await nextTick()
    disabledWrapper.events.length = 0

    disabledWrapper.exposed.insertVertex('line-2', '1', [5.4, 5.3])

    expect(disabledWrapper.events.find(([eventName]) => eventName === 'features-change')?.[1].features[0].geometry.coordinates)
      .toEqual([[0, 0], [5.4, 5.3], [10, 0]])

    disabledWrapper.unmount()
  })

  it('snaps coordinates emitted by Draw create and update events before syncing state', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [],
    }, {
      allLayers: [{
        id: 'reference-points',
        visible: true,
        locked: true,
        featureCollection: {
          type: 'FeatureCollection',
          features: [{
            id: 'reference-point-1',
            type: 'Feature',
            properties: { visible: true, locked: true },
            geometry: { type: 'Point', coordinates: [50, 50] },
          }],
        },
      }],
    })
    await nextTick()
    wrapper.draw.set.mockClear()
    wrapper.events.length = 0
    wrapper.draw.features.set('drawn-line-1', {
      id: 'drawn-line-1',
      type: 'Feature',
      properties: { visible: true, locked: false },
      geometry: { type: 'LineString', coordinates: [[0, 0], [50.4, 50.3], [100, 0]] },
    })

    wrapper.map.emit('draw.create')

    const syncedFeatureCollection = wrapper.events.find(([eventName]) => eventName === 'features-change')?.[1]
    expect(syncedFeatureCollection.features[0].geometry.coordinates)
      .toEqual([[0, 0], [50, 50], [100, 0]])
    expect(wrapper.draw.set).toHaveBeenCalledWith(syncedFeatureCollection)

    wrapper.events.length = 0
    wrapper.draw.set.mockClear()
    wrapper.draw.features.set('drawn-line-1', {
      id: 'drawn-line-1',
      type: 'Feature',
      properties: { visible: true, locked: false },
      geometry: { type: 'LineString', coordinates: [[0, 0], [50.2, 50.1], [100, 0]] },
    })

    wrapper.map.emit('draw.update')

    expect(wrapper.events.find(([eventName]) => eventName === 'features-change')?.[1].features[0].geometry.coordinates)
      .toEqual([[0, 0], [50, 50], [100, 0]])
    expect(wrapper.draw.set).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('does not snap Draw event coordinates when snapping is disabled', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [],
    }, {
      snappingEnabled: false,
      allLayers: [{
        id: 'reference-points',
        visible: true,
        locked: true,
        featureCollection: {
          type: 'FeatureCollection',
          features: [{
            id: 'reference-point-1',
            type: 'Feature',
            properties: { visible: true, locked: true },
            geometry: { type: 'Point', coordinates: [5, 5] },
          }],
        },
      }],
    })
    await nextTick()
    wrapper.draw.set.mockClear()
    wrapper.events.length = 0
    wrapper.draw.features.set('drawn-line-1', {
      id: 'drawn-line-1',
      type: 'Feature',
      properties: { visible: true, locked: false },
      geometry: { type: 'LineString', coordinates: [[0, 0], [5.4, 5.3], [10, 0]] },
    })

    wrapper.map.emit('draw.create')

    expect(wrapper.events.find(([eventName]) => eventName === 'features-change')?.[1].features[0].geometry.coordinates)
      .toEqual([[0, 0], [5.4, 5.3], [10, 0]])
    expect(wrapper.draw.set).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('deletes a selected line vertex by coordinate path and reconnects the line', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'line-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1], [2, 2]] },
      }],
    })
    await nextTick()
    wrapper.exposed.selectVertex('line-1', '1')
    wrapper.events.length = 0

    const didDelete = wrapper.exposed.deleteSelected()

    expect(didDelete).toBe(true)
    expect(wrapper.draw.trash).not.toHaveBeenCalled()
    expect(wrapper.events.find(([eventName]) => eventName === 'features-change')?.[1].features[0].geometry.coordinates)
      .toEqual([[0, 0], [2, 2]])
    expect(wrapper.events).toContainEqual([
      'shape-edit-state-change',
      {
        mode: 'direct_select',
        featureId: 'line-1',
        selectedVertexCount: 0,
        selectedVertex: null,
        canDeleteSelectedVertices: false,
      },
    ])

    wrapper.unmount()
  })

  it('splits a selected line at a middle vertex and keeps both resulting lines valid', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'line-1',
        type: 'Feature',
        properties: { visible: true, locked: false, name: '边界线' },
        geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1], [2, 2], [3, 3]] },
      }],
    })
    await nextTick()
    wrapper.events.length = 0

    const didSplit = wrapper.exposed.splitLineAtVertex('line-1', '2')

    expect(didSplit).toBe(true)
    const nextFeatures = wrapper.events.find(([eventName]) => eventName === 'features-change')?.[1].features
    expect(nextFeatures).toHaveLength(2)
    expect(nextFeatures.map((feature) => feature.geometry.coordinates)).toEqual([
      [[0, 0], [1, 1], [2, 2]],
      [[2, 2], [3, 3]],
    ])
    expect(nextFeatures[0].id).toBe('line-1')
    expect(nextFeatures[1].id).toBe('line-1-split-1')
    expect(nextFeatures[1].properties.name).toBe('边界线')
    expect(wrapper.events).toContainEqual(['mode-change', 'simple_select'])
    expect(wrapper.events).toContainEqual([
      'shape-edit-state-change',
      {
        mode: 'simple_select',
        featureId: '',
        selectedVertexCount: 0,
        selectedVertex: null,
        canDeleteSelectedVertices: false,
      },
    ])
    expect(wrapper.draw.changeMode).toHaveBeenLastCalledWith('simple_select', {
      featureIds: ['line-1', 'line-1-split-1'],
    })

    wrapper.unmount()
  })

  it('blocks line splitting at endpoints or invalid coordinate paths', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'line-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1], [2, 2]] },
      }],
    })
    await nextTick()
    wrapper.events.length = 0

    expect(wrapper.exposed.splitLineAtVertex('line-1', '0')).toBe(false)
    expect(wrapper.exposed.splitLineAtVertex('line-1', '2')).toBe(false)
    expect(wrapper.exposed.splitLineAtVertex('line-1', 'x')).toBe(false)
    expect(wrapper.events.some(([eventName]) => eventName === 'features-change')).toBe(false)

    wrapper.unmount()
  })

  it('splits a selected polygon with a crossing cutter line', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'polygon-1',
        type: 'Feature',
        properties: { visible: true, locked: false, name: '分区' },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [0, 0],
            [4, 0],
            [4, 4],
            [0, 4],
            [0, 0],
          ]],
        },
      }],
    })
    await nextTick()
    wrapper.events.length = 0

    const didSplit = wrapper.exposed.splitPolygonWithLine('polygon-1', {
      id: 'line-1',
      type: 'Feature',
      properties: { visible: true, locked: false },
      geometry: { type: 'LineString', coordinates: [[2, -1], [2, 5]] },
    })

    expect(didSplit).toBe(true)
    const nextFeatures = wrapper.events.find(([eventName]) => eventName === 'features-change')?.[1].features
    expect(nextFeatures).toHaveLength(2)
    expect(nextFeatures[0].id).toBe('polygon-1')
    expect(nextFeatures[1].id).toBe('polygon-1-split-1')
    expect(nextFeatures.every((feature) => feature.geometry.type === 'Polygon')).toBe(true)
    expect(nextFeatures.every((feature) => feature.properties.name === '分区')).toBe(true)
    expect(nextFeatures.map((feature) => feature.geometry.coordinates[0].length)).toEqual([5, 5])
    expect(wrapper.draw.changeMode).toHaveBeenLastCalledWith('simple_select', {
      featureIds: ['polygon-1', 'polygon-1-split-1'],
    })

    wrapper.unmount()
  })

  it('draws a temporary cutter line to split a selected polygon without keeping the cutter feature', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'polygon-1',
        type: 'Feature',
        properties: { visible: true, locked: false, name: '分区' },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [0, 0],
            [4, 0],
            [4, 4],
            [0, 4],
            [0, 0],
          ]],
        },
      }],
    })
    await nextTick()

    const didStart = wrapper.exposed.startPolygonSplitSketch('polygon-1')
    expect(didStart).toBe(true)
    expect(wrapper.draw.changeMode).toHaveBeenLastCalledWith('draw_line_string')
    expect(wrapper.events).toContainEqual([
      'geometry-edit-feedback',
      { type: 'info', code: 'polygonSplitSketchStarted' },
    ])

    wrapper.events.length = 0
    const cutterFeature = {
      id: 'temporary-cutter',
      type: 'Feature',
      properties: { visible: true, locked: false },
      geometry: { type: 'LineString', coordinates: [[2, -1], [2, 5]] },
    }
    wrapper.draw.features.set('temporary-cutter', cutterFeature)
    wrapper.map.emit('draw.create', { features: [cutterFeature] })

    const eventNames = wrapper.events.map(([eventName]) => eventName)
    expect(eventNames.indexOf('before-features-change')).toBeGreaterThanOrEqual(0)
    expect(eventNames.indexOf('features-change')).toBeGreaterThan(eventNames.indexOf('before-features-change'))
    const nextFeatures = wrapper.events.find(([eventName]) => eventName === 'features-change')?.[1].features
    expect(nextFeatures).toHaveLength(2)
    expect(nextFeatures.every((feature) => feature.geometry.type === 'Polygon')).toBe(true)
    expect(nextFeatures.some((feature) => feature.id === 'temporary-cutter')).toBe(false)
    expect(wrapper.events).toContainEqual([
      'geometry-edit-feedback',
      { type: 'success', code: 'polygonSplitSuccess' },
    ])
    expect(wrapper.draw.changeMode).toHaveBeenLastCalledWith('simple_select', {
      featureIds: ['polygon-1', 'polygon-1-split-1'],
    })

    wrapper.unmount()
  })

  it('removes an invalid temporary cutter line and reports why polygon splitting failed', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'polygon-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [0, 0],
            [4, 0],
            [4, 4],
            [0, 4],
            [0, 0],
          ]],
        },
      }],
    })
    await nextTick()
    wrapper.exposed.startPolygonSplitSketch('polygon-1')
    wrapper.events.length = 0

    const cutterFeature = {
      id: 'temporary-cutter',
      type: 'Feature',
      properties: { visible: true, locked: false },
      geometry: { type: 'LineString', coordinates: [[5, 5], [6, 6]] },
    }
    wrapper.draw.features.set('temporary-cutter', cutterFeature)
    wrapper.map.emit('draw.create', { features: [cutterFeature] })

    expect(wrapper.events.some(([eventName]) => eventName === 'before-features-change')).toBe(false)
    expect(wrapper.events.some(([eventName]) => eventName === 'features-change')).toBe(false)
    expect(wrapper.draw.getAll().features.map((feature) => feature.id)).toEqual(['polygon-1'])
    expect(wrapper.events).toContainEqual([
      'geometry-edit-feedback',
      { type: 'error', code: 'polygonSplitNoPieces' },
    ])
    expect(wrapper.draw.changeMode).toHaveBeenLastCalledWith('simple_select', { featureIds: ['polygon-1'] })

    wrapper.unmount()
  })

  it('blocks polygon splitting when the cutter line does not cross the polygon', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'polygon-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [0, 0],
            [4, 0],
            [4, 4],
            [0, 4],
            [0, 0],
          ]],
        },
      }],
    })
    await nextTick()
    wrapper.events.length = 0

    const didSplit = wrapper.exposed.splitPolygonWithLine('polygon-1', {
      id: 'line-1',
      type: 'Feature',
      properties: { visible: true, locked: false },
      geometry: { type: 'LineString', coordinates: [[5, 5], [6, 6]] },
    })

    expect(didSplit).toBe(false)
    expect(wrapper.events.some(([eventName]) => eventName === 'features-change')).toBe(false)

    wrapper.unmount()
  })

  it('reports selected vertices as not deletable when deletion would invalidate a line', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'line-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
      }],
    })
    await nextTick()
    wrapper.events.length = 0

    wrapper.exposed.selectVertex('line-1', '1')

    expect(wrapper.events).toContainEqual([
      'shape-edit-state-change',
      {
        mode: 'direct_select',
        featureId: 'line-1',
        selectedVertexCount: 1,
        selectedVertex: {
          featureId: 'line-1',
          coordPath: '1',
          coordinate: [1, 1],
        },
        canDeleteSelectedVertices: false,
      },
    ])

    wrapper.unmount()
  })

  it('blocks selected coordinate-path deletion when geometry would become invalid', async () => {
    const wrapper = mountEditableMapLibre({
      type: 'FeatureCollection',
      features: [{
        id: 'polygon-1',
        type: 'Feature',
        properties: { visible: true, locked: false },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [0, 0],
            [1, 0],
            [0, 1],
            [0, 0],
          ]],
        },
      }],
    })
    await nextTick()
    wrapper.exposed.selectVertex('polygon-1', '0.1')
    wrapper.events.length = 0

    const didDelete = wrapper.exposed.deleteSelected()

    expect(didDelete).toBe(false)
    expect(wrapper.draw.trash).not.toHaveBeenCalled()
    expect(wrapper.events.some(([eventName]) => eventName === 'features-change')).toBe(false)

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

  it('refreshes readonly overlays when the active layer changes', async () => {
    const firstLayer = {
      id: 'first-layer',
      geometryType: 'Polygon',
      visible: true,
      locked: false,
      stroke: '#111111',
      strokeWidth: 2,
      fill: '#222222',
      fillOpacity: 0.2,
      featureCollection: {
        type: 'FeatureCollection',
        features: [{
          id: 'first-polygon-1',
          type: 'Feature',
          properties: {},
          geometry: { type: 'Polygon', coordinates: [] },
        }],
      },
    }
    const secondLayer = {
      id: 'second-layer',
      geometryType: 'Polygon',
      visible: true,
      locked: false,
      stroke: '#333333',
      strokeWidth: 2,
      fill: '#444444',
      fillOpacity: 0.2,
      featureCollection: {
        type: 'FeatureCollection',
        features: [{
          id: 'second-polygon-1',
          type: 'Feature',
          properties: {},
          geometry: { type: 'Polygon', coordinates: [] },
        }],
      },
    }
    const wrapper = mountEditableMapLibre(firstLayer.featureCollection, {
      activeLayer: firstLayer,
      allLayers: [firstLayer, secondLayer],
    })
    await nextTick()

    expect(wrapper.map.getSource('readonly-draw-source-first-layer')).toBeNull()
    expect(wrapper.map.getSource('readonly-draw-source-second-layer')).toBeTruthy()

    wrapper.activeLayer.value = secondLayer
    await nextTick()

    expect(wrapper.map.getSource('readonly-draw-source-first-layer')).toBeTruthy()
    expect(wrapper.map.getSource('readonly-draw-source-second-layer')).toBeNull()

    wrapper.unmount()
  })

  it('renders layer opacity through active draw styles and readonly overlays', async () => {
    const activeLayer = {
      id: 'active-layer',
      geometryType: 'Polygon',
      visible: true,
      locked: false,
      opacity: 0.4,
      featureCollection: {
        type: 'FeatureCollection',
        features: [],
      },
    }
    const readonlyLayer = {
      id: 'readonly-layer',
      geometryType: 'Polygon',
      visible: true,
      locked: false,
      stroke: '#111111',
      strokeWidth: 2,
      fill: '#222222',
      fillOpacity: 0.2,
      opacity: 0.35,
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
    const wrapper = mountEditableMapLibre(activeLayer.featureCollection, {
      activeLayer,
      allLayers: [activeLayer, readonlyLayer],
    })
    await nextTick()

    expect(JSON.stringify(wrapper.draw.options.styles)).toContain('user_opacity')
    expect(wrapper.map.getSource('readonly-draw-source-readonly-layer').data.features[0].properties.opacity).toBe(0.35)
    expect(JSON.stringify(wrapper.map.getLayer('readonly-draw-fill-readonly-layer').paint['fill-opacity'])).toContain('opacity')
    expect(JSON.stringify(wrapper.map.getLayer('readonly-draw-line-readonly-layer').paint['line-opacity'])).toContain('opacity')

    wrapper.unmount()
  })

  it('renders optional layer labels through active draw styles and readonly overlays', async () => {
    const activeLayer = {
      id: 'active-layer',
      geometryType: 'Point',
      visible: true,
      locked: false,
      labelsVisible: true,
      featureCollection: {
        type: 'FeatureCollection',
        features: [],
      },
    }
    const readonlyLayer = {
      id: 'readonly-layer',
      geometryType: 'Point',
      visible: true,
      locked: false,
      labelsVisible: true,
      textAllowOverlap: false,
      textPriority: 4,
      textLineHeight: 1.25,
      textLetterSpacing: 0.05,
      textAlign: 'center',
      textMaxWidth: 10,
      textMinZoom: 0,
      textMaxZoom: 12,
      textBackgroundEnabled: true,
      textBackgroundColor: '#ffffff',
      textBackgroundOpacity: 0.75,
      textBackgroundPadding: 2,
      textLeaderLine: true,
      textLeaderColor: '#111111',
      textLeaderWidth: 2,
      textOffsetX: 0.5,
      textOffsetY: 1.2,
      featureCollection: {
        type: 'FeatureCollection',
        features: [{
          id: 'readonly-point-1',
          type: 'Feature',
          properties: { name: '标注 A' },
          geometry: { type: 'Point', coordinates: [113, 23] },
        }],
      },
    }
    const wrapper = mountEditableMapLibre(activeLayer.featureCollection, {
      activeLayer,
      allLayers: [activeLayer, readonlyLayer],
    })
    await nextTick()

    expect(JSON.stringify(wrapper.draw.options.styles)).toContain('user_labelsVisible')
    expect(JSON.stringify(wrapper.draw.options.styles)).toContain('user_textScaleVisible')
    expect(JSON.stringify(wrapper.draw.options.styles)).toContain('user_textPriority')
    expect(JSON.stringify(wrapper.draw.options.styles)).toContain('user_textBackgroundEnabled')
    expect(wrapper.map.getSource('readonly-draw-source-readonly-layer').data.features[0].properties.labelsVisible).toBe(true)
    expect(wrapper.map.getLayer('readonly-draw-label-readonly-layer').type).toBe('symbol')
    expect(JSON.stringify(wrapper.map.getLayer('readonly-draw-label-readonly-layer').layout['text-field'])).toContain('name')
    expect(wrapper.map.getLayer('readonly-draw-label-readonly-layer').layout['text-allow-overlap']).toBe(false)
    expect(wrapper.map.getLayer('readonly-draw-label-readonly-layer').layout['text-line-height']).toBe(1.25)
    expect(JSON.stringify(wrapper.map.getLayer('readonly-draw-label-readonly-layer').layout['symbol-sort-key'])).toContain('textPriority')
    expect(JSON.stringify(wrapper.map.getLayer('readonly-draw-label-readonly-layer').paint['text-opacity'])).toContain('textScaleVisible')
    expect(wrapper.map.getSource('readonly-draw-source-readonly-layer').data.features[0].properties.textScaleVisible).toBe(true)
    expect(wrapper.map.getLayer('readonly-draw-label-background-readonly-layer').type).toBe('symbol')
    expect(wrapper.map.getLayer('draw-text-background-fill').type).toBe('fill')
    expect(wrapper.map.getLayer('draw-text-background-line').type).toBe('line')
    const backgroundSource = wrapper.map.getSource('draw-text-background-source')?.data
    expect(backgroundSource.features[0].geometry.type).toBe('Polygon')
    expect(backgroundSource.features[0].properties.textBackgroundColor).toBe('#ffffff')
    expect(wrapper.map.getLayer('draw-text-leader-line').type).toBe('line')
    const leaderSource = wrapper.map.getSource('draw-text-leader-source')?.data
    expect(leaderSource.features[0].geometry.type).toBe('LineString')
    expect(leaderSource.features[0].properties.textLeaderColor).toBe('#111111')

    wrapper.unmount()
  })

  it('removes readonly overlays for layers that are replaced from all layers', async () => {
    const activeLayer = {
      id: 'active-layer',
      geometryType: 'Polygon',
      visible: true,
      locked: false,
      featureCollection: {
        type: 'FeatureCollection',
        features: [],
      },
    }
    const removedLayer = {
      id: 'removed-layer',
      geometryType: 'Polygon',
      visible: true,
      locked: false,
      stroke: '#111111',
      strokeWidth: 2,
      fill: '#222222',
      fillOpacity: 0.2,
      featureCollection: {
        type: 'FeatureCollection',
        features: [{
          id: 'removed-polygon-1',
          type: 'Feature',
          properties: {},
          geometry: { type: 'Polygon', coordinates: [] },
        }],
      },
    }
    const wrapper = mountEditableMapLibre(activeLayer.featureCollection, {
      activeLayer,
      allLayers: [activeLayer, removedLayer],
    })
    await nextTick()

    expect(wrapper.map.getSource('readonly-draw-source-removed-layer')).toBeTruthy()

    wrapper.allLayers.value = [activeLayer]
    await nextTick()

    expect(wrapper.map.getSource('readonly-draw-source-removed-layer')).toBeNull()

    wrapper.unmount()
  })

  it('removes readonly overlays when a layer id starts with the preview source prefix', async () => {
    const activeLayer = {
      id: 'active-layer',
      geometryType: 'Polygon',
      visible: true,
      locked: false,
      featureCollection: {
        type: 'FeatureCollection',
        features: [],
      },
    }
    const removedLayer = {
      id: 'preview-draw-source-shadow',
      geometryType: 'Polygon',
      visible: true,
      locked: false,
      stroke: '#111111',
      strokeWidth: 2,
      fill: '#222222',
      fillOpacity: 0.2,
      featureCollection: {
        type: 'FeatureCollection',
        features: [{
          id: 'shadow-polygon-1',
          type: 'Feature',
          properties: {},
          geometry: { type: 'Polygon', coordinates: [] },
        }],
      },
    }
    const wrapper = mountEditableMapLibre(activeLayer.featureCollection, {
      activeLayer,
      allLayers: [activeLayer, removedLayer],
    })
    await nextTick()

    expect(wrapper.map.getLayer('readonly-draw-fill-preview-draw-source-shadow')).toBeTruthy()

    wrapper.allLayers.value = [activeLayer]
    await nextTick()

    expect(wrapper.map.getLayer('readonly-draw-fill-preview-draw-source-shadow')).toBe(false)
    expect(wrapper.map.getSource('readonly-draw-source-preview-draw-source-shadow')).toBeNull()

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
