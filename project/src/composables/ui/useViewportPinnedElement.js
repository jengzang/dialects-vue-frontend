import {
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  unref,
  watch,
} from 'vue'

function resolveValue(value) {
  return typeof value === 'function' ? value() : unref(value)
}

function toCssLength(value) {
  return typeof value === 'number' ? `${value}px` : value
}

function setStyle(styleRef, nextStyle) {
  const currentStyle = styleRef.value
  const keys = new Set([...Object.keys(currentStyle), ...Object.keys(nextStyle)])
  const hasChanged = [...keys].some((key) => currentStyle[key] !== nextStyle[key])

  if (hasChanged) {
    styleRef.value = nextStyle
  }
}

export function useViewportPinnedElement(options = {}) {
  const {
    elementRef,
    placeholderRef,
    enabled = true,
    landscapeTop = null,
    portraitTop = 0,
    scrollTarget = () => window,
  } = options

  const elementStyle = ref({})
  const placeholderStyle = ref({})
  const isPinned = ref(false)

  let isActive = false
  let scrollEventTarget = null
  let orientationQuery = null
  let resizeObserver = null
  let initialLandscapeTop = null

  function clearPosition() {
    setStyle(elementStyle, {})
    setStyle(placeholderStyle, {})
    isPinned.value = false
  }

  function updatePosition() {
    if (!isActive) return

    const element = unref(elementRef)
    const placeholder = unref(placeholderRef)
    if (!resolveValue(enabled) || !element || !placeholder) {
      clearPosition()
      return
    }

    const placeholderRect = placeholder.getBoundingClientRect()
    const elementRect = element.getBoundingClientRect()
    const portrait = orientationQuery?.matches ?? false
    const configuredPortraitTop = resolveValue(portraitTop)
    const portraitThreshold = typeof configuredPortraitTop === 'number'
      ? configuredPortraitTop
      : Number.parseFloat(configuredPortraitTop) || 0

    if (portrait && placeholderRect.top > portraitThreshold) {
      clearPosition()
      return
    }

    let top = portrait ? configuredPortraitTop : resolveValue(landscapeTop)
    if (!portrait && (top === null || top === undefined)) {
      if (initialLandscapeTop === null) {
        initialLandscapeTop = elementRect.top
      }
      top = initialLandscapeTop
    }

    setStyle(placeholderStyle, { height: `${elementRect.height}px` })
    setStyle(elementStyle, {
      position: 'fixed',
      top: toCssLength(top),
      left: `${placeholderRect.left}px`,
      width: `${placeholderRect.width}px`,
    })
    isPinned.value = true
  }

  function observeElement() {
    resizeObserver?.disconnect()

    const element = unref(elementRef)
    const placeholder = unref(placeholderRef)
    if (element && typeof ResizeObserver !== 'undefined') {
      resizeObserver ??= new ResizeObserver(updatePosition)
      resizeObserver.observe(element)
      if (placeholder) {
        resizeObserver.observe(placeholder)
      }
    }
  }

  function activate() {
    if (isActive || typeof window === 'undefined') return

    isActive = true
    scrollEventTarget = resolveValue(scrollTarget) || window
    scrollEventTarget.addEventListener('scroll', updatePosition, { passive: true })
    window.addEventListener('resize', updatePosition, { passive: true })
    window.addEventListener('orientationchange', updatePosition, { passive: true })
    orientationQuery = window.matchMedia('(max-aspect-ratio: 1 / 1)')
    orientationQuery.addEventListener?.('change', updatePosition)

    observeElement()
    updatePosition()
  }

  function deactivate() {
    if (!isActive) return

    isActive = false
    scrollEventTarget?.removeEventListener('scroll', updatePosition)
    window.removeEventListener('resize', updatePosition)
    window.removeEventListener('orientationchange', updatePosition)
    orientationQuery?.removeEventListener?.('change', updatePosition)
    resizeObserver?.disconnect()
    clearPosition()
  }

  watch(
    () => [unref(elementRef), unref(placeholderRef), Boolean(resolveValue(enabled))],
    () => {
      if (!isActive) return
      observeElement()
      updatePosition()
    },
    { flush: 'post' },
  )

  onMounted(activate)
  onActivated(activate)
  onDeactivated(deactivate)
  onBeforeUnmount(deactivate)

  return {
    elementStyle,
    placeholderStyle,
    isPinned,
  }
}
