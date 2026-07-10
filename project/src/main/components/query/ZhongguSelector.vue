<template>
  <div class="query-result-box glass-card">

    <div v-if="hasSelection" class="info-header">
      <div class="info-text">
        <span class="info-icon">ℹ️</span>
        <span>
          {{ $t('query.components.zhongguSelector.possibleCombinations', { count: combinations.length }) }}
          <span v-if="!loading && results.length >= 0" class="fade-in">
          {{ $t('query.components.zhongguSelector.actualMatches', { count: results.length }) }}
          </span>{{ $t('query.components.zhongguSelector.outputFormat', { format: selectedCard }) }}
          </span>
      </div>

      <button
          v-if="!loading && results.length > 0"
          class="global-expand-btn"
          @click="isModalOpen = true"
      >
        {{ $t('query.components.zhongguSelector.detailsButton') }}
      </button>
    </div>

    <div v-if="limitHint" class="limit-warning">
      ⚠️ {{ limitHint }}
    </div>

    <div v-if="loading" class="status-msg loading">
      <span class="ui-loading--inline" aria-hidden="true">↻</span> {{ $t('query.components.zhongguSelector.querying') }}
    </div>

    <div v-else-if="!results || results.length === 0" class="status-msg empty">
      {{ hasSelection ? $t('query.components.zhongguSelector.noMatches') : $t('query.components.zhongguSelector.pleaseSelect') }}
    </div>

    <div v-else class="compact-grid">
      <div v-for="item in results" :key="item.query" class="compact-item">
        <span class="compact-title">{{ formatTitle(item.query) }}</span>
        <span class="compact-count">({{ item['char_count'] }})</span>
        <span class="compact-preview">
          {{ (item['chars'] || []).slice(0, 8).join('') }}{{ (item['chars'] || []).length > 8 ? '...' : '' }}
        </span>
      </div>
    </div>
  </div>

  <ZhongguDetailsPopup
    :visible="isModalOpen"
    :results="results"
    :format-title="formatTitle"
    @close="isModalOpen = false"
  />
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getCharList } from '@/api'
import ZhongguDetailsPopup from '@/main/components/query/popups/ZhongguDetailsPopup.vue'
import { userStore, setTabContentDisabled } from '@/main/store/store.js'
import { ROLE_LIMITS, QUERY_CONFIG } from '@/main/config/constants.js'

const { t } = useI18n()

// 定义事件，用于通知父组件禁用/启用按钮
const emit = defineEmits(['update:runDisabled'])

// 辅助函数：同时更新 emit 和 store（向后兼容）
function updateDisabledState(isDisabled) {
  // 1. Emit to parent (backward compatible)
  emit('update:runDisabled', isDisabled)

  // 2. Update store for tab2 (中古查询)
  setTabContentDisabled('query', 'tab2', isDisabled)
}

const props = defineProps({
  activeKeys: { type: Array, default: () => [] },
  valueMap: { type: Object, default: () => ({}) },
  isDropdownOpen: { type: Boolean, default: false },
  selectedCard: { type: String, default: '結果' },
  excludeColumns: { type: Array, default: () => [] },  // ✨ 新增
  tableName: { type: String, default: 'characters' },
  pathStrings: { type: Array, default: null }
})

const loading = ref(false)
const results = ref([])
const pendingQuery = ref(false)
const limitHint = ref('') // 🔴 用于存储错误提示
let debounceTimer = null

// ✅ 新增：控制全屏弹窗开关
const isModalOpen = ref(false)

// ✅ 直接使用 userStore.role（响应式），无需轮询
// userStore.role 会在 auth.js 的 getUserRole() 中自动更新

// 1. 计算逻辑 (保持不变)
const combinations = computed(() => {
  if (props.pathStrings !== null) return props.pathStrings

  const validEntries = props.activeKeys
      .map(key => ({ key, values: props.valueMap[key] }))
      .filter(e => e.values && e.values.length > 0)

  if (validEntries.length === 0) return []

  return validEntries.reduce((acc, entry) => {
    const next = []
    acc.forEach(path => {
      entry.values.forEach(val => {
        next.push(path + `[${val}]{${entry.key}}`)
      })
    })
    return next
  }, [''])
})

const hasSelection = computed(() => {
  if (props.pathStrings !== null) return props.pathStrings.length > 0
  return combinations.value.length > 0 && combinations.value[0] !== ''
})

// 2. Watch 逻辑 (🔴 修改：加入前置拦截)
watch(combinations, (newVal, oldVal) => {
  if (JSON.stringify(newVal) === JSON.stringify(oldVal)) return
  if (debounceTimer) clearTimeout(debounceTimer)
  pendingQuery.value = false

  // 重置状态
  limitHint.value = ''

  if (!hasSelection.value) {
    results.value = []
    return
  }

  // ✅ 使用 constants 中的限制值
  const count = newVal.length
  const limits = ROLE_LIMITS[userStore.role] || ROLE_LIMITS.anonymous

  // 检查组合数是否超限
  if (count > limits.MAX_COMBINATIONS) {
    limitHint.value = t('query.components.zhongguSelector.tooManyCombinations', { count, limit: limits.MAX_COMBINATIONS })
    results.value = [] // 清空旧数据
    return // ⛔️ 终止，不发起 API 请求
  }

  debounceTimer = setTimeout(() => {
    if (!props.isDropdownOpen) {
      fetchData(newVal)
    } else {
      pendingQuery.value = true
    }
  }, QUERY_CONFIG.DEBOUNCE_DELAY)  // ✅ 使用 constants 中的防抖延迟
})

watch(() => props.isDropdownOpen, (isOpen) => {
  if (!isOpen && pendingQuery.value) {
    fetchData(combinations.value)
    pendingQuery.value = false
  }
})

// ✨ 监听 excludeColumns 变化，重新调用 API
watch(() => props.excludeColumns, (newVal, oldVal) => {

  // 只有在有选择的情况下才触发
  if (!hasSelection.value) return
  // console.log("watch1")
  // // 比较新旧值，避免不必要的请求
  // if (JSON.stringify(newVal) === JSON.stringify(oldVal)) return
  // console.log("watch2")
  // 防抖处理
  if (debounceTimer) clearTimeout(debounceTimer)

  // ✨ 过滤器变化时立即触发，不受 isDropdownOpen 影响
  debounceTimer = setTimeout(() => {
    if (!props.isDropdownOpen) {
      fetchData(combinations.value)
    } else {
      pendingQuery.value = true  // 等待下拉框关闭
    }
  }, QUERY_CONFIG.DEBOUNCE_DELAY)
}, { deep: true })

// 3. API 请求逻辑 (🔴 修改：加入后置拦截)
async function fetchData(pathStrings) {
  loading.value = true
  limitHint.value = ''
  results.value = []

  // ✅ 在 API 请求开始时禁用按钮
  updateDisabledState(true)

  try {
    const data = await getCharList({
      path_strings: pathStrings,
      combine_query: false,
      exclude_columns: props.excludeColumns,
      table_name: props.tableName
    })
    results.value = Array.isArray(data) ? data : []

    // 🔴 校验结果数量限制
    validateResultLimit(results.value.length)

  } catch (e) {
    console.error('Fetch error:', e)
    limitHint.value = t('query.components.zhongguSelector.queryFailed')
    results.value = []
    // ✅ 请求失败时保持按钮禁用状态（因为没有有效的charlist数据）
    updateDisabledState(true)
  } finally {
    loading.value = false
  }
}

// ✅ 结果数量校验逻辑（使用 constants 配置）
function validateResultLimit(count) {
  const limits = ROLE_LIMITS[userStore.role] || ROLE_LIMITS.anonymous

  if (count > limits.MAX_RESULTS) {
    const hint = userStore.role === 'anonymous'
      ? `查詢結果過多(${count}>${limits.MAX_RESULTS})，登錄可查詢更多組合`
      : `查詢結果過多(${count}>${limits.MAX_RESULTS})，請減少組合`

    limitHint.value = hint
    updateDisabledState(true)
  } else {
    // 通过检查
    limitHint.value = ''
    updateDisabledState(false)
  }
}

// 辅助函数 (保持不变)
function formatTitle(queryStr) {
  if (!queryStr) return '';
  const matches = [...queryStr.matchAll(/\[(.*?)]\{(.*?)\}/g)];
  if (matches.length > 0) {
    const removeKeys = ['清濁', '入', '部位', '方式', '調'];
    return matches.map(m => {
      let key = m[2];
      if (removeKeys.includes(key)) key = '';
      return `${m[1]}${key}`;
    }).join('·');
  }
  return queryStr;
}

// ✅ 不再需要 onMounted 中的轮询
// userStore.role 会在应用启动时由 auth.js 自动初始化

defineExpose({ combinations })

</script>

<style scoped lang="scss">
$font-size-base: 14px;
$transition-duration: 0.2s;
$card-radius: 8px;

/* 最外层容器：统一的大玻璃卡片 */
.query-result-box {
  display: flex;
  flex-direction: column;
  margin: 10px 0;
  padding: 8px;
}

/* 头部样式调整 */
.info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 12px;
  color: var(--text-medium);
  font-size: $font-size-base;
  border-bottom: 1px solid var(--border-light);
}

/* 全局展开按钮 */
.global-expand-btn {
  padding: 4px 12px;
  color: var(--color-blue-custom);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  background: var(--color-blue-custom-light);
  border: none;
  border-radius: 12px;
  transition: all $transition-duration;

  &:hover {
    color: white;
    background: var(--color-blue-custom);
  }
}

/* Loading 和 Empty 状态 */
.status-msg {
  width: 100%;
  color: var(--text-muted);
  font-size: $font-size-base;
  text-align: center;
}

/* Grid 布局（预览列表） */
.compact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 6px;
  width: 100%;
}

/* 单个紧凑项（一行显示） */
.compact-item {
  display: flex;
  align-items: center;
  padding: 8px;
  overflow: hidden;
  font-size: $font-size-base;
  white-space: nowrap;
  background: var(--glass-lighter);
  border-radius: $card-radius;
  transition: background $transition-duration;

  &:hover {
    background: var(--glass-medium-strong);
  }
}

.compact-title {
  margin-right: 4px;
  color: var(--text-dark);
  font-weight: bold;
}

.compact-count {
  margin-right: 8px;
  color: var(--color-blue-custom);
  font-size: 0.9em;
  font-weight: 600;
}

.compact-preview {
  flex: 1;
  overflow: hidden;
  color: var(--text-muted);
  text-overflow: ellipsis;
}

.limit-warning {
  padding: 12px;
  color: var(--color-error);
  font-size: $font-size-base;
  font-weight: 600;
  text-align: center;
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-border);
  border-radius: 12px;
  animation: fade-in 0.3s ease;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
