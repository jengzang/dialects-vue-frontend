/**
 * 各 Bar 共用的溢出布局逻辑：tab 排序、flex 权重、overflow flex 计算
 */
export function getDefaultTabScroll(tab, isMobile) {
  return isMobile ? (tab.mobileScroll ?? tab.scroll) : tab.scroll
}

export function sortTabsByScroll(tabs, isMobile, getTabScroll) {
  const left = tabs.filter(t => getTabScroll(t, isMobile) === 'left')
  const main = tabs.filter(t => !getTabScroll(t, isMobile) || (getTabScroll(t, isMobile) !== 'left' && getTabScroll(t, isMobile) !== 'right'))
  const right = tabs.filter(t => getTabScroll(t, isMobile) === 'right')
  return [...left, ...main, ...right]
}

export function getFlexWeight(tab, isActive, isMobile) {
  let labelVisible

  if (isMobile) {
    const showOnlyWhenActive = tab.mobileShowLabelOnlyWhenActive ?? tab.showLabelOnlyWhenActive
    labelVisible = !tab.hideLabelOnMobile && (!showOnlyWhenActive || isActive)
  } else {
    labelVisible = !tab.showLabelOnlyWhenActive || isActive
  }

  if (labelVisible) {
    return isMobile ? (tab.mobileWeight || tab.weight) : tab.weight
  }
  if (isMobile) {
    return tab.mobileWeightIconOnly || tab.mobileWeight || tab.weightIconOnly || tab.weight
  }
  return tab.weightIconOnly || tab.weight
}

export function useBarOverflow(options) {
  const {
    orderedTabs,
    orderedMobileTabs,
    hasOverflowDesktop,
    hasOverflowMobile,
    navContentWidth,
    getTabScroll,
    resolveIsActive,
  } = options

  const hasOverflowForLayout = (isMobile) =>
    isMobile ? hasOverflowMobile.value : hasOverflowDesktop.value

  const getRenderedPrimaryTabs = (isMobile) =>
    (isMobile ? orderedMobileTabs.value : orderedTabs.value)
      .filter(t => !getTabScroll(t, isMobile) || (getTabScroll(t, isMobile) !== 'left' && getTabScroll(t, isMobile) !== 'right'))
      .filter(t => !isMobile || !t.hideOnMobile)

  const getPrimaryTotalWeight = (isMobile) =>
    getRenderedPrimaryTabs(isMobile)
      .reduce((s, t) => s + getFlexWeight(t, resolveIsActive(t.tab), isMobile), 0) || 1

  const getOverflowFlex = (t, isActive, isMobile) => {
    if (getTabScroll(t, isMobile)) return '0 0 auto'
    if (hasOverflowForLayout(isMobile)) {
      const w = getFlexWeight(t, isActive, isMobile)
      const totalWeight = getPrimaryTotalWeight(isMobile)
      if (navContentWidth.value > 0) {
        return `0 0 ${(w / totalWeight) * navContentWidth.value}px`
      }
      return `0 0 ${(w / totalWeight) * 100}%`
    }
    return getFlexWeight(t, isActive, isMobile) + ' 1 0'
  }

  return { hasOverflowForLayout, getOverflowFlex }
}
