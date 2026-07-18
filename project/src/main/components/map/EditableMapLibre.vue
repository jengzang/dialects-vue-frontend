<template>
  <div class="editable-map-shell main-glass-panel">
    <div ref="mapContainer" class="editable-map-stage" />
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch, computed } from 'vue'
import maplibregl from 'maplibre-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import 'maplibre-gl/dist/maplibre-gl.css'

import { mapStyle } from '@/utils/map/MapSource.js'
import {
  exportCurrentMapAsPng,
  exportFeatureCollectionAsGeoJson,
  normalizeFeatureCollection,
} from '@/main/utils/drawMap/export.js'
import { pickDrawColor } from '@/main/config/mapColors.js'

const [drawFallbackStroke, drawFallbackPointColor] = pickDrawColor(0)

const drawControlContainerClass = 'draw-control-container'
const drawStyles = [
  {
    id: 'gl-draw-polygon-fill',
    type: 'fill',
    filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    paint: {
      'fill-color': ['coalesce', ['get', 'fill'], drawFallbackPointColor],
      'fill-outline-color': ['coalesce', ['get', 'stroke'], drawFallbackStroke],
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
      'line-color': ['coalesce', ['get', 'stroke'], drawFallbackStroke],
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
      'line-color': ['coalesce', ['get', 'stroke'], drawFallbackStroke],
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
      'circle-color': ['coalesce', ['get', 'pointColor'], drawFallbackPointColor],
      'circle-stroke-color': ['coalesce', ['get', 'pointStrokeColor'], drawFallbackStroke],
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
      'circle-stroke-color': drawFallbackStroke,
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
  enablePreviewHover: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:modelValue',
  'features-change',
  'feature-select',
  'export-image',
  'export-layer',
  'update:currentStyleKey',
  'preview-feature-hover',
])

const mapContainer = ref(null)
const map = shallowRef(null)
const draw = shallowRef(null)
const selectedFeatureId = ref('')
const currentStyleKey = ref(props.currentStyleKey || 'gaode')
const isFullscreen = ref(false)
let previousPreviewSourceIds = []
let hoveredFeatureKey = null
let hoveredFeatureSource = null
let previewHoverBound = false
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
    const previewStroke = '#ff3b30'
    const previewFill = '#f97316'
    const style = layer?.type === 'polygons'
      ? {
          stroke: previewStroke,
          strokeWidth: 2,
          fill: previewFill,
          fillOpacity: 0.18,
          pointRadius: 6,
          pointColor: previewStroke,
          pointStrokeColor: '#ffffff',
        }
      : {
          stroke: previewStroke,
          strokeWidth: 2,
          fill: previewFill,
          fillOpacity: 0.18,
          pointRadius: 7,
          pointColor: previewStroke,
          pointStrokeColor: '#ffffff',
        }

    return {
      layerId: layer?.id ?? `preview-${layerIndex}`,
      layerOrder: 1000 + layerIndex,
      sourceId: `preview-draw-source-${layer?.id ?? layerIndex}`,
      fillLayerId: `preview-draw-fill-${layer?.id ?? layerIndex}`,
      lineLayerId: `preview-draw-line-${layer?.id ?? layerIndex}`,
      pointLayerId: `preview-draw-point-${layer?.id ?? layerIndex}`,
      isPreview: true,
      promoteId: 'partitionKey',
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
    const sourceOpts = {
      type: 'geojson',
      data: descriptor.featureCollection,
    }
    if (descriptor.promoteId) {
      sourceOpts.promoteId = descriptor.promoteId
    }
    map.value.addSource(descriptor.sourceId, sourceOpts)
  }

  const source = map.value.getSource(descriptor.sourceId)
  source?.setData?.(descriptor.featureCollection)

  if (!map.value.getLayer(descriptor.fillLayerId)) {
    const fillPaint = descriptor.isPreview
      ? {
          'fill-color': ['coalesce', ['get', 'fill'], drawFallbackPointColor],
          'fill-outline-color': ['coalesce', ['get', 'stroke'], drawFallbackStroke],
          'fill-opacity': [
            'case',
            ['==', ['coalesce', ['get', 'visible'], true], false], 0,
            ['case',
              ['boolean', ['feature-state', 'hover'], false],
              0.35,
              ['coalesce', ['get', 'fillOpacity'], 0.22],
            ],
          ],
        }
      : {
          'fill-color': ['coalesce', ['get', 'fill'], drawFallbackPointColor],
          'fill-outline-color': ['coalesce', ['get', 'stroke'], drawFallbackStroke],
          'fill-opacity': ['case', ['==', ['coalesce', ['get', 'visible'], true], false], 0, ['coalesce', ['get', 'fillOpacity'], 0.22]],
        }

    map.value.addLayer({
      id: descriptor.fillLayerId,
      type: 'fill',
      source: descriptor.sourceId,
      filter: ['==', '$type', 'Polygon'],
      layout: {
        'fill-sort-key': ['coalesce', ['get', 'layerOrder'], 0],
      },
      paint: fillPaint,
    })
  }

  if (!map.value.getLayer(descriptor.lineLayerId)) {
    const linePaint = descriptor.isPreview
      ? {
          'line-color': ['coalesce', ['get', 'stroke'], drawFallbackStroke],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            4,
            ['coalesce', ['get', 'strokeWidth'], 3],
          ],
          'line-opacity': ['case', ['==', ['coalesce', ['get', 'visible'], true], false], 0, 1],
        }
      : {
          'line-color': ['coalesce', ['get', 'stroke'], drawFallbackStroke],
          'line-width': ['coalesce', ['get', 'strokeWidth'], 3],
          'line-opacity': ['case', ['==', ['coalesce', ['get', 'visible'], true], false], 0, 1],
        }

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
      paint: linePaint,
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
        'circle-color': ['coalesce', ['get', 'pointColor'], drawFallbackPointColor],
        'circle-stroke-color': ['coalesce', ['get', 'pointStrokeColor'], drawFallbackStroke],
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
  applyPreviewHover()
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

const waitForMapRenderComplete = (timeout = 2500) => {
  if (!map.value) return Promise.resolve()

  return new Promise((resolve) => {
    let settled = false
    const finalize = () => {
      if (settled) return
      settled = true
      resolve()
    }

    const timer = window.setTimeout(finalize, timeout)
    map.value.once('idle', () => {
      window.clearTimeout(timer)
      finalize()
    })
    map.value.triggerRepaint()
  })
}

const buildAllLayerDescriptors = () => {
  return [
    ...buildReadonlyLayerDescriptors(),
    ...buildPreviewLayerDescriptors(),
  ]
}

const iterateCoordinates = (coordinates, visitor) => {
  if (!Array.isArray(coordinates)) return
  if (typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') {
    visitor(coordinates)
    return
  }
  coordinates.forEach((item) => iterateCoordinates(item, visitor))
}

const buildBoundsFromFeatureCollection = (featureCollection) => {
  const normalized = normalizeFeatureCollection(featureCollection)
  let minLng = Infinity
  let minLat = Infinity
  let maxLng = -Infinity
  let maxLat = -Infinity

  normalized.features.forEach((feature) => {
    iterateCoordinates(feature?.geometry?.coordinates, ([lng, lat]) => {
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return
      minLng = Math.min(minLng, lng)
      minLat = Math.min(minLat, lat)
      maxLng = Math.max(maxLng, lng)
      maxLat = Math.max(maxLat, lat)
    })
  })

  return normalizeBounds(minLng, minLat, maxLng, maxLat)
}

const normalizeBounds = (minLng, minLat, maxLng, maxLat) => {
  if (![minLng, minLat, maxLng, maxLat].every(Number.isFinite)) {
    return null
  }

  if (minLng === maxLng && minLat === maxLat) {
    const offset = 0.02
    return [
      [minLng - offset, minLat - offset],
      [maxLng + offset, maxLat + offset],
    ]
  }

  return [
    [Math.min(minLng, maxLng), Math.min(minLat, maxLat)],
    [Math.max(minLng, maxLng), Math.max(minLat, maxLat)],
  ]
}

const buildFeatureCollectionForLayerIds = (layerIds = []) => {
  const idSet = new Set((layerIds ?? []).filter(Boolean))
  const features = (props.allLayers ?? [])
    .filter((layer) => idSet.has(layer?.id))
    .flatMap((layer) => normalizeFeatureCollection(layer?.featureCollection).features ?? [])

  return normalizeFeatureCollection({
    type: 'FeatureCollection',
    features,
  })
}

const buildFeatureCollectionForFeatureId = (featureId) => {
  const drawFeature = draw.value?.get?.(featureId)
  if (drawFeature) {
    return normalizeFeatureCollection({
      type: 'FeatureCollection',
      features: [drawFeature],
    })
  }

  const matchedFeature = (props.allLayers ?? [])
    .flatMap((layer) => normalizeFeatureCollection(layer?.featureCollection).features ?? [])
    .find((feature) => String(feature?.id ?? feature?.properties?.id ?? '') === String(featureId))

  return normalizeFeatureCollection({
    type: 'FeatureCollection',
    features: matchedFeature ? [matchedFeature] : [],
  })
}

const setLayerVisibility = (layerId, visible) => {
  if (!map.value?.getLayer(layerId)) return
  map.value.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
}

const buildDrawLayerIdSet = () => {
  const layerIds = new Set(drawStyles.map((style) => style.id))
  buildAllLayerDescriptors().forEach((descriptor) => {
    layerIds.add(descriptor.fillLayerId)
    layerIds.add(descriptor.lineLayerId)
    layerIds.add(descriptor.pointLayerId)
  })
  return layerIds
}

const applyExportContentVisibility = (options = {}) => {
  if (!map.value) {
    return () => {}
  }

  const includeBasemap = options.includeBasemap !== false
  const includeDrawLayers = options.includeDrawLayers !== false
  const onlySelectedLayers = options.onlySelectedLayers === true
  const selectedLayerIds = new Set(options.selectedLayerIds ?? [])
  const drawLayerIds = buildDrawLayerIdSet()
  const previousVisibilities = new Map()
  const activeLayerIsSelected = selectedLayerIds.has(props.activeLayer?.id)

  ;(map.value.getStyle()?.layers ?? []).forEach((layer) => {
    previousVisibilities.set(layer.id, map.value.getLayoutProperty(layer.id, 'visibility') ?? 'visible')

    if (drawLayerIds.has(layer.id)) {
      if (!includeDrawLayers) {
        setLayerVisibility(layer.id, false)
        return
      }

      if (!onlySelectedLayers) {
        setLayerVisibility(layer.id, true)
        return
      }

      if (drawStyles.some((style) => style.id === layer.id)) {
        setLayerVisibility(layer.id, activeLayerIsSelected)
        return
      }

      const matchedReadonlyLayer = buildAllLayerDescriptors().find((descriptor) => (
        descriptor.fillLayerId === layer.id
        || descriptor.lineLayerId === layer.id
        || descriptor.pointLayerId === layer.id
      ))

      if (!matchedReadonlyLayer) {
        setLayerVisibility(layer.id, false)
        return
      }

      setLayerVisibility(layer.id, selectedLayerIds.has(matchedReadonlyLayer.layerId))
      return
    }

    if (!includeBasemap) {
      setLayerVisibility(layer.id, false)
    }
  })

  return () => {
    previousVisibilities.forEach((visibility, layerId) => {
      if (!map.value?.getLayer(layerId)) return
      map.value.setLayoutProperty(layerId, 'visibility', visibility)
    })
  }
}

const applyExportViewport = async (options = {}) => {
  if (!map.value) return

  const rangeMode = options.rangeMode || 'current-view'
  const zoomMode = options.zoomMode || 'current'
  let targetBounds = null

  if (rangeMode === 'selected-layer') {
    const layerIds = (options.selectedLayerIds?.length ? options.selectedLayerIds : [props.activeLayer?.id]).filter(Boolean)
    targetBounds = buildBoundsFromFeatureCollection(buildFeatureCollectionForLayerIds(layerIds))
  } else if (rangeMode === 'selected-feature' && options.selectedFeatureId) {
    targetBounds = buildBoundsFromFeatureCollection(buildFeatureCollectionForFeatureId(options.selectedFeatureId))
  } else if (rangeMode === 'custom-bbox' && Array.isArray(options.customBounds)) {
    targetBounds = options.customBounds
  }

  if (targetBounds) {
    map.value.fitBounds(targetBounds, {
      padding: 40,
      duration: 0,
      maxZoom: zoomMode === 'custom' ? Number(options.customZoom) || 24 : 24,
    })
    await waitForMapRenderComplete()
  }

  if (zoomMode === 'custom') {
    map.value.jumpTo({
      center: map.value.getCenter(),
      zoom: Number(options.customZoom) || map.value.getZoom(),
      bearing: map.value.getBearing(),
      pitch: map.value.getPitch(),
    })
    await waitForMapRenderComplete()
  }
}

const resolveExportDimensions = (options = {}) => {
  const currentWidth = mapContainer.value?.clientWidth || map.value?.getCanvas?.().clientWidth || 0
  const currentHeight = mapContainer.value?.clientHeight || map.value?.getCanvas?.().clientHeight || 0

  if (options.sizePreset === '1080p') {
    return { width: 1920, height: 1080 }
  }
  if (options.sizePreset === '2k') {
    return { width: 2560, height: 1440 }
  }
  if (options.sizePreset === 'custom') {
    return {
      width: Math.max(256, Number(options.customWidth) || currentWidth || 1920),
      height: Math.max(256, Number(options.customHeight) || currentHeight || 1080),
    }
  }

  return {
    width: currentWidth || 1920,
    height: currentHeight || 1080,
  }
}

const applyExportDimensions = async (options = {}) => {
  if (!map.value || !mapContainer.value) {
    return () => {}
  }

  const { width, height } = resolveExportDimensions(options)
  const previousWidth = mapContainer.value.style.width
  const previousHeight = mapContainer.value.style.height

  mapContainer.value.style.width = `${width}px`
  mapContainer.value.style.height = `${height}px`
  map.value.resize()
  await waitForMapRenderComplete()

  return async () => {
    mapContainer.value.style.width = previousWidth
    mapContainer.value.style.height = previousHeight
    map.value.resize()
    await waitForMapRenderComplete()
  }
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

const gatherPreviewFillLayerIds = () => {
  const previewDescriptors = buildPreviewLayerDescriptors()
  return previewDescriptors.map((d) => d.fillLayerId)
}

const unbindPreviewHover = () => {
  if (!map.value || !previewHoverBound) return
  map.value.off('mousemove', onPreviewMouseMove)
  previewHoverBound = false
  resetHoveredFeature()
}

const resetHoveredFeature = () => {
  if (hoveredFeatureKey && hoveredFeatureSource && map.value) {
    map.value.setFeatureState(
      { source: hoveredFeatureSource, id: hoveredFeatureKey },
      { hover: false }
    )
  }
  hoveredFeatureKey = null
  hoveredFeatureSource = null
  if (map.value) {
    map.value.getCanvas().style.cursor = ''
  }
  emit('preview-feature-hover', null)
}

const onPreviewMouseMove = (e) => {
  const fillLayerIds = gatherPreviewFillLayerIds()
  const features = map.value.queryRenderedFeatures(e.point, { layers: fillLayerIds })
  if (!features.length) {
    resetHoveredFeature()
    map.value.getCanvas().style.cursor = ''
    return
  }

  const feature = features[0]
  const key = feature.properties?.partitionKey
  const source = feature.source
  if (!key || !source) {
    resetHoveredFeature()
    return
  }

  if (key === hoveredFeatureKey && source === hoveredFeatureSource) return

  resetHoveredFeature()

  hoveredFeatureKey = key
  hoveredFeatureSource = source
  map.value.setFeatureState(
    { source, id: key },
    { hover: true }
  )
  map.value.getCanvas().style.cursor = 'pointer'
  emit('preview-feature-hover', {
    name: feature.properties?.name ?? key,
    partitionKey: key,
    pointCount: feature.properties?.pointCount ?? 0,
  })
}

const bindPreviewHover = () => {
  if (!map.value || previewHoverBound) return
  map.value.on('mousemove', onPreviewMouseMove)
  previewHoverBound = true
}

const applyPreviewHover = () => {
  if (!map.value) return
  if (props.enablePreviewHover) {
    bindPreviewHover()
  } else {
    unbindPreviewHover()
  }
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

const exportImage = async (options = {}) => {
  if (!map.value) {
    throw new Error('Map is unavailable')
  }

  const previousCamera = {
    center: map.value.getCenter(),
    zoom: map.value.getZoom(),
    bearing: map.value.getBearing(),
    pitch: map.value.getPitch(),
  }

  const restoreDimensions = await applyExportDimensions(options)
  const restoreContentVisibility = applyExportContentVisibility(options)

  try {
    await applyExportViewport({
      ...options,
      selectedFeatureId: options.selectedFeatureId || selectedFeatureId.value,
    })
    const result = await exportCurrentMapAsPng(map.value)
    emit('export-image', result)
    return result
  } finally {
    restoreContentVisibility()
    map.value.jumpTo(previousCamera)
    await waitForMapRenderComplete()
    await restoreDimensions()
  }
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
  () => props.enablePreviewHover,
  () => {
    applyPreviewHover()
  }
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
  unbindPreviewHover()
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
  currentCenter: computed(() => map.value?.getCenter?.()?.toArray?.() ?? null),
  currentZoom: computed(() => map.value?.getZoom?.() ?? null),
  currentBearing: computed(() => map.value?.getBearing?.() ?? 0),
  currentPitch: computed(() => map.value?.getPitch?.() ?? 0),
})
</script>

<style scoped lang="scss">
.editable-map-shell {
  width: 100%;
  min-height: 70dvh;
  overflow: hidden;
}

.editable-map-stage {
  width: 100%;
  min-height: 70dvh;
}

:deep(.draw-control-container) {
  opacity: 0;
  pointer-events: none;
  width: 0;
  height: 0;
  overflow: hidden;
}
</style>
