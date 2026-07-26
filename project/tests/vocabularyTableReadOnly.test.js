import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(path) {
  return readFileSync(resolve(projectRoot, path), 'utf8')
}

describe('vocabulary table read-only view', () => {
  it('keeps vocabulary page tabs navigable without redirecting unavailable tab content', () => {
    const vocabularyPage = readSource('src/main/views/explore/word/VocabularyPage.vue')

    expect(vocabularyPage).toContain("path: '/explore/vocabulary/view'")
    expect(vocabularyPage).toContain("path: '/explore/vocabulary/import'")
    expect(vocabularyPage).toContain("path: '/explore/vocabulary/manage'")
    expect(vocabularyPage).not.toContain('redirectUnavailablePage')
    expect(vocabularyPage).not.toContain("navigateTo('/explore/vocabulary/view')")
  })

  it('lets everyone open table mode while keeping the view page UniversalTable read-only', () => {
    const vocabularyViewPage = readSource('src/main/views/explore/word/vocabulary/VocabularyViewPage.vue')

    expect(vocabularyViewPage).toContain("key: 'table'")
    expect(vocabularyViewPage).not.toContain("mode.key !== 'table'")
    expect(vocabularyViewPage).not.toContain("value === 'table'")
    expect(vocabularyViewPage).not.toContain(':can-edit=')
    expect(vocabularyViewPage).not.toContain('const canUseVocabularyTable = computed')
  })
})
