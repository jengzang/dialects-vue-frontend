<template>
  <Teleport to="body">
    <Transition name="scroll-to-top-fade">
      <button
        v-if="visible && isActive"
        class="scroll-to-top"
        :style="positionStyle"
        :aria-label="t('common.button.scrollToTop')"
        @click="scrollToTop"
      >
        <svg
          class="scroll-to-top__ring"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <circle
            class="scroll-to-top__ring-bg"
            cx="24" cy="24" r="20"
            fill="none"
            stroke-width="3"
          />
          <circle
            class="scroll-to-top__ring-fill"
            cx="24" cy="24" r="20"
            fill="none"
            stroke-width="3"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
            transform="rotate(-90 24 24)"
          />
        </svg>
        <PhArrowLineUp
          class="scroll-to-top__arrow"
          :size="arrowSize"
          weight="bold"
          aria-hidden="true"
        />
      </button>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, unref } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhArrowLineUp } from '@phosphor-icons/vue'
import { registerInstance, unregisterInstance, isTopOfStack } from './scrollToTopState.js'

const { t } = useI18n()

const uid = registerInstance()
const isActive = computed(() => isTopOfStack(uid))

onBeforeUnmount(() => {
  unregisterInstance(uid)
})

const isPortrait = computed(() =>
  window.matchMedia('(max-aspect-ratio: 1/1)').matches
)

const props = defineProps({
  container: {
    type: Object,
    default: null,
  },
  showAfter: {
    type: Number,
    default: 200,
  },
  mobileShowAfter: {
    type: Number,
    default: 100,
  },
  right: {
    type: String,
    default: '18px',
  },
  bottom: {
    type: String,
    default: '24px',
  },
  size: {
    type: Number,
    default: 48,
  },
})

const circumference = 2 * Math.PI * 20

const arrowSize = computed(() => Math.round(props.size * 0.44))

const scrollTop = ref(0)
const scrollHeight = ref(0)
const viewportHeight = ref(0)

let rafId = null
let scrollTarget = null

function resolveEl() {
  return unref(props.container) || null
}

function getMetrics() {
  const el = resolveEl()
  if (el) {
    return {
      top: el.scrollTop,
      height: el.scrollHeight,
      viewport: el.clientHeight,
    }
  }
  return {
    top: window.scrollY || document.documentElement.scrollTop,
    height: document.documentElement.scrollHeight,
    viewport: window.innerHeight,
  }
}

function handleScroll() {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    const m = getMetrics()
    scrollTop.value = m.top
    scrollHeight.value = m.height
    viewportHeight.value = m.viewport
    rafId = null
  })
}

const threshold = computed(() =>
  isPortrait.value ? props.mobileShowAfter : props.showAfter
)

const visible = computed(() => scrollTop.value > threshold.value)

const progress = computed(() => {
  const max = scrollHeight.value - viewportHeight.value
  if (max <= 0) return 0
  return Math.min(scrollTop.value / max, 1)
})

const dashOffset = computed(() => circumference * (1 - progress.value))

const positionStyle = computed(() => ({
  right: props.right,
  bottom: `calc(${props.bottom} + env(safe-area-inset-bottom))`,
  zIndex: props.container ? 20001 : 999,
}))

function scrollToTop() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const el = resolveEl()
  if (el) {
    el.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' })
  } else {
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' })
  }
}

function bindScroll(el) {
  if (scrollTarget) {
    scrollTarget.removeEventListener('scroll', handleScroll, { passive: true })
  }
  scrollTarget = el || window
  scrollTarget.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
}

watch(() => resolveEl(), bindScroll, { immediate: true })

onBeforeUnmount(() => {
  if (scrollTarget) {
    scrollTarget.removeEventListener('scroll', handleScroll, { passive: true })
  }
  if (rafId) cancelAnimationFrame(rafId)
})

</script>

<style scoped lang="scss">
.scroll-to-top {
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  padding: 0;
  cursor: pointer;
  user-select: none;
  border: none;
  border-radius: var(--radius-full);
  background: linear-gradient(
    145deg,
    var(--glass-30),
    var(--glass-20)
  );
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.15),
    0 2px 6px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(15px) saturate(150%);
  -webkit-backdrop-filter: blur(15px) saturate(150%);
  transition:
    opacity 0.25s ease,
    transform 0.25s ease,
    background 0.3s ease,
    box-shadow 0.3s ease;

  &:hover {
    transform: scale(1.08);
    background: linear-gradient(
      145deg,
      var(--glass-50),
      var(--glass-30)
    );
    box-shadow:
      0 12px 24px rgba(0, 0, 0, 0.2),
      0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: scale(1.04);
  }

  &:focus-visible {
    outline: none;
    box-shadow:
      0 8px 16px rgba(0, 0, 0, 0.15),
      0 0 0 3px rgba(var(--color-primary-rgb), 0.45);
  }

  @media (max-aspect-ratio: 1/1) {
    width: 44px;
    height: 44px;
  }
}

.scroll-to-top__ring {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.scroll-to-top__ring-bg {
  stroke: rgba(var(--color-primary-rgb), 0.12);
}

.scroll-to-top__ring-fill {
  stroke: var(--color-primary);
}

.scroll-to-top__arrow {
  position: relative;
  color: var(--color-primary);
}

.scroll-to-top-fade {
  &-enter-active,
  &-leave-active {
    transition:
      opacity 0.25s ease,
      transform 0.25s ease;
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
    transform: translateY(8px);
  }
}
</style>
