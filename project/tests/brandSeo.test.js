import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { updateSeo } from '../src/seo/index.js'

const root = resolve(import.meta.dirname, '..')

describe('public brand metadata', () => {
  it('publishes one stable organization and existing favicon in the HTML entries', () => {
    for (const entry of ['index.html', 'menu/index.html', 'explore/index.html', 'auth/index.html', 'villagesML/index.html']) {
      const html = readFileSync(resolve(root, entry), 'utf8')
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const icon = doc.querySelector('link[rel="icon"]')
      expect(existsSync(resolve(root, 'public', icon.getAttribute('href').slice(1)))).toBe(true)
      if (entry !== 'index.html') continue
      const organizations = [...doc.querySelectorAll('script[type="application/ld+json"]')]
        .map(script => JSON.parse(script.textContent)).filter(data => data['@type'] === 'Organization')
      expect(organizations).toEqual([{ '@context': 'https://schema.org', '@type': 'Organization', name: '方音圖鑑', url: 'https://dialects.yzup.top/', logo: 'https://dialects.yzup.top/brand/theme-previews/favicon-blue.png' }])
      expect(doc.querySelector('meta[property="og:image"]').content).toBe('https://dialects.yzup.top/brand/title.webp')
      expect(doc.querySelector('meta[name="twitter:image"]').content).toBe('https://dialects.yzup.top/brand/title.webp')
    }
  })

  it('keeps social image URLs stable when routes change', () => {
    document.head.innerHTML = ''
    for (const path of ['/zh-Hant', '/en/menu/query/char']) {
      updateSeo({ path, locale: path.startsWith('/en') ? 'en' : 'zh-Hant' })
      expect(document.querySelector('meta[property="og:image"]').content).toBe('https://dialects.yzup.top/brand/title.webp')
      expect(document.querySelector('meta[name="twitter:image"]').content).toBe('https://dialects.yzup.top/brand/title.webp')
    }
  })
})
