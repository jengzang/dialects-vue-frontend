import { ref, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'

export function useScrollArrows(navRef, hasOverflow, scrollAmount = 180, desktopRef = null) {
  const canScrollLeft = ref(false)
  const canScrollRight = ref(false)
  const isScrolling = ref(false)
  const arrowLeftPx = ref(0)
  const arrowRightPx = ref(0)
  let _interval = null
  let _arrowResizeObserver = null

  const updateVisibility = () => {
    const el = navRef?.value
    if (!el || !hasOverflow?.value) {
      canScrollLeft.value = false
      canScrollRight.value = false
      return
    }
    canScrollLeft.value = el.scrollLeft > 1
    canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
  }

  const updateArrowPositions = () => {
    if (!desktopRef?.value || !navRef?.value) return
    const desktopRect = desktopRef.value.getBoundingClientRect()
    const navRect = navRef.value.getBoundingClientRect()

    let leftSibling = navRef.value.previousElementSibling
    while (leftSibling?.classList.contains('scroll-arrow')) {
      leftSibling = leftSibling.previousElementSibling
    }
    if (leftSibling) {
      const r = leftSibling.getBoundingClientRect()
      arrowLeftPx.value = (r.right + navRect.left) / 2 - desktopRect.left - 5
    }

    let rightSibling = navRef.value.nextElementSibling
    while (rightSibling?.classList.contains('scroll-arrow')) {
      rightSibling = rightSibling.nextElementSibling
    }
    if (rightSibling) {
      const r = rightSibling.getBoundingClientRect()
      arrowRightPx.value = desktopRect.right - (navRect.right + r.left) / 2 - 5
    }
  }

  const stopScroll = () => {
    isScrolling.value = false
    if (_interval) {
      clearInterval(_interval)
      _interval = null
    }
  }

  const startScroll = (direction) => {
    stopScroll()
    const el = navRef?.value
    if (!el) return

    isScrolling.value = true
    const delta = direction === 'left' ? -scrollAmount : scrollAmount
    el.scrollBy({ left: delta, behavior: 'smooth' })

    _interval = setInterval(() => {
      el.scrollBy({ left: delta, behavior: 'auto' })
      updateVisibility()
    }, 50)
  }

  const handleWheel = (e) => {
    if (!hasOverflow?.value) return
    e.preventDefault()
    navRef.value?.scrollBy({ left: e.deltaY + (e.deltaX || 0), behavior: 'auto' })
  }

  onMounted(() => {
    const el = navRef?.value
    if (el) {
      el.addEventListener('scroll', updateVisibility, { passive: true })
      el.addEventListener('scroll', updateArrowPositions, { passive: true })
      el.addEventListener('wheel', handleWheel, { passive: false })
      updateVisibility()
      nextTick(updateArrowPositions)
    }
    if (desktopRef?.value) {
      window.addEventListener('resize', updateArrowPositions)
      _arrowResizeObserver = new ResizeObserver(() => {
        updateArrowPositions()
      })
      _arrowResizeObserver.observe(desktopRef.value)
      if (navRef?.value) {
        _arrowResizeObserver.observe(navRef.value)
      }
    }
  })

  onBeforeUnmount(() => {
    stopScroll()
    const el = navRef?.value
    if (el) {
      el.removeEventListener('scroll', updateVisibility)
      el.removeEventListener('scroll', updateArrowPositions)
      el.removeEventListener('wheel', handleWheel)
    }
    if (desktopRef?.value) {
      window.removeEventListener('resize', updateArrowPositions)
    }
    if (_arrowResizeObserver) {
      _arrowResizeObserver.disconnect()
      _arrowResizeObserver = null
    }
  })

  watch(hasOverflow, () => {
    updateVisibility()
    nextTick(updateArrowPositions)
  })

  watch([canScrollLeft, canScrollRight], () => {
    nextTick(updateArrowPositions)
  })

  return {
    canScrollLeft,
    canScrollRight,
    isScrolling,
    arrowLeftPx,
    arrowRightPx,
    startScroll,
    stopScroll,
    updateVisibility,
    updateArrowPositions,
  }
}
