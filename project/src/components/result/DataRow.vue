<template>
  <div class="data-row-vue" :class="{ 'has-stats-data': featureStatsPopup.fetched }">
    <p v-if="showLocation" class="locations-vue" @click="handleLocationClick" style="cursor: pointer;">
      {{ item.地點 }}
    </p>

    <div class="feature-row">
      <!-- 主要信息容器：包裹 p、button、p -->
      <div class="feature-main-items">
        <p>
          <span
              class="feature-value-clickable"
              style="cursor: pointer; color: #007bff"
              @click.stop="(e) => $emit('trigger-popup', 'feature', item, featureKey, featureVal, e)"
          >
            {{ featureKey }}
          </span>
          <span> ☞ </span>
          <span
              class="feature-value-clickable"
              style="cursor: pointer; color: #007bff"
              @click.stop="(e) => $emit('trigger-popup', 'value', item, featureKey, featureVal, e)"
          >
            {{ String(featureVal) }}
          </span>
        </p>

        <!-- 特徵統計按鈕 -->
        <button
          class="feature-stats-btn"
          :class="{ 'loading': featureStatsPopup.loading }"
          :disabled="featureStatsPopup.loading"
          @click.stop="handleFeatureStatsClick"
        >
          <span v-if="featureStatsPopup.loading" class="btn-spinner"></span>
          <span v-else>{{ statsButtonText }}</span>
        </button>

        <p>字數/佔比: {{ item.字數 }} ║ {{ (item.佔比 * 100).toFixed(1) }}%</p>
      </div>

      <!-- 簡要統計：在容器外面 -->
      <span v-if="featureStatsPopup.fetched && briefStats" class="brief-stats">
        {{ briefStats }}
      </span>
    </div>

    <p :class="isCondensed ? 'characters-vue-condensed' : 'characters-vue'">
      <template v-for="(charNode, cIndex) in parsedChars" :key="cIndex">
         <span
             v-if="charNode.type === 'span'"
             :class="charNode.props.class"
             :datatitle="charNode.props.datatitle"
             @mouseenter="handleMouseEnter($event, charNode)"
             @mouseleave="handleMouseLeave"
         >
          {{ charNode.children }}
        </span>
      </template>
    </p>

    <Teleport to="body">
      <div
          v-if="tooltip.visible"
          class="global-tooltip-popup"
          :style="{ top: tooltip.top + 'px', left: tooltip.left + 'px' }"
      >
        {{ tooltip.content }}
      </div>
    </Teleport>

    <LocationDetailPopup
        :visible="locationPopup.visible"
        :location-name="locationPopup.locationName"
        :data="locationPopup.data"
        :loading="locationPopup.loading"
        @close="locationPopup.visible = false"
    />

    <FeatureStatsPopup
        :visible="featureStatsPopup.visible"
        :location-name="featureStatsPopup.locationName"
        :feature-key="featureStatsPopup.featureKey"
        :feature-val="featureStatsPopup.featureVal"
        :stats-data="featureStatsPopup.statsData"
        :chars-map="featureStatsPopup.charsMap"
        :loading="featureStatsPopup.loading"
        @close="featureStatsPopup.visible = false"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { getCorrespondingCharacters } from '@/utils/ResultTable.js';
import { sqlQuery } from '@/api/sql';
import { getFeatureStats } from '@/api';
import { globalPayload } from '@/utils/store.js';
import LocationDetailPopup from './LocationDetailPopup.vue';
import FeatureStatsPopup from './FeatureStatsPopup.vue';

const props = defineProps({
  item: { type: Object, required: true },
  isCondensed: { type: Boolean, default: true },
  showLocation: { type: Boolean, default: false }
});

const emit = defineEmits(['trigger-popup']);

const featureKey = computed(() => Object.keys(props.item.分組值 || {})[0]);
const featureVal = computed(() => (props.item.分組值 || {})[featureKey.value]);

const parsedChars = computed(() => getCorrespondingCharacters(props.item));

// --- 新增：Tooltip 相關邏輯 ---
const tooltip = ref({
  visible: false,
  content: '',
  top: 0,
  left: 0
});

const handleMouseEnter = (e, charNode) => {
  // 只針對有 datatitle 的元素 (通常是 multi-vue 類) 觸發
  if (!charNode.props.datatitle) return;

  const target = e.target;
  const rect = target.getBoundingClientRect();

  tooltip.value = {
    visible: true,
    content: charNode.props.datatitle,
    // 計算位置：顯示在元素上方，水平居中
    top: rect.top - 10, // 向上偏移 10px
    left: rect.left + (rect.width / 2)
  };
};

const handleMouseLeave = () => {
  tooltip.value.visible = false;
};

// --- 地名點擊彈窗邏輯 ---
const locationPopup = ref({
  visible: false,
  locationName: '',
  data: null,
  loading: false
});

const handleLocationClick = async (e) => {
  const locationName = props.item.地點;
  if (!locationName) return;

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

    const response = await sqlQuery(payload)

    locationPopup.value.data = response;
  } catch (error) {
    console.error('查詢地名數據失敗:', error);
  } finally {
    locationPopup.value.loading = false;
  }
};

// --- 特徵統計彈窗邏輯 ---
const featureStatsPopup = ref({
  visible: false,
  locationName: '',
  featureKey: '',
  featureVal: '',
  statsData: null,
  charsMap: [],
  loading: false,
  fetched: false  // 是否已獲取資料
});

// 計算按鈕文字
const statsButtonText = computed(() => {
  if (featureStatsPopup.value.fetched) {
    return '詳情';
  }

  // 從 globalPayload 獲取當前查詢的特徵
  const currentFeatures = globalPayload.value?.features || [];

  // 判斷當前查詢的是哪個特徵
  if (currentFeatures.includes('韻母')) return '聲/調';
  if (currentFeatures.includes('聲調')) return '聲/韻';
  if (currentFeatures.includes('聲母')) return '韻/調';
  return '詳情';
});

// 計算要查詢的特徵列表（排除當前特徵）
const queryFeatures = computed(() => {
  const allFeatures = ['聲母', '韻母', '聲調'];
  const currentFeatures = globalPayload.value?.features || [];

  // 過濾掉當前查詢的特徵
  const filtered = allFeatures.filter(f => !currentFeatures.includes(f));

  // console.log('🔍 當前查詢特徵:', currentFeatures);
  // console.log('🔍 要查詢的特徵:', filtered);

  return filtered;
});

// 計算簡要統計（聲母/韻母顯示前5個，聲調顯示前2個）
const briefStats = computed(() => {
  if (!featureStatsPopup.value.fetched || !featureStatsPopup.value.statsData) return '';

  const locationName = props.item.地點;
  const locationData = featureStatsPopup.value.statsData.data[locationName];
  if (!locationData) return '';

  const parts = [];
  queryFeatures.value.forEach(featureName => {
    const featureData = locationData[featureName];
    if (featureData) {
      // 根據特徵類型決定顯示數量：聲母/韻母顯示前5個，聲調顯示前2個
      const topCount = featureName === '聲調' ? 2 : 5;

      // 按 count 排序，取前 N 個
      const sorted = Object.entries(featureData)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, topCount)
        .map(([value]) => value);

      if (sorted.length > 0) {
        parts.push(`${featureName}: ${sorted.join(', ')}`);
      }
    }
  });

  return parts.join('；');
});

// 處理特徵統計按鈕點擊
const handleFeatureStatsClick = async () => {
  // 如果已獲取資料，打開彈窗
  if (featureStatsPopup.value.fetched) {
    featureStatsPopup.value.visible = true;
    featureStatsPopup.value.locationName = props.item.地點;
    featureStatsPopup.value.featureKey = featureKey.value;
    featureStatsPopup.value.featureVal = featureVal.value;
    return;
  }

  // 否則獲取資料
  const locationName = props.item.地點;
  if (!locationName) return;

  featureStatsPopup.value.loading = true;

  try {
    const chars = props.item.對應字 || [];
    const features = queryFeatures.value;

    const response = await getFeatureStats({
      locations: [locationName],
      chars: chars,
      features: features
    });

    featureStatsPopup.value.statsData = response;
    featureStatsPopup.value.charsMap = response.chars_map || [];
    featureStatsPopup.value.fetched = true;
    featureStatsPopup.value.locationName = locationName;
    featureStatsPopup.value.featureKey = featureKey.value;
    featureStatsPopup.value.featureVal = featureVal.value;
  } catch (error) {
    console.error('查詢特徵統計失敗:', error);
  } finally {
    featureStatsPopup.value.loading = false;
  }
};
</script>

<style scoped>
/* 從 ResultTable.css 遷移的樣式 */
.data-row-vue {
  margin-bottom: 15px;
  display: block;
  text-align: center;
}

.characters-vue {
  text-align: center;
  font-size: 15px;
  border: 2px solid #333;
  padding: 5px;
  display: inline-block;
  margin-top: 0;
}

.characters-vue-condensed {
  text-align: center;
  font-size: 15px;
  border-bottom: 2px solid #333;
  padding: 5px;
  display: flex;
  margin-top: 0;
}

.char-vue {
  display: inline-flex;
  padding: 1px 3px;
  margin-right: 2px;
  font-size: 15px;
  color: #333;
}

.char-vue.multi-vue {
  color: darkred;
  font-weight: bold;
  position: relative;
  cursor: pointer;
}

.char-vue.multi-vue:hover {
  background-color: #f9f9f9;
  border-radius: 4px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.feature-value-clickable {
  cursor: pointer;
  text-decoration: none;
  color: #007bff;
  display: inline-block;
  transition: transform 0.2s ease, color 0.2s ease, text-shadow 0.3s ease;
}

.feature-value-clickable:hover {
  transform: scale(1.3);
  text-decoration: underline;
  color: #3c8dbc;
  text-shadow: 0 0 8px rgba(60, 141, 188, 0.6);
}

/* 這是傳送到 body 的彈窗樣式，不受小容器限制 */
.global-tooltip-popup {
  position: fixed; /* 關鍵：使用 fixed 定位 */
  z-index: 9999;   /* 確保在最上層 */
  transform: translate(-50%, -100%); /* 讓定位點在彈窗底部中央，實現向上彈出 */

  /* 以下複製你原本 CSS ::after 的樣式 */
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none; /* 讓滑鼠穿透，避免閃爍 */
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  max-width: 200px;
  /* 添加一個小動畫讓它更順滑 (可選) */
  animation: fadeIn 0.2s ease-out;

}

@keyframes fadeIn {
  from { opacity: 0; transform: translate(-50%, -90%); }
  to { opacity: 1; transform: translate(-50%, -100%); }
}

/* 地名样式 */
.locations-vue {
  font-size: 20px;
  font-family: "SimHei", "黑体", sans-serif;
  font-weight: bold;
  margin-top: 20px;
  margin-bottom: 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  color: #1d1d1f;
}

.locations-vue:hover {
  color: #007aff;
  transform: translateX(2px);
}

.locations-vue:active {
  transform: scale(0.98);
}

/* 特徵統計按鈕 */
.feature-stats-btn {
  /* 基础布局 */
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  white-space: nowrap;

  /* 尺寸与字体 */
  padding: 6px 12px;
  border-radius: 999px; /* 或者保持 8px，999px 更像胶囊风格 */
  font-size: 12px;
  font-weight: 500; /* 600有点太重，500更精致 */

  /* 核心：液态玻璃风格 */
  background-color: rgba(0, 122, 255, 0.08); /* 极淡的蓝色背景 */
  border: 1px solid rgba(0, 122, 255, 0.2); /* 半透明的蓝色细边框 */
  color: #007AFF; /* 苹果蓝文字 */

  /* 磨砂效果（这是玻璃感的灵魂） */
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px); /* 兼容 Safari */

  /* 交互 */
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1); /* iOS 物理缓动 */
  box-shadow: none; /* 去掉之前的深色阴影 */
}

/* 悬停状态：稍微加深一点点背景，增强边框 */
.feature-stats-btn:hover:not(:disabled) {
  background-color: rgba(0, 122, 255, 0.15);
  border-color: rgba(0, 122, 255, 0.4);
  transform: translateY(-0.5px); /* 极其微小的位移 */
}

/* 点击状态：微缩 */
.feature-stats-btn:active {
  background-color: rgba(0, 122, 255, 0.2);
  transform: scale(0.98);
}

/* 禁用状态 */
.feature-stats-btn:disabled {
  opacity: 0.5;
  filter: grayscale(1); /* 自动置灰 */
  cursor: not-allowed;
}

.btn-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 簡要統計顯示 */
.brief-stats {
  font-size: 13px;
  color: #666;
  font-weight: 500;
  padding: 4px 8px;
  background: rgba(0, 122, 255, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(0, 122, 255, 0.1);
  flex-shrink: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* feature-row 佈局：寬屏左右對齊 */
.feature-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  /* 移除 gap，改用個別元素的 margin 控制間距 */
}

/* feature-main-items 使用 contents 讓子元素成為 feature-row 的直接 flex 項目 */
.feature-main-items {
  display: contents;
}

/* 特徵 p 標籤：左對齊，使用 margin-right: auto 推開右側元素 */
.feature-main-items > p:first-child {
  font-size: 18px;
  text-align: left;
  font-weight: bold;
  color: #007bff;
  margin: 1px;
  margin-right: auto; /* 關鍵：推開右側所有元素到最右邊 */
  order: 1;
}

/* brief-stats 排在特徵 p 之後，與右側元素有間距 */
.brief-stats {
  order: 2;
  margin-left: 12px; /* 與 button 之間的間距 */
}

/* 按鈕排在 brief-stats 之後 */
.feature-stats-btn {
  order: 3;
  margin-left: 12px; /* 與字數佔比之間的間距 */
}

/* 字數佔比 p 標籤：最右側 */
.feature-main-items > p:last-child {
  font-size: 13px;
  font-style: italic;
  text-align: right;
  color: #6c757d;
  margin: 1px;
  margin-left: 12px; /* 與 button 之間的間距 */
  white-space: nowrap;
  order: 4;
}

/* 響應式：小螢幕下垂直堆疊 */
@media (max-width: 600px) {
  .feature-row {
    flex-direction: column;
    align-items: stretch;
    gap: 2px;
  }

  .feature-main-items {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    gap: 8px;
  }

  .feature-main-items > p:first-child {
    font-size: 16px;
    flex: 1;
    margin-right: 0;
    order: 0;
  }

  .feature-stats-btn {
    padding: 4px 10px;
    font-size: 11px;
    order: 0;
  }

  .feature-main-items > p:last-child {
    font-size: 12px;
    order: 0;
  }

  .brief-stats {
    white-space: normal;
    word-break: break-all;
    order: 0;
  }
}

/* Container Query：當面板容器寬度小於 600px 時也應用相同樣式 */
@container query-panel (max-width: 500px) {
  .feature-row {
    flex-direction: column;
    align-items: stretch;
    gap: 2px;
  }

  .feature-main-items {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    gap: 8px;
  }

  .feature-main-items > p:first-child {
    font-size: 16px;
    flex: 1;
    margin-right: 0;
    order: 0;
  }

  .feature-stats-btn {
    padding: 4px 10px;
    font-size: 11px;
    order: 0;
  }

  .feature-main-items > p:last-child {
    font-size: 12px;
    order: 0;
  }

  .brief-stats {
    white-space: normal;
    word-break: break-all;
    order: 0;
  }
}
</style>
