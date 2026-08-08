<template>
  <div
    class="showcase"
    ref="showcaseRef"
    @mouseenter="pauseAuto"
    @mouseleave="resumeAuto"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @wheel="onWheel"
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
        <div class="showcase-img-wrap">
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
        <div class="showcase-card-info">
          <h3 class="showcase-card-title"><BarIcon :icon="item.icon" /> {{ t(item.titleKey) }}</h3>
          <button class="showcase-card-cta" @click.stop="navigateTo(item.route)">
            {{ t(item.actionLabelKey) }} <span class="cta-arrow">→</span>
          </button>
        </div>
      </div>
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

    <Teleport to="body">
      <div
        v-if="previewImage"
        class="showcase-preview-overlay"
        @click="closePreview"
      >
        <button class="close-btn showcase-preview-close" @click="closePreview" :aria-label="t('common.button.close')">
          ×
        </button>
        <h3 class="showcase-preview-title">{{ t(activeItem.titleKey) }}</h3>
        <img
          :src="previewImage"
          :alt="t(activeItem.titleKey)"
          class="showcase-preview-img"
          :class="{ 'is-zoomed': previewZoom > 1, 'is-dragging': isPreviewDragging }"
          :style="previewStyle"
          @click.stop
          @wheel.prevent="onPreviewWheel"
          @dblclick.prevent="togglePreviewZoom"
          @mousedown.prevent="onPreviewDragStart"
          @touchstart.prevent="onPreviewTouchStart"
          @touchmove.prevent="onPreviewTouchMove"
          @touchend.prevent="onPreviewTouchEnd"
        />
        <button class="showcase-preview-cta" @click.stop="navigateTo(activeItem.route)">
          {{ t(activeItem.actionLabelKey) }}
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
import BarIcon from '@/components/common/BarIcon.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const showcaseItems = [
  {
    id: 'zhonggu',
    icon: '🔍',
    titleKey: 'home.showcase.zhonggu.title',
    image: '/showcase/zhonggu.webp',
    route: '/menu/query/zhonggu',
    actionLabelKey: 'home.showcase.zhonggu.action'
  },
  {
    id: 'result',
    icon: '📉',
    titleKey: 'home.showcase.result.title',
    image: '/showcase/result.webp',
    route: '/menu/query/zhonggu',
    actionLabelKey: 'home.showcase.result.action'
  },
  {
    id: 'compare',
    icon: '↔️',
    titleKey: 'home.showcase.compare.title',
    image: '/showcase/compare.webp',
    route: '/menu/compare/char',
    actionLabelKey: 'home.showcase.compare.action'
  },
  {
    id: 'photiccompare',
    icon: '🎵',
    titleKey: 'home.showcase.photiccompare.title',
    image: '/showcase/photiccompare.webp',
    route: '/menu/compare/phonetic',
    actionLabelKey: 'home.showcase.photiccompare.action'
  },
  {
    id: 'yinxi',
    icon: '⚛️',
    titleKey: 'home.showcase.yinxi.title',
    image: '/showcase/yinxi.webp',
    route: '/menu/pho/matrix',
    actionLabelKey: 'home.showcase.yinxi.action'
  },
  {
    id: 'evolution',
    icon: '🥧',
    titleKey: 'home.showcase.evolution.title',
    image: '/showcase/evolution.webp',
    route: '/menu/pho/evolution',
    actionLabelKey: 'home.showcase.evolution.action'
  },
  {
    id: 'villages',
    icon: '🏘️',
    titleKey: 'home.showcase.villages.title',
    image: '/showcase/villages.webp',
    route: '/explore/villages/gd',
    actionLabelKey: 'home.showcase.villages.action'
  },
  {
    id: 'gis',
    icon: '🗺️',
    titleKey: 'home.showcase.gis.title',
    image: '/showcase/gis.webp',
    route: '/explore/gis',
    actionLabelKey: 'home.showcase.gis.action'
  },
  {
    id: 'praat',
    icon: '🎙️',
    titleKey: 'home.showcase.praat.title',
    image: '/showcase/praat.webp',
    route: '/explore/tools/praat',
    actionLabelKey: 'home.showcase.praat.action'
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

const previewImage = ref(null)
const previewZoom = ref(1)
const previewPanX = ref(0)
const previewPanY = ref(0)

const isPreviewDragging = ref(false)

const previewStyle = computed(() => {
  const transform = `scale(${previewZoom.value}) translate(${previewPanX.value}px, ${previewPanY.value}px)`
  const transition = isPreviewDragging.value ? 'none' : 'transform 0.2s ease'
  const cursor = isPreviewDragging.value ? 'grabbing' : previewZoom.value > 1 ? 'grab' : 'zoom-in'
  return { transform, transition, cursor }
})

function onPreviewKeydown(e) {
  if (e.key === 'Escape') closePreview()
}

function openPreview(src) {
  previewImage.value = src
  previewZoom.value = 1
  previewPanX.value = 0
  previewPanY.value = 0
  pauseAuto()
  document.addEventListener('keydown', onPreviewKeydown)
}

function closePreview() {
  previewImage.value = null
  resumeAuto()
  document.removeEventListener('keydown', onPreviewKeydown)
}

function togglePreviewZoom() {
  previewZoom.value = previewZoom.value > 1 ? 1 : 2
  if (previewZoom.value === 1) {
    previewPanX.value = 0
    previewPanY.value = 0
  }
}

function onPreviewWheel(e) {
  const delta = e.deltaY > 0 ? -0.12 : 0.12
  previewZoom.value = Math.max(0.5, Math.min(4, previewZoom.value + delta))
  if (previewZoom.value <= 1) {
    previewPanX.value = 0
    previewPanY.value = 0
  }
}

let previewDragStartX = 0
let previewDragStartY = 0
let previewPanStartX = 0
let previewPanStartY = 0

function onPreviewDragStart(e) {
  if (previewZoom.value <= 1) return
  isPreviewDragging.value = true
  previewDragStartX = e.clientX
  previewDragStartY = e.clientY
  previewPanStartX = previewPanX.value
  previewPanStartY = previewPanY.value
  document.addEventListener('mousemove', onPreviewDragMove)
  document.addEventListener('mouseup', onPreviewDragEnd)
}

function onPreviewDragMove(e) {
  if (!isPreviewDragging.value) return
  previewPanX.value = previewPanStartX + (e.clientX - previewDragStartX) / previewZoom.value
  previewPanY.value = previewPanStartY + (e.clientY - previewDragStartY) / previewZoom.value
}

function onPreviewDragEnd() {
  isPreviewDragging.value = false
  document.removeEventListener('mousemove', onPreviewDragMove)
  document.removeEventListener('mouseup', onPreviewDragEnd)
}

let pinchStartDist = 0
let pinchStartZoom = 1
let pinchCenterX = 0
let pinchCenterY = 0

function getTouchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX
  const dy = touches[0].clientY - touches[1].clientY
  return Math.hypot(dx, dy)
}

function onPreviewTouchStart(e) {
  if (e.touches.length === 2) {
    isPreviewDragging.value = false
    pinchStartDist = getTouchDist(e.touches)
    pinchStartZoom = previewZoom.value
    pinchCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2
    pinchCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2
    return
  }
  if (e.touches.length !== 1) return
  if (previewZoom.value <= 1) return
  isPreviewDragging.value = true
  previewDragStartX = e.touches[0].clientX
  previewDragStartY = e.touches[0].clientY
  previewPanStartX = previewPanX.value
  previewPanStartY = previewPanY.value
}

function onPreviewTouchMove(e) {
  if (e.touches.length === 2) {
    const newDist = getTouchDist(e.touches)
    const newZoom = Math.max(0.5, Math.min(4, pinchStartZoom * (newDist / pinchStartDist)))
    previewZoom.value = newZoom
    if (newZoom <= 1) {
      previewPanX.value = 0
      previewPanY.value = 0
    }
    return
  }
  if (!isPreviewDragging.value || e.touches.length !== 1) return
  previewPanX.value = previewPanStartX + (e.touches[0].clientX - previewDragStartX) / previewZoom.value
  previewPanY.value = previewPanStartY + (e.touches[0].clientY - previewDragStartY) / previewZoom.value
}

function onPreviewTouchEnd(e) {
  if (e.touches.length === 0) {
    isPreviewDragging.value = false
  }
}

function handleItemClick(i) {
  const cls = slotClass(i)
  if (cls === 'is-prev') goToPrev()
  else if (cls === 'is-next') goToNext()
  else if (cls === 'is-active') openPreview(items.value[i].image)
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
  if (previewImage.value) return
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
  if (e.target.closest('.showcase-card-cta, .showcase-dot')) return
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
  if (e.target.closest('.showcase-card-cta, .showcase-dot')) return
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
}

function onTouchMove(e) {
  if (e.target.closest('.showcase-card-cta, .showcase-dot')) return
  const dx = e.touches[0].clientX - touchStartX
  const dy = e.touches[0].clientY - touchStartY
  // 横滑时阻止页面滚动
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
    e.preventDefault()
  }
}

function onTouchEnd(e) {
  const dx = e.changedTouches[0].clientX - touchStartX
  const dy = e.changedTouches[0].clientY - touchStartY
  if (Math.abs(dx) <= Math.abs(dy)) return
  if (Math.abs(dx) < 40) return
  if (dx < -40) goToNext()
  else if (dx > 40) goToPrev()
}

// Scroll wheel
let wheelCooldown = false
const WHEEL_COOLDOWN = 600

function onWheel(e) {
  if (!showcaseRef.value) return
  if (!showcaseRef.value.contains(e.target)) return
  if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) && Math.abs(e.deltaX) < 5) return
  if (wheelCooldown) return

  const delta = e.deltaX || e.deltaY
  if (delta > 0) goToNext()
  else goToPrev()

  wheelCooldown = true
  setTimeout(() => { wheelCooldown = false }, WHEEL_COOLDOWN)
  e.preventDefault()
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
  document.removeEventListener('keydown', onPreviewKeydown)
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('mousemove', onPreviewDragMove)
  document.removeEventListener('mouseup', onPreviewDragEnd)
})
</script>

<style scoped lang="scss">
@use 'sass:math';
$ease-apple: cubic-bezier(0.32, 0.72, 0, 1);
$side-scale: 0.83;
$side-rotate: 12deg;
$side-translate: -36%;
$active-width: 60%;
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
  aspect-ratio: math.div(16, 7.5);
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
  display: flex;
  flex-direction: column;
  transform-origin: center center;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  transition:
    transform $duration $ease-apple,
    opacity $duration $ease-apple;

  .showcase-img-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: $img-ratio;

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      border: 1px solid rgba(var(--text-slate-light-rgb), 0.12);
      border-radius: var(--radius-md) var(--radius-md) 0 0;
      box-shadow:
        0 0 0 1px rgba(var(--text-slate-light-rgb), 0.04),
        0 2px 8px rgba(0, 0, 0, 0.06),
        0 8px 28px rgba(0, 0, 0, 0.07);
      opacity: 0;
      transition: opacity 0.4s ease;

      &.is-loaded {
        opacity: 1;
      }
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
    cursor: zoom-in;
    pointer-events: auto;

    img {
      box-shadow:
        0 0 0 1px rgba(var(--text-slate-light-rgb), 0.05),
        0 4px 16px rgba(0, 0, 0, 0.08),
        0 12px 40px rgba(0, 0, 0, 0.1);
      transition: box-shadow $duration $ease-apple, transform $duration $ease-apple;
    }

    &:hover img {
      box-shadow:
        0 0 0 1px rgba(var(--color-primary-rgb), 0.12),
        0 6px 24px rgba(var(--color-primary-rgb), 0.16),
        0 16px 48px rgba(0, 0, 0, 0.14);
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
        box-shadow:
          0 0 0 1px rgba(var(--color-primary-rgb), 0.08),
          0 4px 20px rgba(var(--color-primary-rgb), 0.12);
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
        box-shadow:
          0 0 0 1px rgba(var(--color-primary-rgb), 0.08),
          0 4px 20px rgba(var(--color-primary-rgb), 0.12);
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

.showcase-card-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 0.9rem;
  background: var(--glass-70);
  border: 1px solid var(--glass-40);
  border-top: 0;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
}

.showcase-card-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.showcase-card-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0;
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 0.9375rem;
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
    aspect-ratio: math.div(16, 11);
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

}

// Responsive: narrow portrait mode — single card, no 3D
@media (max-aspect-ratio: #{math.div(3, 4)}) {
  .showcase {
    max-width: 100%;
  }

  .showcase-viewport {
    aspect-ratio: math.div(4, 3.5);
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

  .showcase-card-title {
    font-size: 0.9375rem;
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

.showcase-preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  animation: fadeIn 0.2s ease;
}

.showcase-preview-close {
  position: absolute;
  top: 20px;
  right: 24px;
}

.showcase-preview-title {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  font-weight: 500;
  pointer-events: none;
}

.showcase-preview-img {
  max-width: 80dvw;
  max-height: 80dvh;
  object-fit: contain;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-lg);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.06),
    0 24px 80px rgba(0, 0, 0, 0.5);
  transform-origin: center center;
  user-select: none;
  -webkit-user-select: none;

  &.is-dragging {
    will-change: transform;
  }
  @media (max-aspect-ratio: 1/1) {
    max-width: 98dvw;
    max-height: 80dvh;
  }

}

.showcase-preview-cta {
  position: absolute;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.6rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-pill);
  color: #fff;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  transition: background 0.2s, border-color 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.35);
  }

  &:active {
    background: rgba(255, 255, 255, 0.15);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
