import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

const aboutPagePath = resolve(projectRoot, 'src/main/views/menu/support/SettingsPage.vue')
const queryPagePath = resolve(projectRoot, 'src/main/views/menu/QueryPage.vue')
const comparePagePath = resolve(projectRoot, 'src/main/views/menu/ComparePage.vue')
const resultPagePath = resolve(projectRoot, 'src/main/views/menu/ResultPage.vue')
const panelManagerPath = resolve(projectRoot, 'src/main/components/result/PanelManager.vue')
const phonologyCustomPath = resolve(projectRoot, 'src/main/components/pho/PhonologyCustom.vue')
const resultTablePath = resolve(projectRoot, 'src/main/utils/query/ResultTable.js')
const storePath = resolve(projectRoot, 'src/main/store/store.js')
const zhCnNavigationLocalePath = resolve(projectRoot, 'src/i18n/locales/zh-CN/navigation.json')
const zhHantNavigationLocalePath = resolve(projectRoot, 'src/i18n/locales/zh-Hant/navigation.json')
const enNavigationLocalePath = resolve(projectRoot, 'src/i18n/locales/en/navigation.json')
const zhCnPhonologyLocalePath = resolve(projectRoot, 'src/i18n/locales/zh-CN/phonology.json')
const zhHantPhonologyLocalePath = resolve(projectRoot, 'src/i18n/locales/zh-Hant/phonology.json')
const enPhonologyLocalePath = resolve(projectRoot, 'src/i18n/locales/en/phonology.json')
const zhCnResultLocalePath = resolve(projectRoot, 'src/i18n/locales/zh-CN/result.json')
const zhHantResultLocalePath = resolve(projectRoot, 'src/i18n/locales/zh-Hant/result.json')
const enResultLocalePath = resolve(projectRoot, 'src/i18n/locales/en/result.json')

function readSource(path) {
  return readFileSync(path, 'utf8')
}

function readJson(path) {
  return JSON.parse(readSource(path))
}

describe('global character table switching', () => {
  beforeEach(() => {
    vi.resetModules()
    window.localStorage.clear()
  })

  it('persists the preferred character table in localStorage via the shared store', async () => {
    window.localStorage.setItem('preferred-character-table', JSON.stringify('old_chinese'))

    const { preferredCharacterTable, setPreferredCharacterTable } = await import('../src/main/store/store.js')

    expect(preferredCharacterTable.value).toBe('old_chinese')

    setPreferredCharacterTable('hongwu')

    expect(preferredCharacterTable.value).toBe('hongwu')
    expect(JSON.parse(window.localStorage.getItem('preferred-character-table'))).toBe('hongwu')

    setPreferredCharacterTable('not-a-real-table')

    expect(preferredCharacterTable.value).toBe('characters')
    expect(JSON.parse(window.localStorage.getItem('preferred-character-table'))).toBe('characters')
  })

  it('adds the settings entry and query/result wiring for character-table switching', () => {
    const aboutSource = readSource(aboutPagePath)
    const querySource = readSource(queryPagePath)
    const compareSource = readSource(comparePagePath)
    const resultSource = readSource(resultPagePath)
    const panelManagerSource = readSource(panelManagerPath)
    const phonologySource = readSource(phonologyCustomPath)
    const resultTableSource = readSource(resultTablePath)
    const storeSource = readSource(storePath)

    expect(storeSource).toContain("useStorageState('preferred-character-table'")
    expect(storeSource).toContain('export const preferredCharacterTable')
    expect(storeSource).toContain('export function setPreferredCharacterTable')
    expect(storeSource).toContain('tableName: DEFAULT_CHARACTER_TABLE')

    expect(aboutSource).toContain('TABLE_COLUMN_SCHEMAS')
    expect(aboutSource).toContain('preferredCharacterTable')
    expect(aboutSource).toContain("navigation.settings.characterTable.title")
    expect(aboutSource).toContain("navigation.settings.characterTable.description")

    expect(querySource).toContain('preferredCharacterTable')
    expect(querySource).toContain('useQueryConfig(selectedCharacterTable)')
    expect(querySource).toContain('table_name: selectedCharacterTable.value')
    expect(querySource).toContain("selectedCharacterTable.value === 'characters'")

    expect(compareSource).toContain('preferredCharacterTable')
    expect(compareSource).toContain('useQueryConfig(selectedCharacterTable)')
    expect(compareSource).toContain('table_name: selectedCharacterTable.value')

    expect(resultSource).toContain('resultCache.tableName')
    expect(resultSource).toContain('table_name:')

    expect(resultTableSource).toContain('resultCache.tableName || DEFAULT_CHARACTER_TABLE')
    expect(resultTableSource).toContain('table_name: tableName')
    expect(resultTableSource).toContain("if (tableName !== 'characters') {")
    expect(resultTableSource).toContain("showWarning(i18n.global.t('result.panelManager.unsupportedTable'))")
    expect(resultTableSource).toContain('Remove this guard after multi-table adaptation lands.')
    expect(panelManagerSource).not.toContain("resultCache.tableName !== 'characters'")

    expect(phonologySource).toContain('preferredCharacterTable')
    expect(phonologySource).toContain('table_name: selectedCharacterTable.value')
    expect(phonologySource).toContain("phonology.phonology.custom.states.unsupportedTable")
  })

  it('adds locale copy for the settings selector and unsupported phonology tables', () => {
    const zhCnNavigation = readJson(zhCnNavigationLocalePath)
    const zhHantNavigation = readJson(zhHantNavigationLocalePath)
    const enNavigation = readJson(enNavigationLocalePath)
    const zhCnPhonology = readJson(zhCnPhonologyLocalePath)
    const zhHantPhonology = readJson(zhHantPhonologyLocalePath)
    const enPhonology = readJson(enPhonologyLocalePath)
    const zhCnResult = readJson(zhCnResultLocalePath)
    const zhHantResult = readJson(zhHantResultLocalePath)
    const enResult = readJson(enResultLocalePath)

    expect(zhCnNavigation.settings.characterTable).toEqual({
      title: expect.any(String),
      description: expect.any(String),
    })
    expect(zhHantNavigation.settings.characterTable).toEqual({
      title: expect.any(String),
      description: expect.any(String),
    })
    expect(enNavigation.settings.characterTable).toEqual({
      title: expect.any(String),
      description: expect.any(String),
    })

    expect(zhCnPhonology.phonology.custom.states.unsupportedTable).toBeTruthy()
    expect(zhHantPhonology.phonology.custom.states.unsupportedTable).toBeTruthy()
    expect(enPhonology.phonology.custom.states.unsupportedTable).toBeTruthy()

    expect(zhCnResult.panelManager.unsupportedTable).toBeTruthy()
    expect(zhHantResult.panelManager.unsupportedTable).toBeTruthy()
    expect(enResult.panelManager.unsupportedTable).toBeTruthy()
  })
})
