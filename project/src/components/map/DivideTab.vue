<template>
  <div>
    <div class="page" style="max-width: 90%;overflow: hidden">
      <div class="page-content-stack">
        <div class="page-footer" style="flex-direction: column">
          <p style="margin:0">分區繪圖</p>
          <small class="hint">按照不同分區層級，繪製方言分佈點圖<br>程序自動分配不同顏色</small>
        </div>

        <div class="dropdown-row horizontal-dropdown" style="margin-top: 12px;">
          <label class="query-label" style="margin:0;font-size: 14px;">
            繪圖分區級數
          </label>

          <div class="dropdown-wrapper" style="width: 200px">
            <div class="dropdown" ref="regionTriggerEl" @click="toggleDropdown('region')" style="margin: 0">
              {{ selectedRegion || '請選擇級數' }}
              <span class="arrow">▾</span>
            </div>

            <Teleport to="body">
              <div
                  v-if="dropdownOpen === 'region'"
                  class="dropdown-panel"
                  :style="dropdownStyle.region"
                  ref="regionDropdownEl"
              >
                <div
                    class="dropdown-item"
                    v-for="region in [1, 2, 3]"
                    :key="region"
                    @click="selectRegion(region)"
                >
                  {{ region }}級分區
                </div>
              </div>
            </Teleport>
          </div>
        </div>
      </div>
    </div>

    <LocationAndRegionInput
        ref="locationRef"
        @update:runDisabled="uiStore.buttonStates.divide.isLocationDisabled = $event"
        v-model="locationModel"
        limitContext="divide"
    />

    <div class="run-container">
      <button
          id="allmap-first"
          class="allmap-first"
          @click="runAction"
          :disabled="buttonState.isRunning || isDisabled"
          :class="{ 'disabled-style': isDisabled }"
      >
        <span v-if="buttonState.isRunning">🔄 運行中...</span>
        <span v-else>🌍繪圖</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router' // ✨ 1. 引入路由
import LocationAndRegionInput from "@/components/query/LocationAndRegionInput.vue";
import { mapStore, uiStore, isDivideButtonDisabled, setRunning } from "@/utils/store.js";
import { getCoordinates } from '@/api/query/geo'
import { showError } from '@/utils/message.js';

// ✨ 2. 初始化路由
const router = useRouter()
const route = useRoute()

const locationRef = ref(null)
// 使用 uiStore 中的按钮状态（不再定义本地状态）
const buttonState = uiStore.buttonStates.divide
const isDisabled = isDivideButtonDisabled
const selectedRegion = ref('')
const dropdownOpen = ref(null)
const regionTriggerEl = ref(null)
const regionDropdownEl = ref(null)
const locationModel = ref({
  locations: [],
  regions: [],
  regionUsing: 'map'
})

// isLocationDisabled 状态已移至 uiStore，不再需要本地定义

const emit = defineEmits(['region-selected'])

const dropdownStyle = reactive({
  region: { top: '0px', left: '0px' }
})

// Dropdown 邏輯
const toggleDropdown = (type) => {
  dropdownOpen.value = dropdownOpen.value === type ? null : type
  nextTick(() => {
    if (type === 'region' && regionTriggerEl.value) {
      const rect = regionTriggerEl.value.getBoundingClientRect()
      dropdownStyle.region = {
        position: 'absolute',
        top: `${rect.top + rect.height + window.scrollY}px`,
        left: `${rect.left + window.scrollX}px`,
        zIndex: 99999
      }
    }
  })
}

const selectRegion = (val) => {
  selectedRegion.value = val
  dropdownOpen.value = null
  emit('region-selected', val)
}

const onClickOutside = (event) => {
  const targets = [regionTriggerEl.value, regionDropdownEl.value]
  const isInsideAny = targets.some(el => el?.contains(event.target))
  if (!isInsideAny) dropdownOpen.value = null
}

onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))

const runAction = async () => {
  setRunning('divide', true);

  // Use merged locations from template ref (includes custom regions)
  // This gets textarea locations + custom region locations merged in background
  const locationList = (locationRef.value?.allLocationsArray && locationRef.value.allLocationsArray.length > 0)
    ? locationRef.value.allLocationsArray.filter(Boolean)
    : ['廣州'];  // Default fallback

  const regionList = (locationModel.value.regions && locationModel.value.regions.length > 0)
    ? locationModel.value.regions.filter(Boolean)
    : [];

  const queryParams = {
    locations: locationList,
    regions: regionList,
    region_mode: locationModel.value.regionUsing || 'map',
    iscustom: 'true',
    flag: 'False'
  }

  try {
    const data = await getCoordinates(queryParams)

    // 更新 Store
    mapStore.mapData = data;
    mapStore.mergedData = [];
    mapStore.mode = 'dot';

    // 切換回地圖 Tab
    await router.replace({query: {...route.query, sub: 'map'}});

  } catch (error) {
    console.error(error);
    showError("獲取數據失敗: " + error.message);
  } finally {
    setRunning('divide', false);
  }
}
</script>

<style scoped>
/* 可選：給禁用按鈕加一點樣式，讓用戶知道不可點 */
.allmap-first:disabled {
  background: #ccc; /* 灰色 */
  cursor: not-allowed;
  transform: none !important; /* 禁止按下的動畫 */
  box-shadow: none;
}
/* 將相關樣式移入 */
.horizontal-dropdown {
  display: flex;
  align-items: center;
  justify-content: center;
  justify-items: center;
  gap: 6px;
  width: 100%;
  max-width: 300px;
  margin: auto;
}

.allmap-first {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(90deg, #007aff, mediumblue);
  border: none;
  border-radius: 30px;
  padding: 14px 28px;
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 1px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2), 0 6px 20px rgba(0, 0, 0, 0.19);
  pointer-events: auto; /* 恢復點擊事件，覆蓋父容器的 pointer-events: none */
}

.allmap-first:hover {
  background: linear-gradient(145deg, #4e5d5b, #212d2b);
  transform: translateY(-3px);
}
</style>