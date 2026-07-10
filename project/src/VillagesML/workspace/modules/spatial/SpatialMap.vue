<template>
  <Teleport to="body" :disabled="!isFullScreen">
    <div class="spatial-map-container" :class="{ 'is-fullscreen': isFullScreen }">
      <div ref="mapContainer" class="map-container">
        <!-- 地圖控制面板 -->
        <div class="map-controls" v-if="!isFullScreen">
          <div class="control-group">
            <SimpleSelectDropdown
              v-model="currentStyleKey"
              :options="mapStyleOptions"
              @update:modelValue="handleStyleChange"
            />
          </div>

          <div class="button-row">
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
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, shallowRef, nextTick, watch, computed } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import { mapStyle, mapStyleConfig } from '@/utils/map/MapSource.js'

const props = defineProps({
  // 多圖層支持（新增）
  layers: {
    type: Array,
    default: () => []
  },
  // 地圖模式: 'hotspot' | 'clusters' | 'points' (保留向後兼容)
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

const emit = defineEmits(['point-click'])

const mapContainer = ref(null)
const map = shallowRef(null)
const currentStyleKey = ref('gaode')
const loading = ref(false)
const isFullScreen = ref(false)
const layerInteractionHandlers = new Map()

// Options for SimpleSelectDropdown
const mapStyleOptions = computed(() =>
  Object.entries(mapStyleConfig).map(([key, name]) => ({
    label: name,
    value: key
  }))
)

onMounted(() => {
  initMap()
})

onBeforeUnmount(() => {
  if (map.value) {
    clearLayerInteractions()
    map.value.remove()
    map.value = null
  }
})

// 監聽數據變化
watch(() => [props.hotspot, props.clusters, props.points, props.layers], () => {
  if (map.value) {
    renderData()
  }
}, { deep: true })

const unbindLayerInteractions = (layerId) => {
  const handlers = layerInteractionHandlers.get(layerId)
  if (!handlers) return

  if (map.value) {
    map.value.off('click', layerId, handlers.click)
    map.value.off('mouseenter', layerId, handlers.mouseenter)
    map.value.off('mouseleave', layerId, handlers.mouseleave)
  }

  layerInteractionHandlers.delete(layerId)
}

const clearLayerInteractions = () => {
  Array.from(layerInteractionHandlers.keys()).forEach(unbindLayerInteractions)
}

const bindLayerInteractions = (layerId, handlers) => {
  if (!map.value) return

  unbindLayerInteractions(layerId)
  map.value.on('click', layerId, handlers.click)
  map.value.on('mouseenter', layerId, handlers.mouseenter)
  map.value.on('mouseleave', layerId, handlers.mouseleave)
  layerInteractionHandlers.set(layerId, handlers)
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
    renderData()
  })
}

const renderData = () => {
  if (!map.value) return

  console.log('[SpatialMap] renderData called', {
    mode: props.mode,
    clustersLength: props.clusters?.length,
    hasHotspot: !!props.hotspot,
    pointsLength: props.points?.length,
    layersLength: props.layers?.length
  })

  // 清除舊圖層
  clearLayers()

  // 優先使用新的多圖層模式
  if (props.layers && props.layers.length > 0) {
    renderMultipleLayers()
  } else {
    // 向後兼容：使用舊的單一模式
    if (props.mode === 'hotspot' && props.hotspot) {
      renderHotspot()
    } else if (props.mode === 'clusters' && props.clusters.length > 0) {
      console.log('[SpatialMap] Rendering clusters:', props.clusters.length)
      renderClusters()
    } else if (props.mode === 'points' && props.points.length > 0) {
      renderPoints()
    }
  }
}

// 渲染多圖層（新增）
const renderMultipleLayers = () => {
  const allFeatures = []

  props.layers.forEach((layer, index) => {
    const sourceId = `${layer.id}-source`
    const layerId = `${layer.id}-layer`

    // 添加數據源
    if (!map.value.getSource(sourceId)) {
      map.value.addSource(sourceId, {
        type: 'geojson',
        data: layer.data
      })
    } else {
      map.value.getSource(sourceId).setData(layer.data)
    }

    // 添加圖層
    if (!map.value.getLayer(layerId)) {
      map.value.addLayer({
        id: layerId,
        type: layer.type || 'circle',
        source: sourceId,
        paint: layer.paint || {
          'circle-radius': 6,
          'circle-color': 'var(--vml-blue)',
          'circle-opacity': 0.7
        }
      })

      bindLayerInteractions(layerId, {
        click: (e) => {
          if (e.features && e.features.length > 0) {
            const props = e.features[0].properties
            emit('point-click', props)

            // 顯示彈窗
            showPopup(e.features[0], e.lngLat)
          }
        },
        mouseenter: () => {
          map.value.getCanvas().style.cursor = 'pointer'
        },
        mouseleave: () => {
          map.value.getCanvas().style.cursor = ''
        }
      })
    }

    // 收集所有特徵用於調整視圖
    if (layer.data && layer.data.features) {
      allFeatures.push(...layer.data.features)
    }
  })

  // 調整視圖以適應所有點
  if (allFeatures.length > 0) {
    const bounds = new maplibregl.LngLatBounds()
    allFeatures.forEach(feature => {
      if (feature.geometry && feature.geometry.coordinates) {
        bounds.extend(feature.geometry.coordinates)
      }
    })
    map.value.fitBounds(bounds, { padding: 50, maxZoom: 12 })
  }
}

// 顯示彈窗（新增）
const showPopup = (feature, lngLat) => {
  const props = feature.properties
  let html = '<div style="padding: 8px; max-width: 250px;">'

  if (props.type === 'hotspot') {
    html += `
      <h4 style="margin: 0 0 8px 0;">🔴 熱點 #${props.hotspot_id}</h4>
      <p style="margin: 4px 0;"><strong>半徑:</strong> ${props.radius_km?.toFixed(2)} km</p>
      <p style="margin: 4px 0;"><strong>村莊數:</strong> ${props.village_count}</p>
      <p style="margin: 4px 0;"><strong>密度:</strong> ${props.density?.toFixed(2)}</p>
    `
  } else if (props.type === 'cluster') {
    html += `
      <h4 style="margin: 0 0 8px 0;">🔵 聚類 #${props.cluster_id}</h4>
      <p style="margin: 4px 0;"><strong>大小:</strong> ${props.cluster_size} 點</p>
      <p style="margin: 4px 0;"><strong>平均距離:</strong> ${props.avg_distance_km?.toFixed(2)} km</p>
    `
  } else if (props.type === 'integration') {
    html += `
      <h4 style="margin: 0 0 8px 0;">🟣 空間整合: ${props.character}</h4>
      <p style="margin: 4px 0;"><strong>聚類 ID:</strong> ${props.cluster_id}</p>
      <p style="margin: 4px 0;"><strong>聚類大小:</strong> ${props.cluster_size} 村</p>
      <p style="margin: 4px 0;"><strong>含該字村數:</strong> ${props.n_villages_with_char}</p>
      <p style="margin: 4px 0;"><strong>傾向性均值:</strong> ${props.cluster_tendency_mean?.toFixed(3)}</p>
      <p style="margin: 4px 0;"><strong>傾向性標準差:</strong> ${props.cluster_tendency_std?.toFixed(3)}</p>
      <p style="margin: 4px 0;"><strong>空間一致性:</strong> ${props.spatial_coherence?.toFixed(3)}</p>
      <p style="margin: 4px 0;"><strong>主要城市:</strong> ${props.dominant_city || 'N/A'}</p>
      <p style="margin: 4px 0;"><strong>主要區縣:</strong> ${props.dominant_county || 'N/A'}</p>
      ${props.is_significant ? '<p style="margin: 4px 0; color: var(--color-gold); font-weight: bold;">✨ 統計顯著</p>' : ''}
      ${props.avg_p_value ? `<p style="margin: 4px 0;"><strong>P值:</strong> ${props.avg_p_value?.toFixed(4)}</p>` : ''}
    `
  } else if (props.type === 'village') {
    html += `
      <h4 style="margin: 0 0 8px 0;">🏘️ ${props.village_name}</h4>
      <p style="margin: 4px 0;"><strong>城市:</strong> ${props.city || 'N/A'}</p>
      <p style="margin: 4px 0;"><strong>區縣:</strong> ${props.county || 'N/A'}</p>
      <p style="margin: 4px 0;"><strong>鄉鎮:</strong> ${props.township || 'N/A'}</p>
    `
  } else if (props.type === 'cluster-center') {
    html += `
      <h4 style="margin: 0 0 8px 0;">🎯 聚類中心 #${props.cluster_id}</h4>
      <p style="margin: 4px 0;"><strong>聚類大小:</strong> ${props.cluster_size} 村</p>
      <p style="margin: 4px 0;"><strong>平均距離:</strong> ${props.avg_distance_km?.toFixed(2)} km</p>
      <p style="margin: 4px 0;"><strong>空間一致性:</strong> ${props.spatial_coherence?.toFixed(3)}</p>
      <p style="margin: 4px 0;"><strong>主要城市:</strong> ${props.dominant_city || 'N/A'}</p>
      <p style="margin: 4px 0;"><strong>主要區縣:</strong> ${props.dominant_county || 'N/A'}</p>
      <p style="margin: 4px 0;"><strong>字符數量:</strong> ${props.total_characters || 'N/A'}</p>
    `
  } else if (props.type === 'ngram') {
    html += `
      <h4 style="margin: 0 0 8px 0;">🟢 N-gram: ${props.ngram}</h4>
      <p style="margin: 4px 0;"><strong>區域:</strong> ${props.region_name}</p>
      ${props.city ? `<p style="margin: 4px 0;"><strong>城市:</strong> ${props.city}</p>` : ''}
      ${props.county ? `<p style="margin: 4px 0;"><strong>區縣:</strong> ${props.county}</p>` : ''}
      ${props.township ? `<p style="margin: 4px 0;"><strong>鄉鎮:</strong> ${props.township}</p>` : ''}
      <p style="margin: 4px 0;"><strong>位置:</strong> ${props.position === 'prefix' ? '前綴' : props.position === 'suffix' ? '後綴' : props.position === 'middle' ? '中間' : '全部'}</p>
      <p style="margin: 4px 0;"><strong>頻率:</strong> ${props.frequency} / ${props.regional_total}</p>
      <p style="margin: 4px 0;"><strong>傾向分數:</strong> ${props.tendency_score?.toFixed(2)}</p>
      <p style="margin: 4px 0;"><strong>Z 分數:</strong> ${props.z_score?.toFixed(2)}</p>
    `
  } else if (props.type === 'character') {
    html += `
      <h4 style="margin: 0 0 8px 0;">🟡 字符: ${props.char}</h4>
      <p style="margin: 4px 0;"><strong>區域:</strong> ${props.region_name}</p>
      ${props.city ? `<p style="margin: 4px 0;"><strong>城市:</strong> ${props.city}</p>` : ''}
      ${props.county ? `<p style="margin: 4px 0;"><strong>區縣:</strong> ${props.county}</p>` : ''}
      ${props.township ? `<p style="margin: 4px 0;"><strong>鄉鎮:</strong> ${props.township}</p>` : ''}
      <p style="margin: 4px 0;"><strong>Lift:</strong> ${props.lift?.toFixed(3)}</p>
      <p style="margin: 4px 0;"><strong>Z 分數:</strong> ${props.z_score?.toFixed(2)}</p>
    `
  } else {
    // 通用顯示
    html += '<h4 style="margin: 0 0 8px 0;">詳細信息</h4>'
    Object.entries(props).forEach(([key, value]) => {
      if (key !== 'type' && value !== null && value !== undefined) {
        html += `<p style="margin: 4px 0;"><strong>${key}:</strong> ${value}</p>`
      }
    })
  }

  html += '</div>'

  new maplibregl.Popup()
    .setLngLat(lngLat)
    .setHTML(html)
    .addTo(map.value)
}

const clearLayers = () => {
  if (!map.value) return

  clearLayerInteractions()

  // 清除舊的固定圖層
  const fixedLayersToRemove = ['hotspot-circle', 'villages-layer', 'clusters-layer', 'clusters-labels', 'points-layer']
  const fixedSourcesToRemove = ['hotspot-source', 'villages-source', 'clusters-source', 'points-source']

  // 清除所有可能的動態圖層（包括已取消選擇的）
  const allPossibleLayers = [
    'hotspots-layer',
    'clusters-layer',
    'ngrams-layer',
    'characters-heatmap-layer',
    'characters-points-layer',
    'characters-layer'
  ]

  const allPossibleSources = [
    'hotspots-source',
    'clusters-source',
    'ngrams-source',
    'characters-heatmap-source',
    'characters-points-source',
    'characters-source'
  ]

  // 清除當前 props.layers 中的圖層
  if (props.layers && props.layers.length > 0) {
    props.layers.forEach(layer => {
      allPossibleLayers.push(`${layer.id}-layer`)
      allPossibleSources.push(`${layer.id}-source`)
    })
  }

  // 合併所有需要清除的圖層
  const layersToRemove = [...new Set([...fixedLayersToRemove, ...allPossibleLayers])]
  const sourcesToRemove = [...new Set([...fixedSourcesToRemove, ...allPossibleSources])]

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
      'circle-stroke-color': 'var(--color-error-light)'
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
        'circle-color': 'var(--vml-blue)',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    })

    bindLayerInteractions('villages-layer', {
      click: (e) => {
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
      },
      mouseenter: () => {
        map.value.getCanvas().style.cursor = 'pointer'
      },
      mouseleave: () => {
        map.value.getCanvas().style.cursor = ''
      }
    })
  }
}

const renderClusters = () => {
  console.log('[SpatialMap] renderClusters - creating GeoJSON from', props.clusters.length, 'clusters')

  // 过滤掉坐标无效的聚类
  const validClusters = props.clusters.filter(cluster =>
    cluster.centroid_lon != null &&
    cluster.centroid_lat != null &&
    !isNaN(cluster.centroid_lon) &&
    !isNaN(cluster.centroid_lat)
  )

  console.log('[SpatialMap] Valid clusters:', validClusters.length, 'out of', props.clusters.length)

  if (validClusters.length === 0) {
    console.warn('[SpatialMap] No valid clusters to render')
    return
  }

  const clustersGeoJSON = {
    type: 'FeatureCollection',
    features: validClusters.map(cluster => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [cluster.centroid_lon, cluster.centroid_lat]
      },
      properties: {
        cluster_id: cluster.cluster_id,
        cluster_size: cluster.cluster_size,
        avg_distance_km: cluster.avg_distance_km
      }
    }))
  }

  console.log('[SpatialMap] GeoJSON features:', clustersGeoJSON.features.length)

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
        ['get', 'cluster_size'],
        0, 5,
        100, 10,
        1000, 15,
        10000, 20,
        100000, 30
      ],
      'circle-color': 'var(--vml-blue)',
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

  bindLayerInteractions('clusters-layer', {
    click: (e) => {
      if (e.features && e.features.length > 0) {
        const props = e.features[0].properties
        new maplibregl.Popup()
          .setLngLat(e.features[0].geometry.coordinates)
          .setHTML(`
            <div style="padding: 8px;">
              <h4 style="margin: 0 0 8px 0;">聚類 #${props.cluster_id}</h4>
              <p style="margin: 4px 0;"><strong>大小:</strong> ${props.cluster_size} 點</p>
              <p style="margin: 4px 0;"><strong>平均距離:</strong> ${props.avg_distance_km?.toFixed(2)} km</p>
            </div>
          `)
          .addTo(map.value)
      }
    },
    mouseenter: () => {
      map.value.getCanvas().style.cursor = 'pointer'
    },
    mouseleave: () => {
      map.value.getCanvas().style.cursor = ''
    }
  })

  // 计算中心点和边界
  const bounds = new maplibregl.LngLatBounds()
  clustersGeoJSON.features.forEach(feature => {
    bounds.extend(feature.geometry.coordinates)
  })

  // 计算中心点
  const center = bounds.getCenter()
  console.log('[SpatialMap] Bounds center:', center)

  // 使用 flyTo 飞到中心点，然后 fitBounds
  map.value.flyTo({
    center: [center.lng, center.lat],
    zoom: 8
  })

  // 延迟调整边界，确保地图已经移动到中心
  setTimeout(() => {
    map.value.fitBounds(bounds, { padding: 50, maxZoom: 12, duration: 1000 })
  }, 500)

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
      'circle-color': 'var(--vml-blue)',
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


.spatial-map-container {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: var(--radius-md);
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
  min-height: 350px;
}

.map-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  background: var(--glass-80);
  backdrop-filter: blur(12px);
  padding: 12px;
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  @include flex-col;
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



