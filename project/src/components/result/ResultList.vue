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
        請先查詢
      </div>

      <div v-else class="result-panel-vue" :style="{ height: panelHeight }">
        <DataRow
            v-for="(item, index) in displayedData"
            :key="index"
            :item="item"
            :is-condensed="isCondensedMode"
            :show-location="shouldShowLocation(item, index)"
            @trigger-popup="onTriggerPopup"
        />
      </div>
    </div>

    <div id="stickyContextBar" class="sticky-label2" style="display: block;" v-if="hasData">
      <div class="sticky-bar-inner">
        <!-- Display mode -->
        <span
          v-if="!isEditingLocation"
          id="stickyContextText"
          @click="startEditingLocation"
          style="cursor: pointer;"
        >
          📍 {{ currentStickyLocation }}
        </span>

        <!-- Edit mode -->
        <input
          v-else
          ref="locationInputRef"
          v-model="editLocationInput"
          @blur="submitLocationEdit"
          @keyup.enter="submitLocationEdit"
          @keyup.esc="cancelLocationEdit"
          class="location-edit-input"
          placeholder="輸入地點名稱..."
        />

        <div class="stickybar-filter-wrapper" ref="filterWrapperRef">
          <div class="stickybar-filter-trigger" @click.stop="isFilterOpen = !isFilterOpen">
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
          <div class="custom-switch" :class="{ open: !isCondensedMode }">
            <div class="custom-slider"></div>
          </div>
          <span class="switch-text">{{ !isCondensedMode ? '全顯' : '主體' }}</span>
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
import DataRow from './DataRow.vue';
import { parseFeatureString,get_detail } from '@/utils/ResultTable.js';
import ValuePopup from "./ValuePopup.vue";
import FeaturePopup from "./FeaturePopup.vue";

const props = defineProps({
  data: { type: Array, default: () => [] },
  isCondensed: { type: Boolean, default: false }
});

// === 核心数据 (保持不变) ===
const tableData = ref([]);
const visibleRows = ref(30);
const scrollContainerRef = ref(null);
const isCondensedMode = ref(props.isCondensed);
const currentStickyLocation = ref('');
const isEditingLocation = ref(false);
const editLocationInput = ref('');
const locationInputRef = ref(null);
const isFilterOpen = ref(false);
const filterWrapperRef = ref(null);
const selectedValues = ref([]);
const panelHeight = ref('auto');

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
// ... (calculateStats, filteredData, sortedData, displayedData, filterTriggerText 等逻辑完全保留)
function calculateStats() {
  const totals = new Map();
  tableData.value.forEach(item => {
    const groupValues = item.分組值 || {};
    const val = Object.values(groupValues)[0];
    const share = Number(item.佔比) || 0;
    if (val) totals.set(val, (totals.get(val) || 0) + share);
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

    if (selected.length > 0 && !selected.includes(value)) return false;
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
  return filteredData.value.sort((a, b) => {
    if (a.地點 !== b.地點) return a.地點.localeCompare(b.地點);
    return b.佔比 - a.佔比;
  });
});
const displayedData = computed(() => sortedData.value.slice(0, visibleRows.value));
const filterTriggerText = computed(() => {
  if (selectedValues.value.length === 0) return '🎯 篩選';
  const recent = selectedValues.value.slice(-3);
  return `🎯 已選：${recent.join('|')}${selectedValues.value.length > 3 ? '…' : ''}`;
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
    const parseResult = parseFeatureString(feature);
    if (parseResult.matched_fields === null) {
      // 传递 group_inputs
      get_detail(location, feature, false, true, null, [field]);
    } else {
      const newFeature = `${feature.replace(/·/g, '')}-${field}`;
      get_detail(location, newFeature, false, true);
    }
  }
};

// Start editing location
const startEditingLocation = () => {
  isEditingLocation.value = true;
  editLocationInput.value = currentStickyLocation.value;
  nextTick(() => {
    locationInputRef.value?.focus();
    locationInputRef.value?.select();
  });
};

// Cancel editing
const cancelLocationEdit = () => {
  isEditingLocation.value = false;
  editLocationInput.value = '';
};

// Submit location edit
const submitLocationEdit = () => {
  const targetLocation = editLocationInput.value.trim();

  if (!targetLocation || targetLocation === currentStickyLocation.value) {
    // No change or empty input - just cancel
    cancelLocationEdit();
    return;
  }

  // Find matching location in data
  const matchingIndex = sortedData.value.findIndex(
    item => item.地點 === targetLocation
  );

  if (matchingIndex === -1) {
    // No match found - revert to original
    cancelLocationEdit();
    return;
  }

  // Match found - scroll to that location
  scrollToLocation(targetLocation, matchingIndex);
  cancelLocationEdit();
};

// Scroll to specific location
const scrollToLocation = (locationName, dataIndex) => {
  const content = scrollContainerRef.value;
  if (!content) return;

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

const handleGlobalClickForFilter = (e) => {
  if (isFilterOpen.value && filterWrapperRef.value && !filterWrapperRef.value.contains(e.target)) {
    isFilterOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleGlobalClickForFilter);
  initScrollObserver();
  nextTick(() => {
    if(tableData.value.length > 0) panelHeight.value = `${tableData.value.length * 30}px`;
  });
});

onUnmounted(() => {
  document.removeEventListener('click', handleGlobalClickForFilter);
});
</script>

<style scoped>
.Panel {
  resize: both;
  overflow: auto;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
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
}

.sticky-label2:hover {
  background: rgba(240, 240, 240, 0.9);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.sticky-label2.sticky-scrolled {
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.sticky-label2::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: inherit;
  z-index: -1;
}

.sticky-bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  position: relative;
}

.stickybar-filter-wrapper {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
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
}

.stickybar-filter-trigger:hover {
  background: rgba(255, 255, 255, 0.35);
  box-shadow: 0 0 8px rgba(0, 122, 255, 0.4);
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
}

.stickybar-filter-dropdown.open {
  display: block;
}

.stickybar-filter-dropdown::-webkit-scrollbar {
  width: 6px;
}

.stickybar-filter-dropdown::-webkit-scrollbar-thumb {
  background-color: rgba(0, 122, 255, 0.3);
  border-radius: 3px;
}

.stickybar-filter-option {
  display: flex;
  align-items: center;
  margin: 6px 0;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: color 0.2s;
}

.stickybar-filter-option:hover {
  color: #007aff;
}

.stickybar-filter-option input[type="checkbox"] {
  margin-right: 6px;
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
  transform: scale(1.3);
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
  transform: scale(1.3);
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

.location-edit-input {
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #007bff;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 14px;
  font-weight: 600;
  outline: none;
  min-width: 150px;
  color: #333;
}

.location-edit-input:focus {
  border-color: #0056b3;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

#stickyContextText {
  transition: background 0.2s;
  padding: 4px 8px;
  border-radius: 4px;
}

#stickyContextText:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
<!--<style scoped>-->
<!--/* ========================================-->
<!--   Panel Container-->
<!--   ======================================== */-->
<!--.Panel {-->
<!--    resize: both;-->
<!--    overflow: auto;-->
<!--    border-radius: 12px;-->
<!--    border: 1px solid #e0e0e0;-->
<!--    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);-->
<!--    display: flex;-->
<!--    flex-direction: column;-->
<!--    transition: all 0.3s ease;-->
<!--    z-index: 1;-->
<!--    bottom: 1dvh;-->
<!--    left: 2dvw;-->
<!--    right: 2dvw;-->
<!--    height: 78dvh;-->
<!--    position: fixed;-->
<!--}-->

<!--@media (orientation: portrait) {-->
<!--    .Panel {-->
<!--        height: 70dvh;-->
<!--        bottom: 2dvh;-->
<!--        left: 1dvw;-->
<!--        right: 1dvw;-->
<!--    }-->
<!--}-->

<!--/* ========================================-->
<!--   Panel Content-->
<!--   ======================================== */-->
<!--.panel-content {-->
<!--    flex: 1;-->
<!--    overflow: visible;-->
<!--    padding: 13px;-->
<!--    box-sizing: border-box;-->
<!--    color: #333;-->
<!--    display: flex;-->
<!--    flex-direction: column;-->
<!--    gap: 15px;-->
<!--    overflow-y: auto;-->
<!--}-->

<!--#resultPanelContent {-->
<!--    overflow-y: auto;-->
<!--    height: 100%;-->
<!--}-->

<!--/* ========================================-->
<!--   Sticky Bar-->
<!--   ======================================== */-->
<!--.sticky-label2 {-->
<!--    position: absolute;-->
<!--    bottom: 0;-->
<!--    background: rgba(255, 255, 255, 0.3);-->
<!--    left: 0;-->
<!--    right: 0;-->
<!--    backdrop-filter: blur(2px);-->
<!--    padding: 9px 18px;-->
<!--    font-size: 14px;-->
<!--    font-weight: bold;-->
<!--    border-bottom: 1px solid rgba(204, 204, 204, 0.6);-->
<!--    z-index: 999;-->
<!--    color: #333;-->
<!--    display: flex;-->
<!--    align-items: center;-->
<!--    justify-content: space-between;-->
<!--    border-radius: 10px;-->
<!--    transition: background 0.3s ease, box-shadow 0.3s ease;-->
<!--}-->

<!--.sticky-label2:hover {-->
<!--    background: rgba(240, 240, 240, 0.9);-->
<!--    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);-->
<!--}-->

<!--.sticky-label2.sticky-scrolled {-->
<!--    background: rgba(255, 255, 255, 0.1);-->
<!--    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);-->
<!--}-->

<!--.sticky-label2::before {-->
<!--    content: '';-->
<!--    position: absolute;-->
<!--    top: 0;-->
<!--    left: 0;-->
<!--    right: 0;-->
<!--    bottom: 0;-->
<!--    background: inherit;-->
<!--    z-index: -1;-->
<!--}-->

<!--.sticky-bar-inner {-->
<!--    display: flex;-->
<!--    align-items: center;-->
<!--    justify-content: space-between;-->
<!--    height: 100%;-->
<!--    position: relative;-->
<!--}-->

<!--/* ========================================-->
<!--   Filter Dropdown-->
<!--   ======================================== */-->
<!--.stickybar-filter-wrapper {-->
<!--    position: absolute;-->
<!--    left: 50%;-->
<!--    transform: translateX(-50%);-->
<!--    top: 50%;-->
<!--    transform: translate(-50%, -50%);-->
<!--    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;-->
<!--    font-size: 14px;-->
<!--    z-index: 1;-->
<!--}-->

<!--.stickybar-filter-trigger {-->
<!--    background: rgba(255, 255, 255, 0.2);-->
<!--    backdrop-filter: blur(10px);-->
<!--    -webkit-backdrop-filter: blur(10px);-->
<!--    border-radius: 14px;-->
<!--    padding: 4px 12px;-->
<!--    color: #007aff;-->
<!--    cursor: pointer;-->
<!--    user-select: none;-->
<!--    white-space: nowrap;-->
<!--    border: 1px solid rgba(0, 122, 255, 0.2);-->
<!--    display: flex;-->
<!--    align-items: center;-->
<!--    justify-content: center;-->
<!--    font-weight: 500;-->
<!--    transition: all 0.25s ease;-->
<!--}-->

<!--.stickybar-filter-trigger:hover {-->
<!--    background: rgba(255, 255, 255, 0.35);-->
<!--    box-shadow: 0 0 8px rgba(0, 122, 255, 0.4);-->
<!--}-->

<!--.stickybar-filter-dropdown {-->
<!--    position: absolute;-->
<!--    bottom: 110%;-->
<!--    left: 0;-->
<!--    background: rgba(255, 255, 255, 0.9);-->
<!--    backdrop-filter: blur(12px);-->
<!--    -webkit-backdrop-filter: blur(12px);-->
<!--    border-radius: 10px;-->
<!--    padding: 8px;-->
<!--    display: none;-->
<!--    max-height: 200px;-->
<!--    overflow-y: auto;-->
<!--    min-width: 70px;-->
<!--    z-index: 9999;-->
<!--    border: 1px solid rgba(0, 0, 0, 0.1);-->
<!--    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);-->
<!--}-->

<!--.stickybar-filter-dropdown.open {-->
<!--    display: block;-->
<!--}-->

<!--.stickybar-filter-dropdown::-webkit-scrollbar {-->
<!--    width: 6px;-->
<!--}-->

<!--.stickybar-filter-dropdown::-webkit-scrollbar-thumb {-->
<!--    background-color: rgba(0, 122, 255, 0.3);-->
<!--    border-radius: 3px;-->
<!--}-->

<!--.stickybar-filter-option {-->
<!--    display: flex;-->
<!--    align-items: center;-->
<!--    margin: 6px 0;-->
<!--    font-size: 14px;-->
<!--    color: #333;-->
<!--    cursor: pointer;-->
<!--    transition: color 0.2s;-->
<!--}-->

<!--.stickybar-filter-option:hover {-->
<!--    color: #007aff;-->
<!--}-->

<!--.stickybar-filter-option input[type="checkbox"] {-->
<!--    margin-right: 6px;-->
<!--}-->

<!--/* ========================================-->
<!--   Custom Switch Toggle-->
<!--   ======================================== */-->
<!--.custom-switch-container {-->
<!--    position: absolute;-->
<!--    right: 5%;-->
<!--    transform: translateX(-50%);-->
<!--    display: flex;-->
<!--    align-items: center;-->
<!--    justify-content: center;-->
<!--    font-family: 'Arial', sans-serif;-->
<!--    font-size: 16px;-->
<!--}-->

<!--.custom-switch {-->
<!--    position: relative;-->
<!--    cursor: pointer;-->
<!--    width: 50px;-->
<!--    height: 30px;-->
<!--    background-color: #ccc;-->
<!--    border-radius: 30px;-->
<!--    display: flex;-->
<!--    align-items: center;-->
<!--    justify-content: center;-->
<!--    transition: background-color 0.3s ease;-->
<!--}-->

<!--.custom-slider:before {-->
<!--    content: "";-->
<!--    position: absolute;-->
<!--    top: 2px;-->
<!--    left: 2px;-->
<!--    width: 26px;-->
<!--    height: 26px;-->
<!--    background-color: white;-->
<!--    border-radius: 50%;-->
<!--    transition: all 0.3s ease;-->
<!--}-->

<!--.custom-switch.open .custom-slider:before {-->
<!--    transform: translateX(20px);-->
<!--}-->

<!--.custom-switch:hover {-->
<!--    background-color: dimgray;-->
<!--    box-shadow: 0 0 10px 4px rgba(0, 123, 255, 0.7);-->
<!--    transform: scale(1.3);-->
<!--}-->

<!--.custom-switch:hover .custom-slider:before {-->
<!--    background-color: white;-->
<!--    box-shadow: 0 0 8px rgba(0, 123, 255, 0.5);-->
<!--}-->

<!--.custom-switch.open {-->
<!--    background-color: #007aff;-->
<!--    animation: blueGlow 2s infinite ease-in-out;-->
<!--}-->

<!--.custom-switch.open:hover {-->
<!--    background: linear-gradient(135deg, #00bfff, #66ccff);-->
<!--    transform: scale(1.3);-->
<!--    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);-->
<!--}-->

<!--@keyframes blueGlow {-->
<!--    0% {-->
<!--        box-shadow: 0 0 5px rgba(0, 122, 255, 0.4),-->
<!--        0 0 10px rgba(0, 122, 255, 0.6),-->
<!--        0 0 20px rgba(0, 122, 255, 0.8),-->
<!--        0 0 30px rgba(0, 122, 255, 0.9);-->
<!--    }-->
<!--    50% {-->
<!--        box-shadow: 0 0 10px rgba(102, 204, 255, 0.6),-->
<!--        0 0 20px rgba(102, 204, 255, 0.8),-->
<!--        0 0 30px rgba(102, 204, 255, 1),-->
<!--        0 0 40px rgba(102, 204, 255, 1);-->
<!--    }-->
<!--    100% {-->
<!--        box-shadow: 0 0 5px rgba(0, 122, 255, 0.4),-->
<!--        0 0 10px rgba(0, 122, 255, 0.6),-->
<!--        0 0 20px rgba(0, 122, 255, 0.8),-->
<!--        0 0 30px rgba(0, 122, 255, 0.9);-->
<!--    }-->
<!--}-->

<!--.custom-switch.open:hover .custom-slider:before {-->
<!--    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);-->
<!--}-->

<!--.switch-text {-->
<!--    color: black;-->
<!--    font-size: 12px;-->
<!--    font-weight: bold;-->
<!--    text-transform: uppercase;-->
<!--    position: absolute;-->
<!--    z-index: 1;-->
<!--    transition: transform 0.3s ease, color 0.3s ease;-->
<!--    pointer-events: none;-->
<!--    top: 50%;-->
<!--    transform: translateY(-50%);-->
<!--}-->

<!--.custom-switch.open .switch-text {-->
<!--    color: black;-->
<!--    transform: translateX(-25px) translateY(-50%);-->
<!--    top: 50%;-->
<!--    position: absolute;-->
<!--    z-index: 1;-->
<!--    pointer-events: none;-->
<!--    transition: transform 0.3s ease, color 0.3s ease, text-shadow 0.3s ease;-->
<!--    animation: glowing 2s infinite linear;-->
<!--    white-space: nowrap;-->
<!--}-->

<!--/* ========================================-->
<!--   Location Edit Input-->
<!--   ======================================== */-->
<!--.location-edit-input {-->
<!--    background: rgba(255, 255, 255, 0.9);-->
<!--    border: 2px solid #007bff;-->
<!--    border-radius: 4px;-->
<!--    padding: 4px 8px;-->
<!--    font-size: 14px;-->
<!--    font-weight: 600;-->
<!--    outline: none;-->
<!--    min-width: 150px;-->
<!--    color: #333;-->
<!--}-->

<!--.location-edit-input:focus {-->
<!--    border-color: #0056b3;-->
<!--    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);-->
<!--}-->

<!--#stickyContextText {-->
<!--    transition: background 0.2s;-->
<!--    padding: 4px 8px;-->
<!--    border-radius: 4px;-->
<!--}-->

<!--#stickyContextText:hover {-->
<!--    background: rgba(255, 255, 255, 0.2);-->
<!--}-->
<!--</style>-->