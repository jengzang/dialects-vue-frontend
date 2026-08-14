<template>
  <label
    :class="[
      'checkbox-wrapper',
      {
        'is-checked': modelValue,
        'is-disabled': disabled
      }
    ]"
    :style="labelStyle"
  >
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      @change="handleChange"
    />

    <div class="checkmark">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          d="M20 6L9 17L4 12"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        ></path>
      </svg>
    </div>

    <span class="label">
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

const labelStyle = computed(() => ({
  '--checkbox-size': checkboxSize.value,
  fontSize: checkboxFontSize.value
}))

const handleChange = (event) => {
  const checked = event.target.checked
  emit('update:modelValue', checked)
  emit('change', checked)

  // 父级可能拒绝该变更(如要求至少勾选一项)。若 modelValue 未随之更新,
  // 把原生 input 状态同步回 modelValue,否则勾选指示会停留在点击后的状态
  requestAnimationFrame(() => {
    if (event.target.checked !== props.modelValue) {
      event.target.checked = props.modelValue
    }
  })
}
</script>

<style scoped lang="scss">
.checkbox-wrapper {
  --checkbox-size: 18px;
  --checkbox-color: var(--color-primary);
  --checkbox-shadow: rgba(var(--color-primary-rgb), 0.3);
  --checkbox-border: rgba(var(--color-primary-rgb), 0.9);

  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
  padding: 4px 8px;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.checkbox-wrapper input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkbox-wrapper .checkmark {
  position: relative;
  width: var(--checkbox-size);
  height: var(--checkbox-size);
  border: 2px solid var(--checkbox-border);
  border-radius: var(--radius-sm2);
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--surface-elevation-0);
  box-shadow: 0 0 15px var(--checkbox-shadow);
  overflow: hidden;
  flex-shrink: 0;
}

.checkbox-wrapper .checkmark::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: var(--checkbox-color);
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  transform: scale(0) rotate(-45deg);
}

.checkbox-wrapper input:checked ~ .checkmark::before {
  opacity: 1;
  transform: scale(1) rotate(0);
}

.checkbox-wrapper .checkmark svg {
  width: 0;
  height: 0;
  color: var(--action-primary-text);
  z-index: 1;
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
}

.checkbox-wrapper input:checked ~ .checkmark svg {
  width: calc(var(--checkbox-size) * 0.72);
  height: calc(var(--checkbox-size) * 0.72);
  transform: rotate(360deg);
}

.checkbox-wrapper:hover .checkmark {
  border-color: var(--checkbox-color);
  transform: scale(1.1);
  box-shadow:
    0 0 20px var(--checkbox-shadow),
    0 0 40px var(--checkbox-shadow),
    inset 0 0 10px var(--checkbox-shadow);
}

.checkbox-wrapper input:checked ~ .checkmark {
  animation: pulse 1s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 20px var(--checkbox-shadow);
  }
  50% {
    transform: scale(0.9);
    box-shadow:
      0 0 30px var(--checkbox-shadow),
      0 0 50px var(--checkbox-shadow);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 20px var(--checkbox-shadow);
  }
}

.checkbox-wrapper .label {
  margin-left: 2px;
  color: var(--text-dark);
  line-height: 1.2;
  opacity: 0.9;
  transition: all 0.3s;
}

.checkbox-wrapper.is-checked .label {
  color: var(--checkbox-color);
}

.checkbox-wrapper:hover .label {
  opacity: 1;
  transform: translateX(5px);
}

/* Glowing dots animation */
.checkbox-wrapper::after,
.checkbox-wrapper::before {
  content: '';
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--checkbox-color);
  opacity: 0;
  transition: all 0.5s;
  pointer-events: none;
}

.checkbox-wrapper::before {
  left: -10px;
  top: 50%;
}

.checkbox-wrapper::after {
  right: -10px;
  top: 50%;
}

.checkbox-wrapper:hover::before {
  opacity: 1;
  transform: translateX(-10px);
  box-shadow: 0 0 10px var(--checkbox-color);
}

.checkbox-wrapper:hover::after {
  opacity: 1;
  transform: translateX(10px);
  box-shadow: 0 0 10px var(--checkbox-color);
}

.checkbox-wrapper input:focus-visible ~ .checkmark {
  outline: 2px solid var(--checkbox-color);
  outline-offset: 2px;
}
</style>
