<template>
  <div class="map-page-container" :class="{ 'is-fullscreen': isFullScreen }">
    <div ref="mapContainer" class="map-container">
      <div class="map-controls" v-if="!isFullScreen">
        <div class="control-group">
          <SimpleSelectDropdown
            v-model="currentStyleKey"
            :options="mapStyleOptions"
            @update:modelValue="handleStyleChange"
          />
        </div>

        <div
          v-if="mapStore.mode !== 'isopleth' && hasCustomData && mapStore.mapData"
          id="custom-switch-container"
          class="custom-switch-container1"
        >
          <CheckBox
            :model-value="mapStore.showCustomData"
            :label="t('map.mapLibre.controls.personalData')"
            :font-size="14"
            @change="toggleCustomSwitch"
          />
        </div>

        <div
          v-if="mapStore.mode !== 'isopleth' && !mapStore.divideMapView"
          id="base-switch-container"
          class="custom-switch-container1"
        >
          <CheckBox
            :model-value="isBaseModeActive"
            :label="t('map.mapLibre.controls.viewPlaceNames')"
            :font-size="14"
            @change="() => toggleBaseMode()"
          />
        </div>
        <div
          v-if="mapStore.divideMapView && isDivideDisplayMode"
          class="display-mode-radios"
        >
          <RadioGroup
            v-model="divideDisplayMode"
            name="map-display-mode"
            :options="divideDisplayModes"
            :size="13"
          />
        </div>
        <div v-if="mapStore.mode === 'isopleth' && isoplethLegend" class="isopleth-legend">
          <div class="isopleth-legend-title">{{ t('map.mapLibre.isopleth.title') }}</div>
          <div
            class="isopleth-legend-bar"
            :style="{ background: `linear-gradient(to right, ${isoplethLegend.colors.join(', ')})` }"
          ></div>
          <div class="isopleth-legend-labels">
            <span>{{ isoplethLegend.p3 }}</span>
            <span>{{ isoplethLegend.p97 }}</span>
          </div>
        </div>
        <button v-if="mapStore.mode === 'isopleth'" class="glass-button admin-boundary-btn" @click="openAdminBoundaryModal"><InlineIcon icon="🗺️" />{{ t('map.mapLibre.buttons.adminBoundary') }}</button>
        <div class="button-row">
          <button class="action-btn" @click="resetView"><InlineIcon icon="🎯" />{{ t('map.mapLibre.buttons.reset') }}</button>
          <button class="action-btn fullscreen-btn" @click="toggleFullScreen"><InlineIcon icon="⛶" />{{ t('map.mapLibre.buttons.fullscreen') }}</button>
        </div>
      </div>

      <MapLegend />
    </div>

    <button v-if="isFullScreen" class="exit-fullscreen-btn" @click="toggleFullScreen">
      ✕ {{ t('map.mapLibre.buttons.exitFullscreen') }}
    </button>

    <div v-if="loading" class="loading-overlay">
      <div class="ui-loading--page" aria-hidden="true"></div>
      <span>{{ t('map.mapLibre.loading.rendering') }}</span>
    </div>

    <LocationDetailPopup
      :visible="locationPopup.visible"
      :location-name="locationPopup.locationName"
      :data="locationPopup.data"
      :loading="locationPopup.loading"
      @close="closeLocationPopup"
    />

    <AdminBoundaryModal
      v-model="showAdminBoundaryModal"
      mode="import"
      :boundary-options="adminBoundaryOptions"
      :loading="isAdminBoundaryOptionsLoading"
      @confirm="handleAdminBoundaryConfirm"
    />
  </div>
</template>

<script setup>
import InlineIcon from '@/components/common/InlineIcon.vue'
import RadioGroup from '@/components/selector/RadioGroup.vue'
import { ref, onMounted, onActivated, onBeforeUnmount, shallowRef, nextTick, watch, computed, h, render } from 'vue';
import { useI18n } from 'vue-i18n';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { mapStyle, mapStyleConfig, calculateMapCenterAndZoom } from '@/utils/map/MapSource.js';
import {get_detail} from "@/main/utils/query/ResultTable.js";
import {mapStore, userStore, resultCache} from "@/main/store/store.js";
import { showSuccess, showError, showWarning, showConfirm } from '@/utils/ui/message.js';
import { getLocationDetail } from '@/api'
import { deleteCustomForm } from '@/api'
import { refreshCurrentCustomLayer } from '@/utils/map/MapData.js';
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import CheckBox from '@/components/selector/CheckBox.vue'
import MapLegend from './MapLegend.vue'
import CompareMapPopup from './popups/CompareMapPopup.vue'
import FeatureMapPopup from './popups/FeatureMapPopup.vue'
import LocationDetailPopup from '@/main/components/geo/popups/LocationDetailPopup.vue'
import { contours } from 'd3-contour';
import { convex, booleanPointInPolygon } from '@turf/turf';
import AdminBoundaryModal from '@/main/components/map/Draw/modals/AdminBoundaryModal.vue';
import { api } from '@/api/auth/httpClient.js';
import nationalBorderGeoJsonUrl from '/data/gis/china_country.geojson?url';
import provincesGeoJsonUrl from '/data/gis/china_provinces.geojson?url';
import citiesGeoJsonUrl from '/data/gis/china_cities_simplified_balanced.geojson?url';
import countiesGeoJsonUrl from '/data/gis/china_counties_simplified_light.geojson?url';

// --- Props: 只接收數據，不負責請求 ---
const props = defineProps({
  // 1. 基礎數據 (對應 locations_data)
  // 格式: { coordinates_locations: [['廣州', [113, 23]], ...], region_mappings: {...} }
  // mapData: { type: Object, default: null },
  // 2. 特徵詳細數據 (對應 mergedData)
  // 格式: [{ feature: '流攝', value: 'eu', coordinate: [...], color: '#f00', detailContent: [...], iscustoms: 0, notes: '' }, ...]
  // mergedData: { type: Array, default: () => window.mergedData},
  // 3. 當前模式: 'base'(基礎字), 'dot'(分區色點), 'feature'(特徵分佈)
  // mode: { type: String, default: 'base' },
  // 4. 當前選中的特徵 (僅 feature 模式有效)
  activeFeature: { type: String, default: '' },
  // 5. 是否開啟自定義顯示邏輯 (對應 window.isCustomOn)
  isCustom: { type: Boolean, default: false },
  // ✨ 新增：指定色點圖的層級 (1, 2, 3)
  dotLevel: { type: [String, Number], default: null },
});

// --- Emits ---
const emit = defineEmits(['map-click']);

const ISOPLETH_SOURCE_ID = 'isopleth-source';
const ISOPLETH_POINT_SOURCE_ID = 'isopleth-point-source';
const ISOPLETH_FILL_LAYER_ID = 'isopleth-fill-layer';
const ISOPLETH_POINT_LAYER_ID = 'isopleth-point-layer';
const DOT_HEATMAP_SOURCE_ID = 'dot-heatmap-source';
const DOT_HEATMAP_LAYER_ID = 'dot-heatmap-layer';
const ADMIN_BOUNDARY_SOURCE_ID = 'admin-boundary-source';
const ADMIN_BOUNDARY_LAYER_ID = 'admin-boundary-line-layer';

const mapContainer = ref(null);
const map = shallowRef(null);
const currentStyleKey = ref('gaode');
const loading = ref(false);
const isFullScreen = ref(false);
const { t } = useI18n();

// Map style options
const mapStyleOptions = computed(() => {
  return Object.entries(mapStyleConfig).map(([key, name]) => ({
    label: name,
    value: key
  }))
})
// showCustomData 改为使用 mapStore 中的状态

// 2. ✨ 判斷是否為“查中古”模式
const isMiddleChineseMode = ref(false);
const hasCustomData = computed(() => {
  const data = mapStore.mergedData;
  if (!data || data.length === 0) return false;
  // 只要數組裡有一個 item 的 iscustoms 為 1，就說明開關是有用的
  return data.some(item => item.iscustoms === 1);
});

// 2. 定義檢查函數
const checkWindowMode = () => {
  isMiddleChineseMode.value = (resultCache && resultCache.mode === '查中古');
};
// 3. 切換開關邏輯
const toggleCustomSwitch = async () => {
  if (userStore.role === 'anonymous') {
    showWarning(t('map.mapLibre.messages.anonymousNoCustomData'));
    return;
  }

  const nextShowCustomData = !mapStore.showCustomData;

  // 关闭时不需要重新请求，直接隐藏即可
  if (!nextShowCustomData) {
    mapStore.showCustomData = false;
    return;
  }

  try {
    loading.value = true;

    // 打开个人数据前，重新请求一次 customData 后端
    await refreshCurrentCustomLayer();

    // 请求完成后再打开显示
    mapStore.showCustomData = true;
  } catch (error) {
    console.error('刷新自定义数据失败:', error);
    showError(t('map.mapLibre.messages.queryLocationFailed', { error: error.message }));
  } finally {
    loading.value = false;
  }
};
const lastNonBaseMode = ref('feature');
// 只要當前 store 是 base 模式，開關就是開的
const isBaseModeActive = computed(() => mapStore.mode === 'base');

// DivideTab 三模式切换：热力图 / 查看地名 / 圆点图
const isDivideDisplayMode = computed(() => ['base', 'dot', 'heatmap'].includes(mapStore.mode));
const divideDisplayModes = computed(() => [
  { label: t('map.mapLibre.displayModes.heatmap'), value: 'heatmap' },
  { label: t('map.mapLibre.displayModes.placeNames'), value: 'base' },
  { label: t('map.mapLibre.displayModes.dot'), value: 'dot' }
]);
const divideDisplayMode = computed({
  get: () => mapStore.mode,
  set: (value) => { mapStore.mode = value; }
});

// 4. 切換邏輯
const toggleBaseMode = (e) => {
  if (e) e.stopPropagation();

  if (mapStore.mode === 'base') {
    // 關閉開關 -> 回復到原來的模式
    mapStore.mode = lastNonBaseMode.value;
  } else {
    // 打開開關 -> 切換到 base 模式
    mapStore.mode = 'base';
  }
};
// 管理所有的 Marker 實例，用於清除
let currentMarkers = [];
let currentPopupMountTargets = [];
let isoplethClickHandler = null;
const isoplethLegend = ref(null);

const showAdminBoundaryModal = ref(false);
const adminBoundaryOptions = ref({ country: [], provinces: [], cities: [], counties: [] });
const isAdminBoundaryOptionsLoading = ref(false);

let provincesGeoJsonCache = null;
let citiesGeoJsonCache = null;
let countiesGeoJsonCache = null;

async function loadProvincesGeoJson() {
  if (provincesGeoJsonCache) return provincesGeoJsonCache;
  const res = await fetch(provincesGeoJsonUrl);
  if (!res.ok) throw new Error(`Failed to load provinces GeoJSON: ${res.status}`);
  provincesGeoJsonCache = await res.json();
  return provincesGeoJsonCache;
}

async function loadCitiesGeoJson() {
  if (citiesGeoJsonCache) return citiesGeoJsonCache;
  const res = await fetch(citiesGeoJsonUrl);
  if (!res.ok) throw new Error(`Failed to load cities GeoJSON: ${res.status}`);
  citiesGeoJsonCache = await res.json();
  return citiesGeoJsonCache;
}

async function loadCountiesGeoJson() {
  if (countiesGeoJsonCache) return countiesGeoJsonCache;
  const res = await fetch(countiesGeoJsonUrl);
  if (!res.ok) throw new Error(`Failed to load counties GeoJSON: ${res.status}`);
  countiesGeoJsonCache = await res.json();
  return countiesGeoJsonCache;
}

async function fetchHighPrecisionBoundaries(selectedIds) {
  const features = [];
  for (const id of selectedIds) {
    const data = await api(`/api/gis/boundary/by-id?feature_id=${id}`);
    if (data?.geometry) {
      features.push({ type: 'Feature', properties: data.feature || {}, geometry: data.geometry });
    }
  }
  if (!features.length) return null;
  return { type: 'FeatureCollection', features };
}

// 地名點擊彈窗狀態
const locationPopup = ref({
  visible: false,
  locationName: '',
  data: null,
  loading: false
});

// 處理地名點擊事件
const handleLocationClick = async (locationName) => {
  locationPopup.value.visible = true;
  locationPopup.value.locationName = locationName;
  locationPopup.value.loading = true;
  locationPopup.value.data = null;

  try {
    const response = await getLocationDetail(locationName);

    locationPopup.value.data = response;
  } catch (error) {
    console.error('Query location data failed:', error);
    showError(t('map.mapLibre.messages.queryLocationFailed', { error: error.message }));
  } finally {
    locationPopup.value.loading = false;
  }
};

// 關閉地名彈窗
const closeLocationPopup = () => {
  locationPopup.value.visible = false;
};

const isValidCoordinatePair = (coord) => {
  return Array.isArray(coord) &&
    coord.length >= 2 &&
    Number.isFinite(coord[0]) &&
    Number.isFinite(coord[1]);
};

import { CATEGORY_PALETTE } from '@/main/config/colors/mapColors.js'

// --- 生命周期 ---
onMounted(() => {
  initMap();
});

onActivated(() => {
  if (map.value && mapStore.mergedData?.length > 0) {
    applyResetView(AUTO_RESET_DENSITY_PERCENTILE);
  }
});

onBeforeUnmount(() => {
  clearIsoplethLayers();
  clearDotHeatmapLayers();
  clearMarkers();
  clearAdminBoundaryLayers();
  if (map.value) {
    map.value.remove();
    map.value = null;
  }
});

// --- 監聽數據變化，自動重繪 ---
watch(
  // 監聽源改成 store 裡的數據
    [() => mapStore.mapData, () => mapStore.mergedData, () => mapStore.isoplethPayload, () => mapStore.mode, () => props.activeFeature],
    () => {
      // 視圖內容變更時只重繪，不在這裡自行判斷是否 reset；
      // reset 邊界統一由 requestMapFitView -> fitViewKey watcher 控制。
      renderMapContent(false);
    },
    { deep: true }
);

watch(() => mapStore.showCustomData, () => {
  renderMapContent(false); // 切換自定義數據顯示時不重置視角
});

// 監聽 resultCache.mode 變化，更新 isMiddleChineseMode
watch(() => resultCache.mode, () => {
  checkWindowMode();
}, { immediate: true });

watch(
  () => mapStore.fitViewKey,
  async (key) => {
    if (!key) return;
    await nextTick();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    applyResetView(AUTO_RESET_DENSITY_PERCENTILE);
  },
  { flush: 'post' }
);


// 2. 監聽 store 的模式變化，自動記錄歷史
watch(
    () => mapStore.mode,
    (newMode) => {
      // 只要當前模式不是 base，就把它記下來
      if (newMode !== 'base') {
        lastNonBaseMode.value = newMode;
      }
    },
    { immediate: true }
);

// --- 初始化地圖 ---
const initMap = () => {
  if (!mapContainer.value) return;

  // 默認視角，後續會被數據覆蓋
  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: mapStyle(currentStyleKey.value),
    center: [113.2644, 23.1291],
    zoom: 8,
    attributionControl: false
  });

  map.value.addControl(new maplibregl.NavigationControl(), 'top-left');

  map.value.on('load', () => {
    // 地圖加載完畢，如果有數據，立即渲染
    renderMapContent();
    // 首次進入地圖視圖時若已帶模式數據(如等值線跳轉),依數據範圍校正視口；
    // fitViewKey 可能在掛載前就遞增,此處補一次 fit 避免視口停在默認中心。
    if (mapStore.mode !== 'base') {
      applyResetView(AUTO_RESET_DENSITY_PERCENTILE);
    }
  });

  // 監聽地圖點擊事件，傳遞坐標給父組件
  map.value.on('click', (e) => {
    emit('map-click', {
      lng: e.lngLat.lng,
      lat: e.lngLat.lat
    });
  });
};

// --- 核心渲染入口 ---
const renderMapContent = async (shouldResetView = true) => {
  if (!map.value) return;

  // 清除舊標記
  clearMarkers();
  clearIsoplethLayers();
  clearDotHeatmapLayers();
  clearAdminBoundaryLayers();

  // 視角統一由 requestMapFitView -> resetView 控制，這裡不再消費入口側預計算的 center/zoom。
  void shouldResetView;

  // 根據模式分發邏輯
  if (mapStore.mode === 'base') {
    drawBaseMap();
  } else if (mapStore.mode === 'dot') {
    drawDotMap();
  } else if (mapStore.mode === 'feature') {
    drawFeatureMap();
  } else if (mapStore.mode === 'compare') {
    drawCompareMap();
  } else if (mapStore.mode === 'isopleth') {
    drawIsopleth();
  } else if (mapStore.mode === 'heatmap') {
    drawDotHeatmap();
  }
};

const clearMarkers = () => {
  currentPopupMountTargets.forEach(target => render(null, target));
  currentPopupMountTargets = [];
  currentMarkers.forEach(marker => marker.remove());
  currentMarkers = [];
};

const clearIsoplethLayers = () => {
  if (!map.value) return;

  isoplethLegend.value = null;

  if (isoplethClickHandler) {
    map.value.off('click', ISOPLETH_POINT_LAYER_ID, isoplethClickHandler);
    isoplethClickHandler = null;
  }

  [ISOPLETH_POINT_LAYER_ID, ISOPLETH_FILL_LAYER_ID].forEach((layerId) => {
    if (map.value.getLayer(layerId)) {
      map.value.removeLayer(layerId);
    }
  });

  [ISOPLETH_SOURCE_ID, ISOPLETH_POINT_SOURCE_ID].forEach((sourceId) => {
    if (map.value.getSource(sourceId)) {
      map.value.removeSource(sourceId);
    }
  });
};

const clearAdminBoundaryLayers = () => {
  if (!map.value) return;

  if (map.value.getLayer(ADMIN_BOUNDARY_LAYER_ID)) {
    map.value.removeLayer(ADMIN_BOUNDARY_LAYER_ID);
  }

  if (map.value.getSource(ADMIN_BOUNDARY_SOURCE_ID)) {
    map.value.removeSource(ADMIN_BOUNDARY_SOURCE_ID);
  }
};

const clearDotHeatmapLayers = () => {
  if (!map.value) return;

  if (map.value.getLayer(DOT_HEATMAP_LAYER_ID)) {
    map.value.removeLayer(DOT_HEATMAP_LAYER_ID);
  }

  if (map.value.getSource(DOT_HEATMAP_SOURCE_ID)) {
    map.value.removeSource(DOT_HEATMAP_SOURCE_ID);
  }
};

// =======================================================
// 邏輯 1: 基礎圖繪製 (復刻 create_map1 的後半部分)
// =======================================================
const drawBaseMap = () => {
  // 用于跟踪已显示的坐标，避免重复
  const displayedCoordinates = new Set();

  // 辅助函数：将坐标转换为字符串键
  const coordToKey = (coord) => {
    if (!isValidCoordinatePair(coord)) return null;
    return `${coord[0].toFixed(6)},${coord[1].toFixed(6)}`;
  };

  // 辅助函数：创建地名标记
  const createLocationMarker = (locationName, coordinates) => {
    if (!isValidCoordinatePair(coordinates)) return null;
    if (!locationName || !locationName.trim()) return null;

    const [lng, lat] = coordinates;
    const key = coordToKey(coordinates);

    // 如果这个坐标已经显示过，跳过
    if (key && displayedCoordinates.has(key)) return null;

    // 字體大小邏輯 (完全復刻)
    const len = locationName.length;
    let fontSize = '10px';
    if (len <= 3) fontSize = '12.5px';
    else if (len === 4) fontSize = '11.5px';
    else if (len === 5) fontSize = '10.5px';

    // 創建 DOM
    const el = document.createElement('div');
    el.className = 'marker-text-base'; // 樣式見下方 style
    el.innerText = locationName;
    el.style.fontSize = fontSize;
    el.style.cursor = 'pointer'; // 添加指針樣式

    // 添加點擊事件
    el.addEventListener('click', () => {
      handleLocationClick(locationName);
    });

    // 添加 Marker
    const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([lng, lat])
        .addTo(map.value);

    // 标记该坐标已显示
    if (key) displayedCoordinates.add(key);

    return marker;
  };

  // 1. 显示基础地图数据的地名
  if (mapStore.mapData && mapStore.mapData.coordinates_locations) {
    mapStore.mapData.coordinates_locations.forEach(([locationName, coordinates]) => {
      const marker = createLocationMarker(locationName, coordinates);
      if (marker) currentMarkers.push(marker);
    });
  }

  // 2. 如果开启了自定义数据显示，额外显示自定义数据的地名
  if (mapStore.showCustomData && mapStore.mergedData && mapStore.mergedData.length > 0) {
    // 从 mergedData 中提取唯一的地点和坐标
    const customLocations = new Map(); // key: coordKey, value: locationName

    mapStore.mergedData.forEach(item => {
      if (item.iscustoms === 1 && isValidCoordinatePair(item.coordinate) && item.location) {
        const key = coordToKey(item.coordinate);
        if (key && !displayedCoordinates.has(key)) {
          // 同一个坐标可能有多个特征，只显示一次地名
          if (!customLocations.has(key)) {
            customLocations.set(key, {
              name: item.location,
              coord: item.coordinate
            });
          }
        }
      }
    });

    // 显示自定义地名
    customLocations.forEach(({ name, coord }) => {
      const marker = createLocationMarker(name, coord);
      if (marker) currentMarkers.push(marker);
    });
  }
};

// =======================================================
// 邏輯 2: 分區色點圖 (復刻 create_dot_all)
// =======================================================
const drawDotMap = () => {
  if (!mapStore.mapData || !mapStore.mapData.coordinates_locations) return;
  const data = mapStore.mapData;

  // 1. 確定層級 (maxLevel)
  // 優先使用父組件傳入的 dotLevel，如果沒有，默認 3 (復刻原代碼: if (maxLevel === 0) maxLevel = 3)
  let maxLevel = 3;
  if (props.dotLevel) {
    maxLevel = parseInt(props.dotLevel);
  }

  // 2. 收集分區並分配顏色
  const uniqueLevels = new Set();
  const pointsToDraw = [];

  data.coordinates_locations.forEach(([locName, coords]) => {
    if (!isValidCoordinatePair(coords)) return;
    const regionStr = data.region_mappings?.[locName];

    if (regionStr) {
      // --- ✨ 原封不動復刻取值邏輯 ---
      const parts = regionStr.split('-');
      const level1 = parts[0];
      const level2 = parts[1] || level1; // 如果沒有第2級，回退到第1級
      const level3 = parts[2] || level2; // 如果沒有第3級，回退到第2級

      let targetRegion = '';

      // 根據 maxLevel 決定使用哪個變量
      if (maxLevel === 1) {
        targetRegion = level1;
      } else if (maxLevel === 2) {
        targetRegion = level2;
      } else {
        targetRegion = level3; // 默認 Level 3
      }

      if (targetRegion) {
        uniqueLevels.add(targetRegion);
        pointsToDraw.push({ locName, coords, targetRegion, fullRegion: regionStr });
      }
    }
  });

  // 3. 建立顏色映射 (保持不變)
  const levelColorMap = {};
  Array.from(uniqueLevels).forEach((lvl, idx) => {
    levelColorMap[lvl] = CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length];
  });

  // 4. 繪製 (保持不變)
  pointsToDraw.forEach(p => {
    const color = levelColorMap[p.targetRegion];

    const el = document.createElement('div');
    el.className = 'marker-dot';
    el.style.backgroundColor = color;

    const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat(p.coords)
        .addTo(map.value);

    const popup = new maplibregl.Popup({ offset: 10, closeButton: false })
        .setHTML(`<b>${p.locName}</b><br>${p.fullRegion}`);

    el.addEventListener('mouseenter', () => marker.setPopup(popup).togglePopup());
    el.addEventListener('mouseleave', () => popup.remove());

    currentMarkers.push(marker);
  });
};

// =======================================================
// 邏輯 3: 特徵圖 + 複雜彈窗 (DOM版，支持按鈕點擊)
// =======================================================
const drawFeatureMap = () => {
  if (!mapStore.mergedData || mapStore.mergedData.length === 0) return;
  if (!props.activeFeature) return;

  const items = mapStore.mergedData.filter(item => {
    // item.feature === mapStore.activeFeature
    // 必须匹配特征
    const isFeatureMatch = item.feature === props.activeFeature;

    // ✨ 开关逻辑：
    // 如果开关开了(true)，则显示所有。
    // 如果开关关了(false)，则只显示 iscustoms !== 1 的数据。
    const isCustomMatch = mapStore.showCustomData ? true : item.iscustoms !== 1;

    return isFeatureMatch && isCustomMatch;
  });
  // console.log(items)
  items.forEach(item => {
    // 1. 基礎校驗：無值跳過
    if (!item.value || !item.value.trim()) return;
    // console.log(item.coordinate)
    // ✨ 新增魯棒性檢查：確保坐標存在、是數組、且前兩位是有效數字
    // 如果不滿足這些條件，直接 return 跳過，防止 maplibregl 報錯
    if (!isValidCoordinatePair(item.coordinate)) {
      return;
    }

    // 1. 創建地圖上的文字 Marker (保持不變)
    const el = document.createElement('div');
    el.className = 'marker-text-feature';
    el.innerText = item.value;
    el.style.backgroundColor = item.color || '#fff';

    const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat(item.coordinate)
        .addTo(map.value);

    // 2. ✨ 改動點：創建 DOM 節點而不是字符串
    const popupNode = createPopupDOM(item);

    // 3. 使用 setDOMContent
    const popup = new maplibregl.Popup({
      offset: 80,
      maxWidth: '300px',
      closeButton: false, // 建議隱藏默認關閉按鈕，用點擊地圖關閉，或者自己加
      className: 'map-popup-wrapper'
    }).setDOMContent(popupNode);

    marker.setPopup(popup);
    currentMarkers.push(marker);
  });
};

// ✨ 核心函數：生成 DOM 並綁定事件
const createPopupDOM = (item) => {
  const container = document.createElement('div');
  render(h(FeatureMapPopup, {
    item,
    isCustom: props.isCustom,
    noteText: t('map.mapLibre.popup.note', {
      note: item.notes || t('map.mapLibre.common.none')
    }),
    deleteButtonText: '🗑️ ' + t('map.mapLibre.buttons.delete'),
    detailButtonText: '📝 ' + t('map.mapLibre.buttons.detail'),
    onCustomClick: () => handleCustomBtnClick(item),
    onDetailClick: () => handleDetailBtnClick(item)
  }), container);
  currentPopupMountTargets.push(container);

  return container;
};

// --- 按鈕點擊處理函數 ---
const handleCustomBtnClick = async (item) => {
  const feature = item.feature;
  const value = item.value;
  const location = item.location;
  const created_at = item.created_at;
  const isConfirmed = await showConfirm(
      t('map.mapLibre.confirm.deleteMessage', { location, feature, value }),
      {
        title: t('map.mapLibre.confirm.title'),
        confirmText: t('map.mapLibre.confirm.confirmText'),
        cancelText: t('map.mapLibre.confirm.cancelText')
      }
  );
  if (isConfirmed) {
    if (!location || !feature || !value) {
      showError(t('map.mapLibre.messages.deleteInvalid'));
      return;
    }
    const formData = {
      location: location,
      feature: feature,
      value: value,
      created_at: created_at,
    };

    try {
      const data = await deleteCustomForm(formData);

      if (data.success) {
        showSuccess(t('map.mapLibre.messages.deleteSuccess', { message: data.message }));

        mapStore.showCustomData = true;

        try {
          await refreshCurrentCustomLayer()
          // console.log('Custom data refreshed after delete')
        } catch (error) {
          console.error('Failed to refresh data after delete:', error)
        }
      } else {
        showError(t('map.mapLibre.messages.deleteFailed', { message: data.message }));
      }
    } catch (error) {
      console.error('Delete failed:', error);
      showError(t('map.mapLibre.messages.deleteError'));
    }
  }
};

const handleDetailBtnClick = (item) => {
  // console.log("觸發詳情按鈕邏輯", item);
  get_detail(item.location, item.feature, false, true);
};

// =======================================================
// 邏輯 4: 比較模式 - 用圓點和顏色顯示比較結果
// =======================================================
const drawCompareMap = () => {
  // console.log('🗺️ drawCompareMap 被调用')
  // console.log('📦 mapStore.mergedData:', mapStore.mergedData)
  // console.log('📦 mergedData 长度:', mapStore.mergedData?.length)

  if (!mapStore.mergedData || mapStore.mergedData.length === 0) {
    console.warn('⚠️ mergedData 为空，无法绘制')
    return;
  }

  const items = mapStore.mergedData;
  // console.log(`🎨 开始绘制 ${items.length} 个标记`)

  items.forEach((item, index) => {
    // console.log(`  🔸 标记 ${index + 1}:`, item)

    // 坐標驗證
    if (!isValidCoordinatePair(item.coordinate)) {
      console.warn(`  ⚠️ 标记 ${index + 1} 坐标无效:`, item.coordinate)
      return;
    }

    // 創建圓點標記
    const el = document.createElement('div');
    el.className = 'marker-dot-compare';
    el.style.backgroundColor = item.color;
    el.style.width = '14px';
    el.style.height = '14px';
    el.style.borderRadius = '50%';
    el.style.border = '2px solid white';
    el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
    el.style.cursor = 'pointer';

    // 鼠标悬停效果 - 使用 box-shadow 而不是 transform 避免位置偏移
    el.addEventListener('mouseenter', () => {
      el.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.80), 0 4px 12px rgba(0,0,0,0.4)';
      el.style.width = '18px';
      el.style.height = '18px';
      el.style.zIndex = '1000';
    });
    el.addEventListener('mouseleave', () => {
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
      el.style.width = '14px';
      el.style.height = '14px';
      el.style.zIndex = 'auto';
    });

    // 創建彈窗內容
    const popupContent = createComparePopupNode(item);

    // 創建彈窗
    const popup = new maplibregl.Popup({
      offset: 15,
      maxWidth: '350px',
      className: 'map-popup-wrapper'
    }).setDOMContent(popupContent);

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat(item.coordinate)
      .setPopup(popup)
      .addTo(map.value);

    currentMarkers.push(marker);
    // console.log(`  ✅ 标记 ${index + 1} 已添加到地图`)
  });

  // console.log(`✅ 绘制完成，共添加 ${currentMarkers.length} 个标记`)
};

// =======================================================
// 邏輯: 點位密度熱力圖 (dot 模式数据的 heatmap 展示)
// =======================================================
const getDotHeatmapFeatureCollection = () => {
  const locations = mapStore.mapData?.coordinates_locations || [];

  return {
    type: 'FeatureCollection',
    features: locations
      .filter(([, coord]) => isValidCoordinatePair(coord))
      .map(([location, coord]) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: coord
        },
        properties: {
          location: location || '',
          count: 1
        }
      }))
  };
};

const drawDotHeatmap = () => {
  const featureCollection = getDotHeatmapFeatureCollection();
  if (featureCollection.features.length === 0) return;

  map.value.addSource(DOT_HEATMAP_SOURCE_ID, {
    type: 'geojson',
    data: featureCollection
  });

  map.value.addLayer({
    id: DOT_HEATMAP_LAYER_ID,
    type: 'heatmap',
    source: DOT_HEATMAP_SOURCE_ID,
    maxzoom: 14,
    paint: {
      'heatmap-weight': 1,
      'heatmap-intensity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        3, 0.3,
        11, 0.7
      ],
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(33,102,172,0)',
        0.2, '#67a9cf',
        0.4, '#d1e5f0',
        0.6, '#fddbc7',
        0.8, '#ef8a62',
        1, '#b2182b'
      ],
      'heatmap-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        3, 32,
        11, 72
      ],
      'heatmap-opacity': 0.9
    }
  });
};

const getIsoplethPointFeatureCollection = () => {
  const payload = mapStore.isoplethPayload || {};
  const toneMode = payload.toneMode === 'toned' ? 'toned' : 'toneless';
  const points = Array.isArray(payload.points) ? payload.points : [];
  console.log('[MapLibre] getIsoplethPointFeatureCollection payload =', payload);

  return {
    type: 'FeatureCollection',
    features: points
      .map((point) => {
        const uniqueSyllables = Number(point?.unique_syllables?.[toneMode] || 0);
        const qualifiedSyllableCount = Number(point?.qualified_syllable_count?.[toneMode] || 0);
        const count = qualifiedSyllableCount > 0 ? qualifiedSyllableCount : uniqueSyllables;
        if (count <= 0 || !isValidCoordinatePair(point?.coordinate)) return null;

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: point.coordinate
          },
          properties: {
            location: point.location || '',
            toneMode,
            count,
            uniqueSyllables,
            qualifiedSyllableCount,
            minCharCount: Number(payload.minCharCount || 1),
            totalTokens: Number(point?.total_tokens?.[toneMode] || 0)
          }
        };
      })
      .filter(Boolean)
  };
};

const createIsoplethPopupNode = (properties) => {
  const toneModeText = properties.toneMode === 'toned'
    ? t('phonology.phonology.countphos.syllables.modes.toned')
    : t('phonology.phonology.countphos.syllables.modes.toneless');

  const container = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = properties.location || '';
  const mode = document.createElement('div');
  mode.textContent = `${t('phonology.phonology.countphos.syllables.currentMode')}: ${toneModeText}`;
  const unique = document.createElement('div');
  unique.textContent = `${t('phonology.phonology.countphos.syllables.unique')}: ${properties.uniqueSyllables}`;
  const tokens = document.createElement('div');
  tokens.textContent = `${t('phonology.phonology.countphos.syllables.tokens')}: ${properties.totalTokens}`;

  container.append(title, mode, unique, tokens);

  if (Number(properties.qualifiedSyllableCount) > 0) {
    const qualified = document.createElement('div');
    qualified.textContent = `${t('phonology.phonology.countphos.syllables.qualifiedSyllables', { min: properties.minCharCount })}: ${properties.qualifiedSyllableCount}`;
    container.append(qualified);
  }

  return container;
};

// ---- isopleth(等值线)插值与绘制 ----
const percentile = (sorted, p) => {
  if (!sorted.length) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
};

const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const rgbToHex = (r, g, b) =>
  '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');

const ISOPLETH_RAMP_STOPS = ['#67a9cf', '#d1e5f0', '#fddbc7', '#ef8a62', '#b2182b'].map(hexToRgb);

const rampColor = (t) => {
  const clamped = Math.max(0, Math.min(1, t));
  const scaled = clamped * (ISOPLETH_RAMP_STOPS.length - 1);
  const i = Math.min(Math.floor(scaled), ISOPLETH_RAMP_STOPS.length - 2);
  const f = scaled - i;
  const a = ISOPLETH_RAMP_STOPS[i];
  const b = ISOPLETH_RAMP_STOPS[i + 1];
  return rgbToHex(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f);
};

const buildIsopleth = (features) => {
  // 1. 取点并去重(重合点会使 IDW 权重爆炸)
  const seen = new Set();
  const samples = [];
  features.forEach((feature) => {
    const coord = feature.geometry?.coordinates;
    const count = Number(feature.properties?.count || 0);
    if (!isValidCoordinatePair(coord) || count <= 0) return;
    const key = `${coord[0].toFixed(6)},${coord[1].toFixed(6)}`;
    if (seen.has(key)) return;
    seen.add(key);
    samples.push({ lng: coord[0], lat: coord[1], count });
  });

  if (samples.length < 2) return null;

  // 2. p3–p97 二十等份断点,退化时回退 [min, max]
  const counts = samples.map((s) => s.count).sort((a, b) => a - b);
  let p3 = percentile(counts, 0.03);
  let p97 = percentile(counts, 0.97);
  if (p97 - p3 < 1e-9) {
    p3 = counts[0];
    p97 = counts[counts.length - 1];
    if (p97 - p3 < 1e-9) p97 = p3 + 1;
  }

  const bandCount = 20;
  const delta = (p97 - p3) / bandCount;
  const breaks = Array.from({ length: bandCount }, (_, k) => p3 + k * delta);
  const colors = Array.from({ length: bandCount }, (_, k) => rampColor((k + 1) / bandCount));

  // 3. 包围盒 + 等距缩放(lng 乘 cos(lat))
  const lngs = samples.map((s) => s.lng);
  const lats = samples.map((s) => s.lat);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const cosLat = Math.max(0.2, Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180)));

  const width = Math.max(1e-6, (maxLng - minLng) * cosLat);
  const height = Math.max(1e-6, maxLat - minLat);
  const target = 150 * 150;
  const nx = Math.max(10, Math.min(200, Math.round(Math.sqrt(target * (width / height)))));
  const ny = Math.max(10, Math.min(200, Math.round(target / nx)));

  // 4. 凸包掩码(凸包外不画,防外溢到海洋/bbox)
  let hull = null;
  if (samples.length >= 3) {
    try {
      hull = convex({
        type: 'FeatureCollection',
        features: samples.map((s) => ({
          type: 'Feature',
          properties: {},
          geometry: { type: 'Point', coordinates: [s.lng, s.lat] }
        }))
      });
    } catch {
      hull = null;
    }
  }

  // 5. IDW 插值
  const samplesScaled = samples.map((s) => ({ x: s.lng * cosLat, y: s.lat, count: s.count }));
  const idw = (lng, lat) => {
    const x = lng * cosLat;
    const y = lat;
    let weightedSum = 0;
    let weightTotal = 0;
    for (const s of samplesScaled) {
      const dx = x - s.x;
      const dy = y - s.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 1e-12) return s.count;
      const w = 1 / d2;
      weightedSum += w * s.count;
      weightTotal += w;
    }
    return weightTotal ? weightedSum / weightTotal : 0;
  };

  // 6. 网格值(d3-contour 语义 value >= 阈值;掩码用 -Infinity 而非 NaN)
  const grid = new Float64Array(nx * ny);
  const stepX = (maxLng - minLng) / nx;
  const stepY = (maxLat - minLat) / ny;
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const lng = minLng + (i + 0.5) * stepX;
      const lat = minLat + (j + 0.5) * stepY;
      if (hull && !booleanPointInPolygon([lng, lat], hull)) {
        grid[j * nx + i] = -Infinity;
      } else {
        grid[j * nx + i] = Math.max(p3, Math.min(p97, idw(lng, lat)));
      }
    }
  }

  // 7. 抽等值面
  const mapCoord = (pt) => [
    minLng + (pt[0] / nx) * (maxLng - minLng),
    minLat + (pt[1] / ny) * (maxLat - minLat)
  ];
  const contourFeatures = contours()
    .size([nx, ny])
    .thresholds(breaks)(grid)
    .filter((geom) => geom.coordinates.length > 0)
    .map((geom) => ({
      type: 'Feature',
      properties: { value: geom.value },
      geometry: {
        type: 'MultiPolygon',
        coordinates: geom.coordinates.map((polygon) => polygon.map((ring) => ring.map(mapCoord)))
      }
    }));

  return { features: contourFeatures, breaks, colors, p3, p97 };
};

const drawIsopleth = () => {
  const pointCollection = getIsoplethPointFeatureCollection();
  console.log('[MapLibre] drawIsopleth pointCount =', pointCollection.features.length);
  if (pointCollection.features.length === 0) return;

  const result = buildIsopleth(pointCollection.features);
  console.log('[MapLibre] drawIsopleth buildIsopleth result =', result && {
    featureCount: result.features?.length,
    breaks: result.breaks,
    colors: result.colors,
    p3: result.p3,
    p97: result.p97
  });
  if (!result) return;

  map.value.addSource(ISOPLETH_SOURCE_ID, {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: result.features
    }
  });

  map.value.addSource(ISOPLETH_POINT_SOURCE_ID, {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: pointCollection.features
    }
  });

  const fillColorStops = [];
  result.breaks.forEach((brk, k) => fillColorStops.push(brk, result.colors[k]));

  map.value.addLayer({
    id: ISOPLETH_FILL_LAYER_ID,
    type: 'fill',
    source: ISOPLETH_SOURCE_ID,
    paint: {
      'fill-color': ['interpolate', ['linear'], ['get', 'value'], ...fillColorStops],
      'fill-outline-color': ['interpolate', ['linear'], ['get', 'value'], ...fillColorStops],
      'fill-opacity': 0.5
    }
  });

  map.value.addLayer({
    id: ISOPLETH_POINT_LAYER_ID,
    type: 'circle',
    source: ISOPLETH_POINT_SOURCE_ID,
    minzoom: 7,
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['get', 'count'],
        0, 3,
        200, 6,
        500, 10,
        1500, 16
      ],
      'circle-color': '#ef8a62',
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1.5,
      'circle-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        7, 0,
        11, 0.85
      ]
    }
  });

  isoplethClickHandler = (event) => {
    const feature = event.features?.[0];
    if (!feature) return;

    new maplibregl.Popup({ offset: 12 })
      .setLngLat(feature.geometry.coordinates)
      .setDOMContent(createIsoplethPopupNode(feature.properties || {}))
      .addTo(map.value);
  };

  map.value.on('click', ISOPLETH_POINT_LAYER_ID, isoplethClickHandler);

  isoplethLegend.value = {
    colors: result.colors,
    p3: Math.round(result.p3),
    p97: Math.round(result.p97)
  };
};

function openAdminBoundaryModal() {
  showAdminBoundaryModal.value = true;
  ensureAdminBoundaryOptions();
}

async function ensureAdminBoundaryOptions() {
  isAdminBoundaryOptionsLoading.value = true;
  try {
    const countryOpts = [{ label: '中国', value: '中国' }];
    const [prov, city, county] = await Promise.all([
      loadProvincesGeoJson().catch(() => null),
      loadCitiesGeoJson().catch(() => null),
      loadCountiesGeoJson().catch(() => null),
    ]);
    adminBoundaryOptions.value = {
      country: countryOpts,
      provinces: (prov?.features ?? []).map((f) => f?.properties?.name).filter(Boolean).map((n) => ({ label: n, value: n })),
      cities: (city?.features ?? []).map((f) => f?.properties?.name).filter(Boolean).map((n) => ({ label: n, value: n })),
      counties: (county?.features ?? []).map((f) => f?.properties?.name).filter(Boolean).map((n) => ({ label: n, value: n })),
    };
  } finally {
    isAdminBoundaryOptionsLoading.value = false;
  }
}

async function handleAdminBoundaryConfirm(config) {
  const { level, selectedNames, selectedIds, highPrecision } = config;
  let geoJson;
  try {
    if (highPrecision && level !== 'country') {
      geoJson = await fetchHighPrecisionBoundaries(selectedIds);
      if (!geoJson) { showError(t('map.drawTab.voronoi.clipBoundaryNoOptions')); return; }
    } else if (level === 'country') {
      const res = await fetch(nationalBorderGeoJsonUrl);
      if (!res.ok) throw new Error(`Failed to load country GeoJSON: ${res.status}`);
      geoJson = await res.json();
    } else if (level === 'provinces') {
      geoJson = await loadProvincesGeoJson();
    } else if (level === 'cities') {
      geoJson = await loadCitiesGeoJson();
    } else {
      geoJson = await loadCountiesGeoJson();
    }
  } catch (error) {
    showError(error.message || 'Failed to load boundary');
    return;
  }

  const filtered = (geoJson.features ?? []).filter(
    (f) => level === 'country' || selectedNames.includes(f?.properties?.name)
  );
  if (!filtered.length) { showError(t('map.drawTab.voronoi.clipBoundaryNoOptions')); return; }

  drawAdminBoundary({ type: 'FeatureCollection', features: filtered });
}

function drawAdminBoundary(featureCollection) {
  if (!map.value) return;
  clearAdminBoundaryLayers();
  map.value.addSource(ADMIN_BOUNDARY_SOURCE_ID, {
    type: 'geojson',
    data: featureCollection
  });
  map.value.addLayer({
    id: ADMIN_BOUNDARY_LAYER_ID,
    type: 'line',
    source: ADMIN_BOUNDARY_SOURCE_ID,
    paint: {
      'line-color': '#4a4a4a',
      'line-width': 1.5,
      'line-opacity': 0.9
    }
  });
}

// 創建比較模式的彈窗內容
function createComparePopupNode(item) {
  const statusMap = {
    same: { icon: 'OK', text: t('map.mapLibre.compare.status.same') },
    diff: { icon: 'X', text: t('map.mapLibre.compare.status.diff') },
    partial: { icon: '~', text: t('map.mapLibre.compare.status.partial') },
    maybe: { icon: '?', text: t('map.mapLibre.compare.status.maybe') },
    high_similar: { icon: '~', text: t('map.mapLibre.compare.status.highSimilar') }
  };
  const currentStatus = statusMap[item.status] || { icon: '?', text: t('map.mapLibre.compare.status.noData') };
  const statusIcon = currentStatus.icon;
  const statusText = currentStatus.text;

  const container = document.createElement('div');
  render(h(CompareMapPopup, {
    item,
    display: {
      compareType: mapStore.compareType,
      labels: {
        feature: t('map.mapLibre.compare.fields.feature'),
        result: t('map.mapLibre.compare.fields.result'),
        similarity: t('map.mapLibre.compare.fields.similarity'),
        readingComparison: t('map.mapLibre.compare.fields.readingComparison'),
        detail: t('map.mapLibre.compare.fields.detail'),
        toneComparison: t('map.mapLibre.compare.fields.toneComparison')
      }
    },
    status: {
      icon: statusIcon,
      text: statusText
    }
  }), container);
  currentPopupMountTargets.push(container);

  return container;
}



// --- 其他 UI 邏輯 ---
const toggleFullScreen = async () => {
  isFullScreen.value = !isFullScreen.value;
  await nextTick();
  if (map.value) map.value.resize();
};

const handleStyleChange = () => {
  if (!map.value) return;
  const newStyle = mapStyle(currentStyleKey.value);
  map.value.setStyle(newStyle);
  map.value.once('style.load', () => {
    renderMapContent(false);
  });
};

const AUTO_RESET_DENSITY_PERCENTILE = 0.98;
const MANUAL_RESET_DENSITY_PERCENTILE = 0.85;

const collectResetViewPoints = () => {
  let points = [];

  // compare / feature 模式优先按当前结果坐标复位，避免退回到 mapData 全量范围
  if (mapStore.mode === 'isopleth') {
    points = getIsoplethPointFeatureCollection().features
      .map(feature => feature.geometry?.coordinates)
      .filter(isValidCoordinatePair);
  }
  else if ((mapStore.mode === 'compare' || mapStore.mode === 'feature') && mapStore.mergedData && mapStore.mergedData.length > 0) {
    points = mapStore.mergedData
      .map(item => item.coordinate)
      .filter(isValidCoordinatePair);
  }
  // 1. 优先从 mapStore.mapData 提取坐标（基础地图数据）
  else if (mapStore.mapData && mapStore.mapData.coordinates_locations) {
    points = mapStore.mapData.coordinates_locations
      .map(item => item[1])
      .filter(isValidCoordinatePair);
  }
  // 2. 如果没有基础数据，从 mergedData 提取坐标（自定义数据或特征数据）
  else if (mapStore.mergedData && mapStore.mergedData.length > 0) {
    points = mapStore.mergedData
      .map(item => item.coordinate)
      .filter(isValidCoordinatePair);
  }

  return points;
};

const applyResetView = (densityPercentile = MANUAL_RESET_DENSITY_PERCENTILE) => {
  if (!map.value) return;

  const points = collectResetViewPoints();

  if (points.length > 0) {
    const { center, zoom } = calculateMapCenterAndZoom(points, { densityPercentile });
    map.value.flyTo({
      center,
      zoom,
      essential: true
    });
  } else {
    map.value.flyTo({
      center: [113.2644, 23.1291],
      zoom: 8,
      essential: true
    });
  }
};

const resetView = () => {
  applyResetView(MANUAL_RESET_DENSITY_PERCENTILE);
};
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$map-border-radius: var(--radius-2xl);
$map-transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
$control-panel-width: 160px;
$glass-transition: all 0.3s ease;

.map-page-container {
  position: relative;
  // left: 50%;
  z-index: 100;

  width: 75dvw;
  height: 75dvh;

  overflow: hidden;
  // transform: translateX(-50%);

  border-radius: $map-border-radius;
  box-shadow: 0 4px 20px var(--bg-hover-strong);

  transition: $map-transition;

  &.is-fullscreen {
    position: fixed;
    inset: 0;
    z-index: 99999;

    width: 100vw;
    height: 100dvh;

    transform: none;
    border-radius: 0;
  }

  @media (max-aspect-ratio: #{1 / 1}) {
    width: 90dvw;
    height: 65dvh;

    &.is-fullscreen {
      width: 100vw;
      height: 100dvh;
    }
  }
}

.map-container {
  width: 100%;
  height: 100%;
}

/* =========================
 * 地图控制面板
 * ========================= */

.map-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;

  display: flex;
  flex-direction: column;
  gap: 5px;

  width: $control-panel-width;
  padding: 12px;

  background: var(--glass-90);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.control-group {
  position: relative;

  display: flex;
  width: 100%;

  label {
    display: block;
    margin-bottom: 4px;

    color: var(--text-tertiary);
    font-size: 12px;
    font-weight: 700;
  }
}

.custom-switch-container1 {
  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;

  width: 100%;
}

.display-mode-radios {
  position: relative;

  display: flex;
  justify-content: center;

  width: 100%;
  padding: 4px 0;

  :deep(.liquid-radio-group) {
    gap: 4px 10px;
  }
}

.isopleth-legend {
  display: flex;
  flex-direction: column;
  gap: 4px;

  width: 100%;
  padding: 6px 4px;

  &-title {
    font-size: 12px;
    font-weight: 600;
    text-align: center;
  }

  &-bar {
    width: 100%;
    height: 10px;

    border-radius: 4px;
  }

  &-labels {
    display: flex;
    justify-content: space-between;

    font-size: 11px;
  }
}

.admin-boundary-btn {
  width: 100%;
  margin-bottom: 10px;
  border: 2px solid var(--border-glass);
}

.button-row {
  display: flex;
  gap: 10px;

  width: 100%;

  .action-btn {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;

    white-space: nowrap;
  }
}

.action-btn {
  padding: 8px;

  color: var(--action-primary-text);
  font-size: 13px;

  background: var(--color-primary);
  border: 0;
  border-radius: var(--radius-sm2);

  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: var(--color-primary-hover);
  }

  &:active {
    transform: scale(0.98);
  }
}

.fullscreen-btn {
  background: var(--color-success);

  &:hover {
    background: #2db34e;
  }
}

/* =========================
 * 全屏退出按钮
 * ========================= */

.exit-fullscreen-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 2000;

  display: flex;
  align-items: center;
  gap: 6px;

  padding: 12px 24px;

  color: var(--text-dark);
  font-size: 15px;
  font-weight: 600;

  background: var(--glass-70);
  border: 1px solid var(--glass-50);
  border-radius: var(--radius-full);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);

  cursor: pointer;
  transition: $glass-transition;

  &:hover {
    background: var(--glass-90);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
}

/* =========================
 * 页面加载遮罩
 * ========================= */

.loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  color: var(--text-medium);
  font-weight: 700;

  background: var(--glass-80);
}

/* =========================
 * MapLibre 动态 Marker
 *
 * 这些元素由 JavaScript 创建，没有 Vue 的
 * scoped 属性，因此必须使用 :deep()
 * ========================= */

:deep(.marker-text-base) {
  width: auto;
  padding: 2px 4px;

  color: var(--color-cyan);
  font-family: "SimHei", "黑体", sans-serif;
  text-align: center;
  white-space: nowrap;

  background-color: var(--color-dark-teal);
  border-radius: var(--radius-xs);
  box-shadow: var(--shadow-focus-ring);

  cursor: pointer;
}

:deep(.marker-dot) {
  width: 10px;
  height: 10px;

  opacity: 0.8;
  background-clip: padding-box;
  border: 2px solid var(--text-primary);
  border-radius: var(--radius-full);
  box-shadow: 0 0 2px var(--bg-overlay-dark);

  cursor: pointer;
}

:deep(.marker-text-feature) {
  padding: 2px 4px;

  color: var(--text-primary);
  font-family: "Times New Roman", serif;
  font-size: 15px;
  white-space: nowrap;

  border: 0.7px solid var(--text-primary);
  border-radius: var(--radius-xs);
  box-shadow: var(--shadow-focus-ring);

  cursor: pointer;

  // 背景色由 JavaScript 根据 item.color 动态设置。
}
</style>
