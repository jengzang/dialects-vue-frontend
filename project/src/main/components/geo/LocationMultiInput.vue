<template>
  <div class="location-multi-input">
    <div class="input-section">
      <div class="input-header">
        <div class="header-left">
          <label for="location-input">{{ $t('query.components.locationMultiInput.label') }}</label>
          <button
              class="select-location-btn"
              @click="openPartitionModalWithSelection"
              type="button"
              :title="$t('query.components.locationMultiInput.selectButtonTitle')"
          >
            {{ $t('query.components.locationMultiInput.selectButton') }}
          </button>
        </div>
        <div v-if="matchedLocations.length" class="locations-inline">
          <span class="count-inline">{{ $t('query.components.locationMultiInput.locationCount', { count: matchedLocations.length }) }}</span>
          <span class="preview-inline">{{ previewText }}</span>
          <button
            v-if="matchedLocations.length > 3"
            class="expand-btn-inline"
            @click="showModal = true"
            type="button"
          >
            {{ $t('query.components.locationMultiInput.expandButton') }}
          </button>
        </div>
      </div>
      <div v-if="warningMessage" class="warning-message">
        ⚠️ {{ warningMessage }}
      </div>
      <textarea
        id="location-input"
        ref="inputEl"
        v-model="inputValue"
        @keyup="onKeyup"
        @blur="onBlur"
        :placeholder="$t('query.components.locationMultiInput.placeholder')"
        rows="3"
      ></textarea>
      <span v-if="showSuccessCheckmark" class="success-checkmark">✓</span>

      <!-- 建議下拉框 -->
      <Teleport to="body">
        <div
          v-if="suggestions.length || successMessage"
          ref="suggestionEl"
          class="suggestions-dropdown"
          :style="suggestionStyle"
        >
          <div v-if="successMessage" class="success-message">
            ✅ {{ successMessage }}
          </div>
          <div
            v-for="item in suggestions"
            :key="item"
            class="suggestion-item"
            @mousedown.prevent="applySuggestion(item)"
          >
            {{ item }}
          </div>
        </div>
      </Teleport>
    </div>

    <!-- 地点详情弹窗 -->
    <AppModal
      v-model="showModal"
      size="sm"
      :title="$t('query.components.locationMultiInput.modalTitle', { count: matchedLocations.length })"
      :close-label="$t('common.button.close')"
    >
      <div class="locations-list">
        <span
          v-for="(loc, idx) in matchedLocations"
          :key="idx"
          class="location-chip"
        >
          {{ loc }}
        </span>
      </div>
    </AppModal>

    <!-- 分区详情弹窗 -->
    <PartitionInfoModal
        v-model="showPartitionInfoModal"
        :data-state="{ partitionData, isLoading: isLoadingPartitions, errorMessage: partitionTreeError }"
        :selection-state="{ initialTab: 'map', autoEnableSelection, initialSelectedLocations: locationsInTree, maxSelection: props.maxLocations === Infinity ? null : props.maxLocations }"
        @locations-changed="handleLocationsChanged"
        @locations-selected="handleLocationsSelected"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { getLocations, batchMatch, getLocationPartitions } from '@/api/index.js'
import AppModal from '@/components/common/AppModal.vue'
import PartitionInfoModal from '@/main/components/geo/PartitionInfoModal.vue'
import { usePartitionCache } from '@/composables/domain/usePartitionCache.js'

const { t } = useI18n()
const { getPartitionData } = usePartitionCache()

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  maxLocations: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits(['update:modelValue', 'update:matchedLocations', 'update:isMatching'])

const inputEl = ref(null)
const suggestionEl = ref(null)
const inputValue = ref('')
const suggestions = ref([])
const successMessage = ref('')
const showSuccessCheckmark = ref(false)
const matchedLocations = ref([])
const showModal = ref(false)
const warningMessage = ref('')
const isMatching = ref(false) // 添加匹配中的状态
const suggestionStyle = ref({
  left: '0px',
  top: '0px',
  position: 'absolute',
  zIndex: 99999
})

let debounceTimer = null
let fetchDebounceTimer = null

// 预览文本（前3个地点）
const previewText = computed(() => {
  if (!matchedLocations.value.length) return ''
  const first3 = matchedLocations.value.slice(0, 3).join('、')
  return matchedLocations.value.length > 3 ? `${first3}…` : first3
})

// 解析输入值为查询字符串数组
const queryStrings = computed(() => {
  return inputValue.value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
})

// 监听输入值变化，通知父组件
watch(queryStrings, (newQueries) => {
  emit('update:modelValue', newQueries)

  // 防抖调用验证 API
  clearTimeout(fetchDebounceTimer)
  fetchDebounceTimer = setTimeout(() => {
    fetchMatchedLocations(newQueries)
  }, 300)
})

// 监听外部传入的值
watch(() => props.modelValue, (newVal) => {
  if (Array.isArray(newVal)) {
    const currentQueries = queryStrings.value
    if (JSON.stringify(currentQueries) !== JSON.stringify(newVal)) {
      inputValue.value = newVal.join(' ')
    }
  }
}, { immediate: true })

// 获取当前光标位置的查询词
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

// 键盘输入事件
function onKeyup() {
  showSuccessCheckmark.value = false
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchSuggestion, 200)
}

// 失焦事件
function onBlur() {
  setTimeout(() => {
    suggestions.value = []
    successMessage.value = ''
    showSuccessCheckmark.value = false
  }, 200)
}

// 获取建议
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
          minWidth: `${el.offsetWidth}px`
        }
      })
    })
    .catch(err => {
      console.error(t('query.components.locationMultiInput.errorFetchSuggestions'), err)
    })
}

// 应用建议
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

// 调用 /api/get_locs/ 获取实际匹配的地点列表
async function fetchMatchedLocations(queries) {
  if (!queries.length) {
    matchedLocations.value = []
    warningMessage.value = ''
    isMatching.value = false
    emit('update:matchedLocations', [])
    emit('update:isMatching', false)
    return
  }

  isMatching.value = true
  emit('update:isMatching', true)

  try {
    const data = await getLocations({ locations: queries })

    // 对返回的地点列表去重
    const locations = Array.isArray(data?.locations_result) ? data.locations_result : []
    const uniqueLocations = [...new Set(locations)]

    // 检查是否超过最大限制
    if (uniqueLocations.length > props.maxLocations) {
      warningMessage.value = t('query.components.locationMultiInput.warningMaxLocations', {
        total: uniqueLocations.length,
        max: props.maxLocations
      })
      matchedLocations.value = uniqueLocations.slice(0, props.maxLocations)
    } else {
      warningMessage.value = ''
      matchedLocations.value = uniqueLocations
    }

    emit('update:matchedLocations', matchedLocations.value)
  } catch (err) {
    console.error(t('query.components.locationMultiInput.errorFetchLocations'), err)
    matchedLocations.value = []
    warningMessage.value = ''
    emit('update:matchedLocations', [])
  } finally {
    isMatching.value = false
    emit('update:isMatching', false)
  }
}

// =====================================
// 分区详情相关状态和函数
// =====================================

const showPartitionInfoModal = ref(false)
const partitionData = ref([])
const isLoadingPartitions = ref(false)
const partitionTreeError = ref('')
const autoEnableSelection = ref(false)
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

// 打开弹窗并自动启用选择模式
const openPartitionModalWithSelection = () => {
  autoEnableSelection.value = true
  originalInputValue.value = inputValue.value  // Store original for revert
  showPartitionInfoModal.value = true

  // 如果数据未加载，则在后台加载
  if (partitionData.value.length === 0) {
    fetchPartitionData()
  }
}

// 获取分区数据（使用 sessionStorage 缓存）
const fetchPartitionData = async () => {
  isLoadingPartitions.value = true
  partitionTreeError.value = ''

  try {
    partitionData.value = await getPartitionData(() => getLocationPartitions())
  } catch (error) {
    console.error(t('query.components.locationMultiInput.errorFetchPartitions'), error)
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
    // 触发验证
    const queries = queryStrings.value
    fetchMatchedLocations(queries)
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
</script>

```scss
<style scoped lang="scss">
$warning-orange: var(--color-warning);
$portrait-ratio: 1 / 1;.location-multi-input {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* 输入区域 */
.input-section {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    flex-shrink: 0;
    color: var(--text-dark);
    font-size: 14px;
    font-weight: 600;
  }

  textarea {
    width: 100%;
    padding: 12px 40px 12px 14px;
    resize: vertical;
    background: var(--glass-60);
    border: 1px solid var(--border-gray-light);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    color: var(--text-dark);
    font-family: inherit;
    font-size: 14px;
    transition: all 0.3s ease;

    @include glass-blur(12px);

    &:focus {
      background: var(--glass-70);
      border-color: var(--color-primary);
      outline: none;
      box-shadow:
        0 0 0 3px var(--color-primary-light),
        var(--shadow-md);
    }

    &::placeholder {
      color: var(--text-secondary);
    }
  }
}

.input-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
  gap: 10px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 选择地点按钮 */
.select-location-btn {
  padding: 2px 8px;
  appearance: none;
  background: var(--color-primary-light);
  border: 1px solid var(--color-primary-border2);
  border-radius: 8px;
  color: var(--color-primary);
  white-space: nowrap;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-primary-light2);
    box-shadow: 0 2px 4px rgba(var(--color-primary-rgb), 0.2);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

/* 已匹配地点预览 */
.locations-inline {
  min-width: 0;
  max-width: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.count-inline {
  flex-shrink: 0;
  padding: 2px 8px;
  background: var(--color-primary-light);
  border: 1px solid var(--color-primary-border);
  border-radius: 999px;
  color: var(--color-primary);
  white-space: nowrap;
  font-size: 12px;
  font-weight: 600;
}

.preview-inline {
  min-width: 0;
  @include text-truncate;
  color: var(--text-dark-medium);
  font-size: 13px;
}

.expand-btn-inline {
  flex-shrink: 0;
  padding: 2px 10px;
  background: var(--color-primary-light);
  border: 1px solid var(--color-primary-border2);
  border-radius: 999px;
  color: var(--color-primary);
  white-space: nowrap;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-primary-light2);
  }
}

/* 警告信息 */
.warning-message {
  padding: 8px 12px;
  background: rgba(var(--color-warning-rgb), 0.1);
  border-left: 3px solid $warning-orange;
  border-radius: var(--radius-sm);
  color: $warning-orange;
  font-size: 13px;
  font-weight: 500;
}

/* 匹配成功标记 */
.success-checkmark {
  position: absolute;
  top: 50%;
  right: 12px;
  color: var(--color-success);
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

/* 建议下拉框 */
.suggestions-dropdown {
  position: absolute !important;
  z-index: 99999 !important;
  max-height: 30vh;
  padding: 8px;
  overflow-y: auto;
  background: var(--glass-60);
  border: 1px solid var(--border-gray-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg2);

  @include glass-blur(16px);
}

.success-message {
  padding: 6px 8px;
  color: var(--color-success);
  font-size: 13px;
  font-weight: 600;
}

.suggestion-item {
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  color: var(--text-dark);
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: var(--bg-blue-hover);
  }
}

/* 地点详情列表 */
.locations-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.location-chip {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  background: var(--glass-80);
  border: 1px solid var(--border-gray-light2);
  border-radius: 999px;
  box-shadow: var(--shadow-sm2);
  color: var(--text-dark-lightest);
  font-size: 14px;
}

/* 竖屏 */
@media (max-aspect-ratio: $portrait-ratio) {
  .input-section {
    textarea {
      font-size: 14px;
    }
  }

  .input-header {
    align-items: center;
    gap: 6px;
  }

  .locations-inline {
    width: 100%;
    max-width: 180px;
    gap: 1px;
  }

  .preview-inline {
    font-size: 12px;
  }

  .count-inline {
    padding: 2px;
    font-size: 11px;
  }

  .expand-btn-inline {
    padding: 2px 8px;
    font-size: 10px;
  }

  .locations-list {
    gap: 6px;
  }

  .location-chip {
    padding: 4px 8px;
    font-size: 13px;
  }
}
</style>
```
