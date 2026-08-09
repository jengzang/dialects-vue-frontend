<template>
  <div v-if="webglSupported" class="globe-background">
    <Suspense>
      <GlobeGLRenderer :points="points" />
      <template #fallback>
        <div class="globe-loading"></div>
      </template>
    </Suspense>
  </div>
</template>

<script setup>
import { defineAsyncComponent, computed } from 'vue'

const GlobeGLRenderer = defineAsyncComponent(() => import('./GlobeGLRenderer.vue'))

defineProps({
  points: {
    type: Array,
    default: () => [],
  },
})

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

  canvas {
    display: block;
    width: 100% !important;
    height: 100% !important;
    transform: translateX(15%);
  }
}

.globe-loading {
  width: 100%;
  height: 100%;
}
</style>
