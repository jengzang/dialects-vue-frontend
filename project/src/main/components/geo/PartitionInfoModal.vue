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
        <div class="partition-modal-title">🗂️ {{ $t('query.components.partitionModal.title') }}</div>
        <!-- 选择模式开关 -->
        <div class="selection-mode-toggle">
          <label class="toggle-label">{{ $t('query.components.partitionModal.enableSelection') }}</label>
          <button
            class="toggle-switch toggle-switch-base"
            :class="{ active: selectionMode }"
            @click="toggleSelectionMode"
            type="button"
          >
            <span class="toggle-slider toggle-switch-slider-base"></span>
          </button>
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
          <span>❌ {{ errorMessage }}</span>
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
import { ref, computed, watch, defineComponent, h, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'

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

<style scoped>
.partition-modal-header {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-gray-lightest);
}

.partition-modal-title {
  font-size: 15px;
  font-weight: 650;
  color: var(--text-dark-light);
}

/* Selection mode toggle */
.selection-mode-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toggle-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-dark-medium);
}

.partition-toggle-switch-unused {
  position: relative;
  width: 50px;
  height: 30px;
  border-radius: 15px;
  border: none;
  background: rgba(142, 142, 147, 0.3);
  cursor: pointer;
  transition: background 0.3s ease;
}

.partition-toggle-switch-unused.active {
  background: #007aff;
}

.partition-toggle-slider-unused {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
}

.partition-toggle-switch-unused.active .partition-toggle-slider-unused {
  transform: translateX(20px);
}

/* Tabs row */
.partition-tabs-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background: rgba(255, 255, 255, 0.4);
}

.selection-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.partition-tabs {
  display: flex;
  gap: 10px;
}

.partition-tab-btn {
  white-space: nowrap;
  padding: 8px 12px;
  border-radius: 12px;
  border: none;
  background: rgba(142, 142, 147, 0.15);
  color: #1d1d1f;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.partition-tab-btn:hover {
  background: rgba(142, 142, 147, 0.25);
}

.partition-tab-btn.active {
  background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}

/* Confirm button */
.confirm-btn {
  padding: 8px 20px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}

.confirm-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.4);
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.selection-warning-inline {
  color: #d35400;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

/* Modal body */
.partition-modal-body {
  padding: 24px;
  background: rgba(255, 255, 255, 0.3);
}

/* Loading and error states */
.loading-state,
.error-state {
  padding: 80px 20px;
  gap: 16px;
  color: #6e6e73;
}

.error-state {
  color: #d32f2f;
  font-weight: 500;
}

/* Tree styles */
.partition-tree-container {
  font-size: 14px;
  line-height: 1.6;
}

.partition-tree-container :deep(.tree-node) {
  margin-bottom: 8px;
}

.partition-tree-container :deep(.node-content) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.partition-tree-container :deep(.node-content:hover) {
  background: rgba(255, 255, 255, 0.4);
}

.partition-tree-container :deep(.node-label) {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
  color: #333;
  flex: 1;
}

.partition-tree-container :deep(.node-label .icon) {
  font-size: 16px;
}

.partition-tree-container :deep(.node-label .text) {
  flex: 1;
}

.partition-tree-container :deep(.node-label .count) {
  font-size: 12px;
  color: #8e8e93;
  margin-left: 4px;
}

.partition-tree-container :deep(.node-label .selected-count) {
  margin-left: 0.5rem;
  padding: 0.2rem 0.5rem;
  background: rgba(0, 122, 255, 0.15);
  color: #007aff;
  border-radius: 10px;
  font-size: 0.85em;
  font-weight: 600;
}

.partition-tree-container :deep(.node-actions) {
  display: flex;
  align-items: center;
  gap: 6px;
}

.partition-tree-container :deep(.node-select-btn) {
  border: none;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.partition-tree-container :deep(.node-select-btn:disabled) {
  opacity: 0.4;
  cursor: not-allowed;
}

.partition-tree-container :deep(.node-select-btn.select) {
  background: rgba(0, 122, 255, 0.12);
  color: #0051d5;
}

.partition-tree-container :deep(.node-select-btn.select:hover:not(:disabled)) {
  background: rgba(0, 122, 255, 0.2);
}

.partition-tree-container :deep(.node-select-btn.cancel) {
  background: rgba(255, 59, 48, 0.14);
  color: #b42318;
}

.partition-tree-container :deep(.node-select-btn.cancel:hover:not(:disabled)) {
  background: rgba(255, 59, 48, 0.24);
}

.partition-tree-container :deep(.expand-btn) {
  background: transparent;
  border: none;
  color: #007AFF;
  font-size: 16px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.partition-tree-container :deep(.expand-btn:hover) {
  background: rgba(0, 122, 255, 0.1);
}

.partition-tree-container :deep(.expand-btn.is-open) {
  transform: rotate(45deg);
}

.partition-tree-container :deep(.children-container) {
  padding-left: 20px;
  border-left: 2px solid rgba(0, 122, 255, 0.1);
  margin-left: 14px;
  margin-top: 8px;
  transition: height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.partition-tree-container :deep(.leaf-list) {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

/* 选择模式下的 leaf-list：增加最小宽度以容纳复选框 */
.partition-tree-container.selection-mode :deep(.leaf-list) {
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
}

.partition-tree-container :deep(.leaf-item) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.2s;
  cursor: default;
}

/* 选择模式下的 leaf-item：可点击 */
.partition-tree-container.selection-mode :deep(.leaf-item) {
  cursor: pointer;
}

.partition-tree-container :deep(.leaf-item:hover) {
  background: rgba(255, 255, 255, 0.7);
}

.partition-tree-container :deep(.leaf-item.selected) {
  background: rgba(0, 122, 255, 0.15);
  border: 1px solid rgba(0, 122, 255, 0.3);
}

.partition-tree-container :deep(.leaf-item.disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}

.partition-tree-container :deep(.location-checkbox) {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #007aff;
}

.partition-tree-container :deep(.location-checkbox:disabled) {
  cursor: not-allowed;
}

.partition-tree-container :deep(.location-name) {
  flex: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .partition-tabs-row {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .selection-actions {
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .partition-modal-body {
    padding: 16px;
  }

  .partition-tree-container :deep(.children-container) {
    margin-left: 10px;
    padding-left: 12px;
  }

  .partition-tree-container :deep(.leaf-list) {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 6px;
  }

  /* 选择模式下：移动端增加最小宽度 */
  .partition-tree-container.selection-mode :deep(.leaf-list) {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .partition-tree-container :deep(.leaf-item) {
    font-size: 13px;
    padding: 6px 8px;
  }
  .partition-tab-btn {
    padding:8px 6px;
  }
}

@media (min-width: 769px) and (max-width: 1200px) {
  .partition-tree-container :deep(.leaf-list) {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }

  /* 选择模式下：中等屏幕增加最小宽度 */
  .partition-tree-container.selection-mode :deep(.leaf-list) {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
}

@media (min-width: 1201px) {
  .partition-tree-container :deep(.leaf-list) {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  /* 选择模式下：大屏幕增加最小宽度 */
  .partition-tree-container.selection-mode :deep(.leaf-list) {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}
</style>
