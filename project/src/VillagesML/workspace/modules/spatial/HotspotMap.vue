<template>
  <Teleport to="body" :disabled="!isFullScreen">
    <div class="hotspot-map-container" :class="{ 'is-fullscreen': isFullScreen }">
      <!-- 地圖容器 -->
      <div ref="mapContainer" class="map-container">
        <!-- 地圖控制面板 -->
        <div class="map-controls vml-control-surface vml-control-row" v-if="!isFullScreen">
          <div class="control-group vml-control-field">
            <SimpleSelectDropdown :match-trigger-width="true"
              v-model="currentStyleKey"
              :options="mapStyleOptions"
              @update:modelValue="handleStyleChange"
            />
          </div>

          <div class="button-row vml-control-actions">
            <button class="action-btn" @click="resetView">🎯 復位</button>
            <button class="action-btn fullscreen-btn" @click="toggleFullScreen">⛶ 全屏</button>
          </div>
        </div>

        <!-- 加載狀態 -->
        <div v-if="loading" class="loading-overlay">
          <div class="ui-loading--page" aria-hidden="true"></div>
          <span>地圖加載中...</span>
        </div>
      </div>

      <!-- 全屏退出按鈕 -->
      <button v-if="isFullScreen" class="exit-fullscreen-btn" @click="toggleFullScreen">
        ✕ 退出全屏
      </button>

      <!-- 村莊詳情彈窗 -->
      <Teleport to="body">
        <div v-if="showPopup && selectedVillage" class="village-popup-overlay" @click="closePopup">
          <div class="village-popup-content" @click.stop>
            <div class="popup-header">
              <h3>{{ selectedVillage.village_name }}</h3>
              <button class="close-btn close-btn-lg close-btn-inline" @click="closePopup">✕</button>
            </div>
            <div class="popup-body">
              <div class="info-row">
                <span class="label">坐標：</span>
                <span class="value">{{ selectedVillage.lat?.toFixed(4) }}, {{ selectedVillage.lon?.toFixed(4) }}</span>
              </div>
              <div class="info-row" v-if="selectedVillage.city">
                <span class="label">城市：</span>
                <span class="value">{{ selectedVillage.city }}</span>
              </div>
              <div class="info-row" v-if="selectedVillage.county">
                <span class="label">區縣：</span>
                <span class="value">{{ selectedVillage.county }}</span>
              </div>
              <div class="info-row" v-if="selectedVillage.township">
                <span class="label">鄉鎮：</span>
                <span class="value">{{ selectedVillage.township }}</span>
              </div>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, shallowRef, nextTick, watch, computed } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import { mapStyle, mapStyleConfig, calculateDenseMapCenterAndZoom } from '@/utils/map/MapSource.js'

const props = defineProps({
  // 熱點數據
  hotspot: {
    type: Object,
    default: null
    // 格式: { hotspot_id, center_lon, center_lat, radius_km, villages: [...] }
  }
})

const mapContainer = ref(null)
const map = shallowRef(null)
const currentStyleKey = ref('gaode')
const loading = ref(false)
const isFullScreen = ref(false)
let villageLayerInteractionsBound = false

// 彈窗狀態
const showPopup = ref(false)
const selectedVillage = ref(null)

// Options for SimpleSelectDropdown
const mapStyleOptions = computed(() =>
  Object.entries(mapStyleConfig).map(([key, name]) => ({
    label: name,
    value: key
  }))
)

// 初始化地圖
onMounted(() => {
  initMap()
})

onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove()
    map.value = null
  }
  villageLayerInteractionsBound = false
})

// 監聽熱點數據變化
watch(() => props.hotspot, (newHotspot) => {
  if (map.value && newHotspot) {
    renderHotspot()
  }
}, { deep: true })

const handleVillageLayerClick = (e) => {
  if (e.features && e.features.length > 0) {
    const feature = e.features[0]
    selectedVillage.value = feature.properties
    showPopup.value = true
  }
}

const handleVillageLayerMouseEnter = () => {
  if (map.value) {
    map.value.getCanvas().style.cursor = 'pointer'
  }
}

const handleVillageLayerMouseLeave = () => {
  if (map.value) {
    map.value.getCanvas().style.cursor = ''
  }
}

const initMap = () => {
  if (!mapContainer.value) return

  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: mapStyle(currentStyleKey.value),
    center: [113.2644, 23.1291],
    zoom: 8,
    attributionControl: false
  })

  map.value.addControl(new maplibregl.NavigationControl(), 'top-left')

  map.value.on('load', () => {
    if (props.hotspot) {
      renderHotspot()
    }
  })
}

const renderHotspot = () => {
  if (!map.value || !props.hotspot) return

  const hotspot = props.hotspot

  // 1. 飛到熱點中心
  map.value.flyTo({
    center: [hotspot.center_lon, hotspot.center_lat],
    zoom: calculateZoomFromRadius(hotspot.radius_km)
  })

  // 2. 移除舊圖層
  if (map.value.getLayer('hotspot-circle')) {
    map.value.removeLayer('hotspot-circle')
  }
  if (map.value.getLayer('villages-layer')) {
    map.value.removeLayer('villages-layer')
  }
  if (map.value.getSource('hotspot-source')) {
    map.value.removeSource('hotspot-source')
  }
  if (map.value.getSource('villages-source')) {
    map.value.removeSource('villages-source')
  }

  // 3. 添加熱點圓圈
  map.value.addSource('hotspot-source', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [hotspot.center_lon, hotspot.center_lat]
      },
      properties: {
        radius_km: hotspot.radius_km
      }
    }
  })

  map.value.addLayer({
    id: 'hotspot-circle',
    type: 'circle',
    source: 'hotspot-source',
    paint: {
      'circle-radius': {
        stops: [
          [0, 0],
          [20, metersToPixelsAtMaxZoom(hotspot.radius_km * 1000, hotspot.center_lat)]
        ],
        base: 2
      },
      'circle-color': 'rgba(255, 100, 100, 0.2)',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ff3b30'
    }
  })

  // 4. 添加村莊點
    const villagesGeoJSON = {
      type: 'FeatureCollection',
      features: hotspot.villages.map(village => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [village.lon, village.lat]
        },
        properties: {
          village_name: village.village_name,
          lat: village.lat,
          lon: village.lon,
          city: village.city || '',
          county: village.county || '',
          township: village.township || ''
        }
      }))
    }

    map.value.addSource('villages-source', {
      type: 'geojson',
      data: villagesGeoJSON
    })

    map.value.addLayer({
      id: 'villages-layer',
      type: 'circle',
      source: 'villages-source',
      paint: {
        'circle-radius': 6,
        'circle-color': '#4a90e2',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    })

    if (villageLayerInteractionsBound) {
      map.value.off('click', 'villages-layer', handleVillageLayerClick)
      map.value.off('mouseenter', 'villages-layer', handleVillageLayerMouseEnter)
      map.value.off('mouseleave', 'villages-layer', handleVillageLayerMouseLeave)
    }

    // 點擊村莊點事件
    map.value.on('click', 'villages-layer', handleVillageLayerClick)

    // 鼠標懸停效果
    map.value.on('mouseenter', 'villages-layer', handleVillageLayerMouseEnter)
    map.value.on('mouseleave', 'villages-layer', handleVillageLayerMouseLeave)
    villageLayerInteractionsBound = true
  }

// 根據半徑計算合適的縮放級別
const calculateZoomFromRadius = (radiusKm) => {
  if (radiusKm > 50) return 8
  if (radiusKm > 30) return 9
  if (radiusKm > 20) return 10
  if (radiusKm > 10) return 11
  return 12
}

// 將米轉換為像素（用於圓圈半徑）
const metersToPixelsAtMaxZoom = (meters, latitude) => {
  return meters / 0.075 / Math.cos(latitude * Math.PI / 180)
}

const closePopup = () => {
  showPopup.value = false
  selectedVillage.value = null
}

const toggleFullScreen = async () => {
  isFullScreen.value = !isFullScreen.value
  await nextTick()
  if (map.value) map.value.resize()
}

const handleStyleChange = () => {
  if (!map.value) return
  const newStyle = mapStyle(currentStyleKey.value)
  map.value.setStyle(newStyle)

  // 樣式加載完成後重新渲染
  map.value.once('style.load', () => {
    if (props.hotspot) {
      renderHotspot()
    }
  })
}

const resetView = () => {
  if (!map.value || !props.hotspot) return

  map.value.flyTo({
    center: [props.hotspot.center_lon, props.hotspot.center_lat],
    zoom: calculateZoomFromRadius(props.hotspot.radius_km)
  })
}
</script>

<style scoped lang="scss">
.hotspot-map-container {
  width: 100%;
  height: 500px;
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.hotspot-map-container.is-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100dvh;
  border-radius: 0;
  z-index: 99999 !important;
  transform: none;
}

.map-container {
  width: 100%;
  height: 100%;
}

/* 地圖控制面板 */
.map-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  background: var(--glass-80);
  backdrop-filter: blur(12px);
  padding: 12px;
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
  width: 160px;
}

.control-group {
  width: 100%;
  position: relative;
}

.custom-select {
  position: relative;
  width: 100%;
}

.custom-select select {
  width: 100%;
  appearance: none;
  background: white;
  border: 1px solid var(--border-light-gray);
  padding: 8px 12px;
  border-radius: var(--radius-sm2);
  font-size: 14px;
  cursor: pointer;
  outline: none;
  transition: border 0.3s;
}

.custom-select select:focus {
  border-color: var(--vml-blue);
}

.custom-select .arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 12px;
  color: var(--text-muted);
}

.button-row {
  display: flex;
  gap: 8px;
  width: 100%;
}

.action-btn {
  flex: 1;
  background: var(--vml-blue);
  color: white;
  border: none;
  padding: 8px;
  border-radius: var(--radius-sm2);
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
}

.action-btn:hover {
  background: var(--vml-blue-dark);
}

.fullscreen-btn {
  background: var(--color-success);
}

.fullscreen-btn:hover {
  background: var(--color-success);
}

/* 全屏退出按鈕 */
.exit-fullscreen-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-dark);
  background: var(--glass-80);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-50);
  border-radius: 50px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  z-index: 2000;
  transition: all 0.3s ease;
}

.exit-fullscreen-btn:hover {
  background: var(--glass-90);
  transform: scale(1.05);
}

/* 加載狀態 */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: var(--glass-80);
  @include flex-col;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 20;
  font-weight: 500;
  color: var(--text-medium);
}
/* 村莊詳情彈窗 */
.village-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  @include flex-center;
  z-index: 10000;
}

.village-popup-content {
  background: white;
  border-radius: var(--radius-md);
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-divider);
}

.popup-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text-dark);
}

.popup-body {
  padding: 20px;
}

.info-row {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid var(--bg-light);
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .label {
  font-weight: 600;
  color: var(--text-medium);
  min-width: 80px;
}

.info-row .value {
  color: var(--text-dark);
  flex: 1;
}
</style>
