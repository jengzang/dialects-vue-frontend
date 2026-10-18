<template>
  <section class="query-search-entrance" :style="panelStyle">
    <div v-if="enabled" ref="introEl" class="query-intro" :aria-hidden="progress === 1">
      <h2>{{ title }}</h2>
    </div>
    <div
      ref="panelEl"
      class="query-search-panel"
      :class="{ 'glass-panel': enabled, 'is-compact': !expanded }"
    >
      <slot name="controls" :progress="progress" :expanded="expanded" :collapse="collapse" />
    </div>
  </section>
  <div class="query-results" :class="{ 'query-results--enabled': enabled }">
    <slot />
  </div>
</template>

<script setup>
import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  enabled: { type: Boolean, default: true },
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

function compactPosition() {
  const inset = window.innerHeight * (window.matchMedia('(max-aspect-ratio: 1 / 1)').matches ? 0.16 : 0.12)
  return Math.max(0, window.scrollY + (panelEl.value?.getBoundingClientRect().top || 0) - inset)
}

function updateProgress() {
  scrollFrame = null
  const distance = introEl.value?.getBoundingClientRect().height || 0
  const remaining = compactPosition() - window.scrollY
  progress.value = props.enabled && distance
    ? remaining <= 1 ? 1 : Math.max(0, Math.min(1, 1 - remaining / distance))
    : 1
}

function handleScroll() {
  if (scrollFrame === null) scrollFrame = window.requestAnimationFrame(updateProgress)
}

async function collapse() {
  if (!props.enabled) return
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

  h2 { margin: 0; text-align: center; }
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
  }

  &.is-compact { width: 100%; }
}

.query-results--enabled {
  min-height: 84dvh;
}

@media (max-aspect-ratio: 1 / 1) {
  .query-intro {
    height: 22dvh;
    min-height: 120px;
    padding-bottom: 20px;
  }

  .query-search-panel { padding: calc(16px * var(--query-expansion)); }
}
</style>
