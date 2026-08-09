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
let resizeObserver = null

function getCssRgb(varName, fallback) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim() || fallback
}

function render() {
  if (!containerRef.value) return

  const primary = getCssRgb('--color-primary-rgb', '0, 122, 255')
  const bgTint = getCssRgb('--bg-blue-tint-rgb', '240, 247, 255')

  globe = Globe()(containerRef.value)
    .globeImageUrl('/textures/earth-blue-marble.jpg')
    .backgroundImageUrl(null)
    .showGraticules(false)
    .backgroundColor('rgba(0,0,0,0)') 
    .atmosphereColor(`rgb(${bgTint})`)
    .atmosphereAltitude(0.18)
    .pointsData(props.points)
    .pointLat('lat')
    .pointLng('lng')
    .pointColor(() => `rgba(${primary}, 0.7)`)
    .pointRadius(0.2)
    .pointAltitude(0.01)
    .pointResolution(2)

  globe.controls().autoRotate = false
  globe.controls().autoRotateSpeed = 0.4
  globe.controls().enableZoom = true
  globe.controls().enablePointerInteraction = true

  globe.pointOfView({ lat: 30, lng: 108, altitude: 1.9 })
  if (globe.renderer()) {
    globe.renderer().setClearColor(0x000000, 0)
    globe.renderer().setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  }
  if (globe.scene()) {
    globe.scene().background = null
  }

  resizeObserver = new ResizeObserver(() => {
    if (containerRef.value && globe) {
      const { width, height } = containerRef.value.getBoundingClientRect()
      globe.width(width)
      globe.height(height)
    }
  })
  resizeObserver.observe(containerRef.value)
}

function updatePoints() {
  if (!globe) return
  globe.pointsData(props.points)
}

function destroy() {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
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
