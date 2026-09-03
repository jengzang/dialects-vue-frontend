<template>
  <div
    ref="containerRef"
    class="globegl-container"
  >
    <div
      ref="globeHostRef"
      class="globegl-canvas-host"
    />
    <template v-if="shouldUseGlobeJoystick">
      <Teleport
        v-if="joystickMountTarget"
        :to="joystickMountTarget"
      >
        <div
          ref="joystickRef"
          class="globe-joystick"
          role="application"
          aria-label="地球旋转摇杆"
          :style="joystickThumbStyle"
          @pointerdown="handleJoystickPointerDown"
          @pointermove="handleJoystickPointerMove"
          @pointerup="handleJoystickPointerUp"
          @pointercancel="handleJoystickPointerCancel"
        >
          <div class="globe-joystick__thumb" />
        </div>
      </Teleport>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import Globe from 'globe.gl'

const props = defineProps({
  points: {
    type: Array,
    default: () => [],
  },
})

const containerRef = ref(null)
const globeHostRef = ref(null)
const joystickRef = ref(null)
const joystickMountTarget = ref(null)
const isPortrait = ref(false)
const hasFinePointer = ref(false)
const hasHover = ref(false)
const joystickThumb = ref({ x: 0, y: 0 })
const joystickVector = ref({ x: 0, y: 0 })
const shouldUseGlobeJoystick = computed(() => (
  isPortrait.value &&
  !hasFinePointer.value &&
  !hasHover.value
))
const joystickThumbStyle = computed(() => ({
  '--globe-joystick-thumb-x': `${joystickThumb.value.x}px`,
  '--globe-joystick-thumb-y': `${joystickThumb.value.y}px`,
}))
let globe = null
let resizeObserver = null
let inputCapabilityMediaQueries = []
let activeJoystickPointerId = null
let joystickAnimationFrameId = null
let lastJoystickFrameTime = 0
let projShiftX = -0.3
let projShiftY = -0.1

const GLOBE_JOYSTICK_MAX_RADIUS = 42
const GLOBE_JOYSTICK_DEAD_ZONE = 5
const GLOBE_JOYSTICK_ROTATION_SPEED = 55
const GLOBE_MAX_LATITUDE = 75
const HOME_GLOBE_JOYSTICK_ANCHOR_ID = 'home-globe-joystick-anchor'

function getCssRgb(varName, fallback) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim() || fallback
}

function setupInputCapabilityListeners() {
  inputCapabilityMediaQueries = [
    { ref: isPortrait, mql: window.matchMedia('(orientation: portrait)') },
    { ref: hasFinePointer, mql: window.matchMedia('(any-pointer: fine)') },
    { ref: hasHover, mql: window.matchMedia('(any-hover: hover)') },
  ]
  inputCapabilityMediaQueries.forEach(({ mql }) => {
    mql.addEventListener('change', updateInputCapabilities)
  })
  updateInputCapabilities()
}

function updateInputCapabilities() {
  inputCapabilityMediaQueries.forEach(({ ref: targetRef, mql }) => {
    targetRef.value = mql.matches
  })
}

function teardownInputCapabilityListeners() {
  inputCapabilityMediaQueries.forEach(({ mql }) => {
    mql.removeEventListener('change', updateInputCapabilities)
  })
  inputCapabilityMediaQueries = []
}

function render() {
  if (!containerRef.value || !globeHostRef.value) return

  const primary = getCssRgb('--color-primary-rgb', '0, 122, 255')
  const bgTint = getCssRgb('--bg-blue-tint-rgb', '240, 247, 255')

  globe = Globe()(globeHostRef.value)
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
  globe.pointLabel('name').onPointHover(() => {})

  globe.controls().autoRotate = false
  globe.controls().autoRotateSpeed = 0.4
  globe.controls().enableZoom = false
  globe.controls().enablePan = true

  globe.pointOfView({ lat: 24, lng: 110, altitude: 1.5 })

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

  syncGlobePointerInteraction()

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

function syncGlobePointerInteraction() {
  if (!globe) return
  const hasMouseLikeInput = hasFinePointer.value || hasHover.value
  const directPointerInteractionEnabled = !shouldUseGlobeJoystick.value && hasMouseLikeInput
  globe.enablePointerInteraction(directPointerInteractionEnabled)
  syncCanvasTouchAction(directPointerInteractionEnabled)
}

function syncCanvasTouchAction(directPointerInteractionEnabled) {
  const canvas = globeHostRef.value?.querySelector('canvas')
  if (!canvas) return
  canvas.style.touchAction = directPointerInteractionEnabled ? '' : 'auto'
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

function normalizeJoystickInput(event) {
  const rect = joystickRef.value?.getBoundingClientRect()
  if (!rect) return { x: 0, y: 0, thumbX: 0, thumbY: 0 }

  let dx = event.clientX - (rect.left + rect.width / 2)
  let dy = event.clientY - (rect.top + rect.height / 2)
  const distance = Math.hypot(dx, dy)

  if (distance < GLOBE_JOYSTICK_DEAD_ZONE) {
    return { x: 0, y: 0, thumbX: 0, thumbY: 0 }
  }

  if (distance > GLOBE_JOYSTICK_MAX_RADIUS) {
    const scale = GLOBE_JOYSTICK_MAX_RADIUS / distance
    dx *= scale
    dy *= scale
  }

  return {
    x: dx / GLOBE_JOYSTICK_MAX_RADIUS,
    y: dy / GLOBE_JOYSTICK_MAX_RADIUS,
    thumbX: dx,
    thumbY: dy,
  }
}

function updateJoystickInput(event) {
  const input = normalizeJoystickInput(event)
  joystickVector.value = { x: input.x, y: input.y }
  joystickThumb.value = { x: input.thumbX, y: input.thumbY }
}

function startJoystickAnimation() {
  if (joystickAnimationFrameId !== null) return
  lastJoystickFrameTime = 0
  joystickAnimationFrameId = requestAnimationFrame(applyJoystickRotation)
}

function stopJoystickAnimation() {
  if (joystickAnimationFrameId === null) return
  cancelAnimationFrame(joystickAnimationFrameId)
  joystickAnimationFrameId = null
  lastJoystickFrameTime = 0
}

function applyJoystickRotation(timestamp) {
  joystickAnimationFrameId = null
  if (activeJoystickPointerId === null || !globe) return

  const deltaTime = lastJoystickFrameTime
    ? Math.min((timestamp - lastJoystickFrameTime) / 1000, 0.05)
    : 0.016
  lastJoystickFrameTime = timestamp

  const { x, y } = joystickVector.value
  if (x !== 0 || y !== 0) {
    const pov = globe.pointOfView()
    const nextLat = Math.max(
      -GLOBE_MAX_LATITUDE,
      Math.min(GLOBE_MAX_LATITUDE, pov.lat + y * GLOBE_JOYSTICK_ROTATION_SPEED * deltaTime)
    )
    const nextLng = ((((pov.lng - x * GLOBE_JOYSTICK_ROTATION_SPEED * deltaTime) % 360) + 540) % 360) - 180
    globe.pointOfView({ lat: nextLat, lng: nextLng, altitude: pov.altitude })
  }

  joystickAnimationFrameId = requestAnimationFrame(applyJoystickRotation)
}

function releaseJoystickPointerCapture(pointerId) {
  const joystick = joystickRef.value
  if (!joystick?.hasPointerCapture?.(pointerId)) return
  joystick.releasePointerCapture(pointerId)
}

function resetJoystickInput() {
  joystickVector.value = { x: 0, y: 0 }
  joystickThumb.value = { x: 0, y: 0 }
}

function cancelJoystickInteraction() {
  if (activeJoystickPointerId !== null) {
    releaseJoystickPointerCapture(activeJoystickPointerId)
  }
  activeJoystickPointerId = null
  stopJoystickAnimation()
  resetJoystickInput()
}

function handleJoystickPointerDown(event) {
  if (!shouldUseGlobeJoystick.value || activeJoystickPointerId !== null) return
  event.preventDefault()
  activeJoystickPointerId = event.pointerId
  event.currentTarget.setPointerCapture(event.pointerId)
  updateJoystickInput(event)
  startJoystickAnimation()
}

function handleJoystickPointerMove(event) {
  if (event.pointerId !== activeJoystickPointerId) return
  event.preventDefault()
  updateJoystickInput(event)
}

function handleJoystickPointerUp(event) {
  if (event.pointerId !== activeJoystickPointerId) return
  event.preventDefault()
  releaseJoystickPointerCapture(event.pointerId)
  cancelJoystickInteraction()
}

function handleJoystickPointerCancel(event) {
  if (event.pointerId !== activeJoystickPointerId) return
  event.preventDefault()
  releaseJoystickPointerCapture(event.pointerId)
  cancelJoystickInteraction()
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
  cancelJoystickInteraction()
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('wheel', onWheel)
  teardownInputCapabilityListeners()
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
  if (globeHostRef.value) {
    globeHostRef.value.innerHTML = ''
  }
}

watch(() => props.points, () => {
  updatePoints()
}, { deep: true })

watch([shouldUseGlobeJoystick, hasFinePointer, hasHover], () => {
  cancelJoystickInteraction()
  syncGlobePointerInteraction()
})

onMounted(() => {
  joystickMountTarget.value = document.getElementById(HOME_GLOBE_JOYSTICK_ANCHOR_ID)
  setupInputCapabilityListeners()
  render()
})

onBeforeUnmount(() => {
  destroy()
})
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.globegl-container {
  position: relative;
  width: 100%;
  height: 100%;

  canvas {
    display: block;
  }
}

.globegl-canvas-host {
  width: 100%;
  height: 100%;
}

.globe-joystick {
  @include flex-center;
  @include glass-blur(14px, 145%);

  position: relative;
  z-index: 2;
  width: var(--home-globe-joystick-size, 6.5rem);
  aspect-ratio: 1;
  color: var(--color-primary);
  background: var(--surface-glass-floating);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-glass);
  touch-action: none;
  user-select: none;
}

.globe-joystick__thumb {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 2.125rem;
  aspect-ratio: 1;
  background: var(--color-primary);
  border: 1px solid var(--border-glass-subtle);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-md);
  transform: translate(
    calc(-50% + var(--globe-joystick-thumb-x)),
    calc(-50% + var(--globe-joystick-thumb-y))
  );
  transition: transform 0.16s ease;
}
</style>
