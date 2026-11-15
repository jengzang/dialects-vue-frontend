<template>
  <div class="dialect-point-map" :class="{ 'is-fullscreen': fullscreen }">
    <div ref="mapContainer" class="dialect-point-map__canvas" />
    <div v-if="loading" class="dialect-point-map__status">{{ loadingText }}</div>
    <div v-else-if="!points.length" class="dialect-point-map__status">{{ emptyText }}</div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, watch, shallowRef, ref } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { mapStyle } from '@/utils/map/MapSource.js'
import { CATEGORY_PALETTE } from '@/main/config/colors/mapColors.js'

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
let markers = []

const regionColors = new Map()
function getRegionColor(region) {
  const key = String(region || '未分類').trim() || '未分類'
  if (!regionColors.has(key)) {
    regionColors.set(key, CATEGORY_PALETTE[regionColors.size % CATEGORY_PALETTE.length])
  }
  return regionColors.get(key)
}

function clearMarkers() {
  markers.forEach((marker) => marker.remove())
  markers = []
}

function renderMarkers() {
  if (!map.value) return
  clearMarkers()
  const bounds = new maplibregl.LngLatBounds()

  props.points.forEach((point) => {
    const longitude = Number(point.longitude)
    const latitude = Number(point.latitude)
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return

    const element = document.createElement('div')
    element.className = 'dialect-point-marker'
    const name = document.createElement('span')
    name.className = 'dialect-point-marker__name'
    name.textContent = point.locationName || '-'
    const count = document.createElement('span')
    count.className = 'dialect-point-marker__count'
    count.textContent = String(point.entryCount || 0)
    const color = getRegionColor(point.yindianRegion)
    name.style.backgroundColor = color
    name.style.color = '#fff'
    element.append(name, count)

    markers.push(new maplibregl.Marker({ element, anchor: 'center' })
      .setLngLat([longitude, latitude])
      .addTo(map.value))
    bounds.extend([longitude, latitude])
  })

  if (!bounds.isEmpty()) {
    map.value.fitBounds(bounds, { padding: 48, maxZoom: 7, duration: 0 })
  }
}

function resizeMap() {
  nextTick(() => map.value?.resize())
}

watch(() => props.points, renderMarkers, { deep: true })
watch(() => props.fullscreen, resizeMap)

onMounted(() => {
  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: mapStyle(props.styleKey),
    center: [105, 35],
    zoom: 3.2,
    attributionControl: false
  })
  map.value.once('load', renderMarkers)
})

onBeforeUnmount(() => {
  clearMarkers()
  map.value?.remove()
  map.value = null
})
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.dialect-point-map {
  position: relative;
  width: 100%;
  height: 420px;
  overflow: hidden;
  border-radius: var(--radius-lg);

  &.is-fullscreen {
    position: fixed;
    inset: 0;
    z-index: var(--z-index-vocabulary-map-fullscreen);
    height: 100dvh;
    border-radius: 0;
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
  font-size: 11px;
  line-height: 1.2;
  white-space: nowrap;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: var(--radius-sm);
}

:global(.dialect-point-marker__count) {
  color: var(--text-primary);
  font-size: 12px;
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
