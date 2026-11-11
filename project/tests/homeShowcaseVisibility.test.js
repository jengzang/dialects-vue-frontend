import { createApp, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, expect, it, vi } from 'vitest'
import HeroShowcase from '../src/main/components/HeroShowcase.vue'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: key => key }) }))
vi.mock('../src/components/common/BarIcon.vue', () => ({ default: { template: '<span />' } }))

let app
afterEach(() => {
  app?.unmount()
  document.body.innerHTML = ''
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('stops offscreen autoplay, retains the active slide, and respects background and hover pauses', async () => {
  vi.useFakeTimers()
  let intersect
  const disconnect = vi.fn()
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback) { intersect = callback }
    observe = vi.fn()
    disconnect = disconnect
  })
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
  let hidden = false
  vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }]
  })
  await router.push('/en')
  const host = document.createElement('div')
  document.body.append(host)
  app = createApp(HeroShowcase)
  app.use(router)
  app.mount(host)
  const showcase = host.querySelector('.showcase')
  const active = () => host.querySelector('.showcase-item.is-active h3').textContent
  const advance = async () => { vi.advanceTimersByTime(5500); await nextTick() }
  const initial = active()
  await advance()
  expect(active()).toBe(initial)
  intersect([{ isIntersecting: true }])
  await advance()
  const second = active()
  expect(second).not.toBe(initial)
  intersect([{ isIntersecting: false }])
  await advance()
  expect(active()).toBe(second)
  expect(showcase.classList.contains('showcase--paused')).toBe(true)
  intersect([{ isIntersecting: true }])
  hidden = true
  document.dispatchEvent(new Event('visibilitychange'))
  await advance()
  expect(active()).toBe(second)
  showcase.dispatchEvent(new MouseEvent('mouseenter'))
  hidden = false
  document.dispatchEvent(new Event('visibilitychange'))
  await advance()
  expect(active()).toBe(second)
  showcase.dispatchEvent(new MouseEvent('mouseleave'))
  await advance()
  expect(active()).not.toBe(second)
  app.unmount()
  app = null
  expect(disconnect).toHaveBeenCalled()
  expect(vi.getTimerCount()).toBe(0)
})
