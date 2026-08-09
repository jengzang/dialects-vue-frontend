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
let projShiftX = -0.3
let projShiftY = -0.1

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
    .globeImageUrl('/showcase/earth-color-relief-dark.webp')
    .backgroundImageUrl(null)
    .showGraticules(false)
    .backgroundColor('rgba(0,0,0,0)') 
    .atmosphereColor(`rgb(${bgTint})`)
    .atmosphereAltitude(0.2)
    .pointsData(props.points)
    .pointLat('lat')
    .pointLng('lng')
    .pointColor(() => `rgb(${primary})`)
    .pointRadius(0.15)
    .pointAltitude(0.001)
    .pointResolution(6)
    .pointLabel('name')

  if (!('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
    globe.onPointHover(() => {})
  }

  globe.controls().autoRotate = false
  globe.controls().autoRotateSpeed = 0.4
  globe.controls().enableZoom = false
  globe.controls().enablePan = true
  globe.controls().enablePointerInteraction = true

  globe.pointOfView({ lat: 23, lng: 105, altitude: 1.5 })

  patchCameraProjection()

  // dumpGlobeParams()
  // globe.controls().addEventListener('end', dumpGlobeParams)

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

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('wheel', onWheel, { passive: false })
}

function onWheel(e) {
  if (!e.ctrlKey && !e.metaKey) return
  e.preventDefault()
  const delta = e.deltaY > 0 ? 0.15 : -0.15
  const pov = globe.pointOfView()
  const alt = Math.max(0.4, Math.min(3.5, pov.altitude + delta))
  globe.pointOfView({ lat: pov.lat, lng: pov.lng, altitude: alt })
}

function patchCameraProjection() {
  if (!globe) return
  const cam = globe.camera()
  if (!cam || cam._projPatched) return
  cam._projPatched = true
  const orig = cam.updateProjectionMatrix.bind(cam)
  cam.updateProjectionMatrix = function () {
    orig()
    cam.projectionMatrix.elements[8] = projShiftX
    cam.projectionMatrix.elements[9] = projShiftY
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert()
  }
}

function onKeyDown(e) {
  if (!globe) return
  const step = e.shiftKey ? 0.05 : 0.01

  switch (e.key) {
    case 'ArrowLeft':  projShiftX += step; break
    case 'ArrowRight': projShiftX -= step; break
    case 'ArrowUp':    projShiftY -= step; break
    case 'ArrowDown':  projShiftY += step; break
    default: return
  }
  e.preventDefault()
  
  globe.camera().updateProjectionMatrix()
  // console.log('[Proj shift]', { x: projShiftX.toFixed(3), y: projShiftY.toFixed(3) }, '| pov:', globe.pointOfView())
}

// function dumpGlobeParams() {
//   if (!globe) return
//   const cam = globe.camera()
//   const ctrl = globe.controls()
//   const target = ctrl?.target
//   const pov = globe.pointOfView()
//   const containerRect = containerRef.value?.getBoundingClientRect()
//
//   console.log('[Globe params]', {
//     pointOfView: pov,
//     camera: cam ? {
//       position: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
//     } : null,
//     controlsTarget: target ? { x: target.x, y: target.y, z: target.z } : null,
//     container: containerRect ? { w: Math.round(containerRect.width), h: Math.round(containerRect.height) } : null,
//   })
// }

function updatePoints() {
  if (!globe) return
  globe.pointsData(props.points)
}

function destroy() {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('wheel', onWheel)
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
