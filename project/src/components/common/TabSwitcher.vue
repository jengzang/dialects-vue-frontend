<template>
  <div :class="['tabs-wrapper', `tabs-wrapper--${mode}`, { 'tabs-wrapper--navigation-only': navigationOnly }, `tabs-wrapper--${size}`]">
    <div
      ref="navigationPlaceholder"
      :class="{ 'tabs-navigation-slot': pinNavigation }"
      :style="pinNavigation ? navigationPlaceholderStyle : { display: 'contents' }"
    >
      <div
        ref="navigationElement"
        :class="['tabs-navigation', 'ui-tabs-navigation', `ui-tabs-navigation--${mode}`, `ui-tabs-navigation--${variant}`]"
        :style="navigationStyle"
      >
        <!-- 额外的 tab 左侧内容插槽 -->
        <slot name="tab-extra"></slot>
        <nav
          ref="tabList"
          class="tabs ui-scrollbar--hidden"
          :role="useRouter ? undefined : navigationOnly ? 'group' : 'tablist'"
          :aria-label="ariaLabel || undefined"
          :aria-orientation="useRouter || navigationOnly ? undefined : mode === 'adaptive' && !isPortrait ? 'vertical' : 'horizontal'"
        >
          <component
            :is="useRouter && !tab.disabled ? RouterLink : 'button'"
            v-for="tab in tabs"
            :id="tabId(tab.name)"
            :key="tab.name"
            :to="useRouter && !tab.disabled ? resolveTabLocation(tab.name) : undefined"
            :replace="useRouter && !tab.disabled ? true : undefined"
            :type="!useRouter || tab.disabled ? 'button' : undefined"
            :class="['tab', 'ui-tab-item', { active: currentTab === tab.name }]"
            :disabled="tab.disabled || undefined"
            :role="useRouter || navigationOnly ? undefined : 'tab'"
            :aria-current="useRouter && currentTab === tab.name ? 'page' : undefined"
            :aria-selected="useRouter || navigationOnly ? undefined : currentTab === tab.name"
            :aria-pressed="!useRouter && navigationOnly ? currentTab === tab.name : undefined"
            :aria-controls="useRouter || navigationOnly ? undefined : panelId"
            :tabindex="useRouter || navigationOnly ? undefined : tab.name === focusableTab ? 0 : -1"
            :data-label="mode === 'segmented' ? tab.label : undefined"
            @click="handleTabClick(tab, $event)"
            @keydown="handleTabKeydown"
          >
            {{ tab.label }}
          </component>
        </nav>
      </div>
    </div>

    <div v-if="!navigationOnly && $slots.header" class="tabs-header">
      <slot name="header"></slot>
    </div>

    <div
      v-if="!navigationOnly"
      :id="panelId"
      ref="panelElement"
      :class="[
        'tab-content',
        {
          'tab-content--swiping': swipeState.dragging,
          'tab-content--settling': swipeState.settling,
          'tab-content--enter-next': swipeEnterDirection === 1,
          'tab-content--enter-prev': swipeEnterDirection === -1,
        }
      ]"
      :style="panelSwipeStyle"
      :role="useRouter ? undefined : 'tabpanel'"
      :aria-labelledby="useRouter ? undefined : tabId(currentTab)"
      @animationend="handlePanelAnimationEnd"
    >
      <!-- 使用具名插槽渲染每个 tab 的内容 -->
      <slot :current-tab="currentTab"></slot>
    </div>

    <div
      v-if="showSwipeEdgeGlow"
      :class="[
        'tab-swipe-edge-glow',
        swipeState.direction === 1 ? 'tab-swipe-edge-glow--right' : 'tab-swipe-edge-glow--left',
        {
          'tab-swipe-edge-glow--ready': swipeState.ready,
          'tab-swipe-edge-glow--boundary': swipeState.atBoundary,
        }
      ]"
      :style="swipeEdgeGlowStyle"
      aria-hidden="true"
    />
  </div>
</template>

<script setup>
import { computed, inject, onBeforeUnmount, ref, useId, watch } from 'vue'
import { RouterLink, routeLocationKey, routerKey } from 'vue-router'
import { useMediaQuery } from '@vueuse/core'
import { useViewportPinnedElement } from '@/composables/ui/useViewportPinnedElement.js'
import { useTabSwipe } from '@/composables/ui/useTabSwipe.js'

const props = defineProps({
  mode: {
    type: String,
    default: 'underline',
    validator: (value) => ['underline', 'adaptive', 'segmented'].includes(value)
  },
  navigationOnly: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'compact'].includes(value)
  },
  variant: {
    type: String,
    default: 'surface',
    validator: (value) => ['surface', 'solid'].includes(value)
  },
  ariaLabel: {
    type: String,
    default: ''
  },
  // Tab 配置数组: [{ name: 'tab1', label: '标签1' }, ...]
  tabs: {
    type: Array,
    required: true,
    validator: (tabs) => {
      return tabs.every(tab => tab.name && tab.label)
    }
  },

  // 当前选中的 tab (支持 v-model)
  modelValue: {
    type: String,
    default: ''
  },

  // 是否使用路由模式 (true: 同步到 route, false: 仅 emit)
  useRouter: {
    type: Boolean,
    default: true
  },

  // 路由模式下当前对应的 tab 值，由外层根据 params/query 映射后传入
  routeValue: {
    type: String,
    default: ''
  },

  // 路由模式下点击 tab 后的跳转解析函数，返回 router.replace 的 location
  resolveRoute: {
    type: Function,
    default: null
  },

  // 默认选中的 tab
  defaultTab: {
    type: String,
    default: ''
  },
  pinNavigation: {
    type: Boolean,
    default: false
  },
  // 原生 App (Android / iOS) 下是否允许左右滑动切换相邻 tab（需按页显式开启）
  swipeable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'tab-change'])

const route = inject(routeLocationKey, undefined)
const router = inject(routerKey, undefined)
const tabList = ref(null)
const navigationElement = ref(null)
const navigationPlaceholder = ref(null)
const panelElement = ref(null)
const isPortrait = useMediaQuery('(max-aspect-ratio: 1 / 1)')
const id = useId()
const panelId = `${id}-panel`
const tabId = (name) => `${id}-tab-${name}`
const {
  elementStyle: navigationStyle,
  placeholderStyle: navigationPlaceholderStyle,
} = useViewportPinnedElement({
  elementRef: navigationElement,
  placeholderRef: navigationPlaceholder,
  enabled: () => props.pinNavigation,
})

// 计算当前选中的 tab
const currentTab = computed(() => {
  if (props.useRouter) {
    return props.routeValue || props.modelValue || props.defaultTab || (props.tabs[0]?.name || '')
  } else {
    return props.modelValue || props.defaultTab || (props.tabs[0]?.name || '')
  }
})

const focusableTab = computed(() => {
  const enabled = props.tabs.filter(tab => !tab.disabled)
  return enabled.find(tab => tab.name === currentTab.value)?.name || enabled[0]?.name
})

const resolveTabLocation = (tabName) => {
  return typeof props.resolveRoute === 'function'
    ? props.resolveRoute(tabName, route)
    : { query: { ...route.query, sub: tabName } }
}

// 路由链接自行 replace；内部切换由父页面接收事件后处理。
const handleTabClick = (tab, event) => {
  if (tab.disabled) return
  if (props.useRouter && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button > 0)) {
    return
  }

  emit('update:modelValue', tab.name)
  emit('tab-change', tab.name)
}

const findAdjacentEnabledTab = (direction) => {
  const currentIndex = props.tabs.findIndex(tab => tab.name === currentTab.value)
  if (currentIndex < 0) return null
  for (let i = currentIndex + direction; i >= 0 && i < props.tabs.length; i += direction) {
    if (!props.tabs[i].disabled) return props.tabs[i]
  }
  return null
}

const swipeEnterDirection = ref(0)
let swipeEnterTimer = null

const clearSwipeEnterAnimation = () => {
  if (swipeEnterTimer !== null) {
    clearTimeout(swipeEnterTimer)
    swipeEnterTimer = null
  }
  swipeEnterDirection.value = 0
}

const triggerSwipeEnterAnimation = (direction) => {
  clearSwipeEnterAnimation()
  swipeEnterDirection.value = direction
  swipeEnterTimer = setTimeout(() => {
    swipeEnterTimer = null
    swipeEnterDirection.value = 0
  }, 260)
}

const handlePanelAnimationEnd = (event) => {
  if (event.target === panelElement.value && swipeEnterDirection.value !== 0) {
    clearSwipeEnterAnimation()
  }
}

const handleSwipeSwitch = (direction) => {
  const targetTab = findAdjacentEnabledTab(direction)
  if (!targetTab) return

  triggerSwipeEnterAnimation(direction)
  if (props.useRouter && router) {
    router.replace(resolveTabLocation(targetTab.name))
  }
  emit('update:modelValue', targetTab.name)
  emit('tab-change', targetTab.name)
}

const { swipeState } = useTabSwipe({
  elementRef: panelElement,
  enabled: () => props.swipeable && !props.navigationOnly,
  canSwipe: (direction) => Boolean(findAdjacentEnabledTab(direction)),
  onSwipe: handleSwipeSwitch,
})

const panelSwipeStyle = computed(() => {
  if (!swipeState.value.dragging && !swipeState.value.settling) {
    return undefined
  }
  return {
    transform: `translate3d(${swipeState.value.offsetX}px, 0, 0)`,
  }
})

const showSwipeEdgeGlow = computed(() => {
  return !props.navigationOnly && swipeState.value.dragging && swipeState.value.progress > 0.05
})

const swipeEdgeGlowStyle = computed(() => {
  const { progress, ready, atBoundary } = swipeState.value
  const opacity = atBoundary
    ? Number((0.18 + progress * 0.2).toFixed(2))
    : Number((0.28 + progress * 0.52 + (ready ? 0.16 : 0)).toFixed(2))
  const scaleX = Number((0.72 + progress * 0.36 + (ready ? 0.14 : 0)).toFixed(3))
  const scaleY = Number((0.86 + progress * 0.14 + (ready ? 0.06 : 0)).toFixed(3))
  return {
    '--swipe-glow-opacity': opacity,
    '--swipe-glow-scale-x': scaleX,
    '--swipe-glow-scale-y': scaleY,
  }
})

onBeforeUnmount(() => {
  clearSwipeEnterAnimation()
})

const handleTabKeydown = (event) => {
  if (props.useRouter) return
  const enabled = [...tabList.value.querySelectorAll('.ui-tab-item:not(:disabled)')]
  const index = enabled.indexOf(event.currentTarget)
  if (index < 0) return
  const vertical = window.getComputedStyle(tabList.value).flexDirection === 'column'
  const previous = vertical ? 'ArrowUp' : 'ArrowLeft'
  const next = vertical ? 'ArrowDown' : 'ArrowRight'
  let target
  if (event.key === previous) target = enabled[(index - 1 + enabled.length) % enabled.length]
  else if (event.key === next) target = enabled[(index + 1) % enabled.length]
  else if (event.key === 'Home') target = enabled[0]
  else if (event.key === 'End') target = enabled.at(-1)
  if (!target) return
  event.preventDefault()
  target.focus()
}

watch(currentTab, () => {
  const nav = tabList.value
  const active = nav?.querySelector('.active')
  if (!active || nav.scrollWidth <= nav.clientWidth) return
  const left = active.offsetLeft
  if (left < nav.scrollLeft) nav.scrollTo?.({ left })
  else if (left + active.offsetWidth > nav.scrollLeft + nav.clientWidth) {
    nav.scrollTo?.({ left: left + active.offsetWidth - nav.clientWidth })
  }
}, { flush: 'post' })
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.tabs-wrapper {
  @include flex-col;
  align-items: center;
  width: 100%;
  min-width: 0;
  padding: 0;
}

.tabs-navigation {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 100%;
  margin-bottom: 12px;
}

.tabs-navigation-slot {
  display: flex;
  justify-content: center;
  width: 100%;
  max-width: 100%;
  margin-bottom: 12px;

  .tabs-navigation {
    width: fit-content;
    max-width: 100%;
    margin-bottom: 0;
    box-sizing: border-box;
    z-index: 101;
  }
}

.tabs {
  display: flex;
  flex-wrap: nowrap;
  gap: 16px;
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  position: relative;
}

.tab {
  flex-shrink: 0;
  padding: 12px 8px 6px;
  &.active {
    padding: 8px 8px 4px;
  }
}

.tabs-header {
  width: 100%;
  padding: 6px 0 2px;
}

.tab-content {
  @include flex-col;
  flex: 1;
  width: 100%;
  min-width: 0;

  &--swiping {
    will-change: transform;
  }

  &--settling {
    transition: transform 0.26s cubic-bezier(0.22, 1.2, 0.36, 1);
    will-change: transform;
  }

  &--enter-next {
    animation: tab-swipe-enter-next 0.24s cubic-bezier(0.22, 1.12, 0.36, 1);
  }

  &--enter-prev {
    animation: tab-swipe-enter-prev 0.24s cubic-bezier(0.22, 1.12, 0.36, 1);
  }
}

.tab-swipe-edge-glow {
  position: fixed;
  top: 50%;
  z-index: 950;
  width: 44px;
  height: min(36dvh, 240px);
  pointer-events: none;
  opacity: var(--swipe-glow-opacity, 0);
  transition: opacity 0.12s ease, transform 0.14s cubic-bezier(0.22, 1.12, 0.36, 1);
  will-change: transform, opacity;

  &--right {
    right: 0;
    transform-origin: right center;
    transform: translateY(-50%) scaleX(var(--swipe-glow-scale-x, 1)) scaleY(var(--swipe-glow-scale-y, 1));
    border-radius: 999px 0 0 999px;
    background:
      radial-gradient(
        ellipse 100% 52% at 100% 50%,
        rgba(var(--color-primary-rgb), 0.26) 0%,
        var(--glass-highlight, var(--glass-50)) 36%,
        transparent 76%
      );
    box-shadow: inset 1.5px 0 0 var(--glass-highlight, var(--glass-60));
  }

  &--left {
    left: 0;
    transform-origin: left center;
    transform: translateY(-50%) scaleX(var(--swipe-glow-scale-x, 1)) scaleY(var(--swipe-glow-scale-y, 1));
    border-radius: 0 999px 999px 0;
    background:
      radial-gradient(
        ellipse 100% 52% at 0% 50%,
        rgba(var(--color-primary-rgb), 0.26) 0%,
        var(--glass-highlight, var(--glass-50)) 36%,
        transparent 76%
      );
    box-shadow: inset -1.5px 0 0 var(--glass-highlight, var(--glass-60));
  }

  &--ready {
    &.tab-swipe-edge-glow--right {
      background:
        radial-gradient(
          ellipse 100% 54% at 100% 50%,
          rgba(var(--color-primary-rgb), 0.42) 0%,
          var(--glass-highlight, var(--glass-80)) 42%,
          transparent 80%
        );
    }

    &.tab-swipe-edge-glow--left {
      background:
        radial-gradient(
          ellipse 100% 54% at 0% 50%,
          rgba(var(--color-primary-rgb), 0.42) 0%,
          var(--glass-highlight, var(--glass-80)) 42%,
          transparent 80%
        );
    }
  }

  &--boundary {
    filter: saturate(0.45);
  }
}

@keyframes tab-swipe-enter-next {
  from {
    opacity: 0.72;
    transform: translate3d(22px, 0, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@keyframes tab-swipe-enter-prev {
  from {
    opacity: 0.72;
    transform: translate3d(-22px, 0, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tab-content {
    &--settling {
      transition: none;
    }

    &--enter-next,
    &--enter-prev {
      animation: none;
    }
  }

  .tab-swipe-edge-glow {
    transition: none;
  }
}

.tabs-wrapper--adaptive {
  box-sizing: border-box;
  padding-left: calc(136px + 2rem);

  .tabs-navigation {
    @include flex-col;
    align-items: stretch;
    position: fixed;
    top: calc(140px + env(safe-area-inset-top, 0px));
    left: calc(2rem + env(safe-area-inset-left, 0px));
    width: 136px;
    max-height: calc(100dvh - 160px);
    overflow-y: auto;
    padding: 4px;
    z-index: 100;
  }

  .tabs {
    @include flex-col;
    gap: 4px;
  }

  .tab {
    padding: 12px 16px;
  }

  .tab-content {
    align-items: center;
  }
}

@media (max-aspect-ratio: 1 / 1) {
  .tabs {
    gap: 6px;
  }

  .tab {
    padding: 10px 8px 5px;
  }

  .tabs-wrapper--adaptive {
    padding-left: 0;

    .tabs-navigation {
      position: static;
      flex-direction: row;
      width: 100%;
      max-height: none;
      overflow-y: visible;
      box-sizing: border-box;
    }

    .tabs {
      flex-direction: row;
      flex: 1;
      gap: 4px;
    }

    .tab {
      flex: 1 0 auto;
      padding: 10px 8px;
    }
  }
}

.tabs-wrapper--segmented {
  .tabs-navigation { padding: 4px; }
  .tabs { gap: 0; }
  .tab { padding: 10px 16px; }

  @media (max-aspect-ratio: 1 / 1) {
    .tabs { gap: 8px; }
    .tab { padding: 12px 16px; }
  }

  &.tabs-wrapper--compact {
    .tabs { gap: 4px; }
    .tab { min-width: 60px; padding: 3px 6px; }

    @media (max-aspect-ratio: 1 / 1) {
      .tab { min-width: 50px; padding: 4px 2px; }
    }
  }

  @media (pointer: coarse) {
    .tab { min-height: 44px; }
  }
}

.tabs-wrapper--navigation-only {
  display: inline-flex;
  flex-shrink: 0;
  width: auto;
  max-width: 100%;
  vertical-align: middle;

  .tabs-navigation { margin-bottom: 0; box-sizing: border-box; }

  .tabs-navigation-slot { margin-bottom: 0; }
}
</style>
