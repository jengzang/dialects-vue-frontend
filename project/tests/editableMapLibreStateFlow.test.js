import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, nextTick, ref } from 'vue'

const drawInstances = []
const mapInstances = []

vi.mock('maplibre-gl', () => {
  class MockMap {
    constructor() {
      this.handlers = new Map()
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
      this.handlers.set(eventName, handler)
      if (eventName === 'load') {
        handler()
      }
    }
    off() {}
    once(_eventName, handler) {
      handler()
    }
    triggerRepaint() {}
    getStyle() {
      return { layers: [] }
    }
    getLayer() {
      return false
    }
    getSource() {
      return null
    }
    setStyle() {}
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

    set(featureCollection) {
      this.features = new Map((featureCollection.features ?? []).map((feature) => [String(feature.id), feature]))
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

function mountEditableMapLibre(modelValue) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const events = []
  const componentRef = ref(null)

  const Root = defineComponent({
    components: { EditableMapLibre },
    setup() {
      return { componentRef, modelValue, events }
    },
    template: `
      <EditableMapLibre
        ref="componentRef"
        :model-value="modelValue"
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
})
