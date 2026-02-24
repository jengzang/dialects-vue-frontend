<template>
  <div class="filterable-select" :class="{ disabled }">
    <!-- Level Selector (optional) -->
    <select
      v-if="showLevelSelector"
      :value="level"
      @change="$emit('update:level', $event.target.value)"
      class="level-select"
    >
      <option value="city">城市</option>
      <option value="county">區縣</option>
      <option value="township">鄉鎮</option>
    </select>

    <!-- Input + Dropdown Trigger -->
    <div class="dropdown-wrapper" ref="triggerRef">
      <input
        v-model="inputValue"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
        :placeholder="placeholder"
        :disabled="disabled"
        class="select-input"
      />
      <button
        @click.stop="toggleDropdown"
        :disabled="disabled"
        class="dropdown-trigger"
      >
        <span class="arrow-icon">▼</span>
      </button>
    </div>

    <!-- Dropdown Panel (Teleported to body) -->
    <Teleport to="body">
      <div
        v-if="dropdownOpen"
        ref="dropdownRef"
        class="select-dropdown"
        :style="dropdownStyle"
        @click.stop
      >
        <!-- Loading State -->
        <div v-if="loading" class="dropdown-loading">
          <div class="spinner"></div>
          <span>載入中...</span>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredOptions.length === 0" class="dropdown-empty">
          {{ inputValue ? '無匹配結果' : '無可用選項' }}
        </div>

        <!-- Options List -->
        <div v-else class="dropdown-options">
          <div
            v-for="(option, index) in filteredOptions"
            :key="option.name"
            @click="selectOption(option)"
            @mouseenter="highlightedIndex = index"
            :class="[
              'dropdown-option',
              {
                selected: modelValue === option.name,
                highlighted: highlightedIndex === index
              }
            ]"
          >
            <span class="option-name">{{ option.name }}</span>
            <span v-if="showCounts && option.village_count" class="option-count">
              {{ option.village_count }}村
            </span>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { getRegionList } from '@/api'
import { showError } from '@/utils/message.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  level: { type: String, default: 'city' },
  parent: { type: String, default: null },
  placeholder: { type: String, default: '請選擇或輸入' },
  showCounts: { type: Boolean, default: true },
  showLevelSelector: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'update:level'])

// State
const inputValue = ref(props.modelValue)
const dropdownOpen = ref(false)
const loading = ref(false)
const options = ref([])
const filteredOptions = ref([])
const highlightedIndex = ref(0)
const triggerRef = ref(null)
const dropdownRef = ref(null)
const dropdownStyle = ref({})
let blurTimeout = null

// Load options from API
const loadOptions = async () => {
  loading.value = true
  try {
    const regions = await getRegionList(props.level, props.parent)
    options.value = regions || []
    filterOptions()
  } catch (error) {
    console.error('Failed to load regions:', error)
    showError('載入區域列表失敗')
    options.value = []
  } finally {
    loading.value = false
  }
}

// Filter options based on input
const filterOptions = () => {
  const query = inputValue.value.toLowerCase().trim()
  if (!query) {
    filteredOptions.value = options.value
  } else {
    filteredOptions.value = options.value.filter(option =>
      option.name.toLowerCase().includes(query)
    )
  }
  highlightedIndex.value = 0
}

// Handle input typing
const handleInput = () => {
  filterOptions()
  if (!dropdownOpen.value) {
    openDropdown()
  }
}

// Handle input focus
const handleFocus = () => {
  if (!props.disabled) {
    openDropdown()
  }
}

// Handle input blur (with delay for dropdown clicks)
const handleBlur = () => {
  blurTimeout = setTimeout(() => {
    closeDropdown()
  }, 200)
}

// Handle keyboard navigation
const handleKeydown = (event) => {
  if (!dropdownOpen.value && (event.key === 'ArrowDown' || event.key === 'Enter')) {
    event.preventDefault()
    openDropdown()
    return
  }

  if (!dropdownOpen.value) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      highlightedIndex.value = Math.min(
        highlightedIndex.value + 1,
        filteredOptions.value.length - 1
      )
      scrollToHighlighted()
      break

    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
      scrollToHighlighted()
      break

    case 'Enter':
      event.preventDefault()
      if (filteredOptions.value[highlightedIndex.value]) {
        selectOption(filteredOptions.value[highlightedIndex.value])
      }
      break

    case 'Escape':
      event.preventDefault()
      closeDropdown()
      break
  }
}

// Scroll highlighted option into view
const scrollToHighlighted = () => {
  nextTick(() => {
    const dropdown = dropdownRef.value
    if (!dropdown) return

    const highlighted = dropdown.querySelector('.dropdown-option.highlighted')
    if (highlighted) {
      highlighted.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  })
}

// Toggle dropdown
const toggleDropdown = () => {
  if (dropdownOpen.value) {
    closeDropdown()
  } else {
    openDropdown()
  }
}

// Open dropdown
const openDropdown = () => {
  if (props.disabled) return
  dropdownOpen.value = true
  positionDropdown()
}

// Close dropdown
const closeDropdown = () => {
  dropdownOpen.value = false
}

// Position dropdown below input
const positionDropdown = async () => {
  await nextTick()
  if (!triggerRef.value || !dropdownRef.value) return

  const rect = triggerRef.value.getBoundingClientRect()
  const dropdownHeight = dropdownRef.value.offsetHeight
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top

  // Position below if enough space, otherwise above
  const positionBelow = spaceBelow >= dropdownHeight || spaceBelow > spaceAbove

  dropdownStyle.value = {
    position: 'absolute',
    top: positionBelow
      ? `${rect.bottom + window.scrollY + 4}px`
      : `${rect.top + window.scrollY - dropdownHeight - 4}px`,
    left: `${rect.left + window.scrollX}px`,
    width: `${rect.width}px`,
    maxHeight: '300px',
    zIndex: 9999
  }
}

// Select an option
const selectOption = (option) => {
  inputValue.value = option.name
  emit('update:modelValue', option.name)
  closeDropdown()
}

// Click outside handler
const handleClickOutside = (event) => {
  if (
    dropdownOpen.value &&
    triggerRef.value &&
    !triggerRef.value.contains(event.target) &&
    dropdownRef.value &&
    !dropdownRef.value.contains(event.target)
  ) {
    closeDropdown()
  }
}

// Watchers
watch(() => props.level, () => {
  loadOptions()
})

watch(() => props.parent, () => {
  loadOptions()
})

watch(() => props.modelValue, (newValue) => {
  inputValue.value = newValue
})

// Lifecycle
onMounted(() => {
  loadOptions()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (blurTimeout) clearTimeout(blurTimeout)
})
</script>

<style scoped>
.filterable-select {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filterable-select.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.level-select {
  flex: 0 0 100px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.level-select:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(255, 255, 255, 0.7);
}

.dropdown-wrapper {
  flex: 1;
  display: flex;
  position: relative;
  border: 2px solid var(--color-primary-hover);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  overflow: hidden;
  transition: all 0.3s ease;
}

.dropdown-wrapper:focus-within {
  border-color: var(--color-primary);
  background: rgba(255, 255, 255, 0.7);
}

.select-input {
  flex: 1;
  padding: 10px 12px;
  border: none;
  background: transparent;
  font-size: 14px;
  outline: none;
}

.dropdown-trigger {
  flex: 0 0 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: var(--color-primary);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  padding:10px 4px;
  border-radius: 20px;
}

.dropdown-trigger:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.dropdown-trigger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.arrow-icon {
  font-size: 12px;
}

/* Dropdown Panel */
.select-dropdown {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.dropdown-loading,
.dropdown-empty {
  padding: 20px;
  text-align: center;
  color: var(--text-secondary);
}

.dropdown-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(74, 144, 226, 0.2);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.dropdown-options {
  max-height: 300px;
  overflow-y: auto;
}

.dropdown-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.dropdown-option:hover,
.dropdown-option.highlighted {
  background: rgba(74, 144, 226, 0.1);
}

.dropdown-option.selected {
  background: rgba(74, 144, 226, 0.2);
  font-weight: 600;
}

.option-name {
  flex: 1;
  color: var(--text-primary);
}

.option-count {
  flex: 0 0 auto;
  font-size: 12px;
  color: var(--color-primary);
  font-weight: 600;
  margin-left: 8px;
}

/* Scrollbar styling */
.dropdown-options::-webkit-scrollbar {
  width: 6px;
}

.dropdown-options::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
}

.dropdown-options::-webkit-scrollbar-thumb {
  background: rgba(74, 144, 226, 0.3);
  border-radius: 3px;
}

.dropdown-options::-webkit-scrollbar-thumb:hover {
  background: rgba(74, 144, 226, 0.5);
}
</style>
