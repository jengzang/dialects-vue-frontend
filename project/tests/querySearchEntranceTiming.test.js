import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import QuerySearchEntrance from '../src/components/common/QuerySearchEntrance.vue'

let app, host, entrance, scrollPosition, now, frames, nextFrameId
let reducedMotion

async function frame(time) {
  now = time
  const callbacks = [...frames.values()]
  frames.clear()
  callbacks.forEach(callback => callback(time))
  await nextTick()
}

beforeEach(async () => {
  scrollPosition = 0
  now = 0
  reducedMotion = false
  frames = new Map()
  nextFrameId = 0
  vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => scrollPosition)
  vi.spyOn(window.performance, 'now').mockImplementation(() => now)
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  vi.stubGlobal('matchMedia', query => ({ matches: query.includes('reduced-motion') && reducedMotion }))
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
    frames.set(++nextFrameId, callback)
    return nextFrameId
  })
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => frames.delete(id))
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
    return this.classList.contains('query-intro')
      ? { top: 180 - scrollPosition, height: 160 }
      : { top: 720 - scrollPosition, height: 140 }
  })
  host = document.createElement('div')
  document.body.append(host)
  app = createApp({ render: () => h(QuerySearchEntrance, { title: '查询', ref: value => { entrance = value } }) })
  app.mount(host)
  await entrance.collapse()
})

afterEach(() => {
  app?.unmount()
  host?.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('query entrance transition timing', () => {
  it('takes 400ms to collapse even when scrolling directly to the compact position', async () => {
    scrollPosition = 1000
    window.dispatchEvent(new Event('scroll'))
    await frame(0)
    expect(entrance.progress).toBe(0)
    await frame(100)
    expect(entrance.progress).toBeCloseTo(0.25)
    await frame(200)
    expect(entrance.progress).toBeCloseTo(0.5)
    await frame(399)
    expect(entrance.progress).toBeLessThan(1)
    await frame(400)
    expect(entrance.progress).toBe(1)
    expect(frames.size).toBe(0)
  })

  it('reverses smoothly when scrolling back during collapse', async () => {
    scrollPosition = 1000
    window.dispatchEvent(new Event('scroll'))
    await frame(0)
    await frame(200)
    expect(entrance.progress).toBeCloseTo(0.5)
    scrollPosition = 0
    window.dispatchEvent(new Event('scroll'))
    await frame(200)
    expect(entrance.progress).toBeCloseTo(0.5)
    await frame(300)
    expect(entrance.progress).toBeCloseTo(0.25)
    await frame(400)
    expect(entrance.progress).toBe(0)
  })

  it('accepts continued scrolling after a fixed 100ms hold at both endpoints', async () => {
    scrollPosition = 1000
    window.dispatchEvent(new Event('scroll'))
    await frame(0)
    await frame(400)
    scrollPosition = 0
    window.dispatchEvent(new Event('scroll'))
    await frame(410)
    await frame(500)
    expect(entrance.progress).toBe(1)
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: -100 }))
    await frame(500)
    await frame(509)
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: -100 }))
    await frame(509)
    expect(entrance.progress).toBe(1)
    await frame(510)
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: -100 }))
    await frame(510)
    await frame(710)
    expect(entrance.progress).toBeCloseTo(0.5)
    await frame(910)
    expect(entrance.progress).toBe(0)
    scrollPosition = 1000
    window.dispatchEvent(new Event('scroll'))
    await frame(920)
    await frame(1020)
    expect(entrance.progress).toBe(0)
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100 }))
    await frame(1020)
    await frame(1420)
    expect(entrance.progress).toBe(1)
  })

  it('supports a second touch gesture at page top without a scroll event', async () => {
    scrollPosition = 1000
    window.dispatchEvent(new Event('scroll'))
    await frame(0)
    await frame(400)
    scrollPosition = 0
    window.dispatchEvent(new Event('scroll'))
    await frame(410)
    await frame(510)
    window.dispatchEvent(new Event('resize'))
    await frame(510)
    expect(entrance.progress).toBe(1)
    for (const [type, clientY] of [['touchstart', 100], ['touchmove', 150]]) {
      const event = new Event(type)
      Object.defineProperty(event, 'touches', { value: [{ clientY }] })
      window.dispatchEvent(event)
    }
    await frame(510)
    await frame(910)
    expect(entrance.progress).toBe(0)
  })

  it('honors reduced motion and cancels unfinished frames on unmount', async () => {
    reducedMotion = true
    scrollPosition = 1000
    window.dispatchEvent(new Event('scroll'))
    await frame(0)
    expect(entrance.progress).toBe(1)
    expect(frames.size).toBe(0)
    reducedMotion = false
    scrollPosition = 0
    window.dispatchEvent(new Event('scroll'))
    await frame(16)
    await frame(116)
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: -100 }))
    await frame(116)
    expect(frames.size).toBe(1)
    app.unmount()
    app = null
    expect(frames.size).toBe(0)
  })
})
