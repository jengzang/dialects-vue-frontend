<template>
  <div
    class="switch-toggle"
    :class="[
      `variant-${variant}`,
      `label-${labelPosition}`,
      { 'is-on': modelValue, 'is-disabled': disabled, 'with-label': resolvedShowLabel }
    ]"
    :style="rootStyle"
  >
    <span
      v-if="resolvedShowLabel && labelPosition === 'left'"
      class="switch-toggle__label switch-toggle__label--left"
    >
      {{ currentLabel }}
    </span>

    <button
      type="button"
      class="switch-toggle__button"
      :class="{ 'is-on': modelValue, 'is-disabled': disabled }"
      :style="buttonStyle"
      :disabled="disabled"
      role="switch"
      :aria-checked="String(modelValue)"
      :aria-label="ariaLabel || undefined"
      @click="toggle"
    >
      <span
        v-if="resolvedShowLabel && labelPosition === 'inside'"
        class="switch-toggle__label switch-toggle__label--inside"
      >
        {{ currentLabel }}
      </span>
      <span class="switch-toggle__track"></span>
      <span class="switch-toggle__thumb" :style="thumbStyle"></span>
    </button>

    <span
      v-if="resolvedShowLabel && labelPosition === 'right'"
      class="switch-toggle__label switch-toggle__label--right"
    >
      {{ currentLabel }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  width: {
    type: [Number, String],
    default: 50,
  },
  height: {
    type: [Number, String],
    default: 30,
  },
  thumbSize: {
    type: [Number, String],
    default: null,
  },
  color: {
    type: String,
    default: 'blue',
  },
  variant: {
    type: String,
    default: 'solid',
    validator: (value) => ['solid', 'glow', 'minimal'].includes(value),
  },
  showLabel: {
    type: Boolean,
    default: false,
  },
  activeText: {
    type: String,
    default: '',
  },
  inactiveText: {
    type: String,
    default: '',
  },
  labelPosition: {
    type: String,
    default: 'right',
    validator: (value) => ['left', 'right', 'inside'].includes(value),
  },
  gap: {
    type: [Number, String],
    default: 10,
  },
  ariaLabel: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const toPx = (value) => (typeof value === 'number' ? `${value}px` : value)
const toNumber = (value, fallback) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

const widthNumber = computed(() => toNumber(props.width, 50))
const heightNumber = computed(() => toNumber(props.height, 30))
const thumbNumber = computed(() => {
  if (props.thumbSize !== null && props.thumbSize !== undefined && props.thumbSize !== '') {
    return toNumber(props.thumbSize, Math.max(heightNumber.value - 4, 0))
  }
  return Math.max(heightNumber.value - 4, 0)
})
const insetNumber = computed(() => Math.max((heightNumber.value - thumbNumber.value) / 2, 0))
const translateXNumber = computed(() => Math.max(widthNumber.value - thumbNumber.value - insetNumber.value * 2, 0))

const colorPresets = {
  blue: '#007aff',
  green: '#34c759',
  purple: '#5856d6',
  gray: '#8e8e93',
}

const activeColor = computed(() => colorPresets[props.color] || props.color || colorPresets.blue)
const inactiveColor = computed(() => {
  if (props.variant === 'minimal') {
    return 'rgba(142, 142, 147, 0.18)'
  }
  return 'rgba(142, 142, 147, 0.3)'
})

const resolvedShowLabel = computed(() => props.showLabel || props.activeText !== '' || props.inactiveText !== '')
const currentLabel = computed(() => (props.modelValue ? props.activeText : props.inactiveText))

const rootStyle = computed(() => ({
  '--switch-toggle-gap': toPx(props.gap),
  '--switch-toggle-active-color': activeColor.value,
  '--switch-toggle-inactive-color': inactiveColor.value,
}))

const buttonStyle = computed(() => ({
  width: toPx(props.width),
  height: toPx(props.height),
  borderRadius: `${heightNumber.value / 2}px`,
}))

const thumbStyle = computed(() => ({
  width: `${thumbNumber.value}px`,
  height: `${thumbNumber.value}px`,
  top: `${insetNumber.value}px`,
  left: `${insetNumber.value}px`,
  transform: props.modelValue ? `translateX(${translateXNumber.value}px)` : 'translateX(0)',
}))

const toggle = () => {
  if (props.disabled) return
  const next = !props.modelValue
  emit('update:modelValue', next)
  emit('change', next)
}
</script>

<style scoped lang="scss">
$active-blue: #007aff;
$thumb-background: #fff;
$inside-label-color: #111;

$transition-duration: 0.3s;
$transition-ease: ease;

.switch-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--switch-toggle-gap, 10px);
}

.switch-toggle__button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
  background: var(
    --switch-toggle-inactive-color,
    rgba(142, 142, 147, 0.3)
  );
  border: none;
  transition:
    background $transition-duration $transition-ease,
    box-shadow $transition-duration $transition-ease,
    transform $transition-duration $transition-ease,
    opacity $transition-duration $transition-ease;

  &.is-on {
    background: var(--switch-toggle-active-color, $active-blue);
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.switch-toggle__track {
  position: absolute;
  inset: 0;
  border-radius: inherit;
}

.switch-toggle__thumb {
  position: absolute;
  background: $thumb-background;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform $transition-duration $transition-ease;
}

.switch-toggle__label {
  line-height: 1;
  user-select: none;

  &--inside {
    position: relative;
    z-index: 1;
    white-space: nowrap;
    pointer-events: none;
  }
}

.variant-solid,
.variant-glow {
  .switch-toggle__label--inside {
    color: $inside-label-color;
  }
}

.variant-minimal {
  .switch-toggle__button {
    background: transparent;
    border: 1px solid rgba(142, 142, 147, 0.35);

    &.is-on {
      background: color-mix(
        in srgb,
        var(--switch-toggle-active-color, $active-blue) 18%,
        transparent
      );
      border-color: var(--switch-toggle-active-color, $active-blue);
    }
  }
}

.variant-glow {
  .switch-toggle__button {
    &:hover:not(.is-disabled) {
      background-color: dimgray;
      box-shadow: 0 0 10px 4px rgba(0, 123, 255, 0.7);

      .switch-toggle__thumb {
        box-shadow: 0 0 8px rgba(0, 123, 255, 0.5);
      }
    }

    &.is-on {
      background-color: var(--switch-toggle-active-color, $active-blue);
      animation: switch-toggle-glow-pulse 2s infinite ease-in-out;

      &:hover:not(.is-disabled) {
        background: linear-gradient(135deg, #00bfff, #66ccff);
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);

        .switch-toggle__thumb {
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
        }
      }
    }
  }
}

@keyframes switch-toggle-glow-pulse {
  0%,
  100% {
    box-shadow:
      0 0 5px rgba(0, 122, 255, 0.4),
      0 0 10px rgba(0, 122, 255, 0.6),
      0 0 20px rgba(0, 122, 255, 0.8),
      0 0 30px rgba(0, 122, 255, 0.9);
  }

  50% {
    box-shadow:
      0 0 10px rgba(102, 204, 255, 0.6),
      0 0 20px rgba(102, 204, 255, 0.8),
      0 0 30px rgba(102, 204, 255, 1),
      0 0 40px rgba(102, 204, 255, 1);
  }
}
</style>
