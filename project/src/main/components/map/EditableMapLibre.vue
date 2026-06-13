<template>
  <div class="editable-map-shell main-glass-panel">
    <div ref="mapContainer" class="editable-map-stage" />
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import 'maplibre-gl/dist/maplibre-gl.css'

import { mapStyle } from '@/utils/map/MapSource.js'
import {
  exportCurrentMapAsPng,
  exportFeatureCollectionAsGeoJson,
  normalizeFeatureCollection,
} from '@/utils/map/draw/export.js'

const drawControlContainerClass = 'draw-control-container'
const drawStyles = [
  {
    id: 'gl-draw-polygon-fill',
    type: 'fill',
    filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    paint: {
      'fill-color': ['coalesce', ['get', 'fill'], '#60a5fa'],
      'fill-outline-color': ['coalesce', ['get', 'stroke'], '#2563eb'],
      'fill-opacity': ['coalesce', ['get', 'fillOpacity'], 0.22],
    },
  },
  {
    id: 'gl-draw-polygon-stroke',
    type: 'line',
    filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
      'visibility': ['case', ['==', ['coalesce', ['get', 'visible'], true], false], 'none', 'visible'],
    },
    paint: {
      'line-color': ['coalesce', ['get', 'stroke'], '#2563eb'],
      'line-width': ['coalesce', ['get', 'strokeWidth'], 3],
    },
  },
  {
    id: 'gl-draw-line',
    type: 'line',
    filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
      'visibility': ['case', ['==', ['coalesce', ['get', 'visible'], true], false], 'none', 'visible'],
    },
    paint: {
      'line-color': ['coalesce', ['get', 'stroke'], '#2563eb'],
      'line-width': ['coalesce', ['get', 'strokeWidth'], 4],
    },
  },
  {
    id: 'gl-draw-point',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['!=', 'meta', 'midpoint'], ['!=', 'mode', 'static']],
    paint: {
      'circle-radius': 5,
      'circle-color': ['coalesce', ['get', 'stroke'], '#2563eb'],
      'circle-opacity': ['case', ['==', ['coalesce', ['get', 'visible'], true], false], 0, 1],
    },
  },
  {
    id: 'gl-draw-vertex',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex'], ['!=', 'mode', 'static']],
    paint: {
      'circle-radius': 4,
      'circle-color': '#ffffff',
      'circle-stroke-color': '#2563eb',
      'circle-stroke-width': 2,
    },
  },
]

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      type: 'FeatureCollection',
      features: [],
    })
  },
  currentStyleKey: {
    type: String,
    default: 'gaode',
  },
  activeLayer: {
    type: Object,
    default: null,
  },
  allLayers: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'update:modelValue',
  'features-change',
  'feature-select',
  'export-image',
  'export-layer',
  'update:currentStyleKey',
])

const mapContainer = ref(null)
const map = shallowRef(null)
const draw = shallowRef(null)
const selectedFeatureId = ref('')
const currentStyleKey = ref(props.currentStyleKey || 'gaode')
const readonlyLayerSourceId = 'readonly-draw-layers'
const readonlyLayerLineId = 'readonly-layer-lines'
const readonlyLayerFillId = 'readonly-layer-fills'
const readonlyLayerPointId = 'readonly-layer-points'

const buildReadonlyFeatureCollection = () => {
  const features = (props.allLayers ?? [])
    .filter((layer) => layer && layer.id !== props.activeLayer?.id)
    .flatMap((layer) => {
      const featureCollection = normalizeFeatureCollection(layer.featureCollection)
      return (featureCollection.features ?? []).map((feature) => ({
        ...feature,
        properties: {
          ...(feature.properties ?? {}),
          stroke: feature.properties?.stroke ?? layer.stroke,
          strokeWidth: feature.properties?.strokeWidth ?? layer.strokeWidth,
          fill: feature.properties?.fill ?? layer.fill,
          fillOpacity: feature.properties?.fillOpacity ?? layer.fillOpacity,
          visible: feature.properties?.visible ?? layer.visible,
          locked: true,
          layerId: layer.id,
        },
      }))
    })

  return normalizeFeatureCollection({
    type: 'FeatureCollection',
    features,
  })
}

const ensureReadonlyLayerSource = () => {
  if (!map.value?.getSource(readonlyLayerSourceId)) {
    map.value?.addSource(readonlyLayerSourceId, {
      type: 'geojson',
      data: buildReadonlyFeatureCollection(),
    })
  }

  if (!map.value?.getLayer(readonlyLayerFillId)) {
    map.value?.addLayer({
      id: readonlyLayerFillId,
      type: 'fill',
      source: readonlyLayerSourceId,
      filter: ['==', '$type', 'Polygon'],
      paint: {
        'fill-color': ['coalesce', ['get', 'fill'], '#60a5fa'],
        'fill-outline-color': ['coalesce', ['get', 'stroke'], '#2563eb'],
        'fill-opacity': ['case', ['==', ['coalesce', ['get', 'visible'], true], false], 0, ['coalesce', ['get', 'fillOpacity'], 0.22]],
      },
    })
  }

  if (!map.value?.getLayer(readonlyLayerLineId)) {
    map.value?.addLayer({
      id: readonlyLayerLineId,
      type: 'line',
      source: readonlyLayerSourceId,
      filter: ['any', ['==', '$type', 'LineString'], ['==', '$type', 'Polygon']],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': ['coalesce', ['get', 'stroke'], '#2563eb'],
        'line-width': ['coalesce', ['get', 'strokeWidth'], 3],
        'line-opacity': ['case', ['==', ['coalesce', ['get', 'visible'], true], false], 0, 1],
      },
    })
  }

  if (!map.value?.getLayer(readonlyLayerPointId)) {
    map.value?.addLayer({
      id: readonlyLayerPointId,
      type: 'circle',
      source: readonlyLayerSourceId,
      filter: ['==', '$type', 'Point'],
      paint: {
        'circle-radius': 5,
        'circle-color': ['coalesce', ['get', 'stroke'], '#2563eb'],
        'circle-opacity': ['case', ['==', ['coalesce', ['get', 'visible'], true], false], 0, 1],
      },
    })
  }
}

const syncReadonlyLayers = () => {
  const source = map.value?.getSource(readonlyLayerSourceId)
  source?.setData?.(buildReadonlyFeatureCollection())
}

const syncSelectedFeature = () => {
  const selectedIds = draw.value?.getSelectedIds?.() ?? []
  selectedFeatureId.value = selectedIds[0] ? String(selectedIds[0]) : ''
  emit('feature-select', selectedFeatureId.value)
}

const syncFeaturesFromDraw = () => {
  const featureCollection = normalizeFeatureCollection(draw.value?.getAll?.())
  emit('update:modelValue', featureCollection)
  emit('features-change', featureCollection)
  syncSelectedFeature()
}

const setDrawMode = (mode) => {
  draw.value?.changeMode?.(mode)
  if (mode === 'simple_select') {
    syncSelectedFeature()
  }
}

const selectFeature = (featureId) => {
  if (!draw.value || !featureId) {
    selectedFeatureId.value = ''
    emit('feature-select', selectedFeatureId.value)
    return
  }

  const feature = draw.value?.get?.(featureId)
  if (!feature) {
    selectedFeatureId.value = ''
    emit('feature-select', selectedFeatureId.value)
    return
  }

  if (feature?.properties?.locked) {
    selectedFeatureId.value = String(featureId)
    emit('feature-select', selectedFeatureId.value)
    return
  }

  draw.value?.changeMode?.('simple_select')
  draw.value?.changeMode?.('direct_select', { featureId })
  selectedFeatureId.value = String(featureId)
  emit('feature-select', selectedFeatureId.value)
}

const updateFeatureProperties = (featureId, nextProperties) => {
  if (!draw.value || !featureId || !nextProperties) return

  Object.entries(nextProperties).forEach(([key, value]) => {
    draw.value?.setFeatureProperty?.(featureId, key, value)
  })
  syncFeaturesFromDraw()
}

const deleteSelected = () => {
  draw.value?.trash?.()
  syncFeaturesFromDraw()
}

const clearAll = () => {
  draw.value?.deleteAll?.()
  syncFeaturesFromDraw()
}

const importGeoJson = (featureCollection, options = {}) => {
  if (!draw.value) return

  const normalized = normalizeFeatureCollection(featureCollection)
  const mergeImportedFeatures = options.merge === true
  const nextFeatureCollection = mergeImportedFeatures
    ? normalizeFeatureCollection({
        type: 'FeatureCollection',
        features: [
          ...(draw.value.getAll()?.features ?? []),
          ...(normalized.features ?? []),
        ],
      })
    : normalized

  draw.value.deleteAll()
  if (nextFeatureCollection.features.length > 0) {
    draw.value.set(nextFeatureCollection)
  }
  selectedFeatureId.value = ''
  syncFeaturesFromDraw()
}

const mountHiddenDrawControls = () => {
  const controlGroup = mapContainer.value?.querySelector('.mapboxgl-ctrl-group')
  controlGroup?.classList.add(drawControlContainerClass)
}

const bindDrawEvents = () => {
  map.value.on('draw.create', syncFeaturesFromDraw)
  map.value.on('draw.update', syncFeaturesFromDraw)
  map.value.on('draw.delete', syncFeaturesFromDraw)
  map.value.on('draw.selectionchange', syncSelectedFeature)
  map.value.on('draw.modechange', syncSelectedFeature)
}

const initializeDraw = () => {
  draw.value = new MapboxDraw({
    displayControlsDefault: false,
    controls: {
      line_string: true,
      polygon: true,
      trash: true,
    },
    styles: drawStyles,
    defaultMode: 'simple_select',
  })

  map.value.addControl(draw.value, 'top-left')
  mountHiddenDrawControls()
  bindDrawEvents()
  ensureReadonlyLayerSource()
  syncReadonlyLayers()

  const initialFeatures = normalizeFeatureCollection(props.modelValue)
  if (initialFeatures.features.length > 0) {
    draw.value.set(initialFeatures)
  }
}

const resetView = () => {
  if (!map.value) return
  map.value.flyTo({
    center: [113.2644, 23.1291],
    zoom: 6,
  })
}

const handleStyleChange = () => {
  if (!map.value) return
  map.value.setStyle(mapStyle(currentStyleKey.value))
}

const initializeMap = async () => {
  await nextTick()
  if (!mapContainer.value) return

  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: mapStyle(currentStyleKey.value),
    center: [113.2644, 23.1291],
    zoom: 6,
    preserveDrawingBuffer: true,
    attributionControl: false,
  })

  map.value.addControl(new maplibregl.NavigationControl(), 'top-left')
  map.value.on('load', initializeDraw)
  map.value.on('styledata', () => {
    if (!draw.value) return
    ensureReadonlyLayerSource()
    syncReadonlyLayers()
  })
}

const exportLayer = async (layerName) => {
  const featureCollection = normalizeFeatureCollection(draw.value?.getAll?.() ?? props.modelValue)
  const safeLayerName = layerName || props.activeLayer?.name || 'map-draw-layer'
  const filename = `${safeLayerName}.geojson`
  const exported = exportFeatureCollectionAsGeoJson(featureCollection, filename)
  emit('export-layer', exported)
  return exported
}

const exportAllLayers = async (layers = []) => {
  const allFeatures = (layers ?? []).flatMap((layer) => {
    const featureCollection = normalizeFeatureCollection(layer?.featureCollection)
    return (featureCollection.features ?? []).map((feature) => ({
      ...feature,
      properties: {
        ...(feature.properties ?? {}),
        layerId: layer?.id ?? '',
        layerName: layer?.name ?? '',
      },
    }))
  })
  const featureCollection = normalizeFeatureCollection({
    type: 'FeatureCollection',
    features: allFeatures,
  })
  const filename = 'map-draw-layers.geojson'
  const exported = exportFeatureCollectionAsGeoJson(featureCollection, filename)
  emit('export-layer', exported)
  return exported
}

const exportImage = async () => {
  const result = await exportCurrentMapAsPng(map.value)
  emit('export-image', result)
  return result
}

watch(
  () => props.modelValue,
  (nextValue) => {
    if (!draw.value || !nextValue) return
    const normalized = normalizeFeatureCollection(nextValue)
    draw.value.deleteAll()
    if (normalized.features.length > 0) {
      draw.value.set(normalized)
    }
    syncSelectedFeature()
  },
  { deep: true }
)

watch(
  () => props.allLayers,
  () => {
    if (!map.value) return
    ensureReadonlyLayerSource()
    syncReadonlyLayers()
  },
  { deep: true }
)

watch(
  () => props.currentStyleKey,
  (nextValue) => {
    if (!nextValue || nextValue === currentStyleKey.value) return
    currentStyleKey.value = nextValue
    handleStyleChange()
  }
)

watch(currentStyleKey, (nextValue) => {
  emit('update:currentStyleKey', nextValue)
})

onMounted(() => {
  initializeMap()
})

onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove()
  }
})

defineExpose({
  exportLayer,
  exportAllLayers,
  exportImage,
  getFeatureCollection: () => normalizeFeatureCollection(draw.value?.getAll?.() ?? props.modelValue),
  setDrawMode,
  selectFeature,
  selectedFeatureId,
  updateFeatureProperties,
  deleteSelected,
  clearAll,
  importGeoJson,
  currentStyleKey,
  handleStyleChange,
  resetView,
})
</script>

<style scoped>
.editable-map-shell {
  width: 100%;
  min-height: 32rem;
  overflow: hidden;
}

.editable-map-stage {
  width: 100%;
  min-height: 32rem;
}

:deep(.draw-control-container) {
  opacity: 0;
  pointer-events: none;
  width: 0;
  height: 0;
  overflow: hidden;
}
</style>
