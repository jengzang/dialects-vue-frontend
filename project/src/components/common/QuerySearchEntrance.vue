<template>
  <section class="query-search-entrance" :style="panelStyle">
    <div v-if="enabled" ref="introEl" class="query-intro" :aria-hidden="progress === 1">
      <component :is="titleTag" :class="{ 'page-title': titleTag === 'h1' }"><slot name="title">{{ title }}</slot></component>
    </div>
    <div
      ref="panelEl"
      class="query-search-panel"
      :class="{ 'glass-panel': enabled, 'is-compact': !expanded }"
    >
      <slot name="controls" :progress="progress" :expanded="expanded" :collapse="collapse" />
    </div>
    <slot name="outside-panel" />
    <div v-if="enabled && $slots['after-panel']" v-show="expanded" class="query-panel-footer">
      <slot name="after-panel" />
    </div>
  </section>
  <div class="query-results" :class="{ 'query-results--enabled': enabled && hasSubmittedQuery }">
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
const hasSubmittedQuery = ref(false)

function compactPosition() {
  const viewportInset = window.innerHeight * (window.matchMedia('(max-aspect-ratio: 1 / 1)').matches ? 0.16 : 0.12)
  const navbarBottom = document.querySelector('.navbar')?.getBoundingClientRect().bottom || 0
  const inset = Math.max(viewportInset, navbarBottom + 12)
  return Math.max(0, window.scrollY + (panelEl.value?.getBoundingClientRect().top || 0) - inset)
}

function updateProgress() {
  scrollFrame = null
  if (props.enabled && !hasSubmittedQuery.value) {
    progress.value = 0
    return
  }
  const target = compactPosition()
  const compactHoldDistance = Math.min(64, target / 2)
  const distance = Math.min(introEl.value?.getBoundingClientRect().height || 0, target - compactHoldDistance)
  const remaining = target - window.scrollY - compactHoldDistance
  const nextProgress = props.enabled && distance
    ? remaining <= 1 ? 1 : Math.max(0, Math.min(1, 1 - remaining / distance))
    : 1
  progress.value = nextProgress
}

function handleScroll() {
  if (scrollFrame === null) scrollFrame = window.requestAnimationFrame(updateProgress)
}

async function collapse() {
  if (!props.enabled) return
  hasSubmittedQuery.value = true
  await nextTick()
  window.scrollTo({
    top: compactPosition(),
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  })
}

watch(progress, value => emit('progress', value))
watch(() => props.enabled, async () => { await nextTick(); updateProgress() })

function startListening() {
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleScroll, { passive: true })
  updateProgress()
}

function stopListening() {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
  if (scrollFrame !== null) window.cancelAnimationFrame(scrollFrame)
  scrollFrame = null
}

onMounted(startListening)
onActivated(startListening)
onDeactivated(stopListening)
onBeforeUnmount(stopListening)
defineExpose({ collapse, progress })
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.query-intro {
  @include flex-col;
  justify-content: flex-end;
  align-items: center;
  height: 26dvh;
  min-height: 160px;
  padding-bottom: 28px;
  box-sizing: border-box;
  opacity: var(--query-expansion);

  h1, h2 { margin: 0; text-align: center; }
}

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
      grid-template-areas: 'input action' 'range range' 'modes tools';
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

    :deep(.query-controls-layout .query-submit),
    :deep(.query-controls-layout .notes-mode-actions) {
      grid-area: action;
    }

    :deep(.query-controls-layout .field-filter) {
      grid-area: tools;
      justify-self: end;
    }

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
  max-height: calc(100px * var(--query-expansion));
  padding: calc(16px * var(--query-expansion)) 0;
  overflow: hidden;
  opacity: var(--query-expansion);
}

@media (max-aspect-ratio: 1 / 1) {
  .query-intro {
    height: 22dvh;
    min-height: 120px;
    padding-bottom: 20px;
  }

  .query-search-panel { padding: calc(16px * var(--query-expansion)); }

  .query-search-panel:not(.is-compact) {
    :deep(.query-controls--vocabulary) {
      grid-template-areas: 'input input' 'modes action' 'range tools';
    }
    :deep(.query-controls--notes) {
      grid-template-areas: 'input input' 'action action' 'range range' 'modes tools';
    }
    :deep(.query-controls--yubao) {
      grid-template-areas: 'category category' 'input input' 'action action';
    }
    :deep(.query-search-action),
    :deep(.query-controls-layout .notes-mode-actions) { justify-self: end; }
    :deep(.query-condition-label) { display: none; }
  }
}
</style>
