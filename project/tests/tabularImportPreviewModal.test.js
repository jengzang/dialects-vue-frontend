import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

const previewPath = resolve(projectRoot, 'src/components/import/TabularImportPreview.vue')
const checkToolPath = resolve(projectRoot, 'src/main/views/explore/tools/CheckTool.vue')
const mergeToolPath = resolve(projectRoot, 'src/main/views/explore/tools/MergeTool.vue')
const jyut2IpaToolPath = resolve(projectRoot, 'src/main/views/explore/tools/Jyut2IpaTool.vue')
const voronoiCustomImportPath = resolve(projectRoot, 'src/main/components/map/Draw/modals/VoronoiCustomImportModal.vue')
const enCommonLocalePath = resolve(projectRoot, 'src/i18n/locales/en/common.json')

function readSource(path) {
  return readFileSync(path, 'utf8')
}

function readJson(path) {
  return JSON.parse(readSource(path))
}

describe('tabular import preview modal shell', () => {
  it('uses AppModal as the preview shell with modal-controlled footer actions', () => {
    const source = readSource(previewPath)

    expect(source).toContain("import AppModal from '@/components/common/AppModal.vue'")
    expect(source).toContain('<AppModal')
    expect(source).toContain('v-model="isModalOpen"')
    expect(source).toContain('<template #footer>')
    expect(source).toContain("emit('confirm')")
  })

  it('keeps import preview callers wired to the component modal instead of inline actions', () => {
    const checkTool = readSource(checkToolPath)
    const mergeTool = readSource(mergeToolPath)
    const jyut2IpaTool = readSource(jyut2IpaToolPath)

    for (const source of [checkTool, mergeTool, jyut2IpaTool]) {
      expect(source).toContain(':model-value="Boolean(')
      expect(source).toContain('@confirm=')
      expect(source).not.toContain('upload-preview-actions')
    }
  })

  it('keeps the Voronoi custom import preview embedded in its existing modal', () => {
    const source = readSource(voronoiCustomImportPath)

    expect(source).toContain('<TabularImportPreview')
    expect(source).toContain('embedded')
    expect(source).toContain('<AppModal')
  })

  it('adds the CheckTool import-preview copy to the English locale', () => {
    const enCommon = readJson(enCommonLocalePath)

    expect(enCommon.importPreview.checkToolTitle).toBeTruthy()
    expect(enCommon.importPreview.checkToolDescription).toBeTruthy()
  })
})
