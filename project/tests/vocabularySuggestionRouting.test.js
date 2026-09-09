import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(path) {
  return readFileSync(resolve(projectRoot, path), 'utf8')
}

describe('vocabulary suggestion routing', () => {
  it('shows the permission request action for guests and signed-in users without upload permission', () => {
    const vocabularyImportPage = readSource('src/main/views/explore/word/vocabulary/VocabularyImportPage.vue')

    expect(vocabularyImportPage).toContain('v-if="shouldShowPermissionRequest"')
    expect(vocabularyImportPage).toMatch(/const shouldShowPermissionRequest = computed\(\(\) => \(\s*requiresLogin\.value\s*\|\|\s*requiresVocabularyPermission\.value\s*\)\)/)
    expect(vocabularyImportPage).not.toContain('v-if="requiresLogin" class="upload-access-notice"')
  })

  it('routes vocabulary permission requests to the site feedback form with category context', () => {
    const vocabularyImportPage = readSource('src/main/views/explore/word/vocabulary/VocabularyImportPage.vue')

    expect(vocabularyImportPage).toContain("path: buildLocalePath(resolveRouteLocale(route), '/menu/about/suggestion')")
    expect(vocabularyImportPage).toContain("category: 'vocabulary_permission'")
    expect(vocabularyImportPage).toContain("from: 'vocabulary_import'")
  })
})
