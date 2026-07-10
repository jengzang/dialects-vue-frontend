<template>
  <div class="jyut2ipa-container">
    <div class="glass-container glass-container-shell">
      <div class="header-section">
        <h2 class="title">{{ t('tools.jyut2ipa.page.title') }}</h2>
        <p class="subtitle">{{ t('tools.jyut2ipa.page.subtitle') }}</p>
      </div>

      <div class="upload-area" v-if="!processing && !completed">
        <div
          class="upload-zone"
          :class="{ 'drag-over': isDragOver }"
          @click="!pendingPreviewFile && $refs.fileInput.click()"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="handleDrop"
        >
          <input
            type="file"
            ref="fileInput"
            accept=".xlsx,.xls"
            @change="handleFileSelect"
            style="display: none"
          />
          <div class="upload-icon">📄</div>
          <h3 class="upload-title">{{ t('tools.jyut2ipa.upload.title') }}</h3>
          <p class="upload-hint">{{ t('tools.jyut2ipa.upload.hint') }}</p>
        </div>

        <TabularImportPreview
          v-if="pendingPreviewFile"
          :key="previewConfirmKey"
          :title="t('common.importPreview.jyut2ipaTitle')"
          :description="t('common.importPreview.jyut2ipaDescription')"
          :file="pendingPreviewFile"
          :schema="jyutImportSchema"
          :loading="jyutPreviewState.loading"
          :preview-table="jyutPreviewState.previewTable"
          :diagnostics="jyutPreviewState.diagnostics"
          :mapping="jyutPreviewState.mapping"
          :selected-sheet-id="jyutPreviewState.selectedSheetId"
          :header-row-index="jyutPreviewState.headerRowIndex"
          :sheets="jyutPreviewState.parsedFile?.sheets || []"
          @update:selectedSheetId="jyutPreviewState.selectedSheetId = $event"
          @update:headerRowIndex="jyutPreviewState.headerRowIndex = $event"
          @update:mapping="handleJyutMappingUpdate"
          @reset="clearPendingPreview"
        />

        <div class="info-section">
          <p class="info-text">{{ t('tools.jyut2ipa.upload.info') }}</p>
          <p v-if="jyutImportSummary" class="info-text info-text--summary">{{ jyutImportSummary }}</p>

          <div class="upload-preview-actions" v-if="pendingPreviewFile">
            <button class="main-glass-button" data-variant="secondary" type="button" @click="clearPendingPreview">
              {{ t('common.button.cancel') }}
            </button>
            <button
              class="main-glass-button"
              data-variant="primary"
              type="button"
              :disabled="!isJyutImportReady"
              @click="confirmPreviewAndProcess"
            >
              {{ t('common.importPreview.actions.confirmAndUse') }}
            </button>
          </div>

          <div class="config-card" @click="showConfigModal = true">
            <div class="config-icon">⚙️</div>
            <div class="config-content">
              <div class="config-title">{{ t('tools.jyut2ipa.configCard.title') }}</div>
              <div class="config-desc">{{ t('tools.jyut2ipa.configCard.desc') }}</div>
            </div>
            <div class="config-arrow">→</div>
          </div>
        </div>
      </div>

      <div class="processing-area" v-if="processing">
        <div class="processing-icon">
          <div class="ui-loading--page" aria-hidden="true"></div>
        </div>
        <h3 class="processing-title">{{ t('tools.jyut2ipa.processing.title') }}</h3>
        <p class="processing-text">{{ processingText }}</p>

        <div class="progress-bar-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <div class="progress-text">{{ progress }}%</div>
        </div>

        <div class="processing-stats" v-if="stats.total > 0">
          <div class="stat-item">
            <span class="stat-label">{{ t('tools.common.totalRows') }}</span>
            <span class="stat-value">{{ stats.total }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">{{ t('tools.common.processedRows') }}</span>
            <span class="stat-value">{{ stats.processed }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">{{ t('tools.common.successfulRows') }}</span>
            <span class="stat-value success">{{ stats.success }}</span>
          </div>
        </div>
      </div>

      <div class="complete-area" v-if="completed">
        <div class="complete-icon">✅</div>
        <h3 class="complete-title">{{ t('tools.jyut2ipa.complete.title') }}</h3>
        <p class="complete-text">{{ t('tools.jyut2ipa.complete.text') }}</p>

<!--        <div class="result-stats">-->
<!--          <div class="result-card">-->
<!--            <div class="result-number">{{ stats.total }}</div>-->
<!--            <div class="result-label">總行數</div>-->
<!--          </div>-->
<!--          <div class="result-card">-->
<!--            <div class="result-number success">{{ stats.success }}</div>-->
<!--            <div class="result-label">成功轉換</div>-->
<!--          </div>-->
<!--          <div class="result-card" v-if="stats.failed > 0">-->
<!--            <div class="result-number error">{{ stats.failed }}</div>-->
<!--            <div class="result-label">失敗</div>-->
<!--          </div>-->
<!--        </div>-->

        <div class="action-buttons">
          <button class="main-glass-button" data-variant="primary" data-size="large" @click="downloadResult">
            <span class="icon">⬇️</span>
            <span>{{ t('tools.jyut2ipa.actions.downloadResult') }}</span>
          </button>
          <button class="main-glass-button" data-variant="secondary" @click="reset">
            <span class="icon">🔄</span>
            <span>{{ t('tools.jyut2ipa.actions.resetTask') }}</span>
          </button>
        </div>

        <div class="preview-section" v-if="previewData.length > 0">
          <h4 class="preview-title">{{ t('tools.jyut2ipa.complete.previewTitle') }}</h4>
          <div class="preview-table-wrapper ui-scrollbar">
            <table class="preview-table">
              <thead>
                <tr>
                  <th>{{ t('tools.jyut2ipa.preview.char') }}</th>
                  <th>{{ t('tools.jyut2ipa.preview.jyutping') }}</th>
                  <th>{{ t('tools.jyut2ipa.preview.ipa') }}</th>
                  <th>{{ t('tools.jyut2ipa.preview.initial') }}</th>
                  <th>{{ t('tools.jyut2ipa.preview.final') }}</th>
                  <th>{{ t('tools.jyut2ipa.preview.tone') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in previewData" :key="index">
                  <td>{{ row.char }}</td>
                  <td>{{ row.jyutping }}</td>
                  <td class="ipa-text">{{ row.ipa }}</td>
                  <td>{{ row.initial }}</td>
                  <td>{{ row.final }}</td>
                  <td>{{ row.tone }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <AppModal
      :model-value="showConfigModal"
      size="lg"
      :close-label="t('tools.common.close')"
      transition-name="modal-fade"
      :z-index="1500"
      :show-close="false"
      @update:modelValue="showConfigModal = false"
    >
      <template #header>
        <div class="jyut2ipa-config-header">
          <div class="header-left">
            <h3 class="jyut2ipa-config-title">⚙️ {{ t('tools.jyut2ipa.modal.title') }}</h3>
            <div class="header-stats">
              <span class="stat-inline">
                {{ t('tools.jyut2ipa.modal.totalRules') }}
                <strong>{{ totalRules }}</strong>
              </span>
              <span class="stat-inline">
                {{ t('tools.jyut2ipa.modal.enabledRules') }}
                <strong class="success">{{ enabledRules }}</strong>
              </span>
              <span class="stat-inline">
                {{ t('tools.jyut2ipa.modal.disabledRules') }}
                <strong class="disabled">{{ disabledRules }}</strong>
              </span>
            </div>
          </div>
          <div class="header-actions">
            <button
              class="icon-btn"
              @click="exportConfig"
              :title="t('tools.jyut2ipa.modal.exportTitle')"
            >
              📤
            </button>
            <button
              class="icon-btn"
              @click="importConfig"
              :title="t('tools.jyut2ipa.modal.importTitle')"
            >
              📥
            </button>
            <button
              class="close-btn close-btn-lg close-btn-inline"
              :title="t('tools.common.close')"
              @click="showConfigModal = false"
            >
              ✕
            </button>
          </div>
        </div>
      </template>

      <div class="config-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="config-tab"
          :class="{ active: currentTab === tab.key }"
          @click="currentTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="jyut2ipa-config-content ui-scrollbar">
        <div class="rules-table-container">
          <table class="rules-table">
            <thead>
              <tr>
                <th width="50">{{ t('tools.jyut2ipa.modal.headers.index') }}</th>
                <th width="150">{{ t('tools.jyut2ipa.modal.headers.source') }}</th>
                <th width="150">{{ t('tools.jyut2ipa.modal.headers.replacement') }}</th>
                <th width="100">{{ t('tools.jyut2ipa.modal.headers.category') }}</th>
                <th width="80">{{ t('tools.jyut2ipa.modal.headers.enabled') }}</th>
                <th width="100">{{ t('tools.jyut2ipa.modal.headers.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(rule, index) in filteredRules" :key="index">
                <td>{{ index + 1 }}</td>
                <td>
                  <input
                    v-model="rule.to_replace"
                    class="table-input"
                    @input="updateStats"
                  />
                </td>
                <td>
                  <input
                    v-model="rule.replacement"
                    class="table-input"
                    @input="updateStats"
                  />
                </td>
                <td>
                  <span class="category-badge" :class="'cat-' + rule.category">
                    {{ getCategoryName(rule.category) }}
                  </span>
                </td>
                <td>
                  <SwitchToggle
                    :model-value="rule.enabled"
                    :width="44"
                    :height="22"
                    :thumb-size="16"
                    color="blue"
                    variant="solid"
                    :aria-label="t('tools.jyut2ipa.modal.headers.enabled')"
                    @update:modelValue="rule.enabled = $event"
                    @change="updateStats"
                  />
                </td>
                <td>
                  <button
                    class="btn-delete"
                    @click="deleteRule(rule)"
                    :title="t('tools.common.delete')"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <button class="btn-add-rule" @click="addNewRule">
          ➕ {{ t('tools.jyut2ipa.actions.addRule') }}
        </button>
      </div>

      <template #footer>
          <button class="main-glass-button" data-variant="secondary" @click="resetConfigConfirm">
            🔄 {{ t('tools.jyut2ipa.actions.resetDefault') }}
          </button>
          <button class="main-glass-button" data-variant="primary" @click="saveConfig">
            💾 {{ t('tools.jyut2ipa.actions.saveConfig') }}
          </button>
      </template>
    </AppModal>

    <input
      type="file"
      ref="importInput"
      accept=".json"
      style="display: none"
      @change="handleImportFile"
    />
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/common/AppModal.vue'
import SwitchToggle from '@/components/common/SwitchToggle.vue'
import TabularImportPreview from '@/components/import/TabularImportPreview.vue'
import { usePollingTask } from '@/composables/core/usePollingTask.js'
import { useStorageState } from '@/composables/core/useStorageState.js'
import { useAuthGuard } from '@/composables/router/useAuthGuard.js'
import { useTabularImportFlow } from '@/composables/import/useTabularImportFlow.js'
import { useTabularImportPreview } from '@/composables/import/useTabularImportPreview.js'
import {
  downloadJyut2IpaResult,
  getJyut2IpaProgress,
  processJyut2Ipa,
  uploadJyutFile,
} from '@/api'
import { showConfirm, showError, showSuccess } from '@/utils/message.js'

const { t } = useI18n()
const { requireAuth } = useAuthGuard()
const progressPolling = usePollingTask({ intervalMs: 1000, maxFailures: 1 })
const JYUT2IPA_CONFIG_FILE_NAME = 'jyut2ipa-rules.json'
const JYUT2IPA_RESULT_FILE_PREFIX = '方音圖鑒_'
const fileName = ref('')
const taskId = ref(null)
const fileInput = ref(null)
const pendingPreviewFile = ref(null)
const previewConfirmKey = ref(0)
const fileImportPayload = ref(null)
const importInput = ref(null)
const requireExplicitConfirmation = ref(false)
const isDragOver = ref(false)
const processing = ref(false)
const completed = ref(false)
const progress = ref(0)
const processingText = ref(t('tools.jyut2ipa.processing.preparingUpload'))
const showConfigModal = ref(false)
const currentTab = ref('wf')
const rulesStorage = useStorageState('jyut2ipa_custom_rules', {
  defaultValue: null,
})

const stats = reactive({
  total: 0,
  processed: 0,
  success: 0,
  failed: 0
})

const previewData = ref([])
const jyutImportSchema = computed(() => ([
  {
    key: 'jyutping',
    label: t('common.importPreview.schemas.jyut2ipa.jyutping.label'),
    required: true,
    aliases: [
      t('common.importPreview.schemas.jyut2ipa.jyutping.aliases.jyutping'),
      t('common.importPreview.schemas.jyut2ipa.jyutping.aliases.cantonese'),
      t('common.importPreview.schemas.jyut2ipa.jyutping.aliases.pronunciation')
    ],
    description: t('common.importPreview.schemas.jyut2ipa.jyutping.description'),
    example: t('common.importPreview.schemas.jyut2ipa.jyutping.example')
  },
  {
    key: 'char',
    label: t('common.importPreview.schemas.jyut2ipa.char.label'),
    required: false,
    aliases: [
      t('common.importPreview.schemas.jyut2ipa.char.aliases.char'),
      t('common.importPreview.schemas.jyut2ipa.char.aliases.character'),
      t('common.importPreview.schemas.jyut2ipa.char.aliases.word')
    ],
    description: t('common.importPreview.schemas.jyut2ipa.char.description'),
    example: t('common.importPreview.schemas.jyut2ipa.char.example')
  }
]))
const jyutPreviewState = useTabularImportPreview({
  schema: jyutImportSchema,
  previewRowCount: 8,
  requireExplicitConfirmation: () => requireExplicitConfirmation.value
})
const fileImportFlow = useTabularImportFlow({
  previewState: jyutPreviewState,
  pendingFileRef: pendingPreviewFile,
  payloadRef: fileImportPayload,
  confirmKeyRef: previewConfirmKey,
  beforePreview: async (file) => {
    const isAllowed = await requireAuth({
      message: t('tools.jyut2ipa.validation.loginRequired'),
    })
    if (!isAllowed) {
      return false
    }

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      showError(t('tools.jyut2ipa.validation.invalidFileType'))
      return false
    }

    if (file.size > 3 * 1024 * 1024) {
      showError(t('tools.jyut2ipa.validation.fileTooLarge'))
      return false
    }

    return true
  },
  onAutoApply: async () => {
    await confirmPreviewAndProcess()
  },
  onPreviewError: (error) => {
    showError(t('tools.jyut2ipa.messages.previewFailed', { message: error.message }))
  },
  resetInput: () => {
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
})
const isJyutImportReady = computed(() => fileImportFlow.isReady.value)
const jyutImportSummary = computed(() => {
  if (!fileImportPayload.value) {
    return ''
  }

  const mappedCount = Object.values(fileImportPayload.value.mapping || {}).filter(Boolean).length
  const columnCount = fileImportPayload.value.sourceColumns?.length || 0
  return t('common.importPreview.mergeReferenceSummary', {
    mappedCount,
    columnCount
  })
})

// 默认规则（从default-rules.js迁移）
const DEFAULT_RULES = [
  // 韵腹 (wf)
  { to_replace: 'aa', replacement: 'a', category: 'wf', enabled: true },
  { to_replace: 'a', replacement: 'ɐ', category: 'wf', enabled: true },
  { to_replace: 'e', replacement: 'ɛ', category: 'wf', enabled: true },
  { to_replace: 'ea', replacement: 'ə', category: 'wf', enabled: true },
  { to_replace: 'uu', replacement: 'ʊ', category: 'wf', enabled: true },
  { to_replace: 'oe', replacement: 'œ', category: 'wf', enabled: true },
  { to_replace: 'eo', replacement: 'ɵ', category: 'wf', enabled: true },
  { to_replace: 'y', replacement: 'y', category: 'wf', enabled: true },
  { to_replace: 'o', replacement: 'ɔ', category: 'wf', enabled: true },
  { to_replace: 'ii', replacement: 'ɪ', category: 'wf', enabled: true },
  { to_replace: 'or', replacement: 'ɤ', category: 'wf', enabled: true },
  { to_replace: 'ar', replacement: 'ɑ', category: 'wf', enabled: true },
  { to_replace: 'dd', replacement: 'ɗ', category: 'wf', enabled: true },

  // 声母 (sm)
  { to_replace: 'ng', replacement: 'ŋ', category: 'sm', enabled: true },
  { to_replace: 'nj', replacement: 'ȵ', category: 'sm', enabled: true },
  { to_replace: 'sl', replacement: 'ɬ', category: 'sm', enabled: true },
  { to_replace: 'th', replacement: 'θ', category: 'sm', enabled: true },
  { to_replace: 'bb', replacement: 'ɓ', category: 'sm', enabled: true },
  { to_replace: 'dd', replacement: 'ɗ', category: 'sm', enabled: true },
  { to_replace: 'zh', replacement: 'ʧ', category: 'sm', enabled: true },
  { to_replace: 'ch', replacement: 'ʧʰ', category: 'sm', enabled: true },
  { to_replace: 'sh', replacement: 'ʃ', category: 'sm', enabled: true },
  { to_replace: 'zj', replacement: 'ʨ', category: 'sm', enabled: true },
  { to_replace: 'cj', replacement: 'ʨʰ', category: 'sm', enabled: true },
  { to_replace: 'sj', replacement: 'ɕ', category: 'sm', enabled: true },
  { to_replace: 'q', replacement: 'ʔ', category: 'sm', enabled: true },
  { to_replace: 'c', replacement: 'ʦʰ', category: 'sm', enabled: true },
  { to_replace: 'z', replacement: 'ʦ', category: 'sm', enabled: true },
  { to_replace: 'd', replacement: 't', category: 'sm', enabled: true },
  { to_replace: 't', replacement: 'tʰ', category: 'sm', enabled: true },
  { to_replace: 'g', replacement: 'k', category: 'sm', enabled: true },
  { to_replace: 'k', replacement: 'kʰ', category: 'sm', enabled: true },
  { to_replace: 'b', replacement: 'p', category: 'sm', enabled: true },
  { to_replace: 'p', replacement: 'pʰ', category: 'sm', enabled: true },

  // 声调 (jd)
  { to_replace: '1', replacement: '⁵⁵', category: 'jd', enabled: true },
  { to_replace: '2', replacement: '³⁵', category: 'jd', enabled: true },
  { to_replace: '3', replacement: '³³', category: 'jd', enabled: true },
  { to_replace: '4', replacement: '²¹', category: 'jd', enabled: true },
  { to_replace: '5', replacement: '¹³', category: 'jd', enabled: true },
  { to_replace: '6', replacement: '²²', category: 'jd', enabled: true },
  { to_replace: '7', replacement: '⁵', category: 'jd', enabled: true },
  { to_replace: '8', replacement: '³', category: 'jd', enabled: true },
  { to_replace: '9', replacement: '²', category: 'jd', enabled: true },

  // 韵尾 (wm)
  { to_replace: 'ng', replacement: 'ŋ', category: 'wm', enabled: true },
  { to_replace: 'h', replacement: 'ʔ', category: 'wm', enabled: true },
  { to_replace: 'n', replacement: 'n', category: 'wm', enabled: true },
  { to_replace: 'm', replacement: 'm', category: 'wm', enabled: true }
]

// 规则列表
const rules = ref([...DEFAULT_RULES])

const tabs = computed(() => [
  { key: 'wf', label: t('tools.jyut2ipa.categories.wf') },
  { key: 'sm', label: t('tools.jyut2ipa.categories.sm') },
  { key: 'jd', label: t('tools.jyut2ipa.categories.jd') },
  { key: 'wm', label: t('tools.jyut2ipa.categories.wm') },
  { key: 'all', label: t('tools.jyut2ipa.categories.all') }
])

// 计算属性
const filteredRules = computed(() => {
  if (currentTab.value === 'all') {
    return rules.value
  }
  return rules.value.filter(r => r.category === currentTab.value)
})

const totalRules = computed(() => rules.value.length)
const enabledRules = computed(() => rules.value.filter(r => r.enabled).length)
const disabledRules = computed(() => totalRules.value - enabledRules.value)

const getCategoryName = (cat) => {
  const names = {
    wf: t('tools.jyut2ipa.categories.wf'),
    sm: t('tools.jyut2ipa.categories.sm'),
    jd: t('tools.jyut2ipa.categories.jd'),
    wm: t('tools.jyut2ipa.categories.wm')
  }
  return names[cat] || cat
}

const updateStats = () => {
  // 触发响应式更新
}

const addNewRule = () => {
  const category = currentTab.value === 'all' ? 'wf' : currentTab.value
  rules.value.push({
    to_replace: '',
    replacement: '',
    category: category,
    enabled: true
  })
}

const deleteRule = async (rule) => {
  const confirmed = await showConfirm(t('tools.jyut2ipa.messages.confirmDeleteRule'))
  if (!confirmed) {
    return
  }

  const index = rules.value.indexOf(rule)
  if (index > -1) {
    rules.value.splice(index, 1)
  }
}

const resetConfigConfirm = async () => {
  const confirmed = await showConfirm(t('tools.jyut2ipa.messages.confirmResetConfig'))
  if (!confirmed) {
    return
  }

  rules.value = [...DEFAULT_RULES]
  rulesStorage.remove()
  showSuccess(t('tools.jyut2ipa.messages.resetSuccess'))
}

const saveConfig = () => {
  try {
    rulesStorage.write(rules.value)
    showConfigModal.value = false
    showSuccess(t('tools.jyut2ipa.messages.saveSuccess'))
  } catch (error) {
    showError(t('tools.jyut2ipa.messages.saveFailed', { message: error.message }))
  }
}

const exportConfig = () => {
  const blob = new Blob([JSON.stringify(rules.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = JYUT2IPA_CONFIG_FILE_NAME
  a.click()
  URL.revokeObjectURL(url)
}

const importConfig = () => {
  importInput.value?.click()
}

const handleImportFile = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    const text = await file.text()
    const imported = JSON.parse(text)
    if (Array.isArray(imported)) {
      rules.value = imported
      showSuccess(t('tools.jyut2ipa.messages.importSuccess'))
    } else {
      showError(t('tools.jyut2ipa.messages.importInvalid'))
    }
  } catch (error) {
    showError(t('tools.jyut2ipa.messages.importFailed', { message: error.message }))
  }
  event.target.value = ''
}


const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    fileImportFlow.loadPreview(file)
  }
}

const handleDrop = (event) => {
  isDragOver.value = false
  const file = event.dataTransfer.files[0]
  if (file) {
    fileImportFlow.loadPreview(file)
  }
}

const resetStats = () => {
  stats.total = 0
  stats.processed = 0
  stats.success = 0
  stats.failed = 0
}

const isFailedProgressStatus = (status) => status === 'failed' || status === 'error'

const normalizePercentProgress = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return 0
  }

  return Math.min(100, Math.max(0, Math.round(numeric)))
}

const applyProgressData = (progressData) => {
  if (progressData.progress !== undefined && progressData.progress !== null) {
    progress.value = normalizePercentProgress(progressData.progress)
  }
  processingText.value = progressData.message || t('tools.jyut2ipa.processing.running')

  if (progressData.status !== 'completed') {
    return
  }

  stats.total = progressData.total_rows || 0
  stats.processed = progressData.total_rows || 0
  stats.success = progressData.total_rows || 0
  progress.value = 100
  processingText.value = t('tools.common.completed')

  if (progressData.preview) {
    previewData.value = progressData.preview.slice(0, 10)
  }

  processing.value = false
  completed.value = true
}

const processFile = async (file, options = {}) => {
  const isAllowed = await requireAuth({
    message: t('tools.jyut2ipa.validation.loginRequired'),
  })
  if (!isAllowed) {
    return
  }

  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    showError(t('tools.jyut2ipa.validation.invalidFileType'))
    return
  }

  if (file.size > 3 * 1024 * 1024) {
    showError(t('tools.jyut2ipa.validation.fileTooLarge'))
    return
  }

  processing.value = true
  completed.value = false
  progress.value = 0
  resetStats()
  previewData.value = []
  fileName.value = file.name
  taskId.value = null
  try {
    processingText.value = t('tools.jyut2ipa.processing.uploading')
    const uploadData = await uploadJyutFile(file, options)

    taskId.value = uploadData.task_id

    processingText.value = t('tools.jyut2ipa.processing.preparingConvert')
    await processJyut2Ipa(taskId.value)
    processingText.value = t('tools.jyut2ipa.processing.running')

    await progressPolling.start(
      async () => {
        const progressData = await getJyut2IpaProgress(taskId.value)
        if (isFailedProgressStatus(progressData.status)) {
          throw new Error(progressData.error || progressData.message || t('tools.jyut2ipa.processing.running'))
        }
        return progressData
      },
      {
        onTick: applyProgressData,
        shouldStop: (progressData) => progressData.status === 'completed',
        onMaxFailures: (error) => {
          showError(t('tools.jyut2ipa.messages.progressFailed', { message: error.message }))
          reset()
        }
      }
    )
  } catch (error) {
    showError(t('tools.jyut2ipa.messages.processFailed', { message: error.message }))
    reset()
  }
}

const previewFile = async (file) => {
  await fileImportFlow.loadPreview(file)
}

const handleJyutMappingUpdate = ({ fieldKey, sourceKey }) => {
  fileImportFlow.updateManualMapping({ fieldKey, sourceKey })
}

const clearPendingPreview = () => {
  fileImportFlow.clearPreview()
}

const confirmPreviewAndProcess = async () => {
  if (!pendingPreviewFile.value || !fileImportPayload.value?.isComplete) {
    showError(t('common.importPreview.messages.mappingIncomplete'))
    return
  }

  const activeSheet = jyutPreviewState.previewTable.value?.activeSheet
  const columnMapping = {
    headerJyutping: jyutPreviewState.mapping.value.jyutping || null,
    headerChar: jyutPreviewState.mapping.value.char || null
  }

  const selectedFile = pendingPreviewFile.value
  fileImportFlow.clearPreview()
  await processFile(selectedFile, {
    columnMapping,
    headerRowIndex: jyutPreviewState.headerRowIndex.value,
    sheetName: activeSheet?.name || null
  })
}

const downloadResult = async () => {
  try {
    if (!taskId.value) {
      showError(t('tools.jyut2ipa.messages.taskMissing'))
      return
    }

    const blob = await downloadJyut2IpaResult(taskId.value)

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${JYUT2IPA_RESULT_FILE_PREFIX}${fileName.value}`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    showError(t('tools.jyut2ipa.messages.downloadFailed', { message: error.message }))
  }
}

const reset = () => {
  progressPolling.stop()
  completed.value = false
  processing.value = false
  progress.value = 0
  processingText.value = t('tools.jyut2ipa.processing.preparingUpload')
  taskId.value = null
  fileName.value = ''
  resetStats()
  previewData.value = []
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 加载配置
const loadConfig = () => {
  const saved = rulesStorage.read()
  if (Array.isArray(saved)) {
    rules.value = saved
  } else {
    rules.value = [...DEFAULT_RULES]
  }
}
loadConfig()
</script>

```scss

$color-text: var(--text-deep);
$color-primary: var(--color-primary);
$color-success: var(--color-success);
$color-danger: var(--color-error-light);
$color-disabled: var(--text-lightest);

$text-70: rgba(11, 37, 64, 0.7);
$text-60: rgba(11, 37, 64, 0.6);

@mixin glass-blur($amount: 10px) {
  backdrop-filter: blur($amount);
  -webkit-backdrop-filter: blur($amount);
}

.jyut2ipa-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4px;
  padding-top: 25px;
}

.glass-container {
  position: relative;
  width: min(95dvw, 800px);
  padding: 40px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header-section {
  position: relative;
  margin-bottom: 12px;
  text-align: center;
}

.title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 600;
  color: $color-text;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: $text-70;
}

.config-btn {
  position: absolute;
  top: 0;
  right: 0;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.5);
  @include glass-blur;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 122, 255, 0.7);
    transform: rotate(90deg);
  }
}

.upload {
  &-area {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 24px;
  }

  &-zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 30px 40px;
    background: rgba(255, 255, 255, 0.4);
    @include glass-blur;
    border: 2px dashed rgba(0, 122, 255, 0.3);
    border-radius: 24px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover,
    &.drag-over {
      background: rgba(0, 122, 255, 0.05);
      border-color: rgba(0, 122, 255, 0.6);
      transform: scale(1.02);
    }
  }

  &-icon {
    font-size: 64px;
    animation: float 3s ease-in-out infinite;
  }

  &-title {
    margin: 0;
    white-space: nowrap;
    font-size: 20px;
    font-weight: 500;
    color: $color-text;
  }

  &-hint {
    margin: 0;
    font-size: 14px;
    color: $text-60;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}

.info {
  &-cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  &-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.5);
    @include glass-blur;
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 20px;
  }

  &-section {
    width: 100%;
    max-width: 600px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  &-text {
    margin: 0;
    font-size: 16px;
    line-height: 1.6;
    color: rgba(7, 25, 44, 0.8);
    text-align: center;
  }
}

.card {
  &-icon {
    font-size: 32px;
  }

  &-content {
    flex: 1;
  }

  &-title {
    margin-bottom: 4px;
    font-size: 13px;
    font-weight: 600;
    color: $color-text;
  }

  &-text {
    font-size: 12px;
    color: $text-70;
  }
}

.processing-area,
.complete-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
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
    color: $text-70;
  }

  &-stats {
    display: flex;
    gap: 24px;
    padding: 20px 32px;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 16px;
  }
}

.complete {
  &-icon {
    font-size: 80px;
    animation: scaleIn 0.5s ease;
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
    color: $text-70;
  }
}

.progress {
  &-bar-container {
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

  &-text {
    text-align: center;
    font-size: 14px;
    font-weight: 600;
    color: $color-text;
  }
}

.stat {
  &-item {
    display: flex;
    gap: 8px;
    font-size: 14px;
  }

  &-label {
    color: $text-70;
  }

  &-value {
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
  &-stats {
    display: flex;
    gap: 20px;
  }

  &-card {
    min-width: 120px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px 32px;
    background: rgba(255, 255, 255, 0.5);
    @include glass-blur;
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 20px;
  }

  &-number {
    font-size: 36px;
    font-weight: 700;
    color: $color-text;

    &.success {
      color: $color-success;
    }

    &.error {
      color: $color-danger;
    }
  }

  &-label {
    font-size: 14px;
    color: $text-70;
  }
}

.action-buttons {
  display: flex;
  gap: 16px;
}

.preview {
  &-section {
    width: 100%;
    margin-top: 24px;
  }

  &-title {
    margin: 0 0 12px;
    font-size: 16px;
    font-weight: 600;
    color: $color-text;
  }

  &-table-wrapper {
    max-height: 200px;
    overflow: auto;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 16px;
  }

  &-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;

    thead {
      position: sticky;
      top: 0;
      background: rgba(255, 255, 255, 0.6);
      @include glass-blur;
    }

    th,
    td {
      padding: 10px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.3);
      text-align: left;
    }

    th {
      font-weight: 600;
      color: $color-text;
    }
  }
}

.ipa-text {
  font-family: 'Doulos SIL', 'Charis SIL', serif;
  color: rgba(0, 122, 255, 0.9);
}

/* 配置模态框 */
.jyut2ipa-config {
  &-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  &-title {
    margin: 3px;
    white-space: nowrap;
  }

  &-content {
    min-height: 0;
    justify-items: center;
  }

  &-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin: 20px -24px -20px;
    padding: 20px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.5);
  }
}

.header {
  &-left {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 24px;
  }

  &-stats {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  &-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-right: 30px;
  }
}

.stat-inline {
  white-space: nowrap;
  font-size: 14px;
  color: $text-70;

  strong {
    margin-left: 4px;
    font-weight: 700;
    color: $color-text;

    &.success {
      color: $color-success;
    }

    &.disabled {
      color: $color-disabled;
    }
  }
}

/* 标签页 */
.config {
  &-tabs {
    display: flex;
    gap: 4px;
    padding: 12px 32px 0;
    border-bottom: 2px solid rgba(0, 0, 0, 0.05);
  }

  &-tab {
    padding: 10px 12px;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    white-space: nowrap;
    font-size: 15px;
    font-weight: 500;
    color: $text-60;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(0, 122, 255, 0.05);
      color: $color-text;
    }

    &.active {
      color: $color-primary;
      border-bottom-color: $color-primary;
      font-weight: 600;
    }
  }
}

/* 规则表格 */
.rules {
  &-table-container {
    margin-bottom: 16px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 12px;
  }

  &-table {
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
      padding: 12px;
      border-bottom: 2px solid rgba(0, 122, 255, 0.1);
      white-space: nowrap;
      text-align: left;
      font-weight: 600;
      color: $color-text;
    }

    td {
      padding: 10px 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.3);
    }

    tbody {
      tr {
        &:hover {
          background: rgba(0, 122, 255, 0.03);
        }
      }
    }
  }
}

.table-input {
  width: 100%;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 122, 255, 0.15);
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    background: white;
    border-color: rgba(0, 122, 255, 0.5);
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.05);
  }
}

/* 类别徽章 */
.category-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  white-space: nowrap;
  font-size: 11px;
  font-weight: 600;

  &.cat-wf {
    background: #fef3c7;
    color: #92400e;
  }

  &.cat-sm {
    background: #dbeafe;
    color: #1e40af;
  }

  &.cat-jd {
    background: #fce7f3;
    color: #9f1239;
  }

  &.cat-wm {
    background: #d1fae5;
    color: #065f46;
  }
}

/* 删除及添加按钮 */
.btn {
  &-delete {
    padding: 5px 10px;
    background: rgba(255, 59, 48, 0.1);
    border: 1px solid rgba(255, 59, 48, 0.3);
    border-radius: 6px;
    font-size: 13px;
    color: $color-danger;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 59, 48, 0.2);
      transform: scale(1.05);
    }
  }

  &-add-rule {
    display: block;
    max-width: 200px;
    margin: 0 auto;
    padding: 12px;
    background: linear-gradient(
      135deg,
      rgba(52, 199, 89, 0.7),
      rgba(52, 199, 89, 0.5)
    );
    border: 1px solid rgba(52, 199, 89, 0.5);
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: linear-gradient(
        135deg,
        rgba(52, 199, 89, 0.8),
        rgba(52, 199, 89, 0.6)
      );
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(52, 199, 89, 0.3);
    }
  }
}

/* 图标按钮 */
.icon-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 122, 255, 0.2);
    transform: scale(1.1);
  }
}

.config {
  &-card {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 20px 32px;
    background: rgba(255, 255, 255, 0.5);
    @include glass-blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.7);
    border-radius: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.65);
      border-color: rgba(0, 122, 255, 0.5);
      box-shadow: 0 8px 30px rgba(0, 122, 255, 0.15);
      transform: translateY(-2px);

      .config-arrow {
        transform: translateX(4px);
      }
    }

    &:active {
      transform: translateY(0);
    }
  }

  &-icon {
    flex-shrink: 0;
    font-size: 48px;
    line-height: 1;
  }

  &-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: $color-text;
  }

  &-desc {
    margin: 0;
    font-size: 14px;
    color: $text-70;
  }

  &-arrow {
    flex-shrink: 0;
    font-size: 24px;
    line-height: 1;
    color: rgba(0, 122, 255, 0.8);
    transition: transform 0.3s ease;
  }
}

@media (max-width: 768px) {
  .glass-container {
    width: 100%;
    min-height: auto;
    padding: 20px 16px;
    border-radius: 20px;
  }

  .header-section {
    padding-bottom: 0;
  }

  .title {
    font-size: 22px;
  }

  .subtitle {
    font-size: 13px;
  }

  .info {
    &-section {
      max-width: 100%;
      gap: 16px;
    }

    &-text {
      font-size: 14px;
    }
  }

  .config {
    &-card {
      gap: 16px;
      padding: 16px 20px;
    }

    &-icon {
      font-size: 36px;
    }

    &-title {
      white-space: nowrap;
      font-size: 17px;
    }

    &-desc {
      font-size: 13px;
    }
  }

  .upload {
    &-zone {
      padding: 24px 20px;
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

  .progress-bar-container {
    max-width: 100%;
  }

  .processing-stats {
    flex-direction: column;
    gap: 12px;
    padding: 16px 20px;
  }

  .result {
    &-stats {
      flex-direction: column;
      gap: 12px;
    }

    &-card {
      width: 100%;
      padding: 16px 24px;
    }
  }

  .action-buttons {
    width: 100%;
    flex-direction: column;
    gap: 12px;
  }

  .main-glass-button {
    width: 100%;
    justify-content: center;
    padding: 14px 24px;
  }

  /* 配置模态框移动端适配 */
  .jyut2ipa-config {
    &-header {
      flex-wrap: wrap;
      gap: 12px;
    }

    &-title {
      font-size: 18px;
    }

    &-footer {
      flex-wrap: wrap;
      margin-inline: -24px;
      margin-bottom: -20px;
      padding: 12px 16px;
    }
  }

  .header {
    &-left {
      width: 100%;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    &-stats {
      flex-wrap: wrap;
      gap: 8px;
    }

    &-actions {
      width: 100%;
      justify-content: space-between;
    }
  }

  .stat-inline {
    font-size: 12px;
  }

  .category-tabs {
    gap: 6px;
    padding: 12px 16px;
    overflow-x: auto;
  }

  .category-tab {
    padding: 8px 12px;
    white-space: nowrap;
    font-size: 13px;
  }

  .rules {
    &-table-container {
      border-radius: 12px;
    }

    &-table {
      font-size: 12px;

      th,
      td {
        padding: 8px 6px;
      }
    }
  }

  .add-rule-btn {
    width: 100%;
    order: -1;
    margin-bottom: 8px;
  }

  .footer-actions {
    width: 100%;
    justify-content: stretch;
    gap: 8px;

    .main-glass-button {
      flex: 1;
    }
  }
}

```

