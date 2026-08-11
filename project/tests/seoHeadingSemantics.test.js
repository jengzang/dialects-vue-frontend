import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
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

  it('uses h1 for active about tab titles while keeping nested section titles below h1', () => {
    const source = readSource('src/main/views/menu/support/AboutPage.vue')

    expect(source).toContain('<h1 class="tabs-title">{{ $t(\'about.intro.title\') }}</h1>')
    expect(source).toContain('<h1 class="tabs-title">💬 {{ $t(\'about.suggestion.title\') }}</h1>')
    expect(source).toContain('<h1 class="tabs-title like-author-title">')
    expect(source).toContain('<h2 class="tabs-title" style="margin-top: 20px">🙏 {{ $t(\'about.thanks.title\') }}</h2>')
    expect(source).toContain('<h2 class="tabs-title" style="margin-top: 3rem">{{ $t(\'about.reflection.title\') }}</h2>')
  })

  it('uses h1 for table management page states without changing conditional visibility', () => {
    const source = readSource('src/main/views/explore/tools/TableManage.vue')

    expect(source).toContain('<h1><InlineIcon icon="⚠️" />{{ t(\'tools.tableManage.accessDenied.title\') }}</h1>')
    expect(source).toContain('<h1 v-if="!showUniversalTable">{{ t(\'tools.tableManage.page.title\') }}</h1>')
  })
})
