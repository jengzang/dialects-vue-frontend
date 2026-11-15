<template>
  <div class="dialect-point-map" :class="{ 'is-fullscreen': fullscreen }">
    <div ref="mapContainer" class="dialect-point-map__canvas" />
    <div v-if="loading" class="dialect-point-map__status">{{ loadingText }}</div>
    <div v-else-if="!points.length" class="dialect-point-map__status">{{ emptyText }}</div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, watch, shallowRef, ref } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { mapStyle } from '@/utils/map/MapSource.js'
import { CATEGORY_PALETTE } from '@/main/config/colors/mapColors.js'
import { currentColorTheme } from '@/composables/core/uiPreferences.js'
import { usePartitionColors } from '@/composables/data/usePartitionColors.js'
import { userStore } from '@/main/store/store.js'

defineOptions({ name: 'DialectPointMap' })

const props = defineProps({
  points: { type: Array, default: () => [] },
  fullscreen: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  loadingText: { type: String, default: 'Loading map…' },
  emptyText: { type: String, default: 'No map data' },
  styleKey: { type: String, default: 'tianditu' }
})

const mapContainer = ref(null)
const map = shallowRef(null)
const SOURCE_ID = 'home-dialect-points'
const LAYER_ID = 'home-dialect-labels'
const DOT_LAYER_ID = 'home-dialect-dots'
const images = new Map()
const regionColors = new Map()
const { loadPartitionColors, getPartitionColor, colorVersion } = usePartitionColors()
const partitionIdentity = computed(() => JSON.stringify([userStore.role, userStore.id]))
let styleReady = false
let currentTier = null
let viewportTimer = null
let visibilityObserver = null
let savedView = null
let disposed = false

function zoomTier() {
  const zoom = map.value.getZoom()
  return zoom < 5 ? 'dots' : zoom < 8 ? 'count' : 'full'
}

function getRegionColor(region) {
  const key = String(region || '未分類').trim() || '未分類'
  const configured = getPartitionColor('yindian', partitionIdentity.value, key)
  if (configured) return configured
  if (!regionColors.has(key)) {
    regionColors.set(key, CATEGORY_PALETTE[regionColors.size % CATEGORY_PALETTE.length])
  }
  return regionColors.get(key)
}

function getContrastTextColor(color) {
  if (/^#[\da-f]{3}$/i.test(color)) color = '#' + [...color.slice(1)].map(char => char + char).join('')
  const channels = [1, 3, 5].map(index => {
    const channel = parseInt(color.slice(index, index + 2), 16) / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
  return luminance > 0.179 ? '#000' : '#fff'
}

function readLabelStyle() {
  const probe = document.createElement('div')
  probe.className = 'dialect-point-marker'
  Object.assign(probe.style, { position: 'absolute', visibility: 'hidden' })
  const name = document.createElement('span')
  name.className = 'dialect-point-marker__name'
  const count = document.createElement('span')
  count.className = 'dialect-point-marker__count'
  probe.append(name, count)
  mapContainer.value.append(probe)
  const nameCss = getComputedStyle(name)
  const countCss = getComputedStyle(count)
  const style = {
    nameFont: `${nameCss.fontWeight || 400} ${nameCss.fontSize || '11px'} ${nameCss.fontFamily || 'sans-serif'}`,
    countFont: `${countCss.fontWeight || 700} ${countCss.fontSize || '12px'} ${countCss.fontFamily || 'sans-serif'}`,
    nameLine: parseFloat(nameCss.lineHeight) || 13.2,
    countLine: parseFloat(countCss.lineHeight) || 12,
    paddingX: parseFloat(nameCss.paddingLeft) || 6,
    paddingY: parseFloat(nameCss.paddingTop) || 3,
    borderWidth: parseFloat(nameCss.borderTopWidth) || 1,
    borderColor: nameCss.borderTopColor || 'rgba(255,255,255,0.7)',
    radius: parseFloat(nameCss.borderRadius) || 4,
    gap: parseFloat(getComputedStyle(probe).gap) || 2,
  }
  probe.remove()
  return style
}

function clearPoints(resetImages = false) {
  if (!map.value) return
  if (map.value.getLayer(LAYER_ID)) map.value.removeLayer(LAYER_ID)
  if (map.value.getLayer(DOT_LAYER_ID)) map.value.removeLayer(DOT_LAYER_ID)
  if (map.value.getSource(SOURCE_ID)) map.value.removeSource(SOURCE_ID)
  if (resetImages) {
    images.forEach(id => { if (map.value.hasImage(id)) map.value.removeImage(id) })
    images.clear()
  }
}

// One complete image per distinct label, in source order, just like the main map.
// Never split text/background into separate layers or hide points via collision.
function getLabelImage(label, style, pixelRatio, pending, tier) {
  if (images.has(label.key)) return images.get(label.key)
  const margin = 8
  const ratio = Math.min(pixelRatio, 4096 / (label.width + margin * 2), 4096 / (style.height + margin * 2))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.ceil((label.width + margin * 2) * ratio))
  canvas.height = Math.max(1, Math.ceil((style.height + margin * 2) * ratio))
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.scale(ratio, ratio)
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  const x = margin + label.width / 2
  context.fillStyle = label.color
  if (tier === 'count') {
    context.beginPath()
    context.ellipse(x, margin + style.nameHeight / 2, label.width / 2, style.nameHeight / 2, 0, 0, Math.PI * 2)
    context.fill()
    context.font = style.countFont
    context.fillStyle = '#000'
    context.fillText(label.count, x, margin + style.nameHeight / 2)
  } else {
    context.fillRect(x - label.nameWidth / 2, margin, label.nameWidth, style.nameHeight)
    context.font = style.nameFont
    context.fillStyle = getContrastTextColor(label.color)
    context.fillText(label.name, x, margin + style.nameHeight / 2)
    context.font = style.countFont
    context.fillStyle = '#000'
    context.fillText(label.count, x, margin + style.nameHeight + style.gap + style.countLine / 2)
  }
  const id = `home-dialect-label-${images.size}`
  pending.push({ id, texture: canvas, pixelRatio: ratio })
  images.set(label.key, id)
  return id
}

// Read back one canvas per batch instead of forcing a GPU readback for every label.
function registerLabelImages(pending) {
  const limit = Math.max(2048, ...pending.map(({ texture }) => Math.max(texture.width, texture.height)))
  let batch = []
  let x = 0, y = 0, rowHeight = 0
  const flush = () => {
    if (!batch.length) return
    const atlas = document.createElement('canvas')
    atlas.width = limit
    atlas.height = y + rowHeight
    const ctx = atlas.getContext('2d', { willReadFrequently: true })
    for (const item of batch) ctx.drawImage(item.texture, item.x, item.y)
    const pixels = ctx.getImageData(0, 0, atlas.width, atlas.height).data
    for (const item of batch) {
      const { width, height } = item.texture
      const data = new Uint8Array(width * height * 4)
      for (let row = 0; row < height; row++) {
        const start = ((item.y + row) * atlas.width + item.x) * 4
        data.set(pixels.subarray(start, start + width * 4), row * width * 4)
      }
      map.value.addImage(item.id, { width, height, data }, { pixelRatio: item.pixelRatio })
    }
    batch = []; x = 0; y = 0; rowHeight = 0
  }
  for (const item of pending) {
    if (x + item.texture.width > limit) { x = 0; y += rowHeight; rowHeight = 0 }
    if (y + item.texture.height > limit) flush()
    batch.push({ ...item, x, y })
    x += item.texture.width
    rowHeight = Math.max(rowHeight, item.texture.height)
  }
  flush()
}

function renderPoints(resetImages = false) {
  if (!map.value || !styleReady) return
  clearTimeout(viewportTimer)
  const tier = zoomTier()
  const canUpdateSource = !resetImages && currentTier === tier && map.value.getSource(SOURCE_ID)
  if (!canUpdateSource) clearPoints(resetImages)
  currentTier = tier
  if (tier === 'dots') {
    const features = []
    props.points.forEach(point => {
      const longitude = Number(point.longitude), latitude = Number(point.latitude)
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return
      features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [longitude, latitude] }, properties: { color: getRegionColor(point.yindianRegion) } })
    })
    const data = { type: 'FeatureCollection', features }
    if (canUpdateSource) canUpdateSource.setData(data)
    else {
      map.value.addSource(SOURCE_ID, { type: 'geojson', data })
      map.value.addLayer({ id: DOT_LAYER_ID, type: 'circle', source: SOURCE_ID, paint: { 'circle-radius': 3, 'circle-color': ['get', 'color'] } })
    }
    return
  }
  const style = readLabelStyle()
  style.nameHeight = style.nameLine + 2 * (style.paddingY + style.borderWidth)
  style.height = tier === 'count' ? style.nameHeight : style.nameHeight + style.gap + style.countLine
  const context = document.createElement('canvas').getContext('2d')
  const distinct = new Map()
  let area = 0
  const labels = []
  const visibleBounds = map.value.getBounds()
  props.points.forEach(point => {
    const longitude = Number(point.longitude)
    const latitude = Number(point.latitude)
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return
    if (!visibleBounds.contains([longitude, latitude])) return
    const name = String(point.locationName || '-').replace(/\s+/g, ' ').trim()
    const count = String(point.entryCount || 0).replace(/\s+/g, ' ').trim()
    const color = getRegionColor(point.yindianRegion)
    const key = JSON.stringify(tier === 'count' ? [tier, count, color] : [tier, name, count, color])
    if (!distinct.has(key)) {
      context.font = style.nameFont
      const nameWidth = Math.ceil(context.measureText(name).width) + 2 * (style.paddingX + style.borderWidth)
      context.font = style.countFont
      const countWidth = Math.ceil(context.measureText(count).width) + 2 * style.paddingX
      const width = tier === 'count' ? countWidth : Math.max(nameWidth, countWidth)
      distinct.set(key, { name, count, color, nameWidth, width, key })
      area += (width + 16) * (style.height + 16)
    }
    labels.push({ ...distinct.get(key), coordinate: [longitude, latitude] })
  })
  // Same bounded raster budget as the main map; no point sampling or collision culling.
  const ratio = Math.min(window.devicePixelRatio || 1, 3, Math.sqrt(16 * 1024 * 1024 / Math.max(1, area)))
  const pendingImages = []
  const features = labels.map((label, index) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: label.coordinate },
    properties: { index, name: label.name, count: label.count, image: getLabelImage(label, style, ratio, pendingImages, tier) },
  }))
  registerLabelImages(pendingImages)
  const data = { type: 'FeatureCollection', features }
  if (canUpdateSource) canUpdateSource.setData(data)
  else {
    map.value.addSource(SOURCE_ID, { type: 'geojson', data })
    map.value.addLayer({
    id: LAYER_ID, type: 'symbol', source: SOURCE_ID,
    layout: {
      'icon-image': ['get', 'image'], 'icon-allow-overlap': true, 'icon-ignore-placement': true,
      'symbol-sort-key': ['get', 'index'], 'symbol-z-order': 'source',
      'icon-rotation-alignment': 'viewport', 'icon-pitch-alignment': 'viewport',
    },
    })
  }
}

function resizeMap() {
  nextTick(() => map.value?.resize())
}

watch(() => props.points, () => renderPoints(true), { deep: true })
watch(() => props.fullscreen, resizeMap)
watch(currentColorTheme, () => renderPoints(true))
watch(colorVersion, () => renderPoints(true))
watch(partitionIdentity, loadColors)

async function loadColors() {
  try {
    await loadPartitionColors('yindian', partitionIdentity.value)
    renderPoints(true)
  } catch (error) {
    console.warn('Failed to load yindian partition colors:', error)
  }
}

function mountMap() {
  if (map.value || disposed) return
  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: mapStyle(props.styleKey),
    center: savedView?.center || [105, 35],
    zoom: savedView?.zoom ?? 3.5,
    bearing: savedView?.bearing ?? 0,
    pitch: savedView?.pitch ?? 0,
    attributionControl: false
  })
  const instance = map.value
  instance.once('load', () => {
    if (map.value !== instance) return
    styleReady = true
    renderPoints()
  })
  instance.on('moveend', () => {
    if (map.value !== instance || !styleReady) return
    clearTimeout(viewportTimer)
    if (zoomTier() !== currentTier) renderPoints()
    else if (currentTier !== 'dots') viewportTimer = setTimeout(() => renderPoints(), 200)
  })
}

function unmountMap() {
  if (!map.value) return
  const center = map.value.getCenter()
  savedView = { center: [center.lng, center.lat], zoom: map.value.getZoom(), bearing: map.value.getBearing(), pitch: map.value.getPitch() }
  clearTimeout(viewportTimer)
  styleReady = false
  currentTier = null
  map.value.remove()
  map.value = null
  images.clear()
}

onMounted(() => {
  loadColors()
  if (typeof IntersectionObserver === 'undefined') {
    mountMap()
    return
  }
  visibilityObserver = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) mountMap()
    else unmountMap()
  })
  visibilityObserver.observe(mapContainer.value)
})

onBeforeUnmount(() => {
  disposed = true
  visibilityObserver?.disconnect()
  clearTimeout(viewportTimer)
  map.value?.remove()
  map.value = null
  images.clear()
})
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.dialect-point-map {
  position: relative;
  width: min(80dvw,800px);
  height: 600px;
  margin: 0 auto;
  overflow: hidden;
  border: 3px solid var(--color-primary-border);
  border-radius: var(--radius-lg);
  box-shadow:
    0 2px 8px rgba(var(--color-shadow-rgb), 0.06),
    0 18px 48px rgba(var(--color-shadow-rgb), 0.16);

  &.is-fullscreen {
    position: fixed;
    inset: 0;
    z-index: var(--z-index-vocabulary-map-fullscreen);
    width: 100%;
    height: 100dvh;
    margin: 0;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }
}

.dialect-point-map__canvas {
  width: 100%;
  height: 100%;
}

.dialect-point-map__status {
  @include flex-center;
  position: absolute;
  inset: 0;
  color: var(--text-dark-lighter);
  background: var(--surface-elevation-1);
}

:global(.dialect-point-marker) {
  @include flex-col;
  align-items: center;
  gap: 2px;
  pointer-events: none;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.28));
}

:global(.dialect-point-marker__name) {
  padding: 3px 6px;
  color: #fff;
  font-size: 10px;
  line-height: 1.2;
  white-space: nowrap;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: var(--radius-sm);
}

:global(.dialect-point-marker__count) {
  color: #000;
  font-size: 8px;
  font-weight: 700;
  line-height: 1;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.9);
}

@media (max-aspect-ratio: 1 / 1) {
  .dialect-point-map {
    height: 340px;
  }
}
</style>
