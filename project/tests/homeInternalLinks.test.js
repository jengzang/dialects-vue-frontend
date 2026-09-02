import { existsSync, readFileSync } from 'node:fs'
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
    const homeFeaturedToolsPath = resolve(projectRoot, 'src/main/components/HomeFeaturedTools.vue')
    const featuresSection = readSource('src/main/components/FeaturesSection.vue')

    expect(existsSync(homeFeaturedToolsPath)).toBe(true)
    const homeFeaturedTools = readSource('src/main/components/HomeFeaturedTools.vue')

    expect(homePage).toContain('<RouterLink')
    expect(homePage).toContain(':to="localeTo(\'/menu/query/zhonggu\')"')
    expect(homePage).toContain('<HomeFeaturedTools')
    expect(homePage).not.toContain('class="featured-section glass-panel"')
    expect(homeFeaturedTools).toContain('<RouterLink')
    expect(homeFeaturedTools).toContain(':to="localeTo(item.route)"')
    expect(homeFeaturedTools).toContain("route: '/menu/query/zhonggu'")
    expect(homeFeaturedTools).toContain("emit('view-all')")
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

  it('uses RouterLink for public portal cards and static cross-page links', () => {
    const toolsPage = readSource('src/main/views/menu/portals/ToolsPage.vue')
    const villagesPage = readSource('src/main/views/menu/portals/VillagesPage.vue')
    const heroShowcase = readSource('src/main/components/HeroShowcase.vue')
    const sourcePage = readSource('src/main/views/menu/support/SourcePage.vue')
    const gdVillagesTable = readSource('src/main/views/explore/villages/gdVillagesTable.vue')
    const gdVillagesTree = readSource('src/main/views/explore/villages/gdVillagesTree.vue')
    const yangChunSpoken = readSource('src/main/views/explore/word/YangChunSpoken.vue')
    const yangChunVillages = readSource('src/main/views/explore/villages/YangChunVillages.vue')

    expect(toolsPage).toContain('<RouterLink class="portal-entry-card glass-card" data-interactive="true" :to="localeTo(\'/explore/tools/check\')">')
    expect(toolsPage).toContain(':to="localeTo(\'/explore/tools/jyut2ipa\')"')
    expect(toolsPage).toContain(':to="localeTo(\'/explore/tools/merge\')"')
    expect(toolsPage).toContain(':to="localeTo(\'/explore/tools/praat\')"')
    expect(toolsPage).toContain(':to="localeTo(\'/explore/gis\')"')
    expect(toolsPage).not.toContain('const handleDataCheck')

    expect(villagesPage).toContain('<RouterLink class="portal-entry-card glass-card" data-interactive="true" :to="localeTo(\'/explore/villages/toponyms\')">')
    expect(villagesPage).toContain(':to="localeTo(\'/explore/villages/table\')"')
    expect(villagesPage).toContain(':to="localeTo(\'/explore/villages/gd\')"')
    expect(villagesPage).toContain(':to="localeTo(\'/explore/villages/yc\')"')
    expect(villagesPage).toContain(':to="localeTo(\'/explore/villages/ml\')"')
    expect(villagesPage).toContain('@click="handleAllVillages"')

    expect(heroShowcase).toContain('<RouterLink class="showcase-card-cta" :to="localeTo(item.route)" @click.stop>')
    expect(heroShowcase).toContain('<RouterLink class="showcase-preview-cta" :to="localeTo(activeItem.route)" @click.stop>')
    expect(sourcePage).toContain('<RouterLink class="privacy-link" :to="localeTo(\'/menu/privacy\')">')

    expect(gdVillagesTable).toContain('<RouterLink class="cross-link" :to="localeTo(\'/explore/villages/gd\')">')
    expect(gdVillagesTree).toContain('<RouterLink class="cross-link" :to="localeTo(\'/explore/villages/table\')">')
    expect(yangChunSpoken).toContain('<RouterLink class="cross-link" :to="localeTo(\'/explore/villages/yc\')">')
    expect(yangChunVillages).toContain('<RouterLink class="cross-link" :to="localeTo(\'/explore/yc/words\')">')
  })
})
