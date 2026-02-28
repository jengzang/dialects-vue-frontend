<template>
  <div class="map-page-container" :class="{ 'is-fullscreen': isFullScreen }">


    <div ref="mapContainer" class="map-container">
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

        <div
            v-if="isMiddleChineseMode && hasCustomData"
            id="custom-switch-container"
            class="custom-switch-container1"
            @click="toggleCustomSwitch"
        >
          <span class="switch-label-text">用戶個人數據</span>
          <div class="custom-switch" :class="{ 'open': mapStore.showCustomData }" id="custom-toggle">
              <span class="custom-slider">
                  <span id="switch-text" class="switch-text">
                    {{ mapStore.showCustomData ? '顯示' : '隱藏' }}
                  </span>
              </span>
          </div>
        </div>

        <div
            id="base-switch-container"
            class="custom-switch-container1"
            @click="toggleBaseMode"
        >
          <span class="switch-label-text">查看地名</span>

          <div class="custom-switch" :class="{ 'open': isBaseModeActive }" id="base-toggle">
        <span class="custom-slider">
            <span class="switch-text">
              {{ isBaseModeActive ? '開啟' : '關閉' }}
            </span>
        </span>
          </div>
        </div>
        <div class="button-row">
          <button class="action-btn" @click="resetView">🎯 復位</button>
          <button class="action-btn fullscreen-btn" @click="toggleFullScreen">⛶ 全屏</button>
        </div>
      </div>
    </div>

    <button v-if="isFullScreen" class="exit-fullscreen-btn" @click="toggleFullScreen">
      ✕ 退出全屏
    </button>

    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <span>地圖渲染中...</span>
    </div>

    <!-- 地名點擊彈窗 -->
    <Teleport to="body">
      <div v-if="locationPopup.visible" class="location-popup-overlay" @click="closeLocationPopup">
        <div class="location-popup-content" @click.stop>
          <div class="location-popup-header">
            <h3>{{ locationPopup.locationName }} - 詳細信息</h3>
            <button class="close-btn" @click="closeLocationPopup">✕</button>
          </div>
          <div class="location-popup-body">
            <div v-if="locationPopup.loading" class="popup-loading">
              <div class="spinner"></div>
              <span>加載中...</span>
            </div>
            <div v-else-if="locationPopup.data && locationPopup.data.data && locationPopup.data.data.length > 0" class="data-display">
              <div class="dialect-info">
                <div class="info-line title-line">
                  {{ locationPopup.data.data[0].語言 }}
                </div>
                <div class="info-line">
                  <strong>地圖集二分區：</strong>{{ locationPopup.data.data[0].地圖集二分區 || '無' }}
                </div>
                <div class="info-line">
                  <strong>音典分區：</strong>{{ locationPopup.data.data[0].音典分區 || '無' }}
                </div>
                <div class="info-line">
                  <strong>字表來源：</strong>{{ locationPopup.data.data[0]['字表來源（母本）'] || '無' }}
                </div>
                <div class="info-line">
                  <strong>經緯度：</strong>{{ formatCoordinates(locationPopup.data.data[0].經緯度) }}
                </div>
                <div class="info-line">
                  <strong>行政區劃：</strong>{{ formatAdministrativeRegion(locationPopup.data.data[0]) }}
                </div>

                <!-- 調值表格 -->
                <div class="tone-table-container">
                  <table class="tone-table">
                    <thead>
                      <tr>
                        <th>調類</th>
                        <th>調值</th>
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
              暫無數據
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, shallowRef, nextTick, watch, computed } from 'vue';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { mapStyle, mapStyleConfig, calculateDenseMapCenterAndZoom } from '@/utils/MapSource.js';
import {get_detail} from "@/utils/ResultTable.js";
import {mapStore, userStore, resultCache} from "@/utils/store.js";
import { showSuccess, showError, showWarning, showConfirm } from '@/utils/message.js';
import { sqlQuery } from '@/api/sql'
import { deleteCustomForm } from '@/api/user/custom.js'
import { func_mergeData } from '@/utils/MapData.js';

// --- Props: 只接收數據，不負責請求 ---
const props = defineProps({
  // 1. 基礎數據 (對應 locations_data)
  // 格式: { coordinates_locations: [['廣州', [113, 23]], ...], center_coordinate: [], zoom_level: 8, region_mappings: {...} }
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
const toggleCustomSwitch = () => {
  if (userStore.role === 'anonymous') {
    showWarning("未登錄用戶無法查看用戶個人數據！");
    return;
  }
  mapStore.showCustomData = !mapStore.showCustomData;
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
        簡稱: [locationName]
      }
    };

    const response = await sqlQuery(payload);

    locationPopup.value.data = response;
  } catch (error) {
    console.error('查詢地名數據失敗:', error);
    showError('查詢失敗：' + error.message);
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
  if (data.省) parts.push(data.省);
  if (data.市) parts.push(data.市);
  if (data.縣) parts.push(data.縣);
  if (data.鎮) parts.push(data.鎮);
  if (data.行政村) parts.push(data.行政村);
  if (data.自然村) parts.push(data.自然村);
  return parts.length > 0 ? parts.join('-') : ' ';
};

// 格式化經緯度（保留6位小數）
const formatCoordinates = (coords) => {
  if (!coords) return '無';
  const parts = coords.split(',');
  if (parts.length !== 2) return coords;

  const lng = parseFloat(parts[0]);
  const lat = parseFloat(parts[1]);

  if (isNaN(lng) || isNaN(lat)) return coords;

  return `${lng.toFixed(6)}, ${lat.toFixed(6)}`;
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
      value: data[tone.key] || '無'
    }))
    .filter(tone => tone.value !== '無'); // 只顯示有值的調類
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

onBeforeUnmount(() => {
  clearMarkers();
  if (map.value) {
    map.value.remove();
    map.value = null;
  }
});

// --- 監聽數據變化，自動重繪 ---
// 追蹤上一次的數據，用於判斷是否需要重置視角
const prevMapData = ref(null);
const prevMergedData = ref(null);

watch(
    // 監聽源改成 store 裡的數據
    [() => mapStore.mapData, () => mapStore.mergedData, () => mapStore.mode, () => props.activeFeature],
    ([newMapData, newMergedData, newMode]) => {
      // 判斷是否只是模式切換（數據沒變）
      const isOnlyModeChange =
        prevMapData.value === newMapData &&
        prevMergedData.value === newMergedData;

      // 更新追蹤值
      prevMapData.value = newMapData;
      prevMergedData.value = newMergedData;

      // 渲染地圖，傳入是否需要重置視角的標誌
      renderMapContent(!isOnlyModeChange);
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

// // 監聽 hasCustomData 變化（用於調試）
// watch(hasCustomData, (newVal) => {
//   console.log('📊 hasCustomData 變化:', newVal);
//   console.log('📌 isMiddleChineseMode:', isMiddleChineseMode.value);
//   console.log('📌 resultCache.mode:', resultCache.mode);
// });

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

  // 根據數據調整視角（僅在需要時）
  if (shouldResetView) {
    let centerCoord = null;
    let zoomLevel = 8;

    // 优先使用 mapStore.mapData（基础地图数据）
    if (mapStore.mapData && mapStore.mapData.center_coordinate) {
      centerCoord = mapStore.mapData.center_coordinate;
      zoomLevel = mapStore.mapData.zoom_level || 8;
    }
    // 如果没有 mapData，或者在 feature 模式且有 mergedData，则从 mergedData 中提取
    else if (mapStore.mergedData && mapStore.mergedData.length > 0) {
      const firstItem = mapStore.mergedData[0];
      if (firstItem.centerCoordinate) {
        centerCoord = firstItem.centerCoordinate;
        zoomLevel = firstItem.zoomLevel || 8;
      }
    }

    // 应用视角调整
    if (centerCoord && Array.isArray(centerCoord) && centerCoord.length >= 2) {
      map.value.flyTo({
        center: centerCoord,
        zoom: zoomLevel
      });
    }
  }

  // 根據模式分發邏輯
  if (mapStore.mode === 'base') {
    drawBaseMap();
  } else if (mapStore.mode === 'dot') {
    drawDotMap();
  } else if (mapStore.mode === 'feature') {
    drawFeatureMap();
  }
};

const clearMarkers = () => {
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
    if (!Array.isArray(coord) || coord.length < 2) return null;
    return `${coord[0].toFixed(6)},${coord[1].toFixed(6)}`;
  };

  // 辅助函数：创建地名标记
  const createLocationMarker = (locationName, coordinates) => {
    if (!coordinates || coordinates.length < 2) return null;
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
      if (item.iscustoms === 1 && item.coordinate && item.location) {
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
    if (!Array.isArray(item.coordinate) ||
        item.coordinate.length < 2 ||
        !Number.isFinite(item.coordinate[0]) ||
        !Number.isFinite(item.coordinate[1])) {
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
      className: 'custom-popup-wrapper'
    }).setDOMContent(popupNode);

    marker.setPopup(popup);
    currentMarkers.push(marker);
  });
};

// ✨ 核心函數：生成 DOM 並綁定事件
const createPopupDOM = (item) => {
  // 創建最外層容器
  const container = document.createElement('div');
  // 這裡直接用你的類名，方便你寫 CSS
  // 注意：MapLibre 會在外層再包一層，所以這裡不需要 active 類名來控制顯示，它出來就是顯示的
  container.className = 'popup active';

  // 1. 生成基礎 HTML (使用你提供的結構)
  let htmlContent = `
            <p>${item.location}</p>
            <p>${item.feature}</p>
    `;

  let showButtonType = null; // 記錄需要顯示哪種按鈕

  // --- 邏輯 A: 自定義數據 ---
  if (item.iscustoms === 1 && props.isCustom) {
    htmlContent += `
            <p style="margin-top:5px;">說明: ${item.notes || '無'}</p>
        `;
    showButtonType = 'custom'; // 標記需要自定義按鈕
  }
  // --- 邏輯 B: 百分比數據 ---
  else if (Array.isArray(item.detailContent) && item.detailContent.length > 0) {
    const hasPercentage = item.detailContent.some(d => d.hasOwnProperty('percentage'));

    if (hasPercentage) {
      // 降序
      const sorted = [...item.detailContent].sort((a, b) => b.percentage - a.percentage);
      htmlContent += `<ul>`;
      sorted.forEach(d => {
        const pct = (d.percentage * 100).toFixed(1) + '%';
        htmlContent += `<li>
                    <span class="dot">•</span>
                    <span class="val">${d.value}</span>
                    <span class="tilde">~</span>
                    <span class="pct">${pct}</span>
                </li>`;
      });
      htmlContent += `</ul>`;
      showButtonType = 'detail'; // 標記需要詳情按鈕
    } else {
      // 純文本
      htmlContent += `<p>${item.detailContent.join('<br>')}</p>`;
    }
  }

  // htmlContent += `</div>`; // 閉合 popup div
  container.innerHTML = htmlContent;

  // 2. ✨ 動態插入按鈕 (如果有需要)
  if (showButtonType) {
    const btn = document.createElement('button');
    // 給按鈕加個通用的 class 方便寫樣式
    btn.style.cursor = 'pointer';

    if (showButtonType === 'custom') {
      btn.className = 'mini-button-delete'; // 删除按钮使用暗红色样式
      btn.innerText = '🗑️ 刪除'; // (原 mini-btn0)
      btn.onclick = (e) => {
        e.stopPropagation(); // 防止點擊按鈕穿透到地圖
        handleCustomBtnClick(item);
      };
    } else if (showButtonType === 'detail') {
      btn.className = 'mini-button'; // 详情按钮使用蓝色样式
      btn.innerText = '📝 詳情'; // (原 mini-btn)
      btn.onclick = (e) => {
        e.stopPropagation();
        handleDetailBtnClick(item);
      };
    }

    container.appendChild(btn);
  }

  return container;
};

// --- 按鈕點擊處理函數 ---
const handleCustomBtnClick = async (item) => {
  // console.log("觸發自定義按鈕邏輯", item);
  const feature = item.feature;
  const value = item.value;
  const location = item.location;
  const created_at = item.created_at;
  // 顯示確認刪除的對話框
  const isConfirmed = await showConfirm(
      `📍 ${location}\n🔧 ${feature}  🔢 ${value}\n\n刪除後將無法恢復！`,
      {
        title: '確認刪除',
        confirmText: '刪除',
        cancelText: '取消'
      }
  );
  // 如果用戶點擊確定，執行刪除操作
  if (isConfirmed) {
    // 表單驗證
    if (!location || !feature || !value) {
      showError("刪除失敗，地點/特徵/值存在空值");
      return;  // 如果有空的字段，則不提交
    }
    // 構建表單數據對象
    const formData = {
      location: location,
      // region: null,
      // coordinates: null,
      feature: feature,
      value: value,
      created_at:created_at,
      // description: null // 如果說明為空，設置為 null
    };

    try {
      const data = await deleteCustomForm(formData);

      if (data.success) {
        showSuccess("刪除成功！\n" + data.message);

        // 自动打开自定义数据开关
        mapStore.showCustomData = true;

        // 重新加載合併數據
        try {
          await func_mergeData(resultCache.latestResults, mapStore.mapData)
          console.log('✅ 刪除後數據已刷新')
        } catch (error) {
          console.error('❌ 刷新數據失敗:', error)
        }
      } else {
        showError("刪除失敗：" + data.message);
      }
    } catch (error) {
      console.error("刪除失敗:", error);
      showError("刪除時發生錯誤！");
    }
  }
};

const handleDetailBtnClick = (item) => {
  // console.log("觸發詳情按鈕邏輯", item);
  get_detail(item.location, item.feature, false, true);
};


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

const resetView = () => {
  if (!map.value) return;

  let points = [];

  // 1. 优先从 mapStore.mapData 提取坐标（基础地图数据）
  if (mapStore.mapData && mapStore.mapData.coordinates_locations) {
    points = mapStore.mapData.coordinates_locations.map(item => item[1]);
  }
  // 2. 如果没有基础数据，从 mergedData 提取坐标（自定义数据或特征数据）
  else if (mapStore.mergedData && mapStore.mergedData.length > 0) {
    points = mapStore.mergedData
      .map(item => item.coordinate)
      .filter(coord => Array.isArray(coord) && coord.length >= 2 &&
                      Number.isFinite(coord[0]) && Number.isFinite(coord[1]));
  }

  // 3. 如果有坐标数据，重新计算最佳视角
  if (points.length > 0) {
    const { center, zoom } = calculateDenseMapCenterAndZoom(points);
    map.value.flyTo({
      center,
      zoom,
      essential: true
    });
  } else {
    // 没有数据时，返回默认视角（广州）
    map.value.flyTo({
      center: [113.2644, 23.1291],
      zoom: 8,
      essential: true
    });
  }
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

/* MapLibre 地图标记点击弹窗样式 (非 scoped，用于动态创建的弹窗) */
.popup,
.popup2 {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(8px) saturate(180%);
  -webkit-backdrop-filter: blur(8px) saturate(180%);
  padding: 6px 10px;
  width: 100px;
  border-radius: 12px;
  box-shadow: inset 0 0 1px rgba(255, 255, 255, 0.3), 0 4px 14px rgba(0, 0, 0, 0.2), 0 0 8px rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  z-index: 99999;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, transform 0.3s ease;
  text-align: center;
  color: #222;
  font-weight: 500;
}

.popup.active {
  opacity: 1;
  z-index: 99999;
  visibility: visible !important;
  transform: translateX(-50%) translateY(20px);
}

.popup-content {
  font-family: 'Arial', sans-serif;
  color: #333;
  text-align: center;
}

.popup h4 {
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 10px;
}

.popup p, .popup2 p {
  margin: 2px 0;
  font-size: 13px;
  padding: 0;
  border-radius: 5px;
  font-weight: bold;
  display: block;
}

.popup ul, .popup2 ul {
  padding: 0;
  list-style-type: none;
  margin: 0;
}

.popup li, .popup2 li {
  margin: 2px 0;
  font-size: 12px;
  font-weight: bold;
  padding: 1px 6px;
  background: linear-gradient(135deg, rgba(240, 240, 240, 0.4), rgba(255, 255, 255, 0.2));
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1), inset 0 0 1px rgba(255, 255, 255, 0.5);
  color: #333;
}

.popup-close-btn {
  background-color: #007aff;
  color: white;
  padding: 8px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 10px;
}

.popup-close-btn:hover {
  background-color: #005bb5;
}

/* 迷你按钮样式 (用于动态创建的按钮) */
.mini-button {
  margin-top: 2px;
  padding: 1px 2px;
  font-size: 11px;
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.mini-button:hover {
  background-color: #005fcc;
  transform: scale(1.2);
}

.mini-button-delete {
  margin-top: 2px;
  padding: 1px 2px;
  font-size: 11px;
  background-color: #8B0000;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.mini-button-delete:hover {
  background-color: #A52A2A;
  transform: scale(1.2);
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

/* 4. 複雜彈窗樣式 */
:deep(.maplibregl-popup-content) {
  padding: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}
:deep(.popup-container) {
  min-width: 200px;
  font-family: sans-serif;
}
:deep(.popup-header) {
  background: #f5f5f7;
  padding: 10px 15px;
  border-bottom: 1px solid #e1e1e1;
}
:deep(.popup-header strong) {
  display: block;
  font-size: 16px;
  color: #1d1d1f;
}
:deep(.popup-header .sub) {
  font-size: 12px;
  color: #86868b;
}
:deep(.popup-body), :deep(.popup-list) {
  padding: 10px 15px;
  max-height: 200px;
  overflow-y: auto;
}
:deep(.popup-list ul) {
  list-style: none;
  padding: 0; margin: 0;
}
:deep(.popup-list li) {
  font-size: 13px;
  color: #424245;
  margin-bottom: 4px;
}
:deep(.note-box) {
  background: #fff9c4;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-top: 5px;
}
:deep(.pct) {
  font-weight: bold;
  color: #007aff;
  margin-left: 4px;
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

/* 自定義 Select */
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
  border-color: #007aff;
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

.switch-label-text {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.custom-switch {
  position: relative;
  cursor: pointer;
  width: 50px;
  height: 30px;
  background-color: #ccc;
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}

.custom-slider {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-slider:before {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 26px;
  height: 26px;
  background-color: white;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.custom-switch.open .custom-slider:before {
  transform: translateX(20px);
}

.custom-switch:hover {
  background-color: dimgray;
  box-shadow: 0 0 10px 4px rgba(0, 123, 255, 0.7);
  transform: scale(1.1);
}

.custom-switch:hover .custom-slider:before {
  background-color: white;
  box-shadow: 0 0 8px rgba(0, 123, 255, 0.5);
}

.custom-switch.open {
  background-color: #007aff;
  animation: blueGlow 2s infinite ease-in-out;
}

.custom-switch.open:hover {
  background: linear-gradient(135deg, #00bfff, #66ccff);
  transform: scale(1.1);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
}

@keyframes blueGlow {
  0% {
    box-shadow: 0 0 5px rgba(0, 122, 255, 0.4),
    0 0 10px rgba(0, 122, 255, 0.6),
    0 0 20px rgba(0, 122, 255, 0.8),
    0 0 30px rgba(0, 122, 255, 0.9);
  }
  50% {
    box-shadow: 0 0 10px rgba(102, 204, 255, 0.6),
    0 0 20px rgba(102, 204, 255, 0.8),
    0 0 30px rgba(102, 204, 255, 1),
    0 0 40px rgba(102, 204, 255, 1);
  }
  100% {
    box-shadow: 0 0 5px rgba(0, 122, 255, 0.4),
    0 0 10px rgba(0, 122, 255, 0.6),
    0 0 20px rgba(0, 122, 255, 0.8),
    0 0 30px rgba(0, 122, 255, 0.9);
  }
}

.custom-switch.open:hover .custom-slider:before {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}

.switch-text {
  color: black;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  position: absolute;
  z-index: 1;
  transition: transform 0.3s ease, color 0.3s ease;
  pointer-events: none;
  top: 50%;
  transform: translateY(-50%);
}

.custom-switch.open .switch-text {
  color: black;
  transform: translateX(-25px) translateY(-50%);
  top: 50%;
  position: absolute;
  z-index: 1;
  pointer-events: none;
  transition: transform 0.3s ease, color 0.3s ease, text-shadow 0.3s ease;
  animation: glowing 2s infinite linear;
  white-space: nowrap;
}

@keyframes glowing {
  0%, 100% {
    text-shadow: 0 0 2px rgba(255, 255, 255, 0.5);
  }
  50% {
    text-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
  }
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

.close-btn {
  position: absolute;
  top: 8px;
  right: 10px;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 50%;
  font-size: 20px;
  color: #444;
  width: 25px;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  z-index: 999;
}

.close-btn:hover {
  color: #000;
  transform: scale(1.4) rotate(10deg);
  box-shadow: 0 0 8px rgba(255, 0, 0, 0.4), 0 0 14px rgba(255, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.3);
}

.close-btn:active {
  transform: scale(0.9);
  box-shadow: 0 0 18px rgba(255, 0, 0, 0.6);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

