import { describe, expect, it } from 'vitest'

import {
  createPraatLocalEngine,
  createPraatRemoteEngine,
  resolvePraatAnalysisStrategy,
} from '../src/composables/core/usePraatAnalysis.js'

describe('Praat analysis facade', () => {
  it('keeps Web analysis on the remote backend engine', () => {
    expect(resolvePraatAnalysisStrategy('web', { localAvailable: true })).toEqual({
      target: 'web',
      engine: 'remote-api',
      fallbackEngine: null,
      fallbackReason: null,
    })
  })

  it.each(['ios', 'android'])('prefers local Python on %s when the native bridge is available', (target) => {
    expect(resolvePraatAnalysisStrategy(target, { localAvailable: true })).toEqual({
      target,
      engine: 'local-python',
      fallbackEngine: 'remote-api',
      fallbackReason: null,
    })
  })

  it.each(['ios', 'android'])('falls back to the remote API on %s while local Python is unavailable', (target) => {
    expect(resolvePraatAnalysisStrategy(target, { localAvailable: false })).toEqual({
      target,
      engine: 'remote-api',
      fallbackEngine: 'remote-api',
      fallbackReason: 'local-python-unavailable',
    })
  })

  it('wraps the existing Praat API as a remote engine without changing method names', () => {
    const api = {
      uploadAudio() {},
      createJob() {},
      getJobStatus() {},
      getJobResult() {},
      cancelJob() {},
    }

    expect(createPraatRemoteEngine(api)).toMatchObject({
      type: 'remote-api',
      uploadAudio: api.uploadAudio,
      createJob: api.createJob,
      getJobStatus: api.getJobStatus,
      getJobResult: api.getJobResult,
      cancelJob: api.cancelJob,
    })
  })

  it('wraps a native plugin bridge as a local Python engine', async () => {
    const bridge = {
      isAvailable: () => true,
      analyze: async () => ({ schema: 'praat-analysis' }),
    }
    const engine = createPraatLocalEngine(bridge)

    expect(engine.type).toBe('local-python')
    expect(engine.isAvailable()).toBe(true)
    await expect(engine.analyze({ filePath: 'sample.wav', settings: {} })).resolves.toEqual({
      schema: 'praat-analysis',
    })
  })
})
