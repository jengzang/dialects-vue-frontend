<template>
  <div v-if="webglSupported" class="globe-background">
    <Suspense>
      <GlobeGLRenderer
        v-if="mode === 'globegl'"
        :key="'globegl'"
        :points="points"
      />
      <CobeRenderer
        v-else
        :key="'cobe'"
      />
      <template #fallback>
        <div class="globe-loading"></div>
      </template>
    </Suspense>

    <button
      class="globe-toggle-btn main-glass-button"
      :title="t('home.globe.toggleTitle')"
      @click="handleToggle"
    >
      <span class="toggle-label">{{ mode === 'globegl' ? 'Globe.GL' : 'Cobe' }}</span>
    </button>
  </div>
</template>

<script setup>
import { defineAsyncComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGlobeToggle } from './useGlobeToggle.js'

const GlobeGLRenderer = defineAsyncComponent(() => import('./GlobeGLRenderer.vue'))
const CobeRenderer = defineAsyncComponent(() => import('./CobeRenderer.vue'))

defineProps({
  points: {
    type: Array,
    default: () => [],
  },
})

const { t } = useI18n()
const { mode, toggle } = useGlobeToggle()

const webglSupported = computed(() => {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
  } catch {
    return false
  }
})

function handleToggle() {
  toggle()
}
</script>

<style scoped lang="scss">
.globe-background {
  position: absolute;
  top: 1rem;
  right: 1rem;
  bottom: 1rem;
  left: 50%;
  z-index: 0;
  border-radius: var(--radius-2xl);
  overflow: hidden;
  background: var(--glass-30);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid var(--glass-40);

  canvas {
    display: block;
  }
}

.globe-loading {
  width: 100%;
  height: 100%;
}

.globe-toggle-btn {
  position: absolute;
  bottom: 1.5rem;
  right: 2rem;
  z-index: 2;
  pointer-events: auto;
  padding: 6px 14px;
  font-size: 12px;
  border-radius: var(--radius-xl);
  opacity: 0.7;
  transition: opacity 0.2s ease;
  cursor: pointer;

  &:hover {
    opacity: 1;
  }
}

.toggle-label {
  font-weight: 600;
  letter-spacing: 0.02em;
}

@media (max-width: 768px) {
  .globe-toggle-btn {
    bottom: 0.75rem;
    right: 0.75rem;
    font-size: 11px;
    padding: 4px 10px;
  }
}
</style>
