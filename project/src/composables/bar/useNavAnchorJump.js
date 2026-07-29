import { computed, nextTick, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue'

/**
 * 右侧轮盘 / 锚点导航 composable
 *
 * 负责：
 * 1. 根据图表、汇总统计、地点详情生成轮盘 items
 * 2. 生成页面锚点 id
 * 3. 点击轮盘后滚动到对应 DOM
 * 4. 页面滚动时同步当前 visible nav id
 *
 * 父组件只需要：
 * - 把 featureData / aggregatedData / hasChartData / hasResultData / isEnabled 传进来
 * - 在模板中使用返回的 locationNavItems、currentVisibleNavId、锚点函数和 handleLocationNavJump
 */
export function useNavAnchorJump(options = {}) {
  const {
    featureData,
    aggregatedData,
    hasChartData,
    hasResultData,
    isEnabled = true,

    chartsLabel = '圖表',
    totalLabelPrefix = '總',
    formatTotalLabel = null,

    chartsNavId = 'count-charts',
    chartsAnchorId = 'count-charts-anchor',
    totalNavPrefix = 'count-total',
    totalAnchorPrefix = 'count-total-anchor',
    locationNavPrefix = 'count-location',
    locationAnchorPrefix = 'count-location-anchor',

    scrollSyncDebounceMs = 180,
    visibleAnchorRatio = 0.35
  } = options

  const currentVisibleNavId = ref('')
  let scrollSyncTimer = null

  const getResolvedValue = (source, fallback) => {
    const value = unref(source)
    return value == null ? fallback : value
  }

  const isNavEnabled = () => {
    if (typeof isEnabled === 'function') {
      return Boolean(isEnabled())
    }

    return Boolean(unref(isEnabled))
  }

  const hasResult = () => {
    if (hasResultData !== undefined) {
      return Boolean(unref(hasResultData))
    }

    return (
      Object.keys(getResolvedValue(featureData, {})).length > 0 ||
      Object.keys(getResolvedValue(aggregatedData, {})).length > 0
    )
  }

  const getChartsAnchorId = () => chartsAnchorId

  const getAggregatedAnchorId = (featureType) => {
    return `${totalAnchorPrefix}-${featureType}`
  }

  const getLocationAnchorId = (location) => {
    return `${locationAnchorPrefix}-${location}`
  }

  const locationNavItems = computed(() => {
    if (!hasResult()) return []

    const dataByLocation = getResolvedValue(featureData, {})
    const dataByFeatureType = getResolvedValue(aggregatedData, {})

    const orderedLocations = Object.keys(dataByLocation)
    const totalItems = []

    if (Boolean(unref(hasChartData))) {
      totalItems.push({
        id: chartsNavId,
        fullLabel: chartsLabel,
        targetKey: 'charts',
        kind: 'charts'
      })
    }

    Object.keys(dataByFeatureType).forEach((featureType) => {
      totalItems.push({
        id: `${totalNavPrefix}-${featureType}`,
        fullLabel: formatTotalLabel
          ? formatTotalLabel(featureType)
          : `${totalLabelPrefix}-${featureType}`,
        targetKey: featureType,
        kind: 'total'
      })
    })

    orderedLocations.forEach((location, index) => {
      totalItems.push({
        id: `${locationNavPrefix}-${index}`,
        fullLabel: location,
        targetKey: location,
        kind: 'location'
      })
    })

    return totalItems
  })

  const getNavAnchorElement = (nav) => {
    if (!nav) return null

    if (nav.kind === 'charts') {
      return document.getElementById(getChartsAnchorId())
    }

    if (nav.kind === 'total') {
      const section = document.getElementById(getAggregatedAnchorId(nav.targetKey))
      return section?.querySelector('.category-title') || section
    }

    if (nav.kind === 'location') {
      return document.getElementById(getLocationAnchorId(nav.targetKey))
    }

    return null
  }

  const getNavScrollBlock = (nav) => {
    if (nav?.kind === 'location') return 'center'
    return 'start'
  }

  const scrollToNavAnchor = async (nav) => {
    if (!nav) return false

    await nextTick()

    const target = getNavAnchorElement(nav)
    if (!target) return false

    currentVisibleNavId.value = nav.id

    target.scrollIntoView({
      behavior: 'smooth',
      block: getNavScrollBlock(nav)
    })

    return true
  }

  const handleLocationNavJump = async (nav) => {
    await scrollToNavAnchor(nav)
  }

  const updateCurrentVisibleNav = () => {
    if (!isNavEnabled() || !locationNavItems.value.length) return

    const anchorTop = window.innerHeight * visibleAnchorRatio
    let bestNav = locationNavItems.value[0]
    let bestDistance = Number.POSITIVE_INFINITY

    locationNavItems.value.forEach((nav) => {
      const target = getNavAnchorElement(nav)
      if (!target) return

      const rect = target.getBoundingClientRect()
      const distance = Math.abs(rect.top - anchorTop)

      if (distance < bestDistance) {
        bestDistance = distance
        bestNav = nav
      }
    })

    currentVisibleNavId.value = bestNav?.id || ''
  }

  const clearScrollSyncTimer = () => {
    if (scrollSyncTimer) {
      clearTimeout(scrollSyncTimer)
      scrollSyncTimer = null
    }
  }

  const scheduleScrollSync = () => {
    if (!isNavEnabled()) return

    clearScrollSyncTimer()

    scrollSyncTimer = window.setTimeout(() => {
      scrollSyncTimer = null
      updateCurrentVisibleNav()
    }, scrollSyncDebounceMs)
  }

  const handleWindowScroll = () => {
    scheduleScrollSync()
  }

  watch(
    () => [
      isNavEnabled(),
      locationNavItems.value.map((item) => item.id).join('|')
    ],
    async () => {
      if (!isNavEnabled()) {
        currentVisibleNavId.value = ''
        return
      }

      await nextTick()
      updateCurrentVisibleNav()
    }
  )

  onMounted(() => {
    window.addEventListener('scroll', handleWindowScroll, { passive: true })

    nextTick(() => {
      updateCurrentVisibleNav()
    })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', handleWindowScroll)
    clearScrollSyncTimer()
  })

  return {
    locationNavItems,
    currentVisibleNavId,

    getChartsAnchorId,
    getAggregatedAnchorId,
    getLocationAnchorId,

    getNavAnchorElement,
    scrollToNavAnchor,
    handleLocationNavJump,
    updateCurrentVisibleNav
  }
}