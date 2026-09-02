import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import SEO_CONFIG, { NOINDEX_PATHS, SITEMAP_PATHS } from '../src/seo/config.js'
import { SUPPORTED_LOCALES, buildLocalePath } from '../src/i18n/localeRouting.js'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

describe('SEO config consistency', () => {
  it('keeps redirect and low-value routes out of the sitemap', () => {
    expect(SITEMAP_PATHS).not.toEqual(expect.arrayContaining([
      '/menu/words',
      '/menu/vocabulary',
      '/explore/villages/yc',
      '/menu/result',
      '/explore/manage',
    ]))
  })

  it('gives public canonical content routes explicit SEO entries before sitemap inclusion', () => {
    for (const pathname of [
      '/explore/yc/overview',
      '/explore/yc/expressions',
    ]) {
      expect(SEO_CONFIG.routes[pathname]?.title, `${pathname} title`).toBeTruthy()
      expect(SEO_CONFIG.routes[pathname]?.description, `${pathname} description`).toBeTruthy()
      expect(SITEMAP_PATHS, `${pathname} sitemap`).toContain(pathname)
      expect(NOINDEX_PATHS.has(pathname), `${pathname} should be indexable`).toBe(false)
    }
  })

  it('makes internal or low-value entry policy explicit with noindex and no sitemap listing', () => {
    for (const pathname of [
      '/menu/result',
      '/explore/manage',
      '/explore/villages/all',
      '/explore/features',
      '/explore/history',
    ]) {
      expect(SEO_CONFIG.routes[pathname]?.title, `${pathname} title`).toBeTruthy()
      expect(SEO_CONFIG.routes[pathname]?.description, `${pathname} description`).toBeTruthy()
      expect(NOINDEX_PATHS.has(pathname), `${pathname} noindex`).toBe(true)
      expect(SITEMAP_PATHS, `${pathname} sitemap`).not.toContain(pathname)
    }
  })

  it('lists only configured indexable canonical routes in the sitemap', () => {
    for (const pathname of SITEMAP_PATHS) {
      expect(SEO_CONFIG.routes[pathname], `${pathname} has SEO_CONFIG`).toBeTruthy()
      expect(SEO_CONFIG.routes[pathname]?.redirect, `${pathname} is not redirect-only SEO`).toBeUndefined()
      expect(NOINDEX_PATHS.has(pathname), `${pathname} noindex`).toBe(false)
    }
  })

  it('uses the same no-trailing-slash URL shape for runtime canonical and generated sitemap loc values', () => {
    const sitemapScript = readSource('scripts/generate-sitemap.mjs')

    expect(sitemapScript).toContain('return `${siteOrigin}${localizedPath}`')
    expect(sitemapScript).not.toContain('return `${siteOrigin}${localizedPath}/`')

    for (const pathname of SITEMAP_PATHS) {
      for (const locale of SUPPORTED_LOCALES) {
        const sitemapUrl = `https://dialects.yzup.top${buildLocalePath(locale, pathname)}`

        expect(sitemapUrl, `${locale} ${pathname}`).not.toMatch(/\/$/)
      }
    }
  })
})
