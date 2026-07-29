import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(path) {
  return readFileSync(resolve(projectRoot, path), 'utf8')
}

describe('vocabulary import location modal', () => {
  it('keeps upload location details in an AppModal with map and Yindian autofill helpers', () => {
    const importPage = readSource('src/main/views/explore/word/vocabulary/VocabularyImportPage.vue')
    const vocabularyScss = readSource('src/main/views/explore/word/vocabulary/vocabulary.scss')

    expect(importPage).toContain('<AppModal')
    expect(importPage).toContain('<MiniMapSelector')
    expect(importPage).toContain('getLocationDetail')
    expect(importPage).toContain('openUploadLocationEditor')
    expect(importPage).toContain('confirmUploadLocationEditor')
    expect(importPage).toContain('useYindianLocationData')
    expect(importPage).toContain('uploadLocationDraft')
    expect(importPage).toContain('uploadLocationCoord')
    expect(importPage).toContain('uploadLocationSummaryItems')
    expect(importPage).not.toContain('v-model="uploadLocation[field.key]"')
    expect(vocabularyScss).toContain('.upload-location-summary')
    expect(vocabularyScss).toContain('.upload-location-modal-layout')
    expect(vocabularyScss).toContain('.upload-location-map-panel')
  })
})
