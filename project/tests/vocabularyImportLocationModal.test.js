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
  it('keeps upload location details in a shared location editor modal with map and Yindian autofill helpers', () => {
    const importPage = readSource('src/main/views/explore/word/vocabulary/VocabularyImportPage.vue')
    // 弹窗外壳、字段网格、页脚都收在共享组件里，两个入口只传配置和插槽
    const editorModal = readSource('src/main/views/explore/word/vocabulary/LocationEditorModal.vue')
    const yindianMatch = readSource('src/main/views/explore/word/vocabulary/YindianLocationMatch.vue')
    const vocabularyScss = readSource('src/main/views/explore/word/vocabulary/vocabulary.scss')

    expect(importPage).toContain('<LocationEditorModal')
    expect(importPage).toContain('<MiniMapSelector')
    expect(editorModal).toContain('<AppModal')
    expect(editorModal).toContain('<YindianLocationMatch')
    expect(editorModal).toContain('<slot name="map" />')
    expect(yindianMatch).toContain('getLocationDetail')
    expect(importPage).toContain('openUploadLocationEditor')
    expect(importPage).toContain('confirmUploadLocationEditor')
    expect(yindianMatch).toContain('useYindianData')
    expect(importPage).toContain('uploadLocationDraft')
    expect(importPage).toContain('uploadLocationCoord')
    expect(importPage).toContain('uploadLocationSummaryItems')
    expect(importPage).not.toContain('v-model="uploadLocation[field.key]"')
    expect(vocabularyScss).toContain('.upload-location-summary')
    expect(editorModal).toContain('.location-editor-layout')
    expect(editorModal).toContain('.location-editor-map')
  })

  it('keeps source, description, and other metadata in upload and location edit fields', () => {
    const importPage = readSource('src/main/views/explore/word/vocabulary/VocabularyImportPage.vue')
    const locationsSection = readSource('src/main/views/explore/word/vocabulary/ManageLocationsSection.vue')
    // 字段定义是单一事实来源，两个表单都从这里生成，不再各自维护一份
    const locationFields = readSource('src/main/views/explore/word/vocabulary/vocabularyLocationFields.js')

    expect(importPage).toContain('<LocationEditorModal')
    expect(locationsSection).toContain('<LocationEditorModal')

    for (const key of ['vocabulary_source', 'description', 'other']) {
      expect(locationFields).toContain(`key: '${key}'`)
    }

    expect(importPage).toContain('LOCATION_BASE_FIELDS')
    expect(importPage).toContain('TONE_FIELDS')
    expect(locationsSection).toContain('LOCATION_BASE_FIELDS')
    expect(locationsSection).toContain('TONE_FIELDS')

    expect(locationFields).toContain('words.wordList.upload.vocabularySource')
    expect(locationFields).toContain('words.wordList.upload.description')
    expect(locationFields).toContain('words.wordList.upload.other')
    expect(locationsSection).toContain('locationEditFields.value')
    expect(locationsSection).toContain('updateVocabularyLocation(sourceName, payload, params)')
  })
})
