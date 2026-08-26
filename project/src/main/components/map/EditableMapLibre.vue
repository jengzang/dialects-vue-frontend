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
const regularTextFontExpression = ['literal', ['Open Sans Regular', 'Arial Unicode MS Regular']]
const boldTextFontExpression = ['literal', ['Open Sans Bold', 'Arial Unicode MS Bold']]
const activeTextFontExpression = [
  'case',
  ['==', ['coalesce', ['get', 'user_textFontWeight'], 'regular'], 'bold'],
  boldTextFontExpression,
  regularTextFontExpression,
]
const layerTextFontExpression = [
  'case',
  ['==', ['coalesce', ['get', 'textFontWeight'], 'regular'], 'bold'],
  boldTextFontExpression,
  regularTextFontExpression,
]
const activeTextScaleVisibleExpression = ['coalesce', ['get', 'user_textScaleVisible'], true]
const layerTextScaleVisibleExpression = ['coalesce', ['get', 'textScaleVisible'], true]
const activeTextOffsetExpression = ['coalesce', ['get', 'user_textOffset'], ['literal', [0, 1.1]]]
const layerTextOffsetExpression = ['coalesce', ['get', 'textOffset'], ['literal', [0, 1.1]]]
const defaultTextLineHeight = 1.2
const defaultTextAllowOverlap = false
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
    id: 'gl-draw-label-background',
    type: 'symbol',
    filter: ['all', ['!=', 'meta', 'midpoint'], ['!=', 'meta', 'vertex'], ['!=', 'mode', 'static'], ['!=', 'user_visible', false]],
    layout: {
      'text-field': textFieldExpression,
      'text-size': ['coalesce', ['get', 'user_textSize'], 12],
      'text-offset': activeTextOffsetExpression,
      'text-anchor': ['coalesce', ['get', 'user_textAnchor'], 'top'],
      'text-rotate': ['coalesce', ['get', 'user_textRotate'], 0],
      'text-font': activeTextFontExpression,
      'text-justify': ['coalesce', ['get', 'user_textAlign'], 'center'],
      'text-line-height': defaultTextLineHeight,
      'text-letter-spacing': ['coalesce', ['get', 'user_textLetterSpacing'], 0],
      'text-max-width': ['coalesce', ['get', 'user_textMaxWidth'], 12],
      'text-allow-overlap': defaultTextAllowOverlap,
      'text-ignore-placement': defaultTextAllowOverlap,
      'symbol-sort-key': ['coalesce', ['get', 'user_textPriority'], 0],
    },
    paint: {
      'text-color': ['coalesce', ['get', 'user_textBackgroundColor'], '#ffffff'],
      'text-halo-color': ['coalesce', ['get', 'user_textBackgroundColor'], '#ffffff'],
      'text-halo-width': ['case', ['==', ['coalesce', ['get', 'user_textBackgroundEnabled'], false], true], ['coalesce', ['get', 'user_textBackgroundPadding'], 2], 0],
      'text-opacity': ['case', ['all', ['==', activeLayerLabelsVisibleExpression, true], activeTextScaleVisibleExpression, ['==', ['coalesce', ['get', 'user_textBackgroundEnabled'], false], true]], ['coalesce', ['get', 'user_textBackgroundOpacity'], 0.75], 0],
    },
  },
  {
    id: 'gl-draw-label',
    type: 'symbol',
    filter: ['all', ['!=', 'meta', 'midpoint'], ['!=', 'meta', 'vertex'], ['!=', 'mode', 'static'], ['!=', 'user_visible', false]],
    layout: {
      'text-field': textFieldExpression,
      'text-size': ['coalesce', ['get', 'user_textSize'], 12],
      'text-offset': activeTextOffsetExpression,
      'text-anchor': ['coalesce', ['get', 'user_textAnchor'], 'top'],
      'text-rotate': ['coalesce', ['get', 'user_textRotate'], 0],
      'text-font': activeTextFontExpression,
      'text-justify': ['coalesce', ['get', 'user_textAlign'], 'center'],
      'text-line-height': defaultTextLineHeight,
      'text-letter-spacing': ['coalesce', ['get', 'user_textLetterSpacing'], 0],
      'text-max-width': ['coalesce', ['get', 'user_textMaxWidth'], 12],
      'text-allow-overlap': defaultTextAllowOverlap,
      'text-ignore-placement': defaultTextAllowOverlap,
      'symbol-sort-key': ['coalesce', ['get', 'user_textPriority'], 0],
    },
    paint: {
      'text-color': ['coalesce', ['get', 'user_textColor'], ['get', 'user_stroke'], drawFallbackStroke],
      'text-halo-color': ['coalesce', ['get', 'user_textHaloColor'], '#ffffff'],
      'text-halo-width': ['coalesce', ['get', 'user_textHaloWidth'], 1],
      'text-opacity': ['case', ['all', ['==', activeLayerLabelsVisibleExpression, true], activeTextScaleVisibleExpression], activeLayerOpacityExpression, 0],
    },
  },
]
const featureBoxSelectableLayerIds = [
  'gl-draw-polygon-fill',
  'gl-draw-polygon-stroke',
  'gl-draw-line',
  'gl-draw-point',
]
const editTargetHoverLayerIds = [
  'gl-draw-active-vertex',
  'gl-draw-vertex',
  'gl-draw-midpoint',
  'gl-draw-line',
  'gl-draw-polygon-stroke',
]
const snapPreviewSourceId = 'draw-snap-preview-source'
const snapPreviewGuideLayerId = 'draw-snap-preview-guide'
const snapPreviewPointLayerId = 'draw-snap-preview-point'
const snapPreviewLayerIds = new Set([snapPreviewGuideLayerId, snapPreviewPointLayerId])
const textLeaderSourceId = 'draw-text-leader-source'
const textLeaderLayerId = 'draw-text-leader-line'
const textBackgroundSourceId = 'draw-text-background-source'
const textBackgroundFillLayerId = 'draw-text-background-fill'
const textBackgroundLineLayerId = 'draw-text-background-line'
const textHelperLayerIds = new Set([textLeaderLayerId, textBackgroundFillLayerId, textBackgroundLineLayerId])
const snapPriorityBiasSquared = 1
const createDefaultSnapTargets = () => ({
  vertex: true,
  midpoint: true,
  edge: true,
  grid: true,
  reference: true,
})

const normalizeSnapTargets = (value = {}) => {
  const defaults = createDefaultSnapTargets()
  return Object.fromEntries(
    Object.entries(defaults).map(([key, defaultValue]) => [key, value?.[key] ?? defaultValue])
  )
}

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
  snapTargets: {
    type: Object,
    default: () => ({
      vertex: true,
      midpoint: true,
      edge: true,
      grid: true,
      reference: true,
    }),
  },
  topologyEditingEnabled: {
    type: Boolean,
    default: true,
  },
  sharedBoundaryProtectionEnabled: {
    type: Boolean,
    default: true,
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
  'snap-state-change',
  'edit-target-hover',
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
let lastEditTargetHoverKey = ''
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
          annotationText: feature.properties?.annotationText ?? layer.annotationText,
          textSize: feature.properties?.textSize ?? layer.textSize,
          textColor: feature.properties?.textColor ?? layer.textColor,
          textHaloColor: feature.properties?.textHaloColor ?? layer.textHaloColor,
          textHaloWidth: feature.properties?.textHaloWidth ?? layer.textHaloWidth,
          textRotate: feature.properties?.textRotate ?? layer.textRotate,
          textAnchor: feature.properties?.textAnchor ?? layer.textAnchor,
          textAllowOverlap: feature.properties?.textAllowOverlap ?? layer.textAllowOverlap ?? false,
          textPriority: feature.properties?.textPriority ?? layer.textPriority ?? 0,
          textLineHeight: feature.properties?.textLineHeight ?? layer.textLineHeight ?? 1.2,
          textLetterSpacing: feature.properties?.textLetterSpacing ?? layer.textLetterSpacing ?? 0,
          textAlign: feature.properties?.textAlign ?? layer.textAlign ?? 'center',
          textMaxWidth: feature.properties?.textMaxWidth ?? layer.textMaxWidth ?? 12,
          textMinZoom: feature.properties?.textMinZoom ?? layer.textMinZoom ?? 0,
          textMaxZoom: feature.properties?.textMaxZoom ?? layer.textMaxZoom ?? 24,
          textScaleVisible: isTextScaleVisible(feature, layer),
          textBackgroundEnabled: feature.properties?.textBackgroundEnabled ?? layer.textBackgroundEnabled ?? false,
          textBackgroundColor: feature.properties?.textBackgroundColor ?? layer.textBackgroundColor ?? '#ffffff',
          textBackgroundOpacity: feature.properties?.textBackgroundOpacity ?? layer.textBackgroundOpacity ?? 0.75,
          textBackgroundPadding: feature.properties?.textBackgroundPadding ?? layer.textBackgroundPadding ?? 2,
          textLeaderLine: feature.properties?.textLeaderLine ?? layer.textLeaderLine ?? false,
          textLeaderColor: feature.properties?.textLeaderColor ?? layer.textLeaderColor ?? feature.properties?.textColor ?? layer.textColor ?? layer.stroke,
          textLeaderWidth: feature.properties?.textLeaderWidth ?? layer.textLeaderWidth ?? 1.5,
          textOffset: feature.properties?.textOffset ?? layer.textOffset ?? [
            feature.properties?.textOffsetX ?? layer.textOffsetX ?? 0,
            feature.properties?.textOffsetY ?? layer.textOffsetY ?? 1.1,
          ],
          textFontWeight: feature.properties?.textFontWeight ?? layer.textFontWeight ?? 'regular',
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
        labelBackgroundLayerId: `readonly-draw-label-background-${layer.id}`,
        labelLayerId: `readonly-draw-label-${layer.id}`,
        textAllowOverlap: layer.textAllowOverlap ?? defaultTextAllowOverlap,
        textLineHeight: layer.textLineHeight ?? defaultTextLineHeight,
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

  if (descriptor.labelBackgroundLayerId && !map.value.getLayer(descriptor.labelBackgroundLayerId)) {
    map.value.addLayer({
      id: descriptor.labelBackgroundLayerId,
      type: 'symbol',
      source: descriptor.sourceId,
      layout: {
        'text-field': textFieldExpression,
        'text-size': ['coalesce', ['get', 'textSize'], 12],
        'text-offset': layerTextOffsetExpression,
        'text-anchor': ['coalesce', ['get', 'textAnchor'], 'top'],
        'text-rotate': ['coalesce', ['get', 'textRotate'], 0],
        'text-font': layerTextFontExpression,
        'text-justify': ['coalesce', ['get', 'textAlign'], 'center'],
        'text-line-height': getFiniteTextStyleNumber(descriptor.textLineHeight, defaultTextLineHeight),
        'text-letter-spacing': ['coalesce', ['get', 'textLetterSpacing'], 0],
        'text-max-width': ['coalesce', ['get', 'textMaxWidth'], 12],
        'text-allow-overlap': descriptor.textAllowOverlap === true,
        'text-ignore-placement': descriptor.textAllowOverlap === true,
        'symbol-sort-key': ['coalesce', ['get', 'textPriority'], ['get', 'layerOrder'], 0],
      },
      paint: {
        'text-color': ['coalesce', ['get', 'textBackgroundColor'], '#ffffff'],
        'text-halo-color': ['coalesce', ['get', 'textBackgroundColor'], '#ffffff'],
        'text-halo-width': ['case', ['==', ['coalesce', ['get', 'textBackgroundEnabled'], false], true], ['coalesce', ['get', 'textBackgroundPadding'], 2], 0],
        'text-opacity': ['case', ['all', ['==', layerLabelsVisibleExpression, true], layerTextScaleVisibleExpression, ['==', ['coalesce', ['get', 'textBackgroundEnabled'], false], true]], ['coalesce', ['get', 'textBackgroundOpacity'], 0.75], 0],
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
        'text-offset': layerTextOffsetExpression,
        'text-anchor': ['coalesce', ['get', 'textAnchor'], 'top'],
        'text-rotate': ['coalesce', ['get', 'textRotate'], 0],
        'text-font': layerTextFontExpression,
        'text-justify': ['coalesce', ['get', 'textAlign'], 'center'],
        'text-line-height': getFiniteTextStyleNumber(descriptor.textLineHeight, defaultTextLineHeight),
        'text-letter-spacing': ['coalesce', ['get', 'textLetterSpacing'], 0],
        'text-max-width': ['coalesce', ['get', 'textMaxWidth'], 12],
        'text-allow-overlap': descriptor.textAllowOverlap === true,
        'text-ignore-placement': descriptor.textAllowOverlap === true,
        'symbol-sort-key': ['coalesce', ['get', 'textPriority'], ['get', 'layerOrder'], 0],
      },
      paint: {
        'text-color': ['coalesce', ['get', 'textColor'], ['get', 'stroke'], drawFallbackStroke],
        'text-halo-color': ['coalesce', ['get', 'textHaloColor'], '#ffffff'],
        'text-halo-width': ['coalesce', ['get', 'textHaloWidth'], 1],
        'text-opacity': ['case', ['all', ['==', layerLabelsVisibleExpression, true], layerTextScaleVisibleExpression], layerOpacityExpression, 0],
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
    const labelBackgroundLayerId = `${prefix}-draw-label-background-${idSuffix}`
    const labelLayerId = `${prefix}-draw-label-${idSuffix}`
    if (map.value.getLayer(labelLayerId)) map.value.removeLayer(labelLayerId)
    if (map.value.getLayer(labelBackgroundLayerId)) map.value.removeLayer(labelBackgroundLayerId)
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
  const labelBackgroundLayerId = `readonly-draw-label-background-${layerId}`
  const labelLayerId = `readonly-draw-label-${layerId}`

  if (map.value.getLayer(labelLayerId)) map.value.removeLayer(labelLayerId)
  if (map.value.getLayer(labelBackgroundLayerId)) map.value.removeLayer(labelBackgroundLayerId)
  if (map.value.getLayer(pointLayerId)) map.value.removeLayer(pointLayerId)
  if (map.value.getLayer(lineLayerId)) map.value.removeLayer(lineLayerId)
  if (map.value.getLayer(fillLayerId)) map.value.removeLayer(fillLayerId)
  if (map.value.getSource(sourceId)) map.value.removeSource(sourceId)
}

const getTextStyleValue = (feature, layer, key, fallback) => {
  return feature?.properties?.[key] ?? layer?.[key] ?? fallback
}

const getFiniteTextStyleNumber = (value, fallback) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

const getTextOffset = (feature, layer) => {
  const offsetXValue = getTextStyleValue(feature, layer, 'textOffsetX')
  const offsetYValue = getTextStyleValue(feature, layer, 'textOffsetY')
  if (offsetXValue !== undefined || offsetYValue !== undefined) {
    const offsetX = Number(offsetXValue)
    const offsetY = Number(offsetYValue)
    return [
      Number.isFinite(offsetX) ? offsetX : 0,
      Number.isFinite(offsetY) ? offsetY : 1.1,
    ]
  }
  const offset = getTextStyleValue(feature, layer, 'textOffset', [0, 1.1])
  const offsetX = Number(offset?.[0])
  const offsetY = Number(offset?.[1])
  return [
    Number.isFinite(offsetX) ? offsetX : 0,
    Number.isFinite(offsetY) ? offsetY : 1.1,
  ]
}

const getTextLabel = (feature, layer) => {
  const properties = feature?.properties ?? {}
  const candidates = [
    properties.annotationText,
    layer?.annotationText,
    properties.name,
    properties.title,
    properties.label,
  ]
  const label = candidates.find((item) => String(item ?? '').trim())
  return String(label ?? '')
}

const shouldRenderTextBackground = (feature, layer) => {
  return Boolean(
    feature?.geometry?.type === 'Point'
    && getTextStyleValue(feature, layer, 'visible', true) !== false
    && getTextStyleValue(feature, layer, 'labelsVisible', false) === true
    && getTextStyleValue(feature, layer, 'textBackgroundEnabled', false) === true
    && isTextScaleVisible(feature, layer)
    && getTextLabel(feature, layer).trim()
  )
}

const shouldRenderTextLeader = (feature, layer) => {
  return Boolean(
    feature?.geometry?.type === 'Point'
    && getTextStyleValue(feature, layer, 'visible', true) !== false
    && getTextStyleValue(feature, layer, 'labelsVisible', false) === true
    && getTextStyleValue(feature, layer, 'textLeaderLine', false) === true
    && isTextScaleVisible(feature, layer)
  )
}

const isTextScaleVisible = (feature, layer) => {
  const zoom = Number(map.value?.getZoom?.())
  if (!Number.isFinite(zoom)) return true
  const minZoom = Number(getTextStyleValue(feature, layer, 'textMinZoom', 0))
  const maxZoom = Number(getTextStyleValue(feature, layer, 'textMaxZoom', 24))
  const safeMinZoom = Number.isFinite(minZoom) ? minZoom : 0
  const safeMaxZoom = Number.isFinite(maxZoom) ? maxZoom : 24
  return zoom >= safeMinZoom && zoom <= safeMaxZoom
}

const syncActiveTextScaleVisibility = () => {
  if (!map.value || !draw.value || !['Point', 'Text'].includes(props.activeLayer?.geometryType)) return
  const features = normalizeFeatureCollection(draw.value.getAll?.()).features ?? []
  features.forEach((feature) => {
    const featureId = getDrawFeatureId(feature)
    if (!featureId) return
    const nextVisible = isTextScaleVisible(feature, props.activeLayer)
    if (feature.properties?.textScaleVisible !== nextVisible) {
      draw.value.setFeatureProperty?.(featureId, 'textScaleVisible', nextVisible)
    }
  })
}

const syncActiveTextLayoutConstants = () => {
  if (!map.value) return
  const textLineHeight = getFiniteTextStyleNumber(props.activeLayer?.textLineHeight, defaultTextLineHeight)
  const textAllowOverlap = props.activeLayer?.textAllowOverlap === true
  ;['gl-draw-label-background', 'gl-draw-label'].forEach((layerId) => {
    if (!map.value.getLayer(layerId)) return
    map.value.setLayoutProperty?.(layerId, 'text-line-height', textLineHeight)
    map.value.setLayoutProperty?.(layerId, 'text-allow-overlap', textAllowOverlap)
    map.value.setLayoutProperty?.(layerId, 'text-ignore-placement', textAllowOverlap)
  })
}

const buildTextBackgroundFeature = (feature, layer, layerId = '') => {
  if (!map.value || !shouldRenderTextBackground(feature, layer)) return null
  const coordinate = normalizeVertexCoordinate(feature.geometry.coordinates)
  if (!coordinate) return null
  const label = getTextLabel(feature, layer)
  const lines = label.split(/\r?\n/)
  const textSize = getFiniteTextStyleNumber(getTextStyleValue(feature, layer, 'textSize', 16), 16)
  const lineHeight = getFiniteTextStyleNumber(getTextStyleValue(feature, layer, 'textLineHeight', defaultTextLineHeight), defaultTextLineHeight)
  const maxWidth = Math.max(1, getFiniteTextStyleNumber(getTextStyleValue(feature, layer, 'textMaxWidth', 12), 12))
  const padding = Math.max(0, getFiniteTextStyleNumber(getTextStyleValue(feature, layer, 'textBackgroundPadding', 2), 2))
  const [offsetX, offsetY] = getTextOffset(feature, layer)
  const wrappedLineCount = lines.reduce((count, line) => {
    const length = Math.max(1, Array.from(line).length)
    return count + Math.max(1, Math.ceil(length / maxWidth))
  }, 0)
  const longestLineLength = Math.max(1, ...lines.map((line) => Array.from(line).length))
  const width = (Math.min(longestLineLength, maxWidth) * textSize * 0.62) + (padding * 2)
  const height = (Math.max(1, wrappedLineCount) * textSize * lineHeight) + (padding * 2)
  const anchorPoint = map.value.project(coordinate)
  let centerX = anchorPoint.x + (offsetX * textSize)
  let centerY = anchorPoint.y + (offsetY * textSize)
  const anchor = String(getTextStyleValue(feature, layer, 'textAnchor', 'top'))
  if (anchor.includes('left')) centerX += width / 2
  if (anchor.includes('right')) centerX -= width / 2
  if (anchor.includes('top')) centerY += height / 2
  if (anchor.includes('bottom')) centerY -= height / 2
  const screenCorners = [
    { x: centerX - (width / 2), y: centerY - (height / 2) },
    { x: centerX + (width / 2), y: centerY - (height / 2) },
    { x: centerX + (width / 2), y: centerY + (height / 2) },
    { x: centerX - (width / 2), y: centerY + (height / 2) },
  ]
  const coordinates = screenCorners
    .map((point) => normalizeVertexCoordinate(map.value.unproject?.(point)?.toArray?.()))
    .filter(Boolean)
  if (coordinates.length !== 4) return null
  coordinates.push([...coordinates[0]])
  return {
    type: 'Feature',
    properties: {
      layerId: String(layerId || feature?.properties?.layerId || ''),
      textBackgroundColor: getTextStyleValue(feature, layer, 'textBackgroundColor', '#ffffff'),
      textBackgroundOpacity: getFiniteTextStyleNumber(getTextStyleValue(feature, layer, 'textBackgroundOpacity', 0.75), 0.75),
    },
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates],
    },
  }
}

const buildTextBackgroundFeatures = () => {
  const activeFeatureCollection = normalizeFeatureCollection(draw.value?.getAll?.() ?? props.modelValue)
  const activeLayer = props.activeLayer ?? {}
  const activeFeatures = ['Point', 'Text'].includes(activeLayer.geometryType)
    ? (activeFeatureCollection.features ?? []).map((feature) => buildTextBackgroundFeature(feature, activeLayer, activeLayer.id))
    : []
  const readonlyFeatures = buildReadonlyLayerDescriptors()
    .flatMap((descriptor) => (descriptor.featureCollection.features ?? [])
      .map((feature) => buildTextBackgroundFeature(feature, feature.properties ?? {}, descriptor.layerId)))
  return [...activeFeatures, ...readonlyFeatures].filter(Boolean)
}

const ensureTextBackgroundLayers = () => {
  if (!map.value) return
  if (!map.value.getSource(textBackgroundSourceId)) {
    map.value.addSource(textBackgroundSourceId, {
      type: 'geojson',
      data: featureCollection([]),
    })
  }
  if (!map.value.getLayer(textBackgroundFillLayerId)) {
    map.value.addLayer({
      id: textBackgroundFillLayerId,
      type: 'fill',
      source: textBackgroundSourceId,
      paint: {
        'fill-color': ['coalesce', ['get', 'textBackgroundColor'], '#ffffff'],
        'fill-opacity': ['coalesce', ['get', 'textBackgroundOpacity'], 0.75],
      },
    }, map.value.getLayer('gl-draw-label') ? 'gl-draw-label' : undefined)
  }
  if (!map.value.getLayer(textBackgroundLineLayerId)) {
    map.value.addLayer({
      id: textBackgroundLineLayerId,
      type: 'line',
      source: textBackgroundSourceId,
      paint: {
        'line-color': ['coalesce', ['get', 'textBackgroundColor'], '#ffffff'],
        'line-opacity': ['coalesce', ['get', 'textBackgroundOpacity'], 0.75],
        'line-width': 1,
      },
    }, map.value.getLayer('gl-draw-label') ? 'gl-draw-label' : undefined)
  }
}

const syncTextBackgroundBoxes = () => {
  if (!map.value) return
  ensureTextBackgroundLayers()
  map.value.getSource(textBackgroundSourceId)?.setData?.(featureCollection(buildTextBackgroundFeatures()))
}

const buildTextLeaderFeature = (feature, layer, layerId = '') => {
  if (!map.value || !shouldRenderTextLeader(feature, layer)) return null
  const coordinate = normalizeVertexCoordinate(feature.geometry.coordinates)
  if (!coordinate) return null
  const [offsetX, offsetY] = getTextOffset(feature, layer)
  const textSize = Number(getTextStyleValue(feature, layer, 'textSize', 16)) || 16
  const startPoint = map.value.project(coordinate)
  const endPoint = {
    x: startPoint.x + (offsetX * textSize),
    y: startPoint.y + (offsetY * textSize),
  }
  const endCoordinate = map.value.unproject?.(endPoint)?.toArray?.()
  if (!normalizeVertexCoordinate(endCoordinate) || areCoordinatesEqual(coordinate, endCoordinate)) return null
  const leaderColor = getTextStyleValue(
    feature,
    layer,
    'textLeaderColor',
    getTextStyleValue(feature, layer, 'textColor', getTextStyleValue(feature, layer, 'stroke', drawFallbackStroke))
  )
  return {
    type: 'Feature',
    properties: {
      layerId: String(layerId || feature?.properties?.layerId || ''),
      textLeaderColor: leaderColor,
      textLeaderWidth: Number(getTextStyleValue(feature, layer, 'textLeaderWidth', 1.5)) || 1.5,
      opacity: Number(getTextStyleValue(feature, layer, 'opacity', 1)) || 1,
    },
    geometry: {
      type: 'LineString',
      coordinates: [coordinate, endCoordinate],
    },
  }
}

const buildTextLeaderFeatures = () => {
  const activeFeatureCollection = normalizeFeatureCollection(draw.value?.getAll?.() ?? props.modelValue)
  const activeLayer = props.activeLayer ?? {}
  const activeFeatures = ['Point', 'Text'].includes(activeLayer.geometryType)
    ? (activeFeatureCollection.features ?? []).map((feature) => buildTextLeaderFeature(feature, activeLayer, activeLayer.id))
    : []
  const readonlyFeatures = buildReadonlyLayerDescriptors()
    .flatMap((descriptor) => (descriptor.featureCollection.features ?? [])
      .map((feature) => buildTextLeaderFeature(feature, feature.properties ?? {}, descriptor.layerId)))
  return [...activeFeatures, ...readonlyFeatures].filter(Boolean)
}

const ensureTextLeaderLayer = () => {
  if (!map.value) return
  if (!map.value.getSource(textLeaderSourceId)) {
    map.value.addSource(textLeaderSourceId, {
      type: 'geojson',
      data: featureCollection([]),
    })
  }
  if (!map.value.getLayer(textLeaderLayerId)) {
    map.value.addLayer({
      id: textLeaderLayerId,
      type: 'line',
      source: textLeaderSourceId,
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': ['coalesce', ['get', 'textLeaderColor'], drawFallbackStroke],
        'line-width': ['coalesce', ['get', 'textLeaderWidth'], 1.5],
        'line-opacity': ['coalesce', ['get', 'opacity'], 1],
      },
    })
  }
}

const syncTextLeaderLines = () => {
  if (!map.value) return
  ensureTextLeaderLayer()
  map.value.getSource(textLeaderSourceId)?.setData?.(featureCollection(buildTextLeaderFeatures()))
}

const syncTextScaleVisibility = () => {
  syncActiveTextScaleVisibility()
  syncReadonlyLayers()
  syncTextBackgroundBoxes()
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
  syncTextBackgroundBoxes()
  syncTextLeaderLines()
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

const canInteractWithActiveDrawLayer = () => (
  props.activeLayer?.visible !== false
  && props.activeLayer?.locked !== true
)

const isDrawFeatureSelectable = (feature) => Boolean(
  feature
  && canInteractWithActiveDrawLayer()
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

const isSnapTargetEnabled = (target) => normalizeSnapTargets(props.snapTargets)[target] !== false

const getSnapFeatureName = (feature) => {
  const properties = feature?.properties ?? {}
  return String(
    properties.name
      ?? properties.title
      ?? properties.label
      ?? properties.annotationText
      ?? getDrawFeatureId(feature)
      ?? ''
  )
}

const getSnapReferenceItems = (options = {}) => {
  const excludedFeatureIds = new Set([
    String(options.excludeFeatureId || ''),
    ...(Array.isArray(options.excludeFeatureIds) ? options.excludeFeatureIds.map((featureId) => String(featureId || '')) : []),
  ].filter(Boolean))
  const activeFeatures = normalizeFeatureCollection(draw.value?.getAll?.() ?? props.modelValue).features ?? []
  const activeLayerId = String(props.activeLayer?.id || 'active-layer')
  const activeLayerName = String(props.activeLayer?.name || '')
  const activeFeatureItems = activeFeatures.map((feature) => ({
    feature,
    source: activeLayerId,
    layerName: activeLayerName,
    isActiveLayer: true,
  }))
  const layerFeatureItems = isSnapTargetEnabled('reference')
    ? (props.allLayers ?? [])
        .filter((layer) => String(layer?.id || '') !== activeLayerId)
        .filter(isSnapReferenceLayerVisible)
        .flatMap((layer) => (normalizeFeatureCollection(layer?.featureCollection).features ?? [])
          .map((feature) => ({
            feature,
            source: String(layer?.id || ''),
            layerName: String(layer?.name || ''),
            isActiveLayer: false,
          })))
    : []
  return [...activeFeatureItems, ...layerFeatureItems]
    .filter((item) => {
      const featureId = getDrawFeatureId(item.feature)
      return item.feature?.geometry
        && isSnapReferenceFeatureVisible(item.feature)
        && !excludedFeatureIds.has(featureId)
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
  if (snapResult?.snapped && normalizeVertexCoordinate(snapResult.coordinate)) {
    emit('snap-state-change', {
      active: true,
      type: snapResult.type || '',
      source: snapResult.source || '',
      layerName: snapResult.layerName || '',
      featureName: snapResult.featureName || '',
      coordinate: normalizeVertexCoordinate(snapResult.coordinate),
      originalCoordinate: normalizeVertexCoordinate(snapResult.originalCoordinate),
      distancePixels: Number.isFinite(Number(snapResult.distancePixels)) ? Number(snapResult.distancePixels) : null,
    })
  } else {
    emit('snap-state-change', { active: false })
  }
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
    source: '',
    layerName: '',
    featureName: '',
    featureId: '',
    isActiveLayer: false,
  }
  if (!normalized || props.snappingEnabled === false || options.snapping === false) return fallback
  const targetPoint = projectCoordinate(normalized)
  if (!targetPoint) return fallback
  const tolerance = Math.max(0, Number(props.snapTolerance) || 0)
  const toleranceSquared = tolerance ** 2
  let best = {
    coordinate: normalized,
    distanceSquared: Infinity,
    score: Infinity,
    priority: -1,
    type: '',
    source: '',
    layerName: '',
    featureName: '',
    featureId: '',
    isActiveLayer: false,
  }

  const acceptCandidate = (candidateCoordinate, priority, type, item = {}) => {
    const candidate = normalizeVertexCoordinate(candidateCoordinate)
    const candidatePoint = projectCoordinate(candidate)
    if (!candidatePoint) return
    const distanceSquared = getSquaredScreenDistance(targetPoint, candidatePoint)
    if (distanceSquared > toleranceSquared) return
    const score = distanceSquared - (priority * snapPriorityBiasSquared)
    if (
      score < best.score
      || (score === best.score && distanceSquared < best.distanceSquared)
      || (score === best.score && distanceSquared === best.distanceSquared && priority > best.priority)
    ) {
      best = {
        coordinate: candidate,
        distanceSquared,
        score,
        priority,
        type,
        source: item.source || '',
        layerName: item.layerName || '',
        featureName: item.featureName || getSnapFeatureName(item.feature),
        featureId: getDrawFeatureId(item.feature),
        isActiveLayer: item.isActiveLayer === true,
      }
    }
  }

  getSnapReferenceItems(options).forEach((item) => {
    if (isSnapTargetEnabled('vertex')) {
      getCoordinatePairs(item.feature.geometry).forEach((candidate) => {
        acceptCandidate(candidate, 4, 'vertex', item)
      })
    }
    if (isSnapTargetEnabled('midpoint') || isSnapTargetEnabled('edge')) {
      getCoordinateSegments(item.feature.geometry).forEach(([startCoordinate, endCoordinate]) => {
        if (isSnapTargetEnabled('midpoint')) {
          acceptCandidate([
            (Number(startCoordinate[0]) + Number(endCoordinate[0])) / 2,
            (Number(startCoordinate[1]) + Number(endCoordinate[1])) / 2,
          ], 3, 'midpoint', item)
        }
        if (isSnapTargetEnabled('edge')) {
          const startPoint = projectCoordinate(startCoordinate)
          const endPoint = projectCoordinate(endCoordinate)
          const candidate = getNearestPointOnProjectedSegment(targetPoint, startPoint, endPoint, startCoordinate, endCoordinate)
          acceptCandidate(candidate, 2, 'edge', item)
        }
      })
    }
  })

  if (isSnapTargetEnabled('grid')) {
    acceptCandidate(maybeSnapCoordinateToGrid(normalized), 1, 'grid', {
      source: 'grid',
      layerName: '',
      featureName: '',
    })
  }
  return {
    coordinate: best.coordinate,
    originalCoordinate: normalized,
    snapped: Boolean(best.type),
    type: best.type,
    source: best.source,
    layerName: best.layerName,
    featureName: best.featureName,
    featureId: best.featureId,
    isActiveLayer: best.isActiveLayer,
    distancePixels: Number.isFinite(best.distanceSquared) ? Math.sqrt(best.distanceSquared) : null,
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

const topologyEditingIsEnabled = (options = {}) => props.topologyEditingEnabled !== false
  && options.topologyEditing !== false

const sharedBoundaryProtectionIsEnabled = (options = {}) => topologyEditingIsEnabled(options)
  && props.sharedBoundaryProtectionEnabled !== false
  && options.sharedBoundaryProtection !== false

const featureHasCoordinate = (feature, coordinate) => {
  const normalizedCoordinate = normalizeVertexCoordinate(coordinate)
  if (!normalizedCoordinate) return false
  return getCoordinatePairs(feature?.geometry).some((candidate) => areCoordinatesEqual(candidate, normalizedCoordinate))
}

const getSharedTopologyFeatureIds = (featureCollection, featureId, coordinate) => {
  const normalizedFeatureId = String(featureId || '')
  const normalizedCoordinate = normalizeVertexCoordinate(coordinate)
  if (!normalizedFeatureId || !normalizedCoordinate) return new Set()
  return new Set((featureCollection.features ?? [])
    .filter((feature) => getDrawFeatureId(feature) !== normalizedFeatureId)
    .filter(isDrawFeatureSelectable)
    .filter((feature) => ['LineString', 'Polygon'].includes(feature?.geometry?.type))
    .filter((feature) => featureHasCoordinate(feature, normalizedCoordinate))
    .map((feature) => getDrawFeatureId(feature))
    .filter(Boolean))
}

const moveMatchingCoordinatesInFeature = (feature, fromCoordinate, toCoordinate) => {
  const normalizedFromCoordinate = normalizeVertexCoordinate(fromCoordinate)
  const normalizedToCoordinate = normalizeVertexCoordinate(toCoordinate)
  if (!normalizedFromCoordinate || !normalizedToCoordinate) return null

  const nextFeature = cloneFeatureForGeometryEdit(feature)
  const nextGeometry = nextFeature.geometry
  let changed = false
  const replaceCoordinate = (coordinate) => {
    if (!areCoordinatesEqual(coordinate, normalizedFromCoordinate)) return coordinate
    changed = true
    return [...normalizedToCoordinate]
  }

  if (nextGeometry?.type === 'LineString') {
    nextGeometry.coordinates = (nextGeometry.coordinates ?? []).map(replaceCoordinate)
    return changed && isLineGeometryValid(nextGeometry.coordinates) ? nextFeature : null
  }

  if (nextGeometry?.type === 'Polygon') {
    nextGeometry.coordinates = (nextGeometry.coordinates ?? []).map((ring) => (
      closePolygonRing(getEditableRingCoordinates(ring).map(replaceCoordinate))
    ))
    return changed && isPolygonGeometryValid(nextGeometry.coordinates) ? nextFeature : null
  }

  return null
}

const coordinateEpsilon = 1e-9

const isCoordinateOnSegment = (coordinate, startCoordinate, endCoordinate) => {
  const point = normalizeVertexCoordinate(coordinate)
  const start = normalizeVertexCoordinate(startCoordinate)
  const end = normalizeVertexCoordinate(endCoordinate)
  if (!point || !start || !end) return false
  if (areCoordinatesEqual(point, start) || areCoordinatesEqual(point, end)) return false

  const segmentX = end[0] - start[0]
  const segmentY = end[1] - start[1]
  const pointX = point[0] - start[0]
  const pointY = point[1] - start[1]
  const segmentLengthSquared = (segmentX ** 2) + (segmentY ** 2)
  if (segmentLengthSquared <= coordinateEpsilon) return false

  const cross = (pointX * segmentY) - (pointY * segmentX)
  if (Math.abs(cross) > coordinateEpsilon) return false

  const dot = (pointX * segmentX) + (pointY * segmentY)
  return dot > coordinateEpsilon && dot < segmentLengthSquared - coordinateEpsilon
}

const insertCoordinateOnMatchingSegment = (feature, coordinate) => {
  const nextCoordinate = normalizeVertexCoordinate(coordinate)
  if (!nextCoordinate || featureHasCoordinate(feature, nextCoordinate)) return null

  const nextFeature = cloneFeatureForGeometryEdit(feature)
  const nextGeometry = nextFeature.geometry

  if (nextGeometry?.type === 'LineString') {
    const coordinates = nextGeometry.coordinates ?? []
    const segmentIndex = coordinates.findIndex((startCoordinate, index) => (
      index < coordinates.length - 1
      && isCoordinateOnSegment(nextCoordinate, startCoordinate, coordinates[index + 1])
    ))
    if (segmentIndex < 0) return null
    const nextCoordinates = [...coordinates]
    nextCoordinates.splice(segmentIndex + 1, 0, nextCoordinate)
    nextGeometry.coordinates = nextCoordinates
    return isLineGeometryValid(nextGeometry.coordinates) ? nextFeature : null
  }

  if (nextGeometry?.type === 'Polygon') {
    for (let ringIndex = 0; ringIndex < (nextGeometry.coordinates ?? []).length; ringIndex += 1) {
      const editableRing = getEditableRingCoordinates(nextGeometry.coordinates[ringIndex])
      const segmentIndex = editableRing.findIndex((startCoordinate, index) => (
        isCoordinateOnSegment(nextCoordinate, startCoordinate, editableRing[(index + 1) % editableRing.length])
      ))
      if (segmentIndex < 0) continue
      const nextRing = [...editableRing]
      nextRing.splice(segmentIndex + 1, 0, nextCoordinate)
      nextGeometry.coordinates[ringIndex] = closePolygonRing(nextRing)
      return isPolygonGeometryValid(nextGeometry.coordinates) ? nextFeature : null
    }
  }

  return null
}

const isSharedBoundaryDeleteBlocked = (featureId, coordinates = [], options = {}) => {
  if (!sharedBoundaryProtectionIsEnabled(options)) return false
  const featureCollection = normalizeFeatureCollection(draw.value?.getAll?.() ?? props.modelValue)
  return (coordinates ?? [])
    .map(normalizeVertexCoordinate)
    .filter(Boolean)
    .some((coordinate) => getSharedTopologyFeatureIds(featureCollection, featureId, coordinate).size > 0)
}

const getSelectedVertexDeleteCoordinates = (feature) => {
  if (selectedVertexCoordPaths.value.length > 0) {
    return getCoordinatesForCoordPaths(feature, selectedVertexCoordPaths.value)
  }
  return getSelectedPointCoordinatesFromDraw()
}

const getSelectedVertexDeleteBlockCode = () => {
  if (draw.value?.getMode?.() !== 'direct_select') return ''
  const featureId = selectedFeatureId.value
  const feature = featureId ? draw.value?.get?.(featureId) : null
  if (!feature) return ''
  const coordinates = getSelectedVertexDeleteCoordinates(feature)
  return isSharedBoundaryDeleteBlocked(featureId, coordinates) ? 'sharedBoundaryDeleteBlocked' : ''
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
    if (isSharedBoundaryDeleteBlocked(featureId, getCoordinatesForCoordPaths(feature, selectedVertexCoordPaths.value))) {
      return false
    }
    return canDeleteVerticesByCoordPaths(feature, selectedVertexCoordPaths.value)
  }
  const selectedCoordinates = getSelectedPointCoordinatesFromDraw()
  if (!feature || selectedCoordinates.length === 0) return false
  if (isSharedBoundaryDeleteBlocked(featureId, selectedCoordinates)) return false

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
  const canDeleteSelectedVertex = mode === 'direct_select' && selectedVertexCount > 0 && canDeleteSelected()
  emit('shape-edit-state-change', {
    mode,
    featureId: mode === 'direct_select' ? selectedFeatureId.value : '',
    selectedVertexCount,
    selectedVertex: mode === 'direct_select' ? getSelectedVertexState() : null,
    canDeleteSelectedVertices: canDeleteSelectedVertex,
    deleteBlockCode: mode === 'direct_select' && selectedVertexCount > 0 && !canDeleteSelectedVertex
      ? getSelectedVertexDeleteBlockCode()
      : '',
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

const restoreDrawFeatureCollectionFromModel = () => {
  const featureCollection = normalizeFeatureCollection(props.modelValue)
  if (featureCollection.features.length > 0) {
    draw.value?.set?.(featureCollection)
  } else {
    draw.value?.deleteAll?.()
  }
}

const resetDrawInteractionState = () => {
  suppressedProgrammaticFeatureSelectionIds = null
  clearSnapPreview()
  clearEditTargetHover()
  clearPendingPolygonSplitSketch()
  selectedFeatureId.value = ''
  selectedVertexCoordPaths.value = []
  draw.value?.changeMode?.('simple_select', { featureIds: [] })
  emit('mode-change', 'simple_select')
  syncShapeEditState()
}

const isDrawMutationSyncEvent = (options = {}) => [
  'draw.create',
  'draw.update',
  'draw.delete',
].includes(String(options.type || ''))

const syncFeaturesFromDraw = (options = {}) => {
  if (isDrawMutationSyncEvent(options) && !canInteractWithActiveDrawLayer()) {
    restoreDrawFeatureCollectionFromModel()
    resetDrawInteractionState()
    return
  }

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
  syncActiveTextScaleVisibility()
  syncTextBackgroundBoxes()
  syncTextLeaderLines()
  if (options.syncSelection !== false) {
    syncSelectedFeature()
  }
}

const setDrawMode = (mode) => {
  suppressedProgrammaticFeatureSelectionIds = null
  clearSnapPreview()
  clearEditTargetHover()
  if (mode !== 'draw_line_string') {
    clearPendingPolygonSplitSketch()
  }
  if (mode !== 'direct_select') {
    selectedVertexCoordPaths.value = []
  }
  if (mode !== 'simple_select' && !canInteractWithActiveDrawLayer()) {
    resetDrawInteractionState()
    return
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
  clearEditTargetHover()
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
  clearEditTargetHover()
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

const resolveEditTargetType = (feature) => {
  const layerId = String(feature?.layer?.id || '')
  const meta = String(feature?.properties?.meta || '')
  if (layerId === 'gl-draw-active-vertex' || layerId === 'gl-draw-vertex' || meta === 'vertex') return 'vertex'
  if (layerId === 'gl-draw-midpoint' || meta === 'midpoint') return 'midpoint'
  if (layerId === 'gl-draw-line' || layerId === 'gl-draw-polygon-stroke') return 'edge'
  return ''
}

const getEditTargetFeatureId = (feature) => String(
  feature?.properties?.parent
    ?? feature?.properties?.id
    ?? feature?.id
    ?? ''
)

const getEditTargetCoordPath = (feature) => String(
  feature?.properties?.coord_path
    ?? feature?.properties?.coordPath
    ?? ''
)

const getEditTargetFeatureName = (featureId) => {
  const feature = featureId ? draw.value?.get?.(featureId) : null
  return getSnapFeatureName(feature)
}

const emitEditTargetHover = (payload = { active: false }) => {
  const key = payload?.active
    ? [payload.type, payload.featureId, payload.coordPath].join(':')
    : ''
  if (key === lastEditTargetHoverKey) return
  lastEditTargetHoverKey = key
  emit('edit-target-hover', payload)
}

const clearEditTargetHover = () => {
  emitEditTargetHover({ active: false })
}

const getEditableHoverLayerIds = () => editTargetHoverLayerIds
  .filter((layerId) => map.value?.getLayer?.(layerId))

const resolveEditTargetHoverFeature = (event = {}) => {
  const layerIds = getEditableHoverLayerIds()
  if (!map.value || layerIds.length === 0) return null
  try {
    return (map.value.queryRenderedFeatures(event.point, { layers: layerIds }) ?? [])
      .find((feature) => resolveEditTargetType(feature) && getEditTargetFeatureId(feature))
      ?? null
  } catch {
    return null
  }
}

const handleEditTargetMouseMove = (event = {}) => {
  if (props.featureBoxSelectEnabled || draw.value?.getMode?.() !== 'direct_select') {
    clearEditTargetHover()
    return
  }
  const feature = resolveEditTargetHoverFeature(event)
  const type = resolveEditTargetType(feature)
  const featureId = getEditTargetFeatureId(feature)
  if (!type || !featureId || !isDrawFeatureSelectableById(featureId)) {
    clearEditTargetHover()
    return
  }
  emitEditTargetHover({
    active: true,
    type,
    featureId,
    coordPath: type === 'edge' ? '' : getEditTargetCoordPath(feature),
    featureName: getEditTargetFeatureName(featureId),
  })
}

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
  return replaceFeaturesInDraw([nextFeature], options)
}

const replaceFeaturesInDraw = (nextFeaturesForReplacement = [], options = {}) => {
  if (!draw.value || typeof draw.value.set !== 'function') return false
  const replacementFeatureById = new Map((nextFeaturesForReplacement ?? [])
    .map((feature) => [getDrawFeatureId(feature), feature])
    .filter(([featureId, feature]) => featureId && feature))
  if (replacementFeatureById.size === 0) return false

  const featureCollection = normalizeFeatureCollection(draw.value.getAll?.() ?? props.modelValue)
  const nextFeatures = (featureCollection.features ?? []).map((feature) => (
    replacementFeatureById.get(getDrawFeatureId(feature)) ?? feature
  ))
  const replacedFeatureIds = new Set(nextFeatures
    .map((feature) => getDrawFeatureId(feature))
    .filter((featureId) => replacementFeatureById.has(featureId)))
  if (replacedFeatureIds.size !== replacementFeatureById.size) return false

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
  const featureCollection = normalizeFeatureCollection(draw.value.getAll?.() ?? props.modelValue)
  const snapResult = resolveSnapResult(coordinate, {
    ...options,
    excludeFeatureId: featureId,
  })
  const result = insertVertexIntoFeature(feature, coordPath, snapResult.coordinate)
  if (!result) return false

  const nextFeatures = [result.feature]
  const snapTargetFeatureId = String(snapResult.featureId || '')
  if (
    topologyEditingIsEnabled(options)
    && snapResult.isActiveLayer === true
    && ['edge', 'midpoint'].includes(snapResult.type)
    && snapTargetFeatureId
    && snapTargetFeatureId !== String(featureId)
  ) {
    const snapTargetFeature = (featureCollection.features ?? [])
      .find((candidate) => getDrawFeatureId(candidate) === snapTargetFeatureId)
    if (isDrawFeatureSelectable(snapTargetFeature)) {
      const tracedFeature = insertCoordinateOnMatchingSegment(snapTargetFeature, snapResult.coordinate)
      if (tracedFeature) {
        nextFeatures.push(tracedFeature)
      }
    }
  }

  const didReplace = replaceFeaturesInDraw(nextFeatures, options)
  if (!didReplace) return false
  setSnapPreview(snapResult)
  selectVertex(featureId, result.coordPath)
  return true
}

const moveVertex = (featureId, coordPath, coordinate, options = {}) => {
  const feature = featureId ? draw.value?.get?.(featureId) : null
  if (!draw.value || !feature || !isDrawFeatureSelectable(feature)) return false
  const featureCollection = normalizeFeatureCollection(draw.value.getAll?.() ?? props.modelValue)
  const originalCoordinate = getCoordinatesForCoordPaths(feature, [coordPath])[0]
  const sharedFeatureIds = topologyEditingIsEnabled(options)
    ? getSharedTopologyFeatureIds(featureCollection, featureId, originalCoordinate)
    : new Set()
  const snapResult = resolveSnapResult(coordinate, {
    ...options,
    excludeFeatureId: featureId,
    excludeFeatureIds: [...sharedFeatureIds],
  })
  const result = moveVertexInFeature(feature, coordPath, snapResult.coordinate)
  if (!result) return false

  const nextFeatures = [result.feature]
  if (sharedFeatureIds.size > 0) {
    ;(featureCollection.features ?? []).forEach((candidate) => {
      const candidateFeatureId = getDrawFeatureId(candidate)
      if (!sharedFeatureIds.has(candidateFeatureId)) return
      const nextFeature = moveMatchingCoordinatesInFeature(candidate, originalCoordinate, snapResult.coordinate)
      if (nextFeature) {
        nextFeatures.push(nextFeature)
      }
    })
  }

  const didReplace = replaceFeaturesInDraw(nextFeatures, options)
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
  if (!canDeleteSelected()) {
    if (draw.value?.getMode?.() === 'direct_select' && getSelectedVertexCountFromDraw() > 0) {
      emitGeometryEditFeedback('error', getSelectedVertexDeleteBlockCode() || 'vertexDeleteFailed')
    }
    return false
  }
  if (draw.value?.getMode?.() === 'direct_select' && selectedVertexCoordPaths.value.length > 0) {
    return deleteVertices(selectedFeatureId.value, selectedVertexCoordPaths.value, { commitHistory: false })
  }
  isDeletingSelected = true
  try {
    clearSnapPreview()
    clearEditTargetHover()
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
  clearEditTargetHover()
  selectedVertexCoordPaths.value = []
  syncFeaturesFromDraw({ commitHistory: false })
}

const importGeoJson = (featureCollection, options = {}) => {
  if (!draw.value) return

  clearPendingPolygonSplitSketch()
  clearSnapPreview()
  clearEditTargetHover()
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
  syncFeaturesFromDraw({ ...event, type: 'draw.create', snapFeatures: true })
}

const mountHiddenDrawControls = () => {
  const controlGroup = mapContainer.value?.querySelector('.mapboxgl-ctrl-group')
  controlGroup?.classList.add(drawControlContainerClass)
}

const bindDrawEvents = () => {
  map.value.on('draw.create', handleDrawCreate)
  map.value.on('draw.update', (event) => syncFeaturesFromDraw({ ...event, type: 'draw.update', snapFeatures: true }))
  map.value.on('draw.delete', (event) => syncFeaturesFromDraw({ ...event, type: 'draw.delete' }))
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
  syncActiveTextLayoutConstants()

  const initialFeatures = normalizeFeatureCollection(props.modelValue)
  if (initialFeatures.features.length > 0) {
    draw.value.set(initialFeatures)
  }
  syncActiveTextScaleVisibility()
  syncTextBackgroundBoxes()
  syncTextLeaderLines()
}

const restoreLayersAfterStyleLoad = () => {
  if (!map.value) return

  syncReadonlyLayers()
  ensureSnapPreviewLayers()
  syncActiveTextLayoutConstants()

  if (!draw.value) return

  const currentFeatures = draw.value.getAll?.() ?? normalizeFeatureCollection(props.modelValue)
  draw.value.set(currentFeatures)
  syncActiveTextScaleVisibility()
  syncTextBackgroundBoxes()
  syncTextLeaderLines()
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

const setLayerFilter = (layerId, filter) => {
  if (!map.value?.getLayer(layerId) || typeof map.value.setFilter !== 'function') return
  map.value.setFilter(layerId, filter)
}

const buildLayerIdFilter = (layerIds = []) => {
  const safeLayerIds = [...layerIds].map((layerId) => String(layerId || '')).filter(Boolean)
  return safeLayerIds.length
    ? ['in', ['get', 'layerId'], ['literal', safeLayerIds]]
    : ['==', ['get', 'layerId'], '__no-selected-layer__']
}

const buildDrawLayerIdSet = () => {
  const layerIds = new Set(drawStyles.map((style) => style.id))
  layerIds.add(textBackgroundFillLayerId)
  layerIds.add(textBackgroundLineLayerId)
  layerIds.add(textLeaderLayerId)
  buildAllLayerDescriptors().forEach((descriptor) => {
    layerIds.add(descriptor.fillLayerId)
    layerIds.add(descriptor.lineLayerId)
    layerIds.add(descriptor.pointLayerId)
    if (descriptor.labelBackgroundLayerId) layerIds.add(descriptor.labelBackgroundLayerId)
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
  const previousFilters = new Map()
  const activeLayerIsSelected = selectedLayerIds.has(props.activeLayer?.id)

  ;(map.value.getStyle()?.layers ?? []).forEach((layer) => {
    previousVisibilities.set(layer.id, map.value.getLayoutProperty(layer.id, 'visibility') ?? 'visible')
    if (textHelperLayerIds.has(layer.id) && typeof map.value.getFilter === 'function') {
      previousFilters.set(layer.id, map.value.getFilter(layer.id))
    }

    if (snapPreviewLayerIds.has(layer.id)) {
      setLayerVisibility(layer.id, false)
      return
    }

    if (drawLayerIds.has(layer.id)) {
      if (!includeDrawLayers) {
        setLayerVisibility(layer.id, false)
        return
      }

      if (textHelperLayerIds.has(layer.id)) {
        if (onlySelectedLayers) {
          setLayerFilter(layer.id, buildLayerIdFilter(selectedLayerIds))
          setLayerVisibility(layer.id, selectedLayerIds.size > 0)
          return
        }
        setLayerVisibility(layer.id, true)
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
        || descriptor.labelBackgroundLayerId === layer.id
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
    previousFilters.forEach((filter, layerId) => {
      setLayerFilter(layerId, filter ?? null)
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
    syncActiveTextLayoutConstants()
    syncTextBackgroundBoxes()
  })
  map.value.on('mousemove', handleEditTargetMouseMove)
  map.value.on('mouseleave', clearEditTargetHover)
  map.value.on('moveend', () => {
    syncTextBackgroundBoxes()
    syncTextLeaderLines()
  })
  map.value.on('zoomend', syncTextScaleVisibility)
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
    syncActiveTextScaleVisibility()
    syncTextBackgroundBoxes()
    syncTextLeaderLines()
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
    syncActiveTextLayoutConstants()
  }
)

watch(
  () => [props.activeLayer?.textAllowOverlap, props.activeLayer?.textLineHeight],
  () => {
    syncActiveTextLayoutConstants()
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
  () => props.snapTargets,
  () => {
    clearSnapPreview()
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
