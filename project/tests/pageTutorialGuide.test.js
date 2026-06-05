import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, reactive } from 'vue'
import { createI18n } from 'vue-i18n'

let route
let i18n

vi.mock('vue-router', () => ({
  useRoute: () => route,
}))

const tutorialModule = () => import('../src/main/components/tutorial/PageTutorialGuide.vue')

const tutorialMessages = {
  'zh-Hant': {
    tutorial: {
      ui: {
        triggerLabel: '教程',
        openLabel: '打開{title}教程',
        modalTitle: '頁面教程',
        closeLabel: '關閉教程',
        currentPage: '當前頁',
        expandCatalog: '展開目錄',
        collapseCatalog: '收起目錄',
        currentBadge: '當前',
        previous: '上一篇',
        next: '下一篇',
        missing: '教程暫未提供',
      },
      groups: {
        account: '賬戶與自定義',
        menuQuery: '主站查詢',
        menuCompare: '主站比較',
        menuMap: '主站地圖',
        menuPhonology: '主站音系',
        menuResources: '支援與資源',
        exploreTools: 'Explore 工具',
        praat: 'Praat 分析',
        exploreResources: 'Explore 資源',
        exploreVillages: 'Explore 村落',
      },
    },
  },
  'zh-CN': {
    tutorial: {
      ui: {
        triggerLabel: '教程',
        openLabel: '打开{title}教程',
        modalTitle: '页面教程',
        closeLabel: '关闭教程',
        currentPage: '当前页',
        expandCatalog: '展开目录',
        collapseCatalog: '收起目录',
        currentBadge: '当前',
        previous: '上一篇',
        next: '下一篇',
        missing: '教程暂未提供',
      },
      groups: {
        account: '账户与自定义',
        menuQuery: '主站查询',
        menuCompare: '主站比较',
        menuMap: '主站地图',
        menuPhonology: '主站音系',
        menuResources: '支持与资源',
        exploreTools: 'Explore 工具',
        praat: 'Praat 分析',
        exploreResources: 'Explore 资源',
        exploreVillages: 'Explore 村落',
      },
    },
  },
  en: {
    tutorial: {
      ui: {
        triggerLabel: 'Guide',
        openLabel: 'Open {title} tutorial',
        modalTitle: 'Page Tutorial',
        closeLabel: 'Close tutorial',
        currentPage: 'Current Page',
        expandCatalog: 'Expand Catalog',
        collapseCatalog: 'Collapse Catalog',
        currentBadge: 'Current',
        previous: 'Previous',
        next: 'Next',
        missing: 'Tutorial is not available yet',
      },
      groups: {
        account: 'Account and Customization',
        menuQuery: 'Main Query',
        menuCompare: 'Main Compare',
        menuMap: 'Main Map',
        menuPhonology: 'Main Phonology',
        menuResources: 'Support and Resources',
        exploreTools: 'Explore Tools',
        praat: 'Praat Analysis',
        exploreResources: 'Explore Resources',
        exploreVillages: 'Explore Villages',
      },
    },
  },
}

function mountComponent(component) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp(component)
  app.use(i18n)
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
    i18n = createI18n({
      legacy: false,
      locale: 'zh-Hant',
      fallbackLocale: 'zh-Hant',
      messages: tutorialMessages,
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
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

  it('renders markdown article content with images and secure external links', async () => {
    const { default: PageTutorialGuide } = await tutorialModule()
    const wrapper = await openGuideFor(PageTutorialGuide)

    const articleImage = document.querySelector('.tutorial-article img')
    const articleLink = document.querySelector('.tutorial-article a[href="https://example.com/tutorial/query/zhonggu"]')
    const codeNode = document.querySelector('.tutorial-article code')

    expect(articleImage?.getAttribute('src')).toBe('/tutorial/menu-query-zhonggu/overview.svg')
    expect(articleLink?.getAttribute('target')).toBe('_blank')
    expect(articleLink?.getAttribute('rel')).toContain('noopener')
    expect(codeNode?.textContent).toBe('/menu/query/zhonggu')

    wrapper.unmount()
  })

  it('uses locale-specific markdown when it exists', async () => {
    route.path = '/auth'
    route.params = {}
    route.query = { view: 'register' }
    route.fullPath = '/auth?view=register'
    i18n.global.locale.value = 'en'

    const { default: PageTutorialGuide } = await tutorialModule()
    const wrapper = await openGuideFor(PageTutorialGuide)

    expect(document.querySelector('[data-tutorial-title]')?.textContent).toContain('Register')
    expect(document.querySelector('.tutorial-shell__current-label')?.textContent).toContain('Current Page')
    expect(document.querySelector('.tutorial-article__group')?.textContent).toContain('Account and Customization')
    expect(document.querySelector('[data-tutorial-next]')?.textContent).toContain('Next')

    wrapper.unmount()
  })

  it('falls back to zh-Hant markdown when the current locale document is missing', async () => {
    i18n.global.locale.value = 'zh-CN'

    const { default: PageTutorialGuide } = await tutorialModule()
    const wrapper = await openGuideFor(PageTutorialGuide)

    expect(document.querySelector('.tutorial-shell__current-label')?.textContent).toContain('当前页')
    expect(document.querySelector('.tutorial-article__group')?.textContent).toContain('主站查询')
    expect(document.querySelector('[data-tutorial-title]')?.textContent).toContain('查中古')
    expect(document.querySelector('.tutorial-article__summary')?.textContent).toContain('中古音條件')

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
