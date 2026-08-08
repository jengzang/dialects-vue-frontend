<template>
  <div ref="containerRef" class="cobe-container" @mousedown="onPointerDown" @touchstart.prevent="onTouchStart"></div>
</template>

<script setup>
/**
 * Cobe dot-matrix globe renderer.
 *
 * LIMITATION: Cobe does NOT support individual lat/lng scatter points.
 * The globe renders a decorative dot-matrix pattern only.
 * For precise geographic scatter plotting, use GlobeGLRenderer.
 */
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import createGlobe from 'cobe'
import { useDark } from '@vueuse/core'

const containerRef = ref(null)
let globe = null
let phi = 5.1
let theta = 0.35
let targetPhi = 5.1
let targetTheta = 0.35
let animFrameId = null
let dragging = false
let lastX = 0
let lastY = 0

const isDark = useDark()

function getPrimaryColor() {
  const rgb = (getComputedStyle(document.documentElement)
    .getPropertyValue('--color-primary-rgb')
    .trim() || '0, 122, 255')
    .split(',')
    .map(v => parseFloat(v.trim()) / 255)
  return rgb
}

function render() {
  if (!containerRef.value) return

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const rect = containerRef.value.getBoundingClientRect()
  const size = Math.min(rect.width || window.innerWidth, rect.height || window.innerHeight)
  const primary = getPrimaryColor()
  const baseGray = isDark.value ? 0.75 : 0.3

  globe = createGlobe(containerRef.value, {
    devicePixelRatio: dpr,
    width: size,
    height: size,
    phi: phi,
    theta: theta,
    dark: isDark.value ? 1 : 0,
    diffuse: 1.2,
    mapSamples: 16000,
    mapBrightness: 6,
    baseColor: [baseGray, baseGray, baseGray],
    markerColor: primary,
    glowColor: primary,
    markers: [],
    onRender: (state) => {
      phi += (targetPhi - phi) * 0.1
      theta += (targetTheta - theta) * 0.1
      state.phi = phi
      state.theta = theta
    },
  })

  animFrameId = requestAnimationFrame(tick)
}

function tick() {
  if (!containerRef.value || !globe) return
  const rect = containerRef.value.getBoundingClientRect()
  const size = Math.min(rect.width, rect.height)
  globe.width = size
  globe.height = size
  animFrameId = requestAnimationFrame(tick)
}

function onPointerDown(e) {
  dragging = true
  lastX = e.clientX
  lastY = e.clientY
  window.addEventListener('mousemove', onPointerMove)
  window.addEventListener('mouseup', onPointerUp)
}

function onPointerMove(e) {
  if (!dragging) return
  const dx = e.clientX - lastX
  const dy = e.clientY - lastY
  targetPhi += dx * 0.005
  targetTheta += dy * 0.005
  targetTheta = Math.max(0.05, Math.min(Math.PI - 0.05, targetTheta))
  lastX = e.clientX
  lastY = e.clientY
}

function onPointerUp() {
  dragging = false
  window.removeEventListener('mousemove', onPointerMove)
  window.removeEventListener('mouseup', onPointerUp)
}

function onTouchStart(e) {
  const touch = e.touches[0]
  dragging = true
  lastX = touch.clientX
  lastY = touch.clientY
  window.addEventListener('touchmove', onTouchMove, { passive: false })
  window.addEventListener('touchend', onTouchEnd)
}

function onTouchMove(e) {
  if (!dragging) return
  e.preventDefault()
  const touch = e.touches[0]
  const dx = touch.clientX - lastX
  const dy = touch.clientY - lastY
  targetPhi += dx * 0.005
  targetTheta += dy * 0.005
  targetTheta = Math.max(0.05, Math.min(Math.PI - 0.05, targetTheta))
  lastX = touch.clientX
  lastY = touch.clientY
}

function onTouchEnd() {
  dragging = false
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
}

function destroy() {
  window.removeEventListener('mousemove', onPointerMove)
  window.removeEventListener('mouseup', onPointerUp)
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
  if (animFrameId) {
    cancelAnimationFrame(animFrameId)
    animFrameId = null
  }
  if (globe) {
    globe.destroy()
    globe = null
  }
}

watch(isDark, () => {
  if (globe) {
    destroy()
    phi = targetPhi
    theta = targetTheta
    render()
  }
})

onMounted(() => {
  render()
})

onBeforeUnmount(() => {
  destroy()
})
</script>

<style scoped lang="scss">
.cobe-container {
  width: 100%;
  height: 100%;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }

  canvas {
    display: block;
    width: 100% !important;
    height: 100% !important;
  }
}
</style>
