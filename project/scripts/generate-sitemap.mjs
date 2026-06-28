import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { SITEMAP_PATHS } from '../src/seo/config.js'
import { SUPPORTED_LOCALES, buildLocalePath } from '../src/i18n/localeRouting.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const siteOrigin = 'https://dialects.yzup.top'
const outputPath = path.resolve(__dirname, '../public/sitemap.xml')

function buildUrl(pathname, locale) {
  const localizedPath = buildLocalePath(locale, pathname)
  return `${siteOrigin}${localizedPath}/`
}

const localizedPaths = SITEMAP_PATHS.flatMap((pathname) => SUPPORTED_LOCALES.map((locale) => ({ pathname, locale })))

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${localizedPaths.map(({ pathname, locale }) => `  <url>\n    <loc>${buildUrl(pathname, locale)}</loc>\n  </url>`).join('\n')}
</urlset>
`

fs.writeFileSync(outputPath, xml, 'utf8')
console.log(`Sitemap written to ${outputPath}`)
