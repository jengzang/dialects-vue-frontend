import { beforeEach, describe, expect, it } from 'vitest'
import SEO_CONFIG from '../src/seo/config.js'
import { updateSeo } from '../src/seo/index.js'

describe('SEO titles', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
  })

  it.each([
    ['zh-CN', '查中古 - 按韵书地位分别整理声韵调的读音｜方音图鉴'],
    ['zh-Hant', '查中古 - 按韻書地位分別整理聲韻調的讀音｜方音圖鑑'],
    ['en', 'Middle Chinese Query - Explore modern dialect readings by rhyme-book category | Dialects Atlas'],
  ])('composes the localized main title, subtitle, and site suffix for %s', (locale, expected) => {
    updateSeo({ path: `/${locale}/menu/query/zhonggu`, locale })

    expect(document.title).toBe(expected)
    expect(document.querySelector('meta[property="og:title"]').content).toBe(expected)
    expect(document.querySelector('meta[name="twitter:title"]').content).toBe(expected)
  })

  it('omits the subtitle separator when a subtitle is empty', () => {
    const title = SEO_CONFIG.routes['/menu/query/char'].title
    const previous = title.en
    try {
      title.en = { main: 'Character Lookup', subtitle: '' }
      updateSeo({ path: '/en/menu/query/char', locale: 'en' })
      expect(document.title).toBe('Character Lookup | Dialects Atlas')
    } finally {
      title.en = previous
    }
  })

  it('keeps the authored home and unknown-route fallback titles unchanged', () => {
    for (const locale of ['zh-CN', 'zh-Hant', 'en']) {
      updateSeo({ path: `/${locale}`, locale })
      expect(document.title).toBe(SEO_CONFIG.routes['/'].title[locale])
      updateSeo({ path: `/${locale}/unknown-page`, locale })
      expect(document.title).toBe(SEO_CONFIG.defaultTitle[locale])
    }
  })

  it('falls back to the default language when localized title copy is missing', () => {
    const route = SEO_CONFIG.routes['/menu/query/char']
    const previous = route.title
    try {
      route.title = { 'zh-Hant': { main: '查字', subtitle: '查詢方言讀音' } }
      updateSeo({ path: '/en/menu/query/char', locale: 'en' })
      expect(document.title).toBe('查字 - 查詢方言讀音 | Dialects Atlas')
    } finally {
      route.title = previous
    }
  })

  it('takes the suffix from the configured localized site name', () => {
    const previous = SEO_CONFIG.siteNameLocales['zh-CN']
    try {
      SEO_CONFIG.siteNameLocales['zh-CN'] = '测试网站'
      updateSeo({ path: '/zh-CN/menu/query/zhonggu', locale: 'zh-CN' })
      expect(document.title).toBe('查中古 - 按韵书地位分别整理声韵调的读音｜测试网站')
    } finally {
      SEO_CONFIG.siteNameLocales['zh-CN'] = previous
    }
  })

  it('renders all configured page titles in every supported language', () => {
    for (const [path, route] of Object.entries(SEO_CONFIG.routes)) {
      if (path === '/' || route.redirect) continue
      for (const locale of ['zh-CN', 'zh-Hant', 'en']) {
        expect(route.title[locale].main, `${path} ${locale} main`).toBeTruthy()
        expect(typeof route.title[locale].subtitle).toBe('string')
        updateSeo({ path: `/${locale}${path}`, locale })
        expect(document.title).toContain(route.title[locale].main)
        expect(document.title).toContain(SEO_CONFIG.siteNameLocales[locale])
        expect(document.title).not.toMatch(/undefined|\[object Object\]/)
      }
    }
  })
})
