import { describe, expect, it } from 'vitest'

const LAYOUT_FOOTER_PATHS = [
  '/menu',
  '/menu/about/intro',
  '/menu/about/suggestion',
  '/menu/about/like',
  '/menu/query/char',
  '/menu/query/zhonggu',
  '/menu/query/yinwei',
  '/menu/query/tone',
  '/menu/compare/char',
  '/menu/compare/zhonggu',
  '/menu/compare/tone',
  '/menu/compare/phonetic',
  '/menu/map/view',
  '/menu/map/divide',
  '/menu/map/custom',
  '/menu/result',
  '/menu/pho/matrix',
  '/menu/pho/custom',
  '/menu/pho/count',
  '/menu/pho/evolution',
  '/menu/settings',
  '/menu/source',
  '/menu/privacy',
  '/menu/tools',
  '/menu/vocabulary/view',
  '/menu/vocabulary/import',
  '/menu/vocabulary/manage',
  '/menu/yubao',
  '/menu/villages',
  '/menu/cluster',
  '/explore',
  '/explore/tools/check',
  '/explore/tools/jyut2ipa',
  '/explore/tools/merge',
  '/explore/tools/derive',
  '/explore/tools/praat',
  '/explore/gis',
  '/explore/manage',
  '/explore/char-class',
  '/explore/yc/overview',
  '/explore/yc/words',
  '/explore/yc/expressions',
  '/explore/yc/villages',
  '/explore/villages/toponyms',
  '/explore/villages/gd',
  '/explore/villages/table',
  '/explore/villages/ml',
  '/explore/villages/all',
  '/villagesML',
  '/auth',
  '/auth/data',
  '/auth/regions',
]

describe('layout footer context', () => {
  it('resolves route-specific copy for known menu routes', async () => {
    const { resolveLayoutFooterContext } = await import('../src/main/config/layoutFooter.js')

    const context = resolveLayoutFooterContext({
      route: { path: '/menu/query/zhonggu', fullPath: '/menu/query/zhonggu', query: {} },
      t: (key) => key,
      locale: 'zh-CN',
      colorTheme: 'green',
    })

    expect(context.pageTitleKey).toBe('layoutFooter.pages.menuQueryZhonggu.title')
    expect(context.pageDescriptionKey).toBe('layoutFooter.pages.menuQueryZhonggu.description')
    expect(context.hasTutorial).toBe(true)
    expect(context.languageLabelKey).toBe('layoutFooter.language.zhCN')
    expect(context.themeLabelKey).toBe('layoutFooter.theme.green')
  })

  it('resolves current-page copy for routes without a tutorial entry', async () => {
    const { resolveLayoutFooterContext } = await import('../src/main/config/layoutFooter.js')

    const context = resolveLayoutFooterContext({
      route: { path: '/menu/settings', fullPath: '/menu/settings', query: {} },
      t: (key) => key,
      locale: 'zh-Hant',
      colorTheme: 'blue',
    })

    expect(context.pageTitleKey).toBe('layoutFooter.pages.menuSettings.title')
    expect(context.pageDescriptionKey).toBe('layoutFooter.pages.menuSettings.description')
    expect(context.hasTutorial).toBe(false)
    expect(context.languageLabelKey).toBe('layoutFooter.language.zhHant')
    expect(context.themeLabelKey).toBe('layoutFooter.theme.blue')
  })

  it('keeps a current-function copy entry for every shared layout route', async () => {
    const { resolveLayoutFooterContext } = await import('../src/main/config/layoutFooter.js')

    LAYOUT_FOOTER_PATHS.forEach((path) => {
      const context = resolveLayoutFooterContext({
        route: { path, fullPath: path, query: {} },
        locale: 'zh-CN',
        colorTheme: 'blue',
      })

      expect(context.pageTitleKey, path).not.toBe('layoutFooter.pages.generic.title')
      expect(context.pageDescriptionKey, path).not.toBe('layoutFooter.pages.generic.description')
    })
  })

  it('keeps the official ICP filing text unchanged across locales', async () => {
    const [zhCN, zhHant, en] = await Promise.all([
      import('../src/i18n/locales/zh-CN/layoutFooter.json'),
      import('../src/i18n/locales/zh-Hant/layoutFooter.json'),
      import('../src/i18n/locales/en/layoutFooter.json'),
    ])

    expect(zhCN.default.legal.icp).toBe('粤ICP备2025466875号')
    expect(zhHant.default.legal.icp).toBe('粤ICP备2025466875号')
    expect(en.default.legal.icp).toBe('粤ICP备2025466875号')
  })
})
