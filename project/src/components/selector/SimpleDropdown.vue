<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="dropdown-overlay"
      @click="handleClose"
    >
      <div
        ref="dropdownPanel"
        class="dropdown-panel floating-panel"
        :style="dropdownStyle"
        @click.stop
        @keydown="handleKeydown"
        tabindex="0"
      >
        <!-- Search Input -->
        <div class="search-wrapper" v-if="searchable">
          <input
            ref="searchInput"
            type="text"
            v-model="searchQuery"
            :placeholder="searchPlaceholder || $t('common.components.dropdown.searchPlaceholder')"
            class="search-input"
            @click.stop
          />
        </div>

        <!-- Options List -->
        <div class="options-list ui-scrollbar" ref="optionsList">
          <div
            class="dropdown-item"
            v-for="(option, index) in filteredOptions"
            :key="option.value"
            :class="{
              active: isSelected(option.value),
              focused: focusedIndex === index
            }"
            @click="selectOption(option.value)"
            @mouseenter="focusedIndex = index"
          >
            <span class="check-icon">{{ isSelected(option.value) ? '✓' : '' }}</span>
            {{ option.label }}
          </div>

          <div v-if="filteredOptions.length === 0" class="empty-message">
            {{ $t('common.components.dropdown.noResults') }}
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: null
  },
  options: {
    type: Array,
    required: true
  },
  triggerEl: {
    type: Object,
    default: null
  },
  placeholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  searchable: {
    type: Boolean,
    default: false
  },
  searchPlaceholder: {
    type: String,
    default: ''
  },
  maxHeight: {
    type: String,
    default: '40dvh'
  },
  align: {
    type: String,
    default: 'left',
    validator: (value) => ['left', 'right'].includes(value)
  },
  direction: {
    type: String,
    default: 'down',
    validator: (value) => ['up', 'down'].includes(value)
  },
  matchTriggerWidth: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const isOpen = ref(true)
const searchQuery = ref('')
const dropdownPanel = ref(null)
const searchInput = ref(null)
const optionsList = ref(null)
const focusedIndex = ref(-1)
const dropdownStyle = ref({
  position: 'fixed',
  top: '0px',
  left: '0px',
  zIndex: 30000,
  // 首屏就带上高度上限：否则第一次 updatePosition 量到的是未封顶的完整列表高度，
  // 翻转判定会被撑爆（视口再高也会判成"下方放不下"）
  maxHeight: props.maxHeight
})

// Filtered options based on search
const filteredOptions = computed(() => {
  if (!searchQuery.value.trim()) return props.options

  const query = searchQuery.value.toLowerCase()
  return props.options.filter(opt =>
    opt.label.toLowerCase().includes(query)
  )
})

// Check if an option is selected
const isSelected = (value) => {
  return props.modelValue === value
}

// Select option and close dropdown
const selectOption = (value) => {
  emit('update:modelValue', value)
  handleClose()
}

// Close dropdown
const handleClose = () => {
  isOpen.value = false
  emit('close')
}

// Keyboard navigation
const handleKeydown = (e) => {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      focusedIndex.value = Math.min(focusedIndex.value + 1, filteredOptions.value.length - 1)
      scrollToFocused()
      break
    case 'ArrowUp':
      e.preventDefault()
      focusedIndex.value = Math.max(focusedIndex.value - 1, 0)
      scrollToFocused()
      break
    case 'Enter':
      e.preventDefault()
      if (focusedIndex.value >= 0 && focusedIndex.value < filteredOptions.value.length) {
        selectOption(filteredOptions.value[focusedIndex.value].value)
      }
      break
    case 'Escape':
      e.preventDefault()
      handleClose()
      break
  }
}

// Scroll to focused item
const scrollToFocused = () => {
  nextTick(() => {
    if (!optionsList.value) return
    const items = optionsList.value.querySelectorAll('.dropdown-item')
    if (items[focusedIndex.value]) {
      items[focusedIndex.value].scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  })
}

// Position dropdown
const updatePosition = () => {
  // Get the actual DOM element from ref or use directly if it's already a DOM element
  const triggerElement = props.triggerEl?.value || props.triggerEl

  if (!triggerElement || !dropdownPanel.value) return

  requestAnimationFrame(() => {
    const triggerRect = triggerElement.getBoundingClientRect()
    const panelWidth = props.matchTriggerWidth ? triggerRect.width : (dropdownPanel.value.offsetWidth || 200)
    const panelHeight = dropdownPanel.value.offsetHeight || 60
    // 用 clientHeight/clientWidth 而非 inner*：后者把滚动条和固定栏也算进可用空间
    const viewportHeight = document.documentElement.clientHeight
    const viewportWidth = document.documentElement.clientWidth

    const spaceBelow = viewportHeight - triggerRect.bottom
    const spaceAbove = triggerRect.top

    // 双侧判定：哪边放得下就放哪边；只有一侧放得下就翻到那侧；两侧都放不下才挑空间大的一侧，
    // 并由下面的夹取保证面板整体留在视口内
    let placeAbove
    if (props.direction === 'down') {
      if (spaceBelow >= panelHeight) placeAbove = false
      else if (spaceAbove >= panelHeight) placeAbove = true
      else placeAbove = spaceAbove > spaceBelow
    } else {
      if (spaceAbove >= panelHeight) placeAbove = true
      else if (spaceBelow >= panelHeight) placeAbove = false
      else placeAbove = spaceAbove > spaceBelow
    }

    // Calculate horizontal position based on align
    let left = triggerRect.left
    if (props.align === 'right') {
      // Right-align: dropdown's right edge aligns with trigger's right edge
      left = triggerRect.right - panelWidth

      // Check if dropdown would go off left edge of screen
      if (left < 0) {
        left = 0
      }
    } else if (left + panelWidth > viewportWidth) {
      // Check if dropdown would go off right edge of screen
      left = viewportWidth - panelWidth
    }

    let topStyle
    let bottomStyle = 'auto'
    if (placeAbove) {
      // 上翻时以底边对齐 trigger 顶边：面板高度变化（如搜索过滤）时不会脱开
      topStyle = 'auto'
      bottomStyle = `${(viewportHeight - triggerRect.top) - Math.max(0, panelHeight - triggerRect.top)}px`
    } else {
      // 夹取到视口内，避免面板被裁掉
      topStyle = `${Math.max(0, Math.min(triggerRect.bottom, viewportHeight - panelHeight))}px`
    }

    dropdownStyle.value = {
      position: 'fixed',
      top: topStyle,
      bottom: bottomStyle,
      left: `${left}px`,
      zIndex: 30000,
      maxHeight: props.maxHeight,
      ...(props.matchTriggerWidth ? {
        width: `${triggerRect.width}px`,
        maxWidth: 'none'  // Remove max-width constraint when matching trigger width
      } : {})
    }
  })
}

// Initialize focused index to current selection
const initializeFocusedIndex = () => {
  const currentIndex = filteredOptions.value.findIndex(opt => opt.value === props.modelValue)
  focusedIndex.value = currentIndex >= 0 ? currentIndex : 0
}

onMounted(() => {
  updatePosition()
  // Safari 布局延迟补偿：二次矫正位置
  setTimeout(() => updatePosition(), 0)
  initializeFocusedIndex()

  // Focus search input if searchable, otherwise focus the panel for keyboard navigation
  nextTick(() => {
    if (props.searchable && searchInput.value) {
      searchInput.value.focus()
    } else if (dropdownPanel.value) {
      dropdownPanel.value.focus()
    }
  })

  window.addEventListener('resize', updatePosition)
  window.addEventListener('scroll', updatePosition, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePosition)
  window.removeEventListener('scroll', updatePosition, true)
})

watch(() => props.triggerEl, () => {
  updatePosition()
})

watch(searchQuery, () => {
  // Reset focused index when search changes
  focusedIndex.value = 0
})
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;
@use './selector' as *;

$primary-blue: var(--color-primary-hover);
$active-background: var(--bg-blue-light);
$text-primary: var(--text-primary);
$text-muted: var(--text-muted);
$divider-color: var(--border-light);
$transition-fast: 0.2s;

/*
 * 下拉层通过 Teleport 渲染到 body，
 * 因此保持为顶层选择器。
 */
.dropdown-overlay {
  position: fixed;
  inset: 0;
  z-index: 30000;
  background: transparent;
}

.dropdown-panel {
  min-width: 80px;
  max-width: 300px;
}

.search-wrapper {
  padding: 8px 12px;
  border-bottom: 1px solid $divider-color;
}

.search-input {
  // width: 100%;
  padding: 6px 10px;
  color: $text-primary;
  font-size: 13px;
  background: var(--bg-white);
  border: 1px solid var(--border-control);
  border-radius: var(--radius-sm);
  outline: none;

  &:focus {
    border-color: rgba(var(--color-primary-rgb), 0.5);
  }

  &::placeholder {
    color: $text-muted;
  }
}

.options-list {
  max-height: 40dvh;
  padding: 0;
  overflow-y: auto;
}

.dropdown-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 16px;
  overflow: hidden;
  color: $text-primary;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color $transition-fast;

  &:hover,
  &.focused {
    background-color: $active-background;
  }

  &.active {
    color: $primary-blue;
    font-weight: bold;
    background-color: $active-background;
  }
}

.check-icon {
  width: 16px;
  color: $primary-blue;
  font-weight: 700;
  text-align: center;
}

.empty-message {
  padding: 20px;
  color: $text-muted;
  font-size: 13px;
  text-align: center;
}
</style>
