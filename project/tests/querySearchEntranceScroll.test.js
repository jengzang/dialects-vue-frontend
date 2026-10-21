import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h } from 'vue'
import QuerySearchEntrance from '../src/components/common/QuerySearchEntrance.vue'

let app, host, navbar
afterEach(() => {
  app?.unmount()
  host?.remove()
  navbar?.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('query entrance scroll clearance', () => {
  it.each([
    { portrait: true, viewport: 844, navBottom: 151, expected: 169 },
    { portrait: false, viewport: 900, navBottom: 74, expected: 224 },
    { portrait: false, viewport: 500, navBottom: 74, expected: 246 },
  ])('clears the navbar at viewport height $viewport (portrait=$portrait)', async ({ portrait, viewport, navBottom, expected }) => {
    vi.stubGlobal('innerHeight', viewport)
    vi.stubGlobal('scrollY', 0)
    vi.stubGlobal('matchMedia', query => ({ matches: query.includes('aspect-ratio') && portrait }))
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
      if (this.classList.contains('navbar')) return { top: 8, bottom: navBottom, height: navBottom - 8 }
      if (this.classList.contains('query-intro')) return { top: 212, height: 120 }
      return { top: 332, height: 298 }
    })
    navbar = document.createElement('div')
    navbar.className = 'navbar'
    host = document.createElement('div')
    document.body.append(navbar, host)
    app = createApp({ render: () => h(QuerySearchEntrance, { ref: 'entrance', title: '查询' }) })
    const root = app.mount(host)
    await root.$refs.entrance.collapse()
    expect(scrollTo).toHaveBeenCalledWith({ top: expected, behavior: 'smooth' })
  })
})
