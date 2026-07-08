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
          @click="$refs.fileInput.click()"
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

        <div class="info-section">
          <p class="info-text">{{ t('tools.jyut2ipa.upload.info') }}</p>

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
import { usePollingTask } from '@/composables/core/usePollingTask.js'
import { useStorageState } from '@/composables/core/useStorageState.js'
import { useAuthGuard } from '@/composables/router/useAuthGuard.js'
import {
  downloadJyut2IpaResult,
  processJyut2Ipa,
  getJyut2IpaProgress,
  uploadJyutFile
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
const importInput = ref(null)
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
    processFile(file)
  }
}

const handleDrop = (event) => {
  isDragOver.value = false
  const file = event.dataTransfer.files[0]
  if (file) {
    processFile(file)
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

const processFile = async (file) => {
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
    const uploadData = await uploadJyutFile(file)

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

<style scoped>
.jyut2ipa-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4px;
  padding-top:25px ;
}

.glass-container {
  width: min(95dvw, 800px);
  padding: 40px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.header-section {
  text-align: center;
  margin-bottom: 12px;
  position: relative;
}

.title {
  font-size: 28px;
  font-weight: 600;
  color: #0b2540;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 14px;
  color: rgba(11, 37, 64, 0.7);
  margin: 0;
}

.config-btn {
  position: absolute;
  top: 0;
  right: 0;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.config-btn:hover {
  background: rgba(0, 122, 255, 0.7);
  transform: rotate(90deg);
}

.upload-area {
  display: flex;
  flex-direction: column;
  gap: 24px;
  justify-content: center;
  align-items: center;
}

.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 30px 40px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 2px dashed rgba(0, 122, 255, 0.3);
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-zone:hover,
.upload-zone.drag-over {
  background: rgba(0, 122, 255, 0.05);
  border-color: rgba(0, 122, 255, 0.6);
  transform: scale(1.02);
}

.upload-icon {
  font-size: 64px;
  animation: float 3s ease-in-out infinite;
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

.upload-title {
  font-size: 20px;
  font-weight: 500;
  color: #0b2540;
  margin: 0;
  white-space: nowrap;
}

.upload-hint {
  font-size: 14px;
  color: rgba(11, 37, 64, 0.6);
  margin: 0;
}

.info-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 20px;
}

.card-icon {
  font-size: 32px;
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 13px;
  font-weight: 600;
  color: #0b2540;
  margin-bottom: 4px;
}

.card-text {
  font-size: 12px;
  color: rgba(11, 37, 64, 0.7);
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

.progress-bar-container {
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

.progress-text {
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #0b2540;
}

.processing-stats {
  display: flex;
  gap: 24px;
  padding: 20px 32px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 16px;
}

.stat-item {
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.stat-label {
  color: rgba(11, 37, 64, 0.7);
}

.stat-value {
  font-weight: 600;
  color: #0b2540;
}

.stat-value.success {
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

.result-stats {
  display: flex;
  gap: 20px;
}

.result-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 32px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  min-width: 120px;
}

.result-number {
  font-size: 36px;
  font-weight: 700;
  color: #0b2540;
}

.result-number.success {
  color: #34c759;
}

.result-number.error {
  color: #ff3b30;
}

.result-label {
  font-size: 14px;
  color: rgba(11, 37, 64, 0.7);
}

.action-buttons {
  display: flex;
  gap: 16px;
}

.preview-section {
  width: 100%;
  margin-top: 24px;
}

.preview-title {
  font-size: 16px;
  font-weight: 600;
  color: #0b2540;
  margin: 0 0 12px 0;
}

.preview-table-wrapper {
  max-height: 200px;
  overflow: auto;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.4);
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.preview-table thead {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
}

.preview-table th,
.preview-table td {
  padding: 10px 16px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

.preview-table th {
  font-weight: 600;
  color: #0b2540;
}

.ipa-text {
  font-family: 'Doulos SIL', 'Charis SIL', serif;
  color: rgba(0, 122, 255, 0.9);
}

/* 模态框样式 */
.jyut2ipa-config-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;
}

.jyut2ipa-config-title {
  margin:3px;
  white-space: nowrap;
}

.header-stats {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-inline {
  font-size: 14px;
  color: rgba(11, 37, 64, 0.7);
  white-space: nowrap;
}

.stat-inline strong {
  font-weight: 700;
  color: #0b2540;
  margin-left: 4px;
}

.stat-inline strong.success {
  color: #34c759;
}

.stat-inline strong.disabled {
  color: #999;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 30px;
}

/* 标签页 */
.config-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 32px 0;
  border-bottom: 2px solid rgba(0, 0, 0, 0.05);
}

.config-tab {
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 15px;
  color: rgba(11, 37, 64, 0.6);
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.config-tab:hover {
  background: rgba(0, 122, 255, 0.05);
  color: #0b2540;
}

.config-tab.active {
  color: #007aff;
  border-bottom-color: #007aff;
  font-weight: 600;
}

.jyut2ipa-config-content {
  min-height: 0;
  justify-items: center;
}

/* 规则表格 */
.rules-table-container {
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.3);
  margin-bottom: 16px;
}

.rules-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.rules-table thead {
  background: rgba(0, 122, 255, 0.08);
  position: sticky;
  top: 0;
  z-index: 10;
}

.rules-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #0b2540;
  border-bottom: 2px solid rgba(0, 122, 255, 0.1);
  white-space: nowrap;
}

.rules-table td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

.rules-table tbody tr:hover {
  background: rgba(0, 122, 255, 0.03);
}

.table-input {
  width: 100%;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 122, 255, 0.15);
  border-radius: 6px;
  font-size: 13px;
  font-family: 'Courier New', monospace;
  transition: all 0.2s ease;
}

.table-input:focus {
  outline: none;
  border-color: rgba(0, 122, 255, 0.5);
  background: white;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.05);
}

/* 类别徽章 */
.category-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.category-badge.cat-wf {
  background: #fef3c7;
  color: #92400e;
}

.category-badge.cat-sm {
  background: #dbeafe;
  color: #1e40af;
}

.category-badge.cat-jd {
  background: #fce7f3;
  color: #9f1239;
}

.category-badge.cat-wm {
  background: #d1fae5;
  color: #065f46;
}

/* 删除按钮 */
.btn-delete {
  padding: 5px 10px;
  background: rgba(255, 59, 48, 0.1);
  border: 1px solid rgba(255, 59, 48, 0.3);
  border-radius: 6px;
  color: #ff3b30;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-delete:hover {
  background: rgba(255, 59, 48, 0.2);
  transform: scale(1.05);
}

/* 添加规则按钮 */
.btn-add-rule {
  padding: 12px;
  background: linear-gradient(135deg, rgba(52, 199, 89, 0.7), rgba(52, 199, 89, 0.5));
  border: 1px solid rgba(52, 199, 89, 0.5);
  border-radius: 10px;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: block;
  margin: 0 auto;
  max-width: 200px;
}

.btn-add-rule:hover {
  background: linear-gradient(135deg, rgba(52, 199, 89, 0.8), rgba(52, 199, 89, 0.6));
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(52, 199, 89, 0.3);
}

.jyut2ipa-config-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin: 20px -24px -20px;
  padding: 20px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.5);
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
}

.icon-btn:hover {
  background: rgba(0, 122, 255, 0.2);
  transform: scale(1.1);
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 600px;
}

.info-text {
  font-size: 16px;
  line-height: 1.6;
  color: rgba(7, 25, 44, 0.8);
  text-align: center;
  margin: 0;
}

.config-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 32px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.config-card:hover {
  background: rgba(255, 255, 255, 0.65);
  border-color: rgba(0, 122, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 122, 255, 0.15);
}

.config-card:active {
  transform: translateY(0);
}

.config-icon {
  font-size: 48px;
  flex-shrink: 0;
  line-height: 1;
}

.config-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.config-title {
  font-size: 20px;
  font-weight: 600;
  color: #0b2540;
  margin: 0;
}

.config-desc {
  font-size: 14px;
  color: rgba(11, 37, 64, 0.7);
  margin: 0;
}

.config-arrow {
  font-size: 24px;
  color: rgba(0, 122, 255, 0.8);
  flex-shrink: 0;
  line-height: 1;
  transition: transform 0.3s ease;
}

.config-card:hover .config-arrow {
  transform: translateX(4px);
}

@media (max-width: 768px) {
  .glass-container {
    padding: 20px 16px;
    border-radius: 20px;
    width: 100%;
    min-height: auto;
  }

  .header-section {
    padding-bottom: 0px;
  }

  .title {
    font-size: 22px;
  }

  .subtitle {
    font-size: 13px;
  }

  .info-section {
    max-width: 100%;
    gap: 16px;
  }

  .info-text {
    font-size: 14px;
  }

  .config-card {
    padding: 16px 20px;
    gap: 16px;
  }

  .config-icon {
    font-size: 36px;
  }

  .config-title {
    font-size: 17px;
    white-space: nowrap;
  }

  .config-desc {
    font-size: 13px;
  }

  .upload-zone {
    padding: 24px 20px;
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

  .progress-bar-container {
    max-width: 100%;
  }

  .processing-stats {
    flex-direction: column;
    gap: 12px;
    padding: 16px 20px;
  }

  .result-stats {
    flex-direction: column;
    gap: 12px;
  }

  .result-card {
    width: 100%;
    padding: 16px 24px;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
    gap: 12px;
  }

  .main-glass-button {
    width: 100%;
    justify-content: center;
    padding: 14px 24px;
  }

  /* 配置模态框移动端适配 */
  .jyut2ipa-config-header {
    flex-wrap: wrap;
    gap: 12px;
  }

  .header-left {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .header-stats {
    flex-wrap: wrap;
    gap: 8px;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .jyut2ipa-config-title {
    font-size: 18px;
  }

  .stat-inline {
    font-size: 12px;
  }

  .category-tabs {
    padding: 12px 16px;
    gap: 6px;
    overflow-x: auto;
  }

  .category-tab {
    padding: 8px 12px;
    font-size: 13px;
    white-space: nowrap;
  }

  .rules-table-container {
    border-radius: 12px;
  }

  .rules-table {
    font-size: 12px;
  }

  .rules-table th,
  .rules-table td {
    padding: 8px 6px;
  }

  .jyut2ipa-config-footer {
    margin-inline: -24px;
    margin-bottom: -20px;
    padding: 12px 16px;
    flex-wrap: wrap;
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
  }

  .footer-actions .main-glass-button {
    flex: 1;
  }
}

</style>
