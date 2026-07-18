import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'

const PRIMARY_SELECTOR =
  '.tab-item:not(.tab-overflow-left):not(.tab-overflow-right),' +
  '.menu-item:not(.tab-overflow-left):not(.tab-overflow-right)'

const parsePx = (value) => {
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

const getScrollSide = (scrollLeft, restPosition) => {
  if (scrollLeft < restPosition) return 'left'
  if (scrollLeft > restPosition) return 'right'
  return 'rest'
}

const getDistanceFromRest = (scrollLeft, restPosition) => Math.abs(scrollLeft - restPosition)

const isMovingTowardRest = (previousScrollLeft, scrollLeft, restPosition) => {
  if (!Number.isFinite(previousScrollLeft)) return false
  return getDistanceFromRest(scrollLeft, restPosition) < getDistanceFromRest(previousScrollLeft, restPosition)
}

const DEFAULT_SNAP_THRESHOLD = 30

const normalizeSnapThresholds = (snapThreshold) => {
  if (typeof snapThreshold === 'number') {
    return {
      desktop: snapThreshold,
      portrait: snapThreshold,
    }
  }

  const desktop = snapThreshold?.desktop ?? snapThreshold?.landscape ?? snapThreshold?.default ?? DEFAULT_SNAP_THRESHOLD
  const portrait = snapThreshold?.portrait ?? snapThreshold?.mobile ?? desktop

  return { desktop, portrait }
}

/**
 * 横向溢出滚动 + 磁吸 composable
 * @param {import('vue').Ref<HTMLElement|null>} navRef - 桌面端 nav
 * @param {import('vue').ComputedRef<Array>} orderedTabs - 已排序的 tab 列表（左溢出 → 主 → 右溢出）
 * @param {number|{desktop?: number, landscape?: number, portrait?: number, mobile?: number, default?: number}} snapThreshold - 磁吸阈值（px）
 * @param {import('vue').Ref<HTMLElement|null>} [mobileNavRef] - 移动端 nav（可选）
 */
export function useScrollSnap(navRef, orderedTabs, snapThreshold = DEFAULT_SNAP_THRESHOLD, mobileNavRef = null) {
  const snapThresholds = normalizeSnapThresholds(snapThreshold)
  const hasOverflow = computed(() =>
    orderedTabs.value.some(t => t.scroll === 'left' || t.scroll === 'right')
  )

  const scrollClass = computed(() =>
    hasOverflow.value ? 'has-overflow-tabs' : ''
  )

  // 容器内容宽度（用于计算主 tab 像素级 flex-basis）
  const navContentWidth = ref(0)
  const scrollGestures = new WeakMap()
  let _observer = null
  let _settleFrame = null

  // 第一个主 tab 在容器内容坐标系中的偏移
  const getRestPosition = (el) => {
    const firstPrimary = el.querySelector(PRIMARY_SELECTOR)
    if (!firstPrimary) return 0
    return firstPrimary.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft
  }

  const scrollToRest = (el) => {
    if (!el) return
    const pos = getRestPosition(el)
    if (pos <= 0) return
    el.scrollLeft = pos
    // 安全确认：下一帧再设一次，防止被异步事件冲掉
    requestAnimationFrame(() => {
      if (el.scrollLeft !== pos) el.scrollLeft = pos
    })
  }

  const getPrimaryContentWidth = (el) => {
    if (!el) return 0
    const w = el.clientWidth
    if (w <= 0) return 0

    const visiblePrimaryItems = Array.from(el.querySelectorAll(PRIMARY_SELECTOR))
      .filter(item => getComputedStyle(item).display !== 'none')
    const visiblePrimaryCount = visiblePrimaryItems.length
    if (visiblePrimaryCount <= 1) return w

    const styles = getComputedStyle(el)
    const columnGap = parsePx(styles.columnGap)
    const gap = columnGap || parsePx(styles.gap)
    const primaryInlineExtras = visiblePrimaryItems.reduce((sum, item) => {
      const itemStyles = getComputedStyle(item)
      if (itemStyles.boxSizing === 'border-box') return sum
      return sum +
        parsePx(itemStyles.paddingLeft) +
        parsePx(itemStyles.paddingRight) +
        parsePx(itemStyles.borderLeftWidth) +
        parsePx(itemStyles.borderRightWidth)
    }, 0)

    return Math.max(0, w - gap * (visiblePrimaryCount - 1) - primaryInlineExtras)
  }

  const updateNavContentWidth = (els) => {
    for (const el of els) {
      const w = getPrimaryContentWidth(el)
      if (w > 0) {
        navContentWidth.value = w
        scrollToRest(el)
      }
    }
  }

  const scrollToRestWhileSettling = (els, frames = 40) => {
    if (_settleFrame) {
      cancelAnimationFrame(_settleFrame)
      _settleFrame = null
    }

    const tick = () => {
      updateNavContentWidth(els)
      for (const el of els) {
        scrollToRest(el)
      }
      frames -= 1
      if (frames > 0) {
        _settleFrame = requestAnimationFrame(tick)
      } else {
        _settleFrame = null
      }
    }

    _settleFrame = requestAnimationFrame(tick)
  }

  const getSnapThreshold = (el) => {
    if (mobileNavRef?.value && el === mobileNavRef.value) {
      return snapThresholds.portrait
    }
    return snapThresholds.desktop
  }

  const snapCheck = (el) => {
    if (!el) return
    const restPosition = getRestPosition(el)
    const diff = getDistanceFromRest(el.scrollLeft, restPosition)
    const gesture = scrollGestures.get(el)
    const crossedBothSides = gesture?.crossed || (gesture?.left && gesture?.right)
    const movingTowardRest =
      gesture?.movingTowardRest || isMovingTowardRest(gesture?.lastScrollLeft, el.scrollLeft, restPosition)
    const hasSideMovement = gesture?.lastSettledSide !== 'rest' || gesture?.left || gesture?.right
    const returningTowardRest = hasSideMovement && movingTowardRest
    const shouldSnap = diff > 0 && (crossedBothSides || (returningTowardRest && diff <= getSnapThreshold(el)))
    if (shouldSnap) {
      el.scrollTo({ left: restPosition, behavior: 'smooth' })
    }
    const side = shouldSnap ? 'rest' : getScrollSide(el.scrollLeft, restPosition)
    scrollGestures.set(el, {
      left: false,
      right: false,
      crossed: false,
      lastSettledSide: side,
      lastScrollLeft: side === 'rest' ? restPosition : el.scrollLeft,
      movingTowardRest: false,
    })
  }

  const onScrollEnd = (event) => {
    snapCheck(event?.target || navRef.value)
  }

  // debounce scroll 事件兜底（scrollend 在一些浏览器不支持）
  let _scrollTimer = null
  const onScroll = (event) => {
    const el = event.target
    if (!el) return
    const restPosition = getRestPosition(el)
    const side = getScrollSide(el.scrollLeft, restPosition)
    if (side !== 'rest') {
      const gesture = scrollGestures.get(el) || {
        left: false,
        right: false,
        crossed: false,
        lastSettledSide: 'rest',
        lastScrollLeft: restPosition,
        movingTowardRest: false,
      }
      gesture.movingTowardRest = isMovingTowardRest(gesture.lastScrollLeft, el.scrollLeft, restPosition)
      if (
        (gesture.lastSettledSide === 'left' && side === 'right') ||
        (gesture.lastSettledSide === 'right' && side === 'left')
      ) {
        gesture.crossed = true
      }
      if (side === 'left') {
        gesture.left = true
      } else {
        gesture.right = true
      }
      gesture.lastScrollLeft = el.scrollLeft
      scrollGestures.set(el, gesture)
    }
    clearTimeout(_scrollTimer)
    _scrollTimer = setTimeout(() => snapCheck(el), 150)
  }

  onMounted(() => {
    nextTick(() => {
      const els = [navRef.value, mobileNavRef?.value].filter(Boolean)
      if (!els.length) return

      updateNavContentWidth(els)

      // 用一个 ResizeObserver 同时观察桌面端和移动端 nav，
      // 只取可见 nav 的宽度（隐藏的 nav clientWidth 为 0，会被跳过）
      _observer = new ResizeObserver(() => {
        updateNavContentWidth(els)
      })
      for (const el of els) {
        scrollToRest(el)
        _observer.observe(el)
      }
      scrollToRestWhileSettling(els)
    })
  })

  onBeforeUnmount(() => {
    if (_observer) {
      _observer.disconnect()
      _observer = null
    }
    if (_scrollTimer) {
      clearTimeout(_scrollTimer)
      _scrollTimer = null
    }
    if (_settleFrame) {
      cancelAnimationFrame(_settleFrame)
      _settleFrame = null
    }
  })

  // 溢出 tab 从无到有时也要复位
  watch(hasOverflow, async (now) => {
    if (now) {
      await nextTick()
      if (navRef.value) {
        scrollToRest(navRef.value)
      }
      if (mobileNavRef?.value) {
        scrollToRest(mobileNavRef.value)
      }
      scrollToRestWhileSettling([navRef.value, mobileNavRef?.value].filter(Boolean))
    }
  })

  // navContentWidth 首次赋值后（flex-basis 切到 px），要等浏览器 layout 完再复位
  watch(navContentWidth, async (w) => {
    if (w > 0 && hasOverflow.value) {
      await nextTick()
      // 双 rAF 确保浏览器完整完成一次 layout + paint 后再滚动
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
      if (navRef.value) {
        scrollToRest(navRef.value)
      }
      if (mobileNavRef?.value) {
        scrollToRest(mobileNavRef.value)
      }
      scrollToRestWhileSettling([navRef.value, mobileNavRef?.value].filter(Boolean))
    }
  })

  return { hasOverflow, scrollClass, onScroll, onScrollEnd, scrollToRest, navContentWidth }
}
