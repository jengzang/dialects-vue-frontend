<template>
  <div class="editable-map-shell main-glass-panel">
    <div ref="mapContainer" class="editable-map-stage" />
    <div
      v-if="props.featureBoxSelectEnabled"
      class="editable-map-box-select-capture"
      @mousedown.prevent.stop="handleFeatureBoxMouseDown"
      @mousemove.prevent.stop="handleFeatureBoxMouseMove"
      @mouseup.prevent.stop="handleFeatureBoxMouseUp"
    >
      <div
        v-if="featureBoxOverlayStyle"
        class="editable-map-box-select-overlay"
        :style="featureBoxOverlayStyle"
      />
    </div>
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
import { pickDrawColor } from '@/main/config/colors/mapColors.js'

const [drawFallbackStroke, drawFallbackPointColor] = pickDrawColor(0)

const drawControlContainerClass = 'draw-control-container'
const drawStyles = [
  {
    id: 'gl-draw-polygon-fill',
    type: 'fill',
    filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static'], ['!=', 'user_visible', false]],
    paint: {
      'fill-color': ['coalesce', ['get', 'user_fill'], drawFallbackPointColor],
      'fill-outline-color': ['coalesce', ['get', 'user_stroke'], drawFallbackStroke],
      'fill-opacity': ['case', ['==', ['coalesce', ['get', 'user_visible'], true], false], 0, ['coalesce', ['get', 'user_fillOpacity'], 0.22]],
    },
  },
  {
    id: 'gl-draw-polygon-stroke',
    type: 'line',
    filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static'], ['!=', 'user_visible', false]],
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-color': ['coalesce', ['get', 'user_stroke'], drawFallbackStroke],
      'line-width': ['coalesce', ['get', 'user_strokeWidth'], 3],
      'line-opacity': ['case', ['==', ['coalesce', ['get', 'user_visible'], true], false], 0, 1],
    },
  },
  {
    id: 'gl-draw-line',
    type: 'line',
    filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static'], ['!=', 'user_visible', false]],
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-color': ['coalesce', ['get', 'user_stroke'], drawFallbackStroke],
      'line-width': ['coalesce', ['get', 'user_strokeWidth'], 4],
      'line-opacity': ['case', ['==', ['coalesce', ['get', 'user_visible'], true], false], 0, 1],
    },
  },
  {
    id: 'gl-draw-point',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['!=', 'meta', 'midpoint'], ['!=', 'mode', 'static'], ['!=', 'user_visible', false]],
    paint: {
      'circle-radius': ['coalesce', ['get', 'user_pointRadius'], 6],
      'circle-color': ['coalesce', ['get', 'user_pointColor'], drawFallbackPointColor],
      'circle-stroke-color': ['coalesce', ['get', 'user_pointStrokeColor'], drawFallbackStroke],
      'circle-stroke-width': 2,
      'circle-opacity': ['case', ['==', ['coalesce', ['get', 'user_visible'], true], false], 0, 1],
    },
  },
  {
    id: 'gl-draw-midpoint',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'midpoint'], ['!=', 'mode', 'static']],
    paint: {
      'circle-radius': 5,
      'circle-color': drawFallbackStroke,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
      'circle-opacity': 0.9,
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
const featureBoxSelectableLayerIds = [
  'gl-draw-polygon-fill',
  'gl-draw-polygon-stroke',
  'gl-draw-line',
  'gl-draw-point',
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
  featureBoxSelectEnabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:modelValue',
  'before-features-change',
  'features-change',
  'feature-select',
  'mode-change',
  'export-image',
  'export-layer',
  'update:currentStyleKey',
  'preview-feature-hover',
  'feature-box-select',
])

const mapContainer = ref(null)
const map = shallowRef(null)
const draw = shallowRef(null)
const selectedFeatureId = ref('')
const currentStyleKey = ref(props.currentStyleKey || 'gaode')
const isFullscreen = ref(false)
const isFeatureBoxDragging = ref(false)
const featureBoxStartPoint = ref(null)
const featureBoxEndPoint = ref(null)
const defaultFeatureBoxSelectionMode = 'replace'
const featureBoxSelectionMode = ref(defaultFeatureBoxSelectionMode)
let previousPreviewSourceIds = []
let hoveredFeatureKey = null
let hoveredFeatureSource = null
let previewHoverBound = false
let suppressedProgrammaticFeatureSelectionIds = null
let featureBoxDragPanWasEnabled = true
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
        'circle-radius': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          ['+', ['coalesce', ['get', 'pointRadius'], 6], 3],
          ['coalesce', ['get', 'pointRadius'], 6],
        ],
        'circle-color': ['coalesce', ['get', 'pointColor'], drawFallbackPointColor],
        'circle-stroke-color': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          '#ffffff',
          ['coalesce', ['get', 'pointStrokeColor'], drawFallbackStroke],
        ],
        'circle-stroke-width': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          4,
          2,
        ],
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

const normalizeFeatureIds = (featureIds = []) => featureIds
  .map((featureId) => String(featureId || ''))
  .filter(Boolean)

const areFeatureIdsEqual = (leftFeatureIds = [], rightFeatureIds = []) => {
  const leftIds = normalizeFeatureIds(leftFeatureIds)
  const rightIds = normalizeFeatureIds(rightFeatureIds)
  if (leftIds.length !== rightIds.length) return false
  const rightIdSet = new Set(rightIds)
  return leftIds.every((featureId) => rightIdSet.has(featureId))
}

const syncSelectedFeature = () => {
  const selectedIds = normalizeFeatureIds(draw.value?.getSelectedIds?.() ?? [])
  selectedFeatureId.value = selectedIds[0] ? String(selectedIds[0]) : ''
  if (suppressedProgrammaticFeatureSelectionIds) {
    if (areFeatureIdsEqual(selectedIds, suppressedProgrammaticFeatureSelectionIds)) return
    suppressedProgrammaticFeatureSelectionIds = null
  }
  emit('feature-select', selectedFeatureId.value)
}

const syncDrawMode = (event) => {
  emit('mode-change', event?.mode || draw.value?.getMode?.() || 'simple_select')
  syncSelectedFeature()
}

const syncFeaturesFromDraw = (options = {}) => {
  const featureCollection = normalizeFeatureCollection(draw.value?.getAll?.())
  if (options.commitHistory !== false) {
    emit('before-features-change')
  }
  emit('update:modelValue', featureCollection)
  emit('features-change', featureCollection)
  syncSelectedFeature()
}

const setDrawMode = (mode) => {
  suppressedProgrammaticFeatureSelectionIds = null
  draw.value?.changeMode?.(mode)
  if (mode === 'simple_select') {
    syncSelectedFeature()
  }
}

const selectFeature = (featureId, options = {}) => {
  suppressedProgrammaticFeatureSelectionIds = null
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

  const shouldDirectEdit = options.directEdit !== false
  if (!shouldDirectEdit) {
    draw.value?.changeMode?.('simple_select', { featureIds: [featureId] })
    emit('mode-change', 'simple_select')
    selectedFeatureId.value = String(featureId)
    emit('feature-select', selectedFeatureId.value)
    return
  }

  if (feature?.properties?.locked || feature?.properties?.visible === false) {
    draw.value?.changeMode?.('simple_select')
    emit('mode-change', 'simple_select')
    selectedFeatureId.value = String(featureId)
    emit('feature-select', selectedFeatureId.value)
    return
  }

  draw.value?.changeMode?.('simple_select')
  draw.value?.changeMode?.('direct_select', { featureId })
  emit('mode-change', 'direct_select')
  selectedFeatureId.value = String(featureId)
  emit('feature-select', selectedFeatureId.value)
}

const selectFeatures = (featureIds = []) => {
  if (!draw.value) {
    selectedFeatureId.value = ''
    return
  }

  const selectedIds = featureIds
    .map((featureId) => String(featureId || ''))
    .filter((featureId) => featureId && draw.value?.get?.(featureId))
  suppressedProgrammaticFeatureSelectionIds = selectedIds
  draw.value?.changeMode?.('simple_select', { featureIds: selectedIds })
  emit('mode-change', 'simple_select')
  selectedFeatureId.value = selectedIds[0] || ''
}

const normalizeFeatureBoxPoint = (point) => {
  if (Number.isFinite(Number(point?.x)) && Number.isFinite(Number(point?.y))) {
    return {
      x: Number(point.x),
      y: Number(point.y),
    }
  }

  const clientX = point?.clientX ?? point?.originalEvent?.clientX
  const clientY = point?.clientY ?? point?.originalEvent?.clientY
  const rect = map.value?.getCanvas?.()?.getBoundingClientRect?.()
  if (Number.isFinite(Number(clientX)) && Number.isFinite(Number(clientY)) && rect) {
    return {
      x: Number(clientX) - rect.left,
      y: Number(clientY) - rect.top,
    }
  }

  return { x: 0, y: 0 }
}

const buildScreenBox = (startPoint, endPoint) => ({
  minX: Math.min(startPoint.x, endPoint.x),
  minY: Math.min(startPoint.y, endPoint.y),
  maxX: Math.max(startPoint.x, endPoint.x),
  maxY: Math.max(startPoint.y, endPoint.y),
})

const isPointInScreenBox = (point, box) => {
  return point.x >= box.minX
    && point.x <= box.maxX
    && point.y >= box.minY
    && point.y <= box.maxY
}

const getDrawFeatureId = (feature) => String(feature?.id ?? feature?.properties?.id ?? '')

const isFeatureBoxSelectableFeature = (featureId) => {
  const feature = draw.value?.get?.(featureId)
  return Boolean(
    feature
    && feature.properties?.visible !== false
    && feature.properties?.locked !== true
  )
}

const collectProjectedFeaturePoints = (coordinates, points = []) => {
  if (!Array.isArray(coordinates)) return points
  const longitude = Number(coordinates[0])
  const latitude = Number(coordinates[1])
  if (
    coordinates.length >= 2
    && Number.isFinite(longitude)
    && Number.isFinite(latitude)
  ) {
    points.push(map.value.project([longitude, latitude]))
    return points
  }
  coordinates.forEach((childCoordinates) => {
    collectProjectedFeaturePoints(childCoordinates, points)
  })
  return points
}

const featureIntersectsScreenBox = (feature, box) => {
  if (!map.value || !feature?.geometry) return false
  return collectProjectedFeaturePoints(feature.geometry.coordinates)
    .some((point) => isPointInScreenBox(point, box))
}

const buildRenderedFeatureIdsInScreenBox = (box) => {
  if (!map.value) return []
  const layerIds = featureBoxSelectableLayerIds
    .filter((layerId) => map.value.getLayer?.(layerId))
  if (layerIds.length === 0) return []

  try {
    return map.value.queryRenderedFeatures(
      [[box.minX, box.minY], [box.maxX, box.maxY]],
      { layers: layerIds }
    )
      .map(getDrawFeatureId)
      .filter((featureId) => featureId && isFeatureBoxSelectableFeature(featureId))
  } catch {
    return []
  }
}

const buildGeometryFeatureIdsInScreenBox = (box) => {
  return (normalizeFeatureCollection(draw.value?.getAll?.() ?? props.modelValue).features ?? [])
    .filter((feature) => {
      const featureId = getDrawFeatureId(feature)
      return featureId
        && isFeatureBoxSelectableFeature(featureId)
        && featureIntersectsScreenBox(feature, box)
    })
    .map(getDrawFeatureId)
}

const buildFeatureIdsInScreenBox = (box) => {
  const selectedFeatureIdSet = new Set([
    ...buildRenderedFeatureIdsInScreenBox(box),
    ...buildGeometryFeatureIdsInScreenBox(box),
  ])
  return (normalizeFeatureCollection(draw.value?.getAll?.() ?? props.modelValue).features ?? [])
    .map(getDrawFeatureId)
    .filter((featureId) => selectedFeatureIdSet.has(featureId))
}

const featureBoxOverlayStyle = computed(() => {
  if (!isFeatureBoxDragging.value || !featureBoxStartPoint.value || !featureBoxEndPoint.value) return null
  const box = buildScreenBox(featureBoxStartPoint.value, featureBoxEndPoint.value)
  return {
    left: `${box.minX}px`,
    top: `${box.minY}px`,
    width: `${Math.max(box.maxX - box.minX, 1)}px`,
    height: `${Math.max(box.maxY - box.minY, 1)}px`,
  }
})

const syncFeatureBoxCursor = () => {
  const canvas = map.value?.getCanvas?.()
  if (!canvas) return
  canvas.style.cursor = props.featureBoxSelectEnabled ? 'crosshair' : ''
}

const getFeatureBoxSelectionMode = (event) => {
  const sourceEvent = event?.originalEvent ?? event ?? {}
  if (sourceEvent.altKey || sourceEvent.optionKey) return 'subtract'
  if (sourceEvent.shiftKey) return 'add'
  return defaultFeatureBoxSelectionMode
}

const restoreFeatureBoxDragPan = () => {
  if (featureBoxDragPanWasEnabled) {
    map.value?.dragPan?.enable?.()
  }
}

const unbindFeatureBoxDocumentListeners = () => {
  document.removeEventListener('mousemove', handleFeatureBoxDocumentMouseMove)
  document.removeEventListener('mouseup', handleFeatureBoxDocumentMouseUp)
}

const resetFeatureBoxSelection = () => {
  const wasDragging = isFeatureBoxDragging.value
  isFeatureBoxDragging.value = false
  featureBoxStartPoint.value = null
  featureBoxEndPoint.value = null
  featureBoxSelectionMode.value = defaultFeatureBoxSelectionMode
  unbindFeatureBoxDocumentListeners()
  if (wasDragging) {
    restoreFeatureBoxDragPan()
  }
  syncFeatureBoxCursor()
}

const finishFeatureBoxSelection = (point) => {
  if (!isFeatureBoxDragging.value || !featureBoxStartPoint.value) return
  featureBoxEndPoint.value = point
  const box = buildScreenBox(featureBoxStartPoint.value, featureBoxEndPoint.value)
  const selectedFeatureIds = buildFeatureIdsInScreenBox(box)
  const selectionMode = featureBoxSelectionMode.value
  resetFeatureBoxSelection()
  selectFeatures(selectedFeatureIds)
  emit('feature-box-select', {
    featureIds: selectedFeatureIds,
    selectionMode,
  })
}

const handleFeatureBoxMouseDown = (event) => {
  const button = event?.originalEvent?.button ?? event?.button
  if (!props.featureBoxSelectEnabled || !map.value || (button !== undefined && button !== 0)) return

  event?.preventDefault?.()
  event?.originalEvent?.preventDefault?.()
  event?.originalEvent?.stopPropagation?.()
  featureBoxDragPanWasEnabled = map.value.dragPan?.isEnabled?.() ?? true
  if (featureBoxDragPanWasEnabled) {
    map.value.dragPan?.disable?.()
  }
  featureBoxSelectionMode.value = getFeatureBoxSelectionMode(event)
  featureBoxStartPoint.value = normalizeFeatureBoxPoint(event.point ?? event)
  featureBoxEndPoint.value = featureBoxStartPoint.value
  isFeatureBoxDragging.value = true
  document.addEventListener('mousemove', handleFeatureBoxDocumentMouseMove)
  document.addEventListener('mouseup', handleFeatureBoxDocumentMouseUp)
}

const handleFeatureBoxMouseMove = (event) => {
  if (!isFeatureBoxDragging.value) return
  event?.preventDefault?.()
  event?.stopPropagation?.()
  featureBoxEndPoint.value = normalizeFeatureBoxPoint(event.point ?? event)
}

const handleFeatureBoxMouseUp = (event) => {
  event?.preventDefault?.()
  event?.stopPropagation?.()
  finishFeatureBoxSelection(normalizeFeatureBoxPoint(event.point ?? event))
}

const handleFeatureBoxDocumentMouseMove = (event) => {
  if (!isFeatureBoxDragging.value) return
  event?.preventDefault?.()
  event?.stopPropagation?.()
  featureBoxEndPoint.value = normalizeFeatureBoxPoint(event)
}

const handleFeatureBoxDocumentMouseUp = (event) => {
  event?.preventDefault?.()
  event?.stopPropagation?.()
  finishFeatureBoxSelection(normalizeFeatureBoxPoint(event))
}

const updateFeatureProperties = (featureId, nextProperties, options = {}) => {
  if (!draw.value || !featureId || !nextProperties) return

  Object.entries(nextProperties).forEach(([key, value]) => {
    draw.value?.setFeatureProperty?.(featureId, key, value)
  })
  syncFeaturesFromDraw({ commitHistory: options.commitHistory !== false })
}

const deleteSelected = () => {
  draw.value?.trash?.()
  syncFeaturesFromDraw({ commitHistory: false })
}

const clearAll = () => {
  draw.value?.deleteAll?.()
  syncFeaturesFromDraw({ commitHistory: false })
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
  } else if (options.emitSelection !== false) {
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
  map.value.on('draw.modechange', syncDrawMode)
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
    userProperties: true,
    styles: drawStyles,
    defaultMode: 'simple_select',
  })

  map.value.addControl(draw.value, 'top-left')
  mountHiddenDrawControls()
  bindDrawEvents()
  syncReadonlyLayers()

  const initialFeatures = normalizeFeatureCollection(props.modelValue)
  if (initialFeatures.features.length > 0) {
    draw.value.set(initialFeatures)
  }
}

const restoreLayersAfterStyleLoad = () => {
  if (!map.value) return

  syncReadonlyLayers()

  if (!draw.value) return

  const currentFeatures = draw.value.getAll?.() ?? normalizeFeatureCollection(props.modelValue)
  draw.value.set(currentFeatures)
  syncSelectedFeature()
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
  map.value.on('style.load', restoreLayersAfterStyleLoad)
  map.value.on('styledata', () => {
    syncReadonlyLayers()
  })
  syncFeatureBoxCursor()
}

const gatherPreviewFillLayerIds = () => {
  const previewDescriptors = buildPreviewLayerDescriptors()
  return previewDescriptors.map((d) => d.fillLayerId)
}

const gatherPreviewPointLayerIds = () => {
  const previewDescriptors = buildPreviewLayerDescriptors()
  return previewDescriptors.map((d) => d.pointLayerId)
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
    syncFeatureBoxCursor()
  }
  emit('preview-feature-hover', null)
}

const onPreviewMouseMove = (e) => {
  if (props.featureBoxSelectEnabled) return
  const fillLayerIds = gatherPreviewFillLayerIds()
  const pointLayerIds = gatherPreviewPointLayerIds()
  const allLayerIds = [...fillLayerIds, ...pointLayerIds]
  const features = map.value.queryRenderedFeatures(e.point, { layers: allLayerIds })
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
  () => props.featureBoxSelectEnabled,
  (enabled) => {
    if (!enabled) {
      resetFeatureBoxSelection()
      return
    }
    resetHoveredFeature()
    syncFeatureBoxCursor()
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
  resetFeatureBoxSelection()
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
  selectFeatures,
  selectedFeatureId,
  updateFeatureProperties,
  deleteSelected,
  syncReadonlyLayers,
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
  position: relative;
  width: 100%;
  min-height: 80dvh;
  overflow: hidden;

  @media (max-aspect-ratio:1/1) {
    min-height: 70dvh;
  }
}

.editable-map-stage {
  width: 100%;
  min-height: 80dvh;
  
  @media (max-aspect-ratio:1/1) {
    min-height: 70dvh;
  }
}

.editable-map-box-select-capture {
  position: absolute;
  inset: 0;
  z-index: 4;
  cursor: crosshair;
}

.editable-map-box-select-overlay {
  position: absolute;
  pointer-events: none;
  border: 1px solid rgba(37, 99, 235, 0.85);
  background: rgba(59, 130, 246, 0.16);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.72) inset;
}

:deep(.draw-control-container) {
  opacity: 0;
  pointer-events: none;
  width: 0;
  height: 0;
  overflow: hidden;
}
</style>
