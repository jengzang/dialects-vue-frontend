import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter } from 'vue-router'
import Praat from '../src/main/views/explore/Praat.vue'

const api = vi.hoisted(() => ({
  uploadAudio: vi.fn(), createJob: vi.fn(), getJobStatus: vi.fn(),
  getJobResult: vi.fn(), cancelJob: vi.fn(),
}))

vi.mock('../src/api', () => ({ usePraatApi: () => api }))
vi.mock('../src/main/store/store.js', () => ({ userStore: { isAuthenticated: true, role: 'user' } }))
vi.mock('../src/composables/router/useAuthGuard.js', () => ({ useAuthGuard: () => ({ requireAuth: async () => true }) }))
vi.mock('../src/utils/ui/message.js', () => ({ showError: vi.fn(), showWarning: vi.fn() }))
vi.mock('../src/main/components/praat/AudioInputPanel.vue', () => ({
  default: {
    emits: ['file-selected', 'segments-ready', 'clear-selection'],
    setup(_props, { emit }) {
      return () => h('div', [
        h('input', { 'data-audio-draft': '' }),
        h('button', {
          'data-select-audio': '',
          onClick: () => {
            const file = new File(['audio'], '錄音.wav', { type: 'audio/wav' })
            emit('file-selected', { file, blob: file, duration: 1, origin: 'original' })
          },
        }, '選擇音頻'),
      ])
    },
  },
}))
vi.mock('../src/main/components/praat/AudioPreviewPanel.vue', () => ({ default: { template: '<div data-audio-preview />' } }))
vi.mock('../src/main/components/praat/SettingsPanel.vue', () => ({ default: { template: '<div data-settings />' } }))
vi.mock('../src/main/components/praat/JobStatusPanel.vue', () => ({ default: { template: '<div data-job-status />' } }))
vi.mock('../src/main/components/praat/AnalysisResultsPanel.vue', () => ({ default: { template: '<div data-analysis-results />' } }))
vi.mock('../src/main/components/praat/VowelSpacePanel.vue', () => ({ default: { template: '<div data-vowel-panel />' } }))
vi.mock('../src/main/components/praat/PitchTonePanel.vue', () => ({ default: { template: '<div data-pitch-panel />' } }))

let app
let host
const settle = async () => { await Promise.resolve(); await nextTick(); await nextTick() }
const tabs = () => [...host.querySelectorAll('.tabs-wrapper .tabs .tab')]

async function mountPraat() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }],
  })
  await router.push('/explore/tools/praat?keep=yes')
  app = createApp(Praat)
  app.use(router)
  app.use(createI18n({ legacy: false, locale: 'zh-Hant', missingWarn: false, fallbackWarn: false, messages: {} }))
  host = document.createElement('div')
  document.body.append(host)
  app.mount(host)
  await settle()
  return router
}

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  api.uploadAudio.mockResolvedValue({ task_id: 'upload-1' })
  api.createJob.mockResolvedValue({ job_id: 'job-1' })
  api.getJobStatus.mockResolvedValue({ status: 'completed', progress: 100, stage: '', error: null })
  api.cancelJob.mockResolvedValue({})
})

afterEach(() => { app?.unmount(); host?.remove(); localStorage.clear(); vi.restoreAllMocks() })

describe('Praat shared adaptive tabs', () => {
  it('uses the common adaptive navigation with initially unavailable result views', async () => {
    const router = await mountPraat()
    expect(host.querySelector('.tabs-wrapper--adaptive')).not.toBeNull()
    expect(tabs()).toHaveLength(4)
    expect(tabs().map(tab => tab.disabled)).toEqual([false, true, true, true])
    tabs()[1].click()
    await settle()
    expect(router.currentRoute.value.fullPath).toBe('/explore/tools/praat?keep=yes')
    expect(api.uploadAudio).not.toHaveBeenCalled()
  })

  it.each([
    { name: 'formants and pitch', timeseries: { formants: { f1: [500], f2: [1500] }, pitch_hz: [180] }, disabled: [false, false, false, false] },
    { name: 'pitch only', timeseries: { pitch_hz: [180] }, disabled: [false, false, true, false] },
    { name: 'formants only', timeseries: { formants: { f1: [500], f2: [1500] } }, disabled: [false, false, false, true] },
  ])('keeps data-dependent availability for $name after analysis', async ({ timeseries, disabled }) => {
    api.getJobResult.mockResolvedValue({ timeseries })
    const router = await mountPraat()
    host.querySelector('[data-select-audio]').click()
    await vi.waitFor(() => expect(router.currentRoute.value.query.tab).toBe('upload'))
    host.querySelector('.start-button').click()
    await vi.waitFor(() => expect(router.currentRoute.value.query.tab).toBe('results'))
    expect(tabs()[1].disabled).toBe(false)
    await vi.waitFor(() => expect(api.getJobResult).toHaveBeenCalledWith('job-1', 'full'), { timeout: 2500 })
    await settle()
    expect(tabs().map(tab => tab.disabled)).toEqual(disabled)
    expect(router.currentRoute.value.query.keep).toBe('yes')
  })

  it('preserves panel instances, input state, push history and preview restoration', async () => {
    api.getJobResult.mockResolvedValue({ timeseries: { formants: { f1: [500], f2: [1500] }, pitch_hz: [180] } })
    const router = await mountPraat()
    const input = host.querySelector('[data-audio-draft]')
    const vowelPanel = host.querySelector('[data-vowel-panel]')
    input.value = '保留 🎙️'
    host.querySelector('[data-select-audio]').click()
    await vi.waitFor(() => expect(router.currentRoute.value.query.tab).toBe('upload'))
    await vi.waitFor(() => expect(host.querySelector('.audio-preview-float')).not.toBeNull())
    host.querySelector('.audio-preview-float .close-btn').click()
    await settle()
    host.querySelector('.start-button').click()
    await vi.waitFor(() => expect(api.getJobResult).toHaveBeenCalled(), { timeout: 2500 })
    await settle()
    tabs()[2].click()
    await vi.waitFor(() => expect(router.currentRoute.value.query.tab).toBe('vowelspace'))
    expect(host.querySelector('[data-vowel-panel]')).toBe(vowelPanel)
    expect(vowelPanel.parentElement.style.display).not.toBe('none')
    tabs()[3].click()
    await vi.waitFor(() => expect(router.currentRoute.value.query.tab).toBe('pitchtone'))
    router.back()
    await vi.waitFor(() => expect(router.currentRoute.value.query.tab).toBe('vowelspace'))
    expect(tabs()[2].getAttribute('aria-selected')).toBe('true')
    tabs()[0].click()
    await vi.waitFor(() => expect(router.currentRoute.value.query.tab).toBe('upload'))
    await vi.waitFor(() => expect(host.querySelector('.audio-preview-float')).not.toBeNull())
    expect(host.querySelector('[data-audio-draft]')).toBe(input)
    expect(input.value).toBe('保留 🎙️')
    expect(api.uploadAudio).toHaveBeenCalledTimes(1)
    expect(api.createJob).toHaveBeenCalledExactlyOnceWith('upload-1', expect.any(Object))
  })
})
