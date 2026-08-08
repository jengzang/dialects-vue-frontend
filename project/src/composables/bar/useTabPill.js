import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

export function useTabPill(containerRef, activeSelector, route) {
  const pillStyle = ref({ display: 'none' })
  let hideTimer = null

  const update = () => {
    nextTick(() => {
      const el = containerRef.value
      if (!el) return
      const active = el.querySelector(activeSelector)
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
    update()
    window.addEventListener('resize', update)
    containerRef.value?.addEventListener('scroll', update, { passive: true })
  })

  onBeforeUnmount(() => {
    clearTimeout(hideTimer)
    window.removeEventListener('resize', update)
    containerRef.value?.removeEventListener('scroll', update)
  })

  watch(() => route.fullPath, update)

  return { pillStyle, updatePill: update }
}
