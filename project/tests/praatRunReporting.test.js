import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMock = vi.fn()

vi.mock('../src/api/auth/httpClient.js', () => ({
  api: apiMock,
}))

const { praat } = await import('../src/api/main/tools/Praat.js')
const {
  PRAAT_LOCAL_TEMPORARY_AUDIO_POLICY,
  createPraatLocalBridge,
  hasPraatLocalBridge,
} = await import('../src/platform/praatLocal.js')

beforeEach(() => {
  apiMock.mockClear()
})

describe('Praat local run reporting', () => {
  it('posts local Praat run records to the backend leaderboard reporting endpoint', async () => {
    apiMock.mockResolvedValueOnce({ accepted: true })
    const payload = {
      client_run_id: 'run-1',
      platform: 'ios',
      engine: 'python-parselmouth',
      modules: ['basic', 'pitch'],
      status: 'completed',
      elapsed_ms: 1200,
    }

    await praat().reportLocalPraatRun(payload)

    expect(apiMock).toHaveBeenLastCalledWith('/api/tools/praat/local-runs', {
      method: 'POST',
      body: payload,
    })
  })

  it('exposes the local temporary audio retention policy to native plugins', () => {
    expect(PRAAT_LOCAL_TEMPORARY_AUDIO_POLICY).toEqual({
      originalInput: 'delete-after-analysis',
      normalizedAudio: 'delete-after-analysis',
      resultJson: 'retain',
      runMetadata: 'retain',
    })
  })

  it('treats the local Praat bridge as unavailable when the plugin is missing', () => {
    expect(hasPraatLocalBridge({
      globals: {
        Capacitor: {
          isNativePlatform: () => true,
          isPluginAvailable: () => false,
        },
      },
    })).toBe(false)
  })

  it('calls the native Praat plugin with file paths, settings, run id, and temporary audio policy', async () => {
    const runAnalysis = vi.fn().mockResolvedValue({ schema: 'praat-analysis' })
    const bridge = createPraatLocalBridge({
      globals: {
        Capacitor: {
          isNativePlatform: () => true,
          isPluginAvailable: (name) => name === 'PraatLocal',
        },
      },
      plugin: { runAnalysis },
    })

    await expect(bridge.analyze({
      filePath: '/tmp/input.wav',
      settings: { mode: 'single', modules: ['basic'] },
      clientRunId: 'run-2',
    })).resolves.toEqual({ schema: 'praat-analysis' })

    expect(runAnalysis).toHaveBeenLastCalledWith({
      filePath: '/tmp/input.wav',
      settings: { mode: 'single', modules: ['basic'] },
      clientRunId: 'run-2',
      temporaryAudioPolicy: PRAAT_LOCAL_TEMPORARY_AUDIO_POLICY,
    })
  })
})
