import { computed, ref, watch } from 'vue'
import { useAsyncTask } from '@/composables/core/useAsyncTask.js'
import { autoMatchColumns, buildMappingDiagnostics } from '@/utils/columnMapping.js'
import { DEFAULT_PREVIEW_ROW_COUNT, derivePreviewTable, parseTabularFile } from '@/utils/tabularPreview.js'

export function useTabularImportPreview(options = {}) {
  const {
    schema = ref([]),
    previewRowCount = DEFAULT_PREVIEW_ROW_COUNT,
    requireExplicitConfirmation = false
  } = options

  const task = useAsyncTask()
  const file = ref(null)
  const parsedFile = ref(null)
  const selectedSheetId = ref('')
  const headerRowIndex = ref(0)
  const mapping = ref({})

  const previewTable = computed(() => {
    if (!parsedFile.value) {
      return {
        activeSheet: null,
        headers: [],
        previewRows: [],
        sourceColumns: [],
        headerRowIndex: 0
      }
    }

    return derivePreviewTable(parsedFile.value, {
      sheetId: selectedSheetId.value,
      headerRowIndex: headerRowIndex.value,
      previewRowCount
    })
  })

  const diagnostics = computed(() => buildMappingDiagnostics(schema.value, previewTable.value.sourceColumns, mapping.value))
  const shouldRequireConfirmation = computed(() => {
    if (typeof requireExplicitConfirmation === 'function') {
      return !!requireExplicitConfirmation(summary.value)
    }
    return !!requireExplicitConfirmation
  })
  const canAutoApply = computed(() => diagnostics.value.isComplete && !shouldRequireConfirmation.value)

  const summary = computed(() => ({
    file: file.value,
    parsedFile: parsedFile.value,
    selectedSheetId: selectedSheetId.value,
    headerRowIndex: headerRowIndex.value,
    mapping: mapping.value,
    sourceColumns: previewTable.value.sourceColumns,
    diagnostics: diagnostics.value,
    isComplete: diagnostics.value.isComplete,
    shouldRequireConfirmation: shouldRequireConfirmation.value,
    canAutoApply: canAutoApply.value
  }))

  function resetState() {
    file.value = null
    parsedFile.value = null
    selectedSheetId.value = ''
    headerRowIndex.value = 0
    mapping.value = {}
    task.reset()
  }

  async function loadFile(nextFile) {
    const result = await task.run(() => parseTabularFile(nextFile), { rethrow: true })
    file.value = nextFile
    parsedFile.value = result
    selectedSheetId.value = result.sheets[0]?.id || ''
    headerRowIndex.value = 0
    mapping.value = autoMatchColumns(schema.value, derivePreviewTable(result, {
      sheetId: selectedSheetId.value,
      headerRowIndex: 0,
      previewRowCount
    }).sourceColumns)
    return result
  }

  function updateMapping(fieldKey, sourceKey) {
    mapping.value = {
      ...mapping.value,
      [fieldKey]: sourceKey || null
    }
  }

  watch([selectedSheetId, headerRowIndex, schema], () => {
    if (!parsedFile.value) {
      return
    }

    const nextSourceColumns = previewTable.value.sourceColumns
    const autoMapping = autoMatchColumns(schema.value, nextSourceColumns)
    mapping.value = {
      ...autoMapping,
      ...mapping.value
    }
  })

  return {
    file,
    parsedFile,
    selectedSheetId,
    headerRowIndex,
    mapping,
    previewTable,
    diagnostics,
    summary,
    shouldRequireConfirmation,
    canAutoApply,
    loading: task.loading,
    error: task.error,
    loadFile,
    updateMapping,
    resetState
  }
}
