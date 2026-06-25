<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="dropdown-overlay"
      @click="handleClose"
    >
      <div
        ref="dropdownPanel"
        class="dropdown-panel global-floating-panel"
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
  position: 'absolute',
  top: '0px',
  left: '0px',
  zIndex: 30000
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

  nextTick(() => {
    const triggerRect = triggerElement.getBoundingClientRect()
    const panelWidth = props.matchTriggerWidth ? triggerRect.width : (dropdownPanel.value.offsetWidth || 200)
    const panelHeight = dropdownPanel.value.offsetHeight || 300
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    let top = 0
    let left = 0

    // Calculate vertical position based on direction
    // Use fixed positioning relative to viewport (no need to add scrollY)
    if (props.direction === 'down') {
      // Default: position below trigger
      top = triggerRect.bottom

      // Check if dropdown would go off bottom of screen
      if (triggerRect.bottom + panelHeight > viewportHeight) {
        // Not enough space below, position above instead
        top = triggerRect.top - panelHeight
      }
    } else {
      // direction === 'up': position above trigger
      top = triggerRect.top - panelHeight

      // Check if dropdown would go off top of screen
      if (top < 0) {
        // Not enough space above, position below instead
        top = triggerRect.bottom
      }
    }

    // Calculate horizontal position based on align
    if (props.align === 'right') {
      // Right-align: dropdown's right edge aligns with trigger's right edge
      left = triggerRect.right - panelWidth

      // Check if dropdown would go off left edge of screen
      if (left < 0) {
        left = 0
      }
    } else {
      // Left-align: dropdown's left edge aligns with trigger's left edge
      left = triggerRect.left

      // Check if dropdown would go off right edge of screen
      if (left + panelWidth > viewportWidth) {
        left = viewportWidth - panelWidth
      }
    }

    dropdownStyle.value = {
      position: 'fixed',
      top: `${top}px`,
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

<style scoped>
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
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.search-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  background: rgba(255, 255, 255, 0.9);
}

.search-input:focus {
  border-color: rgba(0, 122, 255, 0.5);
}

.options-list {
  max-height: 40dvh;
  overflow-y: auto;
  padding: 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
  transition: background-color 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-item:hover,
.dropdown-item.focused {
  background-color: #e6f0ff;
}

.dropdown-item.active {
  background-color: #e6f0ff;
  color: #02469e;
  font-weight: bold;
}

.check-icon {
  width: 16px;
  text-align: center;
  font-weight: 700;
  color: #02469e;
}

.empty-message {
  padding: 20px;
  text-align: center;
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
}

</style>
