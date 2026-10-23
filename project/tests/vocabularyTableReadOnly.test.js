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
    const vocabularyPage = readSource('src/main/views/menu/VocabularyPage.vue')

    expect(vocabularyPage).toContain("path: '/menu/vocabulary/view'")
    expect(vocabularyPage).toContain("path: '/menu/vocabulary/import'")
    expect(vocabularyPage).toContain("'/menu/vocabulary/manage'")
    expect(vocabularyPage).not.toContain('redirectUnavailablePage')
    expect(vocabularyPage).not.toContain("navigateTo('/menu/vocabulary/view')")
  })

  it('lets everyone open table mode while keeping the view page UniversalTable read-only', () => {
    const vocabularyViewPage = readSource('src/main/views/explore/word/vocabulary/VocabularyViewPage.vue')

    expect(readSource('src/main/views/explore/word/vocabulary/VocabularyTopControls.vue')).toContain("v-for=\"mode in ['table', 'card', 'map']\"")
    expect(vocabularyViewPage).toContain('v-else-if="viewMode === \'table\'"')
    expect(vocabularyViewPage).not.toContain("mode.key !== 'table'")
    expect(vocabularyViewPage).not.toContain("value === 'table'")
    expect(vocabularyViewPage).not.toContain(':can-edit=')
    expect(vocabularyViewPage).not.toContain('const canUseVocabularyTable = computed')
  })

  it('places editable vocabulary table access inside the permission-gated manage page', () => {
    const managePage = readSource('src/main/views/explore/word/vocabulary/VocabularyManagePage.vue')
    const vocabularyManagePage = readSource('src/main/views/explore/word/vocabulary/ManageEntriesSection.vue')

    expect(managePage).toContain('<KeepAlive v-if="!shouldShowAccessGate">')
    expect(managePage).toContain('<ManageEntriesSection')
    expect(managePage).toContain(':has-vocabulary-permission="hasVocabularyPermission"')
    expect(vocabularyManagePage).toContain('v-if="canRenderEntriesTable"')
    expect(vocabularyManagePage).toContain('<UniversalTable')
    expect(vocabularyManagePage).toContain('db-key="vocabulary"')
    expect(vocabularyManagePage).toContain('table-name="vocabulary_entries"')
    expect(vocabularyManagePage).toContain('api-adapter="vocabulary"')
    expect(vocabularyManagePage).toContain('primary-key="id"')
    expect(vocabularyManagePage).toContain(':can-edit="hasVocabularyPermission"')
    expect(vocabularyManagePage).toContain('import UniversalTable')
    expect(vocabularyManagePage).toContain('const tableColumns = computed')
  })
})
