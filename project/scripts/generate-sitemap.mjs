import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { SITEMAP_PATHS } from '../src/seo/config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const siteOrigin = 'https://dialects.yzup.top'
const outputPath = path.resolve(__dirname, '../public/sitemap.xml')

function buildUrl(pathname) {
  return pathname === '/' ? `${siteOrigin}/` : `${siteOrigin}${pathname}`
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${SITEMAP_PATHS.map((pathname) => `  <url>\n    <loc>${buildUrl(pathname)}</loc>\n  </url>`).join('\n')}
</urlset>
`

fs.writeFileSync(outputPath, xml, 'utf8')
console.log(`Sitemap written to ${outputPath}`)
