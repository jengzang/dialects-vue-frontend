import { createApp, defineComponent, h, nextTick, ref } from 'vue'
import { createI18n } from 'vue-i18n'
import maplibregl from 'maplibre-gl'
import mapMessages from '../../src/i18n/locales/zh-CN/map.json'
import '../../src/styles/main-entry.scss'
import MapLibre from '../../src/main/components/map/MapLibre.vue'
import { mapStore } from '../../src/main/store/store.js'

const originalSetStyle = maplibregl.Map.prototype.setStyle
maplibregl.Map.prototype.setStyle = function () {
  window.mainMap = this
  return originalSetStyle.call(this, { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#ededed' } }] }, { diff: false })
}
const component = ref(null)
const feature = ref('测试')
const dotLevel = ref(3)
const events = []
Object.assign(mapStore, { mode: 'dot', mapData: null, mergedData: [], showCustomData: false, adminBoundary: null })
window.mainMapSmoke = { mapStore, component, feature, dotLevel, events, nextTick }
createApp(defineComponent({
  setup: () => () => h(MapLibre, {
    ref: component, activeFeature: feature.value, dotLevel: dotLevel.value,
    onMapClick: event => events.push(event),
  }),
})).use(createI18n({ legacy: false, locale: 'zh-CN', messages: { 'zh-CN': { map: mapMessages } } })).mount('#app')
