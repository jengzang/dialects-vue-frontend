<template>
  <section class="query-search-entrance" :style="panelStyle">
    <div v-if="enabled" ref="introEl" class="query-intro query-panel-footer" :aria-hidden="progress === 1" :inert="progress === 1">
      <slot name="intro">
        <component :is="titleTag" :class="{ 'page-title': titleTag === 'h1' }"><slot name="title">{{ title }}</slot></component>
        <slot name="after-panel" />
      </slot>
    </div>
    <div
      ref="panelEl"
      class="query-search-panel"
      :class="{ 'glass-panel': enabled, 'is-compact': !expanded }"
    >
      <slot name="controls" :progress="progress" :expanded="expanded" :collapse="collapse" />
    </div>
    <slot name="outside-panel" />
  </section>
  <div class="query-results" :class="{ 'query-results--enabled': enabled && hasSubmittedQuery && resultsVisible }">
    <slot v-if="resultsVisible" />
  </div>
</template>

<script setup>
import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  titleTag: { type: String, default: 'h2', validator: value => ['h1', 'h2'].includes(value) },
  enabled: { type: Boolean, default: true },
  resultsVisible: { type: Boolean, default: true },
})
const emit = defineEmits(['progress'])
const introEl = ref(null)
const panelEl = ref(null)
const progress = ref(0)
const expanded = computed(() => props.enabled && progress.value < 1)
const panelStyle = computed(() => ({
  '--query-progress': props.enabled ? progress.value : 1,
  '--query-expansion': props.enabled ? 1 - progress.value : 0,
}))
let scrollFrame = null
let animationFrame = null
let targetProgress = 0
let lastAnimationTime = 0
const transitionDuration = 400
const boundaryHoldDuration = 100
let transitionUnlocked = false
let boundaryDirection = 0
let boundaryStartTime = 0
let lastScrollPosition = 0
let inputDirection = 0
let touchY = null
const hasSubmittedQuery = ref(false)

function animateProgress(time) {
  const step = Math.max(0, time - lastAnimationTime) / transitionDuration
  lastAnimationTime = time
  const difference = targetProgress - progress.value
  progress.value = Math.abs(difference) <= step
    ? targetProgress
    : progress.value + Math.sign(difference) * step
  animationFrame = progress.value === targetProgress
    ? null
    : window.requestAnimationFrame(animateProgress)
  if (progress.value === 0 || progress.value === 1) {
    transitionUnlocked = false
    boundaryDirection = 0
  }
}

function setTargetProgress(value, immediate = false) {
  targetProgress = value
  if (immediate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (animationFrame !== null) window.cancelAnimationFrame(animationFrame)
    animationFrame = null
    progress.value = value
    transitionUnlocked = false
    boundaryDirection = 0
    return
  }
  if (animationFrame === null && progress.value !== value) {
    lastAnimationTime = window.performance.now()
    animationFrame = window.requestAnimationFrame(animateProgress)
  }
}

function compactPosition() {
  const viewportInset = window.innerHeight * (window.matchMedia('(max-aspect-ratio: 1 / 1)').matches ? 0.16 : 0.12)
  const navbarBottom = document.querySelector('.navbar')?.getBoundingClientRect().bottom || 0
  const inset = Math.max(viewportInset, navbarBottom + 12)
  return Math.max(0, window.scrollY + (panelEl.value?.getBoundingClientRect().top || 0) - inset)
}

function updateProgress(fromScroll = false) {
  scrollFrame = null
  if (props.enabled && !hasSubmittedQuery.value) {
    setTargetProgress(0, true)
    return
  }
  const target = compactPosition()
  const compactHoldDistance = Math.min(80, target / 2)
  const distance = Math.min((introEl.value?.getBoundingClientRect().height || 0) * 3, target - compactHoldDistance)
  const remaining = target - window.scrollY - compactHoldDistance
  const nextProgress = props.enabled && distance
    ? remaining <= 1 ? 1 : Math.max(0, Math.min(1, 1 - remaining / distance))
    : 1
  if (props.enabled && hasSubmittedQuery.value && !transitionUnlocked && nextProgress !== progress.value) {
    if (!fromScroll) return
    const direction = Math.sign(nextProgress - progress.value)
    const now = window.performance.now()
    if (inputDirection && inputDirection !== direction) {
      boundaryDirection = 0
      return
    }
    // Keep a fixed hold: continued scrolling must not restart the timer.
    transitionUnlocked = boundaryDirection === direction && now - boundaryStartTime >= boundaryHoldDuration
    if (boundaryDirection !== direction) {
      boundaryDirection = direction
      boundaryStartTime = now
    }
    if (!transitionUnlocked) return
  }
  setTargetProgress(nextProgress, !props.enabled)
}

function handleScroll() {
  const position = window.scrollY
  if (position !== lastScrollPosition) inputDirection = Math.sign(position - lastScrollPosition)
  lastScrollPosition = position
  if (inputDirection && boundaryDirection !== inputDirection) boundaryDirection = 0
  if (scrollFrame === null) scrollFrame = window.requestAnimationFrame(() => updateProgress(true))
}

function handleWheel(event) {
  if (!event.deltaY || event.ctrlKey || event.defaultPrevented) return
  inputDirection = Math.sign(event.deltaY)
  handleScroll()
}

function handleTouchStart(event) {
  touchY = event.touches[0]?.clientY ?? null
}

function handleTouchMove(event) {
  if (event.defaultPrevented) return
  const nextY = event.touches[0]?.clientY
  if (touchY !== null && nextY !== undefined && nextY !== touchY) {
    inputDirection = Math.sign(touchY - nextY)
    handleScroll()
  }
  touchY = nextY ?? null
}

function handleResize() {
  if (scrollFrame === null) scrollFrame = window.requestAnimationFrame(() => updateProgress())
}

async function collapse() {
  if (!props.enabled) return
  hasSubmittedQuery.value = true
  transitionUnlocked = true
  boundaryDirection = 0
  await nextTick()
  window.scrollTo({
    top: compactPosition(),
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  })
}

watch(progress, value => emit('progress', value))
watch(() => props.enabled, async () => { await nextTick(); updateProgress() })

function startListening() {
  lastScrollPosition = window.scrollY
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('wheel', handleWheel, { passive: true })
  window.addEventListener('touchstart', handleTouchStart, { passive: true })
  window.addEventListener('touchmove', handleTouchMove, { passive: true })
  window.addEventListener('resize', handleResize, { passive: true })
  updateProgress()
}

function stopListening() {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('wheel', handleWheel)
  window.removeEventListener('touchstart', handleTouchStart)
  window.removeEventListener('touchmove', handleTouchMove)
  window.removeEventListener('resize', handleResize)
  if (scrollFrame !== null) window.cancelAnimationFrame(scrollFrame)
  if (animationFrame !== null) window.cancelAnimationFrame(animationFrame)
  scrollFrame = null
  animationFrame = null
}

onMounted(startListening)
onActivated(startListening)
onDeactivated(stopListening)
onBeforeUnmount(stopListening)
defineExpose({ collapse, progress })
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.query-search-panel {
  --glass-panel-background: color-mix(in srgb, var(--surface-panel) calc(var(--query-expansion) * 100%), transparent);
  --glass-panel-border: 0;
  --glass-panel-radius: calc(var(--radius-xl) * var(--query-expansion));
  --glass-panel-shadow: 0 4px 14px rgba(var(--color-shadow-rgb), calc(0.08 * var(--query-expansion)));
  --glass-panel-hover-shadow: var(--glass-panel-shadow);
  --glass-panel-backdrop-filter: none;
  --query-input-growth: calc(48px * var(--query-expansion));
  width: min(100%, calc(760px + (100% - 760px) * var(--query-progress)));
  margin: 0 auto;
  padding: calc(24px * var(--query-expansion));
  box-sizing: border-box;
  transition: none;

  :deep(.search-input) {
    transition-property: background-color, border-color, box-shadow;
  }

  :deep(.query-submit) {
    flex: 0 0 auto;
    width: calc(94px * var(--query-expansion));
    min-width: 0;
    min-height: 44px;
    align-self: center;
    padding: 0;
    overflow: hidden;
    white-space: nowrap;
    opacity: var(--query-expansion);
  }

  :deep(.yubao-compact-controls.is-compact) {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas: 'category input modes';
    gap: 8px 12px;
    align-items: center;
    width: 100%;
  }

  :deep(.yubao-compact-controls.is-compact > .top-controls) {
    display: contents;
  }

  :deep(.yubao-compact-controls.is-compact .top-controls > .search-container),
  :deep(.yubao-compact-controls.is-compact .search-section) {
    display: contents;
  }

  :deep(.yubao-compact-controls.is-compact .header-container) {
    grid-area: category;
    min-width: 0;
  }

  :deep(.yubao-compact-controls.is-compact .input-wrapper) {
    grid-area: input;
    min-width: 0;
    width: 100%;
  }

  :deep(.yubao-compact-controls.is-compact > .condition-bar) {
    grid-area: modes;
    min-width: 0;
    margin: 0;
    justify-content: flex-end;
  }

  &:not(.is-compact) {
    :deep(.top-controls) { margin-bottom: 0; }
    :deep(.top-controls > .search-container) { flex-basis: calc(100% * var(--query-expansion)); }
    :deep(.filter-strip) { min-width: 0; }

    :deep(.query-controls-layout) {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: calc(10px + 8px * var(--query-expansion));
      align-items: center;
      width: 100%;
      padding: 0;
      border-bottom: 0;
    }

    :deep(.query-controls--vocabulary) {
      grid-template-areas: 'input action' 'modes modes' 'range tools';
    }

    :deep(.query-controls--notes) {
      grid-template-areas: 'input action';
    }

    :deep(.query-controls--yubao) {
      grid-template-areas: 'category category' 'input action';
    }

    :deep(.query-controls-layout > .search-container),
    :deep(.query-controls-layout .search-section),
    :deep(.query-controls-layout > .filter-strip) {
      display: contents;
    }

    :deep(.query-controls-layout .input-wrapper) {
      grid-area: input;
      min-width: 0;
      width: 100%;
    }

    :deep(.query-controls-layout .search-input) {
      display: block;
      box-sizing: border-box;
      max-width: none;
    }

    :deep(.query-search-action) {
      width: 94px;
      min-height: 44px;
      padding: 0;
      align-self: center;
      justify-self: end;
    }

    :deep(.query-controls-layout .query-submit) {
      grid-area: action;
    }

    :deep(.query-controls-layout .notes-search-settings) {
      grid-area: action;
      justify-self: end;
    }

    :deep(.query-controls-layout .field-filter) {
      grid-area: tools;
      justify-self: end;
    }

    :deep(.query-controls-layout .notes-search-settings .field-filter) { grid-area: auto; }

    :deep(.query-controls--vocabulary .field-filter) { align-self: end; }

    :deep(.query-range) {
      grid-area: range;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      min-width: 0;
    }

    :deep(.query-range > .location-filter),
    :deep(.query-range > .standard-word-filter) {
      flex: 1 1 220px;
      min-width: 0;
      width: auto;
    }

    :deep(.query-range > .partition-filter) {
      flex: 0 1 420px;
      max-width: 420px;
    }

    :deep(.query-range .location-select-trigger) {
      width: 100%;
      max-width: none;
    }

    :deep(.query-range--notes .input-row) {
      width: 100%;
      max-width: none;
      margin: 0;
    }

    :deep(.query-range--notes .location-input),
    :deep(.query-range--notes .region-input) {
      max-width: none;
    }

    :deep(.query-range--notes .bottom-hint) {
      width: 100%;
      box-sizing: border-box;
      margin: 12px 0 0;
    }

    :deep(.query-mode-controls) {
      grid-area: modes;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      min-width: 0;
    }

    :deep(.query-mode-controls > .result-view-switcher) { order: 0; }

    :deep(.query-controls-layout > .header-container) {
      grid-area: category;
      width: 100%;
      justify-content: space-between;
    }

    :deep(.condition-bar) {
      justify-content: flex-start;
      margin: calc(18px * var(--query-expansion)) 0 0;
    }

    :deep(.query-condition-label) {
      color: var(--text-secondary);
      font-size: 14px;
      white-space: nowrap;
    }
  }

  &.is-compact { width: 100%; }
}

.query-results--enabled {
  min-height: 84dvh;
}

.query-panel-footer {
  @include flex-col;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 160px;
  max-height: 260px;
  padding: calc(16px * var(--query-expansion)) 0;
  box-sizing: border-box;
  overflow: hidden;
  opacity: var(--query-expansion);

  h1, h2 { margin: 0; text-align: center; }
}

@media (max-aspect-ratio: 1 / 1) {
  .query-panel-footer { min-height: 120px; }

  .query-search-panel { padding: calc(16px * var(--query-expansion)); }

  .query-search-panel {
    :deep(.yubao-compact-controls.is-compact) {
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas: 'category category' 'input modes';
    }
  }

  .query-search-panel:not(.is-compact) {
    :deep(.query-controls--vocabulary) {
      grid-template-areas: 'input input' 'modes action' 'range tools';
    }
    :deep(.query-controls--notes) {
      grid-template-areas: 'input input' 'action action';
    }
    :deep(.query-controls--yubao) {
      grid-template-areas: 'category category' 'input input' 'action action';
    }
    :deep(.query-search-action),
    :deep(.query-controls-layout .notes-search-settings) { justify-self: end; }
    :deep(.query-condition-label) { display: none; }
  }
}
</style>
