import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, reactive } from 'vue'

let route

vi.mock('vue-router', () => ({
  useRoute: () => route,
}))

vi.mock('../src/components/bar/NavBar.vue', () => ({
  default: {
    template: '<div data-navbar-stub></div>',
  },
}))

vi.mock('../src/components/bar/ExploreBar.vue', () => ({
  default: {
    template: '<div data-explorebar-stub></div>',
  },
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
  default: {
    template: '<div data-page-tutorial-guide>tutorial guide</div>',
  },
}))

function mountComponent(component) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(component)
  app.component('RouterView', {
    name: 'RouterView',
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

describe('tutorial guide layout mounting', () => {
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

  it('renders the guide in MenuLayout', async () => {
    const { default: MenuLayout } = await import('../src/layouts/MenuLayout.vue')
    const wrapper = mountComponent(MenuLayout)
    await nextTick()

    expect(wrapper.host.querySelector('[data-page-tutorial-guide]')).toBeTruthy()

    wrapper.unmount()
  })

  it('renders the guide in ExploreLayout', async () => {
    route.path = '/explore/tools/check'
    route.fullPath = '/explore/tools/check'

    const { default: ExploreLayout } = await import('../src/layouts/ExploreLayout.vue')
    const wrapper = mountComponent(ExploreLayout)
    await nextTick()

    expect(wrapper.host.querySelector('[data-page-tutorial-guide]')).toBeTruthy()

    wrapper.unmount()
  })

  it('renders the guide in SimpleLayout only for praat', async () => {
    route.path = '/explore/tools/praat'
    route.fullPath = '/explore/tools/praat'

    const { default: SimpleLayout } = await import('../src/layouts/SimpleLayout.vue')
    const praatWrapper = mountComponent(SimpleLayout)
    await nextTick()

    expect(praatWrapper.host.querySelector('[data-page-tutorial-guide]')).toBeTruthy()

    praatWrapper.unmount()

    route.path = '/'
    route.fullPath = '/'

    const homeWrapper = mountComponent(SimpleLayout)
    await nextTick()

    expect(homeWrapper.host.querySelector('[data-page-tutorial-guide]')).toBeNull()

    homeWrapper.unmount()
  })
})
