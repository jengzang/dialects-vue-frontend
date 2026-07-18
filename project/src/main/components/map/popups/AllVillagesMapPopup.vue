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
        <span class="village-count">{{ t('map.allVillagesMapPopup.count', { count: validVillages.length }) }}</span>
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
import { CATEGORY_PALETTE } from '@/main/config/colors/mapColors.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  villages: {
    type: Array,
    default: () => []
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
let clusteredPopup = null
let clusteredInteractionHandlers = null

const displayMode = computed(() => DISPLAY_MODES[displayModeIndex.value])
const displayModeLabel = computed(() => DISPLAY_MODE_LABELS[displayMode.value])

const mapStyleOptions = computed(() => {
  return Object.entries(mapStyleConfig).map(([key, name]) => ({
    label: name,
    value: key
  }))
})

// 颜色来自 mapColors.js CATEGORY_PALETTE

const getCategoryColor = (text) => {
  if (!text) return CATEGORY_PALETTE[0]
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0
  return CATEGORY_PALETTE[Math.abs(hash) % CATEGORY_PALETTE.length]
}

const buildTag = (text, bgColor) => {
  const r = parseInt(bgColor.slice(1, 3), 16)
  const g = parseInt(bgColor.slice(3, 5), 16)
  const b = parseInt(bgColor.slice(5, 7), 16)
  return `<span style="display:inline-block;padding:1px 8px;border-radius:12px;font-size:10px;font-weight:500;color:var(--text-primary);background:rgba(${r},${g},${b},0.2);margin-top:2px">${text}</span>`
}

const buildHoverHtml = (name, pathStr, tagText, tagColor) => {
  let html = `<div style="text-align:center"><strong>${name}</strong></div>`
  if (pathStr) html += `<div style="text-align:center;font-size:11px;color:var(--text-secondary);margin-top:2px">${pathStr}</div>`
  if (tagText && tagColor) html += `<div style="text-align:center">${buildTag(tagText, tagColor)}</div>`
  return html
}

const getDisplayValue = (village) => {
  if (displayMode.value === 'level2') return village.level2_name || ''
  if (displayMode.value === 'level3') return village.level3_name || ''
  if (displayMode.value === 'code') return village.place_type_name || village.place_type_code || ''
  return village.name || ''
}

// Filter valid villages (with valid coords)
const validVillages = computed(() => {
  return props.villages.filter(v => {
    const coors = v.coors
    return coors && Array.isArray(coors) && coors.length > 0 &&
      coors.every(c => Array.isArray(c) && c.length >= 2 &&
        typeof c[0] === 'number' && typeof c[1] === 'number')
  })
})

// Split into point villages and line villages
const pointVillages = computed(() => validVillages.value.filter(v => v.coors.length === 1))
const lineVillages = computed(() => validVillages.value.filter(v => v.coors.length > 1))

// Category color map for current display mode
const categoryColorMap = computed(() => {
  const categories = [...new Set(validVillages.value.map(v => getDisplayValue(v)).filter(Boolean))]
  const map = {}
  categories.forEach((cat, idx) => {
    map[cat] = CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length]
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
    renderMarkers()
  })
}

const cleanupAllSources = () => {
  if (!map.value) return
  const layerIds = ['clusters', 'cluster-count', 'unclustered-point-bg', 'unclustered-point-text',
    'allvillages-lines', 'allvillages-points-layer']
  layerIds.forEach(id => {
    if (map.value.getLayer(id)) map.value.removeLayer(id)
  });
  ['allvillages-cluster', 'allvillages-lines', 'allvillages-points'].forEach(id => {
    if (map.value.getSource(id)) map.value.removeSource(id)
  })
}

const unbindClusteredInteractions = () => {
  if (clusteredPopup) {
    clusteredPopup.remove()
    clusteredPopup = null
  }
  if (!map.value || !clusteredInteractionHandlers) {
    clusteredInteractionHandlers = null
    return
  }
  map.value.off('click', 'clusters', clusteredInteractionHandlers.clickClusters)
  map.value.off('mouseenter', 'unclustered-point-bg', clusteredInteractionHandlers.mouseEnterPoint)
  map.value.off('mouseleave', 'unclustered-point-bg', clusteredInteractionHandlers.mouseLeavePoint)
  map.value.off('mouseenter', 'clusters', clusteredInteractionHandlers.mouseEnterClusters)
  map.value.off('mouseleave', 'clusters', clusteredInteractionHandlers.mouseLeaveClusters)
  clusteredInteractionHandlers = null
}

const bindClusteredInteractions = () => {
  if (!map.value) return
  unbindClusteredInteractions()

  clusteredPopup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 10
  })

  clusteredInteractionHandlers = {
    clickClusters: (e) => {
      const features = map.value.queryRenderedFeatures(e.point, { layers: ['clusters'] })
      if (!features.length) return
      const clusterId = features[0].properties.cluster_id
      map.value.getSource('allvillages-cluster').getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return
        map.value.easeTo({ center: features[0].geometry.coordinates, zoom: zoom + 0.5 })
      })
    },
    mouseEnterPoint: (e) => {
      map.value.getCanvas().style.cursor = 'pointer'
      if (e.features.length > 0) {
        const props = e.features[0].properties
        clusteredPopup.setLngLat(e.lngLat)
          .setHTML(buildHoverHtml(props.name, props._pathStr, props.tagText, props.tagColor))
          .addTo(map.value)
      }
    },
    mouseLeavePoint: () => {
      map.value.getCanvas().style.cursor = ''
      clusteredPopup.remove()
    },
    mouseEnterClusters: () => {
      map.value.getCanvas().style.cursor = 'pointer'
    },
    mouseLeaveClusters: () => {
      map.value.getCanvas().style.cursor = ''
    }
  }

  map.value.on('click', 'clusters', clusteredInteractionHandlers.clickClusters)
  map.value.on('mouseenter', 'unclustered-point-bg', clusteredInteractionHandlers.mouseEnterPoint)
  map.value.on('mouseleave', 'unclustered-point-bg', clusteredInteractionHandlers.mouseLeavePoint)
  map.value.on('mouseenter', 'clusters', clusteredInteractionHandlers.mouseEnterClusters)
  map.value.on('mouseleave', 'clusters', clusteredInteractionHandlers.mouseLeaveClusters)
}

// Render clustered points with text labels (name mode — like gdVillages)
const renderWithClustering = (pointFeatures) => {
  map.value.addSource('allvillages-cluster', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: pointFeatures },
    cluster: true,
    clusterMaxZoom: 20,
    clusterRadius: 30
  })

  // Cluster circles
  map.value.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'allvillages-cluster',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 50, '#f1f075', 100, '#f28cb1'],
      'circle-radius': ['step', ['get', 'point_count'], 20, 50, 30, 100, 40],
      'circle-opacity': 0.85,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff'
    }
  })

  // Cluster count
  map.value.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'allvillages-cluster',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['Open Sans Bold'],
      'text-size': 14
    },
    paint: { 'text-color': '#ffffff' }
  })

  // Unclustered point background circle
  map.value.addLayer({
    id: 'unclustered-point-bg',
    type: 'circle',
    source: 'allvillages-cluster',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-radius': 17,
      'circle-color': ['get', 'bgColor'],
      'circle-opacity': 0.9,
      'circle-stroke-width': 1.5,
      'circle-stroke-color': 'rgba(255,255,255,0.80)'
    }
  })

  // Unclustered point text label
  map.value.addLayer({
    id: 'unclustered-point-text',
    type: 'symbol',
    source: 'allvillages-cluster',
    filter: ['!', ['has', 'point_count']],
    layout: {
      'text-field': ['get', 'label'],
      'text-size': 11,
      'text-font': ['Open Sans Regular'],
      'text-anchor': 'center'
    },
    paint: {
      'text-color': ['get', 'textColor']
    }
  })

  bindClusteredInteractions()
}

// Render simple circles with hover popup (non-name modes)
const renderCircles = (pointFeatures) => {
  map.value.addSource('allvillages-points', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: pointFeatures }
  })

  map.value.addLayer({
    id: 'allvillages-points-layer',
    type: 'circle',
    source: 'allvillages-points',
    paint: {
      'circle-radius': 6,
      'circle-color': ['get', 'color'],
      'circle-opacity': 0.85,
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#fff'
    }
  })

  const pointPopup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10 })
  map.value.on('mouseenter', 'allvillages-points-layer', (e) => {
    map.value.getCanvas().style.cursor = 'pointer'
    const props = e.features[0].properties
    pointPopup.setLngLat(e.lngLat)
      .setHTML(buildHoverHtml(props.name, props._pathStr, props.tagText, props.tagColor))
      .addTo(map.value)
  })
  map.value.on('mouseleave', 'allvillages-points-layer', () => {
    map.value.getCanvas().style.cursor = ''
    pointPopup.remove()
  })
}

const renderMarkers = () => {
  cleanupAllSources()
  unbindClusteredInteractions()

  if (!map.value || !validVillages.value.length) return

  // Auto-fit
  const allCoords = validVillages.value.flatMap(v => v.coors)
  if (allCoords.length) {
    const { center, zoom } = calculateDenseMapCenterAndZoom(allCoords)
    map.value.flyTo({ center, zoom })
  }

  // Render lines (always non-clustered GeoJSON layer)
  const isNameMode = displayMode.value === 'name'
  if (lineVillages.value.length > 0) {
    const lineFeatures = lineVillages.value.map(v => {
      const displayValue = getDisplayValue(v)
      const tagText = isNameMode ? (v.place_type_name || '') : displayValue
      const tagColor = isNameMode ? getCategoryColor(v.place_type_name || '') : (categoryColorMap.value[displayValue] || '#1b2e2b')
      return {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: v.coors },
        properties: {
          name: v.name,
          displayValue: displayValue,
          color: categoryColorMap.value[displayValue] || '#1b2e2b',
          _pathStr: (v._path && v._path.length) ? v._path.join(' > ') : '',
          tagText: tagText,
          tagColor: tagColor
        }
      }
    })

    map.value.addSource('allvillages-lines', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: lineFeatures }
    })

    map.value.addLayer({
      id: 'allvillages-lines',
      type: 'line',
      source: 'allvillages-lines',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 2.5,
        'line-opacity': 0.8
      }
    })

    // Line hover popup
    const linePopup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10 })
    map.value.on('mouseenter', 'allvillages-lines', (e) => {
      map.value.getCanvas().style.cursor = 'pointer'
      const props = e.features[0].properties
      linePopup.setLngLat(e.lngLat)
        .setHTML(buildHoverHtml(props.name, props._pathStr, props.tagText, props.tagColor))
        .addTo(map.value)
    })
    map.value.on('mouseleave', 'allvillages-lines', () => {
      map.value.getCanvas().style.cursor = ''
      linePopup.remove()
    })
  }

  // Render points
  if (pointVillages.value.length > 0) {
    const pointFeatures = pointVillages.value.map(v => {
      const displayValue = getDisplayValue(v)
      const tagText = isNameMode ? (v.place_type_name || '') : displayValue
      const tagColor = isNameMode ? getCategoryColor(v.place_type_name || '') : (categoryColorMap.value[displayValue] || '#1b2e2b')
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: v.coors[0] },
        properties: {
          name: v.name,
          displayValue: displayValue,
          label: isNameMode ? v.name : displayValue,
          bgColor: '#1b2e2b',
          textColor: '#5ac8fa',
          color: categoryColorMap.value[displayValue] || '#1b2e2b',
          _pathStr: (v._path && v._path.length) ? v._path.join(' > ') : '',
          tagText: tagText,
          tagColor: tagColor
        }
      }
    })

    if (isNameMode) {
      renderWithClustering(pointFeatures)
    } else {
      renderCircles(pointFeatures)
    }
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
  const allCoords = validVillages.value.flatMap(v => v.coors)
  if (map.value && allCoords.length) {
    const { center, zoom } = calculateDenseMapCenterAndZoom(allCoords)
    map.value.flyTo({ center, zoom })
  }
}

const changeMapStyle = () => {
  if (!map.value) return
  map.value.setStyle(mapStyle(currentStyle.value))
  map.value.once('style.load', () => {
    renderMarkers()
  })
}

const cleanupMap = () => {
  cleanupAllSources()
  unbindClusteredInteractions()
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
  if (map.value && props.visible) renderMarkers()
}, { deep: true })

watch(displayMode, () => {
  if (map.value && props.visible) renderMarkers()
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  cleanupMap()
})
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$primary: var(--color-primary);
$primary-hover: var(--color-primary-hover);
$text-dark: var(--text-primary);
$mobile-breakpoint: 768px;/* 地图弹窗主体 */
.map-modal-container {
  width: 90vw;
  max-width: 1200px;
  height: 80dvh;
  @include flex-col;
  overflow: hidden;
  background: linear-gradient(
    145deg,
    var(--glass-90),
    var(--glass-90)
  );
  border: 1px solid var(--glass-50);
  border-radius: var(--radius-2xl);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.25),
    0 8px 16px rgba(0, 0, 0, 0.15);

  @include glass-blur(40px, 180%);

  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);

  &.fullscreen {
    width: 100dvw !important;
    max-width: none !important;
    height: 100dvh !important;
    margin: 0 !important;
    border-radius: 0 !important;
  }
}

/* 弹窗头部 */
.map-popup-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  background: var(--glass-30);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.map-popup-title {
  flex-shrink: 0;
  margin: 0;
  color: $text-dark;
  font-size: 20px;
  font-weight: 600;
}

.village-count {
  flex-shrink: 0;
  padding: 6px 12px;
  background: rgba(var(--color-success-rgb), 0.15);
  border-radius: var(--radius-md);
  color: var(--color-success);
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
}

/* 地图区域 */
.map-content {
  position: relative;
  flex: 1;
  overflow: hidden;
}

/* 地图控制面板 */
.map-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  min-width: 140px;
  @include flex-col;
  gap: 8px;
  padding: 12px;
  background: var(--glass-90);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  @include glass-blur(12px);

  .select-wrapper {
    width: 100%;
  }
}

.toggle-display-btn {
  width: 100%;
  padding: 8px 12px;
  background: var(--bg-white);
  border: 1px solid var(--border-light-gray);
  border-radius: var(--radius-sm2);
  color: var(--text-dark);
  white-space: nowrap;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--bg-light-gray);
    border-color: $primary;
  }
}

.button-row {
  display: flex;
  gap: 8px;
}

.control-btn {
  flex: 1;
  padding: 8px 12px;
  background: var(--action-primary-bg);
  border: none;
  border-radius: var(--radius-sm2);
  color: var(--action-primary-text);
  white-space: nowrap;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--action-primary-bg-hover);
  }
}

/* 退出全屏按钮 */
.exit-fullscreen-btn {
  position: absolute;
  top: 32px;
  right: 16px;
  z-index: 10;
  padding: 10px 20px;
  background: var(--glass-90);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  color: $text-dark;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  @include glass-blur(10px);

  transition: all 0.2s;

  &:hover {
    background: var(--bg-white);
    transform: scale(1.05);
  }
}

/* MapLibre 动态弹窗 */
:deep(.maplibregl-popup-content) {
  padding: 10px 12px;
  background: var(--surface-panel-strong);
  border-radius: var(--radius-sm2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  color: var(--text-primary);
  font-size: 13px;
  line-height: 1.6;

  @include glass-blur(10px);

  strong {
    color: var(--text-primary);
    font-weight: 700;
  }
}

/* 移动端 */
@media (max-width: $mobile-breakpoint) {
  .map-modal-container {
    width: 95vw;
    height: 85dvh;
    border-radius: var(--radius-lg);
  }

  .map-popup-header {
    flex-wrap: wrap;
    gap: 8px;
    padding: 16px;
  }

  .map-popup-title {
    font-size: 18px;
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
