<template>
  <div class="Panel">
    <div
        id="resultPanelContent"
        class="panel-content"
        ref="scrollContainerRef"
        :style="{
          overflowY: 'auto',
          marginBottom: isCondensedMode ? '0' : '50px'
        }"
    >
      <div v-if="!hasData" class="empty-tip" style="padding: 20px; text-align: center; color: #666;">
        {{ t('result.resultList.emptyState') }}
      </div>

      <div v-else class="result-panel-vue" :style="{ height: panelHeight }">
        <div class="reading-legend" role="note" :aria-label="t('result.resultList.readingLegend.ariaLabel')">
          <span class="reading-legend-title">{{ t('result.resultList.readingLegend.title') }}</span>
          <span
            v-for="item in readingLegendItems"
            :key="item.key"
            class="reading-legend-item"
          >
            <span class="reading-legend-dot" :style="{ backgroundColor: item.color }"></span>
            <span class="reading-legend-label">{{ item.label }}</span>
          </span>
        </div>
        <DataRow
            v-for="(item, index) in displayedData"
            :key="index"
            :item="item"
            :is-condensed="isCondensedMode"
            :show-location="shouldShowLocation(item, index)"
            :reading-source="props.readingSource"
            @trigger-popup="onTriggerPopup"
        />
      </div>
    </div>

    <div id="stickyContextBar" class="sticky-label2" style="display: block;" v-if="hasData">
      <div class="sticky-bar-inner">
        <div class="stickybar-location-wrapper" ref="locationWrapperRef">
          <div
            id="stickyContextText"
            class="stickybar-location-trigger"
            @click.stop="toggleLocationDropdown"
          >
            📍 {{ currentStickyLocation || t('result.resultList.locationPlaceholder') }}
          </div>

          <div class="stickybar-location-dropdown" :class="{ open: isLocationDropdownOpen }">
            <button
              v-for="location in availableLocations"
              :key="location"
              type="button"
              class="stickybar-location-option"
              :class="{ active: location === currentStickyLocation }"
              @click.stop="selectLocation(location)"
            >
              {{ location }}
            </button>
          </div>
        </div>

        <div class="stickybar-filter-wrapper" ref="filterWrapperRef">
          <div class="stickybar-filter-trigger" @click.stop="toggleFilterDropdown">
            {{ filterTriggerText }}
          </div>
          <div class="stickybar-filter-dropdown" :class="{ open: isFilterOpen }">
            <label
                v-for="stat in availableValueStats"
                :key="stat.value"
                class="stickybar-filter-option"
            >
              <input type="checkbox" :value="stat.value" v-model="selectedValues" />
              {{ stat.value }}
            </label>
          </div>
        </div>

        <div id="toggleColumnsBtn" @click="isCondensedMode = !isCondensedMode" class="custom-switch-container">
          <div class="result-custom-switch custom-switch-base main-glow-switch" :class="{ open: !isCondensedMode }">
            <div class="result-custom-slider custom-switch-slider-base"></div>
          </div>
          <span class="result-switch-text main-glow-switch-text">{{ !isCondensedMode ? t('result.resultList.displayMode.full') : t('result.resultList.displayMode.main') }}</span>
        </div>
      </div>
    </div>

    <ValuePopup
        :visible="showPopupValue"
        :data="popupDataValue"
        :position="popupPos"
        @close="showPopupValue = false"
        @confirm="handleValueConfirm"
    />

    <FeaturePopup
        :visible="showPopupFeature"
        :data="popupDataFeature"
        :position="popupPos"
        @close="showPopupFeature = false"
        @confirm="handleFeatureConfirm"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import DataRow from './DataRow.vue';
import { parseFeatureString,get_detail } from '@/main/utils/ResultTable.js';
import { READING_COLORS } from '@/main/constants/readingColors.js';
import ValuePopup from "../popup/result/ValuePopup.vue";
import FeaturePopup from "../popup/result/FeaturePopup.vue";
import { resultCache } from '@/main/store/store.js';

const props = defineProps({
  data: { type: Array, default: () => [] },
  isCondensed: { type: Boolean, default: false },
  readingSource: { type: String, default: 'zhonggu' }
});

const { t } = useI18n();

const readingLegendItems = computed(() => {
  const polyphonicKey = props.readingSource === 'yinwei' ? 'yinweiPolyphonic' : 'zhongguPolyphonic';

  return [
    { key: 'wendu', label: t('result.resultList.readingLegend.items.wendu'), color: READING_COLORS.wendu },
    { key: 'baidu', label: t('result.resultList.readingLegend.items.baidu'), color: READING_COLORS.baidu },
        { key: 'both', label: t('result.resultList.readingLegend.items.both'), color: READING_COLORS.both },
    { key: polyphonicKey, label: t(`result.resultList.readingLegend.items.${polyphonicKey}`), color: READING_COLORS.polyphonic }
  ];
});

// === 核心数据 (保持不变) ===
const tableData = ref([]);
const visibleRows = ref(30);
const scrollContainerRef = ref(null);
const isCondensedMode = ref(props.isCondensed);
const currentStickyLocation = ref('');
const isFilterOpen = ref(false);
const isLocationDropdownOpen = ref(false);
const filterWrapperRef = ref(null);
const locationWrapperRef = ref(null);
const selectedValues = ref([]);
const panelHeight = ref('100%');

// === 🌟 修改点：弹窗状态拆分 ===
// 不再使用单一的 popupState，而是分开管理
const showPopupValue = ref(false);
const popupDataValue = ref({});
const showPopupFeature = ref(false);
const popupDataFeature = ref({});
const popupPos = ref({ top: 0, left: 0 });

const hasData = computed(() => tableData.value && tableData.value.length > 0);

// === 筛选与排序 (保持不变) ===
const availableValueStats = ref([]);
const featureFilterKeys = computed(() => {
  const features = new Set();

  tableData.value.forEach(item => {
    const groupValues = item.分組值 || {};
    Object.keys(groupValues).forEach(key => {
      if (key) {
        features.add(key);
      }
    });
  });

  return features;
});
// ... (calculateStats, filteredData, sortedData, displayedData, filterTriggerText 等逻辑完全保留)
function calculateStats() {
  const totals = new Map();

  tableData.value.forEach(item => {
    const groupValues = item.分組值 || {};
    const feature = Object.keys(groupValues)[0] || '';
    const val = groupValues[feature];
    const share = Number(item.佔比) || 0;

    if (feature) {
      totals.set(feature, (totals.get(feature) || 0) + share);
    }

    if (val) {
      totals.set(val, (totals.get(val) || 0) + share);
    }
  });

  availableValueStats.value = [...totals.entries()]
      .map(([value, totalShare]) => ({ value, totalShare }))
      .sort((a, b) => b.totalShare - a.totalShare);
}
const filteredData = computed(() => {
  const selected = selectedValues.value;
  return tableData.value.filter(item => {
    const groupValues = item.分組值 || {};
    const feature = Object.keys(groupValues)[0] || '';
    const value = groupValues[feature];

    if (selected.length > 0) {
      const selectedFeatures = selected.filter(option => featureFilterKeys.value.has(option));
      const selectedGroupValues = selected.filter(option => !featureFilterKeys.value.has(option));

      const matchesFeature = selectedFeatures.length === 0 || selectedFeatures.includes(feature);
      const matchesGroupValue = selectedGroupValues.length === 0 || selectedGroupValues.includes(value);

      if (!matchesFeature || !matchesGroupValue) return false;
    }

    if (!isCondensedMode.value) return true;

    const count = item.字數 || 0;
    const share = item.佔比 || 0;
    if (share < 0.05 || count === 1) return false;
    if (share > 0.10 || count >= 8) return true;
    else if ((share * count) < 0.4) return false;
    return true;
  });
});
const sortedData = computed(() => {
  return [...filteredData.value].sort((a, b) => {
    if (a.地點 !== b.地點) return a.地點.localeCompare(b.地點);

    const aGroupValues = a.分組值 || {};
    const bGroupValues = b.分組值 || {};
    const aFeature = Object.keys(aGroupValues)[0] || '';
    const bFeature = Object.keys(bGroupValues)[0] || '';

    if (aFeature !== bFeature) return aFeature.localeCompare(bFeature);

    return b.佔比 - a.佔比;
  });
});
const displayedData = computed(() => sortedData.value.slice(0, visibleRows.value));
const availableLocations = computed(() => {
  const locations = [];
  const seen = new Set();

  sortedData.value.forEach(item => {
    const location = item.地點;
    if (!location || seen.has(location)) return;
    seen.add(location);
    locations.push(location);
  });

  return locations;
});
const filterTriggerText = computed(() => {
  if (selectedValues.value.length === 0) return '🎯 ' + t('result.resultList.filter.default');
  const recent = selectedValues.value.slice(-3);
  return selectedValues.value.length > 3
    ? t('result.resultList.filter.selectedWithMore', { values: recent.join('|') })
    : t('result.resultList.filter.selected', { values: recent.join('|') });
});
const shouldShowLocation = (item, index) => {
  if (index === 0) return true;
  return item.地點 !== displayedData.value[index - 1].地點;
};

// === Watch Props (保持不变) ===
watch(() => props.data, (newVal) => {
  tableData.value = newVal || [];
  if (tableData.value.length > 0) calculateStats();
}, { immediate: true });

// === Scroll & Sticky Logic (保持不变) ===
const initScrollObserver = () => {
  // ... (保留原本的 initScrollObserver 代码，太长省略)
  const content = scrollContainerRef.value;
  if (!content) return;
  let lastScrollTop = 0;
  const visibleLocations = [];
  const handleScroll = (event) => {
    const el = event.target;
    const scrollDirection = el.scrollTop > lastScrollTop ? 'down' : 'up';
    lastScrollTop = el.scrollTop;
    if (Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) < 50 && visibleRows.value < sortedData.value.length) {
      visibleRows.value += 20;
    }
    const contentRect = content.getBoundingClientRect();
    const locations = [...content.querySelectorAll('.locations-vue')];
    let lastVisibleLocation = null;
    for (const loc of locations) {
      const rect = loc.getBoundingClientRect();
      if (rect.top >= contentRect.top && rect.top <= contentRect.bottom) {
        lastVisibleLocation = loc;
      }
    }
    if (lastVisibleLocation) {
      const locName = lastVisibleLocation.textContent.trim();
      currentStickyLocation.value = locName;
      if (!visibleLocations.some(l => l.name === locName)) {
        visibleLocations.push({ name: locName, scrollHeight: content.scrollTop });
      }
    } else if (scrollDirection === 'up') {
      for (let i = visibleLocations.length - 1; i >= 0; i--) {
        if (content.scrollTop > visibleLocations[i].scrollHeight - 50) {
          currentStickyLocation.value = visibleLocations[i].name;
          break;
        }
      }
    }
  };
  content.addEventListener('scroll', handleScroll);
};

// === 🌟 修改点：Event Handlers ===

const onTriggerPopup = (type, item, feature, value, e) => {
  // 1. 互斥逻辑：先关闭所有
  showPopupValue.value = false;
  showPopupFeature.value = false;

  // 2. 准备数据
  const dataObj = {
    location: item.地點,
    feature,
    value: String(value).replace(/·/g, '')
  };

  // 3. 计算位置
  const mouseX = e.clientX;
  const mouseY = e.clientY;
  const popupWidth = 250;
  const offset = 10;

  popupPos.value = {
    top: Math.max(mouseY - 100 - 5, 20),
    left: Math.min(Math.max(mouseX + popupWidth / 2 - offset, 20), window.innerWidth - 0.5 * popupWidth)
  };

  // 4. 根据类型激活对应状态
  if (type === 'value') {
    popupDataValue.value = dataObj;
    showPopupValue.value = true;
  } else {
    popupDataFeature.value = dataObj;
    showPopupFeature.value = true;
  }
};

// 处理 ValuePopup 的确认回调
const handleValueConfirm = ({ location, value, bool }) => {
  if (typeof get_detail === 'function') {
    // console.log(value)
    get_detail(location, value, bool, true);
  }
};

// 处理 FeaturePopup 的确认回调
const handleFeatureConfirm = ({ location, feature, field }) => {
  if (typeof get_detail === 'function') {
    const parseResult = parseFeatureString(feature, resultCache.tableName);
    if (parseResult.matched_fields === null) {
      // 传递 group_inputs
      get_detail(location, feature, false, true, null, [field]);
    } else {
      const newFeature = `${feature.replace(/·/g, '')}-${field}`;
      get_detail(location, newFeature, false, true);
    }
  }
};

const toggleLocationDropdown = () => {
  isLocationDropdownOpen.value = !isLocationDropdownOpen.value;
  if (isLocationDropdownOpen.value) {
    isFilterOpen.value = false;
  }
};

const toggleFilterDropdown = () => {
  isFilterOpen.value = !isFilterOpen.value;
  if (isFilterOpen.value) {
    isLocationDropdownOpen.value = false;
  }
};

const selectLocation = (locationName) => {
  const matchingIndex = sortedData.value.findIndex(
    item => item.地點 === locationName
  );

  if (matchingIndex === -1) {
    isLocationDropdownOpen.value = false;
    return;
  }

  scrollToLocation(locationName, matchingIndex);
  isLocationDropdownOpen.value = false;
};

// Scroll to specific location
const scrollToLocation = async (locationName, dataIndex) => {
  const content = scrollContainerRef.value;
  if (!content) return;

  if (typeof dataIndex === 'number' && dataIndex >= visibleRows.value) {
    visibleRows.value = Math.min(sortedData.value.length, dataIndex + 20);
    await nextTick();
  }

  // Find the location element in DOM
  const locationElements = [...content.querySelectorAll('.locations-vue')];
  const targetElement = locationElements.find(
    el => el.textContent.trim() === locationName
  );

  if (targetElement) {
    // Scroll to the element
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    // Update current location
    currentStickyLocation.value = locationName;
  }
};

const handleGlobalClickForStickybar = (e) => {
  if (isFilterOpen.value && filterWrapperRef.value && !filterWrapperRef.value.contains(e.target)) {
    isFilterOpen.value = false;
  }

  if (
    isLocationDropdownOpen.value &&
    locationWrapperRef.value &&
    !locationWrapperRef.value.contains(e.target)
  ) {
    isLocationDropdownOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleGlobalClickForStickybar);
  initScrollObserver();
});

onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClickForStickybar);
});
</script>

<style scoped lang="scss">
.Panel {
  resize: both;
  overflow: auto;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
  z-index: 1;
  bottom: 1dvh;
  left: 2dvw;
  right: 2dvw;
  height: 78dvh;
  position: fixed;
}

@media (orientation: portrait) {
  .Panel {
    height: 70dvh;
    bottom: 2dvh;
    left: 1dvw;
    right: 1dvw;
  }
  .stickybar-filter-wrapper{
    left:55%!important;
  }
  .custom-switch-container{
    right: 1%!important;
  }
}

.panel-content {
  flex: 1;
  overflow: visible;
  padding: 13px;
  box-sizing: border-box;
  color: #333;
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow-y: auto;
}

.reading-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-bottom: 4px;
  padding: 6px 10px;
  font-size: 12px;
  color: #4b5563;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
}

.reading-legend-title {
  font-weight: 600;
  color: #374151;
}

.reading-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.reading-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  flex-shrink: 0;
}

.reading-legend-label {
  line-height: 1;
}

.sticky-label2 {
  position: absolute;
  bottom: 0;
  background: rgba(255, 255, 255, 0.3);
  left: 0;
  right: 0;
  backdrop-filter: blur(2px);
  padding: 9px 18px;
  font-size: 14px;
  font-weight: bold;
  border-bottom: 1px solid rgba(204, 204, 204, 0.6);
  z-index: 999;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 10px;
  transition: background 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    background: rgba(240, 240, 240, 0.9);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  &.sticky-scrolled {
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: inherit;
    z-index: -1;
  }
}

.sticky-bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  position: relative;
}

.stickybar-location-wrapper {
  position: relative;
  z-index: 2;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.stickybar-location-trigger {
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  padding: 4px 10px;
  border-radius: 14px;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  color: #333;

  &:hover {
    color: #007aff;
    background: rgba(255, 255, 255, 0.35);
    box-shadow: 0 0 8px rgba(0, 122, 255, 0.22);
  }
}

.stickybar-location-dropdown {
  position: absolute;
  bottom: 110%;
  left: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 10px;
  padding: 8px;
  display: none;
  max-height: 220px;
  overflow-y: auto;
  min-width: 120px;
  z-index: 9999;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &.open {
    display: block;
  }
}

.stickybar-location-option {
  width: 100%;
  display: block;
  padding: 6px 9px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #333;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: color 0.2s, background 0.2s;

  &:hover {
    color: #007aff;
    background: rgba(0, 122, 255, 0.08);
  }

  &.active {
    color: #007aff;
    background: rgba(0, 122, 255, 0.12);
  }
}

.stickybar-filter-wrapper {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 14px;
  z-index: 1;
}

.stickybar-filter-trigger {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 14px;
  padding: 4px 12px;
  color: #007aff;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  border: 1px solid rgba(0, 122, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  transition: all 0.25s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.35);
    box-shadow: 0 0 8px rgba(0, 122, 255, 0.4);
  }
}

.stickybar-filter-dropdown {
  position: absolute;
  bottom: 110%;
  left: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 10px;
  padding: 8px;
  display: none;
  max-height: 200px;
  overflow-y: auto;
  min-width: 70px;
  z-index: 9999;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &.open {
    display: block;
  }
}

.stickybar-filter-option {
  display: flex;
  align-items: center;
  margin: 6px 0;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #007aff;
  }

  input[type="checkbox"] {
    margin-right: 6px;
  }
}

.custom-switch-container {
  position: absolute;
  right: 5%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Arial', sans-serif;
  font-size: 16px;
}

.result-custom-switch {
  cursor: pointer;

  &:hover {
    transform: scale(1.3);
  }

  &.open:hover {
    transform: scale(1.3);
  }
}
</style>