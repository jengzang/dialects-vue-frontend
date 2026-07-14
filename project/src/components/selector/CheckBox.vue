<template>
  <label
    :class="[
      'liquid-checkbox-label',
      {
        'is-checked': modelValue,
        'is-disabled': disabled
      }
    ]"
    :style="labelStyle"
  >
    <input
      type="checkbox"
      class="liquid-checkbox-input"
      :checked="modelValue"
      :disabled="disabled"
      @change="handleChange"
    />

    <span
      class="liquid-checkbox-indicator"
      :style="indicatorStyle"
      aria-hidden="true"
    ></span>

    <span class="liquid-checkbox-text">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    default: ''
  },
  size: {
    type: [Number, String],
    default: 18
  },
  fontSize: {
    type: [Number, String],
    default: 15
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const checkboxSize = computed(() => {
  return typeof props.size === 'number' ? `${props.size}px` : props.size
})

const checkboxFontSize = computed(() => {
  return typeof props.fontSize === 'number' ? `${props.fontSize}px` : props.fontSize
})

const indicatorStyle = computed(() => ({
  width: checkboxSize.value,
  height: checkboxSize.value
}))

const labelStyle = computed(() => ({
  fontSize: checkboxFontSize.value
}))

const handleChange = (event) => {
  const checked = event.target.checked
  emit('update:modelValue', checked)
  emit('change', checked)
}
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$primary-color: var(--color-primary);
$text-color: var(--text-dark, var(--text-dark));
$checkmark-color: var(--action-primary-text);

$transition-fast: 0.2s ease;
$transition-indicator: 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
$transition-checkmark: 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);

.liquid-checkbox-label {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  color: $text-color;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  transition:
    color $transition-fast,
    opacity $transition-fast;

  &:hover {
    opacity: 0.8;
  }

  &.is-checked {
    color: $primary-color;

    .liquid-checkbox-text {
      color: $primary-color;
    }
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.liquid-checkbox-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;

  &:checked {
    + .liquid-checkbox-indicator {
      background: $primary-color;
      border-color: $primary-color;

      &::after {
        transform: translate(-50%, -58%) rotate(45deg) scale(1);
      }
    }

    ~ .liquid-checkbox-text {
      color: $primary-color;
    }
  }

  &:focus-visible + .liquid-checkbox-indicator {
    outline: 2px solid $primary-color;
    outline-offset: 2px;
  }
}

.liquid-checkbox-indicator {
  position: relative;
  width: 18px;
  height: 18px;
  background: var(--glass-20);
  border: 1px solid var(--border-gray-medium);
  border-radius: var(--radius-xs);
  box-shadow:
    inset 0 1px 3px var(--glass-50),
    0 2px 4px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: all $transition-indicator;

  &::after {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 9px;
    content: '';
    background: transparent;
    border-right: 2px solid $checkmark-color;
    border-bottom: 2px solid $checkmark-color;
    border-radius: 0;
    box-shadow: none;
    transform: translate(-50%, -58%) rotate(45deg) scale(0);
    transform-origin: center;
    transition: transform $transition-checkmark;
  }
}

.liquid-checkbox-text {
  color: inherit;
  line-height: 1.2;
  transition: color $transition-fast;
}
</style>
