import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

describe('Yangchun Explore pages', () => {
  it('registers overview and expressions as canonical Yangchun path routes', () => {
    const source = readSource('src/main/router/exploreRoutes.js')

    expect(source).toContain('YangChunOverviewPage')
    expect(source).toContain("path: 'explore/yc'")
    expect(source).toContain("path: 'explore/yc/overview'")
    expect(source).toContain('YangChunExpressionsPage')
    expect(source).toContain("path: 'explore/yc/expressions'")
    expect(source).not.toContain('ycTab')
  })

  it('uses Yangchun overview as the default Yangchun child page', () => {
    const source = readSource('src/main/config/BarAndTabs/ExploreBarConfig.js')

    expect(source).toContain("defaultTo: { path: withRouteLocale(route, '/explore/yc/overview') }")
    expect(source).toContain("defaultChild: '/explore/yc/overview'")
  })

  it('orders Yangchun children from overview to data pages', () => {
    const source = readSource('src/main/config/BarAndTabs/ExploreBarConfig.js')
    const overviewIndex = source.indexOf('navigation.submenu.yangchun.overview')
    const spokenIndex = source.indexOf('navigation.submenu.words.ycSpoken')
    const expressionsIndex = source.indexOf('navigation.submenu.yangchun.expressions')
    const villagesIndex = source.indexOf('navigation.submenu.villages.ycVillages')

    expect(overviewIndex).toBeGreaterThan(-1)
    expect(spokenIndex).toBeGreaterThan(-1)
    expect(expressionsIndex).toBeGreaterThan(-1)
    expect(villagesIndex).toBeGreaterThan(-1)
    expect(overviewIndex).toBeLessThan(spokenIndex)
    expect(spokenIndex).toBeLessThan(expressionsIndex)
    expect(expressionsIndex).toBeLessThan(villagesIndex)
  })

  it('keeps overview content data separate from the page component', () => {
    const source = readSource('src/main/views/explore/yangchun/yangchunOverviewData.js')

    expect(source).toContain('dialectGroups')
    expect(source).toContain('phonologyDetails')
    expect(source).toContain('sourceArticles')
    expect(source).toContain('春中白话')
    expect(source).toContain('春西白话')
    expect(source).toContain('信宜移民涯话方言岛')
  })

  it('uses a horizontally scrollable dialect group carousel on the overview page', () => {
    const source = readSource('src/main/views/explore/yangchun/YangChunOverviewPage.vue')

    expect(source).toContain('ref="groupScroller"')
    expect(source).toContain('yc-group-carousel')
    expect(source).toContain('yc-group-scroller')
    expect(source).toContain("scrollGroupCarousel('prev')")
    expect(source).toContain("scrollGroupCarousel('next')")
    expect(source).toContain('scroll-snap-type: x mandatory')
  })

  it('keeps expressions mock data ready for a future backend contract', () => {
    const source = readSource('src/main/views/explore/yangchun/yangchunExpressionsMock.js')

    expect(source).toContain('yangchunExpressionCategories')
    expect(source).toContain('yangchunExpressionItems')
    expect(source).toContain('AABB')
    expect(source).toContain('歇后语')
    expect(source).toContain('农谚')
  })
})
