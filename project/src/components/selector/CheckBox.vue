<template>
  <label
    :class="[
      'liquid-checkbox-label',
      {
        'is-checked': modelValue,
        'is-disabled': disabled
      }
    ]"
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
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const checkboxSize = computed(() => {
  return typeof props.size === 'number' ? `${props.size}px` : props.size
})

const indicatorStyle = computed(() => ({
  width: checkboxSize.value,
  height: checkboxSize.value
}))

const handleChange = (event) => {
  const checked = event.target.checked
  emit('update:modelValue', checked)
  emit('change', checked)
}
</script>

<style scoped lang="scss">
.liquid-checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-dark, #333);
  user-select: none;
  transition:
    color 0.2s ease,
    opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }

  &.is-checked {
    color: var(--color-primary, #007aff);
  }

  &.is-checked .liquid-checkbox-text {
    color: var(--color-primary, #007aff);
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.liquid-checkbox-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + .liquid-checkbox-indicator {
    border-color: var(--color-primary, #007aff);
    background: var(--color-primary, #007aff);

    &::after {
      transform: translate(-50%, -58%) rotate(45deg) scale(1);
    }
  }

  &:checked ~ .liquid-checkbox-text {
    color: var(--color-primary, #007aff);
  }

  &:focus-visible + .liquid-checkbox-indicator {
    outline: 2px solid var(--color-primary, #007aff);
    outline-offset: 2px;
  }
}

.liquid-checkbox-indicator {
  position: relative;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid rgba(150, 150, 150, 0.3);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow:
    inset 0 1px 3px rgba(255, 255, 255, 0.5),
    0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 9px;
    background: transparent;
    border-right: 2px solid #fff;
    border-bottom: 2px solid #fff;
    border-radius: 0;
    box-shadow: none;
    transform: translate(-50%, -58%) rotate(45deg) scale(0);
    transform-origin: center;
    transition: transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
  }
}

.liquid-checkbox-text {
  color: inherit;
  line-height: 1.2;
  transition: color 0.2s ease;
}
</style>