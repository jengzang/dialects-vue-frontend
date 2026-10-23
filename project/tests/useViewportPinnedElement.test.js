import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import { useViewportPinnedElement } from '../src/composables/ui/useViewportPinnedElement.js'

let app
let host
let originalGetBoundingClientRect
let originalMatchMediaDescriptor
let originalResizeObserverDescriptor

afterEach(() => {
  app?.unmount()
  host?.remove()
  if (originalGetBoundingClientRect) {
    HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
  }
  if (originalMatchMediaDescriptor) {
    Object.defineProperty(window, 'matchMedia', originalMatchMediaDescriptor)
  } else {
    delete window.matchMedia
  }
  if (originalResizeObserverDescriptor) {
    Object.defineProperty(globalThis, 'ResizeObserver', originalResizeObserverDescriptor)
  } else {
    delete globalThis.ResizeObserver
  }
  originalGetBoundingClientRect = undefined
  originalMatchMediaDescriptor = undefined
  originalResizeObserverDescriptor = undefined
  vi.restoreAllMocks()
})

async function mountPinnedElement(options = {}) {
  host = document.createElement('div')
  document.body.append(host)
  app = createApp({
    setup() {
      const elementRef = ref(null)
      const placeholderRef = ref(null)
      const { elementStyle, placeholderStyle } = useViewportPinnedElement({
        elementRef,
        placeholderRef,
        ...options,
      })

      return () => h('div', {
        ref: placeholderRef,
        'data-pinned-placeholder': '',
        style: placeholderStyle.value,
      }, [h('div', {
        ref: elementRef,
        'data-pinned-navigation': '',
        style: elementStyle.value,
      })])
    },
  })
  app.mount(host)
  await nextTick()

  return {
    placeholder: host.querySelector('[data-pinned-placeholder]'),
    navigation: host.querySelector('[data-pinned-navigation]'),
  }
}

describe('useViewportPinnedElement', () => {
  it('preserves the navigation width and center when the element becomes fixed', async () => {
    originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
    originalMatchMediaDescriptor = Object.getOwnPropertyDescriptor(window, 'matchMedia')
    originalResizeObserverDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'ResizeObserver')

    window.matchMedia = vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    let resizeCallback
    globalThis.ResizeObserver = class {
      constructor(callback) {
        resizeCallback = callback
      }

      observe() {}
      disconnect() {}
    }

    HTMLElement.prototype.getBoundingClientRect = function getPinnedRect() {
      if (this.hasAttribute('data-pinned-placeholder')) {
        const width = Number.parseFloat(this.style.width)
          || (this.firstElementChild?.style.position === 'fixed' ? 0 : 800)
        return { x: 20, y: 100, left: 20, top: 100, right: 20 + width, bottom: 150, width, height: 50 }
      }
      if (this.hasAttribute('data-pinned-navigation')) {
        const width = Number.parseFloat(this.style.width) || 240
        return { x: 300, y: 100, left: 300, top: 100, right: 300 + width, bottom: 150, width, height: 50 }
      }
      return originalGetBoundingClientRect.call(this)
    }

    const { placeholder, navigation } = await mountPinnedElement()
    resizeCallback()
    await nextTick()

    expect(placeholder.style.width).toBe('800px')
    expect(navigation.style.width).toBe('240px')
    expect(navigation.style.left).toBe('300px')
  })

  it('waits for the portrait navigation to reach the viewport top before pinning', async () => {
    originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
    originalMatchMediaDescriptor = Object.getOwnPropertyDescriptor(window, 'matchMedia')

    let placeholderTop = 100
    window.matchMedia = vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    HTMLElement.prototype.getBoundingClientRect = function getPinnedRect() {
      if (this.hasAttribute('data-pinned-placeholder')) {
        const width = Number.parseFloat(this.style.width)
          || (this.firstElementChild?.style.position === 'fixed' ? 0 : 240)
        return { x: 20, y: placeholderTop, left: 20, top: placeholderTop, right: 20 + width, bottom: placeholderTop + 50, width, height: 50 }
      }
      if (this.hasAttribute('data-pinned-navigation')) {
        const width = Number.parseFloat(this.style.width) || 240
        return { x: 300, y: 100, left: 300, top: 100, right: 300 + width, bottom: 150, width, height: 50 }
      }
      return originalGetBoundingClientRect.call(this)
    }

    const { navigation } = await mountPinnedElement({ portraitTop: 0 })
    expect(navigation.style.position).toBe('')

    placeholderTop = -1
    window.dispatchEvent(new Event('scroll'))
    await nextTick()

    expect(navigation.style.position).toBe('fixed')
    expect(navigation.style.top).toBe('0px')
    expect(navigation.style.width).toBe('240px')
    expect(navigation.style.left).toBe('20px')
  })

  it('recenters the rendered navigation width on orientation changes and clamps it to its parent', async () => {
    originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
    originalMatchMediaDescriptor = Object.getOwnPropertyDescriptor(window, 'matchMedia')

    let placeholderLeft = 20
    let placeholderTop = 100
    let placeholderWidth = 800
    const intrinsicNavigationWidth = 240
    const orientationQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    window.matchMedia = vi.fn(() => orientationQuery)

    HTMLElement.prototype.getBoundingClientRect = function getPinnedRect() {
      if (this.hasAttribute('data-pinned-placeholder')) {
        return {
          x: placeholderLeft,
          y: placeholderTop,
          left: placeholderLeft,
          top: placeholderTop,
          right: placeholderLeft + placeholderWidth,
          bottom: placeholderTop + 50,
          width: placeholderWidth,
          height: 50,
        }
      }
      if (this.hasAttribute('data-pinned-navigation')) {
        const width = Number.parseFloat(this.style.width) || intrinsicNavigationWidth
        const left = Number.parseFloat(this.style.left) || 300
        return { x: left, y: 100, left, top: 100, right: left + width, bottom: 150, width, height: 50 }
      }
      return originalGetBoundingClientRect.call(this)
    }

    const { navigation } = await mountPinnedElement()
    expect(navigation.style.left).toBe('300px')

    placeholderLeft = 10
    placeholderTop = -1
    placeholderWidth = 360
    orientationQuery.matches = true
    window.dispatchEvent(new Event('resize'))
    await nextTick()

    expect(navigation.style.left).toBe('70px')
    expect(navigation.style.width).toBe('240px')

    placeholderWidth = 120
    window.dispatchEvent(new Event('resize'))
    await nextTick()
    expect(navigation.style.width).toBe('120px')
    expect(navigation.style.left).toBe('10px')
  })

  it('uses a dynamic portrait top offset when pinning below a fixed header', async () => {
    originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
    originalMatchMediaDescriptor = Object.getOwnPropertyDescriptor(window, 'matchMedia')

    let placeholderTop = 100
    let headerBottom = 80
    window.matchMedia = vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    HTMLElement.prototype.getBoundingClientRect = function getPinnedRect() {
      if (this.hasAttribute('data-pinned-placeholder')) {
        return { x: 20, y: placeholderTop, left: 20, top: placeholderTop, right: 260, bottom: placeholderTop + 50, width: 240, height: 50 }
      }
      if (this.hasAttribute('data-pinned-navigation')) {
        return { x: 20, y: 100, left: 20, top: 100, right: 260, bottom: 150, width: 240, height: 50 }
      }
      return originalGetBoundingClientRect.call(this)
    }

    const { navigation } = await mountPinnedElement({ portraitTop: () => headerBottom })
    expect(navigation.style.position).toBe('')

    placeholderTop = 70
    headerBottom = 90
    window.dispatchEvent(new Event('scroll'))
    await nextTick()

    expect(navigation.style.position).toBe('fixed')
    expect(navigation.style.top).toBe('90px')
  })
})
