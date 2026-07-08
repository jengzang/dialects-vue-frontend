<template>
  <AppModal
    :model-value="visible"
    size="lg"
    :z-index="10000"
    transition-name="modal-fade"
    :close-label="t('common.button.close')"
    :show-close="false"
    frameless
    @update:modelValue="handleClose"
  >
    <div class="map-modal-container" :class="{ fullscreen: isFullscreen }">
      <div v-if="!isFullscreen" class="map-popup-header">
        <h3 class="map-popup-title">{{ t('map.allVillagesMapPopup.title') }}</h3>
        <span class="village-count">{{ t('map.allVillagesMapPopup.count', { count: allFeatures.length }) }}</span>
        <button
          class="close-btn close-btn-lg close-btn-inline"
          @click="handleClose"
          :title="t('common.button.close')"
          :aria-label="t('common.button.close')"
        >
          &times;
        </button>
      </div>

      <div ref="mapContainer" class="map-content">
        <div v-if="!isFullscreen" class="map-controls">
          <div class="select-wrapper">
            <SimpleSelectDropdown
              v-model="currentStyle"
              :options="mapStyleOptions"
              @update:modelValue="changeMapStyle"
            />
          </div>

          <button
            class="toggle-display-btn"
            @click="toggleDisplay"
            :title="displayModeLabel"
          >
            {{ displayModeLabel }}
          </button>

          <div class="button-row">
            <button class="control-btn" @click="resetView">🎯 {{ t('map.allVillagesMapPopup.buttons.reset') }}</button>
            <button class="control-btn" @click="toggleFullscreen">⛶ {{ t('map.allVillagesMapPopup.buttons.fullscreen') }}</button>
          </div>
        </div>

        <button v-if="isFullscreen" class="exit-fullscreen-btn" @click="toggleFullscreen">
          ✕ {{ t('map.allVillagesMapPopup.buttons.exitFullscreen') }}
        </button>
      </div>
    </div>
  </AppModal>
</template>

<script setup>
import { ref, computed, watch, shallowRef, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { mapStyle, mapStyleConfig, calculateDenseMapCenterAndZoom } from '@/utils/map/MapSource.js'
import AppModal from '@/components/common/AppModal.vue'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  villages: {
    type: Array,
    default: () => []
    // [{ name, place_type_code, level2_name, level3_name, place_type_name, coors: [[lng,lat],...] }]
  }
})

const emit = defineEmits(['close'])
const { t } = useI18n()

const DISPLAY_MODES = ['name', 'level2', 'level3', 'code']
const DISPLAY_MODE_LABELS = {
  name: '📍 ' + t('map.allVillagesMapPopup.toggle.name'),
  level2: '📂 ' + t('map.allVillagesMapPopup.toggle.level2'),
  level3: '📁 ' + t('map.allVillagesMapPopup.toggle.level3'),
  code: '🔢 ' + t('map.allVillagesMapPopup.toggle.code')
}

const mapContainer = ref(null)
const map = shallowRef(null)
const currentStyle = ref('gaode')
const displayModeIndex = ref(0)
const isFullscreen = ref(false)
let popup = null

const displayMode = computed(() => DISPLAY_MODES[displayModeIndex.value])
const displayModeLabel = computed(() => DISPLAY_MODE_LABELS[displayMode.value])

const mapStyleOptions = computed(() => {
  return Object.entries(mapStyleConfig).map(([key, name]) => ({
    label: name,
    value: key
  }))
})

const colorPalette = [
  "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231",
  "#911eb4", "#42d4f4", "#f032e6", "#bfe745", "#fabed4",
  "#469990", "#dcbaff", "#9a6324", "#fffac8", "#800000",
  "#aaffc3", "#808000", "#ffd8b1", "#000075", "#a9a9a9"
]

const getDisplayValue = (village) => {
  if (displayMode.value === 'level2') return village.level2_name || ''
  if (displayMode.value === 'level3') return village.level3_name || ''
  if (displayMode.value === 'code') return village.place_type_code || ''
  return village.name || ''
}

const allFeatures = computed(() => {
  const features = []
  props.villages.forEach(village => {
    const coors = village.coors
    if (!coors || !Array.isArray(coors) || coors.length === 0) return

    if (coors.length === 1) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coors[0] },
        properties: {
          name: village.name,
          place_type_code: village.place_type_code || '',
          level2_name: village.level2_name || '',
          level3_name: village.level3_name || '',
          place_type_name: village.place_type_name || '',
          displayValue: getDisplayValue(village),
          featureType: 'point'
        }
      })
    } else {
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coors },
        properties: {
          name: village.name,
          place_type_code: village.place_type_code || '',
          level2_name: village.level2_name || '',
          level3_name: village.level3_name || '',
          place_type_name: village.place_type_name || '',
          displayValue: getDisplayValue(village),
          featureType: 'line'
        }
      })
    }
  })
  return features
})

const categoryColorMap = computed(() => {
  const categories = [...new Set(allFeatures.value.map(f => f.properties.displayValue).filter(Boolean))]
  const map = {}
  categories.forEach((cat, idx) => {
    map[cat] = colorPalette[idx % colorPalette.length]
  })
  return map
})

const initMap = () => {
  if (!mapContainer.value) return

  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: mapStyle(currentStyle.value),
    center: [113.2644, 23.1291],
    zoom: 8,
    attributionControl: false
  })

  map.value.addControl(new maplibregl.NavigationControl(), 'top-left')

  map.value.on('load', () => {
    renderLayers()
  })
}

const cleanupLayers = () => {
  if (!map.value) return
  const layers = ['allvillages-lines', 'allvillages-points', 'allvillages-labels']
  layers.forEach(id => {
    if (map.value.getLayer(id)) map.value.removeLayer(id)
  })
  if (map.value.getSource('allvillages')) {
    map.value.removeSource('allvillages')
  }
}

const renderLayers = () => {
  cleanupLayers()

  if (!map.value || !allFeatures.value.length) return

  const geojson = {
    type: 'FeatureCollection',
    features: allFeatures.value.map(f => ({
      ...f,
      properties: {
        ...f.properties,
        color: categoryColorMap.value[f.properties.displayValue] || '#1b2e2b'
      }
    }))
  }

  map.value.addSource('allvillages', {
    type: 'geojson',
    data: geojson
  })

  // LineStrings
  map.value.addLayer({
    id: 'allvillages-lines',
    type: 'line',
    source: 'allvillages',
    filter: ['==', ['get', 'featureType'], 'line'],
    paint: {
      'line-color': ['get', 'color'],
      'line-width': 2.5,
      'line-opacity': 0.8
    }
  })

  // Points (circles)
  map.value.addLayer({
    id: 'allvillages-points',
    type: 'circle',
    source: 'allvillages',
    filter: ['==', ['get', 'featureType'], 'point'],
    paint: {
      'circle-radius': 6,
      'circle-color': ['get', 'color'],
      'circle-opacity': 0.85,
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#fff'
    }
  })

  // Labels for points
  map.value.addLayer({
    id: 'allvillages-labels',
    type: 'symbol',
    source: 'allvillages',
    filter: ['==', ['get', 'featureType'], 'point'],
    layout: {
      'text-field': ['get', 'displayValue'],
      'text-size': 11,
      'text-font': ['Open Sans Regular'],
      'text-anchor': 'top',
      'text-offset': [0, 1.2]
    },
    paint: {
      'text-color': '#1d1d1f',
      'text-halo-color': '#fff',
      'text-halo-width': 1.5
    }
  })

  // Popup interactions
  popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10 })

  map.value.on('mouseenter', 'allvillages-points', (e) => {
    map.value.getCanvas().style.cursor = 'pointer'
    const props = e.features[0].properties
    popup.setLngLat(e.lngLat)
      .setHTML(`<strong>${props.name}</strong><br>${props.displayValue}`)
      .addTo(map.value)
  })

  map.value.on('mouseleave', 'allvillages-points', () => {
    map.value.getCanvas().style.cursor = ''
    popup.remove()
  })

  map.value.on('mouseenter', 'allvillages-lines', (e) => {
    map.value.getCanvas().style.cursor = 'pointer'
    const props = e.features[0].properties
    popup.setLngLat(e.lngLat)
      .setHTML(`<strong>${props.name}</strong><br>${props.displayValue}`)
      .addTo(map.value)
  })

  map.value.on('mouseleave', 'allvillages-lines', () => {
    map.value.getCanvas().style.cursor = ''
    popup.remove()
  })

  // Auto-fit
  const allCoords = props.villages.flatMap(v => v.coors || [])
  if (allCoords.length) {
    const { center, zoom } = calculateDenseMapCenterAndZoom(allCoords)
    map.value.flyTo({ center, zoom })
  }
}

const toggleDisplay = () => {
  displayModeIndex.value = (displayModeIndex.value + 1) % DISPLAY_MODES.length
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  nextTick(() => {
    if (map.value) map.value.resize()
  })
}

const resetView = () => {
  const allCoords = props.villages.flatMap(v => v.coors || [])
  if (map.value && allCoords.length) {
    const { center, zoom } = calculateDenseMapCenterAndZoom(allCoords)
    map.value.flyTo({ center, zoom })
  }
}

const changeMapStyle = () => {
  if (!map.value) return
  map.value.setStyle(mapStyle(currentStyle.value))
  map.value.once('style.load', () => {
    renderLayers()
  })
}

const cleanupMap = () => {
  if (popup) { popup.remove(); popup = null }
  cleanupLayers()
  if (map.value) { map.value.remove(); map.value = null }
}

const handleClose = () => {
  emit('close')
}

const handleKeydown = (e) => {
  if (e.key === 'Escape' && props.visible) {
    if (isFullscreen.value) {
      isFullscreen.value = false
    } else {
      handleClose()
    }
  }
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    displayModeIndex.value = 0
    nextTick(() => initMap())
  } else {
    cleanupMap()
  }
})

watch(() => props.villages, () => {
  if (map.value && props.visible) renderLayers()
}, { deep: true })

watch(displayMode, () => {
  if (map.value && props.visible) renderLayers()
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  cleanupMap()
})
</script>

<style scoped>
.map-modal-container {
  width: 90vw;
  max-width: 1200px;
  height: 80dvh;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85));
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25), 0 8px 16px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.map-modal-container.fullscreen {
  width: 100dvw !important;
  height: 100dvh !important;
  max-width: none !important;
  border-radius: 0 !important;
  margin: 0 !important;
}

.map-popup-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background: rgba(255, 255, 255, 0.3);
}

.map-popup-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1f;
  flex-shrink: 0;
}

.village-count {
  padding: 6px 12px;
  border-radius: 10px;
  background: rgba(52, 199, 89, 0.15);
  color: #34c759;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.map-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.map-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
  min-width: 140px;
}

.map-controls .select-wrapper {
  width: 100%;
}

.toggle-display-btn {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #333;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.toggle-display-btn:hover {
  background: #f5f5f7;
  border-color: #007aff;
}

.button-row {
  display: flex;
  gap: 8px;
}

.control-btn {
  white-space: nowrap;
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: #007aff;
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:hover {
  background: #0062cc;
}

.exit-fullscreen-btn {
  position: absolute;
  top: 32px;
  right: 16px;
  z-index: 10;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
}

.exit-fullscreen-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.05);
}

:deep(.maplibregl-popup-content) {
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  font-size: 13px;
  line-height: 1.6;
  color: #333;
}

:deep(.maplibregl-popup-content strong) {
  color: #1d1d1f;
  font-weight: 600;
}

@media (max-width: 768px) {
  .map-modal-container {
    width: 95vw;
    height: 85dvh;
    border-radius: 16px;
  }

  .map-popup-header {
    padding: 16px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .map-popup-title {
    font-size: 18px;
    width: 100%;
  }

  .map-controls {
    min-width: 120px;
  }

  .exit-fullscreen-btn {
    padding: 8px 16px;
    font-size: 13px;
  }
}
</style>
