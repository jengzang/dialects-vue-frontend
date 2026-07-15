import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, reactive, ref } from 'vue'

let route
let pushMock
let replaceMock

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
}))

vi.mock('@/utils/message.js', () => ({
  showWarning: vi.fn(),
}))

import { useAsyncData } from '../src/composables/core/useAsyncData.js'
import { useAsyncTask } from '../src/composables/core/useAsyncTask.js'
import { usePollingTask } from '../src/composables/core/usePollingTask.js'
import { useStorageState } from '../src/composables/core/useStorageState.js'
import { usePartitionCache } from '@/composables/domain/usePartitionCache.js'
import { useAuthGuard } from '../src/composables/router/useAuthGuard.js'
import { useRouteQueryState } from '../src/composables/router/useRouteQueryState.js'
import { useScrollSnap } from '../src/components/bar/useScrollSnap.js'
import { userStore } from '../src/main/store/store.js'
import { showWarning } from '@/utils/message.js'

describe('composables', () => {
  beforeEach(() => {
    route = reactive({
      path: '/test',
      fullPath: '/test?tab=upload',
      query: {},
    })

    pushMock = vi.fn(async (navigation) => {
      if (navigation.query !== undefined) {
        route.query = navigation.query
      }
      return navigation
    })

    replaceMock = vi.fn(async (navigation) => {
      if (navigation.query !== undefined) {
        route.query = navigation.query
      }
      return navigation
    })

    vi.mocked(showWarning).mockReset()
    userStore.isAuthenticated = false
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  it('useScrollSnap restores visible mobile nav after late content overflow appears', async () => {
    const originalResizeObserver = globalThis.ResizeObserver
    const originalRequestAnimationFrame = globalThis.requestAnimationFrame
    const frameCallbacks = []
    const resizeObservers = []

    globalThis.requestAnimationFrame = (callback) => {
      frameCallbacks.push(callback)
      return frameCallbacks.length
    }

    globalThis.ResizeObserver = class {
      constructor(callback) {
        this.callback = callback
        this.elements = []
        resizeObservers.push(this)
      }

      observe(element) {
        this.elements.push(element)
      }

      disconnect() {}
    }

    const flushAnimationFrames = async (count) => {
      for (let frame = 0; frame < count; frame += 1) {
        const callbacks = frameCallbacks.splice(0, frameCallbacks.length)
        if (!callbacks.length) break
        for (const callback of callbacks) {
          callback()
        }
        await nextTick()
      }
    }

    const host = document.createElement('div')
    document.body.appendChild(host)
    const orderedTabs = ref([
      { tab: 'home', scroll: 'left' },
      { tab: 'query' },
    ])
    let mobileNav

    const defineGeometry = (element, { clientWidth, scrollWidth, rectLeft, rectRight, rectWidth }) => {
      element.__clientWidth = clientWidth
      element.__scrollWidth = scrollWidth
      Object.defineProperty(element, 'clientWidth', {
        configurable: true,
        get: () => element.__clientWidth,
      })
      Object.defineProperty(element, 'scrollWidth', {
        configurable: true,
        get: () => element.__scrollWidth,
      })
      element.getBoundingClientRect = () => ({
        left: rectLeft,
        right: rectRight,
        width: rectWidth,
        top: 0,
        bottom: 0,
        height: 0,
      })
    }

    const app = createApp({
      setup() {
        const navRef = ref(null)
        const mobileNavRef = ref(null)
        useScrollSnap(navRef, orderedTabs, 30, mobileNavRef)
        return { navRef, mobileNavRef }
      },
      render() {
        return h('div', [
          h('nav', { ref: 'navRef', class: 'navbar-btn' }, [
            h('a', { class: 'menu-item tab-overflow-left' }, '🏠'),
            h('a', { class: 'menu-item' }, '查询'),
          ]),
          h('nav', { ref: 'mobileNavRef', class: 'navbar-bottom' }, [
            h('a', { class: 'menu-item tab-overflow-left' }, '🏠'),
            h('a', { class: 'menu-item' }, '查询'),
          ]),
        ])
      },
    })

    try {
      app.mount(host)
      await nextTick()

      const desktopNav = host.querySelector('.navbar-btn')
      mobileNav = host.querySelector('.navbar-bottom')
      const mobilePrimary = mobileNav.querySelector('.menu-item:not(.tab-overflow-left):not(.tab-overflow-right)')
      let mobileScrollLeft = 0
      Object.defineProperty(mobileNav, 'scrollLeft', {
        configurable: true,
        get: () => mobileScrollLeft,
        set: (value) => {
          mobileScrollLeft = Math.max(0, Math.min(value, mobileNav.scrollWidth - mobileNav.clientWidth))
        },
      })

      defineGeometry(desktopNav, { clientWidth: 0, scrollWidth: 0, rectLeft: 0, rectRight: 0, rectWidth: 0 })
      defineGeometry(mobileNav, { clientWidth: 410, scrollWidth: 410, rectLeft: -9, rectRight: 401, rectWidth: 410 })
      mobilePrimary.getBoundingClientRect = () => ({
        left: 25,
        right: 72,
        width: 47,
        top: 0,
        bottom: 0,
        height: 0,
      })

      await nextTick()

      for (const observer of resizeObservers) {
        observer.callback()
      }

      await flushAnimationFrames(20)

      mobileNav.__scrollWidth = 440

      await flushAnimationFrames(40)
      await nextTick()

      expect(mobileNav.scrollLeft).toBe(30)
    } finally {
      app.unmount()
      host.remove()
      globalThis.ResizeObserver = originalResizeObserver
      globalThis.requestAnimationFrame = originalRequestAnimationFrame
    }
  })

  it('useScrollSnap reserves visible primary tab gaps from the primary width budget', async () => {
    const originalResizeObserver = globalThis.ResizeObserver
    const originalRequestAnimationFrame = globalThis.requestAnimationFrame
    const frameCallbacks = []
    const resizeObservers = []

    globalThis.requestAnimationFrame = (callback) => {
      frameCallbacks.push(callback)
      return frameCallbacks.length
    }

    globalThis.ResizeObserver = class {
      constructor(callback) {
        this.callback = callback
        resizeObservers.push(this)
      }

      observe() {}

      disconnect() {}
    }

    const host = document.createElement('div')
    document.body.appendChild(host)
    const orderedTabs = ref([
      { tab: 'home', scroll: 'left' },
      { tab: 'search' },
      { tab: 'map' },
      { tab: 'about' },
      { tab: 'tools', scroll: 'right' },
    ])
    let scrollSnap

    const app = createApp({
      setup() {
        const navRef = ref(null)
        scrollSnap = useScrollSnap(navRef, orderedTabs)
        return { navRef }
      },
      render() {
        return h('nav', { ref: 'navRef', style: { gap: '8px' } }, [
          h('a', { class: 'menu-item tab-overflow-left' }, '🏠'),
          h('a', { class: 'menu-item' }, '搜索'),
          h('a', { class: 'menu-item' }, '地图'),
          h('a', { class: 'menu-item' }, '关于'),
          h('a', { class: 'menu-item tab-overflow-right' }, '工具'),
        ])
      },
    })

    try {
      app.mount(host)
      await nextTick()

      const nav = host.querySelector('nav')
      Object.defineProperty(nav, 'clientWidth', {
        configurable: true,
        get: () => 300,
      })
      Object.defineProperty(nav, 'scrollWidth', {
        configurable: true,
        get: () => 360,
      })
      nav.getBoundingClientRect = () => ({
        left: 0,
        right: 300,
        width: 300,
        top: 0,
        bottom: 0,
        height: 0,
      })
      for (const primary of nav.querySelectorAll('.menu-item:not(.tab-overflow-left):not(.tab-overflow-right)')) {
        primary.getBoundingClientRect = () => ({
          left: 20,
          right: 100,
          width: 80,
          top: 0,
          bottom: 0,
          height: 0,
        })
      }

      for (const observer of resizeObservers) {
        observer.callback()
      }
      await nextTick()

      expect(scrollSnap.navContentWidth.value).toBe(284)
    } finally {
      app.unmount()
      host.remove()
      globalThis.ResizeObserver = originalResizeObserver
      globalThis.requestAnimationFrame = originalRequestAnimationFrame
    }
  })

  it('useScrollSnap measures initial primary width and excludes content-box border', async () => {
    const originalResizeObserver = globalThis.ResizeObserver
    const originalRequestAnimationFrame = globalThis.requestAnimationFrame
    const frameCallbacks = []

    globalThis.requestAnimationFrame = (callback) => {
      frameCallbacks.push(callback)
      return frameCallbacks.length
    }

    globalThis.ResizeObserver = class {
      observe() {}

      disconnect() {}
    }

    const host = document.createElement('div')
    document.body.appendChild(host)
    const orderedTabs = ref([
      { tab: 'home', scroll: 'left' },
      { tab: 'search' },
      { tab: 'map' },
      { tab: 'about' },
      { tab: 'tools', scroll: 'right' },
    ])
    let scrollSnap

    const app = createApp({
      setup() {
        const navRef = ref(null)
        scrollSnap = useScrollSnap(navRef, orderedTabs)
        return { navRef }
      },
      render() {
        return h('nav', { ref: 'navRef', style: { gap: '8px' } }, [
          h('a', { class: 'menu-item tab-overflow-left' }, '🏠'),
          h('a', { class: 'menu-item active', style: { borderLeft: '3px solid transparent', borderRight: '3px solid transparent' } }, '搜索'),
          h('a', { class: 'menu-item' }, '地图'),
          h('a', { class: 'menu-item' }, '关于'),
          h('a', { class: 'menu-item tab-overflow-right' }, '工具'),
        ])
      },
    })

    try {
      app.mount(host)

      const nav = host.querySelector('nav')
      Object.defineProperty(nav, 'clientWidth', {
        configurable: true,
        get: () => 300,
      })
      Object.defineProperty(nav, 'scrollWidth', {
        configurable: true,
        get: () => 360,
      })
      nav.getBoundingClientRect = () => ({
        left: 0,
        right: 300,
        width: 300,
        top: 0,
        bottom: 0,
        height: 0,
      })

      await nextTick()

      expect(scrollSnap.navContentWidth.value).toBe(278)
    } finally {
      app.unmount()
      host.remove()
      globalThis.ResizeObserver = originalResizeObserver
      globalThis.requestAnimationFrame = originalRequestAnimationFrame
    }
  })

  it('useScrollSnap keeps measuring while layout settles after an initially hidden nav becomes visible', async () => {
    const originalResizeObserver = globalThis.ResizeObserver
    const originalRequestAnimationFrame = globalThis.requestAnimationFrame
    const frameCallbacks = []

    globalThis.requestAnimationFrame = (callback) => {
      frameCallbacks.push(callback)
      return frameCallbacks.length
    }

    globalThis.ResizeObserver = class {
      observe() {}

      disconnect() {}
    }

    const flushAnimationFrames = async (count) => {
      for (let frame = 0; frame < count; frame += 1) {
        const callbacks = frameCallbacks.splice(0, frameCallbacks.length)
        if (!callbacks.length) break
        for (const callback of callbacks) {
          callback()
        }
        await nextTick()
      }
    }

    const host = document.createElement('div')
    document.body.appendChild(host)
    const orderedTabs = ref([
      { tab: 'home', scroll: 'left' },
      { tab: 'search' },
      { tab: 'map' },
      { tab: 'tools', scroll: 'right' },
    ])
    let scrollSnap
    let navClientWidth = 0

    const app = createApp({
      setup() {
        const navRef = ref(null)
        scrollSnap = useScrollSnap(navRef, orderedTabs)
        return { navRef }
      },
      render() {
        return h('nav', { ref: 'navRef', style: { gap: '8px' } }, [
          h('a', { class: 'menu-item tab-overflow-left' }, '🏠'),
          h('a', { class: 'menu-item' }, '搜索'),
          h('a', { class: 'menu-item' }, '地图'),
          h('a', { class: 'menu-item tab-overflow-right' }, '工具'),
        ])
      },
    })

    try {
      app.mount(host)

      const nav = host.querySelector('nav')
      Object.defineProperty(nav, 'clientWidth', {
        configurable: true,
        get: () => navClientWidth,
      })
      Object.defineProperty(nav, 'scrollWidth', {
        configurable: true,
        get: () => 360,
      })
      nav.getBoundingClientRect = () => ({
        left: 0,
        right: navClientWidth,
        width: navClientWidth,
        top: 0,
        bottom: 0,
        height: 0,
      })

      await nextTick()
      expect(scrollSnap.navContentWidth.value).toBe(0)

      navClientWidth = 300
      await flushAnimationFrames(5)

      expect(scrollSnap.navContentWidth.value).toBe(292)
    } finally {
      app.unmount()
      host.remove()
      globalThis.ResizeObserver = originalResizeObserver
      globalThis.requestAnimationFrame = originalRequestAnimationFrame
    }
  })

  it('useScrollSnap uses separate desktop and portrait snap thresholds', async () => {
    const originalResizeObserver = globalThis.ResizeObserver
    const originalRequestAnimationFrame = globalThis.requestAnimationFrame
    const frameCallbacks = []

    globalThis.requestAnimationFrame = (callback) => {
      frameCallbacks.push(callback)
      return frameCallbacks.length
    }

    globalThis.ResizeObserver = class {
      observe() {}

      disconnect() {}
    }

    const host = document.createElement('div')
    document.body.appendChild(host)
    const orderedTabs = ref([
      { tab: 'home', scroll: 'left' },
      { tab: 'search' },
    ])
    let scrollSnap
    let desktopNav
    let portraitNav

    const defineNav = (nav, primary, scrollState) => {
      Object.defineProperty(nav, 'clientWidth', {
        configurable: true,
        get: () => 300,
      })
      Object.defineProperty(nav, 'scrollWidth', {
        configurable: true,
        get: () => 360,
      })
      Object.defineProperty(nav, 'scrollLeft', {
        configurable: true,
        get: () => scrollState.value,
        set: (value) => {
          scrollState.value = value
        },
      })
      nav.getBoundingClientRect = () => ({
        left: 0,
        right: 300,
        width: 300,
        top: 0,
        bottom: 0,
        height: 0,
      })
      nav.scrollTo = ({ left }) => {
        scrollState.value = left
      }
      primary.getBoundingClientRect = () => ({
        left: 30 - scrollState.value,
        right: 100 - scrollState.value,
        width: 70,
        top: 0,
        bottom: 0,
        height: 0,
      })
    }

    const app = createApp({
      setup() {
        const navRef = ref(null)
        const mobileNavRef = ref(null)
        scrollSnap = useScrollSnap(navRef, orderedTabs, { desktop: 30, portrait: 18 }, mobileNavRef)
        return { navRef, mobileNavRef }
      },
      render() {
        return h('div', [
          h('nav', { ref: 'navRef', class: 'desktop-nav' }, [
            h('a', { class: 'menu-item tab-overflow-left' }, '🏠'),
            h('a', { class: 'menu-item' }, '搜索'),
          ]),
          h('nav', { ref: 'mobileNavRef', class: 'portrait-nav' }, [
            h('a', { class: 'menu-item tab-overflow-left' }, '🏠'),
            h('a', { class: 'menu-item' }, '搜索'),
          ]),
        ])
      },
    })

    try {
      app.mount(host)
      await nextTick()

      desktopNav = host.querySelector('.desktop-nav')
      portraitNav = host.querySelector('.portrait-nav')
      const desktopScroll = { value: 6 }
      const portraitScroll = { value: 6 }

      defineNav(desktopNav, desktopNav.querySelector('.menu-item:not(.tab-overflow-left):not(.tab-overflow-right)'), desktopScroll)
      defineNav(portraitNav, portraitNav.querySelector('.menu-item:not(.tab-overflow-left):not(.tab-overflow-right)'), portraitScroll)

      desktopScroll.value = 0
      portraitScroll.value = 0
      scrollSnap.onScroll({ target: desktopNav })
      scrollSnap.onScroll({ target: portraitNav })
      scrollSnap.onScrollEnd({ target: desktopNav })
      scrollSnap.onScrollEnd({ target: portraitNav })

      desktopScroll.value = 6
      portraitScroll.value = 6
      scrollSnap.onScroll({ target: desktopNav })
      scrollSnap.onScroll({ target: portraitNav })
      scrollSnap.onScrollEnd({ target: desktopNav })
      scrollSnap.onScrollEnd({ target: portraitNav })

      expect(desktopScroll.value).toBe(30)
      expect(portraitScroll.value).toBe(6)
    } finally {
      app.unmount()
      host.remove()
      globalThis.ResizeObserver = originalResizeObserver
      globalThis.requestAnimationFrame = originalRequestAnimationFrame
    }
  })

  it('useScrollSnap keeps one-sided desktop scroll when moving away from rest', async () => {
    const originalResizeObserver = globalThis.ResizeObserver
    const originalRequestAnimationFrame = globalThis.requestAnimationFrame
    const frameCallbacks = []

    globalThis.requestAnimationFrame = (callback) => {
      frameCallbacks.push(callback)
      return frameCallbacks.length
    }

    globalThis.ResizeObserver = class {
      observe() {}

      disconnect() {}
    }

    const host = document.createElement('div')
    document.body.appendChild(host)
    const orderedTabs = ref([
      { tab: 'home', scroll: 'left' },
      { tab: 'search' },
    ])
    let scrollSnap

    const app = createApp({
      setup() {
        const navRef = ref(null)
        scrollSnap = useScrollSnap(navRef, orderedTabs, { desktop: 30, portrait: 18 })
        return { navRef }
      },
      render() {
        return h('nav', { ref: 'navRef', class: 'desktop-nav' }, [
          h('a', { class: 'menu-item tab-overflow-left' }, '🏠'),
          h('a', { class: 'menu-item' }, '搜索'),
        ])
      },
    })

    try {
      app.mount(host)
      await nextTick()

      const nav = host.querySelector('.desktop-nav')
      const primary = nav.querySelector('.menu-item:not(.tab-overflow-left):not(.tab-overflow-right)')
      const scrollState = { value: 100 }

      Object.defineProperty(nav, 'clientWidth', {
        configurable: true,
        get: () => 300,
      })
      Object.defineProperty(nav, 'scrollWidth', {
        configurable: true,
        get: () => 500,
      })
      Object.defineProperty(nav, 'scrollLeft', {
        configurable: true,
        get: () => scrollState.value,
        set: (value) => {
          scrollState.value = value
        },
      })
      nav.getBoundingClientRect = () => ({
        left: 0,
        right: 300,
        width: 300,
        top: 0,
        bottom: 0,
        height: 0,
      })
      nav.scrollTo = ({ left }) => {
        scrollState.value = left
      }
      primary.getBoundingClientRect = () => ({
        left: 100 - scrollState.value,
        right: 170 - scrollState.value,
        width: 70,
        top: 0,
        bottom: 0,
        height: 0,
      })

      scrollSnap.onScrollEnd({ target: nav })
      expect(scrollState.value).toBe(100)

      scrollState.value = 80
      scrollSnap.onScroll({ target: nav })
      scrollSnap.onScrollEnd({ target: nav })

      expect(scrollState.value).toBe(80)
    } finally {
      app.unmount()
      host.remove()
      globalThis.ResizeObserver = originalResizeObserver
      globalThis.requestAnimationFrame = originalRequestAnimationFrame
    }
  })

  it('useScrollSnap snaps back to rest when scrolling across both overflow sides', async () => {
    const originalResizeObserver = globalThis.ResizeObserver
    const originalRequestAnimationFrame = globalThis.requestAnimationFrame
    const frameCallbacks = []

    globalThis.requestAnimationFrame = (callback) => {
      frameCallbacks.push(callback)
      return frameCallbacks.length
    }

    globalThis.ResizeObserver = class {
      observe() {}

      disconnect() {}
    }

    const host = document.createElement('div')
    document.body.appendChild(host)
    const orderedTabs = ref([
      { tab: 'home', scroll: 'left' },
      { tab: 'search' },
    ])
    let scrollSnap

    const app = createApp({
      setup() {
        const navRef = ref(null)
        const mobileNavRef = ref(null)
        scrollSnap = useScrollSnap(navRef, orderedTabs, {
          desktop: 30,
          portrait: 18,
        }, mobileNavRef)
        return { navRef, mobileNavRef }
      },
      render() {
        return h('div', [
          h('nav', { ref: 'navRef' }, [
            h('a', { class: 'menu-item tab-overflow-left' }, '🏠'),
            h('a', { class: 'menu-item' }, '搜索'),
          ]),
          h('nav', { ref: 'mobileNavRef', class: 'portrait-nav' }, [
            h('a', { class: 'menu-item tab-overflow-left' }, '🏠'),
            h('a', { class: 'menu-item' }, '搜索'),
          ]),
        ])
      },
    })

    try {
      app.mount(host)
      await nextTick()

      const portraitNav = host.querySelector('.portrait-nav')
      const primary = portraitNav.querySelector('.menu-item:not(.tab-overflow-left):not(.tab-overflow-right)')
      const scrollState = { value: 0 }

      Object.defineProperty(portraitNav, 'clientWidth', {
        configurable: true,
        get: () => 300,
      })
      Object.defineProperty(portraitNav, 'scrollWidth', {
        configurable: true,
        get: () => 500,
      })
      Object.defineProperty(portraitNav, 'scrollLeft', {
        configurable: true,
        get: () => scrollState.value,
        set: (value) => {
          scrollState.value = value
        },
      })
      portraitNav.getBoundingClientRect = () => ({
        left: 0,
        right: 300,
        width: 300,
        top: 0,
        bottom: 0,
        height: 0,
      })
      portraitNav.scrollTo = ({ left }) => {
        scrollState.value = left
      }
      primary.getBoundingClientRect = () => ({
        left: 100 - scrollState.value,
        right: 170 - scrollState.value,
        width: 70,
        top: 0,
        bottom: 0,
        height: 0,
      })

      scrollSnap.onScrollEnd({ target: portraitNav })
      expect(scrollState.value).toBe(0)

      scrollState.value = 140
      scrollSnap.onScroll({ target: portraitNav })
      scrollState.value = 60
      scrollSnap.onScroll({ target: portraitNav })
      scrollSnap.onScrollEnd({ target: portraitNav })

      expect(scrollState.value).toBe(100)

      scrollState.value = 140
      scrollSnap.onScroll({ target: portraitNav })
      scrollSnap.onScrollEnd({ target: portraitNav })

      expect(scrollState.value).toBe(140)

      scrollState.value = 60
      scrollSnap.onScroll({ target: portraitNav })
      scrollSnap.onScrollEnd({ target: portraitNav })

      expect(scrollState.value).toBe(100)

      scrollState.value = 60
      scrollSnap.onScroll({ target: portraitNav })
      scrollSnap.onScrollEnd({ target: portraitNav })

      expect(scrollState.value).toBe(60)

      scrollState.value = 140
      scrollSnap.onScroll({ target: portraitNav })
      scrollSnap.onScrollEnd({ target: portraitNav })

      expect(scrollState.value).toBe(100)
    } finally {
      app.unmount()
      host.remove()
      globalThis.ResizeObserver = originalResizeObserver
      globalThis.requestAnimationFrame = originalRequestAnimationFrame
    }
  })

  it('useAsyncTask tracks loading and success', async () => {
    const task = useAsyncTask()
    const resultPromise = task.run(async () => 'ok')

    expect(task.loading.value).toBe(true)

    const result = await resultPromise

    expect(result).toBe('ok')
    expect(task.loading.value).toBe(false)
    expect(task.error.value).toBe(null)
  })

  it('useAsyncTask stores errors without rethrow by default', async () => {
    const task = useAsyncTask()
    const error = new Error('boom')

    const result = await task.run(async () => {
      throw error
    })

    expect(result).toBe(null)
    expect(task.loading.value).toBe(false)
    expect(task.error.value).toBe(error)
  })

  it('useAsyncTask rethrows when requested and still resets loading', async () => {
    const task = useAsyncTask()
    const error = new Error('boom')

    await expect(task.run(async () => {
      throw error
    }, {
      rethrow: true,
    })).rejects.toThrow('boom')

    expect(task.loading.value).toBe(false)
    expect(task.error.value).toBe(error)
  })

  it('useAsyncData loads data and supports resetOnLoad', async () => {
    const asyncData = useAsyncData({
      initialValue: ['old'],
    })

    const result = await asyncData.load(async () => ['new'], {
      resetOnLoad: true,
    })

    expect(result).toEqual(['new'])
    expect(asyncData.data.value).toEqual(['new'])
    expect(asyncData.loading.value).toBe(false)
  })

  it('useStorageState restores defaults when ttl payload is expired', () => {
    window.localStorage.setItem('ttl-key', JSON.stringify({
      value: { a: 1 },
      expiresAt: Date.now() - 1000,
    }))

    const { state } = useStorageState('ttl-key', {
      defaultValue: { a: 2 },
      ttl: 1000,
    })

    expect(state.value).toEqual({ a: 2 })
    expect(window.localStorage.getItem('ttl-key')).toBe(null)
  })

  it('useStorageState persists writes', async () => {
    const { state, write } = useStorageState('plain-key', {
      defaultValue: { a: 1 },
    })

    write({ a: 3 })
    await nextTick()

    expect(state.value).toEqual({ a: 3 })
    expect(JSON.parse(window.localStorage.getItem('plain-key'))).toEqual({ a: 3 })
  })

  it('useRouteQueryState syncs from route and pushes updates', async () => {
    route.query = { tab: 'results' }
    const { state, set } = useRouteQueryState('tab', {
      defaultValue: 'upload',
      parse: (value) => value,
      serialize: (value) => value,
    })

    await nextTick()
    expect(state.value).toBe('results')

    await set('upload')

    expect(pushMock).toHaveBeenCalledWith({
      query: { tab: 'upload' },
    })
    expect(route.query.tab).toBe('upload')
  })

  it('useRouteQueryState falls back to default when parse returns empty value', async () => {
    route.query = { tab: 'invalid' }
    const { state } = useRouteQueryState('tab', {
      defaultValue: 'upload',
      parse: (value) => ['upload', 'results'].includes(value) ? value : '',
      serialize: (value) => value,
    })

    await nextTick()

    expect(state.value).toBe('upload')
  })

  it('useRouteQueryState supports array query values with replace', async () => {
    route.query = { loc: ['%E5%B9%BF%E5%B7%9E', '%E9%A6%99%E6%B8%AF'] }
    const { state, set } = useRouteQueryState('loc', {
      defaultValue: [],
      parse: (value) => {
        const locations = Array.isArray(value) ? value : [value]
        return locations.map((location) => decodeURIComponent(location))
      },
      serialize: (locations) => locations.map((location) => encodeURIComponent(location)),
      replace: true,
      removeIf: (locations) => !Array.isArray(locations) || locations.length === 0,
    })

    await nextTick()
    expect(state.value).toEqual(['广州', '香港'])

    await set(['深圳'])

    expect(replaceMock).toHaveBeenCalledWith({
      query: { loc: ['%E6%B7%B1%E5%9C%B3'] },
    })
    expect(route.query.loc).toEqual(['%E6%B7%B1%E5%9C%B3'])
  })

  it('usePartitionCache returns cached partition data before loading', async () => {
    window.sessionStorage.setItem('partition_data_cache', JSON.stringify([{ id: 1 }]))
    const { getPartitionData } = usePartitionCache()
    const loader = vi.fn()

    const result = await getPartitionData(loader)

    expect(result).toEqual([{ id: 1 }])
    expect(loader).not.toHaveBeenCalled()
  })

  it('usePartitionCache caches transformed yindian tree', async () => {
    const { getYindianTree, getCachedYindianTree } = usePartitionCache()
    const loader = vi.fn(async () => ({ a: 1, b: 2 }))

    const tree = await getYindianTree(loader, {
      transform: (value) => ({ a: value.a }),
    })

    expect(tree).toEqual({ a: 1 })
    expect(getCachedYindianTree()).toEqual({ a: 1 })
  })

  it('useAuthGuard redirects guests and preserves redirect path', async () => {
    route.fullPath = '/secure/page?foo=1'
    const { requireAuth } = useAuthGuard({
      defaultRedirect: '/fallback',
    })

    const allowed = await requireAuth({
      message: 'login first',
    })

    expect(allowed).toBe(false)
    expect(showWarning).toHaveBeenCalledWith('login first')
    expect(pushMock).toHaveBeenCalledWith({
      path: '/auth',
      query: { redirect: '/secure/page?foo=1' },
    })
  })

  it('useAuthGuard allows authenticated users', async () => {
    userStore.isAuthenticated = true
    const { requireAuth } = useAuthGuard()

    const allowed = await requireAuth()

    expect(allowed).toBe(true)
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('usePollingTask stops when shouldStop returns true', async () => {
    vi.useFakeTimers()

    const polling = usePollingTask({
      intervalMs: 50,
      maxFailures: 2,
    })

    let count = 0

    await polling.start(
      async () => {
        count += 1
        return { done: count >= 2, count }
      },
      {
        shouldStop: (result) => result.done,
      }
    )

    expect(polling.status.value).toBe('running')

    await vi.advanceTimersByTimeAsync(60)

    expect(polling.status.value).toBe('completed')
    expect(count).toBe(2)

    vi.useRealTimers()
  })

  it('usePollingTask does not overlap interval ticks when a request is still in flight', async () => {
    vi.useFakeTimers()

    const polling = usePollingTask({
      intervalMs: 50,
      maxFailures: 2,
    })

    let activeRequests = 0
    let maxActiveRequests = 0

    const startPromise = polling.start(
      async () => {
        activeRequests += 1
        maxActiveRequests = Math.max(maxActiveRequests, activeRequests)

        await new Promise((resolve) => setTimeout(resolve, 100))

        activeRequests -= 1
        return { done: false }
      },
      {
        shouldStop: () => false,
      }
    )

    await vi.advanceTimersByTimeAsync(110)
    await startPromise
    await vi.advanceTimersByTimeAsync(160)

    polling.stop()

    expect(maxActiveRequests).toBe(1)

    vi.useRealTimers()
  })

  it('usePollingTask ignores stale responses after a run is stopped and restarted', async () => {
    const polling = usePollingTask({
      intervalMs: 50,
      maxFailures: 2,
    })

    let resolveFirstTask
    let resolveSecondTask

    const firstTask = new Promise((resolve) => {
      resolveFirstTask = resolve
    })
    const secondTask = new Promise((resolve) => {
      resolveSecondTask = resolve
    })

    const task = vi.fn()
      .mockImplementationOnce(async () => {
        await firstTask
        return { label: 'first' }
      })
      .mockImplementationOnce(async () => {
        await secondTask
        return { label: 'second' }
      })

    const firstOnTick = vi.fn()
    const secondOnTick = vi.fn()

    const firstStart = polling.start(task, {
      onTick: firstOnTick,
      shouldStop: () => false,
    })

    polling.stop()

    const secondStart = polling.start(task, {
      onTick: secondOnTick,
      shouldStop: () => false,
    })

    resolveSecondTask()
    await secondStart

    resolveFirstTask()
    await firstStart
    await Promise.resolve()

    expect(secondOnTick).toHaveBeenCalledWith({ label: 'second' })
    expect(firstOnTick).not.toHaveBeenCalled()
  })
})
