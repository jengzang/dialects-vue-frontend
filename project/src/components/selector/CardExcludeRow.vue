<template>
  <div class="card-row">
    <ChoiceSelector
      v-model="cardModel"
      :options="options"
      :aria-label="ariaLabel"
    />
    <div
      ref="triggerEl"
      class="dropdown card-exclude-trigger"
      :class="{ disabled }"
      @click="handleTriggerClick"
    >
      {{ displayText || noExcludeText }}
      <span class="arrow">▾</span>
    </div>
    <Teleport to="body">
      <div
        v-if="open"
        class="dropdown-panel glass-dropdown-panel"
        :style="panelStyle"
      >
        <div
          v-for="option in excludeOptions"
          :key="option.value"
          class="dropdown-item glass-dropdown-item"
          :class="{ active: isSelected(option.value) }"
          @click="toggleOption(option.value)"
        >
          <span class="check-icon">{{ isSelected(option.value) ? '✓' : '' }}</span>
          {{ option.label }}
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import ChoiceSelector from './ChoiceSelector.vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  options: {
    type: Array,
    default: () => []
  },
  ariaLabel: {
    type: String,
    default: ''
  },
  excludeOptions: {
    type: Array,
    default: () => []
  },
  excludeValues: {
    type: Array,
    default: () => []
  },
  open: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  noExcludeText: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'update:excludeValues', 'toggle'])

const triggerEl = ref(null)
const panelStyle = ref({
  position: 'absolute',
  top: '0px',
  left: '0px',
  zIndex: 99999
})

const cardModel = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const selectedValues = computed(() => new Set(props.excludeValues))

const displayText = computed(() => {
  const labels = props.excludeValues.map(value => {
    const option = props.excludeOptions.find(item => item.value === value)
    return option ? option.label : value
  })

  if (labels.length > 2) {
    return `${labels.slice(0, 1).join(', ')}...`
  }
  return labels.join(', ')
})

function isSelected(value) {
  return selectedValues.value.has(value)
}

function handleTriggerClick() {
  if (props.disabled) return
  emit('toggle')
}

function toggleOption(value) {
  emit(
    'update:excludeValues',
    props.excludeValues.includes(value)
      ? props.excludeValues.filter(item => item !== value)
      : [...props.excludeValues, value]
  )
}

function updatePanelPosition() {
  const el = triggerEl.value
  if (!el) return

  const rect = el.getBoundingClientRect()
  panelStyle.value = {
    position: 'absolute',
    top: `${rect.top + rect.height + window.scrollY}px`,
    left: `${rect.left + window.scrollX}px`,
    zIndex: 99999
  }
}

watch(
  () => props.open,
  open => {
    if (open) nextTick(updatePanelPosition)
  }
)

defineExpose({ triggerEl })
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.card-row {
  width: 100%;
  @include flex-center;
  flex-wrap: wrap;
  gap: 20px;
}

@media (max-aspect-ratio: 1/1) {
  .card-row {
    gap: 3px;
  }
}

.dropdown {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 60px;
  max-height: 30px;
  margin: 0;
  padding: 8px 10px;
  border: 1px solid rgba(var(--color-silver-rgb), 0.5);
  border-radius: var(--radius-md);
  background: var(--glass-40);
  color: var(--text-primary);
  white-space: nowrap;
  font-size: var(--font-size-14);
  cursor: pointer;
  transition: all 0.2s;

  @include glass-blur(10px);

  &:hover {
    background: var(--glass-60);
    border-color: var(--color-primary);
  }

  &.disabled {
    @include disabled-state;
  }
}

.check-icon {
  display: inline-block;
  width: 16px;
}
</style>
