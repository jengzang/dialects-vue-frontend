import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, reactive, ref } from 'vue'
import { useTabPill } from '../src/composables/bar/useTabPill.js'

let app
let route
let pillStyle
let geometry
let observers

const settle = async () => {
  await nextTick()
  await nextTick()
}

async function mountPill() {
  route = reactive({ fullPath: '/query/char' })
  const host = document.createElement('div')
  document.body.append(host)
  app = createApp({
    setup() {
      const nav = ref(null)
      const pill = useTabPill(nav, '.tab.active', route)
      pillStyle = pill.pillStyle
      return () => h('nav', { ref: nav }, [
        h('div', { class: 'tab-pill', style: pillStyle.value }),
        ...['/query/char', '/map/view'].map(path => h('a', {
          class: ['tab', { active: route.fullPath === path }],
          'data-path': path,
        }, path)),
      ])
    },
  })
  app.mount(host)
  await settle()
}

function notifyResize() {
  for (const observer of observers) {
    observer.callback([...observer.elements].map(target => ({ target })))
  }
}

describe('tab pill layout after navigation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    observers = []
    geometry = { left: 100, width: 80, height: 40 }
    vi.stubGlobal('ResizeObserver', class {
      elements = new Set()
      constructor(callback) {
        this.callback = callback
        observers.push(this)
      }
      observe(element) { this.elements.add(element) }
      unobserve(element) { this.elements.delete(element) }
      disconnect() { this.elements.clear() }
    })
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
      if (this.tagName === 'NAV') return { left: 10, width: 300, height: 40 }
      return { ...geometry }
    })
  })

  afterEach(() => {
    app?.unmount()
    app = null
    document.body.innerHTML = ''
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('measures the active tab after a programmatic route change without a click', async () => {
    await mountPill()
    geometry = { left: 180, width: 96, height: 40 }
    route.fullPath = '/map/view'
    await settle()
    expect(pillStyle.value.width).toBe('96px')
    expect(pillStyle.value.transform).toBe('translateX(170px) translateY(-50%)')
  })

  it('follows the final active size after the delayed selection transition', async () => {
    await mountPill()
    route.fullPath = '/map/view'
    await settle()
    geometry = { left: 174, width: 110, height: 40 }
    notifyResize()
    await settle()
    expect(pillStyle.value.width).toBe('110px')
    expect(pillStyle.value.transform).toBe('translateX(164px) translateY(-50%)')
  })

  it('recovers when an initially hidden navigation becomes measurable', async () => {
    geometry = { left: 0, width: 0, height: 0 }
    await mountPill()
    geometry = { left: 100, width: 80, height: 40 }
    notifyResize()
    await settle()
    expect(pillStyle.value.width).toBe('80px')
    expect(pillStyle.value.height).toBe('40px')
  })

  it('releases observations and pending updates when unmounted', async () => {
    await mountPill()
    notifyResize()
    app.unmount()
    app = null
    const previousStyle = pillStyle.value
    await settle()
    expect(observers.every(observer => observer.elements.size === 0)).toBe(true)
    expect(pillStyle.value).toBe(previousStyle)
    expect(vi.getTimerCount()).toBe(0)
  })
})
