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
.liquid-radio-group {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 24px; /* 增加间距，更有呼吸感 */
}

.liquid-radio-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
  user-select: none;
  gap: 8px;
  padding: 4px 8px; /* 增加点击区域 */

  &:hover .liquid-radio-custom {
    transform: scale(1.1);
    border-color: var(--color-primary-medium2);
  }
}

.liquid-radio-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;

  &:checked {
    & ~ .liquid-radio-custom {
      /* 这里的颜色分配参考了你觉得更合理的风格 */
      background: var(--bg-white);
      border-color: var(--color-primary);
      box-shadow:
          0 4px 12px var(--color-primary-shadow-light),
          inset 0 2px 4px rgba(255, 255, 255, 0.3); /* 顶部微弱内发光 */

      &::after {
        transform: scale(1);
        opacity: 1;
      }
    }

    & ~ .liquid-radio-text {
      color: var(--color-primary);
      font-weight: 600; /* 选中时文字加粗 */
    }
  }
}

.liquid-radio-custom {
  width: var(--radio-size, 18px); /* 稍微缩小一点，显得更精致 */
  height: var(--radio-size, 18px);
  border-radius: var(--radius-full);
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;

  background: var(--glass-lighter); /* 使用更透明的白色背景 */
  border: 2px solid var(--border-gray); /* 默认使用较明显的灰色边框 */
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  box-shadow:
      inset 0 1px 3px rgba(255, 255, 255, 0.5), /* 顶部内发光（玻璃质感） */
      0 2px 4px rgba(0, 0, 0, 0.05); /* 底部微小阴影 */

  &::after {
    content: "";
    width: var(--radio-dot-size, 12px);
    height: var(--radio-dot-size, 12px);
    border-radius: var(--radius-full);
    background: var(--color-primary);
    transform: scale(0);
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
}

.liquid-radio-text {
  font-size: var(--radio-font-size, 14px); /* 减小到 14px，更符合管理后台风格 */
  color: var(--text-primary);
  transition: all 0.3s ease;
}
</style>