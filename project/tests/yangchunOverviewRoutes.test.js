import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, nextTick } from 'vue'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

vi.mock('@/components/common/BarIcon.vue', () => ({
  default: defineComponent({
    name: 'BarIconStub',
    props: {
      icon: { type: String, required: true },
    },
    template: '<span class="bar-icon-emoji">{{ icon }}</span>',
  }),
}))

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

async function mountOverviewPage() {
  window.matchMedia = vi.fn(() => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))

  const component = (await import('../src/main/views/explore/yangchun/YangChunOverviewPage.vue')).default
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(component)
  app.mount(host)
  await nextTick()

  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
    },
  }
}

function setReadonlyNumber(target, property, value) {
  Object.defineProperty(target, property, {
    configurable: true,
    value,
  })
}

function setRect(target, rect) {
  target.getBoundingClientRect = () => rect
}

function scaleFromTransform(transform) {
  const match = transform.match(/scale\(([^)]+)\)/)
  return match ? Number(match[1]) : 0
}

function waitForAnimationFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve))
}

describe('Yangchun Explore pages', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

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

    expect(source).toContain("@use '@/styles/global/scrollbars' as scrollbars;")
    expect(source).toContain('ref="groupScroller"')
    expect(source).toContain('yc-group-carousel')
    expect(source).toContain('yc-group-scroller')
    expect(source).toContain("scrollGroupCarousel('prev')")
    expect(source).toContain("scrollGroupCarousel('next')")
    expect(source).toContain('scroll-snap-type: x mandatory')
    expect(source).toContain('@include scrollbars.hidden-scrollbar;')
    expect(source).toContain('@include scrollbars.hidden-scrollbar-webkit;')
  })

  it('scrolls the dialect group carousel and centers the selected group card', async () => {
    const wrapper = await mountOverviewPage()

    const scroller = wrapper.host.querySelector('.yc-group-scroller')
    const nextButton = wrapper.host.querySelector('[aria-label="向右浏览方言板块"]')
    const targetCard = wrapper.host.querySelector('[data-group-id="chunxi"]')
    const detailTitle = wrapper.host.querySelector('.yc-group-detail h3')

    expect(scroller).toBeTruthy()
    expect(nextButton).toBeTruthy()
    expect(targetCard).toBeTruthy()
    expect(detailTitle.textContent).toContain('春中白话')

    setReadonlyNumber(scroller, 'clientWidth', 360)
    setReadonlyNumber(scroller, 'scrollWidth', 1200)
    setReadonlyNumber(scroller.querySelector('.yc-group-card'), 'clientWidth', 280)
    scroller.scrollBy = vi.fn()
    scroller.dispatchEvent(new Event('scroll'))
    await nextTick()

    expect(nextButton.disabled).toBe(false)

    nextButton.click()
    await nextTick()

    expect(scroller.scrollBy).toHaveBeenCalledWith({
      left: 294,
      behavior: 'smooth',
    })

    scroller.getBoundingClientRect = () => ({ left: 20 })
    targetCard.getBoundingClientRect = () => ({ left: 420, width: 280 })
    scroller.scrollTo = vi.fn()

    targetCard.click()
    await nextTick()
    await nextTick()

    expect(wrapper.host.querySelector('.yc-group-detail h3').textContent).toContain('春西白话')
    expect(wrapper.host.querySelector('.yc-active-panel h3').textContent).toContain('春西白话')
    expect(scroller.scrollTo).toHaveBeenCalledWith({
      left: 360,
      behavior: 'smooth',
    })

    wrapper.unmount()
  })

  it('scales dialect group cards by distance from the carousel center while scrolling', async () => {
    const wrapper = await mountOverviewPage()

    const scroller = wrapper.host.querySelector('.yc-group-scroller')
    const cards = [...wrapper.host.querySelectorAll('.yc-group-card')]

    expect(scroller).toBeTruthy()
    expect(cards.length).toBeGreaterThan(2)

    setReadonlyNumber(scroller, 'clientWidth', 600)
    setReadonlyNumber(scroller, 'scrollWidth', 1400)
    setRect(scroller, { left: 0, width: 600 })
    setRect(cards[0], { left: 0, width: 280 })
    setRect(cards[1], { left: 160, width: 280 })
    setRect(cards[2], { left: 480, width: 280 })

    scroller.dispatchEvent(new Event('scroll'))
    await waitForAnimationFrame()

    expect(cards[1].dataset.carouselActive).toBe('true')
    expect(scaleFromTransform(cards[1].style.transform)).toBeGreaterThan(scaleFromTransform(cards[0].style.transform))
    expect(scaleFromTransform(cards[1].style.transform)).toBeGreaterThan(scaleFromTransform(cards[2].style.transform))

    wrapper.unmount()
  })

  it('pads the dialect group carousel so edge cards can settle near the center', async () => {
    const wrapper = await mountOverviewPage()

    const scroller = wrapper.host.querySelector('.yc-group-scroller')
    const firstCard = wrapper.host.querySelector('.yc-group-card')

    setReadonlyNumber(scroller, 'clientWidth', 720)
    setReadonlyNumber(firstCard, 'clientWidth', 280)

    window.dispatchEvent(new Event('resize'))
    await nextTick()

    expect(scroller.style.paddingLeft).toBe('220px')
    expect(scroller.style.paddingRight).toBe('220px')

    wrapper.unmount()
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
