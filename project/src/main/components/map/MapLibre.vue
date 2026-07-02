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
          v-if="isMiddleChineseMode && hasCustomData && mapStore.mapData"
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
        <div class="button-row">
          <button class="action-btn" @click="resetView">🎯 {{ t('map.mapLibre.buttons.reset') }}</button>
          <button class="action-btn fullscreen-btn" @click="toggleFullScreen">⛶ {{ t('map.mapLibre.buttons.fullscreen') }}</button>
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

    <Teleport to="body">
      <div v-if="locationPopup.visible" class="location-popup-overlay" @click="closeLocationPopup">
        <div class="location-popup-content" @click.stop>
          <div class="location-popup-header">
            <h3>📍 {{ t('map.mapLibre.locationPopup.title', { location: locationPopup.locationName }) }}</h3>
            <button
              class="close-btn close-btn-lg close-btn-inline"
              @click="closeLocationPopup"
              :title="t('common.button.close')"
              :aria-label="t('common.button.close')"
            >
              &times;
            </button>
          </div>
          <div class="location-popup-body">
            <div v-if="locationPopup.loading" class="popup-loading">
              <div class="ui-loading--page" aria-hidden="true"></div>
              <span>{{ t('map.mapLibre.locationPopup.loading') }}</span>
            </div>
            <div v-else-if="locationPopup.data && locationPopup.data.data && locationPopup.data.data.length > 0" class="data-display">
              <div class="dialect-info">
                <div class="info-line title-line">
                  {{ locationPopup.data.data[0]['語言'] }}
                </div>
                <div class="info-line">
                  <strong>{{ t('map.mapLibre.locationPopup.fields.mapRegion2') }}</strong>{{ locationPopup.data.data[0]['地圖集二分區'] || t('map.mapLibre.common.none') }}
                </div>
                <div class="info-line">
                  <strong>{{ t('map.mapLibre.locationPopup.fields.phoneticRegion') }}</strong>{{ locationPopup.data.data[0]['音典分區'] || t('map.mapLibre.common.none') }}
                </div>
                <div class="info-line">
                  <strong>{{ t('map.mapLibre.locationPopup.fields.characterSource') }}</strong>{{ locationPopup.data.data[0]['字表來源（母本）'] || t('map.mapLibre.common.none') }}
                </div>
                <div class="info-line">
                  <strong>{{ t('map.mapLibre.locationPopup.fields.coordinates') }}</strong>{{ formatCoordinates(locationPopup.data.data[0]['經緯度']) }}
                </div>
                <div class="info-line">
                  <strong>{{ t('map.mapLibre.locationPopup.fields.adminRegion') }}</strong>{{ formatAdministrativeRegion(locationPopup.data.data[0]) }}
                </div>

                <div class="tone-table-container">
                  <table class="tone-table">
                    <thead>
                      <tr>
                        <th>{{ t('map.mapLibre.locationPopup.fields.toneCategory') }}</th>
                        <th>{{ t('map.mapLibre.locationPopup.fields.toneValue') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(tone, index) in getToneData(locationPopup.data.data[0])" :key="index">
                        <td>{{ tone.label }}</td>
                        <td>{{ tone.value }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div v-else class="no-data">
              {{ t('map.mapLibre.locationPopup.noData') }}
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated, onBeforeUnmount, shallowRef, nextTick, watch, computed, h, render } from 'vue';
import { useI18n } from 'vue-i18n';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { mapStyle, mapStyleConfig, calculateMapCenterAndZoom } from '@/utils/map/MapSource.js';
import {get_detail} from "@/main/utils/ResultTable.js";
import {mapStore, userStore, resultCache} from "@/main/store/store.js";
import { showSuccess, showError, showWarning, showConfirm } from '@/utils/message.js';
import { getLocationDetail } from '@/api'
import { deleteCustomForm } from '@/api'
import { refreshCurrentCustomLayer } from '@/utils/map/MapData.js';
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue'
import CheckBox from '@/components/selector/CheckBox.vue'
import MapLegend from './MapLegend.vue'
import CompareMapPopup from '../popup/map/CompareMapPopup.vue'
import FeatureMapPopup from '../popup/map/FeatureMapPopup.vue'

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
    const payload = {
      db_key: "query",
      table_name: "dialects",
      page: 1,
      page_size: 50,
      sort_by: null,
      sort_desc: false,
      search_columns: [],
      search_text: "",
      filters: {
        '簡稱': [locationName]
      }
    };

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

// 格式化行政區劃
const formatAdministrativeRegion = (data) => {
  const parts = [];
  if (data['省']) parts.push(data['省']);
  if (data['市']) parts.push(data['市']);
  if (data['縣']) parts.push(data['縣']);
  if (data['鎮']) parts.push(data['鎮']);
  if (data['行政村']) parts.push(data['行政村']);
  if (data['自然村']) parts.push(data['自然村']);
  return parts.length > 0 ? parts.join('-') : t('map.mapLibre.common.none');
};

// 格式化經緯度（保留6位小數）
const formatCoordinates = (coords) => {
  if (!coords) return t('map.mapLibre.common.none');
  const parts = coords.split(',');
  if (parts.length !== 2) return coords;

  const lng = parseFloat(parts[0]);
  const lat = parseFloat(parts[1]);

  if (isNaN(lng) || isNaN(lat)) return coords;

  return `${lng.toFixed(6)}, ${lat.toFixed(6)}`;
};

const isValidCoordinatePair = (coord) => {
  return Array.isArray(coord) &&
    coord.length >= 2 &&
    Number.isFinite(coord[0]) &&
    Number.isFinite(coord[1]);
};

// 提取調值數據
const getToneData = (data) => {
  const tones = [
    { key: 'T1陰平', label: 'T1' },
    { key: 'T2陽平', label: 'T2' },
    { key: 'T3陰上', label: 'T3' },
    { key: 'T4陽上', label: 'T4' },
    { key: 'T5陰去', label: 'T5' },
    { key: 'T6陽去', label: 'T6' },
    { key: 'T7陰入', label: 'T7' },
    { key: 'T8陽入', label: 'T8' },
    { key: 'T9其他調', label: 'T9' },
    { key: 'T10輕聲', label: 'T10' }
  ];

  return tones
    .map(tone => ({
      label: tone.label,
      value: data[tone.key] || t('map.mapLibre.common.none')
    }))
    .filter(tone => tone.value !== t('map.mapLibre.common.none'));
};

// 20色盤 (來自 create_dot_all)
const colorPalette = [
  "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231",
  "#911eb4", "#42d4f4", "#f032e6", "#bfe745", "#fabed4",
  "#469990", "#dcbaff", "#9a6324", "#fffac8", "#800000",
  "#aaffc3", "#808000", "#ffd8b1", "#000075", "#a9a9a9"
];

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
  clearMarkers();
  if (map.value) {
    map.value.remove();
    map.value = null;
  }
});

// --- 監聽數據變化，自動重繪 ---
watch(
  // 監聽源改成 store 裡的數據
    [() => mapStore.mapData, () => mapStore.mergedData, () => mapStore.mode, () => props.activeFeature],
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
  }
};

const clearMarkers = () => {
  currentPopupMountTargets.forEach(target => render(null, target));
  currentPopupMountTargets = [];
  currentMarkers.forEach(marker => marker.remove());
  currentMarkers = [];
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
    levelColorMap[lvl] = colorPalette[idx % colorPalette.length];
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
      el.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.8), 0 4px 12px rgba(0,0,0,0.4)';
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
};

const AUTO_RESET_DENSITY_PERCENTILE = 0.98;
const MANUAL_RESET_DENSITY_PERCENTILE = 0.85;

const collectResetViewPoints = () => {
  let points = [];

  // compare / feature 模式优先按当前结果坐标复位，避免退回到 mapData 全量范围
  if ((mapStore.mode === 'compare' || mapStore.mode === 'feature') && mapStore.mergedData && mapStore.mergedData.length > 0) {
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

<style>
#toast {
  visibility: hidden;
  min-width: 220px;
  max-width: 80%;
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  background-color: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #c28f00;
  text-shadow: 0 0 1px rgba(0, 0, 0, 0.3);
  text-align: center;
  border-radius: 12px;
  padding: 20px 28px;
  position: fixed;
  z-index: 99999;
  left: 50%;
  top: 70%;
  transform: translate(-50%, -50%);
  font-size: 20px;
  line-height: 1.5;
  opacity: 0;
  transition: opacity 0.4s ease, transform 0.4s ease;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
}

#toast.show {
  visibility: visible;
  opacity: 1;
}

</style>

<style scoped>
.map-page-container {
  width: 90vw;
  height: 70vh;
  position: relative;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 30px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  z-index: 100;
}

.map-page-container.is-fullscreen {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100dvh;
  border-radius: 0;
  z-index: 9999!important;
  transform: none;
}

.map-container { width: 100%; height: 100%; }


/* ========================================= */
/* 復刻原代碼中的 Marker CSS (使用 :deep) */
/* ========================================= */

/* 1. 基礎地名 (create_map1) */
:deep(.marker-text-base) {
  background-color: #1b2e2b;
  color: #a6ffdc;
  padding: 2px 4px;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(114, 124, 245, 0.5);
  white-space: nowrap;
  font-family: "SimHei", "黑体", sans-serif;
  cursor: pointer;
  text-align: center;
  width: auto;
}

/* 2. 分區色點 (create_dot_all) */
:deep(.marker-dot) {
  width: 10px; height: 10px;
  border-radius: 50%;
  border: 2px solid #000; /* 復刻 strokeColor: #000000 */
  opacity: 0.8;
  cursor: pointer;
  box-shadow: 0 0 2px rgba(0,0,0,0.5);
}

/* 3. 特徵值 (triggerDrawingFunction) */
:deep(.marker-text-feature) {
  padding: 2px 4px;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(114, 124, 245, 0.5);
  font-size: 15px;
  color: black;
  white-space: nowrap;
  font-family: "Times New Roman", serif;
  border: 0.7px solid black;
  cursor: pointer;
  /* 背景色在JS中動態設置 */
}

</style>

<style scoped>
.map-page-container {
  width: 70dvw;
  height: 70vh;
  position: relative;
  border-radius: 30px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); /* ✨ 添加平滑過渡 */
  z-index: 100; /* 確保不被其他元素遮擋 */
}

/* ✨ 全屏樣式 */
.map-page-container.is-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100dvh;
  border-radius: 0;
  z-index: 99999;
}

/* ✨ 蘋果液態玻璃風格 - 退出按鈕 */
.exit-fullscreen-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  background: rgba(255, 255, 255, 0.65); /* 半透明白 */
  backdrop-filter: blur(20px) saturate(180%); /* 液態模糊感 */
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.5); /* 玻璃邊緣反光 */
  border-radius: 50px; /* 膠囊形狀 */
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1); /* 柔和陰影 */
  cursor: pointer;
  z-index: 2000;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.exit-fullscreen-btn:hover {
  background: rgba(255, 255, 255, 0.85);
  transform: scale(1.05);
  box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.15);
}

.exit-fullscreen-btn:active {
  transform: scale(0.95);
}

@media (max-aspect-ratio: 1/1 ) {
  .map-page-container {
    height: 65dvh;
    width: 90dvw;
  }
}

.map-container {
  width: 100%;
  height: 100%;
}

/* 浮動控制面板樣式 - 玻璃擬態 */
.map-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  /* ✨ 關鍵佈局設置 */
  display: flex;
  flex-direction: column; /* 讓子元素垂直排列 (各佔一行) */
  gap: 5px;              /* 控制三行之間的間距 */

  z-index: 10;
  width: 160px; /* 給個固定寬度，保證佈局穩定 */
}
.control-group {
  width: 100%; /* 填滿父容器寬度 */
  position: relative; /* 保持相對定位，不要用 absolute */
  display: flex; /* 確保它是塊級元素 */
}
.control-group label {
  font-size: 12px;
  color: #666;
  font-weight: bold;
  margin-bottom: 4px;
  display: block;
}

/* ✨ 新增：按鈕並排容器 */
.button-row {
  display: flex;
  gap: 10px;        /* 按鈕之間的間距 */
  width: 100%;
}

/* 讓按鈕平均分佈，或者根據需要調整寬度 */
.button-row .action-btn {
  flex: 1;          /* 兩個按鈕平分寬度 */
  display: flex;
  justify-content: center;
  align-items: center;
  white-space: nowrap;
}

.action-btn {
  background: #007aff;
  color: white;
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.action-btn:hover {
  background: #0062cc;
}

/* ✨ 全屏按鈕樣式 (綠色區分) */
.fullscreen-btn {
  background: #34c759; /* Apple Green */
}

.fullscreen-btn:hover {
  background: #2db34e;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  font-weight: bold;
  color: #555;
}
/* 整个容器样式 */
.custom-switch-container1 {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  position: relative;
}

/* 地名點擊彈窗樣式 */
.location-popup-overlay {
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

.location-popup-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.location-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.location-popup-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}



.location-popup-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.popup-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #666;
}

.dialect-info {
  font-size: 14px;
  line-height: 1.8;
}

.info-line {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-line:last-of-type {
  border-bottom: none;
  margin-bottom: 20px;
}

.title-line {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  padding: 12px 0;
  border-bottom: 2px solid #007bff;
  margin-bottom: 16px;
}

.info-line strong {
  color: #555;
  margin-right: 8px;
}

.tone-table-container {
  margin-top: 20px;
}

.tone-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.tone-table th,
.tone-table td {
  padding: 10px;
  text-align: left;
  border: 1px solid #ddd;
}

.tone-table th {
  background: #f5f5f5;
  font-weight: 600;
  color: #333;
}

.tone-table tbody tr:hover {
  background: #f9f9f9;
}

.data-display pre {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 16px;
}
</style>