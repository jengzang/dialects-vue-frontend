import { ref, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'

export function useScrollArrows(navRef, hasOverflow, scrollAmount = 180, desktopRef = null) {
  const canScrollLeft = ref(false)
  const canScrollRight = ref(false)
  const isScrolling = ref(false)
  const arrowLeftPx = ref(0)
  const arrowRightPx = ref(0)
  let _interval = null
  let _arrowResizeObserver = null
  let observedNav = null
  let observedDesktop = null

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

  const bindElements = () => {
    const nav = navRef?.value || null
    const desktop = desktopRef?.value || null

    if (desktop && !_arrowResizeObserver) {
      _arrowResizeObserver = new ResizeObserver(updateArrowPositions)
    }

    if (observedNav !== nav) {
      if (observedNav) {
        stopScroll()
        observedNav.removeEventListener('scroll', updateVisibility)
        observedNav.removeEventListener('scroll', updateArrowPositions)
        observedNav.removeEventListener('wheel', handleWheel)
        _arrowResizeObserver?.unobserve(observedNav)
      }
      observedNav = nav
      if (observedNav) {
        observedNav.addEventListener('scroll', updateVisibility, { passive: true })
        observedNav.addEventListener('scroll', updateArrowPositions, { passive: true })
        observedNav.addEventListener('wheel', handleWheel, { passive: false })
        _arrowResizeObserver?.observe(observedNav)
      }
    }

    if (observedDesktop !== desktop) {
      if (observedDesktop) {
        window.removeEventListener('resize', updateArrowPositions)
        _arrowResizeObserver?.unobserve(observedDesktop)
      }
      observedDesktop = desktop
      if (observedDesktop) {
        window.addEventListener('resize', updateArrowPositions)
        _arrowResizeObserver?.observe(observedDesktop)
      }
    }

    updateVisibility()
    nextTick(updateArrowPositions)
  }

  onMounted(() => {
    bindElements()
  })

  watch(
    [() => navRef?.value, () => desktopRef?.value],
    bindElements,
    { flush: 'post' }
  )

  onBeforeUnmount(() => {
    stopScroll()
    if (observedNav) {
      observedNav.removeEventListener('scroll', updateVisibility)
      observedNav.removeEventListener('scroll', updateArrowPositions)
      observedNav.removeEventListener('wheel', handleWheel)
      observedNav = null
    }
    if (observedDesktop) {
      window.removeEventListener('resize', updateArrowPositions)
      observedDesktop = null
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
