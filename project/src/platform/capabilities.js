import { hasNativeFileBridge, hasNativeFilePickerBridge } from './files.js'
import { getNativeStorageBridge } from './storage.js'

export function buildPlatformCapabilities(runtime) {
  const isWeb = runtime?.family === 'web'
  const isNativeWebView = runtime?.container === 'native-webview'
  const hasNativeStorage = Boolean(getNativeStorageBridge('local'))
  const hasNativeFiles = hasNativeFileBridge()
  const hasNativeFilePicker = hasNativeFilePickerBridge()

  return {
    runtime,
    canUseMapDraw: isWeb,
    storageDriver: hasNativeStorage ? 'native-storage-bridge' : 'web-storage',
    fileExportDriver: hasNativeFiles ? 'native-file-bridge' : 'browser-download',
    fileImportDriver: hasNativeFilePicker ? 'native-file-bridge' : 'browser-file-input',
    fullscreenDriver: isNativeWebView ? 'css-fullscreen' : 'browser-fullscreen',
  }
}

export function getPlatformFeature(featureName, capabilities) {
  if (featureName === 'mapDraw') {
    return capabilities?.canUseMapDraw
      ? { enabled: true, reason: null }
      : { enabled: false, reason: 'web-only' }
  }

  return { enabled: true, reason: null }
}

export function isFeatureEnabled(featureName, capabilities) {
  return getPlatformFeature(featureName, capabilities).enabled
}
