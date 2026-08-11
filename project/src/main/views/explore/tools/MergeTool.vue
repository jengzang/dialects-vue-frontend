<template>
  <div class="merge-tool-container">
    <div class="glass-container glass-shell" style="max-height: 80dvh;overflow: auto;">
      <div class="header-section">
        <h1 class="title"><BarIcon icon="🔗" />{{ t('tools.merge.page.title') }}</h1>
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
              <div class="upload-icon"><InlineIcon icon="📋" /></div>
              <div class="upload-text">{{ t('tools.merge.reference.uploadText') }}</div>
              <div class="upload-hint">{{ t('tools.merge.reference.uploadHint') }}</div>
            </template>

            <template v-else>
              <div class="file-info-card">
                <div class="file-icon"><InlineIcon icon="✅" /></div>
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
                ><InlineIcon icon="✕" /></button>
              </div>
            </template>
          </div>

          <TabularImportPreview
            v-if="pendingReferenceFile"
            :key="referenceImportConfirmKey"
            :model-value="Boolean(pendingReferenceFile)"
            :title="t('common.importPreview.referenceTitle')"
            :description="t('common.importPreview.referenceDescription')"
            :source="referencePreviewSource"
            :file="pendingReferenceFile"
            :schema="referenceImportSchema"
            :mapping-enabled="!isDefaultReferencePreview"
            :loading="referencePreviewState.loading.value"
            :preview-table="referencePreviewState.previewTable.value"
            :diagnostics="referencePreviewState.diagnostics.value"
            :mapping="referencePreviewState.mapping.value"
            :selected-sheet-id="referencePreviewState.selectedSheetId.value"
            :header-row-index="referencePreviewState.headerRowIndex.value"
            :sheets="referencePreviewState.parsedFile.value?.sheets || []"
            @update:selected-sheet-id="referencePreviewState.selectedSheetId.value = $event"
            @update:header-row-index="referencePreviewState.headerRowIndex.value = $event"
            @update:mapping="handleReferenceMappingUpdate"
            @reset="clearPendingReference"
            @confirm="handleReferenceConfirm"
          />

          <div class="step-actions">
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
              class="main-glass-button"
              data-variant="primary"
              data-size="large"
              :disabled="!referenceFile"
              @click="handleReferenceConfirm"
            >
              {{ `${t('tools.merge.reference.next')} →` }}
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
                style="display: inline-block; padding: 2px 8px; margin: 0 2px; vertical-align: middle;background: var(--color-primary);"
                @click="$router.push(buildLocalePath(resolveRouteLocale(route), '/explore/tools/check'))"
            >
              {{ t('tools.merge.files.checkTool') }}
            </button>
            {{ t('tools.merge.files.descSuffix') }}
          </p>

          <div class="preview-toggle">
            <CheckBox v-model="previewEnabled" :label="t('tools.merge.files.enablePreview')" />
          </div>

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
            <div class="upload-icon"><InlineIcon icon="📁" /></div>
            <div class="upload-text">{{ t('tools.merge.files.uploadText') }}</div>
            <div class="upload-hint">{{ t('tools.merge.files.uploadHint') }}</div>
          </div>

          <TabularImportPreview
            v-if="pendingMergeFile"
            :key="mergeImportConfirmKey"
            :model-value="Boolean(pendingMergeFile)"
            :title="t('common.importPreview.mergeFileTitle')"
            :description="t('common.importPreview.mergeFileDescription')"
            :file="pendingMergeFile"
            :schema="mergeFileImportSchema"
            :loading="mergeFilePreviewState.loading.value"
            :preview-table="mergeFilePreviewState.previewTable.value"
            :diagnostics="mergeFilePreviewState.diagnostics.value"
            :mapping="mergeFilePreviewState.mapping.value"
            :selected-sheet-id="mergeFilePreviewState.selectedSheetId.value"
            :header-row-index="mergeFilePreviewState.headerRowIndex.value"
            :sheets="mergeFilePreviewState.parsedFile.value?.sheets || []"
            @update:selected-sheet-id="mergeFilePreviewState.selectedSheetId.value = $event"
            @update:header-row-index="mergeFilePreviewState.headerRowIndex.value = $event"
            @update:mapping="handleMergeFileMappingUpdate"
            @reset="clearPendingMergeFile"
            @confirm="handleMergeFileConfirm"
          />

          <div class="files-list" v-if="pendingMergeFiles.length > 0">
            <h4 class="list-title">{{ t('tools.merge.files.pendingCount', { count: pendingMergeFiles.length }) }}</h4>
            <div class="file-items">
              <div
                v-for="(item, index) in pendingMergeFiles"
                :key="index"
                class="file-item"
                :class="{ 'file-item--mapped': item.mapped }"
                @click="!item.mapped && loadMergeFilePreview(item.file)"
              >
                <div class="file-item-icon">{{ item.mapped ? '✅' : '📄' }}</div>
                <div class="file-item-name">{{ item.file.name }}</div>
                <div class="file-item-status">
                  {{ item.mapped ? t('tools.merge.files.mapped') : t('tools.merge.files.pendingMapping') }}
                </div>
                <button v-if="!item.mapped" class="file-item-remove" @click.stop="removePendingFile(index)"><InlineIcon icon="🗑️" /></button>
              </div>
            </div>
          </div>

          <div class="files-list" v-if="!previewEnabled && mergeFiles.length > 0">
            <h4 class="list-title">{{ t('tools.merge.files.selectedCount', { count: mergeFiles.length }) }}</h4>
            <div class="file-items">
              <div
                v-for="(file, index) in mergeFiles"
                :key="index"
                class="file-item"
              >
                <div class="file-item-icon"><InlineIcon icon="📄" /></div>
                <div class="file-item-name">{{ file.name }}</div>
                <button class="file-item-remove" @click="removeFile(index)"><InlineIcon icon="🗑️" /></button>
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
              :disabled="!canStartMerge"
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
            <h3 class="complete-title"><InlineIcon icon="✅" />{{ t('tools.merge.complete.title') }}</h3>
            <p class="complete-text">{{ t('tools.merge.complete.text') }}</p>

            <div class="result-summary">
<!--              <div class="summary-card">-->
<!--                <div class="summary-icon"><InlineIcon icon="📊" /></div>-->
<!--                <div class="summary-content">-->
<!--                  <div class="summary-number">{{ mergeStats.totalRows }}</div>-->
<!--                  <div class="summary-label">總行數</div>-->
<!--                </div>-->
<!--              </div>-->
              <div class="summary-card">
                <div class="summary-icon"><InlineIcon icon="📁" /></div>
                <div class="summary-content">
                  <div class="summary-number">{{ mergeStats.totalFiles }}</div>
                  <div class="summary-label">{{ t('tools.merge.summary.mergedFileCount') }}</div>
                </div>
              </div>
<!--              <div class="summary-card">-->
<!--                <div class="summary-icon"><InlineIcon icon="📋" /></div>-->
<!--                <div class="summary-content">-->
<!--                  <div class="summary-number">{{ mergeStats.totalColumns }}</div>-->
<!--                  <div class="summary-label">總列數</div>-->
<!--                </div>-->
<!--              </div>-->
            </div>

            <div class="result-actions">
              <button class="main-glass-button" data-variant="primary" data-size="large" @click="downloadMerged">
                <span class="icon"><InlineIcon icon="⬇️" /></span>
                <span>{{ t('tools.merge.actions.downloadResult') }}</span>
              </button>
              <button class="main-glass-button" data-variant="secondary" @click="reset">
                <span class="icon"><InlineIcon icon="🔄" /></span>
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
                  <span class="merged-status"><InlineIcon icon="✓" />{{ t('tools.common.completed') }}</span>
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
import BarIcon from '@/components/common/BarIcon.vue'
import InlineIcon from '@/components/common/InlineIcon.vue'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import TabularImportPreview from '@/components/import/TabularImportPreview.vue'
import CheckBox from '@/components/selector/CheckBox.vue'
import { downloadMerge, executeMerge, getMergeProgress, uploadFiles, uploadReference } from '@/api'
import { showError } from '@/utils/ui/message.js'
import { usePollingTask } from '@/composables/core/usePollingTask.js'
import { useAuthGuard } from '@/composables/router/useAuthGuard.js'
import { useTabularImportFlow } from '@/composables/import/useTabularImportFlow.js'
import { useTabularImportPreview } from '@/composables/import/useTabularImportPreview.js'
import { transformTabularFile } from '@/utils/import/transformTabularFile.js'
import defaultReferenceWorkbookUrl from '/data/参考表.xlsx?url'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'

const { t } = useI18n()
const route = useRoute()
const { requireAuth } = useAuthGuard({
  defaultRedirect: '/explore/tools/merge',
})

const DEFAULT_REFERENCE_PATH = defaultReferenceWorkbookUrl
const DEFAULT_REFERENCE_FILE_NAME = '参考表.xlsx'
const MERGE_RESULT_FILE_NAME = '方音圖鑑_合併字表.xlsx'

const currentStep = ref(1)
const referenceFile = ref(null)
const pendingReferenceFile = ref(null)
const referenceImportConfirmKey = ref(0)
const referenceImportPayload = ref(null)
const mergeFileImportPayload = ref(null)
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
const forceReferencePreview = ref(false)
const previewEnabled = ref(false)
const pendingMergeFile = ref(null)
const pendingMergeFiles = ref([])
const mergeImportConfirmKey = ref(0)

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
  intervalMs: 1100,
  maxFailures: 3,
})

const isLoadingRef = computed(() => referencePreviewState.loading.value)
const canStartMerge = computed(() => {
  if (previewEnabled.value) {
    return mergeFiles.value.length > 0 && pendingMergeFiles.value.every(f => f.mapped)
  }
  return mergeFiles.value.length > 0
})

watch(previewEnabled, (enabled) => {
  if (enabled) {
    mergeFiles.value = []
  } else {
    pendingMergeFiles.value = []
    mergeFileImportFlow.clearPreview()
  }
})
const defaultReferenceSource = {
  id: 'merge-default-reference',
  kind: 'preset',
  fileName: DEFAULT_REFERENCE_FILE_NAME,
  displayName: DEFAULT_REFERENCE_FILE_NAME,
  exportLabel: t('tools.merge.reference.downloadDefault'),
  downloadable: true,
  async resolveFile() {
    const response = await fetch(DEFAULT_REFERENCE_PATH)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const blob = await response.blob()
    return new File([blob], DEFAULT_REFERENCE_FILE_NAME, {
      type: blob.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
  }
}
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
const mergeFileImportSchema = computed(() => ([
  {
    key: 'char',
    label: t('common.importPreview.schemas.mergeFile.char.label'),
    required: true,
    aliases: [
      t('common.importPreview.schemas.mergeFile.char.aliases.char'),
      t('common.importPreview.schemas.mergeFile.char.aliases.character'),
      t('common.importPreview.schemas.mergeFile.char.aliases.word')
    ],
    description: t('common.importPreview.schemas.mergeFile.char.description'),
    example: t('common.importPreview.schemas.mergeFile.char.example')
  },
  {
    key: 'pronunciation',
    label: t('common.importPreview.schemas.mergeFile.pronunciation.label'),
    required: true,
    aliases: [
      t('common.importPreview.schemas.mergeFile.pronunciation.aliases.ipa'),
      t('common.importPreview.schemas.mergeFile.pronunciation.aliases.phonetic'),
      t('common.importPreview.schemas.mergeFile.pronunciation.aliases.sound')
    ],
    description: t('common.importPreview.schemas.mergeFile.pronunciation.description'),
    example: t('common.importPreview.schemas.mergeFile.pronunciation.example')
  },
  {
    key: 'note',
    label: t('common.importPreview.schemas.mergeFile.note.label'),
    required: false,
    aliases: [
      t('common.importPreview.schemas.mergeFile.note.aliases.remark'),
      t('common.importPreview.schemas.mergeFile.note.aliases.comment')
    ],
    description: t('common.importPreview.schemas.mergeFile.note.description'),
    example: t('common.importPreview.schemas.mergeFile.note.example')
  }
]))
const referencePreviewState = useTabularImportPreview({
  schema: referenceImportSchema,
  requireExplicitConfirmation: () => forceReferencePreview.value || requireExplicitConfirmation.value
})
const mergeFilePreviewState = useTabularImportPreview({
  schema: mergeFileImportSchema,
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
      redirect: route.fullPath || '/explore/tools/merge',
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
  createPreviewFile: async (file) => file,
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
const mergeFileImportFlow = useTabularImportFlow({
  previewState: mergeFilePreviewState,
  pendingFileRef: pendingMergeFile,
  payloadRef: mergeFileImportPayload,
  confirmKeyRef: mergeImportConfirmKey,
  beforePreview: async (file) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      showError(t('tools.merge.validation.invalidFileType'))
      return false
    }
    return true
  },
  createPreviewFile: async (file) => file,
  onAutoApply: async () => {
    await handleMergeFileConfirm()
  },
  onPreviewError: (error) => {
    showError(t('tools.merge.messages.previewFailed', { message: error.message }))
  },
  resetInput: () => {
    if (filesInput.value) {
      filesInput.value.value = ''
    }
  }
})
const referencePreviewSource = computed(() => {
  if (!pendingReferenceFile.value) {
    return null
  }

  const isDefaultReference = pendingReferenceFile.value.name === DEFAULT_REFERENCE_FILE_NAME
  if (isDefaultReference) {
    return defaultReferenceSource
  }

  return {
    kind: 'upload',
    file: pendingReferenceFile.value,
    fileName: pendingReferenceFile.value.name,
    displayName: pendingReferenceFile.value.name,
    downloadable: true
  }
})
const isDefaultReferencePreview = computed(() => referencePreviewSource.value?.kind === 'preset')
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
    redirect: route.fullPath || '/explore/tools/merge',
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
  const totalCount = (previewEnabled.value ? pendingMergeFiles.value.length : mergeFiles.value.length) + files.length
  if (totalCount > 20) {
    showError(t('tools.merge.validation.maxFiles', { count: totalCount }))
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

  if (previewEnabled.value) {
    validFiles.forEach(file => {
      pendingMergeFiles.value.push({ file, mapped: false })
    })
  } else {
    try {
      await uploadFiles(taskId.value, validFiles)
      mergeFiles.value.push(...validFiles)
    } catch (error) {
      showError(t('tools.merge.messages.uploadFailed', { message: error.message }))
    }
  }
}

const removeFile = (index) => {
  mergeFiles.value.splice(index, 1)
}

const removePendingFile = (index) => {
  pendingMergeFiles.value.splice(index, 1)
}

const loadMergeFilePreview = (file) => {
  mergeFileImportFlow.loadPreview(file)
}

const handleMergeFileMappingUpdate = ({ fieldKey, sourceKey }) => {
  mergeFilePreviewState.updateMapping(fieldKey, sourceKey)
  mergeFileImportPayload.value = mergeFilePreviewState.summary.value
}

const clearPendingMergeFile = () => {
  mergeFileImportFlow.clearPreview()
}

const handleMergeFileConfirm = async () => {
  if (!pendingMergeFile.value || !mergeFileImportPayload.value?.isComplete) {
    showError(t('common.importPreview.messages.mappingIncomplete'))
    return
  }

  const columnMap = [
    { sourceKey: mergeFilePreviewState.mapping.value.char, header: '漢字' },
    { sourceKey: mergeFilePreviewState.mapping.value.pronunciation, header: '音標' },
  ]
  if (mergeFilePreviewState.mapping.value.note) {
    columnMap.push({ sourceKey: mergeFilePreviewState.mapping.value.note, header: '解釋' })
  }

  const transformedFile = transformTabularFile({
    parsedFile: mergeFilePreviewState.parsedFile.value,
    columnMap,
    selectedSheetId: mergeFilePreviewState.selectedSheetId.value,
    headerRowIndex: mergeFilePreviewState.headerRowIndex.value,
    mode: 'replace'
  })

  try {
    await uploadFiles(taskId.value, [transformedFile])
    mergeFiles.value.push(transformedFile)

    const idx = pendingMergeFiles.value.findIndex(f => f.file === pendingMergeFile.value)
    if (idx !== -1) {
      pendingMergeFiles.value[idx].mapped = true
    }
  } catch (error) {
    showError(t('tools.merge.messages.uploadFailed', { message: error.message }))
    return
  }

  mergeFileImportFlow.clearPreview()
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

  if (isDefaultReferencePreview.value) {
    await setReferenceFile(pendingReferenceFile.value)
    if (referenceFile.value) {
      nextStep()
    }
    return
  }

  if (!pendingReferenceFile.value || !referenceImportPayload.value?.isComplete) {
    showError(t('common.importPreview.messages.mappingIncomplete'))
    return
  }

  const columnMap = []
  if (referencePreviewState.mapping.value.char) {
    columnMap.push({ sourceKey: referencePreviewState.mapping.value.char, header: '單字' })
  }

  const transformedFile = transformTabularFile({
    parsedFile: referencePreviewState.parsedFile.value,
    columnMap,
    selectedSheetId: referencePreviewState.selectedSheetId.value,
    headerRowIndex: referencePreviewState.headerRowIndex.value,
    mode: 'replace'
  })

  await setReferenceFile(transformedFile)
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

  forceReferencePreview.value = true
  try {
    const file = await defaultReferenceSource.resolveFile()
    await referenceImportFlow.loadPreview(file)
  } catch (error) {
    showError(t('tools.merge.messages.readDefaultFailed', { message: error.message }))
  } finally {
    forceReferencePreview.value = false
  }
}

const reset = () => {
  mergePollingTask.stop()
  currentStep.value = 1
  referenceFile.value = null
  referenceImportFlow.clearPreview()
  mergeFiles.value = []
  pendingMergeFiles.value = []
  previewEnabled.value = false
  mergeFileImportFlow.clearPreview()
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
<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

$color-text: var(--text-deep);
$color-primary: var(--color-primary);
$color-success: var(--color-success);
$color-danger: var(--color-error-light);
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
  @include flex-col;
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
  color: rgba(var(--text-deep-rgb), 0.7);
}

.steps-indicator {
  @include flex-center;
  gap: 16px;
  padding: 12px;
  background: var(--glass-40);
  border-radius: var(--radius-xl);
}

.step {
  @include flex-col;
  align-items: center;
  gap: 8px;
  cursor: default;
  transition: all 0.3s ease;

  &.completed {
    cursor: pointer;

    .step-number {
      background: rgba(var(--color-success-rgb), 0.7);
      border-color: rgba(var(--color-success-rgb), 0.6);
      color: white;
    }
  }

  &.active {
    .step-number {
      background: linear-gradient(
        135deg,
        rgba(var(--color-primary-rgb), 0.8),
        rgba(var(--color-primary-rgb), 0.6)
      );
      border-color: rgba(var(--color-primary-rgb), 0.6);
      color: white;
      box-shadow: 0 4px 16px rgba(var(--color-primary-rgb), 0.3);
    }

    .step-label {
      color: $color-text;
    }
  }

  &-number {
    width: 48px;
    height: 48px;
    @include flex-center;
    background: var(--glass-50);
    border: 2px solid rgba(var(--text-deep-rgb), 0.2);
    border-radius: var(--radius-full);
    font-size: 18px;
    font-weight: 600;
    color: rgba(var(--text-deep-rgb), 0.5);
    transition: all 0.3s ease;
  }

  &-label {
    font-size: 13px;
    font-weight: 500;
    color: rgba(var(--text-deep-rgb), 0.6);
    transition: color 0.3s ease;
  }

  &-line {
    width: 60px;
    height: 2px;
    background: rgba(var(--text-deep-rgb), 0.2);
    transition: background 0.3s ease;

    &.active {
      background: rgba(var(--color-primary-rgb), 0.6);
    }
  }
}

.content-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.step-content {
  @include flex-col;
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
  color: rgba(var(--text-deep-rgb), 0.7);
  text-align: center;
 .main-glass-button{
  color: var(--action-primary-text)
 }
}

.preview-toggle {
  padding: 4px 0;
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
    @include flex-col;
    align-items: center;
    justify-content: center;
    gap: 5px;
    background: var(--glass-40);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 2px dashed rgba(var(--color-primary-rgb), 0.3);
    border-radius: var(--radius-2xl);
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(var(--color-primary-rgb), 0.05);
      border-color: rgba(var(--color-primary-rgb), 0.6);
    }

    &.has-file {
      cursor: default;
      border-style: solid;
      background: rgba(var(--color-success-rgb), 0.05);
      border-color: rgba(var(--color-success-rgb), 0.4);
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
    color: rgba(var(--text-deep-rgb), 0.6);
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
    background: var(--glass-60);
    border-radius: var(--radius-lg);
  }

  &-icon {
    font-size: 36px;
  }

  &-details {
    flex: 1;
    @include flex-col;
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
    color: rgba(var(--text-deep-rgb), 0.7);
  }

  &-items {
    @include flex-col;
    gap: 8px;
    overflow-y: auto;
    padding: 12px;
    background: var(--glass-30);
    border-radius: var(--radius-lg);
  }

  &-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--glass-50);
    border-radius: var(--radius-md);
    transition: all 0.2s ease;

    &:hover {
      background: var(--glass-70);
    }

    &--mapped {
      opacity: 0.7;
      cursor: default;
    }

    &-icon {
      font-size: 20px;
    }

    &-name {
      flex: 1;
      font-size: 14px;
      color: $color-text;
    }

    &-status {
      font-size: 12px;
      font-weight: 500;
      color: rgba(var(--text-deep-rgb), 0.6);
    }

    &-remove {
      width: 28px;
      height: 28px;
      background: rgba(var(--color-error-light-rgb), 0.2);
      border: 1px solid rgba(var(--color-error-light-rgb), 0.3);
      border-radius: var(--radius-sm);
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(var(--color-error-light-rgb), 0.7);
        transform: scale(1.1);
      }
    }
  }
}

.remove-btn {
  width: 32px;
  height: 32px;
  background: rgba(var(--color-error-light-rgb), 0.2);
  border: 1px solid rgba(var(--color-error-light-rgb), 0.4);
  border-radius: var(--radius-sm2);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(var(--color-error-light-rgb), 0.7);
    color: white;
    transform: scale(1.1);
  }
}

.files-list {
  @include flex-col;
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
  @include flex-col;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 15px 20px;
}

.processing {
  &-icon {
    width: 80px;
    height: 80px;
    @include flex-center;
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
    color: rgba(var(--text-deep-rgb), 0.7);
  }

  &-details {
    display: flex;
    gap: 24px;
    padding: 20px 32px;
    background: var(--glass-40);
    border-radius: var(--radius-lg);
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
    color: rgba(var(--text-deep-rgb), 0.7);
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
    @include flex-col;
    gap: 8px;
  }

  &-bar {
    width: 100%;
    height: 12px;
    overflow: hidden;
    background: var(--glass-50);
    border-radius: var(--radius-sm);
  }

  &-fill {
    height: 100%;
    background: linear-gradient(
      90deg,
      rgba(var(--color-primary-rgb), 0.8),
      rgba(0, 195, 255, 0.8)
    );
    border-radius: var(--radius-sm);
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
    color: rgba(var(--text-deep-rgb), 0.7);
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
    background: var(--glass-50);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid var(--glass-60);
    border-radius: var(--radius-xl);
  }

  &-icon {
    font-size: 32px;
  }

  &-content {
    @include flex-col;
    gap: 4px;
  }

  &-number {
    font-size: 28px;
    font-weight: 700;
    color: $color-text;
  }

  &-label {
    font-size: 13px;
    color: rgba(var(--text-deep-rgb), 0.7);
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
    background: var(--glass-30);
    border-radius: var(--radius-lg);
  }

  &-item {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
    padding: 10px 12px;
    background: var(--glass-50);
    border-radius: var(--radius-md);
    font-size: 14px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &-index {
    width: 24px;
    height: 24px;
    @include flex-center;
    background: rgba(var(--color-primary-rgb), 0.2);
    border-radius: var(--radius-full);
    font-size: 12px;
    font-weight: 600;
    color: rgba(var(--color-primary-rgb), 0.9);
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
    background: var(--glass-30);
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
    background: var(--glass-30);
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }
}

.tab-btn {
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  color: rgba(var(--text-deep-rgb), 0.7);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--glass-60);
    color: $color-text;
  }

  &.active {
    background: rgba(var(--color-primary-rgb), 0.12);
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
    background: rgba(var(--color-primary-rgb), 0.08);
  }

  th {
    padding: 10px 12px;
    border-bottom: 2px solid rgba(var(--color-primary-rgb), 0.2);
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
    color: rgba(var(--text-deep-rgb), 0.85);
  }

  tbody {
    tr {
      &:hover {
        background: rgba(var(--color-primary-rgb), 0.04);
      }
    }
  }
}

.load-more-hint {
  margin-top: 8px;
  padding: 12px;
  background: var(--glass-40);
  border-radius: var(--radius-sm2);
  text-align: center;
  font-size: 12px;
  color: rgba(var(--text-deep-rgb), 0.5);
}

@media (max-width: 768px) {
  .glass-container {
    width: 100%;
    min-height: auto;
    padding: 20px 16px;
    border-radius: var(--radius-xl);
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
      border-radius: var(--radius-lg);
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
