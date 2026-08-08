<template>
  <div class="key-dropdown-group">
    <div v-for="key in selectedKeys" :key="key" class="key-value-dropdown">
      <div class="dropdown-wrapper" :ref="(el) => setTriggerRef(el, key)">
        <input
          type="text"
          :value="getInputDisplayValue(key)"
          @input="handleDropdownInput($event, key)"
          @focus="handleInputFocus(key)"
          @blur="handleInputBlur(key)"
          @click.stop
          :placeholder="$t('query.tab3.inputPlaceholder', { key })"
          class="dropdown-input"
        />
        <span class="arrow-trigger" @click.stop="toggleDropdown(key)">
          <span class="arrow-icon">▼</span>
        </span>
      </div>

      <Teleport to="body">
        <div
          v-if="dropdownOpen === key"
          class="dropdown-panel"
          :style="dropdownStyle"
        >
          <!-- Select All -->
          <div
            v-if="showSelectAll"
            class="dropdown-item select-all-item"
            :class="{ active: isAllSelected(key) }"
            @click="toggleSelectAll(key)"
          >
            <span v-if="isAllSelected(key)"><InlineIcon icon="☑" /></span>
            <span v-else><InlineIcon icon="☐" /></span>
            {{ $t('query.tab2.selectAll') }}
          </div>

          <div v-if="showSelectAll" class="dropdown-divider"></div>

          <!-- Individual Options -->
          <div
            class="dropdown-item"
            v-for="value in getFilteredOptions(key)"
            :key="value"
            :class="{ active: isSelected(value, key) }"
            @click="selectValue(value, key)"
          >
            <span class="check-icon">{{ isSelected(value, key) ? '✓' : '' }}</span>
            {{ value }}
          </div>
        </div>
      </Teleport>

      <div class="key-name">
        <strong class="key-name-text">{{ key }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup>
import InlineIcon from '@/components/common/InlineIcon.vue'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { S2T_T2S_MAPPING } from '@/main/config'

const { t } = useI18n()

const props = defineProps({
  selectedKeys: {
    type: Array,
    required: true
  },
  modelValue: {
    type: Object,
    default: () => ({})
  },
  keyValueMap: {
    type: Object,
    required: true
  },
  showSelectAll: {
    type: Boolean,
    default: true
  },
  enableSearch: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue'])

// State
const triggerRefs = ref({})
const dropdownOpen = ref(null)
const currentActiveKey = ref(null)
const dropdownInputs = ref({})
const isEditing = ref({})

// Set trigger ref for positioning
const setTriggerRef = (el, key) => {
  if (el) {
    triggerRefs.value[key] = el
  }
}

// Watch selectedKeys to initialize inputs
watch(() => props.selectedKeys, (newKeys) => {
  newKeys.forEach(key => {
    if (!(key in dropdownInputs.value)) {
      dropdownInputs.value[key] = ''
    }
    if (!(key in isEditing.value)) {
      isEditing.value[key] = false
    }
  })
}, { immediate: true, deep: true })

// Dropdown positioning
const dropdownStyle = computed(() => {
  if (!dropdownOpen.value) return {}
  const triggerEl = triggerRefs.value[dropdownOpen.value]
  if (!triggerEl) return {}
  const rect = triggerEl.getBoundingClientRect()
  return {
    position: 'fixed',
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    zIndex: 99999
  }
})

// Get input display value
function getInputDisplayValue(key) {
  if (isEditing.value[key]) {
    return dropdownInputs.value[key] || ''
  }
  return getDisplayText(key)
}

// Handle input focus
function handleInputFocus(key) {
  isEditing.value[key] = true
  dropdownInputs.value[key] = ''
}

// Handle input blur
function handleInputBlur(key) {
  setTimeout(() => {
    isEditing.value[key] = false
    dropdownInputs.value[key] = ''
  }, 200)
}

// Handle input change
function handleDropdownInput(event, key) {
  const inputValue = event.target.value
  dropdownInputs.value[key] = inputValue

  if (inputValue.trim()) {
    if (dropdownOpen.value !== key) {
      toggleDropdown(key)
    }
  } else {
    if (dropdownOpen.value === key) {
      dropdownOpen.value = null
    }
  }
}

// Get filtered options
function getFilteredOptions(key) {
  const rawInput = (dropdownInputs.value[key] || '').trim()
  const allOptions = props.keyValueMap[key] || []

  if (!rawInput) return allOptions

  const transformedInput = rawInput.split('').map(char => {
    return S2T_T2S_MAPPING[char] || char
  }).join('')

  return allOptions.filter(opt => {
    return opt.includes(rawInput) || opt.includes(transformedInput)
  })
}

// Toggle dropdown
function toggleDropdown(key) {
  if (dropdownOpen.value === key) {
    dropdownOpen.value = null
  } else {
    dropdownOpen.value = key
  }
}

// Select value
function selectValue(value, key) {
  const newValueMap = { ...props.modelValue }
  if (!Array.isArray(newValueMap[key])) {
    newValueMap[key] = []
  }
  const list = newValueMap[key]
  const index = list.indexOf(value)
  if (index > -1) {
    list.splice(index, 1)
  } else {
    list.push(value)
  }
  emit('update:modelValue', newValueMap)
}

// Toggle select all
function toggleSelectAll(key) {
  const allOptions = props.keyValueMap[key] || []
  const currentSelected = props.modelValue[key] || []
  const newValueMap = { ...props.modelValue }
  if (currentSelected.length === allOptions.length) {
    newValueMap[key] = []
  } else {
    newValueMap[key] = [...allOptions]
  }
  emit('update:modelValue', newValueMap)
}

// Check if value is selected
function isSelected(value, key) {
  const list = props.modelValue[key]
  return Array.isArray(list) && list.includes(value)
}

// Check if all selected
function isAllSelected(key) {
  const all = props.keyValueMap[key] || []
  const current = props.modelValue[key] || []
  return all.length > 0 && all.length === current.length
}

// Get display text
function getDisplayText(key) {
  const list = props.modelValue[key]
  if (!list || list.length === 0) return ''

  const allOptions = props.keyValueMap[key] || []
  if (allOptions.length > 0 && list.length === allOptions.length) {
    return t('query.tab2.selectAll')
  }

  if (list.length > 3) {
    return `${list.slice(0, 3).join(', ')}...`
  }
  return list.join(', ')
}

// Click outside handler
function onClickOutside(event) {
  const isInsideTrigger = Object.values(triggerRefs.value)
    .some(el => el?.contains(event.target))
  const isInsidePanel = event.target.closest('.dropdown-panel')
  if (!isInsideTrigger && !isInsidePanel) {
    dropdownOpen.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$dropdown-item-padding: 8px 16px;
$dropdown-font-size: 14px;
$transition-duration: 0.2s;
$dropdown-selected-bg: var(--bg-blue-light);
$dropdown-selected-color: var(--color-primary-hover);

.key-dropdown-group {
  display: flex;
  flex-wrap: wrap;
  column-gap: 30px;
}

.key-value-dropdown {
  display: flex;
  flex-direction: row;
  width: 135px;
  margin-top: 10px;
}

.key-name {
  align-self: center;

  &-text {
    color: var(--color-primary-hover);
  }
}

.dropdown-wrapper {
  display: flex;
  align-items: stretch;
  overflow: hidden;
  background: var(--glass-30);
  border: 1px solid var(--color-primary-medium);
  border-radius: var(--radius-sm2);
}

.dropdown-input {
  flex: 1;
  width: 75px;
  padding: 8px 0;
  color: var(--text-dark);
  font-size: $dropdown-font-size;
  text-align: center;
  background: transparent;
  border: none;
  outline: none;

  &::placeholder {
    color: var(--text-tertiary);
    font-size: 12px;
    text-align: center;
  }
}

.arrow-trigger {
  display: flex;
  align-items: center;
  justify-content: start;
  min-width: 36px;
  max-width: 36px;
  cursor: pointer;
  user-select: none;
  background: var(--color-primary-medium);
  border-left: 1px solid var(--glass-30);
  transition: all $transition-duration ease;

  &:hover {
    background: var(--color-primary-medium2);
  }

  &:active {
    transform: scale(0.95);
  }
}

.arrow-icon {
  margin-left: 8px;
  color: white;
  font-size: $dropdown-font-size;
  font-weight: bold;
}

/*
 * dropdown-panel 通过 Teleport 挂载到 body，
 * 因此必须保持为顶层选择器，不能嵌套到组件容器中。
 */
.dropdown-panel {
  position: absolute;
  z-index: 1000;
  min-width: 80px;
  max-height: 40dvh;
  padding: 6px 0;
  overflow: auto;
  background: var(--glass-90);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.dropdown-item {
  padding: $dropdown-item-padding;
  overflow: hidden;
  font-size: $dropdown-font-size;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: background-color $transition-duration;

  &:hover {
    background-color: $dropdown-selected-bg;
  }

  &.active {
    color: $dropdown-selected-color;
    font-weight: bold;
    background-color: $dropdown-selected-bg;
  }
}

.select-all-item {
  color: var(--text-tertiary);
  font-size: 0.9em;
  border-bottom: 1px solid var(--bg-light);
}

.dropdown-divider {
  height: 1px;
  margin: 2px 0;
  background: var(--border-divider);
}

.check-icon {
  display: inline-block;
  width: 16px;
}
</style>
