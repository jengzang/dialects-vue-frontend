<template>
  <div
    class="showcase"
    ref="showcaseRef"
    @mouseenter="pauseAuto"
    @mouseleave="resumeAuto"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @mousedown="onDragStart"
  >
    <div class="showcase-viewport" :style="{ perspective: '1200px' }">
      <div
        class="showcase-item"
        v-for="(item, i) in items"
        :key="i"
        :class="slotClass(i)"
        @click="handleItemClick(i)"
        :tabindex="slotClass(i) !== 'is-hidden' ? 0 : -1"
        @keydown.enter="handleItemClick(i)"
        @keydown.space.prevent="handleItemClick(i)"
      >
        <div class="showcase-skeleton" :class="{ 'is-hidden': loadedImages.has(i) }">
          <div class="skeleton-line skeleton-line-lg"></div>
          <div class="skeleton-line skeleton-line-sm"></div>
          <div class="skeleton-line skeleton-line-xs"></div>
        </div>
        <img
          :src="item.image"
          :alt="t(item.titleKey)"
          loading="lazy"
          decoding="async"
          :class="{ 'is-loaded': loadedImages.has(i) }"
          @load="onImgLoad($event, i)"
        />
      </div>
    </div>

    <div class="showcase-info">
      <h3 class="showcase-title">{{ t(activeItem.titleKey) }}</h3>
      <button class="showcase-cta" @click="navigateTo(activeItem.route)">
        {{ t(activeItem.actionLabelKey) }} <span class="cta-arrow">→</span>
      </button>
    </div>

    <div class="showcase-dots" role="tablist" :aria-label="t('home.showcase.nav')">
      <button
        v-for="(item, i) in items"
        :key="i"
        class="showcase-dot"
        :class="{ 'is-active': i === activeIndex }"
        role="tab"
        :aria-selected="i === activeIndex"
        :aria-label="`${t('home.showcase.switchTo')} ${t(item.titleKey)}`"
        @click="goTo(i)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const showcaseItems = [
  {
    id: 'zhonggu',
    titleKey: 'home.showcase.zhonggu.title',
    image: '/showcase/zhonggu.webp',
    route: '/menu/query/zhonggu',
    actionLabelKey: 'home.showcase.zhonggu.action'
  },
  {
    id: 'result',
    titleKey: 'home.showcase.result.title',
    image: '/showcase/result.webp',
    route: '/menu/query/zhonggu',
    actionLabelKey: 'home.showcase.result.action'
  },
  {
    id: 'compare',
    titleKey: 'home.showcase.compare.title',
    image: '/showcase/compare.webp',
    route: '/menu/compare/char',
    actionLabelKey: 'home.showcase.compare.action'
  },
  {
    id: 'photiccompare',
    titleKey: 'home.showcase.photiccompare.title',
    image: '/showcase/photiccompare.webp',
    route: '/menu/compare/phonetic',
    actionLabelKey: 'home.showcase.photiccompare.action'
  },
  {
    id: 'yinxi',
    titleKey: 'home.showcase.yinxi.title',
    image: '/showcase/yinxi.webp',
    route: '/menu/pho/matrix',
    actionLabelKey: 'home.showcase.yinxi.action'
  },
  {
    id: 'evolution',
    titleKey: 'home.showcase.evolution.title',
    image: '/showcase/evolution.webp',
    route: '/menu/pho/evolution',
    actionLabelKey: 'home.showcase.evolution.action'
  },
  {
    id: 'villages',
    titleKey: 'home.showcase.villages.title',
    image: '/showcase/villages.webp',
    route: '/explore/villages/gd',
    actionLabelKey: 'home.showcase.villages.action'
  },
  {
    id: 'gis',
    titleKey: 'home.showcase.gis.title',
    image: '/showcase/gis.webp',
    route: '/explore/gis',
    actionLabelKey: 'home.showcase.gis.action'
  }
]

const items = shallowRef(showcaseItems)
const activeIndex = ref(0)
const showcaseRef = ref(null)
const direction = ref(1)

let autoTimer = null
const AUTO_INTERVAL = 5500
const prefersReducedMotion = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false

const N = computed(() => items.value.length)

function wrapIndex(i) {
  return ((i % N.value) + N.value) % N.value
}

const activeItem = computed(() => items.value[activeIndex.value])

function slotClass(i) {
  const dist = wrapIndex(i - activeIndex.value)
  if (dist === 0) return 'is-active'
  if (dist === 1) return 'is-next'
  if (dist === N.value - 1) return 'is-prev'
  return 'is-hidden'
}

function navigateTo(path) {
  router.push({
    path: buildLocalePath(resolveRouteLocale(route), path),
    query: undefined
  })
}

function handleItemClick(i) {
  const cls = slotClass(i)
  if (cls === 'is-prev') goToPrev()
  else if (cls === 'is-next') goToNext()
}

function goToPrev() {
  direction.value = -1
  activeIndex.value = wrapIndex(activeIndex.value - 1)
  resetAuto()
}

function goToNext() {
  direction.value = 1
  activeIndex.value = wrapIndex(activeIndex.value + 1)
  resetAuto()
}

function goTo(i) {
  if (i === activeIndex.value) return
  direction.value = i > activeIndex.value ? 1 : -1
  activeIndex.value = i
  resetAuto()
}

function pauseAuto() {
  clearInterval(autoTimer)
  autoTimer = null
}

function resumeAuto() {
  if (prefersReducedMotion) return
  if (autoTimer) return
  autoTimer = setInterval(goToNext, AUTO_INTERVAL)
}

function resetAuto() {
  pauseAuto()
  resumeAuto()
}

// Drag / swipe
let dragging = false
let dragStartX = 0
let dragStartY = 0
let dragMoved = false
let dragHandled = false

function onDragStart(e) {
  if (e.target.closest('.showcase-cta, .showcase-dot')) return
  dragging = true
  dragMoved = false
  dragHandled = false
  dragStartX = e.clientX
  dragStartY = e.clientY
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e) {
  if (!dragging || dragHandled) return
  const dx = e.clientX - dragStartX
  const dy = e.clientY - dragStartY
  if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragMoved = true
  if (!dragMoved) return
  if (Math.abs(dx) <= Math.abs(dy)) return
  dragHandled = true
  if (dx < -40) goToNext()
  else if (dx > 40) goToPrev()
}

function onDragEnd() {
  dragging = false
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}

let touchStartX = 0
let touchStartY = 0

function onTouchStart(e) {
  if (e.target.closest('.showcase-cta, .showcase-dot')) return
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
}

function onTouchMove(e) {
  // Don't preventDefault here to avoid blocking vertical scroll
}

function onTouchEnd(e) {
  const dx = e.changedTouches[0].clientX - touchStartX
  const dy = e.changedTouches[0].clientY - touchStartY
  if (Math.abs(dx) <= Math.abs(dy)) return
  if (Math.abs(dx) < 40) return
  if (dx < -40) goToNext()
  else if (dx > 40) goToPrev()
}

// Keyboard
function onKeydown(e) {
  if (!showcaseRef.value) return
  const active = document.activeElement
  if (!showcaseRef.value.contains(active)) return
  if (e.key === 'ArrowLeft') { e.preventDefault(); goToPrev() }
  if (e.key === 'ArrowRight') { e.preventDefault(); goToNext() }
}

const loadedImages = reactive(new Set())

function onImgLoad(e, i) {
  loadedImages.add(i)
}

onMounted(() => {
  if (!prefersReducedMotion) {
    autoTimer = setInterval(goToNext, AUTO_INTERVAL)
  }
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  clearInterval(autoTimer)
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
})
</script>

<style scoped lang="scss">
@use 'sass:math';
$ease-apple: cubic-bezier(0.32, 0.72, 0, 1);
$side-scale: 0.83;
$side-rotate: 12deg;
$side-translate: -36%;
$active-width: 70%;
$img-ratio: math.div(16, 10);
$duration: 450ms;

.showcase {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  user-select: none;
  -webkit-user-select: none;
}

.showcase-viewport {
  position: relative;
  width: 100%;
  aspect-ratio: math.div(16, 8);
  overflow: hidden;
  border-radius: var(--radius-lg);
  contain: layout style paint;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border: 1px solid var(--glass-40);
    border-radius: var(--radius-lg);
    pointer-events: none;
  }
}

.showcase-item {
  position: absolute;
  top: 50%;
  left: 50%;
  width: $active-width;
  aspect-ratio: $img-ratio;
  height: auto;
  transform-origin: center center;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  transition:
    transform $duration $ease-apple,
    opacity $duration $ease-apple;

  img {
    position: relative;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-glass);
    opacity: 0;
    transition: opacity 0.4s ease;
    z-index: 1;

    &.is-loaded {
      opacity: 1;
    }
  }

  .showcase-skeleton {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 12%;
    border-radius: var(--radius-md);

    &.is-hidden {
      display: none;
    }
  }

  .skeleton-line {
    border-radius: var(--radius-pill);
    background: linear-gradient(
      90deg,
      rgba(var(--text-slate-light-rgb), 0.15) 25%,
      rgba(var(--text-slate-light-rgb), 0.35) 50%,
      rgba(var(--text-slate-light-rgb), 0.15) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.2s linear infinite;

    &-lg {
      width: 62%;
      height: 16px;
      margin-bottom: 10px;
    }

    &-sm {
      width: 42%;
      height: 13px;
      margin-bottom: 8px;
    }

    &-xs {
      width: 28%;
      height: 11px;
    }
  }

  &.is-active {
    transform: translate(-50%, -50%) translateX(0) scale(1) rotateY(0deg);
    opacity: 1;
    z-index: 3;
    cursor: default;
    pointer-events: auto;

    img {
      box-shadow: var(--shadow-lg);
      transition: box-shadow $duration $ease-apple, transform $duration $ease-apple;
    }

    &:hover img {
      box-shadow: 0 12px 48px rgba(var(--color-primary-rgb), 0.22), var(--shadow-lg);
    }
  }

  &.is-prev {
    transform: translate(-50%, -50%) translateX($side-translate) scale($side-scale) rotateY($side-rotate);
    opacity: 0.7;
    z-index: 2;
    cursor: pointer;
    pointer-events: auto;

    &:hover {
      opacity: 1;
      transform: translate(-50%, -50%) translateX($side-translate) scale(calc(#{$side-scale} + 0.04)) rotateY($side-rotate);

      img {
        box-shadow: 0 8px 32px rgba(var(--color-primary-rgb), 0.18);
      }
    }

    &:active {
      transform: translate(-50%, -50%) translateX($side-translate) scale(calc(#{$side-scale} - 0.02)) rotateY($side-rotate);
    }
  }

  &.is-next {
    transform: translate(-50%, -50%) translateX(calc(-1 * #{$side-translate})) scale($side-scale) rotateY(-#{$side-rotate});
    opacity: 0.7;
    z-index: 2;
    cursor: pointer;
    pointer-events: auto;

    &:hover {
      opacity: 1;
      transform: translate(-50%, -50%) translateX(calc(-1 * #{$side-translate})) scale(calc(#{$side-scale} + 0.04)) rotateY(-#{$side-rotate});

      img {
        box-shadow: 0 8px 32px rgba(var(--color-primary-rgb), 0.18);
      }
    }

    &:active {
      transform: translate(-50%, -50%) translateX(calc(-1 * #{$side-translate})) scale(calc(#{$side-scale} - 0.02)) rotateY(-#{$side-rotate});
    }
  }

  &.is-hidden {
    opacity: 0;
    z-index: 1;
    pointer-events: none;
  }
}

.showcase-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 0.5rem 0.5rem;
  max-width: $active-width;
  margin: 0 auto;
}

.showcase-title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
}

.showcase-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0;
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: gap 0.2s ease;

  &:hover {
    .cta-arrow {
      transform: translateX(2px);
    }
  }
}

.cta-arrow {
  display: inline-block;
  transition: transform 0.2s ease;
}

.showcase-dots {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  padding-top: 0.25rem;
}

.showcase-dot {
  width: 8px;
  height: 8px;
  padding: 0;
  background: rgba(var(--color-primary-rgb), 0.25);
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition:
    background 0.25s ease,
    transform 0.25s ease;

  &.is-active {
    background: var(--color-primary);
    transform: scale(1.3);
  }

  &:hover:not(.is-active) {
    background: rgba(var(--color-primary-rgb), 0.45);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

// Responsive: compact mode when screen is squarish or tall
@media (max-aspect-ratio: #{math.div(4, 3)}) {
  .showcase {
    max-width: 720px;
  }

  .showcase-viewport {
    aspect-ratio: math.div(16, 10);
  }

  .showcase-item {
    width: 88%;

    &.is-prev {
      transform: translate(-50%, -50%) translateX(-60%) scale($side-scale) rotateY(0deg);
      opacity: 0.45;

      &:hover {
        opacity: 0.85;
        transform: translate(-50%, -50%) translateX(-60%) scale(calc(#{$side-scale} + 0.04)) rotateY(0deg);
      }

      &:active {
        transform: translate(-50%, -50%) translateX(-60%) scale(calc(#{$side-scale} - 0.02)) rotateY(0deg);
      }
    }

    &.is-next {
      transform: translate(-50%, -50%) translateX(40%) scale($side-scale) rotateY(0deg);
      opacity: 0.45;

      &:hover {
        opacity: 0.85;
        transform: translate(-50%, -50%) translateX(40%) scale(calc(#{$side-scale} + 0.04)) rotateY(0deg);
      }

      &:active {
        transform: translate(-50%, -50%) translateX(40%) scale(calc(#{$side-scale} - 0.02)) rotateY(0deg);
      }
    }
  }

  .showcase-info {
    max-width: 88%;
  }
}

// Responsive: narrow portrait mode — single card, no 3D
@media (max-aspect-ratio: #{math.div(3, 4)}) {
  .showcase {
    max-width: 100%;
  }

  .showcase-viewport {
    aspect-ratio: math.div(4, 3);
  }

  .showcase-item {
    width: 100%;
    transition: opacity 300ms $ease-apple;

    &.is-active {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }

    &.is-prev,
    &.is-next {
      transform: translate(-50%, -50%) scale(0.95);
      opacity: 0;
    }

    &.is-hidden {
      opacity: 0;
    }
  }

  .showcase-info {
    max-width: 100%;
  }

  .showcase-title {
    font-size: 0.875rem;
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .showcase-item {
    transition-duration: 0.01ms;
  }

  img {
    animation: none;
  }
}
</style>
