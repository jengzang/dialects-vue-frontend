<template>
  <div class="editable-map-shell glass-panel">
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
  area,
  booleanPointInPolygon,
  featureCollection,
  lineSplit,
  pointOnFeature,
  polygonToLine,
  polygonize,
} from '@turf/turf'
import {
  exportCurrentMapAsPng,
  exportFeatureCollectionAsGeoJson,
  normalizeFeatureCollection,
} from '@/main/utils/drawMap/export.js'
import { pickDrawColor } from '@/main/config/colors/mapColors.js'

const [drawFallbackStroke, drawFallbackPointColor] = pickDrawColor(0)

const drawControlContainerClass = 'draw-control-container'
const activeLayerOpacityExpression = ['coalesce', ['get', 'user_opacity'], 1]
const activeLayerLabelsVisibleExpression = ['coalesce', ['get', 'user_labelsVisible'], false]
const layerOpacityExpression = ['coalesce', ['get', 'opacity'], 1]
const layerLabelsVisibleExpression = ['coalesce', ['get', 'labelsVisible'], false]
const textFieldExpression = ['coalesce', ['get', 'user_annotationText'], ['get', 'annotationText'], ['get', 'name'], ['get', 'title'], ['get', 'label'], '']
const drawStyles = [
  {
    id: 'gl-draw-polygon-fill',
    type: 'fill',
    filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static'], ['!=', 'user_visible', false]],
    paint: {
      'fill-color': ['coalesce', ['get', 'user_fill'], drawFallbackPointColor],
      'fill-outline-color': ['coalesce', ['get', 'user_stroke'], drawFallbackStroke],
      'fill-opacity': ['case', ['==', ['coalesce', ['get', 'user_visible'], true], false], 0, ['*', ['coalesce', ['get', 'user_fillOpacity'], 0.22], activeLayerOpacityExpression]],
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
      'line-opacity': ['case', ['==', ['coalesce', ['get', 'user_visible'], true], false], 0, activeLayerOpacityExpression],
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
      'line-opacity': ['case', ['==', ['coalesce', ['get', 'user_visible'], true], false], 0, activeLayerOpacityExpression],
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
      'circle-opacity': ['case', ['==', ['coalesce', ['get', 'user_visible'], true], false], 0, activeLayerOpacityExpression],
    },
  },
  {
    id: 'gl-draw-midpoint-halo',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'midpoint'], ['!=', 'mode', 'static']],
    paint: {
      'circle-radius': 8,
      'circle-color': '#ffffff',
      'circle-opacity': 0.72,
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
  {
    id: 'gl-draw-active-vertex',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex'], ['==', 'active', 'true'], ['!=', 'mode', 'static']],
    paint: {
      'circle-radius': 7,
      'circle-color': drawFallbackStroke,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 3,
    },
  },
  {
    id: 'gl-draw-label',
    type: 'symbol',
    filter: ['all', ['!=', 'meta', 'midpoint'], ['!=', 'meta', 'vertex'], ['!=', 'mode', 'static'], ['!=', 'user_visible', false]],
    layout: {
      'text-field': textFieldExpression,
      'text-size': ['coalesce', ['get', 'user_textSize'], 12],
      'text-offset': [0, 1.1],
      'text-anchor': ['coalesce', ['get', 'user_textAnchor'], 'top'],
      'text-rotate': ['coalesce', ['get', 'user_textRotate'], 0],
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': ['coalesce', ['get', 'user_textColor'], ['get', 'user_stroke'], drawFallbackStroke],
      'text-halo-color': ['coalesce', ['get', 'user_textHaloColor'], '#ffffff'],
      'text-halo-width': ['coalesce', ['get', 'user_textHaloWidth'], 1],
      'text-opacity': ['case', ['==', activeLayerLabelsVisibleExpression, true], activeLayerOpacityExpression, 0],
    },
  },
]
const featureBoxSelectableLayerIds = [
  'gl-draw-polygon-fill',
  'gl-draw-polygon-stroke',
  'gl-draw-line',
  'gl-draw-point',
]
const snapPreviewSourceId = 'draw-snap-preview-source'
const snapPreviewGuideLayerId = 'draw-snap-preview-guide'
const snapPreviewPointLayerId = 'draw-snap-preview-point'
const snapPreviewLayerIds = new Set([snapPreviewGuideLayerId, snapPreviewPointLayerId])

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
  snappingEnabled: {
    type: Boolean,
    default: true,
  },
  snapTolerance: {
    type: Number,
    default: 12,
  },
  snapGridSize: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits([
  'update:modelValue',
  'before-features-change',
  'features-change',
  'feature-select',
  'shape-edit-state-change',
  'mode-change',
  'export-image',
  'export-layer',
  'update:currentStyleKey',
  'preview-feature-hover',
  'map-click',
  'feature-box-select',
  'geometry-edit-feedback',
])

const mapContainer = ref(null)
const map = shallowRef(null)
const draw = shallowRef(null)
const selectedFeatureId = ref('')
const selectedVertexCoordPaths = ref([])
const pendingPolygonSplitSketchFeatureId = ref('')
const currentStyleKey = ref(props.currentStyleKey || 'gaode')
const isFullscreen = ref(false)
const isFeatureBoxDragging = ref(false)
const featureBoxStartPoint = ref(null)
const featureBoxEndPoint = ref(null)
const defaultFeatureBoxSelectionMode = 'replace'
const featureBoxSelectionMode = ref(defaultFeatureBoxSelectionMode)
let previousPreviewSourceIds = []
let previousReadonlySourceIds = []
let hoveredFeatureKey = null
let hoveredFeatureSource = null
let previewHoverBound = false
let suppressedProgrammaticFeatureSelectionIds = null
let isDeletingSelected = false
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
          opacity: feature.properties?.opacity ?? layer.opacity ?? 1,
          labelsVisible: feature.properties?.labelsVisible ?? layer.labelsVisible ?? false,
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
        labelLayerId: `readonly-draw-label-${layer.id}`,
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
      labelLayerId: `preview-draw-label-${layer?.id ?? layerIndex}`,
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
              ['*', 0.35, layerOpacityExpression],
              ['*', ['coalesce', ['get', 'fillOpacity'], 0.22], layerOpacityExpression],
            ],
          ],
        }
      : {
          'fill-color': ['coalesce', ['get', 'fill'], drawFallbackPointColor],
          'fill-outline-color': ['coalesce', ['get', 'stroke'], drawFallbackStroke],
          'fill-opacity': ['case', ['==', ['coalesce', ['get', 'visible'], true], false], 0, ['*', ['coalesce', ['get', 'fillOpacity'], 0.22], layerOpacityExpression]],
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
          'line-opacity': ['case', ['==', ['coalesce', ['get', 'visible'], true], false], 0, layerOpacityExpression],
        }
      : {
          'line-color': ['coalesce', ['get', 'stroke'], drawFallbackStroke],
          'line-width': ['coalesce', ['get', 'strokeWidth'], 3],
          'line-opacity': ['case', ['==', ['coalesce', ['get', 'visible'], true], false], 0, layerOpacityExpression],
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
        'circle-opacity': ['case', ['==', ['coalesce', ['get', 'visible'], true], false], 0, layerOpacityExpression],
      },
    })
  }

  if (!map.value.getLayer(descriptor.labelLayerId)) {
    map.value.addLayer({
      id: descriptor.labelLayerId,
      type: 'symbol',
      source: descriptor.sourceId,
      layout: {
        'text-field': textFieldExpression,
        'text-size': ['coalesce', ['get', 'textSize'], 12],
        'text-offset': [0, 1.1],
        'text-anchor': ['coalesce', ['get', 'textAnchor'], 'top'],
        'text-rotate': ['coalesce', ['get', 'textRotate'], 0],
        'symbol-sort-key': ['coalesce', ['get', 'layerOrder'], 0],
      },
      paint: {
        'text-color': ['coalesce', ['get', 'textColor'], ['get', 'stroke'], drawFallbackStroke],
        'text-halo-color': ['coalesce', ['get', 'textHaloColor'], '#ffffff'],
        'text-halo-width': ['coalesce', ['get', 'textHaloWidth'], 1],
        'text-opacity': ['case', ['==', layerLabelsVisibleExpression, true], layerOpacityExpression, 0],
      },
    })
  }
}

const cleanupReadonlyLayerDescriptors = (layerDescriptors) => {
  if (!map.value) return
  const activeSourceIds = new Set(layerDescriptors.map((descriptor) => descriptor.sourceId))
  const currentReadonlySourceIds = (props.allLayers ?? [])
    .filter((layer) => layer?.id)
    .map((layer) => `readonly-draw-source-${layer.id}`)
  const currentPreviewSourceIds = (props.previewLayers ?? []).map((layer, index) => `preview-draw-source-${layer?.id ?? index}`)
  const candidateSourceIds = [
    ...currentReadonlySourceIds,
    ...previousReadonlySourceIds,
    ...currentPreviewSourceIds,
    ...previousPreviewSourceIds,
  ]

  candidateSourceIds.forEach((sourceId) => {
    if (activeSourceIds.has(sourceId)) return
    const isPreviewSource = sourceId.startsWith('preview-draw-source-')
    const sourcePrefix = isPreviewSource ? 'preview-draw-source-' : 'readonly-draw-source-'
    const idSuffix = sourceId.slice(sourcePrefix.length)
    const prefix = isPreviewSource ? 'preview' : 'readonly'
    const fillLayerId = `${prefix}-draw-fill-${idSuffix}`
    const lineLayerId = `${prefix}-draw-line-${idSuffix}`
    const pointLayerId = `${prefix}-draw-point-${idSuffix}`
    const labelLayerId = `${prefix}-draw-label-${idSuffix}`
    if (map.value.getLayer(labelLayerId)) map.value.removeLayer(labelLayerId)
    if (map.value.getLayer(pointLayerId)) map.value.removeLayer(pointLayerId)
    if (map.value.getLayer(lineLayerId)) map.value.removeLayer(lineLayerId)
    if (map.value.getLayer(fillLayerId)) map.value.removeLayer(fillLayerId)
    if (map.value.getSource(sourceId)) map.value.removeSource(sourceId)
  })

  previousReadonlySourceIds = currentReadonlySourceIds
  previousPreviewSourceIds = currentPreviewSourceIds
}

const removeReadonlyLayerById = (layerId) => {
  if (!map.value || !layerId) return

  const sourceId = `readonly-draw-source-${layerId}`
  const fillLayerId = `readonly-draw-fill-${layerId}`
  const lineLayerId = `readonly-draw-line-${layerId}`
  const pointLayerId = `readonly-draw-point-${layerId}`
  const labelLayerId = `readonly-draw-label-${layerId}`

  if (map.value.getLayer(labelLayerId)) map.value.removeLayer(labelLayerId)
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

const isDrawFeatureSelectable = (feature) => Boolean(
  feature
  && feature.properties?.visible !== false
  && feature.properties?.locked !== true
)

const isDrawFeatureSelectableById = (featureId) => isDrawFeatureSelectable(draw.value?.get?.(featureId))

const getSelectedFeatureIdsFromDraw = () => {
  const selectedIds = normalizeFeatureIds(draw.value?.getSelectedIds?.() ?? [])
    .filter(isDrawFeatureSelectableById)
  if (selectedIds.length > 0) return selectedIds
  const mode = draw.value?.getMode?.()
  if (mode === 'direct_select' && selectedFeatureId.value && isDrawFeatureSelectableById(selectedFeatureId.value)) {
    return [selectedFeatureId.value]
  }
  return selectedIds
}

const getSelectedVertexCountFromDraw = () => {
  const mode = draw.value?.getMode?.() || 'simple_select'
  if (mode !== 'direct_select') return 0
  const selectedPoints = draw.value?.getSelectedPoints?.()
  const selectedPointCount = Array.isArray(selectedPoints?.features) ? selectedPoints.features.length : 0
  return selectedPointCount || selectedVertexCoordPaths.value.length
}

const getSelectedPointCoordinatesFromDraw = () => {
  const selectedPoints = draw.value?.getSelectedPoints?.()
  const selectedPointCoordinates = (selectedPoints?.features ?? [])
    .map((feature) => feature?.geometry?.coordinates)
    .filter((coordinates) => Array.isArray(coordinates) && coordinates.length >= 2)
  if (selectedPointCoordinates.length > 0) return selectedPointCoordinates
  const feature = selectedFeatureId.value ? draw.value?.get?.(selectedFeatureId.value) : null
  return getCoordinatesForCoordPaths(feature, selectedVertexCoordPaths.value)
}

const areCoordinatesEqual = (left, right) => {
  if (!Array.isArray(left) || !Array.isArray(right)) return false
  return Number(left[0]) === Number(right[0]) && Number(left[1]) === Number(right[1])
}

const countSelectedCoordinates = (coordinates = [], selectedCoordinates = []) => {
  return coordinates.filter((coordinate) => (
    selectedCoordinates.some((selectedCoordinate) => areCoordinatesEqual(coordinate, selectedCoordinate))
  )).length
}

const getEditableRingCoordinates = (ring = []) => {
  if (ring.length > 1 && areCoordinatesEqual(ring[0], ring[ring.length - 1])) {
    return ring.slice(0, -1)
  }
  return ring
}

const getCoordinatePairs = (geometry) => {
  if (!geometry) return []
  if (geometry.type === 'Point') return [geometry.coordinates].filter((coordinate) => normalizeVertexCoordinate(coordinate))
  if (geometry.type === 'LineString') return (geometry.coordinates ?? []).filter((coordinate) => normalizeVertexCoordinate(coordinate))
  if (geometry.type === 'Polygon') {
    return (geometry.coordinates ?? [])
      .flatMap((ring) => getEditableRingCoordinates(ring))
      .filter((coordinate) => normalizeVertexCoordinate(coordinate))
  }
  if (geometry.type === 'MultiPoint' || geometry.type === 'MultiLineString' || geometry.type === 'MultiPolygon') {
    const coordinates = []
    iterateCoordinates(geometry.coordinates, (coordinate) => {
      if (normalizeVertexCoordinate(coordinate)) coordinates.push(coordinate)
    })
    return coordinates
  }
  return []
}

const getCoordinateSegments = (geometry) => {
  const segments = []
  if (!geometry) return segments
  if (geometry.type === 'LineString') {
    const coordinates = (geometry.coordinates ?? []).filter((coordinate) => normalizeVertexCoordinate(coordinate))
    coordinates.slice(1).forEach((coordinate, index) => {
      segments.push([coordinates[index], coordinate])
    })
    return segments
  }
  if (geometry.type === 'Polygon') {
    ;(geometry.coordinates ?? []).forEach((ring) => {
      const closedRing = closePolygonRing(ring)
      closedRing.slice(1).forEach((coordinate, index) => {
        segments.push([closedRing[index], coordinate])
      })
    })
    return segments
  }
  return segments
}

const isSnapReferenceLayerVisible = (layer) => layer?.visible !== false

const isSnapReferenceFeatureVisible = (feature) => feature?.properties?.visible !== false

const getSnapReferenceFeatures = (options = {}) => {
  const excludedFeatureId = String(options.excludeFeatureId || '')
  const activeFeatures = normalizeFeatureCollection(draw.value?.getAll?.() ?? props.modelValue).features ?? []
  const layerFeatures = (props.allLayers ?? [])
    .filter(isSnapReferenceLayerVisible)
    .flatMap((layer) => normalizeFeatureCollection(layer?.featureCollection).features ?? [])
  return [...activeFeatures, ...layerFeatures]
    .filter((feature) => {
      const featureId = getDrawFeatureId(feature)
      return feature?.geometry
        && isSnapReferenceFeatureVisible(feature)
        && (!excludedFeatureId || featureId !== excludedFeatureId)
    })
}

const projectCoordinate = (coordinate) => {
  if (!map.value || !normalizeVertexCoordinate(coordinate)) return null
  return map.value.project(coordinate)
}

const getSquaredScreenDistance = (left, right) => {
  if (!left || !right) return Infinity
  return ((left.x - right.x) ** 2) + ((left.y - right.y) ** 2)
}

const emptySnapPreviewFeatureCollection = () => featureCollection([])

const ensureSnapPreviewLayers = () => {
  if (!map.value) return

  if (!map.value.getSource(snapPreviewSourceId)) {
    map.value.addSource(snapPreviewSourceId, {
      type: 'geojson',
      data: emptySnapPreviewFeatureCollection(),
    })
  }

  if (!map.value.getLayer(snapPreviewGuideLayerId)) {
    map.value.addLayer({
      id: snapPreviewGuideLayerId,
      type: 'line',
      source: snapPreviewSourceId,
      filter: ['==', '$type', 'LineString'],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#0ea5e9',
        'line-width': 2,
        'line-dasharray': [1, 1],
        'line-opacity': 0.85,
      },
    })
  }

  if (!map.value.getLayer(snapPreviewPointLayerId)) {
    map.value.addLayer({
      id: snapPreviewPointLayerId,
      type: 'circle',
      source: snapPreviewSourceId,
      filter: ['==', '$type', 'Point'],
      paint: {
        'circle-radius': 7,
        'circle-color': '#0ea5e9',
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 3,
        'circle-opacity': 0.95,
      },
    })
  }
}

const setSnapPreview = (snapResult) => {
  if (!map.value) return
  ensureSnapPreviewLayers()
  const source = map.value.getSource(snapPreviewSourceId)
  if (!source) return
  if (!snapResult?.snapped || !normalizeVertexCoordinate(snapResult.coordinate)) {
    source.setData?.(emptySnapPreviewFeatureCollection())
    return
  }

  const features = []
  const originalCoordinate = normalizeVertexCoordinate(snapResult.originalCoordinate)
  const snappedCoordinate = normalizeVertexCoordinate(snapResult.coordinate)
  if (originalCoordinate && snappedCoordinate && !areCoordinatesEqual(originalCoordinate, snappedCoordinate)) {
    features.push({
      type: 'Feature',
      properties: {
        snapType: snapResult.type,
      },
      geometry: {
        type: 'LineString',
        coordinates: [originalCoordinate, snappedCoordinate],
      },
    })
  }
  features.push({
    type: 'Feature',
    properties: {
      snapType: snapResult.type,
    },
    geometry: {
      type: 'Point',
      coordinates: snappedCoordinate,
    },
  })
  source.setData?.(featureCollection(features))
}

const clearSnapPreview = () => {
  setSnapPreview(null)
}

const getNearestPointOnProjectedSegment = (targetPoint, startPoint, endPoint, startCoordinate, endCoordinate) => {
  const segmentX = endPoint.x - startPoint.x
  const segmentY = endPoint.y - startPoint.y
  const segmentLengthSquared = (segmentX ** 2) + (segmentY ** 2)
  if (segmentLengthSquared <= 0) return null
  const rawT = (((targetPoint.x - startPoint.x) * segmentX) + ((targetPoint.y - startPoint.y) * segmentY)) / segmentLengthSquared
  const t = Math.max(0, Math.min(1, rawT))
  return [
    startCoordinate[0] + ((endCoordinate[0] - startCoordinate[0]) * t),
    startCoordinate[1] + ((endCoordinate[1] - startCoordinate[1]) * t),
  ]
}

const maybeSnapCoordinateToGrid = (coordinate) => {
  const gridSize = Number(props.snapGridSize)
  if (!Number.isFinite(gridSize) || gridSize <= 0) return null
  const normalized = normalizeVertexCoordinate(coordinate)
  if (!normalized) return null
  return [
    Math.round(normalized[0] / gridSize) * gridSize,
    Math.round(normalized[1] / gridSize) * gridSize,
  ]
}

const resolveSnapResult = (coordinate, options = {}) => {
  const normalized = normalizeVertexCoordinate(coordinate)
  const fallback = {
    coordinate: normalized,
    originalCoordinate: normalized,
    snapped: false,
    type: '',
  }
  if (!normalized || props.snappingEnabled === false || options.snapping === false) return fallback
  const targetPoint = projectCoordinate(normalized)
  if (!targetPoint) return fallback
  const tolerance = Math.max(0, Number(props.snapTolerance) || 0)
  const toleranceSquared = tolerance ** 2
  let best = { coordinate: normalized, distanceSquared: Infinity, priority: -1, type: '' }

  const acceptCandidate = (candidateCoordinate, priority, type) => {
    const candidate = normalizeVertexCoordinate(candidateCoordinate)
    const candidatePoint = projectCoordinate(candidate)
    if (!candidatePoint) return
    const distanceSquared = getSquaredScreenDistance(targetPoint, candidatePoint)
    if (distanceSquared > toleranceSquared) return
    if (distanceSquared < best.distanceSquared || (distanceSquared === best.distanceSquared && priority > best.priority)) {
      best = { coordinate: candidate, distanceSquared, priority, type }
    }
  }

  getSnapReferenceFeatures(options).forEach((feature) => {
    getCoordinatePairs(feature.geometry).forEach((candidate) => {
      acceptCandidate(candidate, 3, 'vertex')
    })
    getCoordinateSegments(feature.geometry).forEach(([startCoordinate, endCoordinate]) => {
      const startPoint = projectCoordinate(startCoordinate)
      const endPoint = projectCoordinate(endCoordinate)
      const candidate = getNearestPointOnProjectedSegment(targetPoint, startPoint, endPoint, startCoordinate, endCoordinate)
      acceptCandidate(candidate, 2, 'edge')
    })
  })

  acceptCandidate(maybeSnapCoordinateToGrid(normalized), 1, 'grid')
  return {
    coordinate: best.coordinate,
    originalCoordinate: normalized,
    snapped: Boolean(best.type && !areCoordinatesEqual(normalized, best.coordinate)),
    type: best.type,
  }
}

const resolveSnappedCoordinate = (coordinate, options = {}) => {
  return resolveSnapResult(coordinate, options).coordinate
}

const closeSnappedRingIfNeeded = (originalRing = [], nextRing = []) => {
  if (originalRing.length > 1 && areCoordinatesEqual(originalRing[0], originalRing.at(-1)) && nextRing.length > 1) {
    return [
      ...nextRing.slice(0, -1),
      [...nextRing[0]],
    ]
  }
  return nextRing
}

const snapCoordinateForFeature = (featureId, coordinate) => {
  return resolveSnappedCoordinate(coordinate, { excludeFeatureId: featureId }) ?? coordinate
}

const snapGeometryCoordinatesForFeature = (geometry, featureId) => {
  if (!geometry?.type) return geometry

  if (geometry.type === 'Point') {
    return { ...geometry, coordinates: snapCoordinateForFeature(featureId, geometry.coordinates) }
  }

  if (geometry.type === 'LineString') {
    return {
      ...geometry,
      coordinates: (geometry.coordinates ?? []).map((coordinate) => snapCoordinateForFeature(featureId, coordinate)),
    }
  }

  if (geometry.type === 'Polygon') {
    return {
      ...geometry,
      coordinates: (geometry.coordinates ?? []).map((ring) => {
        const nextRing = (ring ?? []).map((coordinate) => snapCoordinateForFeature(featureId, coordinate))
        return closeSnappedRingIfNeeded(ring, nextRing)
      }),
    }
  }

  return geometry
}

const getDrawEventFeatureIds = (event = {}) => {
  return new Set((event?.features ?? [])
    .map((feature) => getDrawFeatureId(feature))
    .filter(Boolean))
}

const snapFeatureCollectionCoordinates = (featureCollection, options = {}) => {
  if (props.snappingEnabled === false || options.snapFeatures !== true || options.type === 'draw.delete') {
    return { featureCollection, changed: false }
  }

  const targetIds = getDrawEventFeatureIds(options)
  let changed = false
  const features = (featureCollection.features ?? []).map((feature) => {
    const featureId = getDrawFeatureId(feature)
    if (targetIds.size > 0 && !targetIds.has(featureId)) return feature
    const geometry = snapGeometryCoordinatesForFeature(feature.geometry, featureId)
    if (JSON.stringify(geometry) === JSON.stringify(feature.geometry)) return feature
    changed = true
    return { ...feature, geometry }
  })

  return {
    featureCollection: changed ? { ...featureCollection, features } : featureCollection,
    changed,
  }
}

const parseCoordPath = (coordPath) => {
  const parts = String(coordPath ?? '')
    .split('.')
    .map((part) => Number(part))
  if (parts.length === 0 || parts.some((part) => !Number.isInteger(part) || part < 0)) return null
  return parts
}

const normalizeVertexCoordinate = (coordinate) => {
  const longitude = Number(coordinate?.[0])
  const latitude = Number(coordinate?.[1])
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null
  return [longitude, latitude]
}

const cloneFeatureForGeometryEdit = (feature) => ({
  ...feature,
  properties: { ...(feature?.properties ?? {}) },
  geometry: feature?.geometry
    ? {
        ...feature.geometry,
        coordinates: structuredClone(feature.geometry.coordinates),
      }
    : feature?.geometry,
})

const closePolygonRing = (ring = []) => {
  const editableRing = getEditableRingCoordinates(ring)
  if (editableRing.length === 0) return []
  return [
    ...editableRing,
    [...editableRing[0]],
  ]
}

const isLineGeometryValid = (coordinates = []) => coordinates.length >= 2
  && coordinates.every((coordinate) => normalizeVertexCoordinate(coordinate))

const isPolygonGeometryValid = (coordinates = []) => coordinates.length > 0
  && coordinates.every((ring) => {
    const editableRing = getEditableRingCoordinates(ring)
    return editableRing.length >= 3
      && editableRing.every((coordinate) => normalizeVertexCoordinate(coordinate))
      && areCoordinatesEqual(ring[0], ring.at(-1))
  })

const normalizeExistingCoordPath = (feature, coordPath) => {
  const parts = parseCoordPath(coordPath)
  const geometry = feature?.geometry ?? {}
  if (!parts) return ''

  if (geometry.type === 'LineString') {
    const [coordinateIndex] = parts
    const coordinates = geometry.coordinates ?? []
    if (parts.length !== 1 || coordinateIndex >= coordinates.length) return ''
    return String(coordinateIndex)
  }

  if (geometry.type === 'Polygon') {
    const [ringIndex, coordinateIndex] = parts
    const ring = geometry.coordinates?.[ringIndex]
    if (parts.length !== 2 || !Array.isArray(ring)) return ''
    const editableRing = getEditableRingCoordinates(ring)
    if (coordinateIndex < editableRing.length) return `${ringIndex}.${coordinateIndex}`
    if (coordinateIndex === editableRing.length && areCoordinatesEqual(ring[0], ring.at(-1))) {
      return `${ringIndex}.0`
    }
  }

  return ''
}

const normalizeInsertCoordPath = (feature, coordPath) => {
  const parts = parseCoordPath(coordPath)
  const geometry = feature?.geometry ?? {}
  if (!parts) return ''

  if (geometry.type === 'LineString') {
    const [coordinateIndex] = parts
    const coordinates = geometry.coordinates ?? []
    if (parts.length !== 1 || coordinateIndex < 1 || coordinateIndex >= coordinates.length) return ''
    return String(coordinateIndex)
  }

  if (geometry.type === 'Polygon') {
    const [ringIndex, coordinateIndex] = parts
    const ring = geometry.coordinates?.[ringIndex]
    if (parts.length !== 2 || !Array.isArray(ring)) return ''
    const editableRing = getEditableRingCoordinates(ring)
    if (coordinateIndex < 1 || coordinateIndex > editableRing.length) return ''
    return `${ringIndex}.${coordinateIndex}`
  }

  return ''
}

const getCoordinatesForCoordPaths = (feature, coordPaths = []) => {
  const geometry = feature?.geometry ?? {}
  return coordPaths
    .map((coordPath) => normalizeExistingCoordPath(feature, coordPath))
    .filter(Boolean)
    .map((coordPath) => {
      const parts = parseCoordPath(coordPath)
      if (geometry.type === 'LineString') {
        return geometry.coordinates?.[parts[0]]
      }
      if (geometry.type === 'Polygon') {
        return getEditableRingCoordinates(geometry.coordinates?.[parts[0]] ?? [])[parts[1]]
      }
      return null
    })
    .filter(Boolean)
}

const getSelectedVertexState = () => {
  if (selectedVertexCoordPaths.value.length !== 1 || !selectedFeatureId.value) return null
  const feature = draw.value?.get?.(selectedFeatureId.value)
  const coordPath = normalizeExistingCoordPath(feature, selectedVertexCoordPaths.value[0])
  const coordinate = getCoordinatesForCoordPaths(feature, [coordPath])[0]
  const normalizedCoordinate = normalizeVertexCoordinate(coordinate)
  if (!feature || !coordPath || !normalizedCoordinate) return null
  return {
    featureId: selectedFeatureId.value,
    coordPath,
    coordinate: normalizedCoordinate,
  }
}

const deleteVerticesFromFeature = (feature, coordPaths = []) => {
  const geometry = feature?.geometry ?? {}
  const normalizedPaths = [...new Set(coordPaths
    .map((coordPath) => normalizeExistingCoordPath(feature, coordPath))
    .filter(Boolean))]
  if (normalizedPaths.length === 0) return null

  const nextFeature = cloneFeatureForGeometryEdit(feature)
  const nextGeometry = nextFeature.geometry

  if (geometry.type === 'LineString') {
    const indexes = normalizedPaths
      .map((coordPath) => Number(coordPath))
      .sort((left, right) => right - left)
    indexes.forEach((coordinateIndex) => {
      nextGeometry.coordinates.splice(coordinateIndex, 1)
    })
    return isLineGeometryValid(nextGeometry.coordinates) ? nextFeature : null
  }

  if (geometry.type === 'Polygon') {
    const pathsByRing = new Map()
    normalizedPaths.forEach((coordPath) => {
      const [ringIndex, coordinateIndex] = parseCoordPath(coordPath)
      const indexes = pathsByRing.get(ringIndex) ?? []
      indexes.push(coordinateIndex)
      pathsByRing.set(ringIndex, indexes)
    })
    pathsByRing.forEach((coordinateIndexes, ringIndex) => {
      const editableRing = getEditableRingCoordinates(nextGeometry.coordinates[ringIndex])
      coordinateIndexes
        .sort((left, right) => right - left)
        .forEach((coordinateIndex) => {
          editableRing.splice(coordinateIndex, 1)
        })
      nextGeometry.coordinates[ringIndex] = closePolygonRing(editableRing)
    })
    return isPolygonGeometryValid(nextGeometry.coordinates) ? nextFeature : null
  }

  return null
}

const insertVertexIntoFeature = (feature, coordPath, coordinate) => {
  const nextCoordinate = normalizeVertexCoordinate(coordinate)
  const normalizedPath = normalizeInsertCoordPath(feature, coordPath)
  if (!nextCoordinate || !normalizedPath) return null

  const nextFeature = cloneFeatureForGeometryEdit(feature)
  const nextGeometry = nextFeature.geometry
  const parts = parseCoordPath(normalizedPath)

  if (nextGeometry.type === 'LineString') {
    nextGeometry.coordinates.splice(parts[0], 0, nextCoordinate)
    return isLineGeometryValid(nextGeometry.coordinates) ? { feature: nextFeature, coordPath: normalizedPath } : null
  }

  if (nextGeometry.type === 'Polygon') {
    const [ringIndex, coordinateIndex] = parts
    const editableRing = getEditableRingCoordinates(nextGeometry.coordinates[ringIndex])
    editableRing.splice(coordinateIndex, 0, nextCoordinate)
    nextGeometry.coordinates[ringIndex] = closePolygonRing(editableRing)
    return isPolygonGeometryValid(nextGeometry.coordinates) ? { feature: nextFeature, coordPath: normalizedPath } : null
  }

  return null
}

const moveVertexInFeature = (feature, coordPath, coordinate) => {
  const nextCoordinate = normalizeVertexCoordinate(coordinate)
  const normalizedPath = normalizeExistingCoordPath(feature, coordPath)
  if (!nextCoordinate || !normalizedPath) return null

  const nextFeature = cloneFeatureForGeometryEdit(feature)
  const nextGeometry = nextFeature.geometry
  const parts = parseCoordPath(normalizedPath)

  if (nextGeometry.type === 'LineString') {
    nextGeometry.coordinates[parts[0]] = nextCoordinate
    return isLineGeometryValid(nextGeometry.coordinates) ? { feature: nextFeature, coordPath: normalizedPath } : null
  }

  if (nextGeometry.type === 'Polygon') {
    const [ringIndex, coordinateIndex] = parts
    const editableRing = getEditableRingCoordinates(nextGeometry.coordinates[ringIndex])
    editableRing[coordinateIndex] = nextCoordinate
    nextGeometry.coordinates[ringIndex] = closePolygonRing(editableRing)
    return isPolygonGeometryValid(nextGeometry.coordinates) ? { feature: nextFeature, coordPath: normalizedPath } : null
  }

  return null
}

const buildSplitFeatureId = (featureCollection, sourceId, reservedIds = new Set()) => {
  const existingIds = new Set([
    ...(featureCollection.features ?? []).map((feature) => getDrawFeatureId(feature)).filter(Boolean),
    ...reservedIds,
  ])
  let index = 1
  let nextId = `${String(sourceId || 'feature')}-split-${index}`
  while (existingIds.has(nextId)) {
    index += 1
    nextId = `${String(sourceId || 'feature')}-split-${index}`
  }
  return nextId
}

const cloneSplitLineFeature = (feature, id, coordinates) => ({
  ...feature,
  id,
  properties: {
    ...(feature?.properties ?? {}),
    id,
  },
  geometry: {
    ...feature.geometry,
    coordinates: coordinates.map((coordinate) => [...coordinate]),
  },
})

const splitLineFeatureAtCoordPath = (featureCollection, featureId, coordPath) => {
  const feature = featureId ? (featureCollection.features ?? []).find((item) => getDrawFeatureId(item) === String(featureId)) : null
  if (!feature || !isDrawFeatureSelectable(feature) || feature.geometry?.type !== 'LineString') return null
  const normalizedPath = normalizeExistingCoordPath(feature, coordPath)
  if (!normalizedPath) return null
  const splitIndex = Number(normalizedPath)
  const coordinates = (feature.geometry.coordinates ?? []).map((coordinate) => normalizeVertexCoordinate(coordinate))
  if (!coordinates.every(Boolean) || splitIndex <= 0 || splitIndex >= coordinates.length - 1) return null

  const firstCoordinates = coordinates.slice(0, splitIndex + 1)
  const secondCoordinates = coordinates.slice(splitIndex)
  if (!isLineGeometryValid(firstCoordinates) || !isLineGeometryValid(secondCoordinates)) return null
  const secondFeatureId = buildSplitFeatureId(featureCollection, featureId)
  const firstFeature = cloneSplitLineFeature(feature, String(featureId), firstCoordinates)
  const secondFeature = cloneSplitLineFeature(feature, secondFeatureId, secondCoordinates)
  return {
    featureCollection: {
      ...featureCollection,
      features: (featureCollection.features ?? []).flatMap((item) => (
        getDrawFeatureId(item) === String(featureId) ? [firstFeature, secondFeature] : [item]
      )),
    },
    featureIds: [String(featureId), secondFeatureId],
  }
}

const isCutterLineFeature = (feature) => Boolean(
  feature
  && isDrawFeatureSelectable(feature)
  && feature.geometry?.type === 'LineString'
  && isLineGeometryValid(feature.geometry.coordinates ?? [])
)

const splitLineNetwork = (lineFeature, splitterFeature) => {
  try {
    return lineSplit(lineFeature, splitterFeature).features ?? []
  } catch {
    return []
  }
}

const getInternalCutterLineSegments = (polygonFeature, cutterFeature) => {
  const segments = splitLineNetwork(cutterFeature, polygonToLine(polygonFeature))
  return segments.filter((segment) => (
    isLineGeometryValid(segment.geometry?.coordinates ?? [])
    && booleanPointInPolygon(pointOnFeature(segment), polygonFeature, { ignoreBoundary: false })
  ))
}

const buildPolygonSplitPieces = (polygonFeature, cutterFeature) => {
  if (!polygonFeature || polygonFeature.geometry?.type !== 'Polygon' || !isPolygonGeometryValid(polygonFeature.geometry.coordinates ?? [])) return []
  if (!isCutterLineFeature(cutterFeature)) return []
  const boundarySegments = splitLineNetwork(polygonToLine(polygonFeature), cutterFeature)
  const cutterSegments = getInternalCutterLineSegments(polygonFeature, cutterFeature)
  if (boundarySegments.length === 0 || cutterSegments.length === 0) return []

  try {
    return (polygonize(featureCollection([...boundarySegments, ...cutterSegments])).features ?? [])
      .filter((piece) => (
        piece.geometry?.type === 'Polygon'
        && isPolygonGeometryValid(piece.geometry.coordinates ?? [])
        && area(piece) > 0
        && booleanPointInPolygon(pointOnFeature(piece), polygonFeature, { ignoreBoundary: false })
      ))
  } catch {
    return []
  }
}

const cloneSplitPolygonFeature = (feature, id, geometry) => ({
  ...feature,
  id,
  properties: {
    ...(feature?.properties ?? {}),
    id,
  },
  geometry: {
    ...geometry,
    coordinates: structuredClone(geometry.coordinates),
  },
})

const splitPolygonFeatureWithLine = (featureCollection, featureId, cutterFeature) => {
  const feature = featureId ? (featureCollection.features ?? []).find((item) => getDrawFeatureId(item) === String(featureId)) : null
  if (!feature || !isDrawFeatureSelectable(feature) || feature.geometry?.type !== 'Polygon') return null
  const pieces = buildPolygonSplitPieces(feature, cutterFeature)
  if (pieces.length < 2) return null

  const splitFeatures = pieces
    .sort((left, right) => area(right) - area(left))
    .reduce((items, piece, index) => {
      const reservedIds = new Set(items.map((item) => getDrawFeatureId(item)))
      const id = index === 0 ? String(featureId) : buildSplitFeatureId(featureCollection, featureId, reservedIds)
      items.push(cloneSplitPolygonFeature(feature, id, piece.geometry))
      return items
    }, [])
  const featureIds = splitFeatures.map((item) => getDrawFeatureId(item))
  return {
    featureCollection: {
      ...featureCollection,
      features: (featureCollection.features ?? []).flatMap((item) => (
        getDrawFeatureId(item) === String(featureId) ? splitFeatures : [item]
      )),
    },
    featureIds,
  }
}

const canDeleteVerticesByCoordPaths = (feature, coordPaths = []) => {
  return Boolean(deleteVerticesFromFeature(feature, coordPaths))
}

const canDeleteSelected = () => {
  if (draw.value?.getMode?.() !== 'direct_select') return true
  const featureId = selectedFeatureId.value
  const feature = featureId ? draw.value?.get?.(featureId) : null
  if (feature && selectedVertexCoordPaths.value.length > 0) {
    return canDeleteVerticesByCoordPaths(feature, selectedVertexCoordPaths.value)
  }
  const selectedCoordinates = getSelectedPointCoordinatesFromDraw()
  if (!feature || selectedCoordinates.length === 0) return false

  const geometry = feature.geometry ?? {}
  if (geometry.type === 'LineString') {
    const coordinates = geometry.coordinates ?? []
    const selectedCount = countSelectedCoordinates(coordinates, selectedCoordinates)
    return selectedCount > 0 && coordinates.length - selectedCount >= 2
  }
  if (geometry.type === 'Polygon') {
    return (geometry.coordinates ?? []).every((ring) => {
      const editableRing = getEditableRingCoordinates(ring)
      const selectedCount = countSelectedCoordinates(editableRing, selectedCoordinates)
      return selectedCount === 0 || editableRing.length - selectedCount >= 3
    })
  }
  return false
}

const syncShapeEditState = () => {
  const mode = draw.value?.getMode?.() || 'simple_select'
  const selectedVertexCount = getSelectedVertexCountFromDraw()
  emit('shape-edit-state-change', {
    mode,
    featureId: mode === 'direct_select' ? selectedFeatureId.value : '',
    selectedVertexCount,
    selectedVertex: mode === 'direct_select' ? getSelectedVertexState() : null,
    canDeleteSelectedVertices: mode === 'direct_select' && selectedVertexCount > 0 && canDeleteSelected(),
  })
}

const syncSelectedFeature = () => {
  const selectedIds = getSelectedFeatureIdsFromDraw()
  const previousSelectedFeatureId = selectedFeatureId.value
  selectedFeatureId.value = selectedIds[0] ? String(selectedIds[0]) : ''
  if (draw.value?.getMode?.() !== 'direct_select' || previousSelectedFeatureId !== selectedFeatureId.value) {
    selectedVertexCoordPaths.value = []
  }
  if (suppressedProgrammaticFeatureSelectionIds) {
    if (areFeatureIdsEqual(selectedIds, suppressedProgrammaticFeatureSelectionIds)) {
      syncShapeEditState()
      return
    }
    suppressedProgrammaticFeatureSelectionIds = null
  }
  emit('feature-select', selectedIds.length > 1 ? selectedIds : selectedFeatureId.value)
  syncShapeEditState()
}

const syncDrawMode = (event) => {
  if ((event?.mode || draw.value?.getMode?.()) !== 'direct_select') {
    selectedVertexCoordPaths.value = []
  }
  emit('mode-change', event?.mode || draw.value?.getMode?.() || 'simple_select')
  syncSelectedFeature()
}

const syncFeaturesFromDraw = (options = {}) => {
  const normalized = normalizeFeatureCollection(draw.value?.getAll?.())
  const { featureCollection, changed } = snapFeatureCollectionCoordinates(normalized, options)
  if (changed) {
    draw.value?.set?.(featureCollection)
  }
  const shouldCommitHistory = options.commitHistory !== false && !isDeletingSelected
  if (shouldCommitHistory) {
    emit('before-features-change')
  }
  emit('update:modelValue', featureCollection)
  emit('features-change', featureCollection)
  if (options.syncSelection !== false) {
    syncSelectedFeature()
  }
}

const setDrawMode = (mode) => {
  suppressedProgrammaticFeatureSelectionIds = null
  clearSnapPreview()
  if (mode !== 'draw_line_string') {
    clearPendingPolygonSplitSketch()
  }
  if (mode !== 'direct_select') {
    selectedVertexCoordPaths.value = []
  }
  draw.value?.changeMode?.(mode)
  if (mode === 'simple_select') {
    syncSelectedFeature()
  } else {
    syncShapeEditState()
  }
}

const selectFeature = (featureId, options = {}) => {
  suppressedProgrammaticFeatureSelectionIds = null
  clearSnapPreview()
  clearPendingPolygonSplitSketch()
  if (!draw.value || !featureId) {
    selectedFeatureId.value = ''
    selectedVertexCoordPaths.value = []
    emit('feature-select', selectedFeatureId.value)
    syncShapeEditState()
    return
  }

  const feature = draw.value?.get?.(featureId)
  if (!feature) {
    selectedFeatureId.value = ''
    selectedVertexCoordPaths.value = []
    emit('feature-select', selectedFeatureId.value)
    syncShapeEditState()
    return
  }

  if (!isDrawFeatureSelectable(feature)) {
    draw.value?.changeMode?.('simple_select', { featureIds: [] })
    emit('mode-change', 'simple_select')
    selectedFeatureId.value = ''
    selectedVertexCoordPaths.value = []
    syncShapeEditState()
    return
  }

  const shouldDirectEdit = options.directEdit !== false
  if (!shouldDirectEdit) {
    draw.value?.changeMode?.('simple_select', { featureIds: [featureId] })
    emit('mode-change', 'simple_select')
    selectedFeatureId.value = String(featureId)
    selectedVertexCoordPaths.value = []
    emit('feature-select', selectedFeatureId.value)
    syncShapeEditState()
    return
  }

  draw.value?.changeMode?.('simple_select')
  draw.value?.changeMode?.('direct_select', { featureId })
  emit('mode-change', 'direct_select')
  selectedFeatureId.value = String(featureId)
  emit('feature-select', selectedFeatureId.value)
  syncShapeEditState()
}

const selectFeatures = (featureIds = []) => {
  clearSnapPreview()
  clearPendingPolygonSplitSketch()
  if (!draw.value) {
    selectedFeatureId.value = ''
    selectedVertexCoordPaths.value = []
    return
  }

  const selectedIds = featureIds
    .map((featureId) => String(featureId || ''))
    .filter((featureId) => featureId && isDrawFeatureSelectableById(featureId))
  suppressedProgrammaticFeatureSelectionIds = selectedIds
  draw.value?.changeMode?.('simple_select', { featureIds: selectedIds })
  emit('mode-change', 'simple_select')
  selectedFeatureId.value = selectedIds[0] || ''
  selectedVertexCoordPaths.value = []
  syncShapeEditState()
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
  return isDrawFeatureSelectableById(featureId)
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

const replaceFeatureInDraw = (nextFeature, options = {}) => {
  if (!draw.value || !nextFeature || typeof draw.value.set !== 'function') return false
  const nextFeatureId = getDrawFeatureId(nextFeature)
  if (!nextFeatureId) return false

  const featureCollection = normalizeFeatureCollection(draw.value.getAll?.() ?? props.modelValue)
  const nextFeatures = (featureCollection.features ?? []).map((feature) => (
    getDrawFeatureId(feature) === nextFeatureId ? nextFeature : feature
  ))
  if (!nextFeatures.some((feature) => getDrawFeatureId(feature) === nextFeatureId)) return false

  draw.value.set({
    type: 'FeatureCollection',
    features: nextFeatures,
  })
  syncFeaturesFromDraw({
    commitHistory: options.commitHistory !== false,
    syncSelection: false,
  })
  return true
}

const selectVertex = (featureId, coordPath) => {
  suppressedProgrammaticFeatureSelectionIds = null
  const feature = featureId ? draw.value?.get?.(featureId) : null
  const normalizedPath = normalizeExistingCoordPath(feature, coordPath)
  if (!draw.value || !featureId || !feature || !isDrawFeatureSelectable(feature) || !normalizedPath) {
    return false
  }

  selectedVertexCoordPaths.value = [normalizedPath]
  draw.value?.changeMode?.('simple_select')
  draw.value?.changeMode?.('direct_select', { featureId, coordPath: normalizedPath })
  emit('mode-change', 'direct_select')
  selectedFeatureId.value = String(featureId)
  emit('feature-select', selectedFeatureId.value)
  syncShapeEditState()
  return true
}

const insertVertex = (featureId, coordPath, coordinate, options = {}) => {
  const feature = featureId ? draw.value?.get?.(featureId) : null
  if (!draw.value || !feature || !isDrawFeatureSelectable(feature)) return false
  const snapResult = resolveSnapResult(coordinate, {
    ...options,
    excludeFeatureId: featureId,
  })
  const result = insertVertexIntoFeature(feature, coordPath, snapResult.coordinate)
  if (!result) return false

  const didReplace = replaceFeatureInDraw(result.feature, options)
  if (!didReplace) return false
  setSnapPreview(snapResult)
  selectVertex(featureId, result.coordPath)
  return true
}

const moveVertex = (featureId, coordPath, coordinate, options = {}) => {
  const feature = featureId ? draw.value?.get?.(featureId) : null
  if (!draw.value || !feature || !isDrawFeatureSelectable(feature)) return false
  const snapResult = resolveSnapResult(coordinate, {
    ...options,
    excludeFeatureId: featureId,
  })
  const result = moveVertexInFeature(feature, coordPath, snapResult.coordinate)
  if (!result) return false

  const didReplace = replaceFeatureInDraw(result.feature, options)
  if (!didReplace) return false
  setSnapPreview(snapResult)
  selectVertex(featureId, result.coordPath)
  return true
}

const deleteVertices = (featureId, coordPaths, options = {}) => {
  const feature = featureId ? draw.value?.get?.(featureId) : null
  if (!draw.value || !feature || !isDrawFeatureSelectable(feature)) return false
  const nextFeature = deleteVerticesFromFeature(feature, coordPaths)
  if (!nextFeature) return false

  const didReplace = replaceFeatureInDraw(nextFeature, options)
  if (!didReplace) return false
  clearSnapPreview()
  selectedVertexCoordPaths.value = []
  draw.value?.changeMode?.('direct_select', { featureId })
  emit('mode-change', 'direct_select')
  selectedFeatureId.value = String(featureId)
  emit('feature-select', selectedFeatureId.value)
  syncShapeEditState()
  return true
}

const splitLineAtVertex = (featureId, coordPath, options = {}) => {
  if (!draw.value || !featureId) return false
  const featureCollection = normalizeFeatureCollection(draw.value.getAll?.() ?? props.modelValue)
  const result = splitLineFeatureAtCoordPath(featureCollection, featureId, coordPath)
  if (!result) return false

  draw.value.set(result.featureCollection)
  syncFeaturesFromDraw({
    commitHistory: options.commitHistory !== false,
    syncSelection: false,
  })
  selectFeatures(result.featureIds)
  return true
}

const canSplitLineAtVertex = (featureId, coordPath) => {
  if (!draw.value || !featureId) return false
  const featureCollection = normalizeFeatureCollection(draw.value.getAll?.() ?? props.modelValue)
  return Boolean(splitLineFeatureAtCoordPath(featureCollection, featureId, coordPath))
}

const splitPolygonWithLine = (featureId, cutterFeature, options = {}) => {
  if (!draw.value || !featureId) return false
  const featureCollection = normalizeFeatureCollection(draw.value.getAll?.() ?? props.modelValue)
  const result = splitPolygonFeatureWithLine(featureCollection, featureId, cutterFeature)
  if (!result) return false

  draw.value.set(result.featureCollection)
  syncFeaturesFromDraw({
    commitHistory: options.commitHistory !== false,
    syncSelection: false,
  })
  selectFeatures(result.featureIds)
  return true
}

const canSplitPolygonWithLine = (featureId, cutterFeature) => {
  if (!draw.value || !featureId) return false
  const featureCollection = normalizeFeatureCollection(draw.value.getAll?.() ?? props.modelValue)
  return Boolean(splitPolygonFeatureWithLine(featureCollection, featureId, cutterFeature))
}

const emitGeometryEditFeedback = (type, code) => {
  emit('geometry-edit-feedback', { type, code })
}

const clearPendingPolygonSplitSketch = () => {
  pendingPolygonSplitSketchFeatureId.value = ''
}

const buildFeatureCollectionWithoutFeatureIds = (featureCollection, featureIds = new Set()) => ({
  ...featureCollection,
  features: (featureCollection.features ?? []).filter((feature) => !featureIds.has(getDrawFeatureId(feature))),
})

const restorePolygonSplitSketchTargetSelection = (featureId) => {
  if (featureId && isDrawFeatureSelectableById(featureId)) {
    selectFeatures([featureId])
    return
  }
  selectFeatures([])
}

const finishPendingPolygonSplitSketch = (event = {}) => {
  const featureId = pendingPolygonSplitSketchFeatureId.value
  if (!featureId) return false
  clearPendingPolygonSplitSketch()

  const createdFeatureIds = getDrawEventFeatureIds(event)
  const featureCollection = normalizeFeatureCollection(draw.value?.getAll?.() ?? props.modelValue)
  const cleanedFeatureCollection = buildFeatureCollectionWithoutFeatureIds(featureCollection, createdFeatureIds)
  const cutterFeature = (event?.features ?? []).find(isCutterLineFeature)

  if (!cutterFeature) {
    draw.value?.set?.(cleanedFeatureCollection)
    emitGeometryEditFeedback('error', 'polygonSplitNoCutter')
    restorePolygonSplitSketchTargetSelection(featureId)
    return false
  }

  const result = splitPolygonFeatureWithLine(cleanedFeatureCollection, featureId, cutterFeature)
  if (!result) {
    draw.value?.set?.(cleanedFeatureCollection)
    emitGeometryEditFeedback('error', 'polygonSplitNoPieces')
    restorePolygonSplitSketchTargetSelection(featureId)
    return false
  }

  draw.value.set(result.featureCollection)
  syncFeaturesFromDraw({
    commitHistory: true,
    syncSelection: false,
  })
  selectFeatures(result.featureIds)
  emitGeometryEditFeedback('success', 'polygonSplitSuccess')
  return true
}

const startPolygonSplitSketch = (featureId) => {
  const normalizedFeatureId = String(featureId || selectedFeatureId.value || '')
  const feature = normalizedFeatureId ? draw.value?.get?.(normalizedFeatureId) : null
  if (!draw.value || !feature || !isDrawFeatureSelectable(feature) || feature.geometry?.type !== 'Polygon') {
    emitGeometryEditFeedback('error', 'polygonSplitNoTarget')
    return false
  }

  pendingPolygonSplitSketchFeatureId.value = normalizedFeatureId
  selectedFeatureId.value = normalizedFeatureId
  selectedVertexCoordPaths.value = []
  draw.value.changeMode?.('draw_line_string')
  emit('mode-change', 'draw_line_string')
  emitGeometryEditFeedback('info', 'polygonSplitSketchStarted')
  return true
}

const cancelPolygonSplitSketch = () => {
  const featureId = pendingPolygonSplitSketchFeatureId.value
  if (!featureId) return false
  clearPendingPolygonSplitSketch()
  restorePolygonSplitSketchTargetSelection(featureId)
  emitGeometryEditFeedback('info', 'polygonSplitSketchCanceled')
  return true
}

const deleteSelected = () => {
  if (!canDeleteSelected()) return false
  if (draw.value?.getMode?.() === 'direct_select' && selectedVertexCoordPaths.value.length > 0) {
    return deleteVertices(selectedFeatureId.value, selectedVertexCoordPaths.value, { commitHistory: false })
  }
  isDeletingSelected = true
  try {
    clearSnapPreview()
    draw.value?.trash?.()
    syncFeaturesFromDraw({ commitHistory: false })
    return true
  } finally {
    isDeletingSelected = false
  }
}

const clearAll = () => {
  draw.value?.deleteAll?.()
  clearPendingPolygonSplitSketch()
  clearSnapPreview()
  selectedVertexCoordPaths.value = []
  syncFeaturesFromDraw({ commitHistory: false })
}

const importGeoJson = (featureCollection, options = {}) => {
  if (!draw.value) return

  clearPendingPolygonSplitSketch()
  clearSnapPreview()
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
  selectedVertexCoordPaths.value = []
  if (shouldEmitChanges) {
    syncFeaturesFromDraw()
  } else if (options.emitSelection !== false) {
    syncSelectedFeature()
  }
}

const handleDrawCreate = (event) => {
  if (pendingPolygonSplitSketchFeatureId.value) {
    finishPendingPolygonSplitSketch(event)
    return
  }
  syncFeaturesFromDraw({ ...event, snapFeatures: true })
}

const mountHiddenDrawControls = () => {
  const controlGroup = mapContainer.value?.querySelector('.mapboxgl-ctrl-group')
  controlGroup?.classList.add(drawControlContainerClass)
}

const bindDrawEvents = () => {
  map.value.on('draw.create', handleDrawCreate)
  map.value.on('draw.update', (event) => syncFeaturesFromDraw({ ...event, snapFeatures: true }))
  map.value.on('draw.delete', syncFeaturesFromDraw)
  map.value.on('draw.selectionchange', syncSelectedFeature)
  map.value.on('draw.modechange', syncDrawMode)
}

const initializeDraw = () => {
  draw.value = new MapboxDraw({
    displayControlsDefault: false,
    keybindings: false,
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
  ensureSnapPreviewLayers()

  const initialFeatures = normalizeFeatureCollection(props.modelValue)
  if (initialFeatures.features.length > 0) {
    draw.value.set(initialFeatures)
  }
}

const restoreLayersAfterStyleLoad = () => {
  if (!map.value) return

  syncReadonlyLayers()
  ensureSnapPreviewLayers()

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
    layerIds.add(descriptor.labelLayerId)
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

    if (snapPreviewLayerIds.has(layer.id)) {
      setLayerVisibility(layer.id, false)
      return
    }

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
        || descriptor.labelLayerId === layer.id
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
  map.value.on('click', (e) => {
    emit('map-click', { lng: e.lngLat.lng, lat: e.lngLat.lat })
  })
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
    try {
      map.value.setFeatureState(
        { source: hoveredFeatureSource, id: hoveredFeatureKey },
        { hover: false }
      )
    } catch {
      /* source may have been removed (e.g. voronoi preview cleared) */
    }
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
  const isPoint = pointLayerIds.includes(feature.layer?.id)
  if (!key || !source) {
    resetHoveredFeature()
    return
  }

  const hoverId = isPoint ? `${key}-${feature.properties?.name ?? ''}` : key
  if (hoverId === hoveredFeatureKey && source === hoveredFeatureSource) return

  resetHoveredFeature()

  hoveredFeatureKey = hoverId
  hoveredFeatureSource = source
  if (!isPoint) {
    map.value.setFeatureState(
      { source, id: key },
      { hover: true }
    )
  }
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
  () => props.activeLayer?.id,
  () => {
    if (!map.value) return
    syncReadonlyLayers()
  }
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
  selectVertex,
  insertVertex,
  moveVertex,
  canSplitLineAtVertex,
  splitLineAtVertex,
  canSplitPolygonWithLine,
  splitPolygonWithLine,
  startPolygonSplitSketch,
  cancelPolygonSplitSketch,
  selectedFeatureId,
  updateFeatureProperties,
  canDeleteSelected,
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
