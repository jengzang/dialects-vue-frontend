import { computed, ref, watch } from 'vue'

function defaultFileFactory(file) {
  return file
}

export function useTabularImportFlow(options = {}) {
  const {
    previewState,
    beforePreview,
    onAutoApply,
    onClear,
    onPreviewError,
    onManualMappingChange,
    resetInput,
    createPreviewFile = defaultFileFactory,
    pendingFileRef = null,
    payloadRef = null,
    confirmKeyRef = null
  } = options

  if (!previewState) {
    throw new Error('useTabularImportFlow requires previewState')
  }

  const pendingFile = pendingFileRef || ref(null)
  const previewPayload = payloadRef || ref(null)
  const confirmKey = confirmKeyRef || ref(0)

  const isReady = computed(() => !!previewPayload.value?.isComplete)
  const shouldShowPreview = computed(() => !!pendingFile.value)
  const canAutoApply = computed(() => !!previewState.canAutoApply?.value)

  watch(() => previewState.summary.value, (summary) => {
    if (pendingFile.value) {
      previewPayload.value = summary
    }
  })

  async function loadPreview(file) {
    if (typeof beforePreview === 'function') {
      const result = await beforePreview(file)
      if (result === false) {
        return false
      }
    }

    const previewFile = await createPreviewFile(file)

    pendingFile.value = previewFile
    confirmKey.value += 1

    try {
      await previewState.loadFile(previewFile)
      previewPayload.value = previewState.summary.value

      if (previewState.canAutoApply?.value && typeof onAutoApply === 'function') {
        await onAutoApply(previewFile, previewState.summary.value)
      }

      return true
    } catch (error) {
      pendingFile.value = null
      previewPayload.value = null
      previewState.resetState()
      if (typeof onPreviewError === 'function') {
        onPreviewError(error)
      } else {
        throw error
      }
      return false
    }
  }

  function updateManualMapping({ fieldKey, sourceKey }) {
    previewState.updateMapping(fieldKey, sourceKey)
    previewPayload.value = previewState.summary.value
    if (typeof onManualMappingChange === 'function') {
      onManualMappingChange(previewPayload.value)
    }
  }

  function clearPreview() {
    pendingFile.value = null
    previewPayload.value = null
    previewState.resetState()
    if (typeof resetInput === 'function') {
      resetInput()
    }
    if (typeof onClear === 'function') {
      onClear()
    }
  }

  return {
    pendingFile,
    previewPayload,
    confirmKey,
    isReady,
    shouldShowPreview,
    canAutoApply,
    loadPreview,
    updateManualMapping,
    clearPreview
  }
}
