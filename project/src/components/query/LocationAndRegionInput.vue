<template>
  <div>
    <!-- ✅ 同行輸入：地點 + 分區 -->
    <div class="input-row" >

      <!-- ✅ 地點輸入框 -->
      <div class="location-input">
        <div class="location-header">
          <label for="locations">地點</label>
          <button
              class="select-location-btn"
              @click="openPartitionModalWithSelection"
              type="button"
              title="從分區選擇地點"
          >
            選擇地點
          </button>
        </div>
        <div class="textarea-wrapper">
          <textarea
              id="locations"
              ref="inputEl"
              placeholder="請輸入地點(可匹配)"
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
            <div v-if="successMessage" class="success">✅ {{ successMessage }}</div>
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
              {{ tab === 'map' ? '地圖集' : '音典' }}
            </button>
          </div>

          <!-- 新增：分区详情按钮 -->
          <button
              class="info-btn"
              @click="openPartitionInfoModal"
              title="查看分區詳情"
          >
            <span class="icon">ℹ️</span>
          </button>
        </div>

        <!-- ✅ 分區 Cascader -->
        <RegionSelector
            :mode="regionUsing"
            v-model:selected="selectedValue"
            :placeholder="regionUsing === 'map' ? '請選擇地圖集分區' : '請選擇音典分區'"
        />

      </div>

      <!-- NEW MODE: Textarea input (for CustomTab) -->
      <div v-else class="region-input-section">
        <div class="region-input-header">
          <label class="region-label">分區</label>
          <button
              class="info-btn"
              @click="openPartitionInfoModal"
              title="查看分區詳情"
          >
            <span class="icon">ℹ️</span>
          </button>
        </div>

        <div class="region-input-wrapper">
          <textarea
              ref="regionTextareaEl"
              v-model="regionInputValue"
              @input="onRegionInput"
              @blur="onRegionBlur"
              placeholder="輸入分區名稱，空格分隔（如：粵語）"
              class="textarea"
              rows="3"
          ></textarea>

          <!-- Suggestions dropdown -->
          <Teleport to="body">
            <div
                v-if="showRegionSuggestions && regionSuggestions.length > 0"
                class="suggestions-dropdown"
                :style="regionSuggestionStyle"
            >
              <div
                  v-for="(suggestion, index) in regionSuggestions"
                  :key="index"
                  class="suggestion-item"
                  @mousedown.prevent="selectRegionSuggestion(suggestion)"
              >
                <span class="suggestion-text">{{ suggestion.display }}</span>
                <span class="suggestion-source">{{ suggestion.source === 'map' ? '地圖集' : '音典' }}</span>
              </div>
            </div>
          </Teleport>
        </div>
      </div>
    </div>
    <!-- ✅ 底部提示欄：已選擇地點數 -->
    <div class="bottom-hint" >
      <div class="hint-main">
        您已選擇 <span class="hint-num">{{ totalCount }}</span> 個地點
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
          展開
        </button>
      </div>
      <!-- 🔥 自定義特徵地點預覽（僅輸入模式） -->
      <div v-if="useInputMode && customFeatureLocations.length" class="hint-preview custom-preview">
        <span class="preview-label">自定義地點：</span>
        <span class="preview-text">
          {{ customPreviewText }}
        </span>
        <button
            v-if="customFeatureLocations.length > 4"
            class="expand-btn"
            type="button"
            @click="openCustomModal"
        >
          展開
        </button>
      </div>
      <!-- ✅ 對應 showToast 的提示行 -->
      <div v-if="limitHint" class="hint-warning">
        {{ limitHint }}
      </div>
      <Teleport to="body">
        <div
            v-if="showLocationsModal"
            class="glass-overlay"
            @mousedown.self="closeModal"
        >
          <div class="glass-modal" role="dialog" aria-modal="true">
            <div class="modal-header">
              <div class="modal-title">已選擇地點（{{ locationsResult.length }}）</div>
              <button class="modal-close" type="button" @click="closeModal">×</button>
            </div>

            <div class="modal-body">
              <div class="locations-list">
            <span
                v-for="(loc, idx) in locationsResult"
                :key="loc + '_' + idx"
                class="loc-chip"
            >
              {{ loc }}
            </span>
              </div>
            </div>
          </div>
        </div>
      </Teleport>
    </div>

    <!-- 自定義地點彈窗 -->
    <Teleport to="body">
      <div
          v-if="showCustomModal"
          class="glass-overlay"
          @mousedown.self="closeCustomModal"
      >
        <div class="glass-modal" role="dialog" aria-modal="true">
          <div class="modal-header">
            <div class="modal-title">自定義地點（{{ customFeatureLocations.length }}）</div>
            <button class="modal-close" type="button" @click="closeCustomModal">×</button>
          </div>

          <div class="modal-body">
            <div class="locations-list">
            <span
                v-for="(loc, idx) in customFeatureLocations"
                :key="loc + '_' + idx"
                class="loc-chip custom-chip"
            >
              {{ loc }}
            </span>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 分区详情弹窗 -->
    <PartitionInfoModal
        v-model="showPartitionInfoModal"
        :initial-tab="regionUsing"
        :partition-data="partitionData"
        :is-loading="isLoadingPartitions"
        :error-message="partitionTreeError"
        :auto-enable-selection="autoEnableSelection"
        :initial-selected-locations="locationsInTree"
        @locations-changed="handleLocationsChanged"
        @locations-selected="handleLocationsSelected"
    />
  </div>
</template>


<script setup>
import { ref, nextTick ,onMounted, onActivated, watch, computed,defineProps } from 'vue'
import { getLocations, getCustomFeature, sqlQuery, batchMatch, getPartitions } from '@/api'
import RegionSelector from "@/components/query/RegionSelector.vue"
import PartitionInfoModal from "@/components/query/PartitionInfoModal.vue"
import { userStore, setLocationDisabled } from '@/utils/store.js'
import { LOCATION_LIMITS } from '@/config/constants.js'
import { STATIC_REGION_TREE, top_yindian } from '@/config'
import * as OpenCC from 'opencc-js'

// 创建繁简转换器
const t2s = OpenCC.Converter({ from: 'tw', to: 'cn' })  // 繁 → 简
const s2t = OpenCC.Converter({ from: 'cn', to: 'tw' })  // 简 → 繁
// const API_BASE = window.API_BASE;
// const MAP_TREE = STATIC_REGION_TREE;
// const YINDIAN_TREE = top_yindian;
// 接收外部传入的地點和分區
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
const regionSuggestions = ref([])  // Autocomplete suggestions
const showRegionSuggestions = ref(false)  // Show/hide suggestions dropdown
const regionMatchLoading = ref(false)  // Loading state for matching
const regionSuggestionStyle = ref({
  left: '0px',
  top: '0px',
  position: 'absolute',
  zIndex: 99999
})
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

// 辅助函数：同时更新 emit 和 store（向后兼容）
function updateDisabledState(isDisabled) {
  // 1. Emit to parent (backward compatible)
  emit('update:runDisabled', isDisabled)

  // 2. Update store for all pages that might use this component
  setLocationDisabled('query', isDisabled)
  setLocationDisabled('divide', isDisabled)
  // Note: custom tab doesn't use location validation
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

/* ========== Region Input Mode Logic ========== */

// Flatten tree structure to get all matchable region names
const flattenRegionTree = (tree, parentPath = []) => {
  const results = []

  for (const [key, value] of Object.entries(tree)) {
    const currentPath = [...parentPath, key]

    // Add current level
    results.push({
      name: key,
      path: currentPath.join('-'),
      display: currentPath.join('·')
    })

    if (typeof value === 'object' && !Array.isArray(value)) {
      // Recurse into nested object
      results.push(...flattenRegionTree(value, currentPath))
    } else if (Array.isArray(value)) {
      // Add array items as leaf nodes
      value.forEach(item => {
        if (item) {
          const leafPath = [...currentPath, item]
          results.push({
            name: item,
            path: leafPath.join('-'),
            display: leafPath.join('·')
          })
        }
      })
    }
  }

  return results
}

// Get flattened regions from both trees with source tagging
const getFlattenedRegions = () => {
  const results = []

  // Add map tree regions
  try {
    if (typeof STATIC_REGION_TREE !== 'undefined' && STATIC_REGION_TREE) {
      const mapRegions = flattenRegionTree(STATIC_REGION_TREE)
      mapRegions.forEach(region => {
        results.push({ ...region, source: 'map' })
      })
    }
  } catch (e) {
    console.warn('STATIC_REGION_TREE not available:', e)
  }

  // Add yindian tree regions
  const cachedTree = sessionStorage.getItem('__YINDIAN_TREE_CACHE__')
  if (cachedTree) {
    try {
      const tree = JSON.parse(cachedTree)
      const yindianRegions = flattenRegionTree(tree)
      yindianRegions.forEach(region => {
        results.push({ ...region, source: 'yindian' })
      })
    } catch (e) {
      console.error('Failed to parse yindian tree cache:', e)
    }
  }

  return results
}

// Match region input against flattened tree
const matchRegions = (input) => {
  const flatRegions = getFlattenedRegions()
  const query = input.trim().toLowerCase()

  if (!query) return []

  // ✅ 新增：创建繁简变体用于匹配
  const querySimplified = t2s(query).toLowerCase()
  const queryTraditional = s2t(query).toLowerCase()

  // Find matches - 支持繁简双向匹配
  const matches = flatRegions.filter(region => {
    const nameLower = region.name.toLowerCase()
    const pathLower = region.path.toLowerCase()

    // ✅ 检查原文、简体、繁体是否匹配
    return nameLower.includes(query) ||
           nameLower.includes(querySimplified) ||
           nameLower.includes(queryTraditional) ||
           pathLower.includes(query) ||
           pathLower.includes(querySimplified) ||
           pathLower.includes(queryTraditional)
  })

  // Limit to top 10 matches
  return matches.slice(0, 10)
}

// Debounced region input handler
let regionInputTimeout = null
const regionTextareaEl = ref(null)

const onRegionInput = () => {
  clearTimeout(regionInputTimeout)

  regionInputTimeout = setTimeout(() => {
    const lastWord = regionInputValue.value.split(/\s+/).pop()

    if (lastWord && lastWord.length > 0) {
      regionMatchLoading.value = true
      const matches = matchRegions(lastWord)
      regionSuggestions.value = matches
      showRegionSuggestions.value = matches.length > 0
      regionMatchLoading.value = false

      // Update suggestion position
      if (matches.length > 0) {
        nextTick(() => {
          const el = regionTextareaEl.value
          if (el) {
            const rect = el.getBoundingClientRect()
            regionSuggestionStyle.value = {
              position: 'absolute',
              left: `${rect.left + window.scrollX}px`,
              top: `${rect.top + rect.height + 6 + window.scrollY}px`,
              zIndex: 99999,
              minWidth: `${el.offsetWidth}px`
            }
          }
        })
      }
    } else {
      showRegionSuggestions.value = false
    }
  }, 200)
}

const onRegionBlur = () => {
  setTimeout(() => {
    showRegionSuggestions.value = false
  }, 200)
}

// Select a suggestion and auto-detect region mode
const selectRegionSuggestion = (suggestion) => {
  const words = regionInputValue.value.split(/\s+/)
  // Only insert the leaf level name, not the full path
  words[words.length - 1] = suggestion.name
  regionInputValue.value = words.join(' ')
  showRegionSuggestions.value = false

  // Auto-detect and update regionUsing based on suggestion source
  if (suggestion.source) {
    regionUsing.value = suggestion.source
  }
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
    const CACHE_KEY = '__YINDIAN_TREE_CACHE__'
// ✅ 真正的 filter，不轉格式，只刪除 key
    const filterTopLevelKeys = (obj) => {
      if (typeof obj !== 'object' || Array.isArray(obj) || obj === null) {
        console.warn('[Yindian Tree] Expected tree to be object, got:', typeof obj)
        return {}
      }
      const filtered = {}
      for (const key of top_yindian) {
        if (obj.hasOwnProperty(key)) {
          filtered[key] = obj[key]
        }
      }
      return filtered
    }
    if (!sessionStorage.getItem(CACHE_KEY)) {
      getPartitions()
          .then(tree => {
            const filteredTree = filterTopLevelKeys(tree)
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(filteredTree))
            options.value = convertToCascaderOptions(filteredTree)
          })
    } else {
      const cachedTree = JSON.parse(sessionStorage.getItem(CACHE_KEY))
      const filteredTree = filterTopLevelKeys(cachedTree)
      options.value = convertToCascaderOptions(filteredTree)
    }

  }
}
// 初始加載
loadTreeFor(regionUsing.value)

// ✅ 新增：预加载音典分区数据到缓存，确保输入模式可以匹配所有分区
const preloadYindianTree = async () => {
  const CACHE_KEY = '__YINDIAN_TREE_CACHE__'
  if (!sessionStorage.getItem(CACHE_KEY)) {
    try {
      const tree = await getPartitions()

      // 过滤顶级分区
      const filterTopLevelKeys = (obj) => {
        if (typeof obj !== 'object' || Array.isArray(obj) || obj === null) {
          return {}
        }
        const filtered = {}
        for (const key of top_yindian) {
          if (obj.hasOwnProperty(key)) {
            filtered[key] = obj[key]
          }
        }
        return filtered
      }

      const filteredTree = filterTopLevelKeys(tree)
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(filteredTree))
      console.log('✅ 音典分区数据已预加载到缓存')
    } catch (error) {
      console.warn('⚠️ 预加载音典分区失败:', error)
    }
  }
}

// 预加载音典数据（异步，不阻塞页面）
preloadYindianTree()

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

  // 3️⃣ 若兩者皆空，直接返回（對齊 isEmptyInput 判斷）
  if (locations.length === 0 && regions.length === 0) {
    limitHint.value = '請輸入地點或分區'
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
    const data = await getLocations({
      locations,
      regions,
      region_mode: regionUsing.value
    })

    // ✅ 存列表（用於預覽與彈層）
    locationsResult.value = Array.isArray(data?.locations_result) ? data.locations_result : []
    // 6️⃣ 核心結果：locations_result
    const count = data?.locations_result?.length ?? 0
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

    // ✅ 若你後面還有「正常處理」，從這裡往下接

    // 🔥 如果是輸入模式，額外調用 get_custom_feature
    if (props.useInputMode) {
      await fetchCustomFeatureLocations(locations, regions)
    }

    return data

  } catch (err) {
    console.error('❌ 請求錯誤:', err)
    limitHint.value = err.message || '地點查詢失敗，請稍後再試'
    selectedCount.value = null
    locationsResult.value = []
    customFeatureLocations.value = []
    updateDisabledState(true)  // ⭐ 錯誤時禁用按鈕
  }
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

watch(
    [inputValue, selectedValue, regionUsing, regionInputValue],
    ([newInput, newSelected, newMode, newRegionInput]) => {
      // 1. 立即通知父組件更新數據 (實現雙向綁定)
      const locationsArr = (newInput ?? '').trim().split(/\s+/).filter(Boolean)

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
      emit('update:modelValue', {
        locations: locationsArr,
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
    // 尝试从 sessionStorage 读取缓存
    const cachedData = sessionStorage.getItem('partition_data_cache')
    if (cachedData) {
      partitionData.value = JSON.parse(cachedData)
      isLoadingPartitions.value = false
      return
    }

    // 缓存不存在，从 API 获取
    const response = await sqlQuery({
      db_key: 'query',
      table_name: 'dialects',
      page: 1,
      page_size: 9999,
      sort_by: null,
      sort_desc: false,
      filters: {},
      search_text: '',
      search_columns: []
    })

    partitionData.value = response.data || []

    // 保存到 sessionStorage
    sessionStorage.setItem('partition_data_cache', JSON.stringify(partitionData.value))
  } catch (error) {
    console.error('获取分区数据失败:', error)
    partitionTreeError.value = '獲取分區數據失敗，請稍後再試'
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
  selectedValue,
  regionUsing,
  selectedCount,
  limitHint,
  locationsResult
})

</script>


<style scoped>

.region-tabs {
  display: inline-flex;
  border-radius: 16px;
  padding: 4px;
  box-shadow: var(--shadow-inset);
  margin-bottom: 24px;
  gap: 4px;
  border: 1px solid var(--border-medium);
  background-color: var(--bg-light-gray);
  max-width: 250px;
}

.region-tabs button {
  appearance: none;
  background: none;
  border: none;
  padding: 3px 6px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.25s ease;
  color: var(--text-dark);
  min-width: 60px;
  text-align: center;
  user-select: none;
}

.region-tabs button:hover {
  background-color: var(--bg-hover-light);
}

.region-tabs button.active {
  background-color: var(--color-primary); /* Apple Blue */
  color: white;
  font-weight: 600;
  box-shadow:
      0 0 0 1px var(--color-primary-shadow-light),
      0 4px 12px var(--color-primary-shadow);
}

/* 即時提示面板 */
.inline-suggestion {
  position: absolute !important;
  background: var(--glass-medium2) !important; /* 🔹 半透明背景 */
  border: 1px solid var(--border-gray-light) !important;
  box-shadow: var(--shadow-lg2);
  padding: 8px 12px;
  border-radius: 12px; /* 蘋果味更重一點 */
  backdrop-filter: blur(12px); /* 🔹 液態玻璃效果 */
  -webkit-backdrop-filter: blur(12px); /* for Safari */
  white-space: pre-line;
  font-size: 14px;
  color: var(--text-dark);
  max-width: 100px;
  width: fit-content; /* ✅ 根據內容自動撐寬 */
  z-index: 99999 !important;
  pointer-events: auto !important;
  max-height: 20dvh;
  overflow-y: auto;
  transition: background-color 0.2s ease;
}

/* ✅ 成功訊息 */
.inline-suggestion .success {
  color: var(--color-primary);
  font-weight: bold;
}

/* ✅ 錯誤訊息 */
.inline-suggestion .error {
  color: var(--color-error-light);
  font-weight: bold;
}

/* ✅ 建議項目 */
.suggest-line {
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

/* ✅ Hover：蘋果淺藍 */
.suggest-line:hover {
  background-color: var(--bg-blue-hover);
}


.success {
  color: var(--color-success-green);
  padding: 4px 8px;
  font-weight: bold;
}

.location-input,
.region-input {
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 250px;
  min-width: 0;
  width: 100%;
}
.location-input{
  flex: 1;
}
.region-input{
  flex: 1.2;
}

/* Location header with label and button */
.location-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  gap:6px;
}

.location-header label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-dark);
}

/* 選擇地點按鈕 */
.select-location-btn {
  appearance: none;
  border: 1px solid var(--color-primary-border2);
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  transition: all 0.2s ease;
  font-weight: 500;
}

.select-location-btn:hover {
  background: var(--color-primary-light2);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 122, 255, 0.2);
}

.select-location-btn:active {
  transform: translateY(0);
}

/* Textarea wrapper for checkmark positioning */
.textarea-wrapper {
  position: relative;
  width: 100%;
}

.success-checkmark {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  font-weight: bold;
  color: #52c41a;
  pointer-events: none;
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

/* Add right padding to textarea to prevent text overlap */
.location-input textarea {
  padding-right: 40px;
}

.input-row {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: center; /* 居中子元素內容 */
  max-width: 600px;        /* 限定總寬度 */
  margin: 1dvh  auto 1dvh auto ;          /* 水平置中 */
  width: 90%;
}

.bottom-hint {
  margin:  0 1dvw 3dvh  ;
  max-width: 500px;
  min-width: 80%;
  padding: 6px 20px;
  justify-self: center;
  /* liquid glass */
  background: var(--glass-lighter2);
  border: 1px solid var(--border-gray-lighter);
  border-radius: 14px;
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  box-shadow: var(--shadow-md2);

  font-size: 14px;
  color: var(--text-dark-alpha);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
  user-select: none;
}

.hint-num {
  font-weight: 700;
  color: var(--color-primary);
  padding: 0 6px;
  border-radius: 10px;
  background: var(--color-primary-light);
  border: 1px solid var(--color-primary-border);
}
.hint-main {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* ⚠️ 限制提示：比主文案弱一級，但足夠醒目 */
.hint-warning {
  font-size: 13px;
  color: var(--color-warning);
  text-align: center;
  line-height: 1.4;
  opacity: 0.9;
}
/* 預覽行：深灰色，與主文案分層 */
.hint-preview {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 10px;
  text-align: center;
}

.preview-text {
  color: var(--text-dark-medium);
  font-size: 13px;
  line-height: 1.35;
  max-width: 520px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 展開按鈕：克制的蘋果藍 */
.expand-btn {
  appearance: none;
  border: 1px solid var(--color-primary-border2);
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 13px;
  padding: 2px 10px;
  border-radius: 999px;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.expand-btn:hover {
  background: var(--color-primary-light2);
}

/* 全局遮罩 + 玻璃彈層 */
.glass-overlay {
  position: fixed;
  inset: 0;
  z-index: 20000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 18px;
  background: var(--border-medium);
  backdrop-filter: blur(7px);
  -webkit-backdrop-filter: blur(6px);
}

.glass-modal {
  width: min(720px, 94vw);
  max-height: min(70vh, 640px);
  overflow: hidden;
  background: var(--glass-lighter2);
  border: 1px solid var(--border-gray-lighter);
  border-radius: 18px;
  box-shadow: var(--shadow-xl);

  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-gray-lightest);
}

.modal-title {
  font-size: 15px;
  font-weight: 650;
  color: var(--text-dark-light);
}

.modal-close {
  appearance: none;
  border: none;
  background: var(--bg-hover-medium);
  width: 28px;
  height: 28px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 18px;
  line-height: 28px;
  color: var(--text-dark-lighter);
}

.modal-close:hover {
  background: var(--bg-hover-strong);
}

.modal-body {
  padding: 12px 14px 16px;
  overflow: auto;
  max-height: calc(min(70vh, 640px) - 100px);
}

.locations-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.loc-chip {
  display: inline-flex;
  align-items: center;
  padding: 3px 6px;
  border-radius: 999px;
  font-size: 14px;
  color: var(--text-dark-lightest);
  background: var(--glass-lighter3);
  border: 1px solid var(--border-gray-light2);
  box-shadow: var(--shadow-sm2);
}

.custom-chip {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border: 1px solid rgba(102, 126, 234, 0.3);
  color: #667eea;
}

.custom-preview {
  border-top: 1px solid var(--border-gray-lightest);
}

.preview-label {
  font-size: 12px;
  font-weight: 600;
  color: #667eea;
  margin-right: 6px;
}

/* =====================================
   分区详情按钮
   ===================================== */

.info-btn {
  padding: 8px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.2));
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-btn:hover {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.3));
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.12);
  transform: scale(1.05);
}

.info-btn .icon {
  display: inline-block;
}

/* =====================================
   Region Input Mode Styles
   ===================================== */

.region-input-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.region-input-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.region-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.region-input-wrapper {
  position: relative;
  flex: 1;
}

/* Suggestions dropdown for region input */
.suggestions-dropdown {
  position: absolute !important;
  background: var(--glass-medium2) !important;
  border: 1px solid var(--border-gray-light) !important;
  box-shadow: var(--shadow-lg2);
  padding: 8px 12px;
  border-radius: 12px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  white-space: pre-line;
  font-size: 14px;
  color: var(--text-dark);
  max-width: 400px;
  width: fit-content;
  z-index: 99999 !important;
  pointer-events: auto !important;
  max-height: 30dvh;
  overflow-y: auto;
  transition: background-color 0.2s ease;
}

.suggestion-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s ease;
  gap: 6px;
}

.suggestion-item:hover {
  background-color: var(--bg-blue-hover);
}

.suggestion-text {
  flex: 1;
  font-size: 14px;
  color: var(--text-dark);
}

.suggestion-source {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0, 122, 255, 0.1);
  color: #007aff;
  margin-left: 8px;
  white-space: nowrap;
  font-weight: 600;
}


</style>
