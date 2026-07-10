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
          {{ isAllSelected ? $t('common.components.multiSelect.deselectAll') : $t('common.components.multiSelect.selectAll') }}
        </div>

        <div class="dropdown-divider"></div>

        <!-- Search Input -->
        <div class="search-wrapper" v-if="options.length > 5">
          <input
            type="text"
            v-model="searchQuery"
            :placeholder="$t('common.components.multiSelect.searchPlaceholder')"
            class="search-input"
            @click.stop
          />
        </div>

        <!-- Options List -->
        <div class="options-list ui-scrollbar">
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
            {{ $t('common.components.multiSelect.noResults') }}
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
    default: ''
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
  zIndex: 30001
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
      zIndex: 30001,
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


$primary-blue: var(--color-primary-hover);
$selected-background: var(--bg-blue-light);
$text-primary: rgba(0, 0, 0, 0.85);
$text-secondary: rgba(0, 0, 0, 0.75);
$text-muted: rgba(0, 0, 0, 0.45);
$divider-color: rgba(0, 0, 0, 0.08);

$transition-fast: 0.2s;

@mixin glass-blur($blur, $saturation: null) {
  @if $saturation {
    backdrop-filter: blur($blur) saturate($saturation);
    -webkit-backdrop-filter: blur($blur) saturate($saturation);
  } @else {
    backdrop-filter: blur($blur);
    -webkit-backdrop-filter: blur($blur);
  }
}

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
  display: flex;
  flex-direction: column;
  min-width: 80px;
  max-width: 300px;
  padding: 6px 0;
  overflow: hidden;
  background: var(--glass-90);
  border: 1px solid rgba(200, 200, 200, 0.3);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

  @include glass-blur(12px);
}

.search-wrapper {
  padding: 8px 12px;
  border-bottom: 1px solid $divider-color;
}

.search-input {
  width: 100%;
  padding: 6px 10px;
  font-size: 13px;
  background: var(--glass-90);
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  outline: none;

  &:focus {
    border-color: rgba(0, 122, 255, 0.5);
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

  &:hover {
    background-color: $selected-background;
  }

  &.active {
    color: $primary-blue;
    font-weight: bold;
    background-color: $selected-background;
  }
}

.select-all-item {
  color: $text-secondary;
  font-weight: 600;
  border-bottom: 1px solid var(--bg-light);
}

.check-icon {
  width: 16px;
  color: $primary-blue;
  font-weight: 700;
  text-align: center;
}

.dropdown-divider {
  height: 1px;
  margin: 4px 8px;
  background: $divider-color;
}

.empty-message {
  padding: 20px;
  color: $text-muted;
  font-size: 13px;
  text-align: center;
}

