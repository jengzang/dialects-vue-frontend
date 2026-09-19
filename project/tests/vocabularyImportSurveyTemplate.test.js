import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(path) {
  return readFileSync(resolve(projectRoot, path), 'utf8')
}

describe('vocabulary import survey template download', () => {
  it('adds a localized survey template download with nearby help text', () => {
    const importPage = readSource('src/main/views/explore/word/vocabulary/VocabularyImportPage.vue')
    const zhCnWords = JSON.parse(readSource('src/i18n/locales/zh-CN/words.json'))
    const zhHantWords = JSON.parse(readSource('src/i18n/locales/zh-Hant/words.json'))
    const enWords = JSON.parse(readSource('src/i18n/locales/en/words.json'))

    expect(existsSync(resolve(projectRoot, 'public/data/sample/方言调查词表(语保).xlsx'))).toBe(true)
    expect(importPage).toContain("import HelpIcon from '@/components/ToastAndHelp/HelpIcon.vue'")
    expect(importPage).toContain('PhDownloadSimple')
    expect(importPage).toContain("SURVEY_TEMPLATE_URL = '/data/sample/方言调查词表(语保).xlsx'")
    expect(importPage).toContain("SURVEY_TEMPLATE_FILE_NAME = '方言调查词表(语保).xlsx'")
    expect(importPage).toContain(':href="SURVEY_TEMPLATE_URL"')
    expect(importPage).toContain(':download="SURVEY_TEMPLATE_FILE_NAME"')
    expect(importPage).toContain("t('words.wordList.upload.surveyTemplate')")
    expect(importPage).toContain("t('words.wordList.upload.surveyTemplateHelp')")
    expect(importPage).toContain('<HelpIcon')

    expect(zhCnWords.wordList.upload.surveyTemplate).toBe('词表')
    expect(zhCnWords.wordList.upload.surveyTemplateHelp).toContain('记录你的方言词汇')
    expect(zhHantWords.wordList.upload.surveyTemplate).toBeTruthy()
    expect(zhHantWords.wordList.upload.surveyTemplateHelp).toBeTruthy()
    expect(enWords.wordList.upload.surveyTemplate).toBeTruthy()
    expect(enWords.wordList.upload.surveyTemplateHelp).toBeTruthy()
  })
})
