<template>
  <div ref="containerRef" class="globegl-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import Globe from 'globe.gl'

const props = defineProps({
  points: {
    type: Array,
    default: () => [],
  },
})

const containerRef = ref(null)
let globe = null

function getPrimaryRgb() {
  return getComputedStyle(document.documentElement)
    .getPropertyValue('--color-primary-rgb')
    .trim() || '0, 122, 255'
}

function render() {
  if (!containerRef.value) return

  const rgb = getPrimaryRgb()

  globe = Globe()(containerRef.value)
    .globeImageUrl('/textures/earth-blue-marble.jpg')
    .backgroundImageUrl(null)
    .showGraticules(false)
    .atmosphereColor(`rgba(${rgb}, 0.12)`)
    .atmosphereAltitude(0.15)
    .pointsData(props.points)
    .pointLat('lat')
    .pointLng('lng')
    .pointColor(() => `rgba(${rgb}, 0.7)`)
    .pointRadius(0.2)
    .pointAltitude(0.01)
    .pointResolution(2)

  globe.controls().autoRotate = false
  globe.controls().autoRotateSpeed = 0.4
  globe.controls().enableZoom = true
  globe.controls().enablePointerInteraction = true

  globe.pointOfView({ lat: 35, lng: 105, altitude: 2.8 })

  if (globe.renderer()) {
    globe.renderer().setClearColor(0x000000, 0)
  }
}

function updatePoints() {
  if (!globe) return
  globe.pointsData(props.points)
}

function destroy() {
  if (globe) {
    if (globe.renderer()) {
      globe.renderer().dispose()
    }
    globe._destructor?.()
    globe = null
  }
  if (containerRef.value) {
    containerRef.value.innerHTML = ''
  }
}

watch(() => props.points, () => {
  updatePoints()
}, { deep: true })

onMounted(() => {
  render()
})

onBeforeUnmount(() => {
  destroy()
})
</script>

<style scoped lang="scss">
.globegl-container {
  width: 100%;
  height: 100%;

  canvas {
    display: block;
  }
}
</style>
