import { Preferences as CapacitorPreferences } from '@capacitor/preferences'

import { detectRuntimePlatform } from './runtime.js'
import { registerCapacitorPreferencesStorage, resetCapacitorPreferencesStorageForTests } from './storage.js'

function getGlobals(options = {}) {
  return options.globals ?? (typeof window === 'undefined' ? {} : window)
}

function isCapacitorPluginAvailable(globals, pluginName) {
  return Boolean(globals?.Capacitor?.isPluginAvailable?.(pluginName))
}

export async function initializePlatformServices(options = {}) {
  const globals = getGlobals(options)
  const runtime = options.runtime ?? detectRuntimePlatform({ globals })
  const preferences = options.preferences ?? CapacitorPreferences

  if (runtime?.container === 'native-webview' && isCapacitorPluginAvailable(globals, 'Preferences')) {
    await registerCapacitorPreferencesStorage(preferences)
  }
}

export function resetPlatformServicesForTests() {
  resetCapacitorPreferencesStorageForTests()
}
