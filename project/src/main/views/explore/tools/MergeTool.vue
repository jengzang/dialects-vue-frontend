<template>
  <div class="merge-tool-container">
    <div class="glass-container glass-container-shell" style="max-height: 80dvh;overflow: auto;">
      <div class="header-section">
        <h2 class="title">{{ t('tools.merge.page.title') }}</h2>
        <p class="subtitle">{{ t('tools.merge.page.subtitle') }}</p>
      </div>

      <div class="steps-indicator">
        <div
          class="step"
          :class="{ active: currentStep >= 1, completed: currentStep > 1 }"
          @click="currentStep > 1 && goToStep(1)"
        >
          <div class="step-number">1</div>
          <div class="step-label">{{ t('tools.merge.steps.reference') }}</div>
        </div>
        <div class="step-line" :class="{ active: currentStep >= 2 }"></div>
        <div
          class="step"
          :class="{ active: currentStep >= 2, completed: currentStep > 2 }"
          @click="currentStep > 2 && goToStep(2)"
        >
          <div class="step-number">2</div>
          <div class="step-label">{{ t('tools.merge.steps.files') }}</div>
        </div>
        <div class="step-line" :class="{ active: currentStep >= 3 }"></div>
        <div class="step" :class="{ active: currentStep >= 3, completed: currentStep > 3 }">
          <div class="step-number">3</div>
          <div class="step-label">{{ t('tools.merge.steps.result') }}</div>
        </div>
      </div>

      <div class="content-area">
        <div class="step-content" v-show="currentStep === 1">
          <h3 class="step-title">{{ t('tools.merge.reference.title') }}</h3>
          <p class="step-desc">{{ t('tools.merge.reference.desc') }}</p>

          <div
            class="upload-zone"
            :class="{ 'has-file': referenceFile }"
            @click="!referenceFile && $refs.refInput.click()"
            @dragover.prevent="dragOver1 = true"
            @dragleave.prevent="dragOver1 = false"
            @drop.prevent="handleRefDrop"
          >
            <input
              ref="refInput"
              type="file"
              accept=".xlsx,.xls,.csv"
              @change="handleRefSelect"
              style="display: none"
            />

            <template v-if="!referenceFile">
              <div class="upload-icon">📋</div>
              <div class="upload-text">{{ t('tools.merge.reference.uploadText') }}</div>
              <div class="upload-hint">{{ t('tools.merge.reference.uploadHint') }}</div>
            </template>

            <template v-else>
              <div class="file-info-card">
                <div class="file-icon">✅</div>
                <div class="file-details">
                  <div class="file-name">{{ referenceFile.name }}</div>
                  <div class="file-meta">
                    <span>{{ t('tools.merge.reference.charCount') }}: {{ referenceStats.charCount }}</span>
                    <span>{{ t('tools.merge.reference.columnCount') }}: {{ referenceStats.columnCount }}</span>
                  </div>
                  <div v-if="referenceImportSummary" class="file-meta file-meta--summary">
                    <span>{{ referenceImportSummary }}</span>
                  </div>
                </div>
                <button
                  class="remove-btn"
                  :title="t('tools.common.close')"
                  @click.stop="removeReference"
                >
                  ✕
                </button>
              </div>
            </template>
          </div>

          <TabularImportPreview
            v-if="pendingReferenceFile"
            :key="referenceImportConfirmKey"
            :title="t('common.importPreview.referenceTitle')"
            :description="t('common.importPreview.referenceDescription')"
            :file="pendingReferenceFile"
            :schema="referenceImportSchema"
            :loading="referencePreviewState.loading"
            :preview-table="referencePreviewState.previewTable"
            :diagnostics="referencePreviewState.diagnostics"
            :mapping="referencePreviewState.mapping"
            :selected-sheet-id="referencePreviewState.selectedSheetId"
            :header-row-index="referencePreviewState.headerRowIndex"
            :sheets="referencePreviewState.parsedFile?.sheets || []"
            @update:selectedSheetId="referencePreviewState.selectedSheetId = $event"
            @update:headerRowIndex="referencePreviewState.headerRowIndex = $event"
            @update:mapping="handleReferenceMappingUpdate"
            @reset="clearPendingReference"
          />

          <div class="step-actions">
            <button
              v-if="pendingReferenceFile"
              class="main-glass-button"
              data-variant="secondary"
              @click="clearPendingReference"
            >
              {{ t('common.button.cancel') }}
            </button>
            <button
              class="main-glass-button"
              data-variant="secondary"
              @click="previewDefaultReference"
              :disabled="isLoadingRef"
            >
              <span class="icon">{{ isLoadingRef ? '⏳' : '👁️' }}</span>
              <span>
                {{ isLoadingRef ? t('tools.merge.reference.loadingDefault') : t('tools.merge.reference.viewDefault') }}
              </span>
            </button>
            <button
              v-if="!pendingReferenceFile"
              class="main-glass-button"
              data-variant="secondary"
              @click="downloadDefaultReference"
            >
              <span class="icon">⬇️</span>
              <span>{{ t('tools.merge.reference.downloadDefault') }}</span>
            </button>
            <button
              class="main-glass-button"
              data-variant="primary"
              data-size="large"
              :disabled="!referenceFile && !isReferenceImportReady"
              @click="handleReferenceConfirm"
            >
              {{ referenceFile ? `${t('tools.merge.reference.next')} →` : t('common.importPreview.actions.confirmAndUse') }}
            </button>
          </div>
        </div>

        <div class="step-content" v-show="currentStep === 2">
          <h3 class="step-title">{{ t('tools.merge.files.title') }}</h3>
          <p class="step-desc">
            {{ t('tools.merge.files.descPrefix') }}
            <button
                class="main-glass-button"
                data-size="small"
                style="display: inline-block; padding: 2px 8px; margin: 0 2px; vertical-align: middle;background: #007aff;color:white"
                @click="$router.push(buildLocalePath(resolveRouteLocale(route), '/explore/tools/check'))"
            >
              {{ t('tools.merge.files.checkTool') }}
            </button>
            {{ t('tools.merge.files.descSuffix') }}
          </p>

          <div
            class="upload-zone multiple"
            @click="$refs.filesInput.click()"
            @dragover.prevent="dragOver2 = true"
            @dragleave.prevent="dragOver2 = false"
            @drop.prevent="handleFilesDrop"
          >
            <input
              ref="filesInput"
              type="file"
              accept=".xlsx,.xls"
              multiple
              @change="handleFilesSelect"
              style="display: none"
            />
            <div class="upload-icon">📁</div>
            <div class="upload-text">{{ t('tools.merge.files.uploadText') }}</div>
            <div class="upload-hint">{{ t('tools.merge.files.uploadHint') }}</div>
          </div>

          <div class="files-list" v-if="mergeFiles.length > 0">
            <h4 class="list-title">{{ t('tools.merge.files.selectedCount', { count: mergeFiles.length }) }}</h4>
            <div class="file-items">
              <div
                v-for="(file, index) in mergeFiles"
                :key="index"
                class="file-item"
              >
                <div class="file-item-icon">📄</div>
                <div class="file-item-name">{{ file.name }}</div>
                <button class="file-item-remove" @click="removeFile(index)">🗑️</button>
              </div>
            </div>
          </div>

          <div class="step-actions">
            <button class="main-glass-button" data-variant="secondary" @click="prevStep">
              ← {{ t('tools.merge.files.previous') }}
            </button>
            <button
              class="main-glass-button"
              data-variant="primary"
              data-size="large"
              :disabled="mergeFiles.length === 0"
              @click="startMerge"
            >
              {{ t('tools.merge.files.startMerge') }}
            </button>
          </div>
        </div>

        <div class="step-content" v-show="currentStep === 3">
          <div class="processing-view" v-if="processing">
            <div class="processing-icon">
              <div class="ui-loading--page" aria-hidden="true"></div>
            </div>
            <h3 class="processing-title">{{ t('tools.merge.processing.title') }}</h3>
            <p class="processing-text">{{ processingText }}</p>

            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progress + '%' }"></div>
              </div>
              <div class="progress-label">{{ progress }}%</div>
            </div>

            <div class="processing-details" v-if="mergeStats.total > 0">
              <div class="detail-item">
                <span class="label">{{ t('tools.merge.processing.totalFiles') }}</span>
                <span class="value">{{ mergeStats.total }}</span>
              </div>
              <div class="detail-item">
                <span class="label">{{ t('tools.common.processedRows') }}</span>
                <span class="value">{{ mergeStats.processed }}</span>
              </div>
              <div class="detail-item">
                <span class="label">{{ t('tools.common.successfulRows') }}</span>
                <span class="value success">{{ mergeStats.success }}</span>
              </div>
            </div>
          </div>

          <div class="complete-view" v-else>
            <h3 class="complete-title">✅ {{ t('tools.merge.complete.title') }}</h3>
            <p class="complete-text">{{ t('tools.merge.complete.text') }}</p>

            <div class="result-summary">
<!--              <div class="summary-card">-->
<!--                <div class="summary-icon">📊</div>-->
<!--                <div class="summary-content">-->
<!--                  <div class="summary-number">{{ mergeStats.totalRows }}</div>-->
<!--                  <div class="summary-label">總行數</div>-->
<!--                </div>-->
<!--              </div>-->
              <div class="summary-card">
                <div class="summary-icon">📁</div>
                <div class="summary-content">
                  <div class="summary-number">{{ mergeStats.totalFiles }}</div>
                  <div class="summary-label">{{ t('tools.merge.summary.mergedFileCount') }}</div>
                </div>
              </div>
<!--              <div class="summary-card">-->
<!--                <div class="summary-icon">📋</div>-->
<!--                <div class="summary-content">-->
<!--                  <div class="summary-number">{{ mergeStats.totalColumns }}</div>-->
<!--                  <div class="summary-label">總列數</div>-->
<!--                </div>-->
<!--              </div>-->
            </div>

            <div class="result-actions">
              <button class="main-glass-button" data-variant="primary" data-size="large" @click="downloadMerged">
                <span class="icon">⬇️</span>
                <span>{{ t('tools.merge.actions.downloadResult') }}</span>
              </button>
              <button class="main-glass-button" data-variant="secondary" @click="reset">
                <span class="icon">🔄</span>
                <span>{{ t('tools.merge.actions.resetTask') }}</span>
              </button>
            </div>

            <div class="merged-files-info">
              <h4 class="info-title">{{ t('tools.merge.complete.mergedFilesTitle') }}</h4>
              <div class="merged-list ui-scrollbar">
                <div
                  v-for="(file, index) in mergedFilesList"
                  :key="index"
                  class="merged-item"
                >
                  <span class="merged-index">{{ index + 1 }}</span>
                  <span class="merged-name">{{ file.name }}</span>
                  <span class="merged-status">✓ {{ t('tools.common.completed') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import TabularImportPreview from '@/components/import/TabularImportPreview.vue'
import { downloadMerge, executeMerge, getMergeProgress, uploadFiles, uploadReference } from '@/api'
import { showError, showSuccess } from '@/utils/message.js'
import { usePollingTask } from '@/composables/core/usePollingTask.js'
import { useAuthGuard } from '@/composables/router/useAuthGuard.js'
import { useTabularImportFlow } from '@/composables/import/useTabularImportFlow.js'
import { useTabularImportPreview } from '@/composables/import/useTabularImportPreview.js'
import defaultReferenceWorkbookUrl from '/data/参考表.xlsx?url'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'

const { t } = useI18n()
const { requireAuth } = useAuthGuard({
  defaultRedirect: '/explore/tools/merge',
})

const DEFAULT_REFERENCE_PATH = defaultReferenceWorkbookUrl
const DEFAULT_REFERENCE_SENTINEL = '__default_reference__'
const DEFAULT_REFERENCE_FILE_NAME = '参考表.xlsx'
const MERGE_RESULT_FILE_NAME = '方音圖鑑_合併字表.xlsx'

const currentStep = ref(1)
const referenceFile = ref(null)
const pendingReferenceFile = ref(null)
const referenceImportConfirmKey = ref(0)
const referenceImportPayload = ref(null)
const mergeFiles = ref([])
const processing = ref(false)
const progress = ref(0)
const processingText = ref('')
const dragOver1 = ref(false)
const dragOver2 = ref(false)
const taskId = ref(null)

const refInput = ref(null)
const filesInput = ref(null)
const requireExplicitConfirmation = ref(false)

const referenceStats = reactive({
  charCount: 0,
  columnCount: 0
})

const mergeStats = reactive({
  total: 0,
  processed: 0,
  success: 0,
  totalRows: 0,
  totalFiles: 0,
  totalColumns: 0
})

const mergedFilesList = ref([])
const mergePollingTask = usePollingTask({
  intervalMs: 1000,
  maxFailures: 3,
})

const isLoadingRef = computed(() => referencePreviewState.loading.value)
const referenceImportSchema = computed(() => ([
  {
    key: 'char',
    label: t('common.importPreview.schemas.mergeReference.char.label'),
    required: true,
    aliases: [
      t('common.importPreview.schemas.mergeReference.char.aliases.char'),
      t('common.importPreview.schemas.mergeReference.char.aliases.character'),
      t('common.importPreview.schemas.mergeReference.char.aliases.word')
    ],
    description: t('common.importPreview.schemas.mergeReference.char.description'),
    example: t('common.importPreview.schemas.mergeReference.char.example')
  },
  {
    key: 'pronunciation',
    label: t('common.importPreview.schemas.mergeReference.pronunciation.label'),
    required: true,
    aliases: [
      t('common.importPreview.schemas.mergeReference.pronunciation.aliases.ipa'),
      t('common.importPreview.schemas.mergeReference.pronunciation.aliases.phonetic'),
      t('common.importPreview.schemas.mergeReference.pronunciation.aliases.sound')
    ],
    description: t('common.importPreview.schemas.mergeReference.pronunciation.description'),
    example: t('common.importPreview.schemas.mergeReference.pronunciation.example')
  },
  {
    key: 'note',
    label: t('common.importPreview.schemas.mergeReference.note.label'),
    required: false,
    aliases: [
      t('common.importPreview.schemas.mergeReference.note.aliases.remark'),
      t('common.importPreview.schemas.mergeReference.note.aliases.comment')
    ],
    description: t('common.importPreview.schemas.mergeReference.note.description'),
    example: t('common.importPreview.schemas.mergeReference.note.example')
  }
]))
const referencePreviewState = useTabularImportPreview({
  schema: referenceImportSchema,
  previewRowCount: 8,
  requireExplicitConfirmation: () => requireExplicitConfirmation.value
})
const referenceImportFlow = useTabularImportFlow({
  previewState: referencePreviewState,
  pendingFileRef: pendingReferenceFile,
  payloadRef: referenceImportPayload,
  confirmKeyRef: referenceImportConfirmKey,
  beforePreview: async (file) => {
    const authed = await requireAuth({
      message: t('tools.merge.validation.loginRequired'),
      redirect: '/explore/tools/merge',
    })
    if (!authed) {
      return false
    }

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      showError(t('tools.merge.validation.invalidFileType'))
      return false
    }

    if (file.size > 3 * 1024 * 1024) {
      showError(t('tools.merge.validation.referenceFileTooLarge'))
      return false
    }

    return true
  },
  createPreviewFile: async (file) => {
    if (file === DEFAULT_REFERENCE_SENTINEL) {
      const response = await fetch(DEFAULT_REFERENCE_PATH)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const blob = await response.blob()
      return new File([blob], DEFAULT_REFERENCE_FILE_NAME, {
        type: blob.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
    }
    return file
  },
  onAutoApply: async () => {
    await handleReferenceConfirm()
  },
  onPreviewError: (error) => {
    showError(t('tools.merge.messages.previewFailed', { message: error.message }))
  },
  resetInput: () => {
    if (refInput.value) {
      refInput.value.value = ''
    }
  }
})
const isReferenceImportReady = computed(() => referenceImportFlow.isReady.value)
const referenceImportSummary = computed(() => {
  if (!referenceImportPayload.value) {
    return ''
  }

  const mappedCount = Object.values(referenceImportPayload.value.mapping || {}).filter(Boolean).length
  const columnCount = referenceImportPayload.value.sourceColumns?.length || 0
  return t('common.importPreview.mergeReferenceSummary', {
    mappedCount,
    columnCount
  })
})

const handleRefSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    referenceImportFlow.loadPreview(file)
  }
}

const handleRefDrop = (event) => {
  dragOver1.value = false
  const file = event.dataTransfer.files[0]
  if (file) {
    referenceImportFlow.loadPreview(file)
  }
}

const resetMergeStats = () => {
  mergeStats.total = 0
  mergeStats.processed = 0
  mergeStats.success = 0
  mergeStats.totalRows = 0
  mergeStats.totalFiles = 0
  mergeStats.totalColumns = 0
}

const isFailedProgressStatus = (status) => status === 'failed' || status === 'error'

const normalizePercentProgress = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return 0
  }

  return Math.min(100, Math.max(0, Math.round(numeric)))
}

const setReferenceFile = async (file, options = {}) => {
  const authed = await requireAuth({
    message: t('tools.merge.validation.loginRequired'),
    redirect: '/explore/tools/merge',
  })
  if (!authed) {
    return
  }

  if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
    showError(t('tools.merge.validation.invalidFileType'))
    return
  }

  if (file.size > 3 * 1024 * 1024) {
    showError(t('tools.merge.validation.referenceFileTooLarge'))
    return
  }

  try {
    const data = await uploadReference(file, options)

    referenceFile.value = file
    taskId.value = data.task_id

    referenceStats.charCount = data.char_count || 0
    referenceStats.columnCount = data.column_count || 0
    pendingReferenceFile.value = null
    referenceImportPayload.value = null
    referencePreviewState.resetState()
  } catch (error) {
    showError(t('tools.merge.messages.uploadFailed', { message: error.message }))
  }
}

const previewReferenceFile = async (file) => {
  await referenceImportFlow.loadPreview(file)
}

const handleReferenceMappingUpdate = ({ fieldKey, sourceKey }) => {
  referencePreviewState.updateMapping(fieldKey, sourceKey)
  referenceImportPayload.value = referencePreviewState.summary.value
}

const clearPendingReference = () => {
  referenceImportFlow.clearPreview()
}

const removeReference = () => {
  referenceFile.value = null
  referenceImportFlow.clearPreview()
  referenceStats.charCount = 0
  referenceStats.columnCount = 0
}

const handleFilesSelect = (event) => {
  const files = Array.from(event.target.files)
  addFiles(files)
}

const handleFilesDrop = (event) => {
  dragOver2.value = false
  const files = Array.from(event.dataTransfer.files)
  addFiles(files)
}

const addFiles = async (files) => {
  if (mergeFiles.value.length + files.length > 20) {
    showError(t('tools.merge.validation.maxFiles', { count: mergeFiles.value.length }))
    return
  }

  const validFiles = files.filter(file => file.name.match(/\.(xlsx|xls)$/i))

  if (validFiles.length !== files.length) {
    showError(t('tools.merge.validation.partialInvalid'))
  }

  if (validFiles.length === 0) return

  const oversizedFiles = validFiles.filter(file => file.size > 3 * 1024 * 1024)
  if (oversizedFiles.length > 0) {
    showError(t('tools.merge.validation.fileTooLarge', {
      files: oversizedFiles.map((currentFile) => currentFile.name).join(', ')
    }))
    return
  }

  try {
    await uploadFiles(taskId.value, validFiles)
    mergeFiles.value.push(...validFiles)
  } catch (error) {
    showError(t('tools.merge.messages.uploadFailed', { message: error.message }))
  }
}

const removeFile = (index) => {
  mergeFiles.value.splice(index, 1)
}

const goToStep = (step) => {
  currentStep.value = step
}

const nextStep = () => {
  if (currentStep.value < 3) {
    currentStep.value++
  }
}

const handleReferenceConfirm = async () => {
  if (referenceFile.value) {
    nextStep()
    return
  }

  if (!pendingReferenceFile.value || !referenceImportPayload.value?.isComplete) {
    showError(t('common.importPreview.messages.mappingIncomplete'))
    return
  }

  const activeSheet = referencePreviewState.previewTable.value?.activeSheet
  const columnMapping = {
    headerChar: referencePreviewState.mapping.value.char || null,
    headerIpa: referencePreviewState.mapping.value.pronunciation || null,
    headerNotes: referencePreviewState.mapping.value.note || null
  }

  await setReferenceFile(pendingReferenceFile.value, {
    columnMapping,
    headerRowIndex: referencePreviewState.headerRowIndex.value,
    sheetName: activeSheet?.name || null
  })
  if (referenceFile.value) {
    nextStep()
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const startMerge = async () => {
  currentStep.value = 3
  processing.value = true
  progress.value = 0
  processingText.value = t('tools.merge.processing.initializing')
  resetMergeStats()
  mergeStats.total = mergeFiles.value.length

  try {
    await executeMerge(taskId.value)
    processingText.value = t('tools.merge.processing.running')

    await mergePollingTask.start(
      () => getMergeProgress(taskId.value),
      {
        onTick: (progressData) => {
          if (progressData.progress !== undefined && progressData.progress !== null) {
            progress.value = normalizePercentProgress(progressData.progress)
          }
          processingText.value = progressData.message || t('tools.merge.processing.running')

          if (progressData.processed !== undefined) {
            mergeStats.processed = progressData.processed
            mergeStats.success = progressData.processed
          }

          if (isFailedProgressStatus(progressData.status)) {
            processing.value = false
            showError(t('tools.merge.messages.progressFailed', {
              message: progressData.error || progressData.message || t('tools.merge.processing.running')
            }))
            reset()
            return
          }

          if (progressData.status === 'completed') {
            progress.value = 100
            processingText.value = t('tools.common.completed')
            mergeStats.totalRows = progressData.total_rows || 0
            mergeStats.totalFiles = mergeStats.total
            mergeStats.totalColumns = progressData.total_columns || 0
            mergedFilesList.value = mergeFiles.value.map((file) => ({ name: file.name }))
            processing.value = false
          }
        },
        shouldStop: (progressData) => (
          progressData.status === 'completed' ||
          isFailedProgressStatus(progressData.status)
        ),
        onError: (error) => {
          showError(t('tools.merge.messages.progressFailed', { message: error.message }))
          reset()
        },
        onMaxFailures: (error) => {
          showError(t('tools.merge.messages.progressFailed', { message: error.message }))
          reset()
        }
      }
    )
  } catch (error) {
    showError(t('tools.merge.messages.mergeFailed', { message: error.message }))
    reset()
  }
}

const downloadMerged = async () => {
  try {
    if (!taskId.value) {
      showError(t('tools.merge.messages.taskMissing'))
      return
    }

    const blob = await downloadMerge(taskId.value)

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = MERGE_RESULT_FILE_NAME
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    showError(t('tools.merge.messages.downloadFailed', { message: error.message }))
  }
}

const previewDefaultReference = async () => {
  if (isLoadingRef.value) return

  await referenceImportFlow.loadPreview(DEFAULT_REFERENCE_SENTINEL)
}

const downloadDefaultReference = async () => {
  try {
    const response = await fetch(DEFAULT_REFERENCE_PATH)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const blob = await response.blob()

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = DEFAULT_REFERENCE_FILE_NAME
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    showSuccess(t('tools.merge.messages.defaultDownloaded'))
  } catch (error) {
    showError(t('tools.merge.messages.downloadFailed', { message: error.message }))
  }
}

const useDefaultReference = async () => {
  try {
    const wbout = XLSX.write(defaultRefWorkbook.value, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

    const file = new File([blob], DEFAULT_REFERENCE_FILE_NAME, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    await setReferenceFile(file)

    showDefaultRefModal.value = false
    showSuccess(t('tools.merge.messages.useDefaultSuccess'))
  } catch (error) {
    showError(t('tools.merge.messages.useDefaultFailed', { message: error.message }))
  }
}

const reset = () => {
  mergePollingTask.stop()
  currentStep.value = 1
  referenceFile.value = null
  referenceImportFlow.clearPreview()
  mergeFiles.value = []
  processing.value = false
  progress.value = 0
  processingText.value = ''
  taskId.value = null
  referenceStats.charCount = 0
  referenceStats.columnCount = 0
  resetMergeStats()
  mergedFilesList.value = []

  if (refInput.value) refInput.value.value = ''
  if (filesInput.value) filesInput.value.value = ''
}
</script>

```scss
<style scoped lang="scss">
$color-text: #0b2540;
$color-primary: #007aff;
$color-success: #34c759;
$color-danger: #ff3b30;

.merge-tool-container {
  height: 80%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5px;
  padding-top: 60px;
}

.glass-container {
  width: min(95dvw, 800px);
  padding: 30px 40px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.header-section {
  text-align: center;
}

.title {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: $color-text;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: rgba(11, 37, 64, 0.7);
}

.steps-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 20px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: default;
  transition: all 0.3s ease;

  &.completed {
    cursor: pointer;

    .step-number {
      background: rgba(52, 199, 89, 0.7);
      border-color: rgba(52, 199, 89, 0.6);
      color: white;
    }
  }

  &.active {
    .step-number {
      background: linear-gradient(
        135deg,
        rgba(0, 122, 255, 0.8),
        rgba(0, 122, 255, 0.6)
      );
      border-color: rgba(0, 122, 255, 0.6);
      color: white;
      box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
    }

    .step-label {
      color: $color-text;
    }
  }

  &-number {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.5);
    border: 2px solid rgba(11, 37, 64, 0.2);
    border-radius: 50%;
    font-size: 18px;
    font-weight: 600;
    color: rgba(11, 37, 64, 0.5);
    transition: all 0.3s ease;
  }

  &-label {
    font-size: 13px;
    font-weight: 500;
    color: rgba(11, 37, 64, 0.6);
    transition: color 0.3s ease;
  }

  &-line {
    width: 60px;
    height: 2px;
    background: rgba(11, 37, 64, 0.2);
    transition: background 0.3s ease;

    &.active {
      background: rgba(0, 122, 255, 0.6);
    }
  }
}

.content-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  animation: fadeIn 0.4s ease;
}

.step-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: $color-text;
  text-align: center;
}

.step-desc {
  margin: 0;
  font-size: 14px;
  color: rgba(11, 37, 64, 0.7);
  text-align: center;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.upload {
  &-zone {
    padding: 10px 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 2px dashed rgba(0, 122, 255, 0.3);
    border-radius: 24px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(0, 122, 255, 0.05);
      border-color: rgba(0, 122, 255, 0.6);
    }

    &.has-file {
      cursor: default;
      border-style: solid;
      background: rgba(52, 199, 89, 0.05);
      border-color: rgba(52, 199, 89, 0.4);
    }
  }

  &-icon {
    font-size: 40px;
    animation: float 3s ease-in-out infinite;
  }

  &-text {
    font-size: 18px;
    font-weight: 500;
    color: $color-text;
  }

  &-hint {
    font-size: 13px;
    color: rgba(11, 37, 64, 0.6);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8px);
  }
}

.file {
  &-info-card {
    width: 100%;
    max-width: 500px;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px 24px;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 16px;
  }

  &-icon {
    font-size: 36px;
  }

  &-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &-name {
    font-size: 15px;
    font-weight: 500;
    color: $color-text;
  }

  &-meta {
    display: flex;
    gap: 16px;
    font-size: 13px;
    color: rgba(11, 37, 64, 0.7);
  }

  &-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
    padding: 12px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 16px;
  }

  &-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 12px;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.7);
    }

    &-icon {
      font-size: 20px;
    }

    &-name {
      flex: 1;
      font-size: 14px;
      color: $color-text;
    }

    &-remove {
      width: 28px;
      height: 28px;
      background: rgba(255, 59, 48, 0.2);
      border: 1px solid rgba(255, 59, 48, 0.3);
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 59, 48, 0.7);
        transform: scale(1.1);
      }
    }
  }
}

.remove-btn {
  width: 32px;
  height: 32px;
  background: rgba(255, 59, 48, 0.2);
  border: 1px solid rgba(255, 59, 48, 0.4);
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 59, 48, 0.7);
    color: white;
    transform: scale(1.1);
  }
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: $color-text;
}

.step-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-top: 12px;
}

.processing-view,
.complete-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 15px 20px;
}

.processing {
  &-icon {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &-title {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: $color-text;
  }

  &-text {
    margin: 0;
    font-size: 15px;
    color: rgba(11, 37, 64, 0.7);
  }

  &-details {
    display: flex;
    gap: 24px;
    padding: 20px 32px;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 16px;
  }
}

.complete {
  &-title {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: $color-text;
  }

  &-text {
    margin: 0;
    font-size: 15px;
    color: rgba(11, 37, 64, 0.7);
  }

  &-icon {
    font-size: 80px;
    animation: scaleIn 0.5s ease;
  }
}

.progress {
  &-container {
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &-bar {
    width: 100%;
    height: 12px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 6px;
  }

  &-fill {
    height: 100%;
    background: linear-gradient(
      90deg,
      rgba(0, 122, 255, 0.8),
      rgba(0, 195, 255, 0.8)
    );
    border-radius: 6px;
    transition: width 0.3s ease;
  }

  &-label {
    text-align: center;
    font-size: 14px;
    font-weight: 600;
    color: $color-text;
  }
}

.detail-item {
  display: flex;
  gap: 8px;
  font-size: 14px;

  .label {
    color: rgba(11, 37, 64, 0.7);
  }

  .value {
    font-weight: 600;
    color: $color-text;

    &.success {
      color: $color-success;
    }
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.result {
  &-summary {
    display: flex;
    gap: 16px;
  }

  &-actions {
    display: flex;
    gap: 16px;
  }
}

.summary {
  &-card {
    min-width: 140px;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 28px;
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 20px;
  }

  &-icon {
    font-size: 32px;
  }

  &-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &-number {
    font-size: 28px;
    font-weight: 700;
    color: $color-text;
  }

  &-label {
    font-size: 13px;
    color: rgba(11, 37, 64, 0.7);
  }
}

.merged {
  &-files-info {
    width: 100%;
    max-width: 500px;
    margin-top: 16px;
  }

  &-list {
    max-height: 150px;
    overflow-y: auto;
    padding: 12px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 16px;
  }

  &-item {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 10px;
    font-size: 14px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &-index {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 122, 255, 0.2);
    border-radius: 50%;
    font-size: 12px;
    font-weight: 600;
    color: rgba(0, 122, 255, 0.9);
  }

  &-name {
    flex: 1;
    color: $color-text;
  }

  &-status {
    font-size: 12px;
    font-weight: 500;
    color: $color-success;
  }
}

.info-title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: $color-text;
}

/* 默认参考表模态框 */
.merge-default-ref {
  &-tabs {
    display: flex;
    gap: 8px;
    padding: 12px 28px;
    background: rgba(255, 255, 255, 0.3);
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  &-content {
    min-height: 0;
  }

  &-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin: 0 -24px -20px;
    padding: 16px 24px;
    background: rgba(255, 255, 255, 0.3);
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }
}

.tab-btn {
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(11, 37, 64, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.6);
    color: $color-text;
  }

  &.active {
    background: rgba(0, 122, 255, 0.12);
    color: $color-primary;
    font-weight: 600;
  }
}

.table-container {
  height: 100%;
  max-height: 60dvh;
  overflow: auto;
  padding: 16px 28px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  thead {
    position: sticky;
    top: 0;
    z-index: 10;
    background: rgba(0, 122, 255, 0.08);
  }

  th {
    padding: 10px 12px;
    border-bottom: 2px solid rgba(0, 122, 255, 0.2);
    text-align: left;
    white-space: nowrap;
    font-size: 13px;
    font-weight: 600;
    color: $color-text;
  }

  td {
    padding: 8px 12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    font-size: 13px;
    color: rgba(11, 37, 64, 0.85);
  }

  tbody {
    tr {
      &:hover {
        background: rgba(0, 122, 255, 0.04);
      }
    }
  }
}

.load-more-hint {
  margin-top: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  text-align: center;
  font-size: 12px;
  color: rgba(11, 37, 64, 0.5);
}

@media (max-width: 768px) {
  .glass-container {
    width: 100%;
    min-height: auto;
    padding: 20px 16px;
    border-radius: 20px;
  }

  .title {
    font-size: 22px;
  }

  .subtitle {
    font-size: 13px;
  }

  .steps-indicator {
    flex-wrap: nowrap;
    gap: 8px;
    padding: 10px;
    overflow-x: auto;
  }

  .step {
    min-width: 80px;

    &-number {
      width: 32px;
      height: 32px;
      font-size: 14px;
    }

    &-label {
      font-size: 12px;
    }

    &-line {
      width: 30px;
      min-width: 30px;
    }
  }

  .content-area {
    padding: 16px 12px;
  }

  .step-title {
    font-size: 20px;
  }

  .step-desc {
    font-size: 13px;
  }

  .upload {
    &-zone {
      padding: 24px 20px;
      border-radius: 16px;
    }

    &-icon {
      font-size: 48px;
    }

    &-text {
      font-size: 15px;
    }

    &-hint {
      font-size: 12px;
    }
  }

  .file {
    &-info-card {
      gap: 10px;
      padding: 12px;
    }

    &-details {
      gap: 6px;
    }

    &-name {
      font-size: 14px;
    }

    &-meta {
      flex-wrap: wrap;
      font-size: 12px;
    }

    &-items {
      gap: 8px;
    }

    &-item {
      gap: 10px;
      padding: 10px 12px;

      &-name {
        font-size: 13px;
      }
    }
  }

  .files-list {
    gap: 12px;
  }

  .list-title {
    font-size: 15px;
  }

  .step-actions {
    flex-direction: column;
    gap: 10px;
    padding-top: 16px;
  }

  .main-glass-button,
  .main-glass-button[data-size='large'] {
    width: 100%;
    justify-content: center;
    padding: 8px 24px;
  }

  .processing {
    &-icon {
      width: 80px;
      height: 80px;
    }

    &-title {
      font-size: 20px;
    }

    &-text {
      font-size: 14px;
    }

    &-details {
      flex-direction: column;
      gap: 12px;
      padding: 16px 20px;
    }
  }

  .progress-bar-container {
    max-width: 100%;
  }

  .complete {
    &-icon {
      font-size: 60px;
    }

    &-title {
      font-size: 22px;
    }
  }

  .result {
    &-summary {
      width: 100%;
      flex-direction: column;
      gap: 12px;
    }

    &-actions {
      width: 100%;
      flex-direction: column;
      gap: 10px;
    }
  }

  .summary {
    &-card {
      width: 100%;
      padding: 16px;
    }

    &-number {
      font-size: 26px;
    }

    &-label {
      font-size: 13px;
    }
  }

  .merged {
    &-files-info {
      margin-top: 20px;
    }

    &-list {
      gap: 8px;
    }

    &-item {
      padding: 10px 12px;
      font-size: 13px;
    }
  }

  .info-title {
    font-size: 15px;
  }

  /* 默认参考表模态框移动端适配 */
  .merge-default-ref {
    &-tabs {
      gap: 6px;
      padding: 10px 16px;
      overflow-x: auto;
    }

    &-footer {
      flex-direction: column;
      gap: 8px;
      margin-inline: -24px;
      margin-bottom: -20px;
      padding: 12px 16px;

      .main-glass-button {
        width: 100%;
      }
    }
  }

  .tab-btn {
    padding: 8px 14px;
    white-space: nowrap;
    font-size: 13px;
  }

  .table-container {
    max-height: 50dvh;
    padding: 12px 16px;
  }

  .data-table {
    font-size: 11px;

    th,
    td {
      padding: 6px 8px;
    }
  }

  .load-more-hint {
    padding: 10px;
    font-size: 11px;
  }
}

/* 额外的小屏幕适配 */
@media (max-width: 480px) {
  .glass-container {
    padding: 16px 12px;
  }

  .title {
    font-size: 20px;
  }

  .steps-indicator {
    gap: 6px;
    padding: 8px;
  }

  .step {
    &-number {
      width: 28px;
      height: 28px;
      font-size: 12px;
    }

    &-label {
      font-size: 11px;
    }

    &-line {
      width: 20px;
      min-width: 20px;
    }
  }

  .upload-zone {
    padding: 20px 16px;
  }

  .data-table {
    font-size: 10px;

    th,
    td {
      padding: 4px 6px;
    }
  }
}
</style>
```

