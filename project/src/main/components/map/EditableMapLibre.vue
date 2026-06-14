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
    },
    paint: {
      'line-color': ['coalesce', ['get', 'stroke'], '#2563eb'],
      'line-width': ['coalesce', ['get', 'strokeWidth'], 3],
      'line-opacity': ['case', ['==', ['coalesce', ['get', 'visible'], true], false], 0, 1],
    },
  },
  {
    id: 'gl-draw-line',
    type: 'line',
    filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-color': ['coalesce', ['get', 'stroke'], '#2563eb'],
      'line-width': ['coalesce', ['get', 'strokeWidth'], 4],
      'line-opacity': ['case', ['==', ['coalesce', ['get', 'visible'], true], false], 0, 1],
    },
  },
  {
    id: 'gl-draw-point',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['!=', 'meta', 'midpoint'], ['!=', 'mode', 'static']],
    paint: {
      'circle-radius': ['coalesce', ['get', 'pointRadius'], 6],
      'circle-color': ['coalesce', ['get', 'pointColor'], '#60a5fa'],
      'circle-stroke-color': ['coalesce', ['get', 'pointStrokeColor'], '#2563eb'],
      'circle-stroke-width': 2,
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
  previewLayers: {
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
const isFullscreen = ref(false)
let previousPreviewSourceIds = []
const emptyFeatureCollection = () => ({
  type: 'FeatureCollection',
  features: [],
})
const sanitizeLayerFilename = (layerName) => {
  return String(layerName || 'map-draw-layer')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    || 'map-draw-layer'
}

const buildReadonlyLayerDescriptors = () => {
  return (props.allLayers ?? [])
    .filter((layer) => layer && layer.id !== props.activeLayer?.id)
    .map((layer, layerIndex) => {
      const featureCollection = normalizeFeatureCollection(layer.featureCollection)
      const features = (featureCollection.features ?? []).map((feature) => ({
        ...feature,
        properties: {
          ...(feature.properties ?? {}),
          stroke: feature.properties?.stroke ?? layer.stroke,
          strokeWidth: feature.properties?.strokeWidth ?? layer.strokeWidth,
          fill: feature.properties?.fill ?? layer.fill,
          fillOpacity: feature.properties?.fillOpacity ?? layer.fillOpacity,
          pointRadius: feature.properties?.pointRadius ?? layer.pointRadius,
          pointColor: feature.properties?.pointColor ?? layer.pointColor,
          pointStrokeColor: feature.properties?.pointStrokeColor ?? layer.pointStrokeColor,
          visible: feature.properties?.visible ?? layer.visible,
          locked: true,
          layerId: layer.id,
          layerOrder: layerIndex,
        },
      }))

      return {
        layerId: layer.id,
        layerOrder: layerIndex,
        sourceId: `readonly-draw-source-${layer.id}`,
        fillLayerId: `readonly-draw-fill-${layer.id}`,
        lineLayerId: `readonly-draw-line-${layer.id}`,
        pointLayerId: `readonly-draw-point-${layer.id}`,
        featureCollection: normalizeFeatureCollection({
          type: 'FeatureCollection',
          features,
        }),
      }
    })
}

const buildPreviewLayerDescriptors = () => {
  return (props.previewLayers ?? []).map((layer, layerIndex) => {
    const featureCollection = normalizeFeatureCollection(layer?.featureCollection)
    const style = layer?.type === 'polygons'
      ? {
          stroke: '#ef4444',
          strokeWidth: 2,
          fill: '#f97316',
          fillOpacity: 0.18,
          pointRadius: 6,
          pointColor: '#ef4444',
          pointStrokeColor: '#ffffff',
        }
      : {
          stroke: '#ef4444',
          strokeWidth: 2,
          fill: '#f97316',
          fillOpacity: 0.18,
          pointRadius: 7,
          pointColor: '#ef4444',
          pointStrokeColor: '#ffffff',
        }

    return {
      layerId: layer?.id ?? `preview-${layerIndex}`,
      layerOrder: 1000 + layerIndex,
      sourceId: `preview-draw-source-${layer?.id ?? layerIndex}`,
      fillLayerId: `preview-draw-fill-${layer?.id ?? layerIndex}`,
      lineLayerId: `preview-draw-line-${layer?.id ?? layerIndex}`,
      pointLayerId: `preview-draw-point-${layer?.id ?? layerIndex}`,
      featureCollection: normalizeFeatureCollection({
        type: 'FeatureCollection',
        features: (featureCollection.features ?? []).map((feature) => ({
          ...feature,
          properties: {
            ...style,
            ...(feature.properties ?? {}),
            visible: true,
            locked: true,
            layerId: layer?.id ?? `preview-${layerIndex}`,
            layerOrder: 1000 + layerIndex,
          },
        })),
      }),
    }
  })
}

const syncReadonlyLayerDescriptor = (descriptor) => {
  if (!map.value || !descriptor) return

  if (!map.value.getSource(descriptor.sourceId)) {
    map.value.addSource(descriptor.sourceId, {
      type: 'geojson',
      data: descriptor.featureCollection,
    })
  }

  const source = map.value.getSource(descriptor.sourceId)
  source?.setData?.(descriptor.featureCollection)

  if (!map.value.getLayer(descriptor.fillLayerId)) {
    map.value.addLayer({
      id: descriptor.fillLayerId,
      type: 'fill',
      source: descriptor.sourceId,
      filter: ['==', '$type', 'Polygon'],
      layout: {
        'fill-sort-key': ['coalesce', ['get', 'layerOrder'], 0],
      },
      paint: {
        'fill-color': ['coalesce', ['get', 'fill'], '#60a5fa'],
        'fill-outline-color': ['coalesce', ['get', 'stroke'], '#2563eb'],
        'fill-opacity': ['case', ['==', ['coalesce', ['get', 'visible'], true], false], 0, ['coalesce', ['get', 'fillOpacity'], 0.22]],
      },
    })
  }

  if (!map.value.getLayer(descriptor.lineLayerId)) {
    map.value.addLayer({
      id: descriptor.lineLayerId,
      type: 'line',
      source: descriptor.sourceId,
      filter: ['any', ['==', '$type', 'LineString'], ['==', '$type', 'Polygon']],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
        'line-sort-key': ['coalesce', ['get', 'layerOrder'], 0],
      },
      paint: {
        'line-color': ['coalesce', ['get', 'stroke'], '#2563eb'],
        'line-width': ['coalesce', ['get', 'strokeWidth'], 3],
        'line-opacity': ['case', ['==', ['coalesce', ['get', 'visible'], true], false], 0, 1],
      },
    })
  }

  if (!map.value.getLayer(descriptor.pointLayerId)) {
    map.value.addLayer({
      id: descriptor.pointLayerId,
      type: 'circle',
      source: descriptor.sourceId,
      filter: ['==', '$type', 'Point'],
      layout: {
        'circle-sort-key': ['coalesce', ['get', 'layerOrder'], 0],
      },
      paint: {
        'circle-radius': ['coalesce', ['get', 'pointRadius'], 6],
        'circle-color': ['coalesce', ['get', 'pointColor'], '#60a5fa'],
        'circle-stroke-color': ['coalesce', ['get', 'pointStrokeColor'], '#2563eb'],
        'circle-stroke-width': 2,
        'circle-opacity': ['case', ['==', ['coalesce', ['get', 'visible'], true], false], 0, 1],
      },
    })
  }
}

const cleanupReadonlyLayerDescriptors = (layerDescriptors) => {
  if (!map.value) return
  const activeSourceIds = new Set(layerDescriptors.map((descriptor) => descriptor.sourceId))
  const currentPreviewSourceIds = (props.previewLayers ?? []).map((layer, index) => `preview-draw-source-${layer?.id ?? index}`)
  const candidateSourceIds = [
    ...(props.allLayers ?? [])
      .filter((layer) => layer?.id && layer.id !== props.activeLayer?.id)
      .map((layer) => `readonly-draw-source-${layer.id}`),
    ...currentPreviewSourceIds,
    ...previousPreviewSourceIds,
  ]

  candidateSourceIds.forEach((sourceId) => {
    if (activeSourceIds.has(sourceId)) return
    const idSuffix = sourceId.replace(/^readonly-draw-source-/, '').replace(/^preview-draw-source-/, '')
    const prefix = sourceId.startsWith('preview-draw-source-') ? 'preview' : 'readonly'
    const fillLayerId = `${prefix}-draw-fill-${idSuffix}`
    const lineLayerId = `${prefix}-draw-line-${idSuffix}`
    const pointLayerId = `${prefix}-draw-point-${idSuffix}`
    if (map.value.getLayer(pointLayerId)) map.value.removeLayer(pointLayerId)
    if (map.value.getLayer(lineLayerId)) map.value.removeLayer(lineLayerId)
    if (map.value.getLayer(fillLayerId)) map.value.removeLayer(fillLayerId)
    if (map.value.getSource(sourceId)) map.value.removeSource(sourceId)
  })

  previousPreviewSourceIds = currentPreviewSourceIds
}

const removeReadonlyLayerById = (layerId) => {
  if (!map.value || !layerId) return

  const sourceId = `readonly-draw-source-${layerId}`
  const fillLayerId = `readonly-draw-fill-${layerId}`
  const lineLayerId = `readonly-draw-line-${layerId}`
  const pointLayerId = `readonly-draw-point-${layerId}`

  if (map.value.getLayer(pointLayerId)) map.value.removeLayer(pointLayerId)
  if (map.value.getLayer(lineLayerId)) map.value.removeLayer(lineLayerId)
  if (map.value.getLayer(fillLayerId)) map.value.removeLayer(fillLayerId)
  if (map.value.getSource(sourceId)) map.value.removeSource(sourceId)
}

const syncReadonlyLayers = () => {
  if (!map.value) return
  const layerDescriptors = [
    ...buildReadonlyLayerDescriptors(),
    ...buildPreviewLayerDescriptors(),
  ]
  layerDescriptors.forEach((descriptor) => {
    syncReadonlyLayerDescriptor(descriptor)
  })
  cleanupReadonlyLayerDescriptors(layerDescriptors)
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
  const shouldEmitChanges = options.emitChanges !== false
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
  if (shouldEmitChanges) {
    syncFeaturesFromDraw()
  } else {
    syncSelectedFeature()
  }
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
      point: true,
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
  syncReadonlyLayers()

  const initialFeatures = normalizeFeatureCollection(
    props.activeLayer?.visible === false ? emptyFeatureCollection() : props.modelValue
  )
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

const syncFullscreenState = () => {
  isFullscreen.value = document.fullscreenElement === mapContainer.value
}

const toggleFullscreen = async () => {
  if (!mapContainer.value) return isFullscreen.value

  if (document.fullscreenElement === mapContainer.value) {
    await document.exitFullscreen?.()
    return false
  }

  await mapContainer.value.requestFullscreen?.()
  return true
}

const initializeMap = async () => {
  await nextTick()
  if (!mapContainer.value) return

  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: mapStyle(currentStyleKey.value),
    center: [113.2644, 23.1291],
    zoom: 6,
    canvasContextAttributes: {
      preserveDrawingBuffer: true,
    },
    attributionControl: false,
  })

  map.value.addControl(new maplibregl.NavigationControl(), 'top-left')
  map.value.addControl(new maplibregl.FullscreenControl({ container: mapContainer.value }), 'top-left')
  map.value.on('load', initializeDraw)
  map.value.on('styledata', () => {
    syncReadonlyLayers()
  })
}

const exportLayer = async (layerName) => {
  const featureCollection = normalizeFeatureCollection(draw.value?.getAll?.() ?? props.modelValue)
  const safeLayerName = sanitizeLayerFilename(layerName || props.activeLayer?.name || 'map-draw-layer')
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
  () => [props.modelValue, props.activeLayer?.visible],
  ([nextValue]) => {
    if (!draw.value || !nextValue) return
    const normalized = normalizeFeatureCollection(
      props.activeLayer?.visible === false ? emptyFeatureCollection() : nextValue
    )
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
    syncReadonlyLayers()
  },
  { deep: true }
)

watch(
  () => props.previewLayers,
  () => {
    if (!map.value) return
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
  document.addEventListener('fullscreenchange', syncFullscreenState)
  initializeMap()
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', syncFullscreenState)
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
  removeReadonlyLayerById,
  resetView,
  toggleFullscreen,
  isFullscreen,
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
