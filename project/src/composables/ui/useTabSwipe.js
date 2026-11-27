import {
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  unref,
  watch,
} from 'vue'
import { getCurrentRuntimePlatform } from '@/platform/runtime.js'

const IGNORED_TARGET_SELECTOR = [
  'input',
  'textarea',
  'select',
  '[contenteditable="true"]',
  '[role="slider"]',
  '[data-no-tab-swipe]',
  '.maplibregl-canvas',
  '.maplibregl-map',
  'canvas',
].join(', ')

const SCROLLABLE_OVERFLOW_VALUES = new Set(['auto', 'scroll', 'overlay'])
const SETTLE_DURATION_MS = 280

function createIdleSwipeState() {
  return {
    dragging: false,
    settling: false,
    offsetX: 0,
    direction: 0,
    progress: 0,
    ready: false,
    atBoundary: false,
  }
}

function resolveValue(value) {
  return typeof value === 'function' ? value() : unref(value)
}

function getElementNode(target) {
  if (!target) return null
  if (target.nodeType === 1) return target
  return target.parentElement || null
}

function hasHorizontalScrollableAncestor(target, boundaryEl) {
  let current = getElementNode(target)
  while (current && current !== boundaryEl) {
    if (current.scrollWidth > current.clientWidth + 2) {
      const overflowX = window.getComputedStyle(current).overflowX
      if (SCROLLABLE_OVERFLOW_VALUES.has(overflowX)) {
        return true
      }
    }
    current = current.parentElement
  }
  return false
}

function isIgnoredTarget(target, boundaryEl) {
  const element = getElementNode(target)
  if (!element) return false
  if (element.closest(IGNORED_TARGET_SELECTOR)) {
    return true
  }
  return hasHorizontalScrollableAncestor(element, boundaryEl)
}

function hasActiveTextSelection() {
  return Boolean(window.getSelection?.()?.toString().trim())
}

function applyRubberBand(dx, maxOffset, damping) {
  const absX = Math.abs(dx)
  if (absX === 0) return 0
  const damped = (absX / (absX + damping)) * maxOffset
  return dx < 0 ? -damped : damped
}

export function isNativeTabSwipePlatform() {
  return getCurrentRuntimePlatform().container === 'native-webview'
}

export function useTabSwipe(options = {}) {
  const {
    elementRef,
    enabled = true,
    canSwipe = () => true,
    onSwipe,
    isSupported = isNativeTabSwipePlatform,
    edgeGuardPx = 28,
    lockDistance = 12,
    axisLockRatio = 1.5,
    minDistance = 60,
    flickMinDistance = 36,
    flickVelocity = 0.35,
    maxVerticalDrift = 80,
    maxDragOffset = 26,
    maxBoundaryOffset = 10,
  } = options

  const swipeState = ref(createIdleSwipeState())

  let isComponentActive = false
  let boundElement = null
  let settleTimer = null

  let status = 'idle' // 'idle' | 'pending' | 'horizontal' | 'vertical' | 'ignored'
  let startX = 0
  let startY = 0
  let startTime = 0

  function clearSettleTimer() {
    if (settleTimer !== null) {
      clearTimeout(settleTimer)
      settleTimer = null
    }
  }

  function resetVisualImmediately() {
    clearSettleTimer()
    swipeState.value = createIdleSwipeState()
  }

  function settleVisualBack() {
    clearSettleTimer()
    if (!swipeState.value.dragging && swipeState.value.offsetX === 0) {
      swipeState.value = createIdleSwipeState()
      return
    }
    swipeState.value = {
      ...createIdleSwipeState(),
      settling: true,
    }
    settleTimer = setTimeout(() => {
      settleTimer = null
      swipeState.value = createIdleSwipeState()
    }, SETTLE_DURATION_MS)
  }

  function resetGesture() {
    status = 'idle'
    startX = 0
    startY = 0
    startTime = 0
  }

  function updateDragVisual(dx) {
    const direction = dx < 0 ? 1 : dx > 0 ? -1 : 0
    if (direction === 0) return

    const canMove = Boolean(canSwipe(direction))
    const maxOffset = canMove ? maxDragOffset : maxBoundaryOffset
    const damping = canMove ? 72 : 50
    const offsetX = Number(applyRubberBand(dx, maxOffset, damping).toFixed(2))
    const progress = Math.min(Math.abs(dx) / minDistance, 1)

    swipeState.value = {
      dragging: true,
      settling: false,
      offsetX,
      direction,
      progress,
      ready: canMove && Math.abs(dx) >= minDistance,
      atBoundary: !canMove,
    }
  }

  function handleTouchStart(event) {
    resetGesture()
    clearSettleTimer()
    if (swipeState.value.settling) {
      swipeState.value = createIdleSwipeState()
    }

    if (!boundElement || !resolveValue(enabled) || !resolveValue(isSupported)) {
      status = 'ignored'
      return
    }
    if (!event.touches || event.touches.length !== 1) {
      status = 'ignored'
      return
    }
    if (hasActiveTextSelection()) {
      status = 'ignored'
      return
    }

    const touch = event.touches[0]
    const viewportWidth = window.innerWidth || document.documentElement?.clientWidth || 0
    if (
      viewportWidth > 0 &&
      (touch.clientX < edgeGuardPx || touch.clientX > viewportWidth - edgeGuardPx)
    ) {
      status = 'ignored'
      return
    }

    if (isIgnoredTarget(event.target, boundElement)) {
      status = 'ignored'
      return
    }

    startX = touch.clientX
    startY = touch.clientY
    startTime = Date.now()
    status = 'pending'
  }

  function handleTouchMove(event) {
    if (status === 'idle' || status === 'ignored' || status === 'vertical') return
    if (!event.touches || event.touches.length !== 1) {
      status = 'ignored'
      settleVisualBack()
      return
    }

    const touch = event.touches[0]
    const dx = touch.clientX - startX
    const dy = touch.clientY - startY
    const absX = Math.abs(dx)
    const absY = Math.abs(dy)

    if (status === 'pending') {
      if (Math.max(absX, absY) < lockDistance) return
      status = absX > absY * axisLockRatio ? 'horizontal' : 'vertical'
      if (status === 'horizontal') {
        updateDragVisual(dx)
      }
      return
    }

    if (status === 'horizontal') {
      if (absY > maxVerticalDrift) {
        status = 'ignored'
        settleVisualBack()
        return
      }
      updateDragVisual(dx)
    }
  }

  function handleTouchEnd(event) {
    const currentStatus = status
    const originX = startX
    const originY = startY
    const originTime = startTime
    resetGesture()

    if (currentStatus !== 'horizontal') {
      if (swipeState.value.dragging) settleVisualBack()
      return
    }
    if (!event.changedTouches || event.changedTouches.length === 0) {
      settleVisualBack()
      return
    }

    const touch = event.changedTouches[0]
    const dx = touch.clientX - originX
    const dy = touch.clientY - originY
    const absX = Math.abs(dx)
    const absY = Math.abs(dy)

    if (absX <= absY * axisLockRatio) {
      settleVisualBack()
      return
    }

    const elapsed = Math.max(Date.now() - originTime, 1)
    const velocity = absX / elapsed
    const isDistanceHit = absX >= minDistance
    const isFlickHit = absX >= flickMinDistance && velocity >= flickVelocity
    const direction = dx < 0 ? 1 : -1

    if ((!isDistanceHit && !isFlickHit) || !canSwipe(direction)) {
      settleVisualBack()
      return
    }

    resetVisualImmediately()
    onSwipe?.(direction)
  }

  function handleTouchCancel() {
    resetGesture()
    settleVisualBack()
  }

  function unbind() {
    if (!boundElement) return
    boundElement.removeEventListener('touchstart', handleTouchStart)
    boundElement.removeEventListener('touchmove', handleTouchMove)
    boundElement.removeEventListener('touchend', handleTouchEnd)
    boundElement.removeEventListener('touchcancel', handleTouchCancel)
    boundElement = null
    resetGesture()
    resetVisualImmediately()
  }

  function syncBinding() {
    if (typeof window === 'undefined' || !isComponentActive) {
      unbind()
      return
    }

    const shouldBind = Boolean(resolveValue(enabled)) && Boolean(resolveValue(isSupported))
    const nextElement = shouldBind ? unref(elementRef) : null

    if (boundElement === nextElement) return
    unbind()

    if (!nextElement) return
    boundElement = nextElement
    boundElement.addEventListener('touchstart', handleTouchStart, { passive: true })
    boundElement.addEventListener('touchmove', handleTouchMove, { passive: true })
    boundElement.addEventListener('touchend', handleTouchEnd, { passive: true })
    boundElement.addEventListener('touchcancel', handleTouchCancel, { passive: true })
  }

  function activate() {
    if (isComponentActive) return
    isComponentActive = true
    syncBinding()
  }

  function deactivate() {
    if (!isComponentActive && !boundElement) return
    isComponentActive = false
    unbind()
  }

  watch(
    () => [unref(elementRef), Boolean(resolveValue(enabled))],
    syncBinding,
    { flush: 'post' },
  )

  onMounted(activate)
  onActivated(activate)
  onDeactivated(deactivate)
  onBeforeUnmount(deactivate)

  return {
    swipeState,
  }
}
