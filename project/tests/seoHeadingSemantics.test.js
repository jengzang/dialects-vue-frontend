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
      expect(readSource(file), file).toContain(heading)
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
      'src/main/views/explore/charClass/CharacterClassification.vue',
      'src/main/views/explore/villages/gdVillagesTree.vue',
      'src/main/views/explore/villages/gdVillagesTable.vue',
      'src/main/views/explore/villages/YangChunVillages.vue',
      'src/main/views/explore/villages/AllVillages.vue',
      'src/main/views/explore/word/YangChunSpoken.vue',
      'src/main/views/menu/support/AboutPage.vue',
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

  it('uses dedicated page title i18n tokens for newly added menu route headings', () => {
    const tokenPaths = [
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
    ]) {
      expect(readSource(file), file).toContain('navigation.pageTitles')
    }
  })

  it('uses h1 for active about tab titles while keeping nested section titles below h1', () => {
    const source = readSource('src/main/views/menu/support/AboutPage.vue')

    expect(source).toContain('<h1 class="tabs-title"><BarIcon icon="📖" />{{ $t(\'about.intro.title\') }}</h1>')
    expect(source).toContain('<h1 class="tabs-title"><BarIcon icon="💬" />{{ $t(\'about.suggestion.title\') }}</h1>')
    expect(source).toContain('<h1 class="tabs-title like-author-title">')
    expect(source).toContain('<h2 class="tabs-title" style="margin-top: 20px"><BarIcon icon="🙏" />{{ $t(\'about.thanks.title\') }}</h2>')
    expect(source).toContain('<h2 class="tabs-title" style="margin-top: 3rem"><BarIcon icon="💡" />{{ $t(\'about.reflection.title\') }}</h2>')
  })

  it('uses h1 for table management page states without changing conditional visibility', () => {
    const source = readSource('src/main/views/explore/tools/TableManage.vue')

    expect(source).toContain('<h1><BarIcon icon="⚠️" />{{ t(\'tools.tableManage.accessDenied.title\') }}</h1>')
    expect(source).toContain('<h1 v-if="!showUniversalTable"><BarIcon icon="📈" />{{ t(\'tools.tableManage.page.title\') }}</h1>')
  })
})
