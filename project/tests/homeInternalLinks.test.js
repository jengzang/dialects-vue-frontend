import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(path) {
  return readFileSync(resolve(projectRoot, path), 'utf8')
}

describe('home and intro internal links', () => {
  it('uses RouterLink for homepage internal navigation entries', () => {
    const homePage = readSource('src/main/views/HomePage.vue')
    const featuresSection = readSource('src/main/components/FeaturesSection.vue')

    expect(homePage).toContain('<RouterLink')
    expect(homePage).toContain(':to="localeTo(\'/menu/query/zhonggu\')"')
    expect(homePage).toContain(':to="localeTo(item.route)"')
    expect(homePage).toContain(':to="localeTo(\'/menu/about/intro\')"')
    expect(homePage).not.toContain('@click="navigateTo(item.route)"')
    expect(featuresSection).toContain('<RouterLink')
    expect(featuresSection).toContain(':to="localeTo(item.route)"')
    expect(featuresSection).toContain('@click="recordRecent(item.route)"')
  })

  it('links intro feature headings, subtitles, and subfeature titles to their pages', () => {
    const aboutPage = readSource('src/main/views/menu/support/AboutPage.vue')

    expect(aboutPage).toContain('const featureRouteMap = {')
    expect(aboutPage).toContain("feature10: '/menu/cluster'")
    expect(aboutPage).toContain('const featureKeys = Object.keys(messages.about.intro.features)')
    expect(aboutPage).toContain('<RouterLink v-if="feature.route" :to="localeTo(feature.route)" class="feature-link feature-heading-link">')
    expect(aboutPage).toContain('<RouterLink v-if="feature.route" :to="localeTo(feature.route)" class="feature-link feature-subtitle-link">')
    expect(aboutPage).toContain('<RouterLink v-if="item.route" :to="localeTo(item.route)" class="feature-link subfeature-title-link">')
  })
})
