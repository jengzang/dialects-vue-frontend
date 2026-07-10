<template>
  <div class="simple-select-dropdown" :style="containerStyle">
    <div
      ref="triggerRef"
      class="select-trigger global-select-trigger"
      :class="{ 'is-open': isOpen, 'is-disabled': disabled }"
      @click="handleToggle"
    >
      <span class="select-label">{{ displayLabel }}</span>
      <span class="select-arrow">▾</span>
    </div>

    <SimpleDropdown
      v-if="isOpen"
      :modelValue="modelValue"
      :options="options"
      :triggerEl="triggerRef"
      :searchable="searchable"
      :searchPlaceholder="searchPlaceholder || $t('common.components.dropdown.searchPlaceholder')"
      :placeholder="placeholder || $t('common.components.dropdown.placeholder')"
      :matchTriggerWidth="matchTriggerWidth"
      @update:modelValue="handleUpdate"
      @close="handleClose"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SimpleDropdown from './SimpleDropdown.vue'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: null
  },
  options: {
    type: Array,
    required: true,
    // Format: [{ label: 'Label', value: 'value' }]
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
  matchTriggerWidth: {
    type: Boolean,
    default: false
  },
  width: {
    type: String,
    default: null  // e.g., '80px', '200px', 'auto', null means 100%
  }
})

const emit = defineEmits(['update:modelValue'])

// State
const isOpen = ref(false)
const triggerRef = ref(null)

// Computed
const displayLabel = computed(() => {
  // Only show placeholder if modelValue is null or undefined
  // Empty string ('') is a valid value
  if (props.modelValue === null || props.modelValue === undefined) {
    return props.placeholder || t('common.components.dropdown.placeholder')
  }
  const option = props.options.find(opt => opt.value === props.modelValue)
  return option?.label || props.placeholder || t('common.components.dropdown.placeholder')
})

const containerStyle = computed(() => {
  if (props.width) {
    return { width: props.width }
  }
  return {}
})

// Methods
const handleToggle = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

const handleUpdate = (value) => {
  emit('update:modelValue', value)
}

const handleClose = () => {
  isOpen.value = false
}

const openDropdown = () => {
  if (props.disabled) return
  isOpen.value = true
}

const closeDropdown = () => {
  isOpen.value = false
}

defineExpose({
  openDropdown,
  closeDropdown
})
</script>

<style scoped lang="scss">
$arrow-transition: 0.2s ease;

.simple-select-dropdown {
  position: relative;
  display: inline-block;
}

.select-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-arrow {
  margin-left: 8px;
  color: var(--text-tertiary);
  font-size: 12px;
  transition: transform $arrow-transition;
}

.select-trigger {
  &.is-open {
    .select-arrow {
      transform: rotate(180deg);
    }
  }
}
</style>
