import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

export function useTabPill(containerRef, activeSelector, route) {
  const pillStyle = ref({ display: 'none' })
  let hideTimer = null
  let resizeObserver = null
  let observedActive = null
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

  onMounted(() => {
    // Selection transitions and initially hidden bars can settle after nextTick.
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(update)
      if (containerRef.value) resizeObserver.observe(containerRef.value)
    }
    update()
    window.addEventListener('resize', update)
    containerRef.value?.addEventListener('scroll', update, { passive: true })
  })

  onBeforeUnmount(() => {
    disposed = true
    resizeObserver?.disconnect()
    clearTimeout(hideTimer)
    window.removeEventListener('resize', update)
    containerRef.value?.removeEventListener('scroll', update)
  })

  watch(() => route.fullPath, update, { flush: 'post' })

  return { pillStyle, updatePill: update }
}
