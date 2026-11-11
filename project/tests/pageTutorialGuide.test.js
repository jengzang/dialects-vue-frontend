import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, reactive } from 'vue'
import { createI18n } from 'vue-i18n'
import { marked } from 'marked'
import { resolveTutorialDocument } from '../src/main/components/tutorial/tutorialMarkdown.js'

let route
let i18n
const wrappers = []

vi.mock('vue-router', () => ({
  useRoute: () => route,
}))

const tutorialModule = () => import('../src/main/components/tutorial/PageTutorialGuide.vue')

vi.mock('../src/main/store/store.js', async () => {
  const actual = await vi.importActual('../src/main/store/store.js')
  return {
    ...actual,
    tutorialEnabled: { value: true },
  }
})

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
        menuResources: '支持與資源',
        exploreTools: 'Explore 工具',
        praat: 'Praat 分析',
        exploreResources: 'Explore 資源',
        exploreVillages: 'Explore 村落',
      },
      assist: {
        badge: '新手指引',
        experience: {
          badge: '快速體驗',
          queryZhonggu: {
            title: '試一組中古條件',
            description: '自動補上一組中古條件與地點，方便直接體驗主站查詢。',
            button: '生成中古示例',
          },
        },
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
      assist: {
        badge: '新手指导',
        experience: {
          badge: '快速体验',
          queryZhonggu: {
            title: '试一组中古条件',
            description: '自动补上一组中古条件与地点，方便直接体验主站查询。',
            button: '生成中古示例',
          },
        },
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
      assist: {
        badge: 'Starter Guide',
        experience: {
          badge: 'Quick Start',
          queryZhonggu: {
            title: 'Try a Middle Chinese condition',
            description: 'Apply a ready-made Middle Chinese condition and location to experience the query flow quickly.',
            button: 'Generate Middle Chinese example',
          },
        },
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

  let isMounted = true
  const wrapper = { host, unmount() {
    if (!isMounted) return
    isMounted = false
    app.unmount()
    host.remove()
  } }
  wrappers.push(wrapper)
  return wrapper
}

async function openGuideFor(component) {
  const wrapper = mountComponent(component)
  await nextTick()

  const trigger = document.querySelector('[data-tutorial-trigger] .tutorial-trigger__main')
  expect(trigger).toBeTruthy()
  trigger.click()

  await nextTick()
  await nextTick()

  return wrapper
}

describe('PageTutorialGuide', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
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
    vi.unstubAllGlobals()
    wrappers.splice(0).forEach(wrapper => wrapper.unmount())
    document.body.innerHTML = ''
    vi.clearAllMocks()
    vi.restoreAllMocks()
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
      expectedTitle: '自定地圖'
    },
    {
      path: '/explore/tools/praat',
      params: {},
      query: { tab: 'results' },
      expectedKey: 'explore-praat-results',
      expectedTitle: '分析結果'
    },
    {
      path: '/menu/yubao',
      params: {},
      query: { tab: 'grammar' },
      expectedKey: 'explore-yubao',
      expectedTitle: '語保'
    },
    {
      path: '/auth',
      params: {},
      query: { view: 'overview' },
      expectedKey: 'auth-overview',
      expectedTitle: '賬戶總覽'
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

  it('renders current markdown screenshots and section headings', async () => {
    const { default: PageTutorialGuide } = await tutorialModule()
    const wrapper = await openGuideFor(PageTutorialGuide)

    const articleImage = document.querySelector('.tutorial-article img')
    const articleHeading = document.querySelector('.tutorial-article__content h2')

    expect(decodeURI(articleImage?.getAttribute('src'))).toBe('/tutorial/menu-query-zhonggu/01-输入页面总览.webp')
    expect(articleHeading?.textContent).toContain('輸入頁面')

    wrapper.unmount()
  })

  it('renders external markdown links with secure new-tab attributes', () => {
    const tokens = marked.lexer('# Fixture\n\nSummary\n\n[External](https://example.com)')
    vi.spyOn(marked, 'lexer').mockReturnValue(tokens)
    const doc = resolveTutorialDocument('menu-query-zhonggu', 'zh-Hant', { isNativeBuild: true })
    const container = document.createElement('div')
    container.innerHTML = doc.html
    const link = container.querySelector('a[href="https://example.com"]')
    expect(link).not.toBeNull()
    expect(link.target).toBe('_blank')
    expect(link.rel.split(' ')).toEqual(expect.arrayContaining(['noopener', 'noreferrer']))
  })

  it('uses locale-specific markdown when it exists', async () => {
    i18n.global.locale.value = 'zh-CN'

    const { default: PageTutorialGuide } = await tutorialModule()
    const wrapper = await openGuideFor(PageTutorialGuide)

    expect(document.querySelector('[data-tutorial-title]')?.textContent).toBe('查中古')
    expect(document.querySelector('.tutorial-article__summary')?.textContent).toContain('中古音韵地位')
    expect(document.querySelector('[data-tutorial-next]')?.textContent).toContain('下一篇')

    wrapper.unmount()
  })

  it('falls back to zh-Hant markdown when the current locale document is missing', async () => {
    i18n.global.locale.value = 'en'

    const { default: PageTutorialGuide } = await tutorialModule()
    const wrapper = await openGuideFor(PageTutorialGuide)

    expect(document.querySelector('[data-tutorial-next]')?.textContent).toContain('Next')
    expect(document.querySelector('[data-tutorial-title]')?.textContent).toContain('查中古')
    expect(document.querySelector('.tutorial-article__summary')?.textContent).toContain('中古音韻地位')

    wrapper.unmount()
  })

  it('opens image preview when clicking an article image', async () => {
    const { default: PageTutorialGuide } = await tutorialModule()
    const wrapper = await openGuideFor(PageTutorialGuide)

    const articleImage = document.querySelector('.tutorial-article img')
    expect(articleImage).toBeTruthy()

    articleImage.click()
    await nextTick()

    const previewImg = document.querySelector('.image-preview-overlay__img')
    expect(previewImg).toBeTruthy()
    expect(previewImg.getAttribute('src')).toBe(articleImage.src)

    const closeBtn = document.querySelector('.image-preview-overlay .close-btn')
    expect(closeBtn).toBeTruthy()
    closeBtn.click()
    await nextTick()

    expect(document.querySelector('.image-preview-overlay')).toBeNull()

    wrapper.unmount()
  })

  it('closes image preview on Escape key', async () => {
    const { default: PageTutorialGuide } = await tutorialModule()
    const wrapper = await openGuideFor(PageTutorialGuide)

    const articleImage = document.querySelector('.tutorial-article img')
    articleImage.click()
    await nextTick()

    expect(document.querySelector('.image-preview-overlay')).toBeTruthy()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()

    expect(document.querySelector('.image-preview-overlay')).toBeNull()

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

    expect(document.querySelector('[data-tutorial-trigger] .tutorial-trigger__main')).toBeNull()

    wrapper.unmount()
  })
})
