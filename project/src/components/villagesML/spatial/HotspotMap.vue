<template>
  <div class="hotspot-map-container" :class="{ 'is-fullscreen': isFullScreen }">
    <!-- 地圖容器 -->
    <div ref="mapContainer" class="map-container">
      <!-- 地圖控制面板 -->
      <div class="map-controls" v-if="!isFullScreen">
        <div class="control-group">
          <div class="custom-select">
            <select v-model="currentStyleKey" @change="handleStyleChange">
              <option
                v-for="(name, key) in mapStyleConfig"
                :key="key"
                :value="key"
              >
                {{ name }}
              </option>
            </select>
            <span class="arrow">▾</span>
          </div>
        </div>

        <div class="button-row">
          <button class="action-btn" @click="resetView">🎯 復位</button>
          <button class="action-btn fullscreen-btn" @click="toggleFullScreen">⛶ 全屏</button>
        </div>
      </div>

      <!-- 加載狀態 -->
      <div v-if="loading" class="loading-overlay">
        <div class="spinner"></div>
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
            <button class="close-btn" @click="closePopup">✕</button>
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
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, shallowRef, nextTick, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { mapStyle, mapStyleConfig, calculateDenseMapCenterAndZoom } from '@/utils/MapSource.js'

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

// 彈窗狀態
const showPopup = ref(false)
const selectedVillage = ref(null)

// 初始化地圖
onMounted(() => {
  initMap()
})

onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove()
    map.value = null
  }
})

// 監聽熱點數據變化
watch(() => props.hotspot, (newHotspot) => {
  if (map.value && newHotspot) {
    renderHotspot()
  }
}, { deep: true })

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

  // 點擊村莊點事件
  map.value.on('click', 'villages-layer', (e) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0]
      selectedVillage.value = feature.properties
      showPopup.value = true
    }
  })

  // 鼠標懸停效果
  map.value.on('mouseenter', 'villages-layer', () => {
    map.value.getCanvas().style.cursor = 'pointer'
  })

  map.value.on('mouseleave', 'villages-layer', () => {
    map.value.getCanvas().style.cursor = ''
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
      'circle-stroke-color': '#ff6464'
    }
  })

  // 4. 添加村莊點
  if (hotspot.villages && hotspot.villages.length > 0) {
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
  }
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

<style scoped>
.hotspot-map-container {
  width: 100%;
  height: 500px;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.hotspot-map-container.is-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  border-radius: 0;
  z-index: 9999;
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
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  border: 1px solid #ddd;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  outline: none;
  transition: border 0.3s;
}

.custom-select select:focus {
  border-color: #4a90e2;
}

.custom-select .arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 12px;
  color: #888;
}

.button-row {
  display: flex;
  gap: 8px;
  width: 100%;
}

.action-btn {
  flex: 1;
  background: #4a90e2;
  color: white;
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
}

.action-btn:hover {
  background: #3a7bc8;
}

.fullscreen-btn {
  background: #50c878;
}

.fullscreen-btn:hover {
  background: #40b368;
}

/* 全屏退出按鈕 */
.exit-fullscreen-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 50px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  z-index: 2000;
  transition: all 0.3s ease;
}

.exit-fullscreen-btn:hover {
  background: rgba(255, 255, 255, 0.95);
  transform: scale(1.05);
}

/* 加載狀態 */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 20;
  font-weight: 500;
  color: #555;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(74, 144, 226, 0.2);
  border-top-color: #4a90e2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 村莊詳情彈窗 */
.village-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.village-popup-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.popup-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: #f0f0f0;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  padding: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e0e0e0;
  color: #333;
}

.popup-body {
  padding: 20px;
}

.info-row {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .label {
  font-weight: 600;
  color: #555;
  min-width: 80px;
}

.info-row .value {
  color: #333;
  flex: 1;
}
</style>
