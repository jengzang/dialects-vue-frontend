import { createApp, defineComponent, h, nextTick, ref } from 'vue'
import maplibregl from 'maplibre-gl'
import { createI18n } from 'vue-i18n'
import mapMessages from '../../src/i18n/locales/en/map.json'
import '../../src/styles/main-entry.scss'
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
const snapTolerance = ref(12)
const autoSwitchHits = ref(true)
const sketchState = ref({ active: false })
const events = []
const history = []
const historyContexts = []
const redoSnapshots = []
const commitHistory = () => { history.push(JSON.parse(JSON.stringify(model.value))); historyContexts.push(editor.value.getEditContext()); redoSnapshots.length = 0 }
createApp(defineComponent({
  setup() {
    window.gisSmoke = {
      editor, model, activeLayer, allLayers, snappingEnabled, snapTolerance, autoSwitchHits, sketchState, events, history, nextTick, commitHistory,
      load: async (features, type = 'Polygon') => {
        activeLayer.value = { ...activeLayer.value, geometryType: type }
        model.value = { type: 'FeatureCollection', features }
        await nextTick()
        editor.value.setDrawMode('simple_select')
        events.length = 0
        history.length = 0
        historyContexts.length = 0
        redoSnapshots.length = 0
      },
      undo: async () => {
        redoSnapshots.push({ model: JSON.parse(JSON.stringify(model.value)), context: editor.value.getEditContext() })
        model.value = history.pop()
        const context = historyContexts.pop()
        await nextTick()
        editor.value.restoreEditContext(context)
      },
      redo: async () => {
        const snapshot = redoSnapshots.pop()
        history.push(JSON.parse(JSON.stringify(model.value)))
        historyContexts.push(editor.value.getEditContext())
        model.value = snapshot.model
        await nextTick()
        editor.value.restoreEditContext(snapshot.context)
      },
    }
    return () => h(EditableMapLibre, {
      ref: editor,
      modelValue: model.value,
      currentStyleKey: 'maptiler',
      activeLayer: activeLayer.value,
      allLayers: allLayers.value,
      snappingEnabled: snappingEnabled.value,
      snapTolerance: snapTolerance.value,
      'onUpdate:modelValue': (value) => { model.value = value },
      onBeforeFeaturesChange: commitHistory,
      onGeometryEditFeedback: (value) => { events.push(value) },
      onSnapStateChange: (value) => { events.push({ event: 'snap', ...value }) },
      onMapClick: (value) => { events.push({ event: 'click', ...value }) },
      onSketchStateChange: (value) => { sketchState.value = value },
      onFeatureHitSelect: async (value) => {
        events.push({ event: 'hit', ...value })
        if (!autoSwitchHits.value) return
        const layer = allLayers.value.find((item) => item.id === value.layerId)
        if (!layer || layer.visible === false || layer.locked === true) return
        activeLayer.value = layer
        model.value = layer.featureCollection
        await nextTick()
        editor.value.selectFeatures([value.featureId])
      },
    })
  },
})).use(createI18n({ legacy: false, locale: 'en', messages: { en: { map: mapMessages } } })).mount('#app')
