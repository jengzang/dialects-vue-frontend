import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { SITEMAP_PATHS } from '../src/seo/config.js'
import { SUPPORTED_LOCALES, buildLocalePath } from '../src/i18n/localeRouting.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const siteOrigin = 'https://dialects.yzup.top'
const outputPath = path.resolve(__dirname, '../public/sitemap.xml')
const today = new Date().toISOString().slice(0, 10)

function getMeta(pathname) {
  if (pathname === '/') {
    return { priority: '1.0', changefreq: 'daily' }
  }
  if (pathname.startsWith('/menu/query/')) {
    return { priority: '0.9', changefreq: 'daily' }
  }
  if (pathname.startsWith('/menu/map/')) {
    return { priority: '0.7', changefreq: 'weekly' }
  }
  if (pathname.startsWith('/menu/compare/') || pathname.startsWith('/menu/pho/') || pathname === '/menu/result' || pathname === '/menu/cluster') {
    return { priority: '0.8', changefreq: 'weekly' }
  }
  if (pathname === '/explore/tools/praat') {
    return { priority: '0.8', changefreq: 'weekly' }
  }
  if (pathname.startsWith('/explore/tools/')) {
    return { priority: '0.6', changefreq: 'monthly' }
  }
  if (pathname.startsWith('/explore/')) {
    return { priority: '0.5', changefreq: 'monthly' }
  }
  if (pathname === '/menu/tools' || pathname === '/menu/words' || pathname === '/menu/villages') {
    return { priority: '0.2', changefreq: 'yearly' }
  }
  return { priority: '0.4', changefreq: 'monthly' }
}

function buildUrl(pathname, locale) {
  const localizedPath = buildLocalePath(locale, pathname)
  return `${siteOrigin}${localizedPath}/`
}

const localizedPaths = SITEMAP_PATHS.flatMap((pathname) => SUPPORTED_LOCALES.map((locale) => ({ pathname, locale })))

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${localizedPaths.map(({ pathname, locale }) => {
  const meta = getMeta(pathname)
  return `  <url>\n    <loc>${buildUrl(pathname, locale)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${meta.changefreq}</changefreq>\n    <priority>${meta.priority}</priority>\n  </url>`
}).join('\n')}
</urlset>
`

fs.writeFileSync(outputPath, xml, 'utf8')
console.log(`Sitemap written to ${outputPath}`)
