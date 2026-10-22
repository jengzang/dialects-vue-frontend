import { hasNativeFileBridge, hasNativeFilePickerBridge } from './files.js'
import { resolvePlatformFeatureAvailability } from './featureMatrix.js'
import { getNativeStorageBridge, hasCapacitorPreferencesStorage } from './storage.js'

export function buildPlatformCapabilities(runtime) {
  const isNativeWebView = runtime?.container === 'native-webview'
  const hasNativeStorage = Boolean(getNativeStorageBridge('local')) || hasCapacitorPreferencesStorage()
  const hasNativeFiles = hasNativeFileBridge()
  const hasNativeFilePicker = hasNativeFilePickerBridge()

  return {
    runtime,
    canUseMapDraw: resolvePlatformFeatureAvailability('mapDraw', runtime).enabled,
    storageDriver: hasNativeStorage ? 'native-storage-bridge' : 'web-storage',
    fileExportDriver: hasNativeFiles ? 'native-file-bridge' : 'browser-download',
    fileImportDriver: hasNativeFilePicker ? 'native-file-bridge' : 'browser-file-input',
    fullscreenDriver: isNativeWebView ? 'css-fullscreen' : 'browser-fullscreen',
  }
}

export function getPlatformFeature(featureName, capabilities) {
  return resolvePlatformFeatureAvailability(featureName, capabilities?.runtime)
}

export function isFeatureEnabled(featureName, capabilities) {
  return getPlatformFeature(featureName, capabilities).enabled
}
