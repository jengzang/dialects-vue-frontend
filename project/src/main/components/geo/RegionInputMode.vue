<template>
  <!-- NEW MODE: Textarea input (for CustomTab) -->
  <div class="region-input-section">
    <div class="region-input-header">
      <label class="region-label">{{ $t('query.components.locationAndRegionInput.partitionLabel') }}</label>
      <button
          class="info-btn"
          @click="emit('openPartitionInfo')"
          :title="$t('query.components.locationAndRegionInput.viewPartitionDetails')"
      >
        <span class="icon"><InlineIcon icon="ℹ️" /></span>
      </button>
    </div>

    <div class="region-input-wrapper">
      <textarea
          ref="regionTextareaEl"
          v-model="regionInputValue"
          @input="onRegionInput"
          @blur="onRegionBlur"
          :placeholder="$t('query.components.locationAndRegionInput.partitionPlaceholder')"
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
            <span class="suggestion-source">{{ suggestion.source === 'map' ? $t('query.components.locationAndRegionInput.mapSource') : $t('query.components.locationAndRegionInput.yindianSource') }}</span>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import InlineIcon from '@/components/common/InlineIcon.vue'
import { ref, nextTick, computed } from 'vue'
import { getPartitions } from '@/api/index.js'
import * as OpenCCT2CN from 'opencc-js/t2cn'
import * as OpenCCCN2T from 'opencc-js/cn2t'
import { STATIC_REGION_TREE, top_yindian } from '@/main/config/RegionTree.js'
import { usePartitionCache } from '@/composables/data/usePartitionCache.js'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  regionUsing: {
    type: String,
    default: 'map'
  }
})

const emit = defineEmits([
  'update:modelValue',
  'update:regionUsing',
  'openPartitionInfo'
])

const { getCachedYindianTree, getYindianTree } = usePartitionCache()

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

// 创建繁简转换器
const t2s = OpenCCT2CN.Converter({ from: 'tw', to: 'cn' })
const s2t = OpenCCCN2T.Converter({ from: 'cn', to: 'tw' })

// Region input mode state
const regionInputValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
const regionUsing = computed({
  get: () => props.regionUsing,
  set: (value) => emit('update:regionUsing', value)
})
const regionSuggestions = ref([])  // Autocomplete suggestions
const showRegionSuggestions = ref(false)  // Show/hide suggestions dropdown
const regionMatchLoading = ref(false)  // Loading state for matching
const regionSuggestionStyle = ref({
  left: '0px',
  top: '0px',
  position: 'absolute',
  zIndex: 99999
})

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
  const cachedTree = getCachedYindianTree()
  if (cachedTree) {
    try {
      const tree = cachedTree
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

// ✅ 新增：预加载音典分区数据到缓存，确保输入模式可以匹配所有分区
const preloadYindianTree = async () => {
  if (!getCachedYindianTree()) {
    try {
      await getYindianTree(() => getPartitions(), {
        transform: filterYindianTopLevelKeys,
      })
      console.log('✅ 音典分区数据已预加载到缓存')
    } catch (error) {
      console.warn('⚠️ 预加载音典分区失败:', error)
    }
  }
}

// 预加载音典数据（异步，不阻塞页面）
preloadYindianTree()
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$primary: var(--color-primary);

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

/* 分区输入模式 */
.region-input-section {
  flex: 1;
  @include flex-col;
  gap: 1px;
}

.region-input-header {
  @include flex-center;

  gap: 8px;
}

.region-label {
  color: var(--text-dark);
  font-size: 14px;
  font-weight: 600;
}

.region-input-wrapper {
  position: relative;
  flex: 1;
}

.suggestions-dropdown {
  @include suggestion-panel(400px, 30dvh);
}

.suggestion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--bg-blue-hover);
  }
}

.suggestion-text {
  flex: 1;
  color: var(--text-dark);
  font-size: 14px;
}

.suggestion-source {
  margin-left: 8px;
  padding: 2px 6px;
  background: rgba(var(--color-primary-rgb), 0.1);
  border-radius: var(--radius-xs);
  color: $primary;
  white-space: nowrap;
  font-size: 11px;
  font-weight: 600;
}
</style>
