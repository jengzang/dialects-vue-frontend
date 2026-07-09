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
              @click="showDefaultReference"
              :disabled="isLoadingRef"
            >
              <span class="icon">{{ isLoadingRef ? '⏳' : '👁️' }}</span>
              <span>
                {{ isLoadingRef ? t('tools.merge.reference.loadingDefault') : t('tools.merge.reference.viewDefault') }}
              </span>
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

    <AppModal
      :model-value="showDefaultRefModal"
      size="lg"
      :title="t('tools.merge.modal.title')"
      :close-label="t('tools.common.close')"
      :z-index="1500"
      @update:modelValue="showDefaultRefModal = false"
    >
      <div class="merge-default-ref-tabs">
          <button
            class="tab-btn"
            :class="{ active: currentTab === 'main' }"
            @click="currentTab = 'main'"
          >
            {{ t('tools.merge.modal.mainTable') }} ({{ mainTableData.length }})
          </button>
          <button
            class="tab-btn"
            :class="{ active: currentTab === 'supplement' }"
            @click="currentTab = 'supplement'"
          >
            {{ t('tools.merge.modal.supplementTable') }} ({{ supplementTableData.length }})
          </button>
        </div>

      <div class="merge-default-ref-content">
        <div class="table-container ui-scrollbar">
            <table v-if="currentTab === 'main'" class="data-table">
              <thead>
                <tr>
                  <th v-for="(col, index) in mainTableHeaders" :key="index">{{ col }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in displayedMainData" :key="index">
                  <td v-for="(cell, cellIndex) in row" :key="cellIndex">{{ cell || '' }}</td>
                </tr>
              </tbody>
            </table>

            <table v-if="currentTab === 'supplement'" class="data-table">
              <thead>
                <tr>
                  <th v-for="(col, index) in supplementTableHeaders" :key="index">{{ col }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in displayedSupplementData" :key="index">
                  <td v-for="(cell, cellIndex) in row" :key="cellIndex">{{ cell || '' }}</td>
                </tr>
              </tbody>
            </table>

            <div v-if="hasMoreData" class="load-more-hint">
              {{
                t('tools.merge.modal.showingRows', {
                  displayed: maxDisplayRows,
                  total: currentTab === 'main' ? mainTableData.length : supplementTableData.length
                })
              }}
            </div>
        </div>
      </div>

      <template #footer>
<!--        <div class="merge-default-ref-footer">-->
        <button class="main-glass-button" data-variant="primary" @click="downloadDefaultReference">
            <span class="icon">⬇️</span>
            <span>{{ t('tools.merge.modal.downloadDefault') }}</span>
          </button>
          <button
              class="main-glass-button"
              data-variant="secondary"
              @click="useDefaultReference"
              style="background: rgba(31,138,54,0.43)"
          >
            <span class="icon">✅</span>
            <span>{{ t('tools.merge.modal.useDefault') }}</span>
        </button>
<!--        </div>-->
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import * as XLSX from 'xlsx'
import AppModal from '@/components/common/AppModal.vue'
import TabularImportPreview from '@/components/import/TabularImportPreview.vue'
import { downloadMerge, executeMerge, getMergeProgress, uploadFiles, uploadReference } from '@/api'
import { showError, showSuccess } from '@/utils/message.js'
import { useAsyncTask } from '@/composables/core/useAsyncTask.js'
import { usePollingTask } from '@/composables/core/usePollingTask.js'
import { useAuthGuard } from '@/composables/router/useAuthGuard.js'
import { useTabularImportPreview } from '@/composables/import/useTabularImportPreview.js'
import defaultReferenceWorkbookUrl from '/data/参考表.xlsx?url'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'

const { t } = useI18n()
const { requireAuth } = useAuthGuard({
  defaultRedirect: '/explore/tools/merge',
})

const DEFAULT_REFERENCE_PATH = defaultReferenceWorkbookUrl
const DEFAULT_REFERENCE_FILE_NAME = '参考表.xlsx'
const MAIN_SHEET_NAME = '主表'
const SUPPLEMENT_SHEET_NAME = '補充表'
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
const shouldAlwaysConfirmReferenceImport = ref(false)

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
const loadDefaultReferenceTask = useAsyncTask()
const mergePollingTask = usePollingTask({
  intervalMs: 1000,
  maxFailures: 3,
})

// 默认参考表相关
const showDefaultRefModal = ref(false)
const currentTab = ref('main')
const mainTableHeaders = ref([])
const mainTableData = ref([])
const supplementTableHeaders = ref([])
const supplementTableData = ref([])
const defaultRefWorkbook = ref(null)
const maxDisplayRows = 500 // 限制显示行数，提升性能
const isLoadingRef = loadDefaultReferenceTask.loading

// 计算属性：限制显示的数据量
const displayedMainData = computed(() => mainTableData.value.slice(0, maxDisplayRows))
const displayedSupplementData = computed(() => supplementTableData.value.slice(0, maxDisplayRows))
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
  requireExplicitConfirmation: () => shouldAlwaysConfirmReferenceImport.value
})
const isReferenceImportReady = computed(() => !!referenceImportPayload.value?.isComplete)
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
const hasMoreData = computed(() => {
  if (currentTab.value === 'main') {
    return mainTableData.value.length > maxDisplayRows
  } else {
    return supplementTableData.value.length > maxDisplayRows
  }
})

const handleRefSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    previewReferenceFile(file)
  }
}

const handleRefDrop = (event) => {
  dragOver1.value = false
  const file = event.dataTransfer.files[0]
  if (file) {
    previewReferenceFile(file)
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

  pendingReferenceFile.value = file
  referenceImportConfirmKey.value += 1

  try {
    await referencePreviewState.loadFile(file)
    referenceImportPayload.value = referencePreviewState.summary.value

    if (referencePreviewState.canAutoApply.value) {
      await handleReferenceConfirm()
    }
  } catch (error) {
    pendingReferenceFile.value = null
    referenceImportPayload.value = null
    referencePreviewState.resetState()
    showError(t('tools.merge.messages.previewFailed', { message: error.message }))
  }
}

const handleReferenceMappingUpdate = ({ fieldKey, sourceKey }) => {
  referencePreviewState.updateMapping(fieldKey, sourceKey)
  referenceImportPayload.value = referencePreviewState.summary.value
}

const clearPendingReference = () => {
  pendingReferenceFile.value = null
  referenceImportPayload.value = null
  referencePreviewState.resetState()
  if (refInput.value) {
    refInput.value.value = ''
  }
}

const removeReference = () => {
  referenceFile.value = null
  pendingReferenceFile.value = null
  referenceImportPayload.value = null
  referenceStats.charCount = 0
  referenceStats.columnCount = 0
  referencePreviewState.resetState()
  if (refInput.value) {
    refInput.value.value = ''
  }
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

const showDefaultReference = async () => {
  if (isLoadingRef.value) return

  await loadDefaultReferenceTask.run(async () => {
    const response = await fetch(DEFAULT_REFERENCE_PATH)
    const arrayBuffer = await response.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    defaultRefWorkbook.value = workbook

    if (workbook.SheetNames.includes(MAIN_SHEET_NAME)) {
      const mainSheet = workbook.Sheets[MAIN_SHEET_NAME]
      const mainData = XLSX.utils.sheet_to_json(mainSheet, { header: 1 })
      if (mainData.length > 0) {
        mainTableHeaders.value = mainData[0]
        mainTableData.value = mainData.slice(1)
      }
    }

    if (workbook.SheetNames.includes(SUPPLEMENT_SHEET_NAME)) {
      const supplementSheet = workbook.Sheets[SUPPLEMENT_SHEET_NAME]
      const supplementData = XLSX.utils.sheet_to_json(supplementSheet, { header: 1 })
      if (supplementData.length > 0) {
        supplementTableHeaders.value = supplementData[0]
        supplementTableData.value = supplementData.slice(1)
      }
    }

    showDefaultRefModal.value = true
    currentTab.value = 'main'
  }, {
    onError: (error) => {
      showError(t('tools.merge.messages.readDefaultFailed', { message: error.message }))
    }
  })
}

const downloadDefaultReference = async () => {
  try {
    const response = await fetch(DEFAULT_REFERENCE_PATH)
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

<style scoped>
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
  font-size: 28px;
  font-weight: 600;
  color: #0b2540;
  margin: 0;
}

.subtitle {
  font-size: 14px;
  color: rgba(11, 37, 64, 0.7);
  margin: 0;
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
}

.step.completed {
  cursor: pointer;
}

.step-number {
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

.step.active .step-number {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.8), rgba(0, 122, 255, 0.6));
  border-color: rgba(0, 122, 255, 0.6);
  color: white;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
}

.step.completed .step-number {
  background: rgba(52, 199, 89, 0.7);
  border-color: rgba(52, 199, 89, 0.6);
  color: white;
}

.step-label {
  font-size: 13px;
  font-weight: 500;
  color: rgba(11, 37, 64, 0.6);
  transition: color 0.3s ease;
}

.step.active .step-label {
  color: #0b2540;
}

.step-line {
  width: 60px;
  height: 2px;
  background: rgba(11, 37, 64, 0.2);
  transition: background 0.3s ease;
}

.step-line.active {
  background: rgba(0, 122, 255, 0.6);
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

.step-title {
  font-size: 22px;
  font-weight: 600;
  color: #0b2540;
  margin: 0;
  text-align: center;
}

.step-desc {
  font-size: 14px;
  color: rgba(11, 37, 64, 0.7);
  margin: 0;
  text-align: center;
}

.upload-zone {
  padding: 10px 40px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 2px dashed rgba(0, 122, 255, 0.3);
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.upload-zone:hover {
  background: rgba(0, 122, 255, 0.05);
  border-color: rgba(0, 122, 255, 0.6);
}

.upload-zone.has-file {
  cursor: default;
  border-style: solid;
  background: rgba(52, 199, 89, 0.05);
  border-color: rgba(52, 199, 89, 0.4);
}

.upload-icon {
  font-size: 40px;
  animation: float 3s ease-in-out infinite;
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

.upload-text {
  font-size: 18px;
  font-weight: 500;
  color: #0b2540;
}

.upload-hint {
  font-size: 13px;
  color: rgba(11, 37, 64, 0.6);
}

.file-info-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
}

.file-icon {
  font-size: 36px;
}

.file-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.file-name {
  font-size: 15px;
  font-weight: 500;
  color: #0b2540;
}

.file-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: rgba(11, 37, 64, 0.7);
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
}

.remove-btn:hover {
  background: rgba(255, 59, 48, 0.7);
  color: white;
  transform: scale(1.1);
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-title {
  font-size: 15px;
  font-weight: 600;
  color: #0b2540;
  margin: 0;
}

.file-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 16px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.file-item:hover {
  background: rgba(255, 255, 255, 0.7);
}

.file-item-icon {
  font-size: 20px;
}

.file-item-name {
  flex: 1;
  font-size: 14px;
  color: #0b2540;
}

.file-item-remove {
  width: 28px;
  height: 28px;
  background: rgba(255, 59, 48, 0.2);
  border: 1px solid rgba(255, 59, 48, 0.3);
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.file-item-remove:hover {
  background: rgba(255, 59, 48, 0.7);
  transform: scale(1.1);
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

.processing-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}



.processing-title,
.complete-title {
  font-size: 24px;
  font-weight: 600;
  color: #0b2540;
  margin: 0;
}

.processing-text,
.complete-text {
  font-size: 15px;
  color: rgba(11, 37, 64, 0.7);
  margin: 0;
}

.progress-container {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, rgba(0, 122, 255, 0.8), rgba(0, 195, 255, 0.8));
  border-radius: 6px;
  transition: width 0.3s ease;
}

.progress-label {
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #0b2540;
}

.processing-details {
  display: flex;
  gap: 24px;
  padding: 20px 32px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 16px;
}

.detail-item {
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.detail-item .label {
  color: rgba(11, 37, 64, 0.7);
}

.detail-item .value {
  font-weight: 600;
  color: #0b2540;
}

.detail-item .value.success {
  color: #34c759;
}

.complete-icon {
  font-size: 80px;
  animation: scaleIn 0.5s ease;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.result-summary {
  display: flex;
  gap: 16px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 28px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  min-width: 140px;
}

.summary-icon {
  font-size: 32px;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-number {
  font-size: 28px;
  font-weight: 700;
  color: #0b2540;
}

.summary-label {
  font-size: 13px;
  color: rgba(11, 37, 64, 0.7);
}

.result-actions {
  display: flex;
  gap: 16px;
}

.merged-files-info {
  width: 100%;
  max-width: 500px;
  margin-top: 16px;
}

.info-title {
  font-size: 15px;
  font-weight: 600;
  color: #0b2540;
  margin: 0 0 12px 0;
}

.merged-list {
  max-height: 150px;
  overflow-y: auto;
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 16px;
}

.merged-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  margin-bottom: 8px;
  font-size: 14px;
}

.merged-item:last-child {
  margin-bottom: 0;
}

.merged-index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(0, 122, 255, 0.2);
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  color: rgba(0, 122, 255, 0.9);
}

.merged-name {
  flex: 1;
  color: #0b2540;
}

.merged-status {
  font-size: 12px;
  color: #34c759;
  font-weight: 500;
}

/* 模态弹窗样式 */
.merge-default-ref-tabs {
  display: flex;
  gap: 8px;
  padding: 12px 28px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.3);
}

.merge-default-ref-content {
  min-height: 0;
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(11, 37, 64, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.6);
  color: #0b2540;
}

.tab-btn.active {
  background: rgba(0, 122, 255, 0.12);
  color: #007aff;
  font-weight: 600;
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
}

.data-table thead {
  position: sticky;
  top: 0;
  background: rgba(0, 122, 255, 0.08);
  z-index: 10;
}

.data-table th {
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: #0b2540;
  border-bottom: 2px solid rgba(0, 122, 255, 0.2);
  white-space: nowrap;
  font-size: 13px;
}

.data-table td {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  color: rgba(11, 37, 64, 0.85);
  font-size: 13px;
}

.data-table tbody tr:hover {
  background: rgba(0, 122, 255, 0.04);
}

.load-more-hint {
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: rgba(11, 37, 64, 0.5);
  background: rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  margin-top: 8px;
}

.merge-default-ref-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin: 0 -24px -20px;
  padding: 16px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.3);
}

@media (max-width: 768px) {
  .glass-container {
    padding: 20px 16px;
    border-radius: 20px;
    width: 100%;
    min-height: auto;
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
  }

  .step-number {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .step-label {
    font-size: 12px;
  }

  .step-line {
    width: 30px;
    min-width: 30px;
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

  .upload-zone {
    padding: 24px 20px;
    border-radius: 16px;
  }

  .upload-icon {
    font-size: 48px;
  }

  .upload-text {
    font-size: 15px;
  }

  .upload-hint {
    font-size: 12px;
  }

  .file-info-card {
    padding: 12px;
    gap: 10px;
  }

  .file-details {
    gap: 6px;
  }

  .file-name {
    font-size: 14px;
  }

  .file-meta {
    font-size: 12px;
    flex-wrap: wrap;
  }

  .files-list {
    gap: 12px;
  }

  .list-title {
    font-size: 15px;
  }

  .file-items {
    gap: 8px;
  }

  .file-item {
    padding: 10px 12px;
    gap: 10px;
  }

  .file-item-name {
    font-size: 13px;
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

  .processing-icon {
    width: 80px;
    height: 80px;
  }


  .processing-title {
    font-size: 20px;
  }

  .processing-text {
    font-size: 14px;
  }

  .progress-bar-container {
    max-width: 100%;
  }

  .processing-details {
    flex-direction: column;
    gap: 12px;
    padding: 16px 20px;
  }

  .complete-icon {
    font-size: 60px;
  }

  .complete-title {
    font-size: 22px;
  }

  .result-summary {
    flex-direction: column;
    width: 100%;
    gap: 12px;
  }

  .summary-card {
    width: 100%;
    padding: 16px;
  }

  .summary-number {
    font-size: 26px;
  }

  .summary-label {
    font-size: 13px;
  }

  .result-actions {
    flex-direction: column;
    width: 100%;
    gap: 10px;
  }

  .merged-files-info {
    margin-top: 20px;
  }

  .info-title {
    font-size: 15px;
  }

  .merged-list {
    gap: 8px;
  }

  .merged-item {
    padding: 10px 12px;
    font-size: 13px;
  }

  /* 默认参考表模态框移动端适配 */
  .merge-default-ref-tabs {
    padding: 10px 16px;
    gap: 6px;
    overflow-x: auto;
  }

  .tab-btn {
    padding: 8px 14px;
    font-size: 13px;
    white-space: nowrap;
  }

  .table-container {
    max-height: 50dvh;
    padding: 12px 16px;
  }

  .data-table {
    font-size: 11px;
  }

  .data-table th,
  .data-table td {
    padding: 6px 8px;
  }

  .load-more-hint {
    padding: 10px;
    font-size: 11px;
  }

  .merge-default-ref-footer {
    margin-inline: -24px;
    margin-bottom: -20px;
    padding: 12px 16px;
    flex-direction: column;
    gap: 8px;
  }

  .merge-default-ref-footer .main-glass-button {
    width: 100%;
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
    padding: 8px;
    gap: 6px;
  }

  .step-number {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .step-label {
    font-size: 11px;
  }

  .step-line {
    width: 20px;
    min-width: 20px;
  }

  .upload-zone {
    padding: 20px 16px;
  }

  .data-table {
    font-size: 10px;
  }

  .data-table th,
  .data-table td {
    padding: 4px 6px;
  }
}

</style>
