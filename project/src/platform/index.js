export {
  detectRuntimePlatform,
  getCurrentRuntimePlatform,
} from './runtime.js'
export {
  buildPlatformCapabilities,
  getPlatformFeature,
  isFeatureEnabled,
} from './capabilities.js'
export { getPlatformStorage } from './storage.js'

import { buildPlatformCapabilities, isFeatureEnabled } from './capabilities.js'
import { getCurrentRuntimePlatform } from './runtime.js'

export function getCurrentPlatformCapabilities() {
  return buildPlatformCapabilities(getCurrentRuntimePlatform())
}

export function isPlatformFeatureEnabled(featureName) {
  return isFeatureEnabled(featureName, getCurrentPlatformCapabilities())
}
