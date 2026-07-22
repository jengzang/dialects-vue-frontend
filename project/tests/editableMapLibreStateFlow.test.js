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
      this.setStyle = vi.fn(() => {
        this.sources.clear()
        this.layers.clear()
      })
      mapInstances.push(this)
    }

    addControl() {}
    remove() {}
    getCanvas() {
      return { style: {} }
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
    constructor() {
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
    trash() {}
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
        @before-features-change="events.push(['before-features-change'])"
        @features-change="events.push(['features-change', $event])"
        @feature-select="events.push(['feature-select', $event])"
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
    unmount() {
      app.unmount()
      host.remove()
    },
  }
}

describe('EditableMapLibre state flow', () => {
  afterEach(() => {
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
