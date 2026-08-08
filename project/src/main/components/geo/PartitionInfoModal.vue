<template>
  <AppModal
    :model-value="modelValue"
    size="lg"
    :close-label="$t('common.button.close')"
    :show-close="false"
    @update:modelValue="closeModal"
  >
    <template #header>
      <!-- 头部 -->
<!--      <div class="partition-modal-header">-->
        <div class="partition-modal-title"><InlineIcon icon="🗂️" />{{ $t('query.components.partitionModal.title') }}</div>
        <!-- 选择模式开关 -->
        <div class="selection-mode-toggle">
          <label class="toggle-label">{{ $t('query.components.partitionModal.enableSelection') }}</label>
          <SwitchToggle
            :model-value="selectionMode"
            :width="50"
            :height="30"
            :thumb-size="24"
            color="blue"
            variant="solid"
            :aria-label="$t('query.components.partitionModal.enableSelection')"
            @update:modelValue="selectionMode = $event"
            @change="toggleSelectionMode"
          />
        </div>
        <button class="close-btn close-btn-sm close-btn-inline" type="button" @click="closeModal">×</button>
<!--      </div>-->
    </template>

      <!-- Tab 切换 + 确认按钮 -->
      <div class="partition-tabs-row">
        <div class="partition-tabs">
          <button
            v-for="tab in tabOptions"
            :key="tab"
            class="partition-tab-btn"
            :class="{ active: activeTab === tab }"
            @click="activeTab = tab"
          >
            {{ getTabLabel(tab) }}
          </button>
        </div>

        <div v-if="selectionMode" class="selection-actions">
          <div v-if="selectionWarning" class="selection-warning-inline">{{ selectionWarning }}</div>
          <button
            class="confirm-btn"
            :disabled="!canConfirmSelection"
            @click="confirmSelection"
            type="button"
          >
            {{ $t('query.components.partitionModal.confirmSelection', { count: selectedLocations.size }) }}
          </button>
        </div>
      </div>

      <!-- 主体：树状图 -->
      <div class="partition-modal-body ui-scrollbar">
        <div v-if="isLoading" class="loading-state loading-state-base">
          <div class="ui-loading--page" aria-hidden="true"></div>
          <span>{{ $t('query.components.partitionModal.loading') }}</span>
        </div>

        <div v-else-if="errorMessage" class="error-state">
          <span><InlineIcon icon="❌" />{{ errorMessage }}</span>
        </div>

        <div v-else class="partition-tree-container" :class="{ 'selection-mode': selectionMode }">
          <PartitionTreeNode
            v-for="(value, key) in currentTree"
            :key="key"
            :label="key"
            :children="value"
            :level="0"
            :selection-mode="selectionMode"
            :selected-locations="selectedLocations"
            :max-selection="maxSelection"
            @toggle-location="toggleLocation"
            @toggle-subtree="toggleSubtreeLocations"
          />
        </div>
      </div>
  </AppModal>
</template>

<script setup>
import InlineIcon from '@/components/common/InlineIcon.vue'
import { ref, computed, watch, defineComponent, h, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'
import SwitchToggle from '@/components/common/SwitchToggle.vue'

const { t } = useI18n()

const TAB_MAP = 'map'
const TAB_YINDIAN = 'yindian'
const TAB_ADMINISTRATIVE_DIVISION = 'administrativeDivision'
const TREE_LEAF_KEY = '__locations__'
const tabOptions = [TAB_MAP, TAB_YINDIAN, TAB_ADMINISTRATIVE_DIVISION]

const FIELD_KEYS = {
  shortName: ['簡稱', '简称'],
  language: ['語言', '语言'],
  storageFlag: ['存儲標記', '存储标记'],
  mapPartition: ['地圖集二分區', '地图集二分区'],
  dictPartition: ['音典分區', '音典分区'],
  adminLevels: [
    ['省'],
    ['市'],
    ['縣', '县'],
    ['鎮', '镇'],
    ['行政村'],
    ['自然村']
  ]
}

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  dataState: {
    type: Object,
    default: () => ({})
  },
  selectionState: {
    type: Object,
    default: () => ({})
  }
})

const dataState = computed(() => ({
  partitionData: [],
  isLoading: false,
  errorMessage: '',
  ...props.dataState
}))

const selectionState = computed(() => ({
  initialTab: TAB_MAP,
  autoEnableSelection: false,
  initialSelectedLocations: [],
  maxSelection: null,
  ...props.selectionState
}))

const initialTab = computed(() => selectionState.value.initialTab)
const partitionData = computed(() => dataState.value.partitionData)
const isLoading = computed(() => dataState.value.isLoading)
const errorMessage = computed(() => dataState.value.errorMessage)
const autoEnableSelection = computed(() => selectionState.value.autoEnableSelection)
const initialSelectedLocations = computed(() => selectionState.value.initialSelectedLocations)
const maxSelection = computed(() => selectionState.value.maxSelection)

const emit = defineEmits(['update:modelValue', 'locations-selected', 'locations-changed'])

const getTabLabel = (tab) => {
  if (tab === TAB_MAP) return t('query.components.partitionModal.mapPartition')
  if (tab === TAB_YINDIAN) return t('query.components.partitionModal.dictPartition')
  if (tab === TAB_ADMINISTRATIVE_DIVISION) return t('query.components.partitionModal.administrativeDivision')
  return tab
}

const getFieldValue = (row, keys) => {
  if (!row || typeof row !== 'object') return undefined
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      return row[key]
    }
  }
  return undefined
}

const getStringField = (row, keys) => {
  const value = getFieldValue(row, keys)
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

const getDialectName = (row) => {
  return (
    getStringField(row, FIELD_KEYS.shortName) ||
    getStringField(row, FIELD_KEYS.language) ||
    t('query.components.partitionModal.unknownDialect')
  )
}

const normalizeNodeLabel = (value) => {
  return value ? value : t('query.components.partitionModal.emptyNode')
}

const adminLabelCollator = new Intl.Collator('zh-u-co-pinyin', {
  numeric: true,
  sensitivity: 'base'
})

const compareAdminLabels = (a, b) => {
  const emptyNodeLabel = t('query.components.partitionModal.emptyNode')
  const aIsEmpty = a === emptyNodeLabel
  const bIsEmpty = b === emptyNodeLabel
  if (aIsEmpty && !bIsEmpty) return 1
  if (!aIsEmpty && bIsEmpty) return -1
  return adminLabelCollator.compare(a, b)
}

const sortTreeByAdminRules = (node) => {
  if (Array.isArray(node)) return node
  if (!node || typeof node !== 'object') return node

  const sortedNode = {}
  Object.keys(node)
    .sort(compareAdminLabels)
    .forEach((key) => {
      sortedNode[key] = sortTreeByAdminRules(node[key])
    })

  return sortedNode
}

const normalizePartitionRows = (data) => {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    if (Array.isArray(data.data)) return data.data
    if (Array.isArray(data.rows)) return data.rows
    if (Array.isArray(data.list)) return data.list
  }
  return []
}

const activeTab = ref(initialTab.value)
const selectionMode = ref(false)
const selectedLocations = ref(new Set())
const rawData = ref([])

watch(initialTab, (newTab) => {
  activeTab.value = [TAB_MAP, TAB_YINDIAN, TAB_ADMINISTRATIVE_DIVISION].includes(newTab) ? newTab : TAB_MAP
}, { immediate: true })

watch(autoEnableSelection, (shouldEnable) => {
  if (shouldEnable && props.modelValue) {
    selectionMode.value = true
  }
}, { immediate: true })

watch(() => props.modelValue, (isVisible) => {
  if (isVisible && autoEnableSelection.value) {
    selectionMode.value = true
  }
})

watch([partitionData, () => props.modelValue, initialSelectedLocations],
  ([data, isVisible, initialLocs]) => {
    const rows = normalizePartitionRows(data)
    if (isVisible && rows.length > 0) {
      nextTick(() => {
        if (initialLocs.length > 0) {
          const allLocations = getAllLocations(currentTree.value)
          const validLocations = initialLocs.filter(loc => allLocations.includes(loc))
          selectedLocations.value = new Set(validLocations)
        } else {
          selectedLocations.value = new Set()
        }
      })
    }
  },
  { immediate: true }
)

watch(partitionData, (newData) => {
  rawData.value = normalizePartitionRows(newData)
}, { immediate: true })

const filteredData = computed(() => {
  if (!selectionMode.value) return rawData.value
  return rawData.value.filter(row => {
    const flag = getFieldValue(row, FIELD_KEYS.storageFlag)
    return flag === '1' || flag === 1
  })
})

const isOverSelectionLimit = computed(() => {
  return maxSelection.value !== null
    && Number.isFinite(maxSelection.value)
    && selectedLocations.value.size > maxSelection.value
})

const isAtSelectionLimit = computed(() => {
  return maxSelection.value !== null
    && Number.isFinite(maxSelection.value)
    && selectedLocations.value.size >= maxSelection.value
})

const canConfirmSelection = computed(() => {
  return selectionMode.value
    && selectedLocations.value.size > 0
    && !isOverSelectionLimit.value
})

const selectionWarning = computed(() => {
  if (!selectionMode.value) return ''
  if (!isOverSelectionLimit.value) return ''
  return t('query.components.partitionModal.maxSelectionExceeded', {
    count: selectedLocations.value.size,
    max: maxSelection.value
  })
})

const currentTree = computed(() => {
  if (activeTab.value === TAB_MAP) {
    return buildPartitionTree(filteredData.value, FIELD_KEYS.mapPartition)
  }
  if (activeTab.value === TAB_YINDIAN) {
    return buildPartitionTree(filteredData.value, FIELD_KEYS.dictPartition)
  }
  return buildAdminTree(filteredData.value)
})

const buildPartitionTree = (data, columnKeys) => {
  const tree = {}

  const ensureLeafList = (container, key) => {
    if (Array.isArray(container[key])) {
      return container[key]
    }
    if (!container[key]) {
      container[key] = []
      return container[key]
    }
    if (!Array.isArray(container[key][TREE_LEAF_KEY])) {
      container[key][TREE_LEAF_KEY] = []
    }
    return container[key][TREE_LEAF_KEY]
  }

  const ensureBranchNode = (container, key) => {
    if (!container[key]) {
      container[key] = {}
    } else if (Array.isArray(container[key])) {
      container[key] = {
        [TREE_LEAF_KEY]: container[key]
      }
    }
    return container[key]
  }

  data.forEach(row => {
    const dialectName = getDialectName(row)
    const partitionStr = getStringField(row, columnKeys)

    if (!partitionStr) {
      return
    }

    const parts = partitionStr.split('-').map(p => p.trim()).filter(Boolean)
    if (parts.length === 0) {
      return
    }

    let current = tree
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        ensureLeafList(current, part).push(dialectName)
      } else {
        current = ensureBranchNode(current, part)
      }
    })
  })

  return tree
}

const buildAdminTree = (data) => {
  const tree = {}

  const ensureLeafList = (container, key) => {
    if (Array.isArray(container[key])) {
      return container[key]
    }
    if (!container[key]) {
      container[key] = []
      return container[key]
    }
    if (!Array.isArray(container[key][TREE_LEAF_KEY])) {
      container[key][TREE_LEAF_KEY] = []
    }
    return container[key][TREE_LEAF_KEY]
  }

  const ensureBranchNode = (container, key) => {
    if (!container[key]) {
      container[key] = {}
    } else if (Array.isArray(container[key])) {
      container[key] = {
        [TREE_LEAF_KEY]: container[key]
      }
    }
    return container[key]
  }

  data.forEach(row => {
    const dialectName = getDialectName(row)
    const rawLevels = FIELD_KEYS.adminLevels.map(keys => getStringField(row, keys))
    const lastNonEmptyIndex = rawLevels.reduce((lastIndex, value, index) => {
      return value ? index : lastIndex
    }, -1)

    // Skip trailing empty levels; keep "(空)" only when a middle level is empty but lower levels are present.
    const levels = lastNonEmptyIndex >= 0
      ? rawLevels.slice(0, lastNonEmptyIndex + 1).map(value => normalizeNodeLabel(value))
      : []

    if (levels.length === 0) {
      return
    }

    let current = tree
    levels.forEach((part, index) => {
      if (index === levels.length - 1) {
        ensureLeafList(current, part).push(dialectName)
      } else {
        current = ensureBranchNode(current, part)
      }
    })
  })

  return sortTreeByAdminRules(tree)
}

const getAllLocations = (tree) => {
  const locations = []

  const traverse = (node) => {
    if (Array.isArray(node)) {
      locations.push(...node)
    } else if (typeof node === 'object' && node !== null) {
      Object.values(node).forEach(traverse)
    }
  }

  traverse(tree)
  return locations
}

const getUniqueLocations = (tree) => {
  return Array.from(new Set(getAllLocations(tree)))
}

const getTotalLeafCount = (children) => {
  if (Array.isArray(children)) {
    return children.length
  }
  return Object.values(children).reduce((sum, child) => sum + getTotalLeafCount(child), 0)
}

const syncSelectedLocations = () => {
  if (isOverSelectionLimit.value) return
  emit('locations-changed', Array.from(selectedLocations.value))
}

const toggleSelectionMode = () => {
  selectionMode.value = !selectionMode.value
  if (!selectionMode.value) {
    selectedLocations.value.clear()
    emit('locations-changed', [])
  }
}

const toggleLocation = (location) => {
  if (selectedLocations.value.has(location)) {
    selectedLocations.value.delete(location)
  } else {
    // 如果已达到限制，不允许添加新的选择
    if (isAtSelectionLimit.value) {
      return
    }
    selectedLocations.value.add(location)
  }
  selectedLocations.value = new Set(selectedLocations.value)
  syncSelectedLocations()
}

const toggleSubtreeLocations = (children) => {
  const subtreeLocations = getUniqueLocations(children)
  if (subtreeLocations.length === 0) return
  const nextSelected = new Set(selectedLocations.value)
  const isFullySelected = subtreeLocations.every((location) => nextSelected.has(location))
  if (isFullySelected) {
    subtreeLocations.forEach((location) => nextSelected.delete(location))
  } else {
    // 检查全选后是否会超过限制
    const wouldExceedLimit = maxSelection.value !== null
      && Number.isFinite(maxSelection.value)
      && nextSelected.size + subtreeLocations.filter(loc => !nextSelected.has(loc)).length > maxSelection.value

    if (wouldExceedLimit) {
      return
    }
    subtreeLocations.forEach((location) => nextSelected.add(location))
  }
  selectedLocations.value = nextSelected
  syncSelectedLocations()
}

const confirmSelection = () => {
  if (!canConfirmSelection.value) return
  const locations = Array.from(selectedLocations.value)
  emit('locations-selected', locations)
  closeModal()
}

const closeModal = () => {
  emit('update:modelValue', false)
  selectionMode.value = false
}

const getSelectedCount = (children, selectedLocations) => {
  if (Array.isArray(children)) {
    return children.filter(item => selectedLocations.has(item)).length
  }
  return Object.values(children).reduce((sum, child) => sum + getSelectedCount(child, selectedLocations), 0)
}

const PartitionTreeNode = defineComponent({
  name: 'PartitionTreeNode',
  props: {
    label: { type: String, required: true },
    children: { type: [Object, Array], required: true },
    level: { type: Number, default: 0 },
    selectionMode: { type: Boolean, default: false },
    selectedLocations: { type: Set, default: () => new Set() },
    maxSelection: { type: Number, default: null }
  },
  emits: ['toggle-location', 'toggle-subtree'],
  setup(props, { emit }) {
    const isExpanded = ref(false)
    const directLeaves = computed(() => {
      if (Array.isArray(props.children)) {
        return props.children
      }
      if (props.children && typeof props.children === 'object' && Array.isArray(props.children[TREE_LEAF_KEY])) {
        return props.children[TREE_LEAF_KEY]
      }
      return []
    })
    const childEntries = computed(() => {
      if (!props.children || typeof props.children !== 'object' || Array.isArray(props.children)) {
        return []
      }
      return Object.entries(props.children).filter(([key]) => key !== TREE_LEAF_KEY)
    })
    const isLeaf = computed(() => Array.isArray(props.children) || childEntries.value.length === 0)
    const childCount = computed(() => getTotalLeafCount(props.children))

    const toggleExpand = () => {
      isExpanded.value = !isExpanded.value
    }

    const handleLocationClick = (location) => {
      if (props.selectionMode) {
        emit('toggle-location', location)
      }
    }

    const handleToggleSubtree = () => {
      if (!props.selectionMode) return
      emit('toggle-subtree', props.children)
    }

    // 检查全选按钮是否应该禁用
    const isSelectAllDisabled = computed(() => {
      if (!props.selectionMode || props.maxSelection === null || !Number.isFinite(props.maxSelection)) return false
      const subtreeLocations = getUniqueLocations(props.children)
      const currentSelected = props.selectedLocations.size
      const newSelections = subtreeLocations.filter(loc => !props.selectedLocations.has(loc)).length
      return currentSelected + newSelections > props.maxSelection
    })

    return {
      isExpanded,
      isLeaf,
      directLeaves,
      childEntries,
      childCount,
      toggleExpand,
      handleLocationClick,
      handleToggleSubtree,
      isSelectAllDisabled
    }
  },
  render() {
    const { label, children, level, selectionMode, selectedLocations, maxSelection } = this.$props
    const {
      isExpanded,
      isLeaf,
      directLeaves,
      childEntries,
      childCount,
      toggleExpand,
      handleLocationClick,
      handleToggleSubtree,
      isSelectAllDisabled
    } = this
    const selectedCount = selectionMode ? getSelectedCount(children, selectedLocations) : 0
    const isSubtreeFullySelected = selectionMode && childCount > 0 && selectedCount === childCount

    // 检查单个地点是否应该禁用
    const isAtLimit = maxSelection !== null && Number.isFinite(maxSelection) && selectedLocations.size >= maxSelection

    return h('div', { class: 'tree-node' }, [
      h('div', {
        class: 'node-content',
        onClick: toggleExpand
      }, [
        h('div', { class: 'node-label' }, [
          h('span', { class: 'icon' }, isLeaf ? '📂' : '📁'),
          h('span', { class: 'text' }, label),
          h('span', { class: 'count' }, `(${childCount})`),
          selectionMode && selectedCount > 0
            ? h('span', { class: 'selected-count' }, `✓${selectedCount}`)
            : null
        ]),
        h('div', { class: 'node-actions' }, [
          selectionMode ? h('button', {
            class: ['node-select-btn', isSubtreeFullySelected ? 'cancel' : 'select'],
            disabled: !isSubtreeFullySelected && isSelectAllDisabled,
            onClick: (e) => {
              e.stopPropagation()
              handleToggleSubtree()
            }
          }, isSubtreeFullySelected
            ? t('query.components.partitionModal.clearSelection')
            : t('query.components.partitionModal.selectAll')) : null,
          h('button', {
            class: ['expand-btn', { 'is-open': isExpanded }],
            onClick: (e) => {
              e.stopPropagation()
              toggleExpand()
            }
          }, [
            h('span', { class: 'plus-icon' }, '＋')
          ])
        ])
      ]),

      isExpanded && h('div', { class: 'children-container' }, [
        isLeaf
          ? h('div', { class: 'leaf-list' },
              directLeaves.map(item => {
                const isSelected = selectionMode && selectedLocations.has(item)
                const isDisabled = selectionMode && !isSelected && isAtLimit
                return h('div', {
                  class: ['leaf-item', {
                    selected: isSelected,
                    disabled: isDisabled
                  }],
                  key: item,
                  onClick: () => !isDisabled && handleLocationClick(item)
                }, [
                  selectionMode && h('input', {
                    type: 'checkbox',
                    class: 'location-checkbox',
                    checked: isSelected,
                    disabled: isDisabled,
                    onClick: (e) => {
                      e.stopPropagation()
                      if (!isDisabled) {
                        handleLocationClick(item)
                      }
                    }
                  }),
                  h('span', { class: 'location-name' }, item)
                ])
              })
            )
          : [
              directLeaves.length > 0
                ? h('div', { class: 'leaf-list' },
                    directLeaves.map(item => {
                      const isSelected = selectionMode && selectedLocations.has(item)
                      const isDisabled = selectionMode && !isSelected && isAtLimit
                      return h('div', {
                        class: ['leaf-item', {
                          selected: isSelected,
                          disabled: isDisabled
                        }],
                        key: item,
                        onClick: () => !isDisabled && handleLocationClick(item)
                      }, [
                        selectionMode && h('input', {
                          type: 'checkbox',
                          class: 'location-checkbox',
                          checked: isSelected,
                          disabled: isDisabled,
                          onClick: (e) => {
                            e.stopPropagation()
                            if (!isDisabled) {
                              handleLocationClick(item)
                            }
                          }
                        }),
                        h('span', { class: 'location-name' }, item)
                      ])
                    })
                  )
                : null,
              childEntries.map(([key, value]) =>
                h(PartitionTreeNode, {
                  key,
                  label: key,
                  children: value,
                  level: level + 1,
                  selectionMode,
                  selectedLocations,
                  maxSelection,
                  onToggleLocation: (location) => this.$emit('toggle-location', location),
                  onToggleSubtree: (subtree) => this.$emit('toggle-subtree', subtree)
                })
              )
            ]
      ])
    ])
  }
})
</script>



<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$primary: var(--color-primary);
$primary-dark: var(--color-primary-hover);
$danger: var(--color-error-dark);
$error: var(--color-error);
$warning: var(--color-warning-dark);

$mobile-breakpoint: 768px;
$desktop-large: 1201px;

$ease-fluid: cubic-bezier(0.25, 0.8, 0.25, 1);
@mixin primary-gradient {
  background: linear-gradient(
    135deg,
    $primary 0%,
    $primary-dark 100%
  );
}

/* 弹窗标题 */
.partition-modal-title {
  color: var(--text-dark-light);
  font-size: 15px;
  font-weight: 650;
}

/* 选择模式开关 */
.selection-mode-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toggle-label {
  color: var(--text-dark-medium);
  font-size: 13px;
  font-weight: 500;
}

/* Tab 与确认区域 */
.partition-tabs-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: var(--glass-40);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.partition-tabs {
  display: flex;
  gap: 10px;
}

.partition-tab-btn {
  padding: 8px 12px;
  background: rgba(142, 142, 147, 0.15);
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-primary);
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(142, 142, 147, 0.25);
  }

  &.active {
    @include primary-gradient;

    box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.3);
    color: var(--action-primary-text);
  }
}

.selection-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.selection-warning-inline {
  color: $warning;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
}

.confirm-btn {
  padding: 8px 20px;

  @include primary-gradient;

  border: none;
  border-radius: var(--radius-md);
  box-shadow: 0 2px 8px rgba(var(--color-primary-rgb), 0.3);
  color: var(--action-primary-text);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.4);
    transform: translateY(-1px);
  }

  &:disabled {
    @include disabled-state;
  }
}

/* 弹窗主体 */
.partition-modal-body {
  padding: 24px;
  background: var(--glass-30);
}

/* 加载与错误状态 */
.loading-state,
.error-state {
  gap: 16px;
  padding: 80px 20px;
  color: var(--text-secondary);
}

.error-state {
  color: $error;
  font-weight: 500;
}

/* 分区树 */
.partition-tree-container {
  font-size: 14px;
  line-height: 1.6;

  :deep(.tree-node) {
    margin-bottom: 8px;
  }

  :deep(.node-content) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: var(--glass-40);
    }
  }

  :deep(.node-label) {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-dark);
    font-size: 15px;
    font-weight: 500;

    .icon {
      font-size: 16px;
    }

    .text {
      flex: 1;
    }

    .count {
      margin-left: 4px;
      color: var(--text-secondary);
      font-size: 12px;
    }

    .selected-count {
      margin-left: 0.5rem;
      padding: 0.2rem 0.5rem;
      background: rgba(var(--color-primary-rgb), 0.15);
      border-radius: var(--radius-md);
      color: $primary;
      font-size: 0.85em;
      font-weight: 600;
    }
  }

  :deep(.node-actions) {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  :deep(.node-select-btn) {
    padding: 4px 10px;
    border: none;
    border-radius: var(--radius-pill);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &.select {
      background: rgba(var(--color-primary-rgb), 0.12);
      color: $primary-dark;

      &:hover:not(:disabled) {
        background: rgba(var(--color-primary-rgb), 0.2);
      }
    }

    &.cancel {
      background: rgba(var(--color-error-light-rgb), 0.14);
      color: $danger;

      &:hover:not(:disabled) {
        background: rgba(var(--color-error-light-rgb), 0.24);
      }
    }
  }

  :deep(.expand-btn) {
    width: 24px;
    height: 24px;

    @include flex-center;

    background: transparent;
    border: none;
    border-radius: var(--radius-full);
    color: $primary;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(var(--color-primary-rgb), 0.1);
    }

    &.is-open {
      transform: rotate(45deg);
    }
  }

  :deep(.children-container) {
    margin-top: 8px;
    margin-left: 14px;
    padding-left: 20px;
    border-left: 2px solid rgba(var(--color-primary-rgb), 0.1);
    transition: height 0.3s $ease-fluid;
  }

  :deep(.leaf-list) {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
    margin-bottom: 8px;
  }

  :deep(.leaf-item) {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    overflow: hidden;
    background: var(--glass-50);
    border-radius: var(--radius-md);
    color: var(--text-dark);
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 14px;
    font-weight: 500;
    cursor: default;
    transition: all 0.2s;

    &:hover {
      background: var(--glass-70);
    }

    &.selected {
      background: rgba(var(--color-primary-rgb), 0.15);
      border: 1px solid rgba(var(--color-primary-rgb), 0.3);
    }

    &.disabled {
      @include disabled-state;
    }
  }

  :deep(.location-checkbox) {
    width: 18px;
    height: 18px;
    accent-color: $primary;
    cursor: pointer;

    &:disabled {
      cursor: not-allowed;
    }
  }

  :deep(.location-name) {
    flex: 1;
  }

  &.selection-mode {
    :deep(.leaf-list) {
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    }

    :deep(.leaf-item) {
      cursor: pointer;

      &.disabled {
        cursor: not-allowed;
      }
    }
  }
}

/* 移动端 */
@media (max-width: $mobile-breakpoint) {
  .partition-tabs-row {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .selection-actions {
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .partition-modal-body {
    padding: 16px;
  }

  .partition-tab-btn {
    padding: 8px 6px;
  }

  .partition-tree-container {
    :deep(.children-container) {
      margin-left: 10px;
      padding-left: 12px;
    }

    :deep(.leaf-list) {
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 6px;
    }

    :deep(.leaf-item) {
      padding: 6px 8px;
      font-size: 13px;
    }

    &.selection-mode {
      :deep(.leaf-list) {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      }
    }
  }
}

/* 中等屏幕 */
@media (min-width: 769px) and (max-width: 1200px) {
  .partition-tree-container {
    :deep(.leaf-list) {
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    }

    &.selection-mode {
      :deep(.leaf-list) {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      }
    }
  }
}

/* 大屏幕 */
@media (min-width: $desktop-large) {
  .partition-tree-container {
    :deep(.leaf-list) {
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    }

    &.selection-mode {
      :deep(.leaf-list) {
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      }
    }
  }
}
</style>
