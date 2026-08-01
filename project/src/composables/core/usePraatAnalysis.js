import { getCurrentRuntimePlatform } from '@/platform/index.js'
import { createPraatLocalBridge } from '@/platform/praatLocal.js'

function normalizePraatTarget(target) {
  return target === 'ios' || target === 'android' ? target : 'web'
}

export function resolvePraatAnalysisStrategy(target = 'web', options = {}) {
  const normalizedTarget = normalizePraatTarget(target)

  if (normalizedTarget === 'web') {
    return {
      target: 'web',
      engine: 'remote-api',
      fallbackEngine: null,
      fallbackReason: null,
    }
  }

  if (options.localAvailable) {
    return {
      target: normalizedTarget,
      engine: 'local-python',
      fallbackEngine: 'remote-api',
      fallbackReason: null,
    }
  }

  return {
    target: normalizedTarget,
    engine: 'remote-api',
    fallbackEngine: 'remote-api',
    fallbackReason: 'local-python-unavailable',
  }
}

export function createPraatRemoteEngine(api) {
  return {
    type: 'remote-api',
    uploadAudio: api.uploadAudio,
    createJob: api.createJob,
    getJobStatus: api.getJobStatus,
    getJobResult: api.getJobResult,
    cancelJob: api.cancelJob,
  }
}

export function createPraatLocalEngine(bridge = null) {
  return {
    type: 'local-python',
    isAvailable() {
      return Boolean(bridge?.isAvailable?.())
    },
    analyze(payload) {
      if (!bridge?.analyze) {
        throw new Error('Local Praat Python bridge is unavailable')
      }

      return bridge.analyze(payload)
    },
  }
}

export function usePraatAnalysis({ api, localBridge = createPraatLocalBridge(), runtime = getCurrentRuntimePlatform() } = {}) {
  const remoteEngine = createPraatRemoteEngine(api)
  const localEngine = createPraatLocalEngine(localBridge)
  const strategy = resolvePraatAnalysisStrategy(runtime.family, {
    localAvailable: localEngine.isAvailable(),
  })

  return {
    strategy,
    remoteEngine,
    localEngine,
    activeEngine: strategy.engine === 'local-python' ? localEngine : remoteEngine,
  }
}
