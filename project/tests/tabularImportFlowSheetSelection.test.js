import { computed, nextTick, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { useTabularImportFlow } from '@/composables/import/useTabularImportFlow.js'
import { useTabularImportPreview } from '@/composables/import/useTabularImportPreview.js'

function buildParsedFile() {
  return {
    fileName: 'multi-sheet.xlsx',
    sheets: [
      {
        id: 'Sheet1',
        name: 'Sheet1',
        rows: [
          ['word', 'local'],
          ['formal-first', 'local-first']
        ],
        rowCount: 2,
        columnCount: 2
      },
      {
        id: 'Sheet2',
        name: 'Sheet2',
        rows: [
          ['local', 'word'],
          ['local-second', 'formal-second']
        ],
        rowCount: 2,
        columnCount: 2
      }
    ]
  }
}

describe('tabular import flow sheet selection', () => {
  it('keeps the flow payload synchronized when selected sheet changes', async () => {
    const selectedSheetId = ref('Sheet1')
    const sourceColumns = computed(() => (
      selectedSheetId.value === 'Sheet2'
        ? [{ key: 'column_1', label: 'second sheet column' }]
        : [{ key: 'column_1', label: 'first sheet column' }]
    ))
    const summary = computed(() => ({
      selectedSheetId: selectedSheetId.value,
      sourceColumns: sourceColumns.value,
      mapping: { word: 'column_1' },
      isComplete: true
    }))
    const previewState = {
      selectedSheetId,
      canAutoApply: ref(false),
      summary,
      loadFile: () => Promise.resolve(),
      resetState: () => {},
      updateMapping: () => {}
    }

    const flow = useTabularImportFlow({ previewState })
    await flow.loadPreview({ name: 'multi-sheet.xlsx' })

    selectedSheetId.value = 'Sheet2'
    await nextTick()

    expect(flow.previewPayload.value.selectedSheetId).toBe('Sheet2')
    expect(flow.previewPayload.value.sourceColumns[0].label).toBe('second sheet column')
  })

  it('rebuilds automatic column mapping for the newly selected sheet', async () => {
    const schema = ref([
      { key: 'word', label: 'Word', required: true, aliases: ['word'] },
      { key: 'local', label: 'Local', required: true, aliases: ['local'] }
    ])
    const preview = useTabularImportPreview({ schema })

    preview.parsedFile.value = buildParsedFile()
    preview.selectedSheetId.value = 'Sheet1'
    preview.headerRowIndex.value = 0
    await nextTick()

    expect(preview.mapping.value).toEqual({
      word: 'column_1',
      local: 'column_2'
    })

    preview.selectedSheetId.value = 'Sheet2'
    await nextTick()

    expect(preview.mapping.value).toEqual({
      word: 'column_2',
      local: 'column_1'
    })
  })

  it('rebuilds automatic column mapping for the newly selected header row', async () => {
    const schema = ref([
      { key: 'word', label: 'Word', required: true, aliases: ['word'] },
      { key: 'local', label: 'Local', required: true, aliases: ['local'] }
    ])
    const preview = useTabularImportPreview({ schema })

    preview.parsedFile.value = {
      fileName: 'header-row.xlsx',
      sheets: [
        {
          id: 'Sheet1',
          name: 'Sheet1',
          rows: [
            ['metadata', 'ignored'],
            ['local', 'word'],
            ['local-value', 'word-value']
          ],
          rowCount: 3,
          columnCount: 2
        }
      ]
    }
    preview.selectedSheetId.value = 'Sheet1'
    preview.headerRowIndex.value = 0
    await nextTick()

    expect(preview.mapping.value).toEqual({
      word: null,
      local: null
    })

    preview.headerRowIndex.value = 1
    await nextTick()

    expect(preview.mapping.value).toEqual({
      word: 'column_2',
      local: 'column_1'
    })
  })
})
