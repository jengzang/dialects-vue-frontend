export const PRAAT_LOCAL_TEMPORARY_AUDIO_POLICY = {
  originalInput: 'delete-after-analysis',
  normalizedAudio: 'delete-after-analysis',
  resultJson: 'retain',
  runMetadata: 'retain',
}

function getGlobals(options = {}) {
  return options.globals ?? (typeof window === 'undefined' ? {} : window)
}

function isNativeCapacitorApp(globals) {
  if (typeof globals?.Capacitor?.isNativePlatform === 'function') {
    return globals.Capacitor.isNativePlatform()
  }

  const platform = globals?.Capacitor?.getPlatform?.()
  return platform === 'ios' || platform === 'android'
}

function isCapacitorPluginAvailable(globals, pluginName) {
  return Boolean(globals?.Capacitor?.isPluginAvailable?.(pluginName))
}

function getPraatLocalPlugin(options = {}) {
  const globals = getGlobals(options)

  return options.plugin
    ?? globals?.Capacitor?.Plugins?.PraatLocal
    ?? globals?.Capacitor?.Plugins?.PraatLocalPlugin
    ?? globals?.PraatLocal
    ?? null
}

export function hasPraatLocalBridge(options = {}) {
  const globals = getGlobals(options)

  return Boolean(
    isNativeCapacitorApp(globals) &&
    isCapacitorPluginAvailable(globals, 'PraatLocal') &&
    getPraatLocalPlugin(options)?.runAnalysis
  )
}

export function createPraatLocalBridge(options = {}) {
  const plugin = getPraatLocalPlugin(options)

  return {
    isAvailable() {
      return hasPraatLocalBridge({
        ...options,
        plugin,
      })
    },
    analyze({ filePath, settings, clientRunId }) {
      if (!this.isAvailable()) {
        throw new Error('Local Praat Python bridge is unavailable')
      }

      return plugin.runAnalysis({
        filePath,
        settings,
        clientRunId,
        temporaryAudioPolicy: PRAAT_LOCAL_TEMPORARY_AUDIO_POLICY,
      })
    },
  }
}
