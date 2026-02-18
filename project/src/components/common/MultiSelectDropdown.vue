<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="dropdown-overlay"
      @click="handleClose"
    >
      <div
        ref="dropdownPanel"
        class="dropdown-panel"
        :style="dropdownStyle"
        @click.stop
      >
        <!-- Select All / Deselect All -->
        <div
          class="dropdown-item select-all-item"
          :class="{ active: isAllSelected }"
          @click="toggleSelectAll"
        >
          <span>{{ isAllSelected ? '☑' : '☐' }}</span>
          {{ isAllSelected ? '取消全選' : '全選' }}
        </div>

        <div class="dropdown-divider"></div>

        <!-- Search Input -->
        <div class="search-wrapper" v-if="options.length > 5">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="搜索..."
            class="search-input"
            @click.stop
          />
        </div>

        <!-- Options List -->
        <div class="options-list">
          <div
            class="dropdown-item"
            v-for="option in filteredOptions"
            :key="option.value"
            :class="{ active: isSelected(option.value) }"
            @click="toggleOption(option.value)"
          >
            <span class="check-icon">{{ isSelected(option.value) ? '✓' : '' }}</span>
            {{ option.label }}
          </div>

          <div v-if="filteredOptions.length === 0" class="empty-message">
            無匹配結果
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
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
    default: '請選擇'
  },
  disabled: {
    type: Boolean,
    default: false
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
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const isOpen = ref(true)
const searchQuery = ref('')
const dropdownPanel = ref(null)
const dropdownStyle = ref({
  position: 'absolute',
  top: '0px',
  left: '0px',
  zIndex: 99999
})

// Filtered options based on search
const filteredOptions = computed(() => {
  if (!searchQuery.value.trim()) return props.options

  const query = searchQuery.value.toLowerCase()
  return props.options.filter(opt =>
    opt.label.toLowerCase().includes(query)
  )
})

// Check if all options are selected
const isAllSelected = computed(() => {
  return props.options.length > 0 &&
         props.options.every(opt => props.modelValue.includes(opt.value))
})

// Check if an option is selected
const isSelected = (value) => {
  return props.modelValue.includes(value)
}

// Toggle select all
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    emit('update:modelValue', [])
  } else {
    emit('update:modelValue', props.options.map(opt => opt.value))
  }
}

// Toggle single option
const toggleOption = (value) => {
  const newValue = [...props.modelValue]
  const index = newValue.indexOf(value)

  if (index > -1) {
    newValue.splice(index, 1)
  } else {
    newValue.push(value)
  }

  emit('update:modelValue', newValue)
}

// Close dropdown
const handleClose = () => {
  isOpen.value = false
  emit('close')
}

// Position dropdown
const updatePosition = () => {
  if (!props.triggerEl || !dropdownPanel.value) return

  nextTick(() => {
    const triggerRect = props.triggerEl.getBoundingClientRect()
    const panelWidth = dropdownPanel.value.offsetWidth || 200
    const panelHeight = dropdownPanel.value.offsetHeight || 300
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    let top = 0
    let left = 0

    // Calculate vertical position based on direction
    if (props.direction === 'down') {
      // Default: position below trigger
      top = triggerRect.bottom + window.scrollY

      // Check if dropdown would go off bottom of screen
      if (triggerRect.bottom + panelHeight > viewportHeight) {
        // Not enough space below, position above instead
        top = triggerRect.top + window.scrollY - panelHeight
      }
    } else {
      // direction === 'up': position above trigger
      top = triggerRect.top + window.scrollY - panelHeight

      // Check if dropdown would go off top of screen
      if (top < 0) {
        // Not enough space above, position below instead
        top = triggerRect.bottom + window.scrollY
      }
    }

    // Calculate horizontal position based on align
    if (props.align === 'right') {
      // Right-align: dropdown's right edge aligns with trigger's right edge
      left = triggerRect.right + window.scrollX - panelWidth

      // Check if dropdown would go off left edge of screen
      if (left < 0) {
        left = 0
      }
    } else {
      // Left-align: dropdown's left edge aligns with trigger's left edge
      left = triggerRect.left + window.scrollX

      // Check if dropdown would go off right edge of screen
      if (left + panelWidth > viewportWidth) {
        left = viewportWidth - panelWidth
      }
    }

    dropdownStyle.value = {
      position: 'absolute',
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 99999,
      maxHeight: props.maxHeight
    }
  })
}

onMounted(() => {
  updatePosition()
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
</script>

<style scoped>
.dropdown-overlay {
  position: fixed;
  inset: 0;
  z-index: 99998;
  background: transparent;
}

.dropdown-panel {
  min-width: 200px;
  max-width: 300px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(200, 200, 200, 0.3);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
  padding: 4px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 8px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
  transition: background 0.2s ease;
}

.dropdown-item:hover {
  background: rgba(0, 122, 255, 0.08);
}

.dropdown-item.active {
  background: rgba(0, 122, 255, 0.12);
  color: #007aff;
  font-weight: 500;
}

.select-all-item {
  font-weight: 600;
  color: rgba(0, 0, 0, 0.75);
}

.check-icon {
  width: 16px;
  text-align: center;
  font-weight: 700;
  color: #007aff;
}

.dropdown-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.08);
  margin: 4px 8px;
}

.empty-message {
  padding: 20px;
  text-align: center;
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
}

/* Scrollbar styling */
.options-list::-webkit-scrollbar {
  width: 6px;
}

.options-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.options-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
}
</style>

