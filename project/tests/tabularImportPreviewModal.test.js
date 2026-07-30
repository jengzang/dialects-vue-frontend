import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

const previewPath = resolve(projectRoot, 'src/components/import/TabularImportPreview.vue')
const tabularPreviewUtilPath = resolve(projectRoot, 'src/utils/import/tabularPreview.js')
const checkToolPath = resolve(projectRoot, 'src/main/views/explore/tools/CheckTool.vue')
const mergeToolPath = resolve(projectRoot, 'src/main/views/explore/tools/MergeTool.vue')
const jyut2IpaToolPath = resolve(projectRoot, 'src/main/views/explore/tools/Jyut2IpaTool.vue')
const voronoiCustomImportPath = resolve(projectRoot, 'src/main/components/map/Draw/modals/VoronoiCustomImportModal.vue')
const vocabularyImportPath = resolve(projectRoot, 'src/main/views/explore/word/vocabulary/VocabularyImportPage.vue')
const enCommonLocalePath = resolve(projectRoot, 'src/i18n/locales/en/common.json')
const zhCnToolsLocalePath = resolve(projectRoot, 'src/i18n/locales/zh-CN/tools.json')
const zhHantToolsLocalePath = resolve(projectRoot, 'src/i18n/locales/zh-Hant/tools.json')
const enToolsLocalePath = resolve(projectRoot, 'src/i18n/locales/en/tools.json')

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
    expect(source).toContain('mappingEnabled')
    expect(source).toContain('v-if="mappingEnabled"')
    expect(source).toContain(':disabled="mappingEnabled && !diagnostics.isComplete"')
  })

  it('keeps import preview responsive styles orientation-based and tokenized', () => {
    const source = readSource(previewPath)

    expect(source).not.toMatch(/@media\s*\(\s*(?:max|min)-width/i)
    expect(source).toContain('@media (orientation: portrait)')
    expect(source).toContain('border-radius: var(--radius-xl)')
    expect(source).toContain('border-radius: var(--radius-lg)')
    expect(source).not.toContain('@mixin flex-column')
    expect(source).not.toContain('$primary-blue')
  })

  it('keeps the import preview chrome compact', () => {
    const source = readSource(previewPath)

    expect(source).toContain('$preview-padding: 12px;')
    expect(source).toContain('$preview-panel-padding: 12px;')
    expect(source).toMatch(/\.tabular-import-preview\s*\{[^}]*padding:\s*\$preview-padding/s)
    expect(source).toMatch(/&__mapping,\s*\n\s*&__preview\s*\{[^}]*padding:\s*\$preview-panel-padding/s)
    expect(source).not.toContain('padding: 18px')
  })

  it('uses the existing virtual scroller for full-row import previews', () => {
    const source = readSource(previewPath)

    expect(source).toContain("import { RecycleScroller } from 'vue-virtual-scroller'")
    expect(source).toContain("import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'")
    expect(source).toContain('<RecycleScroller')
    expect(source).toContain(':items="virtualPreviewRows"')
    expect(source).toContain(':item-size="40"')
    expect(source).toContain(':buffer="200"')
    expect(source).toContain('key-field="__rowKey"')
    expect(source).toContain('class="tabular-import-preview__table-scroller ui-scrollbar"')
    expect(source).toContain('class="tabular-import-preview__table-header"')
    expect(source).toContain('class="tabular-import-preview__table-row"')
    expect(source).toMatch(/&__table-scroller\s*\{[^}]*height:\s*calc\(100% - #\{\$preview-row-height\}\)/s)
    expect(source).toMatch(/&__table-header\s*\{[^}]*height:\s*\$preview-row-height/s)
    expect(source).not.toContain('<tbody>')
  })

  it('keeps preview copy out of the table panel chrome', () => {
    const source = readSource(previewPath)

    expect(source).not.toContain("t('common.importPreview.preview.title')")
    expect(source).not.toContain("t('common.importPreview.preview.description')")
  })

  it('keeps the import preview table panel stretched across available space', () => {
    const source = readSource(previewPath)

    expect(source).toMatch(/&__preview\s*\{[^}]*flex:\s*1 1 0/s)
  })

  it('keeps the import preview table constrained so its own scrollbar can work', () => {
    const source = readSource(previewPath)

    expect(source).toContain(':height="modalMaxHeight"')
    expect(source).toContain('class="tabular-import-preview tabular-import-preview--modal"')
    expect(source).toMatch(/&--modal\s*\{[^}]*height:\s*100%/s)
    expect(source).toMatch(/&--modal\s*\{[^}]*box-sizing:\s*border-box/s)
    expect(source).toMatch(/&__body\s*\{[^}]*flex:\s*1 1 auto[^}]*min-height:\s*0/s)
    expect(source).toMatch(/&__preview\s*\{[^}]*min-height:\s*0/s)
    expect(source).toMatch(/&__table-wrap\s*\{[^}]*flex:\s*1 1 auto[^}]*min-height:\s*0[^}]*overflow:\s*auto/s)
  })

  it('keeps the import preview modal header full-width and single-row when space allows', () => {
    const source = readSource(previewPath)

    expect(source).toContain('class="tabular-import-preview__modal-heading"')
    expect(source).toMatch(/&__modal-header\s*\{[^}]*display:\s*flex[^}]*width:\s*100%[^}]*align-items:\s*center[^}]*justify-content:\s*space-between/s)
    expect(source).toMatch(/&__modal-heading\s*\{[^}]*flex:\s*1 1 auto[^}]*min-width:\s*0/s)
  })

  it('uses all parsed rows for import preview by default', () => {
    const previewUtil = readSource(tabularPreviewUtilPath)
    const mergeTool = readSource(mergeToolPath)
    const checkTool = readSource(checkToolPath)
    const jyut2IpaTool = readSource(jyut2IpaToolPath)

    expect(previewUtil).toContain('export const DEFAULT_PREVIEW_ROW_COUNT = null')
    expect(previewUtil).toContain('Number.isFinite(previewRowCount)')
    expect(mergeTool).not.toContain('previewRowCount: 8')
    expect(checkTool).not.toContain('previewRowCount: 8')
    expect(jyut2IpaTool).not.toContain('previewRowCount: 8')
  })

  it('emits kebab-case sheet and header update events for reliable sheet switching', () => {
    const source = readSource(previewPath)

    expect(source).toContain("emitSheetChange")
    expect(source).toContain("emit('update:selectedSheetId', value)")
    expect(source).toContain("emit('update:selected-sheet-id', value)")
    expect(source).toContain("emitHeaderRowChange")
    expect(source).toContain("emit('update:headerRowIndex', value)")
    expect(source).toContain("emit('update:header-row-index', value)")
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

  it('forces the MergeTool default reference sheet through preview instead of auto-apply', () => {
    const source = readSource(mergeToolPath)

    expect(source).toContain('const forceReferencePreview = ref(false)')
    expect(source).toContain('forceReferencePreview.value || requireExplicitConfirmation.value')
    expect(source).toContain('forceReferencePreview.value = true')
    expect(source).toContain("showError(t('tools.merge.messages.readDefaultFailed'")
  })

  it('keeps the MergeTool default reference preview out of manual column mapping', () => {
    const source = readSource(mergeToolPath)

    expect(source).toContain('const isDefaultReferencePreview = computed(')
    expect(source).toContain(':mapping-enabled="!isDefaultReferencePreview"')
    expect(source).toContain('if (isDefaultReferencePreview.value) {')
    expect(source).toContain('await setReferenceFile(pendingReferenceFile.value)')
    expect(source).not.toContain('defaultReferenceDiagnostics')
    expect(source).not.toContain('referencePreviewDiagnostics')
    expect(source).not.toContain('referencePreviewSchema')
  })

  it('adds the default reference export label to all tool locales', () => {
    const zhCnTools = readJson(zhCnToolsLocalePath)
    const zhHantTools = readJson(zhHantToolsLocalePath)
    const enTools = readJson(enToolsLocalePath)

    expect(zhCnTools.merge.reference.downloadDefault).toBeTruthy()
    expect(zhHantTools.merge.reference.downloadDefault).toBeTruthy()
    expect(enTools.merge.reference.downloadDefault).toBeTruthy()
  })

  it('passes unwrapped preview state refs into TabularImportPreview callers', () => {
    const callerStates = [
      { source: readSource(mergeToolPath), state: 'referencePreviewState' },
      { source: readSource(checkToolPath), state: 'checkPreviewState' },
      { source: readSource(jyut2IpaToolPath), state: 'jyutPreviewState' }
    ]

    for (const { source, state } of callerStates) {
      expect(source).toContain(`:loading="${state}.loading.value"`)
      expect(source).toContain(`:preview-table="${state}.previewTable.value"`)
      expect(source).toContain(`:diagnostics="${state}.diagnostics.value"`)
      expect(source).toContain(`:mapping="${state}.mapping.value"`)
      expect(source).toContain(`:selected-sheet-id="${state}.selectedSheetId.value"`)
      expect(source).toContain(`:header-row-index="${state}.headerRowIndex.value"`)
      expect(source).toContain(`:sheets="${state}.parsedFile.value?.sheets || []"`)
      expect(source).toContain(`@update:selected-sheet-id="${state}.selectedSheetId.value = $event"`)
      expect(source).toContain(`@update:header-row-index="${state}.headerRowIndex.value = $event"`)
    }
  })

  it('passes unwrapped vocabulary import preview refs into TabularImportPreview', () => {
    const source = readSource(vocabularyImportPath)

    expect(source).toContain(':loading="importPreview.loading.value"')
    expect(source).toContain(':preview-table="importPreview.previewTable.value"')
    expect(source).toContain(':diagnostics="importPreview.diagnostics.value"')
    expect(source).toContain(':mapping="importPreview.mapping.value"')
  })
})
