import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, reactive } from 'vue'

globalThis.__WEB_BASE__ = ''

let route

function readSource(relativePath) {
  return readFileSync(relativePath, 'utf8')
}

function selectorBlock(source, selector) {
  const escapedSelector = selector.replace('.', '\\.')
  return source.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\n\\}`, 'm'))?.[1] ?? ''
}

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key, values = {}) => key.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? ''),
    locale: { value: 'zh-CN' },
  }),
}))

vi.mock('../src/components/bar/NavBar.vue', () => ({
  default: { template: '<div data-navbar-stub></div>' },
}))

vi.mock('../src/components/bar/ExploreBar.vue', () => ({
  default: { template: '<div data-explorebar-stub></div>' },
}))

vi.mock('../src/components/bar/FloatingButtons.vue', () => ({
  default: {
    props: ['authButtonPosition'],
    emits: ['toggle-sidebar'],
    template: '<div data-floating-buttons-stub></div>',
  },
}))

vi.mock('../src/components/bar/SimpleSidebar.vue', () => ({
  default: {
    props: ['isOpen'],
    emits: ['close'],
    template: '<div data-simple-sidebar-stub></div>',
  },
}))

vi.mock('../src/main/components/tutorial/PageTutorialGuide.vue', () => ({
  default: { template: '<div data-page-tutorial-guide></div>' },
}))

vi.mock('../src/main/components/result/PanelManager.vue', () => ({
  default: { template: '<div data-panel-manager-stub></div>' },
}))

vi.mock('../src/components/common/ScrollToTop.vue', () => ({
  default: { template: '<div data-scroll-to-top-stub></div>' },
}))

vi.mock('../src/components/footer/AppFooter.vue', () => ({
  default: {
    props: ['layoutKind'],
    template: '<footer data-app-footer>{{ layoutKind }}</footer>',
  },
}))

function mountComponent(component) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(component)
  app.component('RouterView', {
    template: '<div data-router-view-stub></div>',
  })
  app.mount(host)

  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
    },
  }
}

describe('layout footer mounting', () => {
  beforeEach(() => {
    route = reactive({
      path: '/menu/query/zhonggu',
      fullPath: '/menu/query/zhonggu',
      query: {},
      params: { sub: 'zhonggu' },
      hash: '',
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  it('renders AppFooter in MenuLayout', async () => {
    const { default: MenuLayout } = await import('../src/layouts/MenuLayout.vue')
    const wrapper = mountComponent(MenuLayout)
    await nextTick()

    expect(wrapper.host.querySelector('[data-app-footer]')?.textContent).toBe('menu')

    wrapper.unmount()
  })

  it('renders AppFooter in ExploreLayout', async () => {
    route.path = '/explore/tools/check'
    route.fullPath = '/explore/tools/check'

    const { default: ExploreLayout } = await import('../src/layouts/ExploreLayout.vue')
    const wrapper = mountComponent(ExploreLayout)
    await nextTick()

    expect(wrapper.host.querySelector('[data-app-footer]')?.textContent).toBe('explore')

    wrapper.unmount()
  })

  it('renders AppFooter in SimpleLayout', async () => {
    route.path = '/explore/tools/praat'
    route.fullPath = '/explore/tools/praat'

    const { default: SimpleLayout } = await import('../src/layouts/SimpleLayout.vue')
    const wrapper = mountComponent(SimpleLayout)
    await nextTick()

    expect(wrapper.host.querySelector('[data-app-footer]')?.textContent).toBe('simple')

    wrapper.unmount()
  })

  it('does not render the shared AppFooter on the localized homepage', async () => {
    route.path = '/zh-CN'
    route.fullPath = '/zh-CN'
    route.params = { locale: 'zh-CN' }

    const { default: SimpleLayout } = await import('../src/layouts/SimpleLayout.vue')
    const wrapper = mountComponent(SimpleLayout)
    await nextTick()

    expect(wrapper.host.querySelector('[data-app-footer]')).toBeNull()

    wrapper.unmount()
  })

  it('keeps shared layout content at least one viewport tall before the footer', () => {
    const layoutContentContracts = [
      ['src/layouts/MenuLayout.vue', '.glass-content'],
      ['src/layouts/ExploreLayout.vue', '.content-area'],
      ['src/layouts/SimpleLayout.vue', '.content-area'],
    ]

    layoutContentContracts.forEach(([path, selector]) => {
      const block = selectorBlock(readSource(path), selector)
      expect(block, `${path} ${selector}`).toContain('min-height: 100dvh;')
    })
  })
})
