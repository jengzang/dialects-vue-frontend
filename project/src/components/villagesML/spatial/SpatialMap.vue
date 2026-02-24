<template>
  <Teleport to="body" :disabled="!isFullScreen">
    <div class="spatial-map-container" :class="{ 'is-fullscreen': isFullScreen }">
      <div ref="mapContainer" class="map-container">
        <!-- 地圖控制面板 -->
        <div class="map-controls" v-if="!isFullScreen">
          <div class="control-group">
            <div class="custom-select">
              <select v-model="currentStyleKey" @change="handleStyleChange">
                <option v-for="(name, key) in mapStyleConfig" :key="key" :value="key">
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
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, shallowRef, nextTick, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { mapStyle, mapStyleConfig } from '@/utils/MapSource.js'

const props = defineProps({
  // 地圖模式: 'hotspot' | 'clusters' | 'points'
  mode: {
    type: String,
    default: 'points'
  },
  // 熱點數據 (mode='hotspot')
  hotspot: {
    type: Object,
    default: null
  },
  // 聚類數據 (mode='clusters')
  clusters: {
    type: Array,
    default: () => []
  },
  // 通用點數據 (mode='points')
  points: {
    type: Array,
    default: () => []
  }
})

const mapContainer = ref(null)
const map = shallowRef(null)
const currentStyleKey = ref('gaode')
const loading = ref(false)
const isFullScreen = ref(false)

onMounted(() => {
  initMap()
})

onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove()
    map.value = null
  }
})

// 監聽數據變化
watch(() => [props.hotspot, props.clusters, props.points], () => {
  if (map.value) {
    renderData()
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
    renderData()
  })
}

const renderData = () => {
  if (!map.value) return

  // 清除舊圖層
  clearLayers()

  if (props.mode === 'hotspot' && props.hotspot) {
    renderHotspot()
  } else if (props.mode === 'clusters' && props.clusters.length > 0) {
    renderClusters()
  } else if (props.mode === 'points' && props.points.length > 0) {
    renderPoints()
  }
}

const clearLayers = () => {
  const layersToRemove = ['hotspot-circle', 'villages-layer', 'clusters-layer', 'clusters-labels', 'points-layer']
  const sourcesToRemove = ['hotspot-source', 'villages-source', 'clusters-source', 'points-source']

  layersToRemove.forEach(layer => {
    if (map.value.getLayer(layer)) {
      map.value.removeLayer(layer)
    }
  })

  sourcesToRemove.forEach(source => {
    if (map.value.getSource(source)) {
      map.value.removeSource(source)
    }
  })
}

const renderHotspot = () => {
  const hotspot = props.hotspot

  // 飛到熱點中心
  map.value.flyTo({
    center: [hotspot.center_lon, hotspot.center_lat],
    zoom: calculateZoomFromRadius(hotspot.radius_km)
  })

  // 添加熱點圓圈
  map.value.addSource('hotspot-source', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [hotspot.center_lon, hotspot.center_lat]
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

  // 添加村莊點
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

    // 點擊村莊點事件
    map.value.on('click', 'villages-layer', (e) => {
      if (e.features && e.features.length > 0) {
        const props = e.features[0].properties
        new maplibregl.Popup()
          .setLngLat(e.features[0].geometry.coordinates)
          .setHTML(`
            <div style="padding: 8px;">
              <h4 style="margin: 0 0 8px 0;">${props.village_name}</h4>
              <p style="margin: 4px 0;"><strong>坐標:</strong> ${props.lat}, ${props.lon}</p>
              ${props.city ? `<p style="margin: 4px 0;"><strong>城市:</strong> ${props.city}</p>` : ''}
              ${props.county ? `<p style="margin: 4px 0;"><strong>區縣:</strong> ${props.county}</p>` : ''}
              ${props.township ? `<p style="margin: 4px 0;"><strong>鄉鎮:</strong> ${props.township}</p>` : ''}
            </div>
          `)
          .addTo(map.value)
      }
    })

    map.value.on('mouseenter', 'villages-layer', () => {
      map.value.getCanvas().style.cursor = 'pointer'
    })

    map.value.on('mouseleave', 'villages-layer', () => {
      map.value.getCanvas().style.cursor = ''
    })
  }
}

const renderClusters = () => {
  const clustersGeoJSON = {
    type: 'FeatureCollection',
    features: props.clusters.map(cluster => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [cluster.centroid_lon, cluster.centroid_lat]
      },
      properties: {
        cluster_id: cluster.cluster_id,
        size: cluster.size,
        avg_distance_km: cluster.avg_distance_km
      }
    }))
  }

  map.value.addSource('clusters-source', {
    type: 'geojson',
    data: clustersGeoJSON
  })

  map.value.addLayer({
    id: 'clusters-layer',
    type: 'circle',
    source: 'clusters-source',
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['get', 'size'],
        0, 5,
        100, 10,
        1000, 15,
        10000, 20,
        100000, 30
      ],
      'circle-color': '#4a90e2',
      'circle-opacity': 0.7,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff'
    }
  })

  map.value.addLayer({
    id: 'clusters-labels',
    type: 'symbol',
    source: 'clusters-source',
    layout: {
      'text-field': ['to-string', ['get', 'cluster_id']],
      'text-size': 12
    },
    paint: {
      'text-color': '#ffffff'
    }
  })

  map.value.on('click', 'clusters-layer', (e) => {
    if (e.features && e.features.length > 0) {
      const props = e.features[0].properties
      new maplibregl.Popup()
        .setLngLat(e.features[0].geometry.coordinates)
        .setHTML(`
          <div style="padding: 8px;">
            <h4 style="margin: 0 0 8px 0;">聚類 #${props.cluster_id}</h4>
            <p style="margin: 4px 0;"><strong>大小:</strong> ${props.size} 點</p>
            <p style="margin: 4px 0;"><strong>平均距離:</strong> ${props.avg_distance_km?.toFixed(2)} km</p>
          </div>
        `)
        .addTo(map.value)
    }
  })

  map.value.on('mouseenter', 'clusters-layer', () => {
    map.value.getCanvas().style.cursor = 'pointer'
  })

  map.value.on('mouseleave', 'clusters-layer', () => {
    map.value.getCanvas().style.cursor = ''
  })

  // 調整視圖
  if (clustersGeoJSON.features.length > 0) {
    const bounds = new maplibregl.LngLatBounds()
    clustersGeoJSON.features.forEach(feature => {
      bounds.extend(feature.geometry.coordinates)
    })
    map.value.fitBounds(bounds, { padding: 50 })
  }
}

const renderPoints = () => {
  // 通用點渲染邏輯
  const pointsGeoJSON = {
    type: 'FeatureCollection',
    features: props.points.map(point => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [point.lon || point.longitude, point.lat || point.latitude]
      },
      properties: point
    }))
  }

  map.value.addSource('points-source', {
    type: 'geojson',
    data: pointsGeoJSON
  })

  map.value.addLayer({
    id: 'points-layer',
    type: 'circle',
    source: 'points-source',
    paint: {
      'circle-radius': 6,
      'circle-color': '#4a90e2',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff'
    }
  })

  if (pointsGeoJSON.features.length > 0) {
    const bounds = new maplibregl.LngLatBounds()
    pointsGeoJSON.features.forEach(feature => {
      bounds.extend(feature.geometry.coordinates)
    })
    map.value.fitBounds(bounds, { padding: 50 })
  }
}

const calculateZoomFromRadius = (radiusKm) => {
  if (radiusKm > 50) return 8
  if (radiusKm > 30) return 9
  if (radiusKm > 20) return 10
  if (radiusKm > 10) return 11
  return 12
}

const metersToPixelsAtMaxZoom = (meters, latitude) => {
  return meters / 0.075 / Math.cos(latitude * Math.PI / 180)
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

  map.value.once('style.load', () => {
    renderData()
  })
}

const resetView = () => {
  if (!map.value) return
  renderData()
}
</script>

<style scoped>
.spatial-map-container {
  width: 100%;
  height: 500px;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.spatial-map-container.is-fullscreen {
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
</style>
