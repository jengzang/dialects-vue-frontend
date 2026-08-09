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
    .pointRadius(0.35)
    .pointAltitude(0.02)
    .pointResolution(2)

  globe.controls().autoRotate = false
  globe.controls().autoRotateSpeed = 0.4
  globe.controls().enableZoom = true
  globe.controls().enablePan = true
  globe.controls().enablePointerInteraction = true

  globe.pointOfView({ lat: 24.933, lng: 118.832, altitude: 1.303 })

  dumpGlobeParams()
  globe.controls().addEventListener('end', dumpGlobeParams)

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
}

function onKeyDown(e) {
  if (!containerRef.value) return
  const canvas = containerRef.value.querySelector('canvas')
  if (!canvas) return

  const step = e.shiftKey ? 3 : 1
  const cur = canvas.style.transform || getComputedStyle(canvas).transform
  const match = cur.match(/matrix\(([-\d.]+),\s*[-\d.]+,\s*[-\d.]+,\s*([-\d.]+),\s*([-\d.]+),\s*([-\d.]+)\)/)
  let x = match ? parseFloat(match[3]) : 0
  let y = match ? parseFloat(match[4]) : 0

  switch (e.key) {
    case 'ArrowLeft':  x -= step; break
    case 'ArrowRight': x += step; break
    case 'ArrowUp':    y -= step; break
    case 'ArrowDown':  y += step; break
    default: return
  }
  e.preventDefault()
  canvas.style.transform = `translate(${x}px, ${y}px)`
  console.log('[Globe offset]', { x: `${x}px`, y: `${y}px` }, '| pointOfView:', globe?.pointOfView())
}

function dumpGlobeParams() {
  if (!globe) return
  const cam = globe.camera()
  const ctrl = globe.controls()
  const target = ctrl?.target
  const pov = globe.pointOfView()
  const containerRect = containerRef.value?.getBoundingClientRect()

  console.log('[Globe params]', {
    pointOfView: pov,
    camera: cam ? {
      position: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
    } : null,
    controlsTarget: target ? { x: target.x, y: target.y, z: target.z } : null,
    container: containerRect ? { w: Math.round(containerRect.width), h: Math.round(containerRect.height) } : null,
  })
}

function updatePoints() {
  if (!globe) return
  globe.pointsData(props.points)
}

function destroy() {
  window.removeEventListener('keydown', onKeyDown)
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
