<template>

  <div class="praat-page">
<!--    &lt;!&ndash; Login Button (top right) &ndash;&gt;-->
<!--    <div v-if="!userStore.isAuthenticated" class="login-prompt">-->
<!--      <button class="login-button main-glass-button" @click="goToLogin">-->
<!--        <span>🔒</span>-->
<!--        <span>請先登錄</span>-->
<!--      </button>-->
<!--    </div>-->
    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <div class="tab-container">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'upload' }"
          @click="switchTab('upload')"
        >
          {{ t('praat.main.tabs.upload') }}
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'results', disabled: !resultsTabEnabled }"
          :disabled="!resultsTabEnabled"
          @click="switchTab('results')"
        >
          {{ t('praat.main.tabs.results') }}
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'vowelspace', disabled: !vowelspaceTabEnabled }"
          :disabled="!vowelspaceTabEnabled"
          @click="switchTab('vowelspace')"
        >
          {{ t('praat.main.tabs.vowelSpace') }}
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'pitchtone', disabled: !pitchtoneTabEnabled }"
          :disabled="!pitchtoneTabEnabled"
          @click="switchTab('pitchtone')"
        >
          {{ t('praat.main.tabs.pitchTone') }}
        </button>
      </div>
    </div>

    <div class="page-header">
      <h1 class="page-title">{{ t('praat.main.title') }}</h1>
      <p v-if="activeTab === 'upload'" class="page-description">{{ t('praat.main.description') }}</p>
    </div>

<!--    <div class="page-content">-->
      <!-- Tab Content (using v-show for keep-alive behavior) -->
      <!-- Tab 1: Prepare Analysis -->
      <div v-show="activeTab === 'upload'" class="page-content" :class="{ 'tab-hidden': activeTab !== 'upload' }">
          <!-- Settings Button and Mode Selector -->
          <div class="settings-trigger">
            <button class="settings-button main-glass-button" @click="showSettings = true">
              <span class="settings-icon">⚙️</span>
              <span>{{ t('praat.main.settings.button') }}</span>
            </button>

            <div class="mode-selector-inline">
              <div class="mode-options">
                <label class="radio-option main-glass-button" :class="{ active: settings.mode === 'single' }">
                  <input type="radio" value="single" v-model="settings.mode" />
                  <span>{{ t('praat.main.mode.single') }}</span>
                </label>
                <label class="radio-option main-glass-button" :class="{ active: settings.mode === 'continuous' }">
                  <input type="radio" value="continuous" v-model="settings.mode" />
                  <span>{{ t('praat.main.mode.continuous') }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Audio Input -->
          <AudioInputPanel
            :selected-segment="selectedSegment"
            @file-selected="handleFileSelected"
            @segments-ready="handleSegmentsReady"
            @clear-selection="handleClearSelection"
          />

          <!-- Start Analysis Button -->
<!--          <div v-if="audioFile && !jobId" class="action-section">-->
          <div  class="action-section">
            <button
                class="start-button main-glass-button"
                @click="startAnalysis"
                :disabled="isActionLocked"
                :class="{ 'disabled-state': !audioFile }"
            >
              <span v-if="isUploading">{{ t('praat.main.actions.uploading') }}</span>
              <span v-else-if="isAnalyzing || isActiveJobStatus(normalizedJobStatus)">{{ t('praat.main.actions.analysisInProgress') }}</span>
              <span v-else-if="!audioFile">{{ t('praat.main.actions.pleaseSelectAudio') }}</span>
              <span v-else>{{ t('praat.main.actions.startAnalysis') }}</span>
            </button>
          </div>
        </div>

      <!-- Tab 2: Analysis Results -->
      <div v-show="activeTab === 'results'" class="page-content" :class="{ 'tab-hidden': activeTab !== 'results' }">
          <!-- Job Status Panel (shown during analysis, including upload phase) -->
          <JobStatusPanel
            v-if="shouldShowJobStatusPanel"
            :job-id="jobId"
            :status="normalizedJobStatus"
            :progress="jobProgress"
            :stage="jobStage"
            :error="jobError"
            @cancel="cancelAnalysis"
          />

          <!-- No Results Message -->
          <div v-else-if="!analysisResults" class="no-results-state main-glass-panel">
            <div class="no-results-icon">📊</div>
            <h3 class="no-results-title">{{ t('praat.main.noResults.title') }}</h3>
            <p class="no-results-text">{{ t('praat.main.noResults.text') }}</p>
          </div>

          <!-- Analysis Results -->
          <AnalysisResultsPanel v-else :results="analysisResults" />
        </div>

      <!-- Tab 3: Vowel Space - NEW -->
      <div v-show="activeTab === 'vowelspace'" class="page-content" :class="{ 'tab-hidden': activeTab !== 'vowelspace' }">
        <VowelSpacePanel :results="analysisResults" />
      </div>

      <!-- Tab 4: Pitch Tone - NEW -->
      <div v-show="activeTab === 'pitchtone'" class="page-content" :class="{ 'tab-hidden': activeTab !== 'pitchtone' }">
        <PitchTonePanel :results="analysisResults" />
      </div>
<!--    </div>-->

    <!-- Job Status (Left Floating Window) - REMOVED, now inline in Tab 2 -->

    <!-- Settings Sidebar -->
    <Transition name="overlay">
      <div v-if="showSettings" class="sidebar-overlay" @click="showSettings = false"></div>
    </Transition>

    <Transition name="sidebar">
      <div v-if="showSettings" class="settings-sidebar">
        <div class="sidebar-header">
          <h2 class="sidebar-title">{{ t('praat.main.settings.title') }}</h2>
          <button class="close-btn close-btn-lg" @click="showSettings = false">✕</button>
        </div>
        <div class="sidebar-content">
          <SettingsPanel
            :settings="settings"
            @update:settings="newSettings => Object.assign(settings, newSettings)"
          />
        </div>
      </div>
    </Transition>

    <!-- Audio Preview Floating Window (Only on Tab 1) -->
    <Transition name="preview-fade">
      <div v-if="showAudioPreview" class="audio-preview-float">
        <button class="close-btn close-btn-sm close-btn-corner" @click="showPreview = false" :title="t('praat.main.closePreview')">
          ✕
        </button>
        <AudioPreviewPanel
          :audio-blob="audioBlob"
          :segments="audioSegments"
          @segment-selected="handleSegmentSelected"
          @manual-segments-ready="handleManualSegmentsReady"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, onBeforeUnmount, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AudioInputPanel from '../components/praat/AudioInputPanel.vue'
import AudioPreviewPanel from '../components/praat/AudioPreviewPanel.vue'
import SettingsPanel from '../components/praat/SettingsPanel.vue'
import JobStatusPanel from '../components/praat/JobStatusPanel.vue'
import AnalysisResultsPanel from '../components/praat/AnalysisResultsPanel.vue'
import VowelSpacePanel from '../components/praat/VowelSpacePanel.vue'
import PitchTonePanel from '../components/praat/PitchTonePanel.vue'
import { usePraatApi } from '@/api'
import { userStore } from '@/main/store/store.js'
import { showError, showWarning } from '@/utils/ui/message.js'
import { usePollingTask } from '@/composables/core/usePollingTask.js'
import { useStorageState } from '@/composables/core/useStorageState.js'
import { useAuthGuard } from '@/composables/router/useAuthGuard.js'
import { useRouteQueryState } from '@/composables/router/useRouteQueryState.js'

const route = useRoute()
const { t } = useI18n()
const { uploadAudio, createJob, getJobStatus, getJobResult, cancelJob } = usePraatApi()
const { requireAuth } = useAuthGuard({
  defaultRedirect: '/explore/tools/praat',
})

const STORAGE_KEY = 'praat_analysis_settings'
const VALID_TABS = ['upload', 'results', 'vowelspace', 'pitchtone']

// Tab state - sync with router
const { state: activeTab, set: setActiveTab } = useRouteQueryState('tab', {
  defaultValue: 'upload',
  parse: (value) => VALID_TABS.includes(value) ? value : 'upload',
  serialize: (value) => value,
})
const resultsTabEnabled = ref(false)

// Vowel space tab enabled state
const vowelspaceTabEnabled = computed(() => {
  return analysisResults.value &&
         analysisResults.value.timeseries?.formants?.f1 &&
         analysisResults.value.timeseries?.formants?.f2
})

// Pitch tone tab enabled state
const pitchtoneTabEnabled = computed(() => {
  return analysisResults.value &&
         analysisResults.value.timeseries?.pitch_hz &&
         analysisResults.value.timeseries.pitch_hz.length > 0
})

// UI state
const showSettings = ref(false)
const showPreview = ref(true)

// Tab switching function
const switchTab = async (tab) => {
  if (tab === 'results' && !resultsTabEnabled.value) return
  if (tab === 'vowelspace' && !vowelspaceTabEnabled.value) return
  if (tab === 'pitchtone' && !pitchtoneTabEnabled.value) return

  tracePraat('tab.switch', {
    nextTab: tab,
  })
  await setActiveTab(tab)

  // Auto-show preview when returning to Tab 1 if there's audio data
  if (tab === 'upload' && (audioBlob.value || audioSegments.value.length > 0)) {
    showPreview.value = true
  }
}

// Computed property for audio preview visibility
const showAudioPreview = computed(() => {
  return activeTab.value === 'upload' && (audioBlob.value || audioSegments.value.length > 0) && showPreview.value
})

// Audio state
const audioFile = ref(null)
const audioBlob = ref(null)
const audioSegments = ref([])
const selectedSegment = ref(null)
const currentAudioDuration = ref(null)

// Segment preservation state
const originalSegments = ref([])  // Store first uploaded segments
const segmentOriginMode = ref(null)  // 'original' | 'auto-split' | null

// Upload state
const isUploading = ref(false)
const uploadId = ref(null)

// Job state
const jobId = ref(null)
const jobStatus = ref('idle')
const jobProgress = ref(0)
const jobStage = ref(null)
const jobError = ref(null)
const pollingFailCount = ref(0)  // ✅ 添加失败计数器
const isAnalyzing = ref(false)   // ✅ 分析进行中标志（包括上传阶段）
const isFetchingResults = ref(false)

// Results
const analysisResults = ref(null)

const normalizeJobStatus = (status) => {
  switch (status) {
    case 'queued':
      return 'queued'
    case 'running':
    case 'processing':
      return 'processing'
    case 'completed':
    case 'done':
      return 'completed'
    case 'failed':
    case 'error':
      return 'error'
    case 'canceled':
    case 'cancelled':
      return 'canceled'
    default:
      return 'idle'
  }
}

const normalizedJobStatus = computed(() => normalizeJobStatus(jobStatus.value))

const isActiveJobStatus = (status) => {
  return status === 'queued' || status === 'processing'
}

const MAX_JOB_NOT_READY_WARMUP_RETRIES = 3
const MAX_RESULT_NOT_READY_RETRIES = 4
const RESULT_NOT_READY_RETRY_MS = 800
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const isJobNotReadyError = (error) => {
  if ((error?.status ?? error?.response?.status) !== 404) {
    return false
  }

  return error?.detail?.error?.code === 'JOB_NOT_FOUND'
}

const PRAAT_TRACE_ENABLED = import.meta.env.DEV

const getErrorTracePayload = (error) => ({
  message: error?.message ?? null,
  status: error?.status ?? error?.response?.status ?? null,
  code: error?.detail?.error?.code ?? null,
  detail: error?.detail ?? null,
})

const tracePraat = (event, payload = {}) => {
  if (!PRAAT_TRACE_ENABLED) {
    return
  }

  console.log(`[Praat trace] ${event}`, {
    at: new Date().toISOString(),
    activeTab: activeTab.value,
    uploadId: uploadId.value,
    jobId: jobId.value,
    normalizedJobStatus: normalizedJobStatus.value,
    isUploading: isUploading.value,
    isAnalyzing: isAnalyzing.value,
    ...payload,
  })
}

const isActionLocked = computed(() => {
  if (!audioFile.value) {
    return true
  }

  return isUploading.value || isAnalyzing.value || isActiveJobStatus(normalizedJobStatus.value)
})

const shouldShowJobStatusPanel = computed(() => {
  if (isAnalyzing.value) {
    return true
  }

  return Boolean(
    jobId.value &&
    (
      normalizedJobStatus.value === 'error' ||
      normalizedJobStatus.value === 'canceled'
    )
  )
})

const normalizePercentProgress = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return 0
  }

  return Math.min(100, Math.max(0, Math.round(numeric)))
}

const getCurrentAudioDuration = () => {
  return currentAudioDuration.value
    ?? selectedSegment.value?.duration
    ?? originalSegments.value[0]?.duration
    ?? null
}

const resetAnalysisState = ({ cancelCurrentJob = false } = {}) => {
  const currentJobId = jobId.value
  const currentStatus = normalizedJobStatus.value
  tracePraat('analysis.reset', {
    cancelCurrentJob,
    currentJobId,
    currentStatus,
  })
  stopPolling()
  if (cancelCurrentJob && currentJobId && isActiveJobStatus(currentStatus)) {
    tracePraat('analysis.cancel-before-reset', {
      currentJobId,
      currentStatus,
    })
    cancelJob(currentJobId).catch(console.error)
  }

  uploadId.value = null
  jobId.value = null
  jobStatus.value = 'idle'
  jobProgress.value = 0
  jobStage.value = null
  jobError.value = null
  pollingFailCount.value = 0
  isUploading.value = false
  isAnalyzing.value = false
  isFetchingResults.value = false
  analysisResults.value = null
  resultsTabEnabled.value = false
}

const setSingleAudioSelection = (payload) => {
  resetAnalysisState({ cancelCurrentJob: true })

  const originalSegment = {
    file: payload.file,
    blob: payload.blob,
    duration: payload.duration ?? 0,
    startTime: 0,
    endTime: payload.duration ?? 0,
    index: 0,
    name: payload.file.name,
    origin: payload.origin || 'original',
  }

  audioFile.value = payload.file
  audioBlob.value = payload.blob
  audioSegments.value = [originalSegment]
  selectedSegment.value = originalSegment
  currentAudioDuration.value = payload.duration ?? null
  showPreview.value = true

  originalSegments.value = [originalSegment]
  segmentOriginMode.value = payload.origin || 'original'
  setActiveTab('upload')
}

const setSegmentsSelection = (segments, originMode) => {
  resetAnalysisState({ cancelCurrentJob: true })

  audioSegments.value = segments
  audioBlob.value = null
  selectedSegment.value = segments[0] || null
  audioFile.value = selectedSegment.value?.file || null
  currentAudioDuration.value = selectedSegment.value?.duration ?? null
  showPreview.value = true

  originalSegments.value = [...segments]
  segmentOriginMode.value = originMode
  setActiveTab('upload')
}

// Default settings
const defaultSettings = {
  mode: 'single',
  modules: ['basic', 'pitch', 'intensity', 'formant'],
  pitch_options: {
    f0_min: 75,
    f0_max: 500,
    time_step: 0.01  // Pitch analysis time step (separate from format)
  },
  formant_options: {
    max_formants: 5,
    max_freq_hz: 5500,
    time_step: 0.005  // Output format time step (default: standard - 5ms)
  },
  intensity_options: {
    min_pitch: 100
  },
  output_options: {
    downsample_hz: 100,
    include_timeseries: true,
    include_summary: true
  },
  spectrogram_options: {
    window_length: 0.005,
    time_step: 0.002,
    frequency_step: 20.0,
    max_frequency: 8000.0
  }
}

const cloneSettings = (value) => JSON.parse(JSON.stringify(value))
const hydrateSettings = (value) => ({
  ...cloneSettings(defaultSettings),
  ...(value || {}),
})

const settingsStorage = useStorageState(STORAGE_KEY, {
  defaultValue: cloneSettings(defaultSettings),
})

// Load settings from localStorage
const loadSettings = () => {
  try {
    return hydrateSettings(settingsStorage.state.value)
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
  return cloneSettings(defaultSettings)
}

// Save settings to localStorage
const saveSettings = () => {
  try {
    settingsStorage.write(cloneSettings(settings))
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

// Settings
const settings = reactive(loadSettings())

// Watch settings changes and save to localStorage
watch(settings, () => {
  saveSettings()
}, { deep: true })

// Polling
const MAX_POLLING_FAILURES = 5
// 统一轮询状态与清理逻辑，避免页面切换、重复分析时残留旧定时器。
const pollingTask = usePollingTask({
  intervalMs: 1100,
  maxFailures: MAX_POLLING_FAILURES,
})

const handleFileSelected = (payload) => {
  setSingleAudioSelection(payload)
}

const handleSegmentsReady = (segments) => {
  setSegmentsSelection(segments, 'auto-split')
}

const handleManualSegmentsReady = (segments) => {
  if (segments.length === 0) {
    resetAnalysisState({ cancelCurrentJob: true })

    if (originalSegments.value.length > 0) {
      audioSegments.value = [...originalSegments.value]
      audioFile.value = originalSegments.value[0].file
      audioBlob.value = segmentOriginMode.value === 'original'
        ? originalSegments.value[0].blob
        : null
      selectedSegment.value = originalSegments.value[0]
      currentAudioDuration.value = originalSegments.value[0].duration ?? null
      showPreview.value = true
      setActiveTab('upload')
    } else {
      audioSegments.value = []
      audioFile.value = null
      audioBlob.value = null
      selectedSegment.value = null
      currentAudioDuration.value = null
      originalSegments.value = []
      segmentOriginMode.value = null
      showPreview.value = false
      setActiveTab('upload')
    }
    return
  }

  resetAnalysisState({ cancelCurrentJob: true })

  if (segmentOriginMode.value === 'original') {
    const originalSeg = originalSegments.value[0]
    audioSegments.value = [originalSeg, ...segments]
    audioBlob.value = originalSeg?.blob || null
  } else {
    audioSegments.value = segments
    audioBlob.value = null
  }

  const firstManualSegment = audioSegments.value.find(s => s.origin === 'manual')
  selectedSegment.value = firstManualSegment || audioSegments.value[0]
  audioFile.value = selectedSegment.value?.file || null
  currentAudioDuration.value = selectedSegment.value?.duration ?? null
  showPreview.value = true
  setActiveTab('upload')
}

const handleSegmentSelected = (segment) => {
  selectedSegment.value = segment
  if (segment.file) {
    audioFile.value = segment.file
  }
  if (segment.blob) {
    audioBlob.value = segment.blob
  }
  currentAudioDuration.value = segment.duration ?? currentAudioDuration.value
}

const handleClearSelection = () => {
  resetAnalysisState({ cancelCurrentJob: true })
  audioFile.value = null
  audioBlob.value = null
  audioSegments.value = []
  selectedSegment.value = null
  currentAudioDuration.value = null
  originalSegments.value = []
  segmentOriginMode.value = null
  showPreview.value = false
  setActiveTab('upload')
}

const startAnalysis = async () => {
  if (!audioFile.value) return
  if (isUploading.value || isAnalyzing.value || isActiveJobStatus(normalizedJobStatus.value)) {
    showWarning(t('praat.main.errors.analysisInProgress'))
    return
  }

  const duration = getCurrentAudioDuration()
  const hasSpectrogramModule = settings.modules && settings.modules.includes('spectrogram')
  const isAdmin = userStore.role === 'admin'

  if (hasSpectrogramModule && duration && duration > 3 && !isAdmin) {
    showWarning(
      t('praat.main.errors.durationExceeded', {
        duration: duration.toFixed(1),
      }),
      5000,
    )

    setTimeout(() => {
      showSettings.value = true
    }, 300)
    return
  }

  // 进入分析前统一走鉴权封装，保留原来的 toast + 登录跳转 + redirect 回跳行为。
  const authed = await requireAuth({
    message: t('praat.main.errors.loginRequired'),
    redirect: route.fullPath || '/explore/tools/praat',
  })
  if (!authed) {
    return
  }

  analysisResults.value = null
  jobStatus.value = 'queued'
  jobProgress.value = 0
  jobStage.value = t('praat.main.status.preparingUpload')
  jobError.value = null
  isAnalyzing.value = true
  resultsTabEnabled.value = true
  tracePraat('analysis.start', {
    fileName: audioFile.value?.name ?? null,
    duration,
    hasSpectrogramModule,
    modules: Array.isArray(settings.modules) ? [...settings.modules] : [],
  })

  try {
    isUploading.value = true
    jobStage.value = t('praat.main.status.uploading')
    const uploadResponse = await uploadAudio(audioFile.value)
    uploadId.value = uploadResponse.task_id
    tracePraat('analysis.uploaded', {
      uploadTaskId: uploadResponse.task_id,
      normalizedMeta: uploadResponse.normalized_meta ?? null,
      audioMetadata: uploadResponse.audio_metadata ?? null,
    })

    const uploadedDuration = uploadResponse.normalized_meta?.duration_s
      || uploadResponse.audio_metadata?.duration_s
      || duration
    currentAudioDuration.value = uploadedDuration ?? currentAudioDuration.value

    if (hasSpectrogramModule && uploadedDuration && uploadedDuration > 3 && !isAdmin) {
      showWarning(
        t('praat.main.errors.durationExceeded', {
          duration: uploadedDuration.toFixed(1),
        }),
        5000,
      )

      setTimeout(() => {
        showSettings.value = true
      }, 300)

      jobStatus.value = 'idle'
      jobStage.value = ''
      uploadId.value = null
      await setActiveTab('upload')
      isAnalyzing.value = false
      isUploading.value = false
      return
    }

    if (hasSpectrogramModule && uploadedDuration && uploadedDuration > 3 && isAdmin) {
      console.log(`[Praat] Admin user bypassing 3s limit for spectrogram analysis (duration: ${uploadedDuration}s)`)
    }

    jobStage.value = t('praat.main.status.creatingJob')
    const jobResponse = await createJob(uploadId.value, settings)
    jobId.value = jobResponse.job_id
    tracePraat('analysis.job-created', {
      currentUploadId: uploadId.value,
      createdJobId: jobResponse.job_id,
      jobResponse,
    })

    await setActiveTab('results')
    isUploading.value = false

    jobStage.value = t('praat.main.status.startingAnalysis')
    await startPolling()
  } catch (error) {
    console.error('Start analysis error:', error)
    showError(error.message || t('praat.main.errors.analysisStartFailed'))
    await setActiveTab('results')
    isUploading.value = false
    jobStatus.value = 'error'
    jobError.value = error.message
    isAnalyzing.value = false
  }
}

const startPolling = async () => {
  pollingFailCount.value = 0
  const currentJobId = jobId.value
  const pollCurrentJobStatus = () => getJobStatus(currentJobId)
  let warmupNotFoundRetries = 0
  tracePraat('polling.start', {
    currentJobId,
  })

  await pollingTask.start(
    async () => {
      try {
        return await pollCurrentJobStatus()
      } catch (error) {
        if (isJobNotReadyError(error) && warmupNotFoundRetries < MAX_JOB_NOT_READY_WARMUP_RETRIES) {
          warmupNotFoundRetries += 1
          return {
            status: 'queued',
            progress: 0,
            stage: jobStage.value || t('praat.main.status.startingAnalysis'),
            error: null,
          }
        }

        throw error
      }
    },
    {
      onTick: async (status) => {
        pollingFailCount.value = 0
        jobStatus.value = status.status
        if (status.progress !== undefined && status.progress !== null) {
          jobProgress.value = normalizePercentProgress(status.progress)
        }
        jobStage.value = status.stage
        jobError.value = status.error
        tracePraat('polling.tick', {
          currentJobId,
          status: status.status,
          normalizedStatus: normalizeJobStatus(status.status),
          progress: status.progress ?? null,
          stage: status.stage ?? null,
          error: status.error ?? null,
        })

        const nextStatus = normalizeJobStatus(status.status)
        if (nextStatus === 'completed') {
          jobProgress.value = 100
          tracePraat('polling.completed-before-result', {
            currentJobId,
            rawStatus: status.status,
            stage: status.stage ?? null,
          })
          await fetchResults(currentJobId)
          isAnalyzing.value = false
          return
        }

        if (nextStatus === 'error') {
          showError(status.error || t('praat.main.errors.analysisFailed'))
          isAnalyzing.value = false
          return
        }

        if (nextStatus === 'canceled') {
          jobError.value = null
          isAnalyzing.value = false
        }
      },
      shouldStop: (status) => {
        const nextStatus = normalizeJobStatus(status.status)
        return nextStatus === 'completed' || nextStatus === 'error' || nextStatus === 'canceled'
      },
      onError: (error, count) => {
        console.error('Polling error:', error)
        pollingFailCount.value = count
        tracePraat('polling.error', {
          currentJobId,
          count,
          error: getErrorTracePayload(error),
        })
      },
      onMaxFailures: () => {
        jobStatus.value = 'error'
        jobError.value = t('praat.main.status.pollingFailed')
        showError(t('praat.main.status.pollingFailedCount', { count: MAX_POLLING_FAILURES }))
        isAnalyzing.value = false
        tracePraat('polling.max-failures', {
          currentJobId,
          maxFailures: MAX_POLLING_FAILURES,
        })
      },
      immediate: false,
    }
  )
}

const stopPolling = () => {
  // 取消分析、离开页面、或开始新任务时都复用同一个 stop 入口。
  pollingTask.stop()
}

const fetchResults = async (currentJobId) => {
  isFetchingResults.value = true
  jobStage.value = t('praat.main.status.fetchingResults')

  try {
    for (let attempt = 0; attempt <= MAX_RESULT_NOT_READY_RETRIES; attempt += 1) {
      try {
        tracePraat('result.request', {
          currentJobId,
          attempt,
        })
        const results = await getJobResult(currentJobId, 'full')
        analysisResults.value = results
        tracePraat('result.success', {
          currentJobId,
          attempt,
          resultKeys: results ? Object.keys(results) : [],
        })
        return
      } catch (error) {
        let statusSnapshot = null
        try {
          statusSnapshot = await getJobStatus(currentJobId)
        } catch (statusError) {
          statusSnapshot = {
            statusCheckFailed: true,
            error: getErrorTracePayload(statusError),
          }
        }

        tracePraat('result.error', {
          currentJobId,
          attempt,
          error: getErrorTracePayload(error),
          statusSnapshot,
        })

        if (!isJobNotReadyError(error) || attempt === MAX_RESULT_NOT_READY_RETRIES) {
          console.error('Fetch results error:', error)
          jobStatus.value = 'error'
          jobError.value = t('praat.main.errors.resultsFetchFailed')
          showError(t('praat.main.errors.resultsFetchFailed'))
          return
        }

        await wait(RESULT_NOT_READY_RETRY_MS)
      }
    }
  } finally {
    isFetchingResults.value = false
  }
}

const cancelAnalysis = async () => {
  if (!jobId.value) return
  const currentJobId = jobId.value

  try {
    stopPolling()
    await cancelJob(currentJobId)
    jobStatus.value = 'canceled'
    jobStage.value = null
    jobError.value = null
    isUploading.value = false
    isAnalyzing.value = false
    isFetchingResults.value = false
  } catch (error) {
    console.error('Cancel error:', error)
    showError(t('praat.main.errors.cancelFailed'))
  }
}

// Cleanup on page close
onBeforeUnmount(() => {
  const currentJobId = jobId.value
  const currentStatus = normalizedJobStatus.value
  tracePraat('page.before-unmount', {
    currentJobId,
    currentStatus,
  })
  stopPolling()
  if (currentJobId && isActiveJobStatus(currentStatus)) {
    tracePraat('page.before-unmount-cancel', {
      currentJobId,
      currentStatus,
    })
    cancelJob(currentJobId).catch(console.error)
  }
})

// // Cancel job on page unload
// if (typeof window !== 'undefined') {
//   window.addEventListener('beforeunload', () => {
//     if (jobId.value && (jobStatus.value === 'running' || jobStatus.value === 'queued')) {
//       navigator.sendBeacon(`/api/praat/jobs/${jobId.value}`, JSON.stringify({ _method: 'DELETE' }))
//     }
//   })
// }
</script>

<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.praat-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
  position: relative;
  @include flex-col;
  justify-content: center;
  align-items: center;
  // height: 88dvh;
}

/* Login Prompt */
.login-prompt {
  position: fixed;
  top: 2rem;
  right: 2rem;
  z-index: 200;
}

.login-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.2rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  background: rgba(var(--color-error-light-rgb), 0.15);
  color: var(--color-error);
  border: 1px solid rgba(var(--color-error-light-rgb), 0.3);
}

.login-button:hover {
  background: var(--color-error);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--color-error-light-rgb), 0.3);
}

.page-header {
  text-align: center;
  // margin-bottom: 1rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  margin-top: 1rem;
  background: linear-gradient(135deg, #007aff, #6e00ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-description {
  font-size: 1.1rem;
  margin:0;
  color: var(--color-text-secondary);
}
/* 当设备处于竖屏状态时 */
@media (orientation: portrait) {
  .page-description {
    display: none;
  }
}

/* Tab Navigation - Floating Left */
.tab-navigation {
  position: fixed;
  top: 140px;
  left: 2rem;
  z-index: 100;
}

.tab-container {
  @include flex-col;
  gap: 4px;
  padding: 4px;
  background: var(--glass-80);
  backdrop-filter: blur(60px) saturate(200%);
  -webkit-backdrop-filter: blur(60px) saturate(200%);
  border-radius: var(--radius-md);
  border: 1px solid var(--glass-40);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12),
              inset 0 1px 0 var(--glass-60);
}

.tab-btn {
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.01em;
  border-radius: var(--radius-sm2);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  min-width: 100px;
  text-align: center;
}

.tab-btn:hover:not(.active):not(:disabled) {
  background: rgba(0, 0, 0, 0.04);
  color: var(--text-primary);
  transform: translateX(2px);
}

.tab-btn.active {
  background: var(--bg-white);
  color: var(--color-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08),
              0 1px 2px rgba(0, 0, 0, 0.06);
  font-weight: 600;
}

.tab-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}


/* Tab Hidden (for v-show keep-alive) */
.tab-hidden {
  display: none !important;
}

/* Tab Fade Transition - No longer used with v-show */
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.tab-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.page-content {
  display: flex;
  justify-items: center;
  align-items: center;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 80dvh;
  border-radius: 25px;
  width: 90dvw;
}
@media (max-aspect-ratio: 1/1) {
  .page-content{
    max-height: 80dvh;
  }

}

.action-section {
  margin-bottom: 1.2rem;
}

.start-button {
  width: 100%;
  padding: 1rem 1.2rem;
  font-size: 1.1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, #007aff, #6e00ff);
  color: white;
  transition: all 0.3s ease;
}

.start-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(var(--color-primary-rgb), 0.3);
  background: linear-gradient(135deg, #0056b3, #4b00b3);
}

.start-button:disabled {
  @include disabled-state;
  filter: grayscale(0.8); /* 让颜色变灰，提示不可用 */
  box-shadow: none;
}

/* Job Status Inline (in Tab 2) */
.job-status-inline {
  margin-bottom: 1.2rem;
}

/* Settings Trigger */
.settings-trigger {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 1.2rem;
  flex-wrap: wrap;
}

.settings-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
}

.settings-icon {
  font-size: 1.2rem;
}

/* Mode Selector Inline */
.mode-selector-inline {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.mode-label {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
}

.mode-options {
  display: flex;
  gap: 0.5rem;
}

.mode-options .radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.6rem;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  position: relative;
}

.mode-options .radio-option input[type="radio"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.mode-options .radio-option.active {
  background: linear-gradient(135deg, #007aff, #6e00ff);
  color: white;
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
}

.mode-options .radio-option:not(.active):hover {
  background: var(--glass-60);
  transform: translateY(-1px);
}

/* Sidebar Overlay */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.settings-sidebar {
  position: fixed;
  /* 调整位置，让它悬浮起来更有“液态”感 */
  top: 15px;
  left: 15px;
  bottom: 15px;
  width: 380px;
  max-width: calc(100vw - 30px);

  /* 1. 圆角：苹果风格的核心，大圆角才会显得圆润 */
  border-radius: var(--radius-2xl);

  /* 2. 背景：降低透明度，让底色更透 */
  background: var(--glass-40);

  /* 3. 增强模糊：saturate 稍微拉高一点点，模拟折射 */
  backdrop-filter: blur(40px) saturate(200%);
  -webkit-backdrop-filter: blur(40px) saturate(200%);

  /* 4. 复合阴影：这是液态感的关键 */
  box-shadow:
      0 20px 50px rgba(0, 0, 0, 0.1),            /* 整体浮动感 */
      inset 0 0 0 1.5px var(--glass-50), /* 环绕的高光边框，模拟玻璃边缘折射 */
      inset 0 1px 1px var(--glass-80);   /* 顶部微弱亮边 */

  /* 取消原来的 border-right，改用阴影里的 inset 模拟更高级 */
  border: none;

  z-index: 1000;
  @include flex-col;
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
}

/* 彻底重构 Header */
.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 20px 16px 20px; /* 增加顶部间距 */

  /* 移除生硬的背景和边框 */
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border-bottom: none;

  /* 使用字体权重和字间距提升高级感 */
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
}

.sidebar-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

/* Sidebar Transition */
.sidebar-enter-active,
.sidebar-leave-active {
  transition: transform 0.3s ease;
}

.sidebar-enter-from {
  transform: translateX(-100%);
}

.sidebar-leave-to {
  transform: translateX(-100%);
}

/* Overlay Transition */
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.3s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

/* Audio Preview Floating Window */
.audio-preview-float {
  position: fixed;
  right: 2rem;
  width: 320px;
  max-width: calc(100vw - 4rem);
  background: var(--glass-80);
  backdrop-filter: blur(60px) saturate(200%);
  -webkit-backdrop-filter: blur(60px) saturate(200%);
  border-radius: var(--radius-xl);
  border: 1px solid var(--glass-40);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 var(--glass-60);
  z-index: 100;
  overflow: hidden;
  max-height: 90dvh;
}

/* Preview Fade Transition */
.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: all 0.3s ease;
}

.preview-fade-enter-from {
  opacity: 0;
  transform: translateX(20px) scale(0.95);
}

.preview-fade-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.95);
}

/* Mobile Responsive */
@media (max-aspect-ratio: 1/1) {
  .praat-page {
    padding: 0;
    height: 90dvh;
    margin: 0;
  }

  .page-title {
    font-size: 1.8rem;
    margin:0;
  }

  .tab-navigation {
    position: static;
    width: 100%;
  }

  .tab-container {
    flex-direction: row;
    width: auto;
  }

  .tab-btn {
    flex: 1;
    font-size: 13px;
    padding: 10px 4px;
    min-width: 60px;
  }

  .settings-sidebar {
    width: 95%;
    max-width: 100vw;
  }

  .audio-preview-float {
    position: fixed;
    bottom: auto;
    top: 8dvh;
    max-height: 90dvh;
    // overflow-y: auto;
    left: 0;
    right: 0;
    width: 100%;
    max-width: 100%;
    border-radius:  0 0 var(--radius-xl) var(--radius-xl);
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.15);
  }

  .preview-close-button {
    top: 1rem;
    right: 1rem;
  }
}

/* Analysis Status Card - Single Unified Card */
.analysis-status-card {
  width: 95%;
  max-width: 800px;
  margin: 1rem auto;
  padding: 1rem;
}


.loading-content {
  @include flex-col;
  align-items: center;
  text-align: center;
  padding: 2rem 0;
}

.error-content {
  @include flex-col;
  align-items: center;
  text-align: center;
  padding: 2rem 0;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--color-error-light);
  margin-bottom: 0.5rem;
}

.error-text {
  font-size: 1rem;
  color: var(--color-text-secondary);
}




.loading-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.loading-text {
  font-size: 1rem;
  color: var(--color-text-secondary);
  margin-bottom: 2rem;
}

.loading-progress {
  width: 100%;
  max-width: 400px;
  @include flex-col;
  gap: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: var(--radius-xs);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-cyan));
  border-radius: var(--radius-xs);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-primary);
  text-align: center;
}

/* No Results State */
.no-results-state {
  @include flex-col;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  margin: 2rem auto;
  max-width: 600px;
  text-align: center;
}

.no-results-icon {
  font-size: 4rem;
  margin-bottom: 1.2rem;
  opacity: 0.6;
}

.no-results-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.no-results-text {
  font-size: 1rem;
  color: var(--color-text-secondary);
}
</style>
