import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, reactive } from 'vue'

let route

vi.mock('vue-router', () => ({
  useRoute: () => route,
}))

const tutorialModule = () => import('../src/main/components/tutorial/PageTutorialGuide.vue')
const tutorialContentModule = () => import('../src/main/components/tutorial/pageTutorialContent.js')

function mountComponent(component) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(component)
  app.mount(host)

  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
    },
  }
}

async function openGuideFor(component) {
  const wrapper = mountComponent(component)
  await nextTick()

  const trigger = document.querySelector('[data-tutorial-trigger]')
  expect(trigger).toBeTruthy()
  trigger.click()

  await nextTick()
  await nextTick()

  return wrapper
}

describe('PageTutorialGuide', () => {
  beforeEach(() => {
    route = reactive({
      path: '/menu/query/zhonggu',
      query: {},
      params: {
        sub: 'zhonggu',
      },
      fullPath: '/menu/query/zhonggu',
      hash: '',
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  it('loads tutorial content from a dedicated content module', async () => {
    const { tutorialContentEntries } = await tutorialContentModule()
    const contentMap = new Map(tutorialContentEntries.map((entry) => [entry.key, entry]))

    expect(contentMap.get('menu-query-zhonggu')?.title).toBe('查中古')
    expect(contentMap.get('menu-map-custom')?.title).toBe('自定義繪圖')
    expect(contentMap.get('explore-praat-results')?.sections?.length).toBeGreaterThan(0)
    expect(contentMap.get('explore-yubao-grammar')?.summary).toContain('語法')
    expect(typeof contentMap.get('auth-register')?.match).toBe('function')
  })

  it.each([
    {
      path: '/menu/query/zhonggu',
      params: { sub: 'zhonggu' },
      query: {},
      expectedKey: 'menu-query-zhonggu',
      expectedTitle: '查中古'
    },
    {
      path: '/menu/map/custom',
      params: { sub: 'custom' },
      query: {},
      expectedKey: 'menu-map-custom',
      expectedTitle: '自定義繪圖'
    },
    {
      path: '/explore/tools/praat',
      params: {},
      query: { tab: 'results' },
      expectedKey: 'explore-praat-results',
      expectedTitle: 'Praat 結果'
    },
    {
      path: '/explore/yubao',
      params: {},
      query: { tab: 'grammar' },
      expectedKey: 'explore-yubao-grammar',
      expectedTitle: '語保語法'
    },
    {
      path: '/auth',
      params: {},
      query: { view: 'register' },
      expectedKey: 'auth-register',
      expectedTitle: '註冊'
    },
  ])('auto-selects the current route tutorial for $path', async ({ path, params, query, expectedKey, expectedTitle }) => {
    route.path = path
    route.params = params
    route.query = query
    route.fullPath = query && Object.keys(query).length > 0
      ? `${path}?${new URLSearchParams(query).toString()}`
      : path

    const { default: PageTutorialGuide } = await tutorialModule()
    const wrapper = await openGuideFor(PageTutorialGuide)

    const activeEntry = document.querySelector('[data-tutorial-entry].is-active')
    expect(activeEntry?.getAttribute('data-tutorial-key')).toBe(expectedKey)
    expect(document.querySelector('[data-tutorial-title]')?.textContent).toContain(expectedTitle)

    wrapper.unmount()
  })

  it('opens from the floating trigger and supports previous/next navigation', async () => {
    const { default: PageTutorialGuide } = await tutorialModule()
    const wrapper = await openGuideFor(PageTutorialGuide)

    expect(document.querySelector('[data-tutorial-modal]')).toBeTruthy()
    expect(document.querySelector('[data-tutorial-entry].is-active')?.getAttribute('data-tutorial-key')).toBe('menu-query-zhonggu')

    const nextButton = document.querySelector('[data-tutorial-next]')
    expect(nextButton).toBeTruthy()
    nextButton.click()
    await nextTick()

    expect(document.querySelector('[data-tutorial-entry].is-active')?.getAttribute('data-tutorial-key')).toBe('menu-query-yinwei')

    const prevButton = document.querySelector('[data-tutorial-prev]')
    expect(prevButton).toBeTruthy()
    prevButton.click()
    await nextTick()

    expect(document.querySelector('[data-tutorial-entry].is-active')?.getAttribute('data-tutorial-key')).toBe('menu-query-zhonggu')

    wrapper.unmount()
  })

  it('hides the trigger on unsupported routes', async () => {
    route.path = '/'
    route.params = {}
    route.query = {}
    route.fullPath = '/'

    const { default: PageTutorialGuide } = await tutorialModule()
    const wrapper = mountComponent(PageTutorialGuide)
    await nextTick()

    expect(document.querySelector('[data-tutorial-trigger]')).toBeNull()

    wrapper.unmount()
  })
})
