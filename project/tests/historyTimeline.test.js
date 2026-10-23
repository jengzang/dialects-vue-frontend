import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import HistoryPage from '../src/main/views/menu/support/about/AboutHistory.vue'
import i18n from '../src/i18n/index.js'
import { historyEntries } from '../src/main/views/menu/support/about/history.data.js'
import { menuRoutes } from '../src/main/router/menuRoutes.js'
import { exploreRoutes } from '../src/main/router/exploreRoutes.js'

const testsDir = dirname(fileURLToPath(import.meta.url))
const historyPageSource = readFileSync(resolve(testsDir, '../src/main/views/menu/support/about/AboutHistory.vue'), 'utf8')
const zhCnAbout = JSON.parse(readFileSync(resolve(testsDir, '../src/i18n/locales/zh-CN/about.json'), 'utf8'))
const zhHantAbout = JSON.parse(readFileSync(resolve(testsDir, '../src/i18n/locales/zh-Hant/about.json'), 'utf8'))
const enAbout = JSON.parse(readFileSync(resolve(testsDir, '../src/i18n/locales/en/about.json'), 'utf8'))
const homePageSource = readFileSync(resolve(testsDir, '../src/main/views/HomePage.vue'), 'utf8')
const customDataPanelSource = readFileSync(resolve(testsDir, '../src/main/components/map/custom/CustomDataPanel.vue'), 'utf8')
const locationInputSource = readFileSync(resolve(testsDir, '../src/main/components/geo/LocationAndRegionInput.vue'), 'utf8')
const appFooterSource = readFileSync(resolve(testsDir, '../src/components/footer/AppFooter.vue'), 'utf8')

let app
let host
let router

afterEach(() => {
  app?.unmount()
  host?.remove()
})

async function mountHistory(locale = 'zh-Hant', props = {}, uiLocale = 'zh-CN') {
  const stubRoutes = routes => routes.map(route => ({
    ...route,
    component: { template: '<div />' },
    children: route.children ? stubRoutes(route.children) : undefined
  }))
  router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:locale(zh-CN|zh-Hant|en)', children: [
      { path: '', component: { template: '<div />' } },
      { path: 'auth/regions', component: { template: '<div />' } },
      ...stubRoutes([...menuRoutes, ...exploreRoutes])
    ] }]
  })
  await router.push(`/${locale}/menu/about/history`)
  i18n.global.locale.value = uiLocale
  host = document.createElement('div')
  document.body.append(host)
  app = createApp(HistoryPage, props)
  app.use(router)
  app.use(i18n)
  app.config.globalProperties.$t = key => key
  app.mount(host)
  return [...host.querySelectorAll('ol > li')]
}

function plainHistoryEntry(markedText) {
  return markedText
    .replace(/\[\[(?:link|external|action)::[^:]+::([^\]]+)\]\]/g, '$1')
    .replace(/\[\[version:([^\]]+)\]\]/g, '$1')
}

describe('author-provided website history', () => {
  it('stores every history entry and importance reason in each locale JSON without runtime conversion', () => {
    const expectedDates = historyEntries.map(entry => entry.date.replaceAll('.', '_'))
    for (const about of [zhCnAbout, zhHantAbout, enAbout]) {
      expect(Object.keys(about.history.entries)).toEqual(expectedDates)
      expect(Object.keys(about.history.importanceReasons)).toEqual(
        historyEntries.filter(entry => entry.important).map(entry => entry.date.replaceAll('.', '_'))
      )
    }
    expect(historyPageSource).not.toMatch(/opencc-js|toTraditional|Converter\(/)
  })

  it('renders saved Traditional Chinese history text directly from its locale JSON', async () => {
    const entries = await mountHistory('zh-Hant', {}, 'zh-Hant')
    const content = entries.find(entry => entry.querySelector('time').dateTime === '2025-06-12').textContent
    expect(content).toContain('實現了提取「漢字音典」開源字表的聲韻調')
    expect(content).toContain('彙總到excel表格中')
    expect(content).not.toContain('实现了提取')
  })

  it('shows the existing development reflections after the timeline', async () => {
    await mountHistory()
    const reflection = host.querySelector('.thoughts-container')
    expect(reflection).toBeTruthy()
    expect(reflection.textContent).toContain('about.reflection.title')
    expect(reflection.querySelectorAll('.thoughts')).toHaveLength(4)
    const lastTimelineStage = [...host.querySelectorAll('.history-stage')].at(-1)
    expect(lastTimelineStage.compareDocumentPosition(reflection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('titles the About section 开发历程', async () => {
    await mountHistory()
    expect(host.querySelector('#history-title').textContent.trim()).toBe('开发历程')
  })

  it('renders a homepage preview with only important updates and links to the full history', async () => {
    await mountHistory('zh-Hant', { featured: true, title: '开发历程' })

    expect(host.querySelector('.history-filter')).toBeNull()
    expect(host.querySelector('.history-filter-summary')).toBeNull()
    expect(host.querySelector('.thoughts-container')).toBeNull()
    expect(host.querySelectorAll('.history-entry')).toHaveLength(historyEntries.filter(entry => entry.important).length)
    expect([...host.querySelectorAll('.history-date')].map(time => time.textContent)).toEqual(
      historyEntries.filter(entry => entry.important).map(entry => entry.date)
    )
    expect(host.querySelectorAll('.history-stage')).toHaveLength(5)
    expect(host.querySelector('.history-featured-link')?.getAttribute('href')).toBe('/zh-Hant/menu/about/history')
    expect(host.querySelector('.history-featured-link')?.textContent).toBe('home.history.viewAll')
  })

  it('places the important-history preview above Open-Source Projects on the homepage', () => {
    const historyIndex = homePageSource.indexOf('<AboutHistory')
    const projectsIndex = homePageSource.indexOf('<!-- Projects Section -->')

    expect(historyIndex).toBeGreaterThan(-1)
    expect(historyIndex).toBeLessThan(projectsIndex)
    expect(homePageSource.slice(historyIndex, projectsIndex)).toMatch(/<AboutHistory[^>]*featured/)
  })

  it('uses a compact reading scale for the timeline in portrait mode', () => {
    const portraitStyles = historyPageSource.split('@media (max-aspect-ratio: 1 / 1)').at(-1)

    expect(portraitStyles).toMatch(/\.history-page\s*\{[^}]*font-size:\s*0\.875rem/s)
    expect(portraitStyles).toMatch(/\.page-title\s*\{[^}]*font-size:\s*1\.25rem/s)
    expect(portraitStyles).toMatch(/\.history-stage-title\s*\{[^}]*font-size:\s*1\.2rem/s)
    expect(portraitStyles).toMatch(/\.history-filter-summary\s*\{[^}]*font-size:\s*0\.8rem/s)
    expect(portraitStyles).toMatch(/\.history-date-column\s+\.hint\s*\{[^}]*font-size:\s*0\.75rem/s)
    expect(portraitStyles).toMatch(/\.thoughts\s*\{[^}]*font-size:\s*0\.875rem/s)
    expect(portraitStyles).toMatch(/\.tabs-title\s*\{[^}]*font-size:\s*1\.2rem/s)
  })

  it('uses plain timeline connectors without arrowheads', () => {
    const connectorStyles = historyPageSource.slice(historyPageSource.indexOf('.history-connector {'))

    expect(connectorStyles).toContain('border-left: 1px solid var(--color-primary-medium2)')
    expect(connectorStyles).not.toContain('&::after')
  })

  it('opens under About and removes the old Explore route', async () => {
    await mountHistory()
    expect(router.resolve('/zh-Hant/menu/about/history').matched).toHaveLength(2)
    expect(exploreRoutes.some(route => route.path === 'explore/history')).toBe(false)
  })

  it('renders all 55 records chronologically and keeps month-only precision', async () => {
    const entries = await mountHistory()
    expect(entries).toHaveLength(55)
    const dates = entries.map(entry => entry.querySelector('time').dateTime)
    expect(dates[0]).toBe('2025-05')
    expect(entries[0].querySelector('time').textContent).toBe('2025.5')
    expect(dates.at(-1)).toBe('2026-10-22')
    expect(dates).toEqual([...dates].sort())
    expect(host.querySelectorAll('.history-connector')).toHaveLength(50)
  })

  it('separates major versions at their first release and reserves the V5 title', async () => {
    await mountHistory()
    const stages = [...host.querySelectorAll('.history-stage')]
    expect(stages.map(stage => stage.querySelector('h2').textContent.trim())).toEqual([
      'V1 兴趣缘起与初步尝试',
      'V2 围绕音韵的核心查询功能',
      'V3 快速迭代的核心拓展功能',
      'V4 稳步推进的功能创新',
      'V5 完善原有功能，改进用户体验'
    ])
    expect(stages.map(stage => [...stage.querySelectorAll('time')].map(time => time.dateTime))).toEqual([
      historyEntries.slice(0, 14).map(entry => entry.dateTime),
      historyEntries.slice(14, 21).map(entry => entry.dateTime),
      historyEntries.slice(21, 32).map(entry => entry.dateTime),
      historyEntries.slice(32, 47).map(entry => entry.dateTime),
      historyEntries.slice(47).map(entry => entry.dateTime)
    ])
    for (const stage of stages) {
      expect(stage.querySelector('.history-entry:last-child .history-connector')).toBeNull()
    }
  })

  it('identifies core capabilities and milestones rather than publicity or small refinements', () => {
    const entryAt = date => historyEntries.find(entry => entry.date === date)
    for (const date of ['2025.7.25', '2025.9.5', '2026.1.16', '2026.1.27', '2026.2.11', '2026.3.1']) {
      expect(entryAt(date).important).toBe(true)
      expect(zhCnAbout.history.importanceReasons[date.replaceAll('.', '_')]).toBeTruthy()
    }
    for (const date of ['2025.5', '2025.8.2', '2025.8.27', '2025.9.2', '2025.9.19', '2026.2.8', '2026.2.17', '2026.3.24']) {
      expect(entryAt(date).important).toBe(false)
    }
  })

  it('marks important updates with accessible star emoji instead of text', async () => {
    await mountHistory()
    const importantStars = [...host.querySelectorAll('.history-date-column [role="img"]')]

    expect(importantStars).toHaveLength(historyEntries.filter(entry => entry.important).length)
    expect(importantStars.map(star => star.textContent.trim())).toEqual(Array(importantStars.length).fill('⭐'))
    expect(importantStars.every(star => star.getAttribute('aria-label') === '重要更新')).toBe(true)
    expect(host.querySelector('.history-date-column')?.textContent).not.toContain('重要更新')
  })

  it('filters important updates and restores all history without losing stages or links', async () => {
    await mountHistory()
    const historyToggle = host.querySelector('.history-filter [role="switch"]')
    const currentMode = () => host.querySelector('.history-filter .switch-toggle__label--right')?.textContent.trim()
    expect(historyToggle?.getAttribute('aria-checked')).toBe('false')
    expect(currentMode()).toBe('全部历史')
    historyToggle.click()
    await nextTick()
    const dates = () => [...host.querySelectorAll('.history-date')].map(time => time.textContent)
    expect(dates()).toEqual(historyEntries.filter(entry => entry.important).map(entry => entry.date))
    expect(dates().length).toBeLessThan(55)
    expect(historyToggle.getAttribute('aria-checked')).toBe('true')
    expect(currentMode()).toBe('仅重要更新')
    expect(host.querySelectorAll('.history-stage')).toHaveLength(5)
    expect(host.querySelector('#history-stage-5').textContent).toContain('V5 完善原有功能，改进用户体验')
    for (const stage of host.querySelectorAll('.history-stage')) {
      const entries = stage.querySelectorAll('.history-entry')
      expect(stage.querySelectorAll('.history-connector')).toHaveLength(Math.max(0, entries.length - 1))
    }
    expect(host.querySelector('a[href="/zh-Hant/explore/tools/praat"]')).not.toBeNull()
    historyToggle.click()
    await nextTick()
    expect(dates()).toEqual(historyEntries.map(entry => entry.date))
    expect(host.querySelectorAll('.history-connector')).toHaveLength(50)
    expect(historyToggle.getAttribute('aria-checked')).toBe('false')
    expect(currentMode()).toBe('全部历史')
  })

  it('uses the latest author versions and preserves the partial Vue migration wording', async () => {
    const entries = await mountHistory()
    const contentAt = date => entries.find(entry => entry.querySelector('time').dateTime === date).textContent
    expect(contentAt('2025-08-04')).toContain('开始部署在内网v1.0.0')
    expect(contentAt('2025-08-18')).toContain('分发exe供内测用户尝鲜。v1.0.5')
    expect(contentAt('2025-09-04')).toContain('引入vue作为查询、输入页面，但地图及结果展示仍由原生js承担。v1.2.0')
    expect(contentAt('2026-01-11')).toContain('结果页面迁移到Vue，查字、查调更为显著，不再作为辅助功能。v2.0.0')
    expect(contentAt('2026-01-16')).toContain('原生js移至旧版网站入口，主站全部使用Vue3开发。v2.1.0')
  })

  it('renders the four original Zhihu article URLs as safe clickable links', async () => {
    await mountHistory()
    const links = [...host.querySelectorAll('ol a[href^="https://zhuanlan.zhihu.com/"]')]
    expect(links.map(link => link.href)).toEqual([
      'https://zhuanlan.zhihu.com/p/1934345780199682731',
      'https://zhuanlan.zhihu.com/p/2001363637311381604',
      'https://zhuanlan.zhihu.com/p/2002848348378521848',
      'https://zhuanlan.zhihu.com/p/2003637219919946701'
    ])
    expect(links.map(link => link.textContent)).toEqual(Array(4).fill('知乎文章'))
    expect(host.textContent).not.toContain('zhuanlan.zhihu.com')
    for (const link of links) {
      expect(link.rel).toContain('noopener')
    }
    expect(host.textContent).toContain('「方音圖鑑」总算有logo了。v1.3.0')
  })

  it('distinguishes every version while preserving all original body text', async () => {
    await mountHistory()
    const originalBodies = historyEntries.map(entry => plainHistoryEntry(zhCnAbout.history.entries[entry.date.replaceAll('.', '_')]))
    expect([...host.querySelectorAll('.history-version')].map(el => el.textContent)).toEqual(originalBodies.flatMap(body => body.match(/v\d+\.\d+\.\d+/g) || []))
    expect(host.querySelectorAll('.history-version').length).toBeGreaterThan(0)
    expect([...host.querySelectorAll('.history-content')].map(el => el.textContent)).toEqual(originalBodies)
    expect(host.querySelectorAll('.history-link--external')).toHaveLength(5)
  })

  it.each(['zh-CN', 'zh-Hant', 'en'])('links features to current routes in %s', async locale => {
    await mountHistory(locale, {}, locale)
    const links = [...host.querySelectorAll('a.history-link--internal')]
    expect(links.length).toBeGreaterThan(15)
    const hrefFor = text => links.find(link => link.textContent === text)?.getAttribute('href')
    const labels = locale === 'en'
        ? ['character lookup', 'Jyutping-to-IPA conversion', 'phoneme classification', 'character set page']
      : locale === 'zh-Hant'
        ? ['查字', '粵拼轉ipa', '音素分類', '中古漢字樹狀圖']
        : ['查字', '粤拼转ipa', '音素分类', '中古汉字树状图']
    expect(hrefFor(labels[0])).toBe(`/${locale}/menu/query/char`)
    expect(hrefFor(labels[1])).toBe(`/${locale}/explore/tools/jyut2ipa`)
    expect(hrefFor(labels[2])).toBe(`/${locale}/menu/pho/custom`)
    expect(hrefFor(labels[3])).toBe(`/${locale}/explore/char-class?tab=zhonggu`)
    for (const link of links) {
      expect(router.resolve(link.getAttribute('href')).matched.length).toBeGreaterThan(1)
      expect(link.getAttribute('target')).toBeNull()
    }
    links.find(link => link.textContent === labels[0]).click()
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe(`/${locale}/menu/query/char`))
  })

  it('routes the requested feature names to their pages and opens the correct map states', async () => {
    await mountHistory()
    const links = [...host.querySelectorAll('a.history-link--internal')]
    const hrefFor = text => links.find(link => link.textContent === text)?.getAttribute('href')
    const locale = 'zh-Hant'

    expect(hrefFor('细分查询')).toBe(`/${locale}/menu/result`)
    expect(hrefFor('右侧面板')).toBe(`/${locale}/menu/map/view?openPanel=true`)
    expect(hrefFor('用户自定义数据添加')).toBeUndefined()
    expect(hrefFor('按行政区划、分区等逐一查看或选择地点')).toBe(`/${locale}/menu/query/zhonggu?openPartitionInfo=true`)
    expect(hrefFor('查字')).toBe(`/${locale}/menu/query/char`)
    expect(hrefFor('查中古')).toBe(`/${locale}/menu/query/zhonggu`)
    expect(hrefFor('查音位')).toBe(`/${locale}/menu/query/yinwei`)
    expect(hrefFor('查音系')).toBe(`/${locale}/menu/pho/matrix`)
    expect(router.resolve(hrefFor('右侧面板')).meta.queryAllowlist.variants.view).toContain('openPanel')
    expect(router.resolve(hrefFor('按行政区划、分区等逐一查看或选择地点')).meta.queryAllowlist).toContain('openPartitionInfo')
    expect(host.querySelector('time[datetime="2026-06-22"]')?.parentElement?.parentElement?.textContent)
      .toContain('查字、查中古、查音位、查音系等增加文白读显示')

    const oldSite = [...host.querySelectorAll('a.history-link--external')]
      .find(link => link.textContent === '旧版网站')
    expect(oldSite?.href).toBe('https://dialects.yzup.top/detail/')
    expect(oldSite?.target).toBe('_blank')

    links.find(link => link.textContent === '细分查询').click()
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe(`/${locale}/menu/result`))
    links.find(link => link.textContent === '右侧面板').click()
    await vi.waitFor(() => expect(router.currentRoute.value.query.openPanel).toBe('true'))
    links.find(link => link.textContent === '按行政区划、分区等逐一查看或选择地点').click()
    await vi.waitFor(() => expect(router.currentRoute.value.query.openPartitionInfo).toBe('true'))
  })

  it('turns footer history items into the existing footer actions', async () => {
    await mountHistory()
    const actionButtons = [...host.querySelectorAll('button.history-link--action')]
    const dispatchedActions = []
    const onFooterAction = event => dispatchedActions.push(event.detail?.action)
    window.addEventListener('app-footer-action', onFooterAction)

    expect(actionButtons.map(button => button.textContent.trim())).toEqual(['反馈建议', '功能入口', '分享'])
    actionButtons.forEach(button => button.click())
    expect(dispatchedActions).toEqual(['feedback', 'features', 'share'])
    expect(appFooterSource).toContain("window.addEventListener('app-footer-action'")
    expect(appFooterSource).toContain("case 'feedback':")
    expect(appFooterSource).toContain("case 'features':")
    expect(appFooterSource).toContain("case 'share':")

    window.removeEventListener('app-footer-action', onFooterAction)
  })

  it('opens the map panel and the read-only partition modal from their deep links', () => {
    expect(customDataPanelSource).toContain("route.query.openPanel === 'true'")
    expect(locationInputSource).toContain('route.query.openPartitionInfo')
    expect(locationInputSource).toContain('openPartitionInfoModal()')
    expect(locationInputSource).toContain('autoEnableSelection.value = false')
  })

  it('links the Tyson polygon, village data, and中古 comparison to their matching tools', async () => {
    await mountHistory()
    const links = [...host.querySelectorAll('a.history-link--internal')]
    const hrefFor = text => links.find(link => link.textContent === text)?.getAttribute('href')

    expect(hrefFor('泰森多边形')).toBe('/zh-Hant/explore/gis')
    expect(hrefFor('自然村')).toBe('/zh-Hant/explore/villages/gd')
    expect(hrefFor('比较中古')).toBe('/zh-Hant/menu/compare/zhonggu')
  })
})
