import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, reactive } from 'vue'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter } from 'vue-router'
import TabSwitcher from '../src/components/common/TabSwitcher.vue'

let app
let host
const settle = async () => { await Promise.resolve(); await nextTick(); await nextTick() }
const projectRoot = resolve(import.meta.dirname, '..')

function setNativePlatform(platform) {
  if (platform) {
    window.Capacitor = { getPlatform: () => platform }
  } else {
    delete window.Capacitor
  }
}

function dispatchTouch(target, type, x, y, extraTouches = []) {
  const primary = { clientX: x, clientY: y }
  const event = new Event(type, { bubbles: true, cancelable: true })
  const touches = type === 'touchend' || type === 'touchcancel' ? [] : [primary, ...extraTouches]
  const changedTouches = [primary]
  Object.defineProperty(event, 'touches', { value: touches })
  Object.defineProperty(event, 'changedTouches', { value: changedTouches })
  target.dispatchEvent(event)
}

function swipeElement(target, { startX = 200, startY = 200, endX = 110, endY = 204, midX, midY } = {}) {
  const moveX = midX ?? Math.round((startX + endX) / 2)
  const moveY = midY ?? Math.round((startY + endY) / 2)
  dispatchTouch(target, 'touchstart', startX, startY)
  dispatchTouch(target, 'touchmove', moveX, moveY)
  dispatchTouch(target, 'touchend', endX, endY)
}

async function mountTabs(overrides = {}, slotRenderer = null) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }],
  })
  await router.push('/menu/query?keep=yes')

  const update = vi.fn()
  const change = vi.fn()
  const props = reactive({
    tabs: [
      { name: 'tab1', label: '查字' },
      { name: 'tab2', label: '查中古', disabled: true },
      { name: 'tab3', label: '查音位' },
      { name: 'tab4', label: '查聲調' },
    ],
    modelValue: 'tab1',
    useRouter: false,
    swipeable: true,
    ...overrides,
  })

  host = document.createElement('div')
  document.body.append(host)
  app = createApp({
    render: () => h(TabSwitcher, {
      ...props,
      'onUpdate:modelValue': update,
      onTabChange: change,
    }, {
      default: ({ currentTab }) => slotRenderer
        ? slotRenderer(currentTab)
        : h('div', { 'data-panel-body': '' }, currentTab),
    }),
  })
  app.use(createI18n({ legacy: false, locale: 'zh-Hant', messages: {} }))
  app.use(router)
  app.mount(host)
  await settle()
  return { props, router, update, change }
}

beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', { value: 390, configurable: true })
  setNativePlatform(null)
})

afterEach(() => {
  app?.unmount()
  host?.remove()
  setNativePlatform(null)
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('TabSwitcher native swipe navigation', () => {
  it('defaults swipeable to false unless opted in', async () => {
    setNativePlatform('ios')
    const { change } = await mountTabs({ swipeable: undefined })
    const body = host.querySelector('[data-panel-body]')
    swipeElement(body, { startX: 240, endX: 120 })
    await settle()
    expect(change).not.toHaveBeenCalled()
  })

  it('does not switch tabs on web runtime even when swipeable is enabled', async () => {
    const { change } = await mountTabs({ swipeable: true })
    const body = host.querySelector('[data-panel-body]')
    swipeElement(body, { startX: 240, endX: 120 })
    await settle()
    expect(change).not.toHaveBeenCalled()
  })

  it('switches to adjacent enabled tabs on Android and iOS native runtimes and applies directional enter animations', async () => {
    for (const platform of ['android', 'ios']) {
      setNativePlatform(platform)
      const { props, update, change } = await mountTabs()
      const body = host.querySelector('[data-panel-body]')
      const panel = host.querySelector('.tab-content')

      // Swiping right at first tab does not wrap around
      swipeElement(body, { startX: 120, endX: 240 })
      expect(change).not.toHaveBeenCalled()

      // Swiping left skips disabled tab2 -> jumps to tab3 with enter-next class
      swipeElement(body, { startX: 260, endX: 140 })
      await settle()
      expect(update).toHaveBeenLastCalledWith('tab3')
      expect(change).toHaveBeenLastCalledWith('tab3')
      expect(panel.classList.contains('tab-content--enter-next')).toBe(true)
      expect(panel.style.transform).toBe('')

      props.modelValue = 'tab3'
      await settle()

      // Swiping right from tab3 skips disabled tab2 -> back to tab1 with enter-prev class
      swipeElement(body, { startX: 120, endX: 240 })
      await settle()
      expect(update).toHaveBeenLastCalledWith('tab1')
      expect(change).toHaveBeenLastCalledWith('tab1')
      expect(panel.classList.contains('tab-content--enter-prev')).toBe(true)

      app.unmount()
      host.remove()
    }
  })

  it('shows damped drag offset, Liquid Glass edge glow, and settles cleanly on cancelled or boundary drag', async () => {
    vi.useFakeTimers()
    setNativePlatform('ios')
    const { change } = await mountTabs()
    const body = host.querySelector('[data-panel-body]')
    const panel = host.querySelector('.tab-content')

    // Drag left past threshold -> right edge glow becomes ready
    dispatchTouch(body, 'touchstart', 260, 200)
    dispatchTouch(body, 'touchmove', 220, 202)
    await settle()
    expect(panel.classList.contains('tab-content--swiping')).toBe(true)
    expect(panel.style.transform).toContain('translate3d(-')
    let glow = host.querySelector('.tab-swipe-edge-glow--right')
    expect(glow).not.toBeNull()
    expect(glow.classList.contains('tab-swipe-edge-glow--ready')).toBe(false)

    dispatchTouch(body, 'touchmove', 180, 204)
    await settle()
    glow = host.querySelector('.tab-swipe-edge-glow--right')
    expect(glow.classList.contains('tab-swipe-edge-glow--ready')).toBe(true)

    // Cancel drag -> springs back and removes inline transform after settle
    dispatchTouch(body, 'touchcancel', 180, 204)
    await settle()
    expect(change).not.toHaveBeenCalled()
    expect(panel.classList.contains('tab-content--settling')).toBe(true)
    expect(host.querySelector('.tab-swipe-edge-glow')).toBeNull()

    vi.advanceTimersByTime(300)
    await settle()
    expect(panel.classList.contains('tab-content--settling')).toBe(false)
    expect(panel.style.transform).toBe('')

    // Drag right at first tab (boundary) -> left edge boundary glow, never ready
    dispatchTouch(body, 'touchstart', 120, 200)
    dispatchTouch(body, 'touchmove', 220, 202)
    await settle()
    const boundaryGlow = host.querySelector('.tab-swipe-edge-glow--left')
    expect(boundaryGlow).not.toBeNull()
    expect(boundaryGlow.classList.contains('tab-swipe-edge-glow--boundary')).toBe(true)
    expect(boundaryGlow.classList.contains('tab-swipe-edge-glow--ready')).toBe(false)
    dispatchTouch(body, 'touchend', 220, 202)
    await settle()
    expect(change).not.toHaveBeenCalled()
  })

  it('replaces route in router mode when swiping on native runtime', async () => {
    setNativePlatform('ios')
    const { router, change } = await mountTabs({
      useRouter: true,
      routeValue: 'tab1',
      resolveRoute: (name, route) => ({ path: `/menu/${name}`, query: route.query }),
    })
    const body = host.querySelector('[data-panel-body]')
    swipeElement(body, { startX: 260, endX: 140 })
    await settle()
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/menu/tab3?keep=yes'))
    expect(change).toHaveBeenCalledExactlyOnceWith('tab3')
  })

  it('ignores system back-edge gestures, vertical scrolls, and multi-touch', async () => {
    setNativePlatform('android')
    const { change } = await mountTabs()
    const body = host.querySelector('[data-panel-body]')

    // Left edge (iOS/Android system back)
    swipeElement(body, { startX: 12, endX: 160 })
    // Right edge (Android system back)
    swipeElement(body, { startX: 378, endX: 200 })
    // Diagonal / vertical scroll
    swipeElement(body, { startX: 240, startY: 200, endX: 170, endY: 280 })
    // Multi-touch pinch
    dispatchTouch(body, 'touchstart', 240, 200, [{ clientX: 280, clientY: 200 }])
    dispatchTouch(body, 'touchmove', 160, 200, [{ clientX: 200, clientY: 200 }])
    dispatchTouch(body, 'touchend', 120, 200)

    expect(change).not.toHaveBeenCalled()
  })

  it('ignores swipes starting inside inputs, opt-out zones, canvases, and horizontally scrollable containers', async () => {
    setNativePlatform('ios')
    const { change } = await mountTabs({}, () => h('div', [
      h('input', { 'data-input': '' }),
      h('div', { 'data-no-tab-swipe': '' }, [h('span', { 'data-opted-out': '' }, 'map')]),
      h('canvas', { 'data-canvas': '' }),
      h('div', { 'data-scroller': '', style: { overflowX: 'auto' } }, [
        h('span', { 'data-scroller-child': '' }, 'wide table'),
      ]),
    ]))

    const scroller = host.querySelector('[data-scroller]')
    Object.defineProperties(scroller, {
      scrollWidth: { value: 600, configurable: true },
      clientWidth: { value: 300, configurable: true },
    })

    swipeElement(host.querySelector('[data-input]'), { startX: 260, endX: 140 })
    swipeElement(host.querySelector('[data-opted-out]'), { startX: 260, endX: 140 })
    swipeElement(host.querySelector('[data-canvas]'), { startX: 260, endX: 140 })
    swipeElement(host.querySelector('[data-scroller-child]'), { startX: 260, endX: 140 })

    expect(change).not.toHaveBeenCalled()
  })

  it('enables swipeable explicitly on QueryPage, ComparePage, PhoPage, and AboutPage only', () => {
    const enabledPages = [
      'src/main/views/menu/QueryPage.vue',
      'src/main/views/menu/ComparePage.vue',
      'src/main/views/menu/PhoPage.vue',
      'src/main/views/menu/support/AboutPage.vue',
    ]
    const disabledPages = [
      'src/main/views/menu/MapPage.vue',
      'src/main/views/explore/Praat.vue',
    ]

    for (const rel of enabledPages) {
      const source = readFileSync(resolve(projectRoot, rel), 'utf8')
      expect(source, `${rel} should opt in to swipeable`).toMatch(/<TabSwitcher[\s\S]*?\bswipeable\b/)
    }

    for (const rel of disabledPages) {
      const source = readFileSync(resolve(projectRoot, rel), 'utf8')
      expect(source, `${rel} should stay non-swipeable`).not.toMatch(/<TabSwitcher[\s\S]*?\bswipeable\b/)
    }
  })
})
