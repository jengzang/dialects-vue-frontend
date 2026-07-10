<template>
  <div class="help-icon-container" ref="containerRef">
    <!-- 触发图标 -->
    <div
      ref="iconRef"
      class="help-icon global-help-icon-shell"
      :class="[sizeClass, { 'is-visible': isVisible }]"
      :style="iconStyle"
      @mouseenter="handleHover('enter')"
      @mouseleave="handleHover('leave')"
      @click="handleClick"
      @touchend.prevent="handleTouchEnd"
    >
      <slot>{{ icon }}</slot>
    </div>

    <!-- Tooltip 面板 (Teleport 到 body) -->
    <Teleport to="body">
      <Transition name="tooltip-fade">
        <div
          v-if="isVisible"
          class="help-tooltip global-tooltip-surface"
          :style="[tooltipPosition, { maxWidth: tooltipMaxWidth }]"
        >
          <slot name="content">{{ content }}</slot>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'

const HELP_ICON_OPEN_EVENT = 'help-icon-open'

// Props 定义
const props = defineProps({
  content: {
    type: String,
    required: true,
    default: ''
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  icon: {
    type: String,
    default: '?'
  },
  iconColor: {
    type: String,
    default: 'var(--color-primary)'
  },
  fontSize: {
    type: String,
    default: '' // 如果为空，使用 size 预设值
  },
  placement: {
    type: String,
    default: 'bottom',
    validator: (value) => ['top', 'bottom', 'left', 'right'].includes(value)
  },
  offset: {
    type: Number,
    default: 8
  },
  trigger: {
    type: String,
    default: 'both',
    validator: (value) => ['hover', 'click', 'both'].includes(value)
  },
  mobileAutoHide: {
    type: Boolean,
    default: true
  },
  autoHideDelay: {
    type: Number,
    default: 3000
  },
  tooltipMaxWidth: {
    type: String,
    default: '250px'
  }
})

// Emits 定义
const emit = defineEmits(['show', 'hide', 'toggle'])

// 响应式状态
const isVisible = ref(false)
const isMobile = ref(false)
const iconRef = ref(null)
const containerRef = ref(null)
const tooltipPosition = reactive({
  position: 'absolute',
  top: '0px',
  left: '0px',
  zIndex: 99999
})

// 自动隐藏定时器
let autoHideTimer = null
const instanceId = `help-icon-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

// 计算属性 - 尺寸 class
const sizeClass = computed(() => {
  const sizeMap = {
    sm: 'size-sm',
    md: 'size-md',
    lg: 'size-lg'
  }
  return sizeMap[props.size] || 'size-md'
})

// 计算属性 - 动态样式（颜色和字号）
const iconStyle = computed(() => {
  const style = {
    color: props.iconColor
  }
  // 如果提供了 fontSize，使用自定义字号覆盖预设
  if (props.fontSize) {
    style.fontSize = props.fontSize
  }
  return style
})

// 设备检测
const checkMobile = () => {
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// 智能定位算法 (4 向边界检测)
const updatePosition = async () => {
  await nextTick()
  if (!iconRef.value) return

  const rect = iconRef.value.getBoundingClientRect()
  const scrollX = window.scrollX || window.pageXOffset
  const scrollY = window.scrollY || window.pageYOffset
  const vw = window.innerWidth
  const vh = window.innerHeight
  const tw = 250 // 估算 tooltip 宽度
  const th = 60  // 估算 tooltip 高度

  let left, top

  // 根据 placement 计算初始位置
  switch (props.placement) {
    case 'bottom':
      left = rect.left + scrollX + rect.width / 2 - tw / 2
      top = rect.bottom + scrollY + props.offset
      break
    case 'top':
      left = rect.left + scrollX + rect.width / 2 - tw / 2
      top = rect.top + scrollY - th - props.offset
      break
    case 'left':
      left = rect.left + scrollX - tw - props.offset
      top = rect.top + scrollY + rect.height / 2 - th / 2
      break
    case 'right':
      left = rect.right + scrollX + props.offset
      top = rect.top + scrollY + rect.height / 2 - th / 2
      break
    default:
      left = rect.left + scrollX + rect.width / 2 - tw / 2
      top = rect.bottom + scrollY + props.offset
  }

  // 边界检查 - 右边界
  if (left + tw > vw - 10) {
    left = vw - tw - 10
  }

  // 边界检查 - 左边界
  if (left < 10) {
    left = 10
  }

  // 边界检查 - 下边界 (自动翻转到上方)
  if (props.placement === 'bottom' && rect.bottom + th + props.offset > vh) {
    top = rect.top + scrollY - th - props.offset
  }

  // 边界检查 - 上边界 (自动翻转到下方)
  if (props.placement === 'top' && rect.top - th - props.offset < 0) {
    top = rect.bottom + scrollY + props.offset
  }

  Object.assign(tooltipPosition, {
    position: 'absolute',
    left: `${left}px`,
    top: `${top}px`,
    zIndex: 99999
  })
}

// 显示 Tooltip
const showTooltip = () => {
  window.dispatchEvent(new CustomEvent(HELP_ICON_OPEN_EVENT, { detail: instanceId }))
  isVisible.value = true
  updatePosition()
  emit('show')
  emit('toggle', true)
}

// 隐藏 Tooltip
const hideTooltip = () => {
  isVisible.value = false
  clearTimeout(autoHideTimer)
  emit('hide')
  emit('toggle', false)
}

// 切换 Tooltip
const toggleTooltip = () => {
  if (isVisible.value) {
    hideTooltip()
  } else {
    showTooltip()

    // 移动端自动隐藏
    if (isMobile.value && props.mobileAutoHide) {
      clearTimeout(autoHideTimer)
      autoHideTimer = setTimeout(() => {
        hideTooltip()
      }, props.autoHideDelay)
    }
  }
}

// 处理 hover 事件
const handleHover = (type) => {
  // 移动端不响应 hover
  if (isMobile.value) return

  // 仅 hover 或 both 模式才响应
  if (props.trigger === 'click') return

  if (type === 'enter') {
    showTooltip()
  } else if (type === 'leave') {
    hideTooltip()
  }
}

// 处理 click 事件
const handleClick = () => {
  // 仅 click 或 both 模式才响应
  if (props.trigger === 'hover' && !isMobile.value) return

  toggleTooltip()
}

// 处理 touch 事件（移動端專用）
const handleTouchEnd = (event) => {
  // 阻止後續的 click 事件（避免雙重觸發）
  event.preventDefault()

  // 仅 click 或 both 模式才响应
  if (props.trigger === 'hover' && !isMobile.value) return

  toggleTooltip()
}

// 点击外部关闭
const handleClickOutside = (event) => {
  if (!isVisible.value) return

  const isInsideIcon = iconRef.value?.contains(event.target)
  const isInsideContainer = containerRef.value?.contains(event.target)

  if (!isInsideIcon && !isInsideContainer) {
    hideTooltip()
  }
}

const handleOtherHelpIconOpen = (event) => {
  if (event.detail !== instanceId) {
    hideTooltip()
  }
}

// 生命周期
onMounted(() => {
  checkMobile()
  document.addEventListener('click', handleClickOutside)
  window.addEventListener(HELP_ICON_OPEN_EVENT, handleOtherHelpIconOpen)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener(HELP_ICON_OPEN_EVENT, handleOtherHelpIconOpen)
  clearTimeout(autoHideTimer)
})
</script>


$text-color: var(--text-primary);
$primary-shadow: rgba(var(--color-primary-rgb), 0.25);
$transition-tooltip: 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);

@mixin touch-area($size) {
  &::before {
    position: absolute;
    top: 50%;
    left: 50%;
    width: $size;
    height: $size;
    content: '';
    transform: translate(-50%, -50%);
  }
}

.help-icon-container {
  position: relative;
  display: inline-block;
}

/*
 * 主体玻璃样式由 global-help-icon-shell 提供，
 * 当前组件只负责尺寸和交互状态。
 */
.help-icon {
  position: relative;
  border-radius: 50%;

  &.size-sm {
    width: 20px;
    height: 20px;
    font-size: 12px;

    @include touch-area(44px);
  }

  &.size-md {
    width: 24px;
    height: 24px;
    font-size: 14px;

    @include touch-area(44px);
  }

  &.size-lg {
    width: 28px;
    height: 28px;
    font-size: 16px;

    @include touch-area(48px);
  }

  &:hover {
    background: linear-gradient(
      145deg,
      var(--text-white),
      var(--glass-90)
    );
    box-shadow:
      inset 0 0 0.5px var(--glass-50),
      0 6px 16px $primary-shadow,
      0 0 0 0.5px var(--glass-20);
    transform: scale(1.1);
  }

  &:active {
    box-shadow:
      inset 0 0 0.5px var(--glass-30),
      0 2px 8px rgba(var(--color-primary-rgb), 0.2);
    transform: scale(1.05);
  }
}

/*
 * Tooltip 通过 Teleport 渲染到 body，
 * 因此保持为顶层选择器。
 * 玻璃表面由 global-tooltip-surface 提供。
 */
.help-tooltip {
  position: absolute;
  padding: 10px 14px;
  color: $text-color;
  font-size: 13px;
  line-height: 1.5;
  text-align: center;
  overflow-wrap: break-word;
  pointer-events: none;
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: all $transition-tooltip;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px) scale(0.95);
}

