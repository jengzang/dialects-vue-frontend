<template>
  <div class="yubao-map-container" :class="{ 'is-fullscreen': isFullScreen }">
    <div ref="mapContainer" class="map-container">
      <div v-if="isLoadingMarkers" class="map-loading-overlay">
        <div class="loading-content">
          <div class="ui-loading--page" aria-hidden="true"></div>
          <span class="loading-text">{{ t('map.yuBaoMap.loading.mapData') }}</span>
        </div>
      </div>

      <div class="map-controls" v-if="!isFullScreen">
        <div class="control-group">
          <SimpleSelectDropdown
            v-model="currentStyleKey"
            :options="mapStyleOptions"
            @update:modelValue="handleStyleChange"
          />
        </div>

        <div class="control-group mode-switcher">
          <button
            :class="{ active: displayMode === 'location' }"
            @click="switchDisplayMode('location')"
            :title="t('map.yuBaoMap.controls.location')"
          >
            {{ t('map.yuBaoMap.controls.location') }}
          </button>
          <button
            :class="{ active: displayMode === 'pronunciation' }"
            @click="switchDisplayMode('pronunciation')"
            :title="t('map.yuBaoMap.controls.pronunciation')"
          >
            {{ t('map.yuBaoMap.controls.pronunciation') }}
          </button>
          <button
            :class="{ active: displayMode === 'definition' }"
            @click="switchDisplayMode('definition')"
            :title="t('map.yuBaoMap.controls.definition')"
          >
            {{ t('map.yuBaoMap.controls.definition') }}
          </button>
        </div>

        <div class="button-row">
          <button class="action-btn" @click="resetView" :title="t('map.yuBaoMap.buttons.reset')">
            🎯 {{ t('map.yuBaoMap.buttons.reset') }}
          </button>
          <button class="action-btn fullscreen-btn" @click="toggleFullScreen" :title="t('map.yuBaoMap.buttons.fullscreen')">
            ⛶ {{ t('map.yuBaoMap.buttons.fullscreen') }}
          </button>
        </div>
      </div>
    </div>

    <button v-if="isFullScreen" class="exit-fullscreen-btn" @click="toggleFullScreen">
      ✕ {{ t('map.yuBaoMap.buttons.exitFullscreen') }}
    </button>

    <Teleport to="body">
      <div v-if="showPopup && popupData" class="yubao-popup-overlay" @click="closePopup">
        <div class="yubao-popup-content" @click.stop>
          <div class="popup-header">
            <h3>{{ t('map.yuBaoMap.popup.title') }}</h3>
            <button
              class="close-btn close-btn-lg close-btn-inline"
              @click="closePopup"
              :title="t('common.button.close')"
              :aria-label="t('common.button.close')"
            >
              &times;
            </button>
          </div>
          <div class="popup-body">
            <div v-if="popupData.itemCount && popupData.itemCount > 1" class="aggregation-notice">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <span>{{ t('map.yuBaoMap.popup.clusteredCount', { count: popupData.itemCount }) }}</span>
            </div>

            <template v-if="activeTab === 'vocabulary'">
              <div class="info-row">
                <span class="label">{{ t('map.yuBaoMap.fields.location') }}</span>
                <span class="value">{{ popupData.locationChain }}</span>
              </div>
              <div class="info-row pronunciation-row">
                <span class="label">{{ t('map.yuBaoMap.fields.pronunciation') }}</span>
                <span class="value">{{ popupData.pronunciation || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="label">{{ t('map.yuBaoMap.fields.word') }}</span>
                <span class="value word-value">{{ popupData.word || '-' }}</span>
              </div>
              <div class="info-row" v-if="popupData.note1">
                <span class="label">{{ t('map.yuBaoMap.fields.note') }}</span>
                <span class="value">{{ popupData.note1 }}</span>
              </div>
              <div class="info-row category-row" v-if="popupData.category && popupData.category !== '-'">
                <span class="label">{{ t('map.yuBaoMap.fields.category') }}</span>
                <span class="value">{{ popupData.category }}</span>
              </div>
            </template>

            <template v-else>
              <div class="info-row">
                <span class="label">{{ t('map.yuBaoMap.fields.location') }}</span>
                <span class="value">{{ popupData.locationChain }}</span>
              </div>
              <div class="info-row pronunciation-row">
                <span class="label">{{ t('map.yuBaoMap.fields.pronunciation') }}</span>
                <span class="value">{{ popupData.phonetic || '-' }}</span>
              </div>
              <div class="info-row" v-if="popupData.memo">
                <span class="label">{{ t('map.yuBaoMap.fields.note') }}</span>
                <span class="value">{{ popupData.memo }}</span>
              </div>
              <div class="info-row" v-if="popupData.sentence">
                <span class="label">{{ t('map.yuBaoMap.fields.sentence') }}</span>
                <span class="value">{{ popupData.sentence }}</span>
              </div>
              <div class="info-row category-row" v-if="popupData.category && popupData.category !== '-'">
                <span class="label">{{ t('map.yuBaoMap.fields.category') }}</span>
                <span class="value">{{ popupData.category }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, shallowRef, nextTick, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {mapStyle, calculateDenseMapCenterAndZoom, mapStyleConfig} from '@/utils/map/MapSource.js'
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import { FEATURE_PALETTE } from '@/main/config/colors/mapColors.js'

// --- Props ---
const props = defineProps({
  mapData: {
    type: Array,
    default: () => []
  },
  activeTab: {
    type: String,
    default: 'vocabulary'
  }
})

// --- State ---
const mapContainer = ref(null)
const map = shallowRef(null)
const currentStyleKey = ref('gaode')
const displayMode = ref('pronunciation')
const isFullScreen = ref(false)
const popupData = ref(null)
const showPopup = ref(false)
const mapLoaded = ref(false)  // 跟踪地图是否已加载
const isLoadingMarkers = ref(false)  // 跟踪标记是否正在加载
const { t } = useI18n()

// Map style options
const mapStyleOptions = computed(() => {
  return Object.entries(mapStyleConfig).map(([key, name]) => ({
    label: name,
    value: key
  }))
})

// --- Functions ---

// 预定义的颜色数组（柔和的浅色系）— 从 mapColors.js 复用

// 根据文本生成一致的颜色（从预定义数组中选择）
const assignColor = (text) => {
  if (!text || text === '-') return '#E5E5E5'

  // 使用哈希函数计算索引
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash)
  }

  // 取绝对值并对数组长度取模，得到索引
  const index = Math.abs(hash) % FEATURE_PALETTE.length

  return FEATURE_PALETTE[index]
}

// 计算地图视角
const calculateMapView = (data) => {
  if (!data || data.length === 0) {
    return { center: [113.2644, 23.1291], zoom: 8 }
  }

  // 修复：使用正确的字段名 longitude 和 latitude
  const coordinates = data
    .map(item => {
      const lng = parseFloat(item.longitude)
      const lat = parseFloat(item.latitude)
      return [lng, lat]
    })
    .filter(coord => Array.isArray(coord) && coord.length >= 2 &&
            Number.isFinite(coord[0]) && Number.isFinite(coord[1]))

  if (coordinates.length === 0) {
    return { center: [113.2644, 23.1291], zoom: 8 }
  }

  return calculateDenseMapCenterAndZoom(coordinates)
}

// 智能截断文字（区分汉字和非汉字）
const truncateText = (text, maxLength = 6) => {
  if (!text) return ''

  let currentLength = 0
  let truncatedText = ''

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const code = char.charCodeAt(0)

    // 判断是否为汉字（CJK 统一表意文字）
    const isHanzi = (
      (code >= 0x4E00 && code <= 0x9FFF) ||   // CJK 统一表意文字
      (code >= 0x3400 && code <= 0x4DBF) ||   // CJK 扩展 A
      (code >= 0x20000 && code <= 0x2A6DF) || // CJK 扩展 B
      (code >= 0xF900 && code <= 0xFAFF) ||   // CJK 兼容表意文字
      (code >= 0x2F800 && code <= 0x2FA1F)    // CJK 兼容表意文字补充
    )

    const charLength = isHanzi ? 1 : 0.5

    if (currentLength + charLength > maxLength) {
      return truncatedText + '...'
    }

    truncatedText += char
    currentLength += charLength
  }

  return truncatedText
}

// 获取标记文本
const getMarkerText = (item) => {
  let text = ''

  // 检查值是否为空的辅助函数
  const isEmpty = (val) => {
    return !val || val === '（空）' || val === '(空)' || val.trim() === ''|| val === '(无)'|| val === '（无）'
  }

  if (displayMode.value === 'location') {
    // 地名模式
    if (props.activeTab === 'vocabulary') {
      // 優先順序: county -> village -> city
      text = isEmpty(item.county)
          ? (isEmpty(item.village) ? item.city : item.village)
          : item.county
    } else {
      // 優先順序: form_c -> form_d -> form_b
      text = isEmpty(item.form_c)
          ? (isEmpty(item.form_d) ? item.form_b : item.form_d)
          : item.form_c
    }
  } else if (displayMode.value === 'pronunciation') {
    // 语音模式
    text = props.activeTab === 'vocabulary' ? item.pronunciation : item.phonetic
  } else if (displayMode.value === 'definition') {
    // 释义模式
    text = props.activeTab === 'vocabulary' ? item.note2 : item.memo
  }

  // 智能截断（使用新的截断函数）
  if (text) {
    text = truncateText(text, 6)  // 6 个"汉字等效长度"
  }

  return text || '-'
}

// 获取地点链
const getLocationText = (item) => {
  if (props.activeTab === 'vocabulary') {
    return [item.province, item.city, item.county, item.village, item.location]
      .filter(Boolean)
      .join('-') || '-'
  } else {
    return [item.form_a, item.form_b, item.form_c, item.form_d, item.form_e]
      .filter(Boolean)
      .join('-') || '-'
  }
}

// 转换数据为 GeoJSON 格式
const convertToGeoJSON = (data) => {
  if (!data || data.length === 0) {
    return {
      type: 'FeatureCollection',
      features: []
    }
  }

  // 第一步：过滤有效坐标
  const validItems = data.filter(item => {
    const lng = parseFloat(item.longitude)
    const lat = parseFloat(item.latitude)
    return Number.isFinite(lng) && Number.isFinite(lat)
  })

  // 第二步：按经纬度分组，合并相同坐标的不同文字
  const coordinatesMap = new Map()

  for (const item of validItems) {
    const lng = parseFloat(item.longitude)
    const lat = parseFloat(item.latitude)
    const coordKey = `${lng},${lat}`

    if (!coordinatesMap.has(coordKey)) {
      coordinatesMap.set(coordKey, {
        lng,
        lat,
        items: []
      })
    }
    coordinatesMap.get(coordKey).items.push(item)
  }

  // 第三步：对每个坐标位置，合并不同的显示文字
  const deduplicatedFeatures = []

  for (const [coordKey, coordData] of coordinatesMap) {
    const { lng, lat, items } = coordData

    // 收集所有不同的显示文字
    const textSet = new Set()
    const textToItem = new Map() // 记录每个文字对应的第一个数据项

    for (const item of items) {
      const text = getMarkerText(item)
      if (text && text !== '-') {
        if (!textSet.has(text)) {
          textSet.add(text)
          textToItem.set(text, item)
        }
      }
    }

    // 如果没有有效文字，跳过
    if (textSet.size === 0) continue

    // 合并文字（用 / 分隔）
    const mergedText = Array.from(textSet).join(' / ')

    // 聚合所有数据项的信息用于弹窗
    const aggregateField = (fieldGetter) => {
      const values = new Set()
      for (const item of items) {
        const value = fieldGetter(item)
        if (value && value !== '-' && value.trim() !== '') {
          values.add(value)
        }
      }
      return values.size > 0 ? Array.from(values).join(' / ') : '-'
    }

    // 聚合各个字段
    const aggregatedData = {
      locationChain: aggregateField(item => getLocationText(item)),
      pronunciation: aggregateField(item => item.pronunciation),
      phonetic: aggregateField(item => item.phonetic),
      word: aggregateField(item => item.note2 || item.word),
      note1: aggregateField(item => item.note1),
      memo: aggregateField(item => item.memo),
      sentence: aggregateField(item => item.sentence),
      category: aggregateField(item => {
        const cats = [item.lang_cat1, item.lang_cat2, item.lang_cat3].filter(Boolean)
        return cats.length > 0 ? cats.join('-') : ''
      })
    }

    // 计算颜色（基于合并后的文字）
    let bgColor, textColor
    if (displayMode.value === 'location') {
       bgColor = '#1b2e2b'
       textColor = '#a6ffdc'
    } else {
      bgColor = assignColor(mergedText)
      textColor = '#1d1d1f'
    }

    deduplicatedFeatures.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      properties: {
        label: mergedText,
        bgColor: bgColor,
        textColor: textColor,
        // 使用聚合后的数据用于弹窗
        locationChain: aggregatedData.locationChain,
        pronunciation: aggregatedData.pronunciation,
        phonetic: aggregatedData.phonetic,
        word: aggregatedData.word,
        note1: aggregatedData.note1,
        memo: aggregatedData.memo,
        sentence: aggregatedData.sentence,
        category: aggregatedData.category,
        // 添加额外信息：此位置的数据点数量
        itemCount: items.length,
        uniqueTextCount: textSet.size
      }
    })
  }

  console.log(`📍 原始数据: ${validItems.length} 个点, 去重后: ${deduplicatedFeatures.length} 个位置`)

  // 统计聚合信息
  const aggregatedCount = deduplicatedFeatures.filter(f => f.properties.itemCount > 1).length
  const totalAggregatedItems = deduplicatedFeatures.reduce((sum, f) => sum + (f.properties.itemCount - 1), 0)

  if (aggregatedCount > 0) {
    console.log(`🔗 聚合统计: ${aggregatedCount} 个位置包含多个数据点, 共聚合了 ${totalAggregatedItems} 个重复点`)
  }

  return {
    type: 'FeatureCollection',
    features: deduplicatedFeatures
  }
}

// 渲染标记（使用 GeoJSON + Symbol Layer）
const renderMarkers = async () => {
  if (!map.value || !props.mapData || props.mapData.length === 0) {
    console.log('❌ renderMarkers: 无法渲染', {
      hasMap: !!map.value,
      hasData: !!props.mapData,
      dataLength: props.mapData?.length
    })
    isLoadingMarkers.value = false
    return
  }

  await nextTick()  // 确保加载动画显示

  // console.log('🗺️ 开始渲染标记', {
  //   dataCount: props.mapData.length,
  //   displayMode: displayMode.value,
  //   activeTab: props.activeTab
  // })

  const geojsonData = convertToGeoJSON(props.mapData)
  // console.log('✅ GeoJSON features:', geojsonData.features.length)

  // 更新 source 数据
  const source = map.value.getSource('yubao-markers')
  if (source) {
    source.setData(geojsonData)
  }

  // 等待地图渲染完成后隐藏加载动画
  setTimeout(() => {
    isLoadingMarkers.value = false
  }, 300)  // 给地图一些时间来渲染标记
}


// 处理标记点击（接受 GeoJSON properties）
const handleMarkerClick = (properties) => {
  popupData.value = {
    locationChain: properties.locationChain,
    pronunciation: properties.pronunciation,
    phonetic: properties.phonetic,
    word: properties.word,
    note1: properties.note1,
    memo: properties.memo,
    sentence: properties.sentence,
    category: properties.category
  }
  showPopup.value = true
}

// 关闭弹窗
const closePopup = () => {
  showPopup.value = false
  popupData.value = null
}

// 切换显示模式
const switchDisplayMode = (mode) => {
  displayMode.value = mode
  renderMarkers()
}

// 复位视角
const resetView = () => {
  if (!map.value) return

  const { center, zoom } = calculateMapView(props.mapData)
  map.value.flyTo({
    center,
    zoom,
    essential: true
  })
}

// 切换全屏
const toggleFullScreen = async () => {
  isFullScreen.value = !isFullScreen.value
  await nextTick()
  if (map.value) map.value.resize()
}

// 切换地图样式
const handleStyleChange = () => {
  if (!map.value) return
  const newStyle = mapStyle(currentStyleKey.value)

  // 保存当前数据
  const currentData = map.value.getSource('yubao-markers')?._data

  map.value.setStyle(newStyle)

  // 样式加载完成后重新添加 layers
  map.value.once('style.load', () => {
    if (!currentData) return

    // 重新添加 source
    map.value.addSource('yubao-markers', {
      type: 'geojson',
      data: currentData,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    })

    // 重新添加所有 layers（复用 initMap 中的代码）
    map.value.addLayer({
      id: 'yubao-clusters',
      type: 'circle',
      source: 'yubao-markers',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#51bbd6',
          100,
          '#f1f075',
          750,
          '#f28cb1'
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,
          100,
          30,
          750,
          40
        ],
        'circle-opacity': 0.85,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
      }
    })

    map.value.addLayer({
      id: 'yubao-cluster-count',
      type: 'symbol',
      source: 'yubao-markers',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 14
      },
      paint: {
        'text-color': '#ffffff'
      }
    })

    map.value.addLayer({
      id: 'yubao-unclustered-bg',
      type: 'circle',
      source: 'yubao-markers',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-radius': 18,
        'circle-color': ['get', 'bgColor'],
        'circle-opacity': 0.9,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': 'rgba(255, 255, 255, 0.8)'
      }
    })

    map.value.addLayer({
      id: 'yubao-unclustered-text',
      type: 'symbol',
      source: 'yubao-markers',
      filter: ['!', ['has', 'point_count']],
      layout: {
        'text-field': ['get', 'label'],
        'text-size': 12,
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-anchor': 'center'
      },
      paint: {
        'text-color': ['get', 'textColor']
      }
    })

    // 标记地图已重新加载完成
    mapLoaded.value = true
    console.log('✅ 地图样式切换完成，layers 已重新添加')
  })
}

// 初始化地图
const initMap = () => {
  if (!mapContainer.value) return

  // 设置初始加载状态
  isLoadingMarkers.value = true
  mapLoaded.value = false

  const { center, zoom } = calculateMapView(props.mapData)

  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: mapStyle(currentStyleKey.value),
    center,
    zoom,
    attributionControl: false
  })

  map.value.addControl(new maplibregl.NavigationControl(), 'top-left')

  map.value.on('load', () => {
    // 添加 GeoJSON source（带聚类）
    const geojsonData = convertToGeoJSON(props.mapData)

    map.value.addSource('yubao-markers', {
      type: 'geojson',
      data: geojsonData,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    })

    // 1. 聚类圆圈图层
    map.value.addLayer({
      id: 'yubao-clusters',
      type: 'circle',
      source: 'yubao-markers',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#51bbd6',
          100,
          '#f1f075',
          750,
          '#f28cb1'
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,
          100,
          30,
          750,
          40
        ],
        'circle-opacity': 0.85,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
      }
    })

    // 2. 聚类数量文字图层
    map.value.addLayer({
      id: 'yubao-cluster-count',
      type: 'symbol',
      source: 'yubao-markers',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 14
      },
      paint: {
        'text-color': '#ffffff'
      }
    })

    // 3. 未聚类点的圆形背景
    map.value.addLayer({
      id: 'yubao-unclustered-bg',
      type: 'circle',
      source: 'yubao-markers',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-radius': 18,
        'circle-color': ['get', 'bgColor'],
        'circle-opacity': 0.9,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': 'rgba(255, 255, 255, 0.8)'
      }
    })

    // 4. 未聚类点的文字
    map.value.addLayer({
      id: 'yubao-unclustered-text',
      type: 'symbol',
      source: 'yubao-markers',
      filter: ['!', ['has', 'point_count']],
      layout: {
        'text-field': ['get', 'label'],
        'text-size': 12,
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-anchor': 'center'
      },
      paint: {
        'text-color': ['get', 'textColor']
      }
    })

    // 点击聚类时放大
    map.value.on('click', 'yubao-clusters', (e) => {
      const features = map.value.queryRenderedFeatures(e.point, {
        layers: ['yubao-clusters']
      })

      if (!features.length) return

      const clusterId = features[0].properties.cluster_id
      map.value.getSource('yubao-markers').getClusterExpansionZoom(
        clusterId,
        (err, zoom) => {
          if (err) return

          map.value.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom + 0.5
          })
        }
      )
    })

    // 点击未聚类点时显示弹窗
    map.value.on('click', 'yubao-unclustered-bg', (e) => {
      if (e.features.length > 0) {
        const properties = e.features[0].properties
        handleMarkerClick(properties)
      }
    })

    // Hover 效果 - 聚类
    map.value.on('mouseenter', 'yubao-clusters', () => {
      map.value.getCanvas().style.cursor = 'pointer'
    })

    map.value.on('mouseleave', 'yubao-clusters', () => {
      map.value.getCanvas().style.cursor = ''
    })

    // Hover 效果 - 未聚类点
    map.value.on('mouseenter', 'yubao-unclustered-bg', () => {
      map.value.getCanvas().style.cursor = 'pointer'
    })

    map.value.on('mouseleave', 'yubao-unclustered-bg', () => {
      map.value.getCanvas().style.cursor = ''
    })

    // 标记地图已加载完成
    mapLoaded.value = true
    isLoadingMarkers.value = false  // 隐藏加载动画
    console.log('✅ Symbol layers 已添加，地图加载完成')
  })
}

// --- Lifecycle ---
onMounted(() => {
  initMap()
})

onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove()
    map.value = null
  }
})

// --- Watchers ---
watch(() => props.mapData, () => {
  if (map.value) {
    // 显示加载动画
    isLoadingMarkers.value = true
    const { center, zoom } = calculateMapView(props.mapData)
    map.value.flyTo({ center, zoom })
    renderMarkers()
  }
}, { deep: true })

watch(() => props.activeTab, () => {
  // 显示加载动画
  isLoadingMarkers.value = true
  renderMarkers()
})
</script>


<style scoped lang="scss">
.yubao-map-container {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.yubao-map-container.is-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100dvh;
  border-radius: 0;
  z-index: 99999;
}

.map-container {
  width: 100%;
  height: 100%;
  position: relative;
}

/* 加载动画覆盖层 */
.map-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--glass-90);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  @include flex-center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.loading-content {
  @include flex-col;
  align-items: center;
  gap: 16px;
}



.loading-text {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  letter-spacing: 0.3px;
}

/* 地图控制面板 */
.map-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  background: var(--glass-90);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 12px;
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  @include flex-col;
  gap: 10px;
  z-index: 10;
  width: 160px;
}

.control-group {
  width: 100%;
  position: relative;
  display: flex;
}

/* 自定义 Select */
.custom-select {
  position: relative;
  width: 100%;
}

.custom-select select {
  width: 100%;
  appearance: none;
  background: var(--bg-white);
  border: 1px solid var(--border-light-gray);
  padding: 8px 12px;
  border-radius: var(--radius-sm2);
  font-size: 14px;
  cursor: pointer;
  outline: none;
  transition: border 0.3s;
}

.custom-select select:focus {
  border-color: var(--color-primary);
}

.custom-select .arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 12px;
  color: var(--text-muted)
}

/* 模式切换按钮 */
.mode-switcher {
  display: flex;
  gap: 4px;
  background: var(--bg-light);
  border-radius: var(--radius-sm2);
  padding: 4px;
}

.mode-switcher button {
  flex: 1;
  padding: 6px 8px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-tertiary)
}

.mode-switcher button:hover {
  background: rgba(0, 0, 0, 0.05);
}

.mode-switcher button.active {
  background: white;
  color: var(--color-primary);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  :root[data-color-theme='dark'] & {
    color: var(--text-primary);
    background: var(--surface-panel-strong);
  }
}

/* 按钮行 */
.button-row {
  display: flex;
  gap: 10px;
  width: 100%;
}

.button-row .action-btn {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  white-space: nowrap;
}

.action-btn {
  background: var(--color-primary);
  color: var(--action-primary-text);
  border: none;
  padding: 8px;
  border-radius: var(--radius-sm2);
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.action-btn:hover {
  background: var(--color-primary-hover);
}

.fullscreen-btn {
  background: var(--color-success);
}

.fullscreen-btn:hover {
  background: #2db34e;
}

/* 退出全屏按钮 */
.exit-fullscreen-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-dark);
  background: var(--glass-70);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--glass-50);
  border-radius: 50px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
  cursor: pointer;
  z-index: 2000;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.exit-fullscreen-btn:hover {
  background: var(--glass-90);
  transform: scale(1.05);
  box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.15);
}

.exit-fullscreen-btn:active {
  transform: scale(0.95);
}



/* 全局样式 - 标记 */
.yubao-marker {
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  font-size: 13px;
  white-space: nowrap;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
  font-weight: 500;
  transition: all 0.2s;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* Hover effect removed for performance optimization */

/* 弹窗样式 */
.yubao-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  @include flex-center;
  z-index: 100000;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.yubao-popup-content {
  background: var(--bg-white);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  @include flex-col;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-divider);
  background: #f8f8f8;
}

.popup-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text-dark);
  font-weight: 600;
}

.popup-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

/* 聚合提示样式 */
.aggregation-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 16px;
  background: rgba(var(--color-primary-rgb), 0.08);
  border-left: 3px solid var(--color-primary);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--color-primary);
  font-weight: 500;
}

.aggregation-notice svg {
  flex-shrink: 0;
  opacity: 0.8;
}

/* 信息行样式 */
.info-row {
  display: flex;
  align-items: flex-start;
  padding: 14px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  gap: 12px;
  transition: background-color 0.2s;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row:hover {
  background-color: rgba(var(--color-primary-rgb), 0.02);
  margin: 0 -12px;
  padding-left: 12px;
  padding-right: 12px;
  border-radius: var(--radius-sm2);
}

/* 标签样式 */
.info-row .label {
  flex-shrink: 0;
  min-width: 60px;
  font-size: 13px;
  font-weight: 600;
  color: #6e6e73;
  letter-spacing: 0.3px;
  line-height: 1.6;
}

/* 值样式 */
.info-row .value {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.6;
  word-break: break-word;
}

/* 发音行特殊样式 */
.pronunciation-row .value {
  font-family: 'Courier New', 'Monaco', monospace;
  color: var(--color-primary);
  letter-spacing: 0.5px;
  font-size: 16px;
  font-weight: bold;
}

/* 字/词汇特殊样式 */
.word-value {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}

/* 分区行特殊样式 */
.category-row .value {
  color: var(--color-purple-light);
  font-weight: 600;
  font-size: 14px;
}

.info-line {
  padding: 10px 0;
  border-bottom: 1px solid var(--bg-light);
  font-size: 14px;
  line-height: 1.6;
}

.info-line:last-child {
  border-bottom: none;
}

.info-line strong {
  color: var(--text-medium);
  margin-right: 8px;
  font-weight: 600;
}
</style>