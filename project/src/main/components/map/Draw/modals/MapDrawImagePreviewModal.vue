<template>
  <AppModal
    :model-value="modelValue"
    size="lg"
    :title="t('map.drawTab.imageExport.previewTitle')"
    :close-label="t('common.button.close')"
    @update:modelValue="handleClose"
  >
    <div class="image-export-preview-modal">
      <div class="image-export-preview-summary main-glass-panel-inner">
        <div class="summary-item">
          <span class="summary-label">{{ t('map.drawTab.imageExport.summary.layers') }}</span>
          <span class="summary-value summary-number">{{ previewLayerCount }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">{{ t('map.drawTab.imageExport.summary.features') }}</span>
          <span class="summary-value summary-number">{{ previewFeatureCount }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">{{ t('map.drawTab.imageExport.sections.range') }}</span>
          <span class="summary-value">{{ resolvedRangeLabel }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">{{ t('map.drawTab.imageExport.summary.outputSize') }}</span>
          <span class="summary-value">{{ exportDimensionSummary }}</span>
        </div>
      </div>

      <div class="image-export-preview-main">
        <div class="image-export-preview-sidebar main-glass-panel-inner">
          <div class="sidebar-title">{{ t('map.drawTab.imageExport.previewGuideTitle') }}</div>
          <p class="sidebar-text">{{ previewHint }}</p>
          <p v-if="validationMessage" class="image-export-preview-validation">
            {{ validationMessage }}
          </p>
        </div>

        <div class="image-export-preview-stage main-glass-panel-inner">
          <div ref="mapContainer" class="image-export-preview-map" />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="scope-modal-footer">
        <button class="main-glass-button" type="button" @click="handleClose(false)">
          {{ t('common.button.cancel') }}
        </button>
        <button
          class="main-glass-button scope-confirm-btn"
          data-variant="primary"
          type="button"
          @click="handleExport"
        >
          {{ t('map.drawTab.imageExport.exportAction') }}
        </button>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

import AppModal from '@/components/common/AppModal.vue'
import { useI18n } from 'vue-i18n'
import { mapStyle } from '@/utils/map/MapSource.js'
import { exportCurrentMapAsPng, normalizeFeatureCollection } from '@/main/utils/drawMap/export.js'

const PREVIEW_SOURCE_ID = 'image-export-preview-source'
const PREVIEW_FILL_LAYER_ID = 'image-export-preview-fill'
const PREVIEW_LINE_LAYER_ID = 'image-export-preview-line'
const PREVIEW_POINT_LAYER_ID = 'image-export-preview-point'
const BBOX_SOURCE_ID = 'image-export-bbox-source'
const BBOX_FILL_LAYER_ID = 'image-export-bbox-fill'
const BBOX_LINE_LAYER_ID = 'image-export-bbox-line'
const DEFAULT_CENTER = [113.2644, 23.1291]
const EXPORT_MIN_DIMENSION = 256
const EXPORT_MAX_DIMENSION = 8192
const DEFAULT_SETTINGS = {
  rangeMode: 'current-view',
  sizePreset: 'current',
  customWidth: 1920,
  customHeight: 1080,
  zoomMode: 'current',
  customZoom: 6,
  includeBasemap: true,
  includeDrawLayers: true,
  onlySelectedLayers: false,
  selectedLayerIds: [],
}

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  settings: { type: Object, default: () => ({}) },
  layers: { type: Array, default: () => [] },
  activeLayerId: { type: String, default: '' },
  selectedFeatureId: { type: String, default: '' },
  currentStyleKey: { type: String, default: 'gaode' },
  initialViewState: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'exported'])
const { t } = useI18n()

const mapContainer = ref(null)
const mapInstance = shallowRef(null)
const customBounds = ref(null)
const isDraggingBox = ref(false)
const dragStartLngLat = ref(null)
const previousBasemapVisibility = new Map()

const emptyFeatureCollection = () => ({
  type: 'FeatureCollection',
  features: [],
})

const resolvedSettings = computed(() => ({
  ...DEFAULT_SETTINGS,
  ...(props.settings ?? {}),
}))

const includedLayerIds = computed(() => {
  if (resolvedSettings.value.includeDrawLayers === false) {
    return []
  }

  if (resolvedSettings.value.onlySelectedLayers) {
    return (resolvedSettings.value.selectedLayerIds ?? []).filter(Boolean)
  }

  return (props.layers ?? []).map((layer) => layer?.id).filter(Boolean)
})

const previewLayers = computed(() => {
  const idSet = new Set(includedLayerIds.value)
  return (props.layers ?? []).filter((layer) => idSet.has(layer?.id))
})

const previewFeatureCollection = computed(() => {
  return normalizeFeatureCollection({
    type: 'FeatureCollection',
    features: previewLayers.value.flatMap((layer) => normalizeFeatureCollection(layer?.featureCollection).features ?? []),
  })
})

const previewLayerCount = computed(() => previewLayers.value.length)
const previewFeatureCount = computed(() => previewFeatureCollection.value.features.length)
const hasCustomBounds = computed(() => Array.isArray(customBounds.value) && customBounds.value.length === 2)
const validationMessage = computed(() => {
  if (resolvedSettings.value.rangeMode === 'custom-bbox' && !hasCustomBounds.value) {
    return t('map.drawTab.imageExport.previewCustomBboxHint')
  }
  return ''
})

const resolvedRangeLabel = computed(() => {
  const rangeMode = resolvedSettings.value.rangeMode
  if (rangeMode === 'selected-layer') return t('map.drawTab.imageExport.range.selectedLayer')
  if (rangeMode === 'selected-feature') return t('map.drawTab.imageExport.range.selectedFeature')
  if (rangeMode === 'custom-bbox') return t('map.drawTab.imageExport.range.customBbox')
  return t('map.drawTab.imageExport.range.currentView')
})

const exportDimensionSummary = computed(() => {
  const { width, height } = resolveExportDimensions()
  return `${width} × ${height}px`
})

const previewHint = computed(() => {
  if (resolvedSettings.value.rangeMode === 'custom-bbox') {
    return t('map.drawTab.imageExport.previewCustomBboxHint')
  }
  return t('map.drawTab.imageExport.previewHint')
})

function normalizeBounds(minLng, minLat, maxLng, maxLat) {
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

function iterateCoordinates(coordinates, visitor) {
  if (!Array.isArray(coordinates)) return
  if (typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') {
    visitor(coordinates)
    return
  }
  coordinates.forEach((item) => iterateCoordinates(item, visitor))
}

function buildBoundsFromFeatureCollection(featureCollection) {
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

function buildFeatureCollectionForLayerIds(layerIds = []) {
  const idSet = new Set((layerIds ?? []).filter(Boolean))
  return normalizeFeatureCollection({
    type: 'FeatureCollection',
    features: (props.layers ?? [])
      .filter((layer) => idSet.has(layer?.id))
      .flatMap((layer) => normalizeFeatureCollection(layer?.featureCollection).features ?? []),
  })
}

function buildFeatureCollectionForFeatureId(featureId) {
  const matchedFeature = (props.layers ?? [])
    .flatMap((layer) => normalizeFeatureCollection(layer?.featureCollection).features ?? [])
    .find((feature) => String(feature?.id ?? feature?.properties?.id ?? '') === String(featureId))

  return normalizeFeatureCollection({
    type: 'FeatureCollection',
    features: matchedFeature ? [matchedFeature] : [],
  })
}

function buildBoundsPreviewFeatureCollection() {
  const rangeMode = resolvedSettings.value.rangeMode

  if (rangeMode === 'selected-layer') {
    const layerIds = (resolvedSettings.value.selectedLayerIds?.length
      ? resolvedSettings.value.selectedLayerIds
      : [props.activeLayerId]).filter(Boolean)
    return buildFeatureCollectionForLayerIds(layerIds)
  }

  if (rangeMode === 'selected-feature' && props.selectedFeatureId) {
    return buildFeatureCollectionForFeatureId(props.selectedFeatureId)
  }

  return previewFeatureCollection.value
}

function resolveTargetBounds() {
  if (resolvedSettings.value.rangeMode === 'custom-bbox') {
    return customBounds.value
  }
  return buildBoundsFromFeatureCollection(buildBoundsPreviewFeatureCollection())
}

function buildBoundsPolygonFeatureCollection(bounds) {
  if (!Array.isArray(bounds) || bounds.length !== 2) {
    return emptyFeatureCollection()
  }

  return normalizeFeatureCollection({
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [bounds[0][0], bounds[0][1]],
          [bounds[1][0], bounds[0][1]],
          [bounds[1][0], bounds[1][1]],
          [bounds[0][0], bounds[1][1]],
          [bounds[0][0], bounds[0][1]],
        ]],
      },
    }],
  })
}

function ensurePreviewLayers() {
  if (!mapInstance.value || !mapInstance.value.isStyleLoaded?.()) return false

  if (!mapInstance.value.getSource(PREVIEW_SOURCE_ID)) {
    mapInstance.value.addSource(PREVIEW_SOURCE_ID, {
      type: 'geojson',
      data: emptyFeatureCollection(),
    })
  }

  if (!mapInstance.value.getLayer(PREVIEW_FILL_LAYER_ID)) {
    mapInstance.value.addLayer({
      id: PREVIEW_FILL_LAYER_ID,
      type: 'fill',
      source: PREVIEW_SOURCE_ID,
      filter: ['==', '$type', 'Polygon'],
      paint: {
        'fill-color': ['coalesce', ['get', 'fill'], '#60a5fa'],
        'fill-outline-color': ['coalesce', ['get', 'stroke'], 'var(--color-map-draw)'],
        'fill-opacity': ['coalesce', ['get', 'fillOpacity'], 0.22],
      },
    })
  }

  if (!mapInstance.value.getLayer(PREVIEW_LINE_LAYER_ID)) {
    mapInstance.value.addLayer({
      id: PREVIEW_LINE_LAYER_ID,
      type: 'line',
      source: PREVIEW_SOURCE_ID,
      filter: ['any', ['==', '$type', 'LineString'], ['==', '$type', 'Polygon']],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': ['coalesce', ['get', 'stroke'], 'var(--color-map-draw)'],
        'line-width': ['coalesce', ['get', 'strokeWidth'], 3],
      },
    })
  }

  if (!mapInstance.value.getLayer(PREVIEW_POINT_LAYER_ID)) {
    mapInstance.value.addLayer({
      id: PREVIEW_POINT_LAYER_ID,
      type: 'circle',
      source: PREVIEW_SOURCE_ID,
      filter: ['==', '$type', 'Point'],
      paint: {
        'circle-radius': ['coalesce', ['get', 'pointRadius'], 6],
        'circle-color': ['coalesce', ['get', 'pointColor'], '#60a5fa'],
        'circle-stroke-color': ['coalesce', ['get', 'pointStrokeColor'], 'var(--color-map-draw)'],
        'circle-stroke-width': 2,
      },
    })
  }

  if (!mapInstance.value.getSource(BBOX_SOURCE_ID)) {
    mapInstance.value.addSource(BBOX_SOURCE_ID, {
      type: 'geojson',
      data: emptyFeatureCollection(),
    })
  }

  if (!mapInstance.value.getLayer(BBOX_FILL_LAYER_ID)) {
    mapInstance.value.addLayer({
      id: BBOX_FILL_LAYER_ID,
      type: 'fill',
      source: BBOX_SOURCE_ID,
      paint: {
        'fill-color': 'var(--color-map-draw)',
        'fill-opacity': 0.08,
      },
    })
  }

  if (!mapInstance.value.getLayer(BBOX_LINE_LAYER_ID)) {
    mapInstance.value.addLayer({
      id: BBOX_LINE_LAYER_ID,
      type: 'line',
      source: BBOX_SOURCE_ID,
      paint: {
        'line-color': 'var(--color-map-draw)',
        'line-width': 2,
      },
    })
  }

  return true
}

function syncBasemapVisibility() {
  if (!mapInstance.value) return

  ;(mapInstance.value.getStyle()?.layers ?? []).forEach((layer) => {
    if ([PREVIEW_FILL_LAYER_ID, PREVIEW_LINE_LAYER_ID, PREVIEW_POINT_LAYER_ID, BBOX_FILL_LAYER_ID, BBOX_LINE_LAYER_ID].includes(layer.id)) {
      return
    }

    const currentVisibility = mapInstance.value.getLayoutProperty(layer.id, 'visibility') ?? 'visible'
    if (!previousBasemapVisibility.has(layer.id)) {
      previousBasemapVisibility.set(layer.id, currentVisibility)
    }

    mapInstance.value.setLayoutProperty(
      layer.id,
      'visibility',
      resolvedSettings.value.includeBasemap === false ? 'none' : previousBasemapVisibility.get(layer.id)
    )
  })
}

function syncPreviewSources() {
  if (!mapInstance.value) return false
  if (!ensurePreviewLayers()) return false
  syncBasemapVisibility()
  mapInstance.value.getSource(PREVIEW_SOURCE_ID)?.setData(previewFeatureCollection.value)
  mapInstance.value.getSource(BBOX_SOURCE_ID)?.setData(buildBoundsPolygonFeatureCollection(customBounds.value))
  return true
}

function waitForStyleReady(timeout = 2500) {
  if (!mapInstance.value) return Promise.resolve(false)
  if (mapInstance.value.isStyleLoaded?.()) return Promise.resolve(true)

  return new Promise((resolve) => {
    let settled = false
    const finalize = (result) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      mapInstance.value?.off?.('styledata', handleStyleData)
      mapInstance.value?.off?.('load', handleStyleData)
      resolve(result)
    }
    const handleStyleData = () => {
      if (mapInstance.value?.isStyleLoaded?.()) {
        finalize(true)
      }
    }
    const timer = window.setTimeout(() => finalize(false), timeout)

    mapInstance.value.on('styledata', handleStyleData)
    mapInstance.value.on('load', handleStyleData)
  })
}

function getInitialViewState() {
  if (!props.initialViewState) return null
  const center = Array.isArray(props.initialViewState.center) ? props.initialViewState.center : null
  const zoom = Number(props.initialViewState.zoom)
  const bearing = Number(props.initialViewState.bearing ?? 0)
  const pitch = Number(props.initialViewState.pitch ?? 0)

  if (!center || center.length !== 2 || !Number.isFinite(zoom)) {
    return null
  }

  return {
    center,
    zoom,
    bearing: Number.isFinite(bearing) ? bearing : 0,
    pitch: Number.isFinite(pitch) ? pitch : 0,
  }
}

function waitForMapRenderComplete(timeout = 2500) {
  if (!mapInstance.value) return Promise.resolve()

  return new Promise((resolve) => {
    let settled = false
    const finalize = () => {
      if (settled) return
      settled = true
      resolve()
    }

    const timer = window.setTimeout(finalize, timeout)
    mapInstance.value.once('idle', () => {
      window.clearTimeout(timer)
      finalize()
    })
    mapInstance.value.triggerRepaint()
  })
}

async function applyPreviewViewport(options = {}) {
  if (!mapInstance.value) return
  const { fitPadding } = options

  if (resolvedSettings.value.rangeMode === 'current-view') {
    const initialViewState = getInitialViewState()
    if (initialViewState) {
      mapInstance.value.jumpTo(initialViewState)
      await waitForMapRenderComplete()
      return
    }
  }

  const targetBounds = resolveTargetBounds()
  if (targetBounds) {
    mapInstance.value.fitBounds(targetBounds, {
      padding: Number.isFinite(fitPadding)
        ? fitPadding
        : (resolvedSettings.value.rangeMode === 'custom-bbox' ? 0 : 40),
      duration: 0,
      maxZoom: resolvedSettings.value.zoomMode === 'custom'
        ? Number(resolvedSettings.value.customZoom) || 24
        : 24,
    })
    await waitForMapRenderComplete()
  }

  if (resolvedSettings.value.zoomMode === 'custom') {
    mapInstance.value.jumpTo({
      center: mapInstance.value.getCenter(),
      zoom: Number(resolvedSettings.value.customZoom) || mapInstance.value.getZoom(),
      bearing: mapInstance.value.getBearing(),
      pitch: mapInstance.value.getPitch(),
    })
    await waitForMapRenderComplete()
  }
}

function getMapPixelSpanForBounds(bounds, zoom, center = null) {
  if (!Array.isArray(bounds) || bounds.length !== 2 || !Number.isFinite(zoom)) {
    return null
  }

  const projection = maplibregl.MercatorCoordinate.fromLngLat
  const northWest = projection({ lng: bounds[0][0], lat: bounds[1][1] })
  const southEast = projection({ lng: bounds[1][0], lat: bounds[0][1] })
  const worldSize = 512 * (2 ** zoom)

  let width = Math.abs((southEast.x - northWest.x) * worldSize)
  const height = Math.abs((southEast.y - northWest.y) * worldSize)

  if (width > worldSize / 2) {
    width = worldSize - width
  }

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null
  }

  const resolvedCenter = Array.isArray(center) && center.length === 2
    ? center
    : [
        (bounds[0][0] + bounds[1][0]) / 2,
        (bounds[0][1] + bounds[1][1]) / 2,
      ]

  return {
    width,
    height,
    center: resolvedCenter,
  }
}

function clampDimension(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return EXPORT_MIN_DIMENSION
  }
  return Math.min(EXPORT_MAX_DIMENSION, Math.max(EXPORT_MIN_DIMENSION, Math.round(value)))
}

function scaleDimensionsToLimit(width, height, maxDimension = EXPORT_MAX_DIMENSION) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return {
      width: EXPORT_MIN_DIMENSION,
      height: EXPORT_MIN_DIMENSION,
    }
  }

  const largestSide = Math.max(width, height)
  if (largestSide <= maxDimension) {
    return {
      width: clampDimension(width),
      height: clampDimension(height),
    }
  }

  const scale = maxDimension / largestSide
  return {
    width: clampDimension(width * scale),
    height: clampDimension(height * scale),
  }
}

function resolveCustomBboxExportDimensions() {
  if (!mapInstance.value || resolvedSettings.value.rangeMode !== 'custom-bbox' || !customBounds.value) {
    return null
  }

  const targetZoom = resolvedSettings.value.zoomMode === 'custom'
    ? Number(resolvedSettings.value.customZoom)
    : Number(mapInstance.value.getZoom())
  const targetCenter = mapInstance.value.getCenter?.()
  const pixelSpan = getMapPixelSpanForBounds(
    customBounds.value,
    targetZoom,
    targetCenter ? [targetCenter.lng, targetCenter.lat] : null,
  )

  if (!pixelSpan) return null
  return scaleDimensionsToLimit(pixelSpan.width, pixelSpan.height)
}

function resolveExportDimensions() {
  const currentWidth = mapContainer.value?.clientWidth || mapInstance.value?.getCanvas?.().clientWidth || 0
  const currentHeight = mapContainer.value?.clientHeight || mapInstance.value?.getCanvas?.().clientHeight || 0
  const customBboxDimensions = resolveCustomBboxExportDimensions()

  if (customBboxDimensions) {
    return customBboxDimensions
  }

  if (resolvedSettings.value.sizePreset === '1080p') {
    return { width: 1920, height: 1080 }
  }
  if (resolvedSettings.value.sizePreset === '2k') {
    return { width: 2560, height: 1440 }
  }
  if (resolvedSettings.value.sizePreset === 'custom') {
    return {
      width: Math.max(EXPORT_MIN_DIMENSION, Number(resolvedSettings.value.customWidth) || currentWidth || 1920),
      height: Math.max(EXPORT_MIN_DIMENSION, Number(resolvedSettings.value.customHeight) || currentHeight || 1080),
    }
  }

  return {
    width: currentWidth || 1920,
    height: currentHeight || 1080,
  }
}

async function applyExportDimensions() {
  if (!mapContainer.value || !mapInstance.value) {
    return () => {}
  }

  const panelElement = mapContainer.value.parentElement
  const previousContainerWidth = mapContainer.value.style.width
  const previousContainerHeight = mapContainer.value.style.height
  const previousPanelMinHeight = panelElement?.style.minHeight ?? ''
  const { width, height } = resolveExportDimensions()

  if (panelElement) {
    panelElement.style.minHeight = `${Math.max(height, 320)}px`
  }
  mapContainer.value.style.width = `${width}px`
  mapContainer.value.style.height = `${height}px`
  mapInstance.value.resize()
  await waitForMapRenderComplete()

  return async () => {
    if (panelElement) {
      panelElement.style.minHeight = previousPanelMinHeight
    }
    mapContainer.value.style.width = previousContainerWidth
    mapContainer.value.style.height = previousContainerHeight
    mapInstance.value.resize()
    await nextTick()
    await waitForMapRenderComplete()
  }
}

async function syncPreviewMap(options = {}) {
  if (!mapInstance.value) return
  const { preserveCustomBounds = false } = options

  if (resolvedSettings.value.rangeMode !== 'custom-bbox' && customBounds.value) {
    customBounds.value = null
  }

  const styleReady = await waitForStyleReady()
  if (!styleReady) return

  const targetBounds = resolvedSettings.value.rangeMode === 'custom-bbox'
    ? customBounds.value
    : resolveTargetBounds()

  if (!preserveCustomBounds && targetBounds) {
    customBounds.value = targetBounds
  }

  if (!syncPreviewSources()) return
  await applyPreviewViewport()
}

function handlePreviewMouseDown(event) {
  if (resolvedSettings.value.rangeMode !== 'custom-bbox' || !mapInstance.value) return
  event.preventDefault?.()
  isDraggingBox.value = true
  dragStartLngLat.value = event.lngLat
  mapInstance.value.dragPan.disable()
  customBounds.value = normalizeBounds(
    event.lngLat.lng,
    event.lngLat.lat,
    event.lngLat.lng,
    event.lngLat.lat,
  )
  syncPreviewSources()
}

function handlePreviewMouseMove(event) {
  if (!isDraggingBox.value || !dragStartLngLat.value) return
  customBounds.value = normalizeBounds(
    dragStartLngLat.value.lng,
    dragStartLngLat.value.lat,
    event.lngLat.lng,
    event.lngLat.lat,
  )
  syncPreviewSources()
}

async function handlePreviewMouseUp(event) {
  if (!isDraggingBox.value || !dragStartLngLat.value || !mapInstance.value) return
  customBounds.value = normalizeBounds(
    dragStartLngLat.value.lng,
    dragStartLngLat.value.lat,
    event.lngLat.lng,
    event.lngLat.lat,
  )
  isDraggingBox.value = false
  dragStartLngLat.value = null
  mapInstance.value.dragPan.enable()
  if (!syncPreviewSources()) return
  await applyPreviewViewport({ fitPadding: 0 })
}

function createPreviewMap() {
  if (!mapContainer.value || mapInstance.value) return

  mapInstance.value = new maplibregl.Map({
    container: mapContainer.value,
    style: mapStyle(props.currentStyleKey || 'gaode'),
    center: DEFAULT_CENTER,
    zoom: 5.5,
    attributionControl: false,
    canvasContextAttributes: {
      preserveDrawingBuffer: true,
    },
  })

  mapInstance.value.addControl(new maplibregl.NavigationControl(), 'top-left')
  mapInstance.value.on('load', () => {
    syncPreviewMap({ preserveCustomBounds: true })
  })
  mapInstance.value.on('styledata', () => {
    syncPreviewSources()
  })
  mapInstance.value.on('mousedown', handlePreviewMouseDown)
  mapInstance.value.on('mousemove', handlePreviewMouseMove)
  mapInstance.value.on('mouseup', handlePreviewMouseUp)
  mapInstance.value.on('mouseleave', handlePreviewMouseUp)
}

function destroyPreviewMap() {
  if (!mapInstance.value) return
  mapInstance.value.remove()
  mapInstance.value = null
}

function handleClose(value = false) {
  emit('update:modelValue', value)
}

async function handleExport() {
  if (validationMessage.value || !mapInstance.value) return

  const restoreDimensions = await applyExportDimensions()
  try {
    if (!syncPreviewSources()) return
    await applyPreviewViewport({ fitPadding: 0 })
    const blob = await exportCurrentMapAsPng(mapInstance.value)
    emit('exported', {
      blob,
      bounds: customBounds.value,
      settings: resolvedSettings.value,
    })
  } finally {
    await restoreDimensions()
  }
}

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) {
      destroyPreviewMap()
      return
    }

    customBounds.value = null
    isDraggingBox.value = false
    dragStartLngLat.value = null
    await nextTick()

    if (mapInstance.value?.getContainer?.() !== mapContainer.value) {
      destroyPreviewMap()
    }

    if (!mapInstance.value) {
      createPreviewMap()
    } else {
      mapInstance.value.resize()
    }

    await syncPreviewMap()
  },
  { immediate: true }
)

watch(
  () => props.currentStyleKey,
  async (nextValue) => {
    if (!mapInstance.value || !nextValue) return
    mapInstance.value.setStyle(mapStyle(nextValue))
    await syncPreviewMap({ preserveCustomBounds: true })
  }
)

watch(
  () => [props.settings, props.layers, props.activeLayerId, props.selectedFeatureId],
  async () => {
    if (!props.modelValue || !mapInstance.value) return
    await syncPreviewMap({ preserveCustomBounds: true })
  },
  { deep: true }
)

onBeforeUnmount(() => {
  destroyPreviewMap()
})
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

@use '../../_map-variables' as *;

.image-export-preview-modal {
  @include flex-col;
  gap: 14px;
}

.image-export-preview-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  padding: 14px 16px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }

  .summary-item {
    min-width: 0;
    @include flex-col;
    gap: 4px;
  }

  .summary-label {
    font-size: 11px;
    color: $text-muted;
  }

  .summary-value {
    font-size: 14px;
    font-weight: 700;
    color: $text-strong;
    word-break: break-word;
  }

  .summary-number {
    color: $primary;
  }
}

.image-export-preview-main {
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
  gap: 14px;
  align-items: stretch;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.image-export-preview-sidebar,
.image-export-preview-stage {
  padding: 14px 16px;
}

.image-export-preview-sidebar {
  @include flex-col;
  gap: 10px;

  .sidebar-title {
    font-size: 13px;
    font-weight: 700;
    color: $text-strong;
  }

  .sidebar-text {
    margin: 0;
    font-size: 12px;
    line-height: 1.6;
    color: $text-secondary;
  }

  .image-export-preview-validation {
    margin: 0;
    font-size: 12px;
    color: $danger;
  }
}

.image-export-preview-stage {
  min-height: 420px;

  @media (max-width: 900px) {
    min-height: 320px;
  }

  .image-export-preview-map {
    width: 100%;
    min-height: 420px;
    border-radius: var(--radius-lg);
    overflow: hidden;

    @media (max-width: 900px) {
      min-height: 320px;
    }
  }
}

.scope-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
