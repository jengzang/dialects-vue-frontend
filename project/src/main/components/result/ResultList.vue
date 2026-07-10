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
      <div v-if="!hasData" class="empty-tip" style="padding: 20px; text-align: center; color: var(--text-tertiary);">
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

        <div id="toggleColumnsBtn" class="custom-switch-container">
          <SwitchToggle
            :model-value="!isCondensedMode"
            :width="50"
            :height="30"
            :thumb-size="26"
            color="blue"
            variant="glow"
            show-label
            :active-text="t('result.resultList.displayMode.full')"
            :inactive-text="t('result.resultList.displayMode.main')"
            label-position="inside"
            :aria-label="t('result.resultList.displayMode.full')"
            class="result-display-switch"
            @update:modelValue="isCondensedMode = !$event"
          />
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
import { parseFeatureString,get_detail } from '@/main/utils/query/ResultTable.js';
import { READING_COLORS } from '@/main/config/readingColors.js';
import ValuePopup from "./popups/ValuePopup.vue";
import FeaturePopup from "./popups/FeaturePopup.vue";
import SwitchToggle from '@/components/common/SwitchToggle.vue'
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


$primary-blue: var(--color-primary);
$text-dark: var(--text-dark);
$panel-radius: 12px;
$dropdown-radius: 10px;
$transition-duration: 0.2s;
$dropdown-blur: 12px;
$system-font:
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  Roboto,
  Helvetica,
  Arial,
  sans-serif;

@mixin glass-dropdown($background, $max-height, $min-width) {
  position: absolute;
  bottom: 110%;
  left: 0;
  z-index: 9999;
  display: none;
  min-width: $min-width;
  max-height: $max-height;
  padding: 8px;
  overflow-y: auto;
  background: $background;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: $dropdown-radius;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur($dropdown-blur);
  -webkit-backdrop-filter: blur($dropdown-blur);

  &.open {
    display: block;
  }
}

.Panel {
  position: fixed;
  right: 2dvw;
  bottom: 1dvh;
  left: 2dvw;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 78dvh;
  overflow: auto;
  resize: both;
  border: 1px solid var(--border-light-gray);
  border-radius: $panel-radius;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition:
    box-shadow 0.3s ease,
    border-color 0.3s ease;

  @media (orientation: portrait) {
    right: 1dvw;
    bottom: 2dvh;
    left: 1dvw;
    height: 70dvh;
  }
}

.panel-content {
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 15px;
  padding: 13px;
  overflow: visible;
  overflow-y: auto;
  color: $text-dark;
}

.reading-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  padding: 6px 10px;
  color: #4b5563;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
}

.reading-legend-title {
  color: #374151;
  font-weight: 600;
}

.reading-legend-item {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  white-space: nowrap;
}

.reading-legend-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.reading-legend-label {
  line-height: 1;
}

.sticky-label2 {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 18px;
  color: $text-dark;
  font-size: 14px;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.3);
  border-bottom: 1px solid rgba(204, 204, 204, 0.6);
  border-radius: 10px;
  backdrop-filter: blur(2px);
  transition:
    background 0.3s ease,
    box-shadow 0.3s ease;

  &:hover {
    background: rgba(240, 240, 240, 0.9);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  &.sticky-scrolled {
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  }

  &::before {
    position: absolute;
    inset: 0;
    z-index: -1;
    content: "";
    background: inherit;
  }
}

.sticky-bar-inner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.stickybar-location-wrapper {
  position: relative;
  z-index: 2;
  font-family: $system-font;
}

.stickybar-location-trigger {
  padding: 4px 10px;
  color: $text-dark;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  border-radius: 14px;
  transition:
    background $transition-duration,
    color $transition-duration,
    box-shadow $transition-duration;

  &:hover {
    color: $primary-blue;
    background: rgba(255, 255, 255, 0.35);
    box-shadow: 0 0 8px rgba(0, 122, 255, 0.22);
  }
}

.stickybar-location-dropdown {
  @include glass-dropdown(
    rgba(255, 255, 255, 0.95),
    220px,
    120px
  );
}

.stickybar-location-option {
  display: block;
  width: 100%;
  padding: 6px 9px;
  color: $text-dark;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 7px;
  transition:
    color $transition-duration,
    background $transition-duration;

  &:hover {
    color: $primary-blue;
    background: rgba(0, 122, 255, 0.08);
  }

  &.active {
    color: $primary-blue;
    background: rgba(0, 122, 255, 0.12);
  }
}

.stickybar-filter-wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 1;
  font-family: $system-font;
  font-size: 14px;
  transform: translate(-50%, -50%);

  @media (orientation: portrait) {
    left: 55% !important;
  }
}

.stickybar-filter-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  color: $primary-blue;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(0, 122, 255, 0.2);
  border-radius: 14px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all 0.25s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.35);
    box-shadow: 0 0 8px rgba(0, 122, 255, 0.4);
  }
}

.stickybar-filter-dropdown {
  @include glass-dropdown(
    rgba(255, 255, 255, 0.9),
    200px,
    70px
  );
}

.stickybar-filter-option {
  display: flex;
  align-items: center;
  margin: 6px 0;
  color: $text-dark;
  font-size: 14px;
  cursor: pointer;
  transition: color $transition-duration;

  &:hover {
    color: $primary-blue;
  }

  input[type="checkbox"] {
    margin-right: 6px;
  }
}

.custom-switch-container {
  position: absolute;
  right: 5%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Arial", sans-serif;
  font-size: 16px;
  transform: translateX(-50%);

  @media (orientation: portrait) {
    right: 1% !important;
  }
}

.result-display-switch {
  :deep(.switch-toggle__button) {
    cursor: pointer;

    &:hover:not(.is-disabled) {
      transform: scale(1.3);
    }
  }
}
