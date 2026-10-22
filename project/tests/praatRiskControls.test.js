import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

const praatViewPath = resolve(projectRoot, 'src/main/views/Praat.vue')
const audioInputPanelPath = resolve(projectRoot, 'src/main/components/praat/AudioInputPanel.vue')
const jobStatusPanelPath = resolve(projectRoot, 'src/main/components/praat/JobStatusPanel.vue')
const analysisResultsPanelPath = resolve(projectRoot, 'src/main/components/praat/AnalysisResultsPanel.vue')
const praatApiPath = resolve(projectRoot, 'src/api/main/tools/Praat.js')
const enLocalePath = resolve(projectRoot, 'src/i18n/locales/en/praat.json')
const zhCnLocalePath = resolve(projectRoot, 'src/i18n/locales/zh-CN/praat.json')
const zhHantLocalePath = resolve(projectRoot, 'src/i18n/locales/zh-Hant/praat.json')

function readSource(path) {
  return readFileSync(path, 'utf8')
}

describe('Praat front-end risk controls', () => {
  it('Praat view keeps the linear upload-create-poll flow and avoids upload session state machines', () => {
    const source = readSource(praatViewPath)

    expect(source).toContain('const uploadId = ref(null)')
    expect(source).toContain("const uploadResponse = await uploadAudio(audioFile.value)")
    expect(source).toContain('uploadId.value = uploadResponse.task_id')
    expect(source).toContain('const jobResponse = await createJob(uploadId.value, settings)')
    expect(source).toContain('await startPolling()')
    expect(source).not.toContain('const analysisRunId = ref(0)')
    expect(source).not.toContain('const uploadSession = ref(createEmptyUploadSession())')
    expect(source).not.toContain('const createJobWithCurrentUpload = async')
    expect(source).not.toContain('const invalidateAudioVersion = () => {')
    expect(source).not.toContain("jobStage.value = t('praat.main.status.reusingUpload')")
    expect(source).not.toContain(':context="resultContext"')
  })

  it('Praat keeps direct analysis for original uploads, and passive segment selection does not invalidate the chain', () => {
    const source = readSource(praatViewPath)

    expect(source).toMatch(/const originalSegment = \{/)
    expect(source).toMatch(/audioSegments\.value = \[originalSegment\]/)
    expect(source).toMatch(/selectedSegment\.value = originalSegment/)
    expect(source).toMatch(/const currentJobId = jobId\.value/)
    expect(source).toMatch(/\(\) => getJobStatus\(currentJobId\)/)
    expect(source).toMatch(/const results = await getJobResult\(currentJobId, 'full'\)/)
    expect(source).not.toContain('const selectionChanged = !isSameSegment(selectedSegment.value, segment)')
    expect(source).not.toContain('invalidateAudioVersion()')
  })

  it('Audio input emits structured file payloads and forwards clear-selection to the parent', () => {
    const source = readSource(audioInputPanelPath)

    expect(source).toContain("const emit = defineEmits(['file-selected', 'segments-ready', 'clear-selection'])")
    expect(source).toContain("emit('file-selected', {")
    expect(source).toContain("duration: duration")
    expect(source).toContain("origin: 'original'")
    expect(source).toContain("emit('clear-selection')")
  })

  it('Audio input keeps Praat available on native apps through platform file and recorder adapters', () => {
    const source = readSource(audioInputPanelPath)

    expect(source).toContain("import { getPlatformAudioRecorder, getPlatformFileService } from '@/platform/index.js'")
    expect(source).toMatch(/getPlatformFileService\(\)\.pickFilesOrOpenInput\(fileInput\.value,\s*\{\s*accept: 'audio\/\*'/)
    expect(source).toContain('const nativeAudioRecorder = getPlatformAudioRecorder()')
    expect(source).toContain('if (nativeAudioRecorder.canRecord()) {')
    expect(source).toContain('await nativeAudioRecorder.start()')
    expect(source).toContain('const nativeRecording = await nativeAudioRecorder.stop()')
    expect(source).toContain('mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })')
  })

  it('Audio input handles native picker and recorder failures with explicit user-facing states', () => {
    const source = readSource(audioInputPanelPath)
    const enSource = readSource(enLocalePath)
    const zhCnSource = readSource(zhCnLocalePath)
    const zhHantSource = readSource(zhHantLocalePath)

    expect(source).toContain('readData: false')
    expect(source).toContain('showPlatformAudioInputError(error)')
    expect(source).toContain("error?.code === 'NATIVE_MICROPHONE_PERMISSION_DENIED'")
    expect(source).toContain("error?.code === 'NATIVE_RECORDING_READ_FAILED'")
    expect(source).toContain("t('praat.audioInput.errors.fileSelectionFailed'")
    expect(source).toContain("t('praat.audioInput.errors.recordingReadFailed')")

    for (const localeSource of [enSource, zhCnSource, zhHantSource]) {
      expect(localeSource).toContain('"fileSelectionFailed"')
      expect(localeSource).toContain('"recordingReadFailed"')
    }
  })

  it('Job status panel treats processing as active and renders canceled state explicitly', () => {
    const source = readSource(jobStatusPanelPath)

    expect(source).toContain("status === 'queued' || status === 'processing'")
    expect(source).toContain("status === 'canceled'")
    expect(source).toContain("t('praat.jobStatus.canceled.title')")
  })

  it('Analysis results panel does not expose upload/session internals to users', () => {
    const source = readSource(analysisResultsPanelPath)

    expect(source).not.toContain('result-context')
    expect(source).not.toContain('context: {')
    expect(source).not.toContain("t('praat.results.context.jobLabel')")
  })

  it('Praat API suppresses raw background error toasts for job status, result, and cancel requests', () => {
    const source = readSource(praatApiPath)

    expect(source).toMatch(/api\(`\/api\/tools\/praat\/jobs\/progress\/\$\{jobId\}`,\s*\{\s*showError: false/)
    expect(source).toMatch(/api\(`\/api\/tools\/praat\/jobs\/progress\/\$\{jobId\}\/result\?view=\$\{view\}`,\s*\{\s*showError: false/)
    expect(source).toMatch(/api\(`\/api\/tools\/praat\/jobs\/progress\/\$\{jobId\}`,\s*\{\s*method: 'DELETE',\s*showError: false/)
  })

  it('Praat locales keep the analysis-in-progress and canceled copy', () => {
    const enSource = readSource(enLocalePath)
    const zhCnSource = readSource(zhCnLocalePath)
    const zhHantSource = readSource(zhHantLocalePath)

    for (const source of [enSource, zhCnSource, zhHantSource]) {
      expect(source).toContain('"analysisInProgress"')
      expect(source).toContain('"canceled"')
    }
  })
})
