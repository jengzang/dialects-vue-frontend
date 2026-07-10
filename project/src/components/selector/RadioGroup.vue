<template>
  <div
    class="liquid-radio-group"
    v-if="options && options.length"
    :style="radioSizeStyle"
  >
    <label
        v-for="(option, index) in options"
        :key="getOptionValue(option)"
        :for="`radio-${name}-${index}`"
        class="liquid-radio-label"
    >
      <input
          type="radio"
          :id="`radio-${name}-${index}`"
          :name="name"
          :value="getOptionValue(option)"
          :checked="modelValue === getOptionValue(option)"
          @change="handleChange($event, getOptionValue(option))"
          class="liquid-radio-input"
      />
      <span class="liquid-radio-custom"></span>
      <span class="liquid-radio-text">{{ getOptionLabel(option) }}</span>
    </label>
  </div>
  <div v-else class="radio-empty">暂无选项</div>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue';

// 定义接收的属性
const props = defineProps({
  options: {
    type: Array,
    required: true,
    default: () => []
  },
  name: {
    type: String,
    required: true
  },
  // 用于支持 v-model
  modelValue: {
    type: [String, Number, Boolean],
    default: ''
  },
  // 控制文字大小，并同步控制圆圈大小；不传时默认保持原样
  size: {
    type: [Number, String],
    default: 14
  }
});

// 定义派发的事件
const emit = defineEmits(['update:modelValue', 'change']);

// 兼容对象数组和基础类型数组
const getOptionValue = (option) => {
  return option !== null && typeof option === 'object' && option.value !== undefined
      ? option.value
      : option;
};

const getOptionLabel = (option) => {
  return option !== null && typeof option === 'object' && option.label !== undefined
      ? option.label
      : option;
};

const normalizeSize = (value) => {
  if (typeof value === 'number') {
    return value;
  }

  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? 14 : parsed;
};

const radioSizeStyle = computed(() => {
  const fontSize = normalizeSize(props.size);
  const radioSize = fontSize + 4;
  const dotSize = Math.round(radioSize * 0.67);

  return {
    '--radio-font-size': `${fontSize}px`,
    '--radio-size': `${radioSize}px`,
    '--radio-dot-size': `${dotSize}px`
  };
});

// 处理切换事件
const handleChange = (event, value) => {
  // 更新 v-model 的值
  emit('update:modelValue', value);
  // 额外派发一个 change 事件供外部监听
  emit('change', value);
};
</script>

<style scoped lang="scss">
$transition-control: 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
$transition-dot: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
$transition-text: 0.3s ease;
.liquid-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  justify-content: center;
}

.liquid-radio-label {
  position: relative;
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 4px 8px;
  cursor: pointer;
  user-select: none;

  &:hover {
    .liquid-radio-custom {
      border-color: var(--color-primary-medium2);
      transform: scale(1.1);
    }
  }
}

.liquid-radio-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;

  &:checked {
    ~ .liquid-radio-custom {
      background: var(--bg-white);
      border-color: var(--color-primary);
      box-shadow:
        0 4px 12px var(--color-primary-shadow-light),
        inset 0 2px 4px var(--glass-30);

      &::after {
        opacity: 1;
        transform: scale(1);
      }
    }

    ~ .liquid-radio-text {
      color: var(--color-primary);
      font-weight: 600;
    }
  }
}

.liquid-radio-custom {
  position: relative;
  flex-shrink: 0;
  width: var(--radio-size, 18px);
  height: var(--radio-size, 18px);
  background: var(--glass-40);
  border: 2px solid var(--border-gray);
  border-radius: var(--radius-full);
  box-shadow:
    inset 0 1px 3px var(--glass-50),
    0 2px 4px var(--bg-hover);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all $transition-control;

  @include flex-center;

  &::after {
    width: var(--radio-dot-size, 12px);
    height: var(--radio-dot-size, 12px);
    content: '';
    background: var(--color-primary);
    border-radius: var(--radius-full);
    opacity: 0;
    transform: scale(0);
    transition: all $transition-dot;
  }
}

.liquid-radio-text {
  color: var(--text-primary);
  font-size: var(--radio-font-size, 14px);
  transition: all $transition-text;
}
</style>