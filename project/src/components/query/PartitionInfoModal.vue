<template>
  <Teleport to="body">
    <div v-if="modelValue" class="glass-overlay" @mousedown.self="closeModal">
      <div class="partition-info-modal glass-modal" role="dialog" aria-modal="true">
        <!-- 头部 -->
        <div class="modal-header">
<!--          <div class="header-left">-->
            <div class="modal-title">🗂️ 分區詳情</div>
            <!-- 选择模式开关 -->
            <div class="selection-mode-toggle">
              <label class="toggle-label">開啟選擇</label>
              <button
                  class="toggle-switch"
                  :class="{ active: selectionMode }"
                  @click="toggleSelectionMode"
                  type="button"
              >
                <span class="toggle-slider"></span>
              </button>
            </div>
<!--          </div>-->
          <button class="modal-close" type="button" @click="closeModal">×</button>
        </div>

        <!-- Tab 切换 + 确认按钮 -->
        <div class="partition-tabs-row">
          <div class="partition-tabs">
            <button
                v-for="tab in ['map', 'yindian']"
                :key="tab"
                class="partition-tab-btn"
                :class="{ active: activeTab === tab }"
                @click="activeTab = tab"
            >
              {{ tab === 'map' ? '地圖集二分區' : '音典分區' }}
            </button>
          </div>

          <!-- 确认选择按钮（仅选择模式显示） -->
          <button
              v-if="selectionMode"
              class="confirm-btn"
              @click="confirmSelection"
              type="button"
          >
            確認選擇 ({{ selectedLocations.size }})
          </button>
        </div>

        <!-- 主体：树状图 -->
        <div class="modal-body">
          <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            <span>加載中...</span>
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
                @toggle-location="toggleLocation"
            />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, defineComponent, h, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  initialTab: {
    type: String,
    default: 'map',
    validator: (value) => ['map', 'yindian'].includes(value)
  },
  partitionData: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: ''
  },
  autoEnableSelection: {
    type: Boolean,
    default: false
  },
  initialSelectedLocations: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'locations-selected', 'locations-changed'])

// State
const activeTab = ref(props.initialTab)
const selectionMode = ref(false)
const selectedLocations = ref(new Set())
const rawData = ref([])

// Watch for initial tab changes
watch(() => props.initialTab, (newTab) => {
  activeTab.value = newTab
}, { immediate: true })

// Watch for auto-enable selection mode
watch(() => props.autoEnableSelection, (shouldEnable) => {
  if (shouldEnable && props.modelValue) {
    selectionMode.value = true
  }
}, { immediate: true })

// Watch for modal visibility
watch(() => props.modelValue, (isVisible) => {
  if (isVisible) {
    // Auto-enable selection mode if requested
    if (props.autoEnableSelection) {
      selectionMode.value = true
    }
  }
})

// Watch for partition data changes and apply initial selections when ready
watch([() => props.partitionData, () => props.modelValue, () => props.initialSelectedLocations],
  ([data, isVisible, initialLocs]) => {
    if (isVisible && data.length > 0) {
      nextTick(() => {
        if (initialLocs.length > 0) {
          const allLocations = getAllLocations(currentTree.value)
          const validLocations = initialLocs.filter(loc => allLocations.includes(loc))
          selectedLocations.value = new Set(validLocations)
        } else {
          // 如果 initialLocs 为空，清空选择
          selectedLocations.value = new Set()
        }
      })
    }
  },
  { immediate: true }
)

// Watch for partition data changes
watch(() => props.partitionData, (newData) => {
  if (newData && newData.length > 0) {
    rawData.value = newData
  }
}, { immediate: true })

// Filtered data based on selection mode
const filteredData = computed(() => {
  if (!selectionMode.value) return rawData.value
  return rawData.value.filter(row => {
    const flag = row['存儲標記']
    return flag === '1' || flag === 1
  })
})

// Build tree for current tab
const currentTree = computed(() => {
  const columnName = activeTab.value === 'map'
    ? '地圖集二分區'
    : '音典分區'
  return buildPartitionTree(filteredData.value, columnName)
})

// Build tree structure
const buildPartitionTree = (data, columnName) => {
  const tree = {}

  data.forEach(row => {
    const dialectName = row['簡稱'] || '未知方言點'
    const partitionStr = row[columnName] || ''

    if (!partitionStr.trim()) {
      return
    }

    const parts = partitionStr.split('-').map(p => p.trim()).filter(p => p)

    if (parts.length === 0) {
      return
    }

    let current = tree
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        if (!Array.isArray(current[part])) {
          current[part] = []
        }
        current[part].push(dialectName)
      } else {
        if (!current[part] || Array.isArray(current[part])) {
          current[part] = {}
        }
        current = current[part]
      }
    })
  })

  return tree
}

// Extract all location names from the tree
const getAllLocations = (tree) => {
  const locations = []

  const traverse = (node) => {
    if (Array.isArray(node)) {
      // Leaf nodes: location list
      locations.push(...node)
    } else if (typeof node === 'object' && node !== null) {
      // Recurse into nested tree
      Object.values(node).forEach(traverse)
    }
  }

  traverse(tree)
  return locations
}

// Toggle selection mode
const toggleSelectionMode = () => {
  selectionMode.value = !selectionMode.value
  if (!selectionMode.value) {
    selectedLocations.value.clear()
  }
}

// Toggle location selection
const toggleLocation = (location) => {
  if (selectedLocations.value.has(location)) {
    selectedLocations.value.delete(location)
  } else {
    selectedLocations.value.add(location)
  }
  // Force reactivity update
  selectedLocations.value = new Set(selectedLocations.value)

  // Emit real-time change for preview
  emit('locations-changed', Array.from(selectedLocations.value))
}

// Confirm selection
const confirmSelection = () => {
  const locations = Array.from(selectedLocations.value)
  emit('locations-selected', locations)
  closeModal()
}

// Close modal
const closeModal = () => {
  emit('update:modelValue', false)
  // Don't clear selections - let parent control via initialSelectedLocations
  selectionMode.value = false
}

// Helper function to calculate selected count recursively
const getSelectedCount = (children, selectedLocations) => {
  if (Array.isArray(children)) {
    // Leaf node: count how many items are selected
    return children.filter(item => selectedLocations.has(item)).length
  } else {
    // Branch node: sum up selected counts of all children
    return Object.values(children).reduce((sum, child) => {
      return sum + getSelectedCount(child, selectedLocations)
    }, 0)
  }
}

// PartitionTreeNode component
const PartitionTreeNode = defineComponent({
  name: 'PartitionTreeNode',
  props: {
    label: { type: String, required: true },
    children: { type: [Object, Array], required: true },
    level: { type: Number, default: 0 },
    selectionMode: { type: Boolean, default: false },
    selectedLocations: { type: Set, default: () => new Set() }
  },
  emits: ['toggle-location'],
  setup(props, { emit }) {
    const isExpanded = ref(false)
    const isLeaf = computed(() => Array.isArray(props.children))
    const childCount = computed(() => {
      if (isLeaf.value) {
        return props.children.length
      }
      return Object.keys(props.children).length
    })

    const toggleExpand = () => {
      isExpanded.value = !isExpanded.value
    }

    const handleLocationClick = (location) => {
      if (props.selectionMode) {
        emit('toggle-location', location)
      }
    }

    return { isExpanded, isLeaf, childCount, toggleExpand, handleLocationClick }
  },
  render() {
    const { label, children, level, selectionMode, selectedLocations } = this.$props
    const { isExpanded, isLeaf, childCount, toggleExpand, handleLocationClick } = this

    // Calculate selected count for this node
    const selectedCount = selectionMode ? getSelectedCount(children, selectedLocations) : 0

    return h('div', { class: 'tree-node' }, [
      // Node content
      h('div', {
        class: 'node-content',
        onClick: toggleExpand
      }, [
        // Left: icon + text + count + selected count
        h('div', { class: 'node-label' }, [
          h('span', { class: 'icon' }, isLeaf ? '📂' : '📁'),
          h('span', { class: 'text' }, label),
          h('span', { class: 'count' }, `(${childCount})`),
          // Selected count badge (only show when selection mode is active and count > 0)
          selectionMode && selectedCount > 0
            ? h('span', { class: 'selected-count' }, `✓${selectedCount}`)
            : null
        ]),

        // Right: expand button
        h('button', {
          class: ['expand-btn', { 'is-open': isExpanded }],
          onClick: (e) => {
            e.stopPropagation()
            toggleExpand()
          }
        }, [
          h('span', { class: 'plus-icon' }, '＋')
        ])
      ]),

      // Children container
      isExpanded && h('div', { class: 'children-container' }, [
        isLeaf
          ? // Leaf nodes: location list with checkboxes
            h('div', { class: 'leaf-list' },
              children.map(item =>
                h('div', {
                  class: ['leaf-item', { 'selected': selectionMode && selectedLocations.has(item) }],
                  key: item,
                  onClick: () => handleLocationClick(item)
                }, [
                  selectionMode && h('input', {
                    type: 'checkbox',
                    class: 'location-checkbox',
                    checked: selectedLocations.has(item),
                    onClick: (e) => {
                      e.stopPropagation()
                      handleLocationClick(item)
                    }
                  }),
                  h('span', { class: 'location-name' }, item)
                ])
              )
            )
          : // Recurse into nested tree
            Object.entries(children).map(([key, value]) =>
              h(PartitionTreeNode, {
                key,
                label: key,
                children: value,
                level: level + 1,
                selectionMode,
                selectedLocations,
                onToggleLocation: (location) => this.$emit('toggle-location', location)
              })
            )
      ])
    ])
  }
})
</script>

<style scoped>
/* Modal overlay */
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
  width: min(920px, 94vw);
  max-height: 88vh;
  overflow: hidden;
  background: var(--glass-lighter3);
  border: 1px solid var(--border-gray-lighter);
  border-radius: 18px;
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
}

.partition-info-modal {
  display: flex;
  flex-direction: column;
}

/* Modal header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-gray-lightest);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
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
  transition: background 0.3s ease;
}

.modal-close:hover {
  background: var(--bg-hover-strong);
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

.toggle-switch {
  position: relative;
  width: 50px;
  height: 30px;
  border-radius: 15px;
  border: none;
  background: rgba(142, 142, 147, 0.3);
  cursor: pointer;
  transition: background 0.3s ease;
}

.toggle-switch.active {
  background: #007aff;
}

.toggle-slider {
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

.toggle-switch.active .toggle-slider {
  transform: translateX(20px);
}

/* Tabs row */
.partition-tabs-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background: rgba(255, 255, 255, 0.4);
}

.partition-tabs {
  display: flex;
  gap: 10px;
}

.partition-tab-btn {
  padding: 8px 20px;
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

/* Modal body */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: rgba(255, 255, 255, 0.3);
}

.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 10px;
  transition: background 0.2s;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}

/* Loading and error states */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  color: #6e6e73;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(0, 122, 255, 0.1);
  border-top-color: #007AFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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

.partition-tree-container :deep(.location-checkbox) {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #007aff;
}

.partition-tree-container :deep(.location-name) {
  flex: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .partition-info-modal {
    width: 100%;
    max-width: 100%;
    max-height: 100dvh;
    border-radius: 20px;
  }

  .partition-tabs-row {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }


  .modal-body {
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
