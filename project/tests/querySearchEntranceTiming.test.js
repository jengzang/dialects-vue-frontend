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

  it('stops scrolling at the boundary and consumes inertia until a fresh gesture', async () => {
    scrollPosition = 1000
    window.dispatchEvent(new Event('scroll'))
    await frame(0)
    await frame(400)
    scrollPosition = 0
    window.dispatchEvent(new Event('scroll'))
    await frame(410)
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'instant' })

    for (const time of [450, 500, 550, 600]) {
      await frame(time)
      const event = new WheelEvent('wheel', { deltaY: -100, cancelable: true })
      window.dispatchEvent(event)
      await frame(time)
      expect(event.defaultPrevented).toBe(true)
      expect(entrance.progress).toBe(1)
    }
    await frame(650)
    scrollPosition = 20
    window.dispatchEvent(new Event('scroll'))
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'instant' })
    scrollPosition = 0
    window.dispatchEvent(new Event('scroll'))
    await frame(750)
    expect(entrance.progress).toBe(1)
    const fresh = new WheelEvent('wheel', { deltaY: -100, deltaMode: 1, cancelable: true })
    window.dispatchEvent(fresh)
    await frame(750)
    expect(fresh.defaultPrevented).toBe(false)
    await frame(950)
    expect(entrance.progress).toBeCloseTo(0.5)
    await frame(1150)
    expect(entrance.progress).toBe(0)

    window.scrollTo.mockClear()
    scrollPosition = 1000
    window.dispatchEvent(new Event('scroll'))
    await frame(1160)
    expect(window.scrollTo).not.toHaveBeenCalled()
    await frame(1360)
    expect(entrance.progress).toBeCloseTo(0.5)
    await frame(1560)
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

  it('requires lifting the finger before a touch gesture can release the boundary', async () => {
    const touch = (type, clientY) => {
      const event = new Event(type, { cancelable: true })
      Object.defineProperty(event, 'touches', { value: [{ clientY }] })
      window.dispatchEvent(event)
      return event
    }
    scrollPosition = 1000
    window.dispatchEvent(new Event('scroll'))
    await frame(0)
    await frame(400)
    touch('touchstart', 100)
    scrollPosition = 0
    window.dispatchEvent(new Event('scroll'))
    await frame(410)
    await frame(610)
    expect(touch('touchmove', 150).defaultPrevented).toBe(true)
    await frame(610)
    expect(entrance.progress).toBe(1)
    await frame(611)
    touch('touchstart', 100)
    expect(touch('touchmove', 150).defaultPrevented).toBe(false)
    await frame(611)
    await frame(1011)
    expect(entrance.progress).toBe(0)
  })

  it('blocks held keyboard scrolling and allows a fresh key press', async () => {
    scrollPosition = 1000
    window.dispatchEvent(new Event('scroll'))
    await frame(0)
    await frame(400)
    scrollPosition = 0
    window.dispatchEvent(new Event('scroll'))
    await frame(410)
    await frame(610)
    const held = new KeyboardEvent('keydown', { key: 'PageUp', repeat: true, cancelable: true })
    window.dispatchEvent(held)
    expect(held.defaultPrevented).toBe(true)
    await frame(611)
    const fresh = new KeyboardEvent('keydown', { key: 'PageUp', cancelable: true })
    window.dispatchEvent(fresh)
    expect(fresh.defaultPrevented).toBe(false)
    await frame(611)
    await frame(1011)
    expect(entrance.progress).toBe(0)
  })

  it('rearms after five seconds instead of opening on an expired second gesture', async () => {
    scrollPosition = 1000
    window.dispatchEvent(new Event('scroll'))
    await frame(0)
    await frame(400)
    scrollPosition = 0
    window.dispatchEvent(new Event('scroll'))
    await frame(410)
    await frame(5411)
    const expired = new KeyboardEvent('keydown', { key: 'PageUp', cancelable: true })
    window.dispatchEvent(expired)
    await frame(5411)
    expect(expired.defaultPrevented).toBe(true)
    expect(entrance.progress).toBe(1)
    await frame(5412)
    const second = new KeyboardEvent('keydown', { key: 'PageUp', cancelable: true })
    window.dispatchEvent(second)
    await frame(5412)
    expect(second.defaultPrevented).toBe(false)
    await frame(5812)
    expect(entrance.progress).toBe(0)
  })

  it('rejects decaying wheel inertia but accepts a new impulse without a hold delay', async () => {
    scrollPosition = 1000
    window.dispatchEvent(new Event('scroll'))
    await frame(0)
    await frame(400)
    scrollPosition = 0
    window.dispatchEvent(new Event('scroll'))
    await frame(410)
    for (const [time, deltaY] of [[420, -80], [430, -40], [440, -20]]) {
      await frame(time)
      const inertia = new WheelEvent('wheel', { deltaY, cancelable: true })
      window.dispatchEvent(inertia)
      await frame(time)
      expect(inertia.defaultPrevented).toBe(true)
      expect(entrance.progress).toBe(1)
    }
    await frame(441)
    const impulse = new WheelEvent('wheel', { deltaY: -90, cancelable: true })
    window.dispatchEvent(impulse)
    await frame(441)
    expect(impulse.defaultPrevented).toBe(false)
    await frame(841)
    expect(entrance.progress).toBe(0)
  })

  it('keeps nested scrollable content usable while the page is held', async () => {
    scrollPosition = 1000
    window.dispatchEvent(new Event('scroll'))
    await frame(0)
    await frame(400)
    scrollPosition = 0
    window.dispatchEvent(new Event('scroll'))
    await frame(410)
    const content = document.createElement('div')
    content.style.overflowY = 'auto'
    content.scrollTop = 20
    host.append(content)
    await frame(610)
    const event = new WheelEvent('wheel', { deltaY: -100, cancelable: true, bubbles: true })
    content.dispatchEvent(event)
    await frame(610)
    await frame(1010)
    expect(event.defaultPrevented).toBe(false)
    expect(entrance.progress).toBe(1)
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
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, deltaMode: 1 }))
    await frame(116)
    expect(frames.size).toBe(1)
    app.unmount()
    app = null
    expect(frames.size).toBe(0)
  })
})
