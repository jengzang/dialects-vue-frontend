import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

function readJson(relativePath) {
  return JSON.parse(readSource(relativePath))
}

function stripHtmlComments(source) {
  return source.replace(/<!--[\s\S]*?-->/g, '')
}

describe('SEO heading semantics', () => {
  it('uses h1 for existing page-level titles that are exposed as routable pages', () => {
    const pageTitleHeadings = [
      {
        file: 'src/main/components/user/UserDataPage.vue',
        heading: '<h1>',
      },
      {
        file: 'src/main/views/menu/support/SettingsPage.vue',
        heading: '<h1 class="page-title">',
      },
      {
        file: 'src/main/views/menu/ResultPage.vue',
        heading: '<h1 class="tabs-title">',
      },
      {
        file: 'src/main/views/menu/support/SourcePage.vue',
        heading: '<h1 class="tabs-title" style="font-size: 1.5rem;">',
      },
      {
        file: 'src/main/views/menu/portals/ToolsPage.vue',
        heading: '<h1 class="page-title">',
      },
      {
        file: 'src/main/views/menu/portals/VillagesPage.vue',
        heading: '<h1 class="page-title">',
      },
      {
        file: 'src/main/views/explore/tools/CheckTool.vue',
        heading: '<h1 class="title">',
      },
      {
        file: 'src/main/views/explore/tools/Jyut2IpaTool.vue',
        heading: '<h1 class="title">',
      },
      {
        file: 'src/main/views/explore/tools/MergeTool.vue',
        heading: '<h1 class="title">',
      },
      {
        file: 'src/main/views/explore/GisPage.vue',
        heading: '<h1 class="draw-tab-title">',
      },
      {
        file: 'src/main/views/explore/charClass/CharacterClassification.vue',
        heading: '<h1 class="page-title">',
      },
      {
        file: 'src/main/views/explore/villages/gdVillagesTree.vue',
        heading: '<h1 style="margin: 0;font-size: 1.5em;">',
      },
      {
        file: 'src/main/views/explore/villages/gdVillagesTable.vue',
        heading: '<h1 style="margin: 0;font-size: 1.5em;">',
      },
      {
        file: 'src/main/views/explore/villages/YangChunVillages.vue',
        heading: '<h1 style="margin: 0;font-size: 1.5em;">',
      },
      {
        file: 'src/main/views/explore/villages/AllVillages.vue',
        heading: '<h1 style="margin: 0;font-size: 1.5em;">',
      },
      {
        file: 'src/main/views/explore/word/YangChunSpoken.vue',
        heading: '<h1>',
      },
    ]

    for (const { file, heading } of pageTitleHeadings) {
      expect(stripHtmlComments(readSource(file)), file).toContain(heading)
    }
  })

  it('renders page titles with BarIcon instead of inline-only emoji icons', () => {
    const pageTitleFiles = [
      'src/main/components/user/UserDataPage.vue',
      'src/main/views/menu/support/PrivacyPage.vue',
      'src/main/views/menu/support/SettingsPage.vue',
      'src/main/views/menu/ResultPage.vue',
      'src/main/views/menu/support/SourcePage.vue',
      'src/main/views/menu/portals/ToolsPage.vue',
      'src/main/views/menu/portals/VillagesPage.vue',
      'src/main/views/menu/DialectClustering.vue',
      'src/main/views/explore/tools/CheckTool.vue',
      'src/main/views/explore/tools/Jyut2IpaTool.vue',
      'src/main/views/explore/tools/MergeTool.vue',
      'src/main/views/explore/GisPage.vue',
      'src/main/views/explore/charClass/CharacterClassification.vue',
      'src/main/views/explore/villages/gdVillagesTree.vue',
      'src/main/views/explore/villages/gdVillagesTable.vue',
      'src/main/views/explore/villages/YangChunVillages.vue',
      'src/main/views/explore/villages/AllVillages.vue',
      'src/main/views/explore/word/YangChunSpoken.vue',
      'src/main/views/explore/tools/TableManage.vue',
      'src/main/components/user/UserRegionPage.vue',
      'src/main/views/explore/Praat.vue',
      'src/main/views/explore/villages/toponyms/ToponymsPage.vue',
      'src/VillagesML/dashboard/Dashboard.vue',
      'src/VillagesML/workspace/modules/spatial/SpatialIntegration.vue',
      'src/VillagesML/workspace/modules/village/VillageDeepDive.vue',
      'src/main/views/explore/yangchun/YangChunOverviewPage.vue',
      'src/main/views/explore/yangchun/YangChunExpressionsPage.vue',
    ]

    for (const file of pageTitleFiles) {
      const source = readSource(file)

      expect(source, `${file} imports BarIcon`).toContain("import BarIcon from '@/components/common/BarIcon.vue'")
      expect(source, `${file} uses BarIcon in page headings`).toMatch(/<h1[\s\S]*?<BarIcon[\s\S]*?<\/h1>/)
    }
  })

  it('provides a header slot for tabbed pages to render their h1 above tabs', () => {
    const tabsContainer = readSource('src/components/common/TabsContainer.vue')
    const tabbedMenuPages = [
      'src/main/views/menu/PhoPage.vue',
      'src/main/views/menu/QueryPage.vue',
      'src/main/views/menu/ComparePage.vue',
      'src/main/views/menu/MapPage.vue',
    ]

    expect(tabsContainer).toContain('<slot name="header"></slot>')

    for (const file of tabbedMenuPages) {
      const source = readSource(file)

      expect(source, `${file} renders a TabsContainer header`).toContain('<template #header>')
      expect(source, `${file} renders a page h1 with BarIcon`).toMatch(/<h1 class="page-title">[\s\S]*?<BarIcon[\s\S]*?<\/h1>/)
    }
  })

  it('uses h1 with BarIcon for VillagesML workspace page titles', () => {
    const villagesMLTitleFiles = [
      'src/VillagesML/workspace/VillagesMLWorkspace.vue',
      'src/VillagesML/workspace/modules/spatial/SpatialHotspotsTab.vue',
      'src/VillagesML/workspace/modules/spatial/SpatialVisualizationTab.vue',
      'src/VillagesML/workspace/modules/spatial/SpatialClustersTab.vue',
      'src/VillagesML/workspace/modules/spatial/SpatialIntegration.vue',
      'src/VillagesML/workspace/modules/pattern/NgramStats.vue',
      'src/VillagesML/workspace/modules/pattern/PatternTendency.vue',
      'src/VillagesML/workspace/modules/pattern/PatternFrequency.vue',
      'src/VillagesML/workspace/modules/pattern/PatternStructural.vue',
      'src/VillagesML/workspace/modules/pattern/NgramExplore.vue',
      'src/VillagesML/workspace/modules/regional/RegionSimilarity.vue',
      'src/VillagesML/workspace/modules/regional/RegionalAggregates.vue',
      'src/VillagesML/workspace/modules/regional/FeatureAggregation.vue',
      'src/VillagesML/workspace/modules/regional/RegionalVectors.vue',
      'src/VillagesML/workspace/modules/regional/CategoryTendency.vue',
      'src/VillagesML/workspace/modules/system/SystemInfo.vue',
      'src/VillagesML/workspace/modules/search/SearchPanel.vue',
      'src/VillagesML/workspace/modules/semantic/SemanticCategories.vue',
      'src/VillagesML/workspace/modules/semantic/SemanticComposition.vue',
      'src/VillagesML/workspace/modules/semantic/SemanticNgrams.vue',
      'src/VillagesML/workspace/modules/semantic/SemanticSubcategories.vue',
      'src/VillagesML/workspace/modules/semantic/SemanticIndices.vue',
      'src/VillagesML/workspace/modules/character/CharacterNetwork.vue',
      'src/VillagesML/workspace/modules/character/CharacterEmbeddings.vue',
      'src/VillagesML/workspace/modules/character/CharacterSignificance.vue',
      'src/VillagesML/workspace/modules/village/VillageDeepDive.vue',
      'src/VillagesML/workspace/modules/ml/SubsetAnalysis.vue',
      'src/VillagesML/workspace/modules/ml/FeatureExtraction.vue',
      'src/VillagesML/workspace/modules/ml/clustering/CharacterTendencyPanel.vue',
      'src/VillagesML/workspace/modules/ml/clustering/SpatialAwarePanel.vue',
      'src/VillagesML/workspace/modules/ml/clustering/HierarchicalPanel.vue',
      'src/VillagesML/workspace/modules/ml/clustering/SampledVillagesPanel.vue',
    ]

    for (const file of villagesMLTitleFiles) {
      const source = stripHtmlComments(readSource(file))

      expect(source, `${file} imports BarIcon`).toContain("import BarIcon from '@/components/common/BarIcon.vue'")
      expect(source, `${file} has no active VillagesML h3 page title`).not.toContain('<h3 class="villagesml-subtab-title"')
      expect(source, `${file} renders a VillagesML h1 page title with BarIcon`).toMatch(/<h1\b[\s\S]*?<BarIcon[\s\S]*?<\/h1>/)
      const h2Snippets = source.match(/<h2\b[\s\S]*?<\/h2>/g) || []
      for (const snippet of h2Snippets) {
        expect(snippet, `${file} h2 title icon uses BarIcon`).not.toContain('<InlineIcon')
      }
    }
  })

  it('uses dedicated page title i18n tokens for h1 page headings', () => {
    const tokenPaths = [
      ['user', 'data'],
      ['user', 'region'],
      ['support', 'privacy'],
      ['support', 'settings'],
      ['support', 'source'],
      ['support', 'aboutIntro'],
      ['support', 'aboutSuggestion'],
      ['support', 'aboutLike'],
      ['portals', 'tools'],
      ['portals', 'villages'],
      ['result', 'pleaseQuery'],
      ['result', 'tab1'],
      ['result', 'tab2'],
      ['result', 'tab3'],
      ['result', 'tab4'],
      ['cluster', 'workspace'],
      ['query', 'tab1'],
      ['query', 'tab2'],
      ['query', 'tab3'],
      ['query', 'tab4'],
      ['compare', 'tab1'],
      ['compare', 'tab2'],
      ['compare', 'tab4'],
      ['compare', 'tab5'],
      ['map', 'view'],
      ['map', 'divide'],
      ['map', 'custom'],
      ['pho', 'matrix'],
      ['pho', 'custom'],
      ['pho', 'count'],
      ['pho', 'evolution'],
      ['vocabulary', 'view'],
      ['vocabulary', 'import'],
      ['vocabulary', 'manage'],
      ['yubao', 'vocabulary'],
      ['yubao', 'grammar'],
      ['words', 'yangChunSpoken'],
      ['praat', 'main'],
      ['gis', 'main'],
      ['tools', 'check'],
      ['tools', 'jyut2ipa'],
      ['tools', 'merge'],
      ['tools', 'tableManage'],
      ['tools', 'tableManageAccessDenied'],
      ['villages', 'dashboard'],
      ['villages', 'gdTree'],
      ['villages', 'gdTable'],
      ['villages', 'yangChun'],
      ['villages', 'all'],
      ['villages', 'toponyms'],
      ['charClass', 'zhonggu'],
      ['charClass', 'shanggu'],
      ['charClass', 'jingu'],
      ['charClass', 'yueyun'],
      ['yangchun', 'overview'],
      ['yangchun', 'expressions'],
    ]

    for (const localeFile of [
      'src/i18n/locales/zh-Hant/navigation.json',
      'src/i18n/locales/zh-CN/navigation.json',
      'src/i18n/locales/en/navigation.json',
    ]) {
      const navigation = readJson(localeFile)

      for (const [group, key] of tokenPaths) {
        expect(navigation.pageTitles?.[group]?.[key], `${localeFile} pageTitles.${group}.${key}`).toEqual(expect.any(String))
      }
    }

    for (const file of [
      'src/main/views/menu/PhoPage.vue',
      'src/main/views/menu/QueryPage.vue',
      'src/main/views/menu/ComparePage.vue',
      'src/main/views/menu/MapPage.vue',
      'src/main/views/menu/VocabularyPage.vue',
      'src/main/views/explore/word/YuBaoPage.vue',
      'src/main/components/user/UserDataPage.vue',
      'src/main/components/user/UserRegionPage.vue',
      'src/main/views/menu/support/PrivacyPage.vue',
      'src/main/views/menu/support/SettingsPage.vue',
      'src/main/views/menu/support/SourcePage.vue',
      'src/main/views/menu/support/AboutPage.vue',
      'src/main/views/menu/portals/ToolsPage.vue',
      'src/main/views/menu/portals/VillagesPage.vue',
      'src/main/views/menu/ResultPage.vue',
      'src/main/views/menu/DialectClustering.vue',
      'src/main/views/explore/villages/gdVillagesTree.vue',
      'src/main/views/explore/villages/gdVillagesTable.vue',
      'src/main/views/explore/villages/YangChunVillages.vue',
      'src/main/views/explore/villages/AllVillages.vue',
      'src/main/views/explore/villages/toponyms/ToponymsPage.vue',
      'src/main/views/explore/word/YangChunSpoken.vue',
      'src/main/views/explore/Praat.vue',
      'src/main/views/explore/GisPage.vue',
      'src/main/views/explore/tools/CheckTool.vue',
      'src/main/views/explore/tools/Jyut2IpaTool.vue',
      'src/main/views/explore/tools/MergeTool.vue',
      'src/main/views/explore/tools/TableManage.vue',
      'src/main/config/chars_positions/charClassPageConfigs.js',
      'src/VillagesML/dashboard/Dashboard.vue',
      'src/main/views/explore/yangchun/YangChunOverviewPage.vue',
      'src/main/views/explore/yangchun/YangChunExpressionsPage.vue',
    ]) {
      expect(readSource(file), file).toContain('navigation.pageTitles')
    }

    const charClassSource = readSource('src/main/views/explore/charClass/CharacterClassification.vue')
    expect(charClassSource).toContain('{{ t(currentPageConfig.titleKey) }}')

    for (const file of [
      'src/main/views/menu/support/PrivacyPage.vue',
      'src/main/views/menu/support/SettingsPage.vue',
      'src/main/views/menu/support/SourcePage.vue',
      'src/main/views/explore/GisPage.vue',
      'src/main/views/explore/yangchun/YangChunOverviewPage.vue',
      'src/main/views/explore/yangchun/YangChunExpressionsPage.vue',
    ]) {
      const h1Snippets = stripHtmlComments(readSource(file)).match(/<h1\b[\s\S]*?<\/h1>/g) || []

      for (const snippet of h1Snippets) {
        expect(snippet, `${file} h1 uses pageTitles or computed page title`).toMatch(/navigation\.pageTitles|currentPageConfig\.titleKey/)
        expect(snippet, `${file} h1 has no hard-coded CJK page title`).not.toMatch(/>[^<{]*[\u3400-\u9fff]/)
      }
    }
  })

  it('uses h1 for table management page states without changing conditional visibility', () => {
    const source = readSource('src/main/views/explore/tools/TableManage.vue')

    expect(source).toContain('<h1><BarIcon icon="⚠️" />{{ t(\'navigation.pageTitles.tools.tableManageAccessDenied\') }}</h1>')
    expect(source).toContain('<h1 v-if="!showUniversalTable"><BarIcon icon="📈" />{{ t(\'navigation.pageTitles.tools.tableManage\') }}</h1>')
  })
})
