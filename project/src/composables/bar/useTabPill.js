import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

export function useTabPill(containerRef, activeSelector, route) {
  const pillStyle = ref({ display: 'none' })
  let hideTimer = null
  let resizeObserver = null
  let observedActive = null
  let observedContainer = null
  let disposed = false

  const update = () => {
    nextTick(() => {
      if (disposed) return
      const el = containerRef.value
      if (!el) return
      const active = el.querySelector(activeSelector)
      if (active !== observedActive) {
        if (observedActive) resizeObserver?.unobserve(observedActive)
        observedActive = active
        if (active) resizeObserver?.observe(active)
      }
      if (!active) {
        pillStyle.value = { display: 'none' }
        return
      }
      const cr = el.getBoundingClientRect()
      const ar = active.getBoundingClientRect()

      clearTimeout(hideTimer)

      pillStyle.value = {
        display: '',
        opacity: 1,
        transform: `translateX(${ar.left - cr.left + el.scrollLeft}px) translateY(-50%)`,
        width: ar.width + 'px',
        height: ar.height + 'px',
      }

      hideTimer = setTimeout(() => {
        pillStyle.value = { ...pillStyle.value, opacity: 0 }
      }, 600)
    })
  }

  const bindContainer = (container) => {
    if (observedContainer === container) {
      if (container) resizeObserver?.observe(container)
      if (observedActive) resizeObserver?.observe(observedActive)
      update()
      return
    }

    if (observedContainer) {
      observedContainer.removeEventListener('scroll', update)
      resizeObserver?.unobserve(observedContainer)
    }
    if (observedActive) {
      resizeObserver?.unobserve(observedActive)
      observedActive = null
    }

    observedContainer = container
    if (!container) {
      pillStyle.value = { display: 'none' }
      return
    }

    resizeObserver?.observe(container)
    container.addEventListener('scroll', update, { passive: true })
    update()
  }

  onMounted(() => {
    // Selection transitions and initially hidden bars can settle after nextTick.
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(update)
    }
    window.addEventListener('resize', update)
    bindContainer(containerRef.value)
  })

  watch(() => containerRef.value, bindContainer, { flush: 'post' })

  onBeforeUnmount(() => {
    disposed = true
    bindContainer(null)
    resizeObserver?.disconnect()
    clearTimeout(hideTimer)
    window.removeEventListener('resize', update)
  })

  watch(() => route.fullPath, update, { flush: 'post' })

  return { pillStyle, updatePill: update }
}
