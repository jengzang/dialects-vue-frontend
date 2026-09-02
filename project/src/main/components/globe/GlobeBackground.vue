<template>
  <div v-if="webglSupported" class="globe-background">
    <template v-if="simpleMode">
      <img src="/showcase/compact-earth.webp" class="globe-static" />
    </template>
    <template v-else>
      <Suspense>
        <GlobeGLRenderer :points="points" />
        <template #fallback>
          <div class="globe-loading"><span class="ui-loading--page"></span></div>
        </template>
      </Suspense>
    </template>
  </div>
</template>

<script setup>
import { defineAsyncComponent, computed } from 'vue'
import { UI_MODE_COMPACT } from '@/composables/core/uiPreferences.js'

const GlobeGLRenderer = defineAsyncComponent(() => import('./GlobeGLRenderer.vue'))

defineProps({
  points: {
    type: Array,
    default: () => [],
  },
})

const simpleMode = computed(() => document.documentElement.dataset.uiMode === UI_MODE_COMPACT)

const webglSupported = computed(() => {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
  } catch {
    return false
  }
})
</script>

<style scoped lang="scss">
.globe-background {
  position: absolute;
  top: -10%;
  right: -20%;
  bottom: -10%;
  left: -20%;
  z-index: 0;
  background: var(--bg-page-gradient);

  :deep(canvas) {
    display: block;
  }
  @media (orientation: portrait) {
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
}

.globe-static {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: right center;
  opacity: 0.85;
}

.globe-loading {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
