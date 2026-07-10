<template>
  <div class="data-row-vue" :class="{ 'has-stats-data': featureStatsPopup.fetched }">
    <p v-if="showLocation" class="locations-vue" @click="handleLocationClick" style="cursor: pointer;">
      {{ item.地點 }}
    </p>

    <div class="feature-row">
      <!-- 主要信息容器：包裹 p、button、p -->
      <div class="feature-main-items">
        <p class="feature-inline-row">
          <span
              class="feature-value-clickable"
              style="cursor: pointer; color: var(--color-primary)"
              @click.stop="(e) => $emit('trigger-popup', 'feature', item, featureKey, featureVal, e)"
          >
            {{ featureKeyDisplay }}
          </span>
          <span> ☞ </span>
          <span
              class="feature-value-clickable"
              style="cursor: pointer; color: var(--color-primary)"
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
          <span v-if="featureStatsPopup.loading" class="ui-loading--inline" aria-hidden="true">↻</span>
          <span v-else>{{ statsButtonText }}</span>
        </button>

        <p>{{ t('result.dataRow.countRatio') }}: {{ item['字數'] }} | {{ (item['佔比'] * 100).toFixed(1) }}%</p>
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
import { useI18n } from 'vue-i18n';
import { getCorrespondingCharacters, getReadingClass, getYinWeiCharReadingType, getZhongGuCharReadingType } from '@/main/utils/query/ResultTable.js';
import { READING_COLORS } from '@/main/config/readingColors.js';
import { getFeatureStats, getLocationDetail } from '@/api';
import { globalPayload, mapStore } from '@/main/store/store.js';
import LocationDetailPopup from '../popup/result/LocationDetailPopup.vue';
import FeatureStatsPopup from './popups/FeatureStatsPopup.vue';
import { translateResultTerm } from '@/i18n/utils/resultI18n.js';

const props = defineProps({
  item: { type: Object, required: true },
  isCondensed: { type: Boolean, default: true },
  showLocation: { type: Boolean, default: false },
  readingSource: { type: String, default: 'zhonggu' }
});

const emit = defineEmits(['trigger-popup']);
const { t } = useI18n();

const featureKey = computed(() => Object.keys(props.item.分組值 || {})[0]);
const featureKeyDisplay = computed(() => mapStore.featureLabels[featureKey.value] || featureKey.value);
const featureVal = computed(() => (props.item.分組值 || {})[featureKey.value]);

const parsedChars = computed(() => {
  const nodes = getCorrespondingCharacters(props.item);

  return nodes.map(node => ({
    ...node,
    props: {
      ...node.props,
      class: [
        node.props?.class,
        getReadingClass(
          props.readingSource === 'yinwei'
            ? getYinWeiCharReadingType(props.item, node.children)
            : getZhongGuCharReadingType(props.item, node.children),
          'char-vue'
        )
      ].filter(Boolean).join(' ')
    }
  }));
});

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

    const response = await getLocationDetail(locationName)

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
    return t('result.dataRow.buttons.details');
  }

  return t('result.dataRow.buttons.stats');
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
        parts.push(`${translateResultTerm(t, featureName)}: ${sorted.join(', ')}`);
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


$primary-blue: var(--color-primary);
$clickable-blue: #007bff;
$text-dark: #333;
$text-muted: #666;
$transition-duration: 0.2s;
$glass-blur: 8px;

@mixin compact-feature-layout {
  .feature-row {
    flex-direction: column;
    gap: 2px;
    align-items: stretch;
  }

  .feature-main-items {
    display: flex;
    flex-direction: row;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
    width: 100%;

    > p:first-child {
      flex: 1;
      order: 0;
      margin-right: 0;
      font-size: 16px;
    }

    > p:last-child {
      order: 0;
      font-size: 12px;
    }
  }

  .feature-stats-btn {
    order: 0;
    padding: 4px 10px;
    font-size: 11px;
  }

  .brief-stats {
    order: 0;
    white-space: normal;
    word-break: break-all;
  }
}

/* 從 ResultTable.css 遷移的樣式 */
.data-row-vue {
  display: block;
  margin-bottom: 15px;
  text-align: center;
}

.characters-vue {
  display: inline-block;
  margin-top: 0;
  padding: 5px;
  font-size: 15px;
  text-align: center;
  border: 2px solid $text-dark;
}

.characters-vue-condensed {
  display: flex;
  margin-top: 0;
  padding: 5px;
  font-size: 15px;
  text-align: center;
  border-bottom: 2px solid $text-dark;
}

.char-vue {
  display: inline-flex;
  margin-right: 2px;
  padding: 1px 3px;
  color: $text-dark;
  font-size: 15px;

  &.multi-vue,
  &.char-vue--wendu {
    position: relative;
    color: v-bind('READING_COLORS.zhongguWendu');
    font-weight: bold;
    cursor: pointer;

    &:hover {
      background-color: #f9f9f9;
      border-radius: 4px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
  }

  &.char-vue--baidu {
    color: v-bind('READING_COLORS.zhongguBaidu');
  }

  &.char-vue--both {
    color: v-bind('READING_COLORS.both');
  }

  &.char-vue--polyphonic {
    color: v-bind('READING_COLORS.polyphonic');
  }
}

.feature-value-clickable {
  display: inline-block;
  color: $clickable-blue;
  text-decoration: none;
  cursor: pointer;
  transition:
    transform $transition-duration ease,
    color $transition-duration ease,
    text-shadow 0.3s ease;

  &:hover {
    color: #3c8dbc;
    text-decoration: underline;
    text-shadow: 0 0 8px rgba(60, 141, 188, 0.6);
    transform: scale(1.3);
  }
}

.feature-inline-row {
  white-space: nowrap;
}

/*
 * 該元素通過 Teleport 掛載到 body，
 * 因此保持為頂層選擇器，不能嵌套到 .data-row-vue 中。
 */
.global-tooltip-popup {
  position: fixed;
  z-index: 10001;
  max-width: 200px;
  padding: 5px 10px;
  color: #fff;
  font-size: 12px;
  pointer-events: none;
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transform: translate(-50%, -100%);
  animation: fade-in $transition-duration ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translate(-50%, -90%);
  }

  to {
    opacity: 1;
    transform: translate(-50%, -100%);
  }
}

/* 地名樣式 */
.locations-vue {
  margin-top: 20px;
  margin-bottom: 0;
  color: var(--text-primary);
  font-family: "SimHei", "黑体", sans-serif;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: all $transition-duration cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    color: $primary-blue;
    transform: translateX(2px);
  }

  &:active {
    transform: scale(0.98);
  }
}

/* 特徵統計按鈕 */
.feature-stats-btn {
  order: 3;
  display: inline-flex;
  flex-shrink: 0;
  gap: 6px;
  align-items: center;
  margin-left: 12px;
  padding: 6px 12px;
  color: $primary-blue;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  appearance: none;
  cursor: pointer;
  background-color: rgba(0, 122, 255, 0.08);
  border: 1px solid rgba(0, 122, 255, 0.2);
  border-radius: 999px;
  box-shadow: none;
  backdrop-filter: blur($glass-blur);
  -webkit-backdrop-filter: blur($glass-blur);
  transition: all $transition-duration cubic-bezier(0.25, 0.1, 0.25, 1);

  &:hover:not(:disabled) {
    background-color: rgba(0, 122, 255, 0.15);
    border-color: rgba(0, 122, 255, 0.4);
    transform: translateY(-0.5px);
  }

  &:active {
    background-color: rgba(0, 122, 255, 0.2);
    transform: scale(0.98);
  }

  &:disabled {
    cursor: not-allowed;
    filter: grayscale(1);
    opacity: 0.5;
  }
}

/* 簡要統計顯示 */
.brief-stats {
  order: 2;
  flex-shrink: 1;
  min-width: 0;
  margin-left: 12px;
  padding: 4px 8px;
  overflow: hidden;
  color: $text-muted;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  text-overflow: ellipsis;
  background: rgba(0, 122, 255, 0.05);
  border: 1px solid rgba(0, 122, 255, 0.1);
  border-radius: 6px;
}

/* feature-row 佈局：寬屏左右對齊 */
.feature-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

/* 使用 contents 讓子元素成為 feature-row 的直接 flex 項目 */
.feature-main-items {
  display: contents;

  > p:first-child {
    order: 1;
    margin: 1px;
    margin-right: auto;
    color: $clickable-blue;
    font-size: 18px;
    font-weight: bold;
    text-align: left;
  }

  > p:last-child {
    order: 4;
    margin: 1px;
    margin-left: 12px;
    color: #6c757d;
    font-size: 13px;
    font-style: italic;
    text-align: right;
    white-space: nowrap;
  }
}

/* 響應式：小螢幕下垂直堆疊 */
@media (max-width: 600px) {
  @include compact-feature-layout;
}

/* 面板容器寬度小於 500px 時應用相同佈局 */
@container query-panel (max-width: 500px) {
  @include compact-feature-layout;
}

