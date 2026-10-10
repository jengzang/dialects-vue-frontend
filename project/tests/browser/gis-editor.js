import { createApp, defineComponent, h, nextTick, ref } from 'vue'
import maplibregl from 'maplibre-gl'
import EditableMapLibre from '../../src/main/components/map/EditableMapLibre.vue'

const addControl = maplibregl.Map.prototype.addControl
maplibregl.Map.prototype.addControl = function (...args) {
  window.gisSmokeMap = this
  if (args[0]?.getAll) window.gisSmokeDraw = args[0]
  return addControl.apply(this, args)
}
const model = ref({ type: 'FeatureCollection', features: [] })
const editor = ref(null)
const activeLayer = ref({ id: 'active', name: 'Active layer', geometryType: 'Polygon', visible: true, locked: false })
const allLayers = ref([])
const snappingEnabled = ref(false)
const events = []
const history = []
createApp(defineComponent({
  setup() {
    window.gisSmoke = {
      editor, model, activeLayer, allLayers, snappingEnabled, events, history, nextTick,
      load: async (features, type = 'Polygon') => {
        activeLayer.value = { ...activeLayer.value, geometryType: type }
        model.value = { type: 'FeatureCollection', features }
        await nextTick()
        editor.value.setDrawMode('simple_select')
        events.length = 0
        history.length = 0
      },
      undo: async () => {
        model.value = history.pop()
        await nextTick()
      },
    }
    return () => h(EditableMapLibre, {
      ref: editor,
      modelValue: model.value,
      currentStyleKey: 'maptiler',
      activeLayer: activeLayer.value,
      allLayers: allLayers.value,
      snappingEnabled: snappingEnabled.value,
      'onUpdate:modelValue': (value) => { model.value = value },
      onBeforeFeaturesChange: () => { history.push(JSON.parse(JSON.stringify(model.value))) },
      onGeometryEditFeedback: (value) => { events.push(value) },
      onSnapStateChange: (value) => { events.push({ event: 'snap', ...value }) },
    })
  },
})).mount('#app')
