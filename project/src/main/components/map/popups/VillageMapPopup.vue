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
        <h3 class="map-popup-title">{{ t('map.villageMapPopup.title') }}</h3>
        <span class="village-count">{{ t('map.villageMapPopup.count', { count: validVillages.length }) }}</span>
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
            v-if="hasDialectData"
            class="toggle-display-btn"
            @click="toggleDisplay"
            :title="displayMode === 'name'
              ? t('map.villageMapPopup.toggle.toDialectTitle')
              : t('map.villageMapPopup.toggle.toNameTitle')"
          >
            {{ displayMode === 'name'
              ? '📍 ' + t('map.villageMapPopup.toggle.name')
              : '🗣️ ' + t('map.villageMapPopup.toggle.dialect') }}
          </button>

          <div class="button-row">
            <button class="control-btn" @click="resetView">🎯 {{ t('map.villageMapPopup.buttons.reset') }}</button>
            <button class="control-btn" @click="toggleFullscreen">⛶ {{ t('map.villageMapPopup.buttons.fullscreen') }}</button>
          </div>

          <button
            v-if="hasDialectData"
            class="control-btn control-btn-full"
            @click="navigateToVoronoi"
          >
            ⬡ {{ t('map.villageMapPopup.buttons.voronoi') }}
          </button>
        </div>

        <button v-if="isFullscreen" class="exit-fullscreen-btn" @click="toggleFullscreen">
          ✕ {{ t('map.villageMapPopup.buttons.exitFullscreen') }}
        </button>
      </div>
    </div>
  </AppModal>
</template>

<script setup>
import { ref, computed, watch, shallowRef, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { mapStyle, mapStyleConfig, calculateDenseMapCenterAndZoom } from '@/utils/map/MapSource.js'
import { buildVillagePartitionPoints } from '@/main/utils/drawMap/partitionVoronoi.js'
import { globalPayload } from '@/main/store/store.js'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
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
    // 格式: [{ name: '村名', dialect: '方言', longitude: 113.x, latitude: 23.x }]
  }
})

const emit = defineEmits(['close'])
const { t } = useI18n()
const router = useRouter()
const route = useRoute()

// 状态管理
const mapContainer = ref(null)
const map = shallowRef(null)
const currentStyle = ref('gaode')
const displayMode = ref('name') // 'name' | 'dialect'
const isFullscreen = ref(false)
let clusteredPopup = null
let clusteredInteractionHandlers = null

// Map style options
const mapStyleOptions = computed(() => {
  return Object.entries(mapStyleConfig).map(([key, name]) => ({
    label: name,
    value: key
  }))
})

import { CATEGORY_PALETTE } from '@/main/config/colors/mapColors.js'

const tagPastelPalette = [
  '#e3f2fd', '#fde4ec', '#e8f5e9', '#fff3e0', '#f3e5f5',
  '#e0f7fa', '#fde4ec', '#e8eaf6', '#f1f8e9', '#fff8e1',
  '#ede7f6', '#e1f5fe', '#f9fbe7', '#efebe9', '#e0f2f1'
]
const getTagColor = (text) => {
  if (!text) return '#f0f0f0'
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0
  return tagPastelPalette[Math.abs(hash) % tagPastelPalette.length]
}

const buildTag = (text, bgColor) =>
  `<span style="display:inline-block;padding:1px 8px;border-radius:12px;font-size:10px;font-weight:500;color:#333;background:${bgColor};margin-top:2px">${text}</span>`

const buildHoverHtml = (name, pathStr, tagText, tagColor) => {
  let html = `<div style="text-align:center"><strong>${name}</strong></div>`
  if (pathStr) html += `<div style="text-align:center;font-size:11px;color:var(--text-secondary);margin-top:2px">${pathStr}</div>`
  if (tagText) html += `<div style="text-align:center">${buildTag(tagText, tagColor)}</div>`
  return html
}

// 数据验证
const validVillages = computed(() => {
  return props.villages.filter(v => {
    return v.longitude && v.latitude &&
           typeof v.longitude === 'number' &&
           typeof v.latitude === 'number' &&
           v.longitude >= -180 && v.longitude <= 180 &&
           v.latitude >= -90 && v.latitude <= 90
  })
})

// 检查是否有方言数据
const hasDialectData = computed(() => {
  return validVillages.value.some(v => v.dialect && v.dialect.trim() !== '')
})

// 初始化地图
const initMap = () => {
  if (!mapContainer.value) return

  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: mapStyle(currentStyle.value),
    center: [113.2644, 23.1291], // 默认广州
    zoom: 8,
    attributionControl: false
  })

  map.value.addControl(
    new maplibregl.NavigationControl(),
    'top-left'
  )

  map.value.on('load', () => {
    renderMarkers()
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
      const features = map.value.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      })

      if (!features.length) return

      const clusterId = features[0].properties.cluster_id
      map.value.getSource('villages').getClusterExpansionZoom(
        clusterId,
        (err, zoom) => {
          if (err) return

          map.value.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom + 0.5
          })
        }
      )
    },
    mouseEnterPoint: (e) => {
      map.value.getCanvas().style.cursor = 'pointer'

      if (e.features.length > 0) {
        const props = e.features[0].properties
        const html = buildHoverHtml(props.name, props._pathStr, props.dialect, getTagColor(props.dialect))
        clusteredPopup.setLngLat(e.lngLat)
          .setHTML(html)
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

// 渲染标记 - 村名模式使用聚合，方言模式不聚合
const renderMarkers = () => {
  // 清除旧图层和交互
  unbindClusteredInteractions()

  if (!map.value || !validVillages.value.length) return

  // 移除旧的 source 和 layers
  const layersToRemove = [
    'villages-text',
    'villages-background',
    'clusters',
    'cluster-count',
    'unclustered-point-bg',
    'unclustered-point-text'
  ]

  layersToRemove.forEach(layer => {
    if (map.value.getLayer(layer)) {
      map.value.removeLayer(layer)
    }
  })

  if (map.value.getSource('villages')) {
    map.value.removeSource('villages')
  }

  // 根据模式过滤村落
  let villagesToRender = validVillages.value

  // 方言模式：只显示有方言数据的村落
  if (displayMode.value === 'dialect') {
    villagesToRender = validVillages.value.filter(v => v.dialect && v.dialect.trim() !== '')
  }

  if (villagesToRender.length === 0) return

  // 自动居中
  const coords = villagesToRender.map(v => [v.longitude, v.latitude])
  const { center, zoom } = calculateDenseMapCenterAndZoom(coords)
  map.value.flyTo({ center, zoom })

  // 方言模式：建立方言到颜色的映射
  let dialectColorMap = {}
  if (displayMode.value === 'dialect') {
    const uniqueDialects = [...new Set(villagesToRender.map(v => v.dialect))]
    uniqueDialects.forEach((dialect, idx) => {
      dialectColorMap[dialect] = CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length]
    })
  }

  // 转换为 GeoJSON FeatureCollection
  const geojsonData = {
    type: 'FeatureCollection',
    features: villagesToRender.map(village => {
      const label = displayMode.value === 'name' ? village.name : village.dialect
      const bgColor = displayMode.value === 'dialect'
        ? (dialectColorMap[village.dialect] || '#1b2e2b')
        : '#1b2e2b'
      const textColor = displayMode.value === 'dialect' ? '#000000' : '#5ac8fa'

      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [village.longitude, village.latitude]
        },
        properties: {
          name: village.name,
          dialect: village.dialect || '',
          label: label,
          bgColor: bgColor,
          textColor: textColor,
          _pathStr: (village._path && village._path.length) ? village._path.join(' > ') : ''
        }
      }
    })
  }

  // 根据模式选择是否聚合
  if (displayMode.value === 'name') {
    // 村名模式：使用聚合
    renderWithClustering(geojsonData)
  } else {
    // 方言模式：不使用聚合
    renderWithoutClustering(geojsonData)
  }
}

// 带聚合的渲染（村名模式）
const renderWithClustering = (geojsonData) => {
  // 添加带聚合功能的 GeoJSON source
  map.value.addSource('villages', {
    type: 'geojson',
    data: geojsonData,
    cluster: true,
    clusterMaxZoom: 20,
    clusterRadius: 30
  })

  // 1. 聚合圆圈图层
  map.value.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'villages',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': [
        'step',
        ['get', 'point_count'],
        '#51bbd6',
        50,
        '#f1f075',
        100,
        '#f28cb1'
      ],
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        20,
        50,
        30,
        100,
        40
      ],
      'circle-opacity': 0.85,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff'
    }
  })

  // 2. 聚合数量文字图层
  map.value.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'villages',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['Open Sans Bold'],
      'text-size': 14
    },
    paint: {
      'text-color': '#ffffff'
    }
  })

  // 3. 未聚合点的背景圆形
  map.value.addLayer({
    id: 'unclustered-point-bg',
    type: 'circle',
    source: 'villages',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-radius': 17,
      'circle-color': ['get', 'bgColor'],
      'circle-opacity': 0.9,
      'circle-stroke-width': 1.5,
      'circle-stroke-color': 'rgba(255,255,255,0.80)'
    }
  })

  // 4. 未聚合点的文字
  map.value.addLayer({
    id: 'unclustered-point-text',
    type: 'symbol',
    source: 'villages',
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

// 不带聚合的渲染（方言模式）- 用彩色圆点 + hover popup，性能优于 DOM Marker
const renderWithoutClustering = (geojsonData) => {
  map.value.addSource('villages', {
    type: 'geojson',
    data: geojsonData
  })

  map.value.addLayer({
    id: 'unclustered-point-bg',
    type: 'circle',
    source: 'villages',
    paint: {
      'circle-radius': 6,
      'circle-color': ['get', 'bgColor'],
      'circle-opacity': 0.85,
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#fff'
    }
  })

  const dialectPopup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 10
  })

  map.value.on('mouseenter', 'unclustered-point-bg', (e) => {
    map.value.getCanvas().style.cursor = 'pointer'
    const props = e.features[0].properties
    dialectPopup.setLngLat(e.lngLat)
      .setHTML(buildHoverHtml(props.name, props._pathStr, props.dialect, getTagColor(props.dialect)))
      .addTo(map.value)
  })

  map.value.on('mouseleave', 'unclustered-point-bg', () => {
    map.value.getCanvas().style.cursor = ''
    dialectPopup.remove()
  })
}

// 切换显示模式
const toggleDisplay = () => {
  displayMode.value = displayMode.value === 'name' ? 'dialect' : 'name'
}

// 切换全屏
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value

  // 地图需要在容器尺寸改变后重新计算
  nextTick(() => {
    if (map.value) {
      map.value.resize()
    }
  })
}

// 复位视图
const resetView = () => {
  if (map.value && validVillages.value.length > 0) {
    const coords = validVillages.value.map(v => [v.longitude, v.latitude])
    const { center, zoom } = calculateDenseMapCenterAndZoom(coords)
    map.value.flyTo({ center, zoom })
  }
}

// 切换地图样式
const changeMapStyle = () => {
  if (!map.value) return
  const newStyle = mapStyle(currentStyle.value)
  map.value.setStyle(newStyle)
  map.value.once('style.load', () => {
    renderMarkers()
  })
}

// 清理地图
const cleanupMap = () => {
  unbindClusteredInteractions()

  if (map.value) {
    // 移除所有图层
    const layersToRemove = [
      'unclustered-point-text',
      'unclustered-point-bg',
      'cluster-count',
      'clusters'
    ]

    layersToRemove.forEach(layer => {
      if (map.value.getLayer(layer)) {
        map.value.removeLayer(layer)
      }
    })

    // 移除 source
    if (map.value.getSource('villages')) {
      map.value.removeSource('villages')
    }

    map.value.remove()
    map.value = null
  }
}

// 关闭弹窗
const handleClose = () => {
  emit('close')
}

// 导航到泰森多边形
const navigateToVoronoi = () => {
  if (!hasDialectData.value) return

  const points = buildVillagePartitionPoints(validVillages.value)
  if (points.length === 0) return

  globalPayload.value = {
    _type: 'villageVoronoi',
    points,
    label: t('map.villageMapPopup.title'),
    timestamp: Date.now(),
  }

  emit('close')
  router.push({
    path: buildLocalePath(resolveRouteLocale(route), '/menu/map/draw'),
    query: { scrollTo: 'drawBottom' },
  })
}

// 键盘支持
const handleKeydown = (e) => {
  if (e.key === 'Escape' && props.visible) {
    if (isFullscreen.value) {
      // 如果在全屏模式，先退出全屏
      isFullscreen.value = false
    } else {
      // 否则关闭弹窗
      handleClose()
    }
  }
}

// 弹窗打开时初始化地图
watch(() => props.visible, (newVal) => {
  if (newVal) {
    displayMode.value = 'name'
    nextTick(() => initMap())
  } else {
    cleanupMap()
  }
})

// 数据或显示模式变化时重新渲染
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
$success: var(--color-success);/* 地图容器 */
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

/* 头部 */
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
  color: $success;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
}

/* 地图内容 */
.map-content {
  position: relative;
  flex: 1;
  overflow: hidden;
}

/* 控制面板 */
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

  &-full {
    flex: none;
    width: 100%;
  }
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

/* 全屏退出按钮 */
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
@media (max-width: 768px) {
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
