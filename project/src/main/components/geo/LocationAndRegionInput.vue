<template>
  <div style="width: 100%">
    <!-- ✅ 同行輸入：地點 + 分區 -->
    <div class="input-row" >

      <!-- ✅ 地點輸入框 -->
      <div class="location-input">
        <div class="location-header">
          <label for="locations">{{ $t('query.components.locationAndRegionInput.locationLabel') }}</label>
          <button
              class="select-location-btn"
              @click="openPartitionModalWithSelection"
              type="button"
              :title="$t('query.components.locationAndRegionInput.selectLocationTitle')"
          >
            {{ $t('query.components.locationAndRegionInput.selectLocationButton') }}
          </button>
        </div>
        <div class="textarea-wrapper">
          <textarea
              id="locations"
              ref="inputEl"
              :placeholder="$t('query.components.locationAndRegionInput.locationPlaceholder')"
              v-model="inputValue"
              @keyup="onKeyup"
              @blur="onBlur"
              autocomplete="off"
          ></textarea>
          <span v-if="showSuccessCheckmark" class="success-checkmark">✓</span>
        </div>
        <Teleport to="body">
          <div
              ref="suggestionEl"
              v-if="suggestions.length || successMessage"
              class="inline-suggestion"
              :style="suggestionStyle"
          >
            <div v-if="successMessage" class="success"><InlineIcon icon="✅" />{{ successMessage }}</div>
            <div
                v-for="item in suggestions"
                :key="item"
                class="suggest-line"
                @mousedown.prevent="applySuggestion(item)"
            >
              {{ item }}
            </div>
          </div>
        </Teleport>
      </div>

        <!-- ✅ 分區選擇區 -->
      <!-- OLD MODE: Cascader with tabs (default) -->
      <div v-if="!useInputMode" class="region-input" style="flex: 1;">
        <div class="region-header"
             style="display: flex; align-items: center; justify-content: center; margin-bottom: 6px; white-space: nowrap; gap: 4px;">

          <div class="region-tabs" style="margin:0;align-items: center;">
            <button
                v-for="tab in ['map', 'yindian']"
                :key="tab"
                class="tab-btn"
                :class="{ active: regionUsing === tab }"
                @click="onTabClick(tab)"
            >
              {{ tab === 'map' ? $t('query.components.locationAndRegionInput.mapTab') : $t('query.components.locationAndRegionInput.yindianTab') }}
            </button>
          </div>

          <!-- 新增：分区详情按钮 -->
          <button
              class="info-btn"
              @click="openPartitionInfoModal"
              :title="$t('query.components.locationAndRegionInput.viewPartitionDetails')"
          >
            <span class="icon"><InlineIcon icon="ℹ️" /></span>
          </button>
        </div>

        <!-- ✅ 分區 Cascader -->
        <RegionSelector
            :mode="regionUsing"
            v-model:selected="selectedValue"
            :custom-regions="selectedCustomRegions"
            :placeholder="regionUsing === 'map' ? $t('query.components.locationAndRegionInput.selectMapPartition') : $t('query.components.locationAndRegionInput.selectYindianPartition')"
            @selectCustomRegion="handleCustomRegionSelect"
            @update:customRegions="handleCustomRegionUpdate"
            @update:customRegionData="handleCustomRegionDataUpdate"
        />

      </div>

      <!-- NEW MODE: Textarea input (for CustomTab) -->
      <RegionInputMode
          v-else
          v-model="regionInputValue"
          v-model:region-using="regionUsing"
          @open-partition-info="openPartitionInfoModal"
      />
    </div>
    <!-- ✅ 底部提示欄：已選擇地點數 -->
    <div class="bottom-hint" >
      <div class="hint-main">
        {{ $t('query.components.locationAndRegionInput.selectedCountPre') }}<span class="hint-num">{{ totalCount }}</span>{{ $t('query.components.locationAndRegionInput.selectedCountPost') }}
      </div>
      <!-- ✅ 新增：深灰色預覽行（最多顯示 4 個 + 省略號 + 展開） -->
      <div v-if="locationsResult.length" class="hint-preview">
    <span class="preview-text">
      {{ previewText }}
    </span>
        <button
            v-if="locationsResult.length > 4"
            class="expand-btn"
            type="button"
            @click="openModal"
        >
          {{ $t('query.components.locationAndRegionInput.expandButton') }}
        </button>
      </div>
      <!-- 🔥 自定義特徵地點預覽（僅輸入模式） -->
      <div v-if="useInputMode && customFeatureLocations.length" class="hint-preview custom-preview">
        <span class="preview-label">{{ $t('query.components.locationAndRegionInput.customLocationsLabel') }}</span>
        <span class="preview-text">
          {{ customPreviewText }}
        </span>
        <button
            v-if="customFeatureLocations.length > 4"
            class="expand-btn"
            type="button"
            @click="openCustomModal"
        >
          {{ $t('query.components.locationAndRegionInput.expandButton') }}
        </button>
      </div>
      <!-- ✅ 對應 showToast 的提示行 -->
      <div v-if="limitHint" class="hint-warning">
        {{ limitHint }}
      </div>
      <AppModal
        v-model="showLocationsModal"
        size="sm"
        :title="$t('query.components.locationAndRegionInput.selectedLocationsModalTitle', { count: locationsResult.length })"
        :close-label="$t('common.button.close')"
      >
        <div class="locations-list">
          <span
            v-for="(loc, idx) in locationsResult"
            :key="loc + '_' + idx"
            class="loc-chip"
          >
            {{ loc }}
          </span>
        </div>
      </AppModal>
    </div>

    <!-- 自定義地點彈窗 -->
    <AppModal
      v-model="showCustomModal"
      size="sm"
      :title="$t('query.components.locationAndRegionInput.customLocationsModalTitle', { count: customFeatureLocations.length })"
      :close-label="$t('common.button.close')"
    >
      <div class="locations-list">
        <span
          v-for="(loc, idx) in customFeatureLocations"
          :key="loc + '_' + idx"
          class="loc-chip custom-chip"
        >
          {{ loc }}
        </span>
      </div>
    </AppModal>

    <!-- 分区详情弹窗 -->
    <PartitionInfoModal
        v-model="showPartitionInfoModal"
        :data-state="{ partitionData, isLoading: isLoadingPartitions, errorMessage: partitionTreeError }"
        :selection-state="{ initialTab: regionUsing, autoEnableSelection, initialSelectedLocations: locationsInTree, maxSelection: maxSelectionForModal }"
        @locations-changed="handleLocationsChanged"
        @locations-selected="handleLocationsSelected"
    />
  </div>
</template>


<script setup>
import InlineIcon from '@/components/common/InlineIcon.vue'
import { ref, nextTick ,onMounted, onActivated, watch, computed,defineProps, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { getLocations, getCustomFeature, getLocationPartitions, batchMatch, getPartitions } from '@/api/index.js'
import AppModal from '@/components/common/AppModal.vue'
import { customRegionStore } from '@/main/store/customRegionStore.js'
import RegionSelector from "@/main/components/geo/RegionSelector.vue"
import PartitionInfoModal from "@/main/components/geo/PartitionInfoModal.vue"
import { userStore } from '@/main/store/store.js'
import { LOCATION_LIMITS } from '@/main/config/constants.js'
import { buildExplicitLocationsForGetLocs, isExplicitLocationsLimitExceeded } from '@/main/utils/query/queryLimits.js'
import {STATIC_REGION_TREE, top_yindian} from "@/main/config/RegionTree.js";
import { usePartitionCache } from '@/composables/data/usePartitionCache.js'

const RegionInputMode = defineAsyncComponent(() => import('./RegionInputMode.vue'))

const { getPartitionData, getYindianTree } = usePartitionCache()

// 只保留音典允许暴露的顶级分区；不改结构，只裁掉不需要的 key。
const filterYindianTopLevelKeys = (obj) => {
  if (typeof obj !== 'object' || Array.isArray(obj) || obj === null) {
    return {}
  }

  const filtered = {}
  for (const key of top_yindian) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      filtered[key] = obj[key]
    }
  }
  return filtered
}

// const API_BASE = window.API_BASE;
// const MAP_TREE = STATIC_REGION_TREE;
// const YINDIAN_TREE = top_yindian;
// 接收外部传入的地點和分區
const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ locations: [], regions: [] ,regionUsing:'map'})  // 默认值
  },
  useInputMode: {
    type: Boolean,
    default: false
  },
  limitContext: {
    type: String,
    default: 'default'
  }
})

const inputValue = ref(props.modelValue.locations.join(' '))  // 初始化地點
const selectedValue = ref(props.modelValue.regions)            // 初始化分區
const regionUsing = ref(props.modelValue.regionUsing)

// Region input mode state
const regionInputValue = ref('')  // Textarea content for regions
// watch 外部传入的值
watch(() => props.modelValue, (newVal) => {
  if (!newVal) return

  // 比較解析後的數組，而不是字符串，避免空格被移除
  const currentLocations = (inputValue.value ?? '').trim().split(/\s+/).filter(Boolean)
  const newLocations = Array.isArray(newVal.locations) ? newVal.locations : []

  // 只有當解析後的數組真的不同時才更新
  if (JSON.stringify(currentLocations) !== JSON.stringify(newLocations)) {
    inputValue.value = newLocations.join(' ')
  }

  if (JSON.stringify(selectedValue.value) !== JSON.stringify(newVal.regions)) {
    selectedValue.value = newVal.regions
  }

  if (regionUsing.value !== newVal.regionUsing) {
    regionUsing.value = newVal.regionUsing
  }
}, { deep: true, immediate: true })


/** 地點輸入邏輯 */
const inputEl = ref(null)
// const inputValue = ref('') // 預設值
const suggestionEl = ref(null)
const suggestions = ref([])
const successMessage = ref('')
const showSuccessCheckmark = ref(false)
const suggestionStyle = ref({
  left: '0px',
  top: '0px',
  position: 'absolute',
  zIndex: 99999
})

// 已選擇地點數（來自 /get_locs/ 返回）
const selectedCount = ref(null)
// 定义事件，用于通知父组件禁用/启用按钮
const emit = defineEmits(['update:runDisabled', 'update:modelValue'])

// 自定義分區狀態
const customRegionLocations = ref([])
const customRegionName = ref('')
const selectedCustomRegions = ref([])  // Track selected custom region names
const customRegionsData = ref([])  // Store full custom region data with locations
const isRestoringRegionSelection = ref(false)
const regionSelectionChangedSinceLastFetch = ref(false)
const lastValidRegionSelection = ref({
  selectedValue: [],
  selectedCustomRegions: [],
  regionUsing: props.modelValue.regionUsing || 'map'
})

// 處理自定義分區選擇 (old single-select method - keep for backward compatibility)
function handleCustomRegionSelect({ regionName, locations }) {
  // 不修改 textarea，僅內部處理
  customRegionLocations.value = locations
  customRegionName.value = regionName

  // 清空系統分區選擇
  selectedValue.value = []

  // 自動觸發查詢（使用自定義分區的地點）
  handleCustomRegionQuery(locations)
}

// New: Handle multi-select custom regions
function handleCustomRegionUpdate(customRegionNames) {
  selectedCustomRegions.value = customRegionNames

  // Ensure custom region data is loaded
  if (customRegionNames.length > 0 && customRegionsData.value.length === 0) {
    loadCustomRegionsData()
  }
}

function cloneSelectionArray(value) {
  return Array.isArray(value) ? [...value] : []
}

function snapshotCurrentRegionSelection() {
  return {
    selectedValue: cloneSelectionArray(selectedValue.value),
    selectedCustomRegions: cloneSelectionArray(selectedCustomRegions.value),
    regionUsing: regionUsing.value
  }
}

function commitLastValidRegionSelection() {
  lastValidRegionSelection.value = snapshotCurrentRegionSelection()
}

function revertRegionSelectionForLocationLimit(count) {
  limitHint.value = t('query.components.locationAndRegionInput.tooManyLocations')
  selectedCount.value = count
  updateDisabledState(true)
  isRestoringRegionSelection.value = true

  const lastValid = lastValidRegionSelection.value
  selectedValue.value = cloneSelectionArray(lastValid.selectedValue)
  selectedCustomRegions.value = cloneSelectionArray(lastValid.selectedCustomRegions)
  regionUsing.value = lastValid.regionUsing
  regionSelectionChangedSinceLastFetch.value = false

  nextTick(() => {
    isRestoringRegionSelection.value = false
  })
}

// New: Handle custom region data update (full region objects with locations)
function handleCustomRegionDataUpdate(regionObjects) {
  // Update customRegionsData for immediate use
  if (regionObjects && regionObjects.length > 0) {
    customRegionsData.value = regionObjects
    console.log(`Received ${regionObjects.length} custom region objects with locations`)
  }
}

// Use custom region store
const { fetchCustomRegions, customRegions } = customRegionStore()

// Load custom regions data when component mounts
async function loadCustomRegionsData() {
  if (!userStore.isAuthenticated) return

  try {
    // 只加载分区列表，不加载详情！
    await fetchCustomRegions()

    // 直接使用列表数据，不需要获取每个分区的详情
    // 详情只在用户选择使用时才获取
    customRegionsData.value = customRegions.value

    console.log(`Loaded ${customRegions.value.length} custom regions (list only, no details)`)
  } catch (error) {
    console.error('Failed to load custom regions:', error)
  }
}

onMounted(() => {
  reset()
})

// 使用自定義分區地點進行查詢
async function handleCustomRegionQuery(locations) {
  if (!locations || locations.length === 0) {
    return
  }

  const explicitLocations = buildExplicitLocationsForGetLocs({ locations })

  if (isExplicitLocationsLimitExceeded(explicitLocations)) {
    limitHint.value = t('query.components.locationAndRegionInput.tooManyLocations')
    selectedCount.value = explicitLocations.length
    updateDisabledState(true)
    return
  }

  try {
    const data = await getLocations({
      locations: explicitLocations,
      regions: [],  // 不使用系統分區
      region_mode: regionUsing.value
    })

    if (data.success) {
      // ✅ 同样加上去重逻辑
      const uniqueLocations = Array.isArray(data.locations_result)
          ? [...new Set(data.locations_result)]
          : []
      selectedCount.value = uniqueLocations.length

      // 更新父組件
      emit('update:modelValue', {
        locations: data.locations_result || [],
        regions: [],
        regionUsing: regionUsing.value
      })

      // 檢查限制
      checkLocationLimit(selectedCount.value)
    }
  } catch (error) {
    console.error('自定義分區查詢失敗', error)
  }
}

// 檢查地點數量限制
function checkLocationLimit(count) {
  const contextLimits = LOCATION_LIMITS[props.limitContext] || LOCATION_LIMITS.default
  const limits = contextLimits[userStore.role] || contextLimits.anonymous

  if (count > limits.MAX_LOCATIONS) {
    limitHint.value = limits.MESSAGE.replace('{limit}', limits.MAX_LOCATIONS)
    updateDisabledState(true)
  } else {
    limitHint.value = ''
    updateDisabledState(false)
  }
}

// 辅助函数：通知父组件禁用状态变更
function updateDisabledState(isDisabled) {
  emit('update:runDisabled', isDisabled)
}

// 底部提示欄的「限制提示文案」（對應 showToast）
// 為空字串時不顯示
const limitHint = ref('')
let debounceTimer = null

function getQueryStart() {
  const el = inputEl.value
  const cursorPos = el.selectionStart
  const value = el.value
  const separators = /[ ,;/，；、\n\t]/g

  let lastSepIndex = -1
  for (let i = cursorPos - 1; i >= 0; i--) {
    if (separators.test(value[i])) {
      lastSepIndex = i
      break
    }
  }

  return {
    queryStart: lastSepIndex + 1,
    cursorPos,
    value
  }
}

function onKeyup() {
  showSuccessCheckmark.value = false
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchSuggestion, 200)
}

function onBlur() {
  setTimeout(() => {
    suggestions.value = []
    successMessage.value = ''
    showSuccessCheckmark.value = false
  }, 200)
}

function fetchSuggestion() {
  const { queryStart, cursorPos, value } = getQueryStart()
  const query = value.slice(queryStart, cursorPos).trim()
  if (!query) {
    suggestions.value = []
    successMessage.value = ''
    showSuccessCheckmark.value = false
    return
  }

  batchMatch(query, true)
      .then(results => {
        suggestions.value = []
        successMessage.value = ''
        if (!results.length) return

        const r = results[0]
        if (r.success) {
          // ✅ Success: Show checkmark in textarea + items in dropdown (NO success message)
          showSuccessCheckmark.value = true
          successMessage.value = ''  // Clear success message

          // Show items if available
          if (r.items && r.items.length > 0) {
            const allValues = value.split(/[ ,;/，；、\n\t]+/).filter(Boolean)
            const exclusionSet = new Set(allValues.filter(v => v !== query))
            const filtered = Array.from(new Set(r.items)).filter(item => !exclusionSet.has(item))
            suggestions.value = filtered
          }
        } else {
          // ❌ No match: Show items only
          showSuccessCheckmark.value = false
          successMessage.value = ''
          const allValues = value.split(/[ ,;/，；、\n\t]+/).filter(Boolean)
          const exclusionSet = new Set(allValues.filter(v => v !== query))
          const filtered = Array.from(new Set(r.items)).filter(item => !exclusionSet.has(item))
          suggestions.value = filtered
        }

        nextTick(() => {
          const el = inputEl.value
          const rect = el.getBoundingClientRect()

          suggestionStyle.value = {
            position: 'absolute',
            left: `${rect.left + window.scrollX}px`,
            top: `${rect.top + rect.height + 6 + window.scrollY}px`,
            zIndex: 99999,
            minWidth: `${el.offsetWidth}px` // 可選：匹配寬度
          }

        })
      })
}

function applySuggestion(item) {
  const { queryStart, cursorPos, value } = getQueryStart()
  const before = value.slice(0, queryStart)
  const after = value.slice(cursorPos)
  inputValue.value = before + item + ' ' + after

  nextTick(() => {
    const pos = before.length + item.length + 1
    inputEl.value.setSelectionRange(pos, pos)
    suggestions.value = []
    successMessage.value = ''
  })
}

/* ========== 分區選擇邏輯 ========== */
// const selectedValue = ref([])  // ✅ 不要 ['']

const options = ref([])


function onTabClick(tab) {
  if (regionUsing.value === tab) return
  regionUsing.value = tab
  selectedValue.value = []
  loadTreeFor(tab)
  // console.log('tab',tab)
  // 根據 tab 設置對應的預設值
  // if (tab === 'map') {
  //   selectedValue.value = ['客家話']
  // } else if (tab === 'yindian') {
  //   selectedValue.value = ['閩','閩西']
  // }
}

function onSelect(values) {
  selectedValue.value = values
}

/* ========== 一次性轉換整棵樹 ========== */
function convertToCascaderOptions(tree) {
  if (Array.isArray(tree)) {
    // 是 Array，直接轉成葉子節點
    return tree.map(label => ({
      label,
      value: label,
      isLeaf: true
    }))
  }

  if (typeof tree === 'object' && tree !== null) {
    return Object.entries(tree).map(([label, children]) => {
      const convertedChildren = convertToCascaderOptions(children)

      // 根據是否有子節點決定是否為葉子
      const isLeaf = convertedChildren.length === 0

      return {
        label,
        value: label,
        ...(isLeaf ? { isLeaf: true } : { children: convertedChildren })
      }
    })
  }

  return []
}

/* ========== 分區資料來源 ========== */
function loadTreeFor(mode) {
  if (mode === 'map') {
    options.value = convertToCascaderOptions(STATIC_REGION_TREE)
    // console.log(options)
  } else if (mode === 'yindian') {
    // 统一走缓存 helper：优先复用 sessionStorage，没有命中时再请求并写回。
    getYindianTree(() => getPartitions(), {
      transform: filterYindianTopLevelKeys,
    }).then((filteredTree) => {
      options.value = convertToCascaderOptions(filteredTree)
    })

  }
}
// 初始加載
loadTreeFor(regionUsing.value)


// const cascaderRef = ref(null)

// async function simulateClickPath(path) {
//   // 1. 打開 Cascader 的彈窗
//   cascaderRef.value?.showMenu()
//
//   await nextTick()
//   // 2. 遞迴點擊每一層
//   for (const label of path) {
//     await nextTick()
//     // 獲取當前展開層的選項列表
//     const menuList = document.querySelectorAll('.n-cascader-menu')
//
//     // 找到當前層中 label 匹配的項
//     let found = false
//     for (const menu of menuList) {
//       const items = menu.querySelectorAll('.n-cascader-option')
//       for (const item of items) {
//         if (item.textContent?.trim().includes(label)) {
//           item.click()
//           found = true
//           break
//         }
//       }
//       if (found) break
//     }
//
//     if (!found) {
//       console.warn(`❗未找到 label: ${label}`)
//       break
//     }
//
//     // 等下一層渲染
//     await new Promise(resolve => setTimeout(resolve, 100))
//   }
// }

onMounted(() => {
  reset()
  loadCustomRegionsData()
  commitLastValidRegionSelection()
})

// onActivated(() => {
//   reset()
// })
async function fetchLocationsResult() {
  // 1️⃣ locations ← inputValue（地點輸入）
  const locations = (inputValue.value ?? '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)

  // 2️⃣ regions ← selectedValue（分區選擇）
  const rawRegions = selectedValue.value
  const regions = Array.isArray(rawRegions)
      ? rawRegions.map(v => String(v).trim()).filter(Boolean)
      : rawRegions
          ? [String(rawRegions).trim()].filter(Boolean)
          : []

  // 🔥 NEW: Get custom region locations from RegionSelector
  const customRegionLocationsArray = getCustomRegionLocations(selectedCustomRegions.value)

  // 3️⃣ 若兩者皆空，直接返回（對齊 isEmptyInput 判斷）
  if (locations.length === 0 && regions.length === 0 && customRegionLocationsArray.length === 0) {
    limitHint.value = t('query.components.locationAndRegionInput.requireInput')
    selectedCount.value = null
    locationsResult.value = []

    // ✅ 修复：清空自定义地点预览
    if (props.useInputMode) {
      customFeatureLocations.value = []
    }

    updateDisabledState(true)  // ⭐ 禁用按鈕
    return
  }

  try {
    const explicitLocations = buildExplicitLocationsForGetLocs({
      locations,
      customRegionLocations: customRegionLocationsArray
    })
    const isRegionSelectionValidation = !props.useInputMode
      && regionSelectionChangedSinceLastFetch.value
      && !isRestoringRegionSelection.value

    if (isExplicitLocationsLimitExceeded(explicitLocations)) {
      if (isRegionSelectionValidation) {
        revertRegionSelectionForLocationLimit(explicitLocations.length)
        return
      }

      limitHint.value = t('query.components.locationAndRegionInput.tooManyLocations')
      selectedCount.value = explicitLocations.length
      updateDisabledState(true)
      return
    }

    const data = await getLocations({
      locations: explicitLocations,
      regions,
      region_mode: regionUsing.value
    })

    // ✅ 拿到結果後立即使用 Set 去重
    const uniqueLocations = Array.isArray(data?.locations_result)
        ? [...new Set(data.locations_result)]
        : []
    // ✅ 存列表（用於預覽與彈層）
    locationsResult.value = uniqueLocations
    // 6️⃣ 核心結果：locations_result
    const count = uniqueLocations.length
    selectedCount.value = count

    // 7️⃣ 對齊原來的限制邏輯（showToast 對應 bottom-hint）
    // Get limits for current context and user role
    const contextLimits = LOCATION_LIMITS[props.limitContext] || LOCATION_LIMITS.default
    const limits = contextLimits[userStore.role] || contextLimits.anonymous

    if (count > limits.MAX_LOCATIONS) {
      limitHint.value = limits.MESSAGE.replace('{limit}', limits.MAX_LOCATIONS)
      updateDisabledState(true)
    } else {
      limitHint.value = ''
      updateDisabledState(false)
    }

    if (isRegionSelectionValidation) {
      commitLastValidRegionSelection()
      regionSelectionChangedSinceLastFetch.value = false
    }

    // ✅ 若你後面還有「正常處理」，從這裡往下接

    // 🔥 如果是輸入模式，額外調用 get_custom_feature
    if (props.useInputMode) {
      await fetchCustomFeatureLocations(explicitLocations, regions)
    }

    return data

  } catch (err) {
    console.error('❌ 請求錯誤:', err)
    limitHint.value = t('query.components.locationMultiInput.errorFetchLocations')
    selectedCount.value = null
    locationsResult.value = []
    customFeatureLocations.value = []
    updateDisabledState(true)  // ⭐ 錯誤時禁用按鈕
  }
}

// Helper to get locations from custom regions
function getCustomRegionLocations(customRegionNames) {
  if (!customRegionNames || customRegionNames.length === 0) return []

  const locations = []
  customRegionNames.forEach(name => {
    const region = customRegionsData.value.find(r => r.region_name === name)
    if (region && region.locations) {
      console.log(`Custom region "${name}" has ${region.locations.length} locations`)
      locations.push(...region.locations)
    } else {
      console.warn(`Custom region "${name}" not found or has no locations`)
    }
  })

  console.log(`Total custom region locations: ${locations.length}`)
  return locations
}

// 獲取自定義特徵地點列表
async function fetchCustomFeatureLocations(locations, regions) {
  // ✅ 登录检查（早返回）
  if (!userStore.isAuthenticated) {
    customFeatureLocations.value = []
    return  // 静默返回
  }

  // ✅ 只有两个输入框都为空时，才清空自定义地点，不调用 API
  if ((!locations || locations.length === 0) && (!regions || regions.length === 0)) {
    customFeatureLocations.value = []
    return
  }

  try {
    const queryParams = {
      locations: (locations && locations.length > 0) ? locations.filter(Boolean) : [],
      regions: (regions && regions.length > 0) ? regions.filter(Boolean) : [],
      word: ''
    }

    // 调用 API
    const response = await getCustomFeature(queryParams)

    // 提取所有的「簡稱」
    if (Array.isArray(response)) {
      customFeatureLocations.value = response
        .map(item => item['簡稱'])
        .filter(Boolean)
    } else {
      customFeatureLocations.value = []
    }
  } catch (err) {
    console.error('❌ 獲取自定義特徵失敗:', err)
    customFeatureLocations.value = []
  }
}
let debounceTimer2 = null

// Computed property: merged locations as space-separated string
// For QueryPage to access via template ref
const allLocationsString = computed(() => {
  // Parse textarea locations
  const textareaLocations = (inputValue.value ?? '').trim().split(/\s+/).filter(Boolean)

  // Get custom region locations
  const customRegionLocations = getCustomRegionLocations(selectedCustomRegions.value)

  const mergedLocations = buildExplicitLocationsForGetLocs({
    locations: textareaLocations,
    customRegionLocations
  })

  // Return as space-separated string
  return mergedLocations.join(' ')
})

// Computed property: merged locations as array
// For DivideTab to access via template ref
const allLocationsArray = computed(() => {
  // Parse textarea locations
  const textareaLocations = (inputValue.value ?? '').trim().split(/\s+/).filter(Boolean)

  // Get custom region locations
  const customRegionLocations = getCustomRegionLocations(selectedCustomRegions.value)

  return buildExplicitLocationsForGetLocs({
    locations: textareaLocations,
    customRegionLocations
  })
})

watch(
    [inputValue, selectedValue, regionUsing, regionInputValue, selectedCustomRegions],
    ([newInput, newSelected, newMode, newRegionInput, newCustomRegions]) => {
      // 1. 立即通知父組件更新數據 (實現雙向綁定)
      // ⚠️ IMPORTANT: Only emit textarea locations (NOT merged with custom regions)
      // This prevents circular update that would fill the textarea
      // Parent components should use template ref (allLocationsString) to get merged locations
      const textareaLocations = (newInput ?? '').trim().split(/\s+/).filter(Boolean)

      // 根據模式決定使用哪個數據源
      let regionsArr
      if (props.useInputMode) {
        // 新模式：從 regionInputValue 解析
        regionsArr = (newRegionInput ?? '').trim().split(/\s+/).filter(Boolean)
      } else {
        // 舊模式：使用 selectedValue
        regionsArr = newSelected
      }

      // 🔥 發射事件！這行代碼讓父組件知道數據變了
      // Emit ONLY textarea locations (not merged) to prevent circular update
      emit('update:modelValue', {
        locations: textareaLocations,
        regions: regionsArr,
        regionUsing: newMode
      })

      // 2. 處理後端查詢邏輯 (防抖)
      if (debounceTimer2) clearTimeout(debounceTimer2)
      debounceTimer2 = setTimeout(async () => {
        await fetchLocationsResult()
      }, 300)
    },
    { deep: true }
)

watch(
    [selectedValue, selectedCustomRegions, regionUsing],
    () => {
      if (props.useInputMode || isRestoringRegionSelection.value) {
        return
      }

      const currentSnapshot = snapshotCurrentRegionSelection()
      const lastValid = lastValidRegionSelection.value
      const selectionChanged =
        JSON.stringify(currentSnapshot.selectedValue) !== JSON.stringify(lastValid.selectedValue)
        || JSON.stringify(currentSnapshot.selectedCustomRegions) !== JSON.stringify(lastValid.selectedCustomRegions)
        || currentSnapshot.regionUsing !== lastValid.regionUsing

      regionSelectionChangedSinceLastFetch.value = selectionChanged
    },
    { deep: true }
)

// Max locations allowed for the partition modal selection
const maxSelectionForModal = computed(() => {
  const contextLimits = LOCATION_LIMITS[props.limitContext] || LOCATION_LIMITS.default
  const limits = contextLimits[userStore.role] || contextLimits.anonymous
  return limits.MAX_LOCATIONS === Infinity ? null : limits.MAX_LOCATIONS
})

// 当 limitContext 切换（tab 切换）时，用当前已有的 selectedCount 重新检查限制
watch(() => props.limitContext, () => {
  if (selectedCount.value !== null) {
    checkLocationLimit(selectedCount.value)
  }
})

// Initialize regionInputValue from modelValue
watch(() => props.modelValue.regions, (newRegions) => {
  if (props.useInputMode && Array.isArray(newRegions)) {
    // 比較解析後的數組，而不是字符串
    const currentRegions = (regionInputValue.value ?? '').trim().split(/\s+/).filter(Boolean)

    // 只有當解析後的數組真的不同時才更新
    if (JSON.stringify(currentRegions) !== JSON.stringify(newRegions)) {
      regionInputValue.value = newRegions.join(' ')
    }
  }
}, { immediate: true })
// ✅ 保存服務端返回的 locations_result
const locationsResult = ref([])

// ✅ 保存自定義特徵的地點列表（僅輸入模式）
const customFeatureLocations = ref([])

// ✅ 彈層開關
const showLocationsModal = ref(false)
const showCustomModal = ref(false)

// 計算總地點數（包含自定義地點）
const totalCount = computed(() => {
  const regularCount = selectedCount.value || 0
  const customCount = props.useInputMode ? (customFeatureLocations.value?.length || 0) : 0
  return regularCount + customCount
})

const previewText = computed(() => {
  const arr = locationsResult.value || []
  if (!arr.length) return ''
  const first4 = arr.slice(0, 4).join('、')
  return arr.length > 4 ? `${first4}…` : first4
})

const customPreviewText = computed(() => {
  const arr = customFeatureLocations.value || []
  if (!arr.length) return ''
  const first4 = arr.slice(0, 4).join('、')
  return arr.length > 4 ? `${first4}…` : first4
})

function openModal() {
  showLocationsModal.value = true
}

function closeModal() {
  showLocationsModal.value = false
}

function openCustomModal() {
  showCustomModal.value = true
}

function closeCustomModal() {
  showCustomModal.value = false
}
function reset() {
  inputValue.value = ''
  selectedValue.value = []     // ✅ 不要 ['']
}

// =====================================
// 分区详情相关状态和函数
// =====================================

const showPartitionInfoModal = ref(false)
const partitionData = ref([])
const isLoadingPartitions = ref(false)
const partitionTreeError = ref('')
const autoEnableSelection = ref(false)  // 是否自动启用选择模式
const originalInputValue = ref('')  // Store original value for revert on cancel

// Get all location names from partition data
const allTreeLocations = computed(() => {
  if (partitionData.value.length === 0) return []
  return partitionData.value.map(row => row['簡稱']).filter(Boolean)
})

// Parse current input value to location array
const currentLocations = computed(() => {
  return inputValue.value.trim().split(/\s+/).filter(Boolean)
})

// Separate: locations in tree vs not in tree
const locationsInTree = computed(() => {
  return currentLocations.value.filter(loc => allTreeLocations.value.includes(loc))
})

const locationsNotInTree = computed(() => {
  return currentLocations.value.filter(loc => !allTreeLocations.value.includes(loc))
})

// 打开弹窗
const openPartitionInfoModal = () => {
  autoEnableSelection.value = false  // 普通模式
  showPartitionInfoModal.value = true  // ✅ 立即显示弹窗

  // 如果数据未加载，则在后台加载
  if (partitionData.value.length === 0) {
    fetchPartitionData()  // ✅ 不 await，让它在后台加载
  }
}

// 打开弹窗并自动启用选择模式
const openPartitionModalWithSelection = () => {
  autoEnableSelection.value = true  // 自动启用选择模式
  originalInputValue.value = inputValue.value  // Store original for revert
  showPartitionInfoModal.value = true  // ✅ 立即显示弹窗

  // 如果数据未加载，则在后台加载
  if (partitionData.value.length === 0) {
    fetchPartitionData()  // ✅ 不 await，让它在后台加载
  }
}

// 获取分区数据（使用 sessionStorage 缓存）
const fetchPartitionData = async () => {
  isLoadingPartitions.value = true
  partitionTreeError.value = ''

  try {
    // 这里和自定义分区页共用同一套缓存 key / 数据格式，避免重复请求与重复解析。
    partitionData.value = await getPartitionData(() => getLocationPartitions())
  } catch (error) {
    console.error('获取分区数据失败:', error)
    partitionTreeError.value = t('query.components.locationMultiInput.errorPartitionMessage')
  } finally {
    isLoadingPartitions.value = false
  }
}

// 处理位置选择
const handleLocationsSelected = (locations) => {
  // ✅ REPLACE instead of append
  const mergedLocations = [
    ...locations,                    // Selected from modal
    ...locationsNotInTree.value      // Preserve manual input
  ]
  inputValue.value = mergedLocations.join(' ')
  originalInputValue.value = ''  // Clear to prevent revert

  nextTick(() => {
    fetchLocationsResult()
  })
}

// Real-time preview handler (doesn't trigger validation)
const handleLocationsChanged = (locations) => {
  const mergedLocations = [
    ...locations,                    // Selected from modal
    ...locationsNotInTree.value      // Preserve manual input
  ]
  inputValue.value = mergedLocations.join(' ')
  // Don't trigger validation (too expensive for real-time)
}

// 监听弹窗关闭，重置自动选择模式标志
watch(showPartitionInfoModal, (isVisible) => {
  if (!isVisible) {
    autoEnableSelection.value = false

    // Revert to original value if user cancelled (didn't confirm)
    if (originalInputValue.value !== '') {
      inputValue.value = originalInputValue.value
      originalInputValue.value = ''
    }
  }
})

defineExpose({
  inputValue,
  allLocationsString,
  allLocationsArray,
  selectedValue,
  regionUsing,
  selectedCount,
  limitHint,
  locationsResult
})

</script>




<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$primary: var(--color-primary);
$success: var(--color-success);
$custom-purple: var(--color-purple);
$portrait-ratio: 1;
@mixin suggestion-panel($max-width, $max-height) {
  position: absolute !important;
  z-index: 99999 !important;
  width: fit-content;
  max-width: $max-width;
  max-height: $max-height;
  padding: 8px 12px;
  overflow-y: auto;
  background: var(--glass-60) !important;
  border: 1px solid var(--border-gray-light) !important;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg2);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  white-space: pre-line;
  color: var(--text-dark);
  font-size: 14px;
  pointer-events: auto !important;
  transition: background-color 0.2s ease;
}

/* 分区 Tab */
.region-tabs {
  display: inline-flex;
  gap: 4px;
  max-width: 250px;
  margin-bottom: 24px;
  padding: 4px;
  background-color: var(--bg-light-gray);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-inset);

  button {
    min-width: 60px;
    padding: 3px 6px;
    appearance: none;
    background: none;
    border: none;
    border-radius: var(--radius-md);
    color: var(--text-dark);
    text-align: center;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    user-select: none;
    transition: all 0.25s ease;

    &:hover {
      background-color: var(--bg-hover-light);
    }

    &.active {
      background-color: var(--color-primary);
      box-shadow:
        0 0 0 1px var(--color-primary-shadow-light),
        0 4px 12px var(--color-primary-shadow);
      color: var(--action-primary-text);
      font-weight: 600;
    }
  }
}

/* 地点即时建议 */
.inline-suggestion {
  @include suggestion-panel(100px, 20dvh);

  .success {
    color: var(--color-primary);
    font-weight: bold;
  }
}

.suggest-line {
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--bg-blue-hover);
  }
}

.success {
  padding: 4px 8px;
  color: var(--color-success-green);
  font-weight: bold;
}

/* 地点和分区输入 */
.location-input,
.region-input {
  width: 100%;
  min-width: 0;
  max-width: 250px;
  @include flex-col;
  justify-content: center;
}

.location-input {
  flex: 1;

  textarea {
    padding-right: 40px;
  }
}

.region-input {
  flex: 1.2;
}

.location-header {
  @include flex-center;
  gap: 6px;
  margin-bottom: 4px;

  label {
    color: var(--text-dark);
    font-size: 14px;
    font-weight: 600;
  }
}

.select-location-btn {
  padding: 2px 8px;
  appearance: none;
  background: var(--color-primary-light);
  border: 1px solid var(--color-primary-border2);
  border-radius: var(--radius-sm2);
  color: var(--color-primary);
  white-space: nowrap;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;

  :root[data-color-theme='dark'] & {
    color: var(--text-primary);
  }

  &:hover {
    background: var(--color-primary-light2);
    box-shadow: 0 2px 4px rgba(var(--color-primary-rgb), 0.2);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

.textarea-wrapper {
  position: relative;
  width: 100%;
}

.success-checkmark {
  position: absolute;
  top: 50%;
  right: 12px;
  color: $success;
  font-size: 20px;
  font-weight: bold;
  pointer-events: none;
  transform: translateY(-50%);
  animation: checkmark-appear 0.3s ease;
}

@keyframes checkmark-appear {
  from {
    opacity: 0;
    transform: translateY(-50%) scale(0.5);
  }

  to {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }
}

.input-row {
  width: 90%;
  max-width: 600px;
  @include flex-center;
  gap: 16px;
  margin: 1dvh auto;
}

/* 底部提示 */
.bottom-hint {
  width: min(80%, 500px);
  @include flex-col;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 0 auto 3dvh;
  padding: 6px 20px;
  background: var(--glass-50);
  border: 1px solid var(--border-gray-lighter);
  border-radius: 14px;
  box-shadow: var(--shadow-md2);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  color: var(--text-dark-alpha);
  font-size: 14px;
  user-select: none;
}

.hint-main {
  @include flex-center;

  gap: 6px;
}

.hint-num {
  padding: 0 6px;
  background: var(--color-primary-light);
  border: 1px solid var(--color-primary-border);
  border-radius: var(--radius-md);
  color: var(--color-primary);
  font-weight: 700;
}

.hint-warning {
  opacity: 0.9;
  color: var(--color-warning);
  text-align: center;
  font-size: 13px;
  line-height: 1.4;
}

.hint-preview {
  width: 100%;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 10px;
  text-align: center;
}

.preview-text {
  max-width: 520px;
  overflow: hidden;
  color: var(--text-dark-medium);
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 13px;
  line-height: 1.35;
}

.expand-btn {
  padding: 2px 10px;
  appearance: none;
  background: var(--color-primary-light);
  border: 1px solid var(--color-primary-border2);
  border-radius: var(--radius-pill);
  color: var(--color-primary);
  white-space: nowrap;
  font-size: 13px;
  cursor: pointer;
  user-select: none;

  :root[data-color-theme='dark'] & {
    color: var(--text-primary);
  }

  &:hover {
    background: var(--color-primary-light2);
  }
}

/* 地点列表弹窗 */
.locations-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.loc-chip {
  display: inline-flex;
  align-items: center;
  padding: 3px 6px;
  background: var(--glass-80);
  border: 1px solid var(--border-gray-light2);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-sm2);
  color: var(--text-dark-lightest);
  font-size: 14px;

  &.custom-chip {
    background: linear-gradient(
      135deg,
      rgba(102, 126, 234, 0.1),
      rgba(118, 75, 162, 0.1)
    );
    border-color: rgba(102, 126, 234, 0.3);
    color: $custom-purple;
  }
}

.custom-preview {
  border-top: 1px solid var(--border-gray-lightest);
}

.preview-label {
  margin-right: 6px;
  color: $custom-purple;
  font-size: 12px;
  font-weight: 600;
}

/* 分区详情按钮 */
.info-btn {
  padding: 8px;
  background: linear-gradient(
    145deg,
    var(--glass-40),
    var(--glass-20)
  );
  border: 1px solid var(--glass-60);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  @include flex-center;

  &:hover {
    background: linear-gradient(
      145deg,
      var(--glass-50),
      var(--glass-30)
    );
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.12);
    transform: scale(1.05);
  }

  .icon {
    display: inline-block;
  }
}

/* 竖屏 */
@media (max-aspect-ratio: $portrait-ratio) {
  .region-tabs {
    button {
      min-width: 50px;
      padding: 4px 2px;
    }
  }
}
</style>
