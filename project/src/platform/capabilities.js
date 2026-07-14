export function buildPlatformCapabilities(runtime) {
  const isWeb = runtime?.family === 'web'
  const isNativeWebView = runtime?.container === 'native-webview'

  return {
    runtime,
    canUseMapDraw: isWeb,
    storageDriver: 'web-storage',
    fileExportDriver: 'browser-download',
    fileImportDriver: 'browser-file-input',
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
