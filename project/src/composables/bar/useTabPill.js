import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

export function useTabPill(containerRef, activeSelector, route) {
  const pillStyle = ref({ display: 'none' })

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
      pillStyle.value = {
        left: (ar.left - cr.left + el.scrollLeft) + 'px',
        width: ar.width + 'px',
        height: ar.height + 'px',
      }
    })
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
    containerRef.value?.addEventListener('scroll', update, { passive: true })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', update)
    containerRef.value?.removeEventListener('scroll', update)
  })

  watch(() => route.fullPath, update)

  return { pillStyle, updatePill: update }
}
