export {
  detectRuntimePlatform,
  getCurrentRuntimePlatform,
} from './runtime.js'
export {
  buildPlatformCapabilities,
  getPlatformFeature,
  isFeatureEnabled,
} from './capabilities.js'
export {
  getNativeDistPruneManifest,
  getPlatformAcceptanceChecklist,
  getPlatformAcceptanceDiagnostics,
  getPlatformFeatureMatrixDiagnostics,
  isPlatformRouteEnabled,
  isPlatformTutorialEnabled,
  PLATFORM_FEATURE_MATRIX,
  resolvePlatformFeatureAvailability,
} from './featureMatrix.js'
export { getPlatformStorage } from './storage.js'
export {
  getPlatformFileService,
  hasNativeFileBridge,
  hasNativeFilePickerBridge,
} from './files.js'
export {
  getPlatformAudioRecorder,
  hasNativeAudioRecorder,
} from './audioRecorder.js'
export {
  getPlatformFullscreenController,
  PLATFORM_FULLSCREEN_CLASS,
} from './fullscreen.js'
export {
  initializePlatformServices,
  resetPlatformServicesForTests,
} from './bootstrap.js'

import { buildPlatformCapabilities, isFeatureEnabled } from './capabilities.js'
import { getCurrentRuntimePlatform } from './runtime.js'

export function getCurrentPlatformCapabilities() {
  return buildPlatformCapabilities(getCurrentRuntimePlatform())
}

export function isPlatformFeatureEnabled(featureName) {
  return isFeatureEnabled(featureName, getCurrentPlatformCapabilities())
}
