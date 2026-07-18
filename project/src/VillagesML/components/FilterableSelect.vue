<template>
  <div class="filterable-select" :class="{ disabled }">
    <!-- Level Selector (optional) -->
    <div v-if="showLevelSelector" class="level-selector-wrapper">
      <div
        ref="levelTriggerRef"
        class="level-select"
        @click="toggleLevelDropdown"
      >
        {{ levelLabel }}
        <span class="arrow-icon">▾</span>
      </div>

      <SimpleDropdown
        v-if="isLevelDropdownOpen"
        v-model="internalLevel"
        :options="levelOptions"
        :triggerEl="levelTriggerRef"
        @close="isLevelDropdownOpen = false"
      />
    </div>

    <!-- Input + Dropdown Trigger -->
    <div class="dropdown-wrapper" ref="triggerRef">
      <input
        v-model="inputValue"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
        :placeholder="placeholder || $t('common.components.filterableSelect.placeholder')"
        :disabled="disabled"
        class="vml-select"
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
          <div class="ui-loading--page" aria-hidden="true"></div>
          <span>{{ $t('common.components.filterableSelect.loading') }}</span>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredOptions.length === 0" class="dropdown-empty">
          {{ inputValue ? $t('common.components.filterableSelect.noResults') : $t('common.components.filterableSelect.noOptions') }}
        </div>

        <!-- Options List -->
        <div v-else class="dropdown-options ui-scrollbar">
          <div
            v-for="(option, index) in filteredOptions"
            :key="getUniqueKey(option)"
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
            <div class="option-content">
              <span class="option-name">
                <!-- 智能顯示層級路徑 -->
                <template v-if="option.level === 'county' && option.city">
                  <!-- 區縣級：顯示 城市 > 區縣 -->
                  <span class="option-parent">{{ option.city }}</span>
                  <span class="option-separator"> > </span>
                </template>
                <template v-else-if="option.level === 'township'">
                  <!-- 鄉鎮級：優先顯示區縣，沒有則顯示城市 -->
                  <span v-if="option.county" class="option-parent">{{ option.county }}</span>
                  <span v-else-if="option.city" class="option-parent">{{ option.city }}</span>
                  <span v-if="option.county || option.city" class="option-separator"> > </span>
                </template>
                <span class="option-main">{{ option.name }}</span>
              </span>
              <span v-if="showCounts && option.village_count" class="option-count">
                {{ option.village_count }}{{ $t('common.components.filterableSelect.villageCount') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { showError } from '@/utils/ui/message.js'
import { getCities, getCounties, getTownships } from '@/VillagesML/utils/regionPreload.js'
import SimpleDropdown from '@/components/selector/SimpleDropdown.vue'

const { t } = useI18n()

const props = defineProps({
  modelValue: { type: String, default: '' },
  level: { type: String, default: 'city' },
  parent: { type: String, default: null },
  // Hierarchical context for precise queries
  city: { type: String, default: null },
  county: { type: String, default: null },
  placeholder: { type: String, default: '' },
  showCounts: { type: Boolean, default: true },
  showLevelSelector: { type: Boolean, default: true },
  allowedLevels: { type: Array, default: () => ['city', 'county', 'township'] },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'update:level', 'update:hierarchy'])

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
const selectedOption = ref(null)  // Store the full selected option
let blurTimeout = null

// Level dropdown state
const isLevelDropdownOpen = ref(false)
const levelTriggerRef = ref(null)
const internalLevel = ref(props.level)

// Level options
const levelOptions = computed(() => {
  const options = [
    { label: t('common.components.filterableSelect.levelCity'), value: 'city' },
    { label: t('common.components.filterableSelect.levelCounty'), value: 'county' }
  ]
  if (props.allowedLevels.includes('township')) {
    options.push({ label: t('common.components.filterableSelect.levelTownship'), value: 'township' })
  }
  return options
})

// Level label
const levelLabel = computed(() => {
  const option = levelOptions.value.find(opt => opt.value === internalLevel.value)
  return option ? option.label : t('common.components.filterableSelect.levelCity')
})

// Toggle level dropdown
const toggleLevelDropdown = () => {
  if (!props.disabled) {
    isLevelDropdownOpen.value = !isLevelDropdownOpen.value
  }
}

// Watch internal level changes
watch(internalLevel, (newLevel) => {
  emit('update:level', newLevel)
})

// Watch props.level changes
watch(() => props.level, (newLevel) => {
  internalLevel.value = newLevel
})


// Load options from preloaded data
const loadOptions = async () => {
  loading.value = true
  try {
    let regions = []

    // 根据 level 从预加载的数据中获取
    if (props.level === 'city') {
      regions = await getCities()
    } else if (props.level === 'county') {
      regions = await getCounties(props.parent)
    } else if (props.level === 'township') {
      // 如果有 parent，可能是区县或城市
      // 先尝试作为区县查询，如果没结果再作为城市查询
      regions = await getTownships(props.parent, props.parent)
    }

    options.value = regions || []
    filterOptions()
  } catch (error) {
    console.error('Failed to load regions:', error)
    showError(t('common.components.filterableSelect.loadError'))
    options.value = []
  } finally {
    loading.value = false
  }
}

// Generate unique key for each option
const getUniqueKey = (option) => {
  // Use hierarchical path as unique key to avoid duplicates
  if (props.level === 'city') {
    return option.name || ''
  } else if (props.level === 'county') {
    return `${option.city || ''}|${option.name || ''}`
  } else if (props.level === 'township') {
    return `${option.city || ''}|${option.county || ''}|${option.name || ''}`
  }
  return option.name || ''
}

// Filter options based on input
const filterOptions = () => {
  const query = (inputValue.value || '').toLowerCase().trim()
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
  // Store the full selected option
  selectedOption.value = option

  // Build full path display based on level
  let displayValue = option.name

  if (props.level === 'county' && option.city) {
    // 区县级：显示 城市-区县
    displayValue = `${option.city}-${option.name}`
  } else if (props.level === 'township') {
    // 乡镇级：优先显示 区县-乡镇，没有区县则显示 城市-乡镇
    if (option.county) {
      displayValue = `${option.county}-${option.name}`
    } else if (option.city) {
      displayValue = `${option.city}-${option.name}`
    }
  }

  // Input shows full path for better UX
  inputValue.value = displayValue

  // But modelValue emits the original name (data value, not display value)
  emit('update:modelValue', option.name)

  // Emit full hierarchical path from option object
  const hierarchy = {
    city: option.city || null,
    county: option.county || null,
    township: option.township || null
  }
  emit('update:hierarchy', hierarchy)

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
  // Clear input value when level changes
  inputValue.value = ''
  emit('update:modelValue', '')
  emit('update:hierarchy', {
    city: null,
    county: null,
    township: null
  })
  loadOptions()
})

watch(() => props.parent, () => {
  loadOptions()
})

watch(() => props.modelValue, (newValue) => {
  // If modelValue changes from parent, try to find the matching option and rebuild display value
  if (!newValue) {
    inputValue.value = ''
    selectedOption.value = null
    return
  }

  // If we have a selected option and its name matches, keep the display value
  if (selectedOption.value && selectedOption.value.name === newValue) {
    // Display value is already correct, do nothing
    return
  }

  // Otherwise, try to find the option in the current options list
  const matchingOption = options.value.find(opt => opt.name === newValue)
  if (matchingOption) {
    selectedOption.value = matchingOption

    // Rebuild display value
    let displayValue = matchingOption.name
    if (props.level === 'county' && matchingOption.city) {
      displayValue = `${matchingOption.city}-${matchingOption.name}`
    } else if (props.level === 'township') {
      if (matchingOption.county) {
        displayValue = `${matchingOption.county}-${matchingOption.name}`
      } else if (matchingOption.city) {
        displayValue = `${matchingOption.city}-${matchingOption.name}`
      }
    }
    inputValue.value = displayValue
  } else {
    // Fallback: just show the raw value
    inputValue.value = newValue
    selectedOption.value = null
  }
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

<style scoped lang="scss">
.filterable-select {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filterable-select.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.level-selector-wrapper {
  flex: 0 0 100px;
}

.level-select {
  padding: 10px 12px;
  border: 1px solid var(--glass-30);
  border-radius: var(--radius-sm2);
  background: var(--glass-50);
  backdrop-filter: blur(10px);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  user-select: none;
}

.level-select:hover {
  border-color: var(--color-primary);
  background: var(--glass-70);
}

.level-select .arrow-icon {
  font-size: 12px;
  color: var(--text-tertiary);
}

.dropdown-wrapper {
  flex: 1;
  display: flex;
  position: relative;
  border: 2px solid var(--color-primary-hover);
  border-radius: var(--radius-sm2);
  background: var(--glass-50);
  backdrop-filter: blur(10px);
  overflow: hidden;
  transition: all 0.3s ease;
  align-items: center;
  justify-content: center;
}

.dropdown-wrapper:focus-within {
  border-color: var(--color-primary);
  background: var(--glass-70);
}

.vml-select {
  flex: 1;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: transparent;
  font-size: 14px;
  outline: none;
}

.dropdown-trigger {
  flex: 0 0 36px;
  @include flex-center;
  border: none;
  background: var(--color-primary);
  color: var(--action-primary-text);
  cursor: pointer;
  transition: all 0.3s ease;
  padding:10px 4px;
  border-radius: var(--radius-xl);
}

.dropdown-trigger:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.dropdown-trigger:disabled {
  @include disabled-state;
}

.arrow-icon {
  font-size: 12px;
}

.select-dropdown {
  background: var(--glass-90);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-80);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 32px var(--bg-hover-strong);
  overflow: hidden;
}

.dropdown-loading,
.dropdown-empty {
  padding: 20px;
  text-align: center;
  color: var(--text-secondary);
}

.dropdown-loading {
  @include flex-col;
  align-items: center;
  gap: 10px;
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
  background: rgba(var(--vml-blue-rgb), 0.1);
}

.dropdown-option.selected {
  background: rgba(var(--vml-blue-rgb), 0.2);
  font-weight: 600;
}

.option-content {
  white-space: nowrap;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 8px;
}

.option-name {
  flex: 1;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.option-parent {
  color: var(--text-secondary);
  font-size: 0.9em;
}

.option-separator {
  color: var(--text-tertiary);
  font-size: 0.85em;
  opacity: 0.6;
}

.option-main {
  font-weight: 500;
}

.option-count {
  flex: 0 0 auto;
  font-size: 12px;
  color: var(--color-primary);
  font-weight: 600;
  margin-left: 8px;
}

/* Dropdown 触发器样式 */
</style>
