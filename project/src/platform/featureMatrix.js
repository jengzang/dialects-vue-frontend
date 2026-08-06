import { getCurrentRuntimePlatform } from './runtime.js'
import { PRAAT_PLATFORM_CAPABILITIES } from './praatCapabilities.js'

const PLATFORM_TARGET_KEYS = ['web', 'ios', 'android', 'native']
const PLATFORM_ACCEPTANCE_TARGET_KEYS = ['web', 'ios', 'android']

export const PLATFORM_FEATURE_MATRIX = {
  mapView: {
    category: 'map',
    targets: {
      web: true,
      ios: true,
      android: true,
      native: true,
    },
    routes: [
      '/menu/map/view',
      '/menu/map/divide',
      '/menu/map/custom',
    ],
  },
  mapDraw: {
    category: 'map',
    targets: {
      web: true,
      ios: true,
      android: true,
      native: true,
    },
    routes: ['/menu/map/draw'],
    tutorials: ['menu-map-draw'],
  },
  fileImport: {
    category: 'file',
    targets: {
      web: true,
      ios: true,
      android: true,
      native: true,
    },
    routes: [
      '/explore/tools/check',
      '/explore/tools/jyut2ipa',
      '/explore/tools/merge',
    ],
  },
  fileExport: {
    category: 'file',
    targets: {
      web: true,
      ios: true,
      android: true,
      native: true,
    },
  },
  audioRecord: {
    category: 'audio',
    targets: {
      web: true,
      ios: true,
      android: true,
      native: true,
    },
  },
  praatTools: {
    category: 'tool',
    targets: {
      web: true,
      ios: true,
      android: true,
      native: true,
    },
    capabilities: PRAAT_PLATFORM_CAPABILITIES,
    routes: ['/explore/tools/praat'],
    tutorials: [
      'explore-praat-upload',
      'explore-praat-results',
      'explore-praat-vowelspace',
      'explore-praat-pitchtone',
    ],
    acceptance: {
      web: [
        {
          id: 'praat.web.file-select',
          label: 'Select an audio file through the browser file input',
          driver: 'browser-file-input',
        },
        {
          id: 'praat.web.record',
          label: 'Record audio through MediaRecorder after browser microphone permission',
          driver: 'browser-media-recorder',
        },
        {
          id: 'praat.web.decode-segment',
          label: 'Decode audio and prepare original or split segments through Web Audio',
          driver: 'web-audio',
        },
        {
          id: 'praat.web.submit-analysis',
          label: 'Upload the selected audio and create a Praat analysis job',
          driver: 'praat-api',
        },
      ],
      ios: [
        {
          id: 'praat.ios.file-select',
          label: 'Select an audio file through Capacitor FilePicker',
          driver: 'capacitor-file-picker',
        },
        {
          id: 'praat.ios.record',
          label: 'Record and save audio through Capacitor AudioRecorder',
          driver: 'capacitor-audio-recorder',
        },
        {
          id: 'praat.ios.microphone-permission',
          label: 'Request microphone permission using the iOS Info.plist usage description',
          driver: 'ios-info-plist',
        },
        {
          id: 'praat.ios.decode-segment',
          label: 'Decode native audio and prepare original or split segments through Web Audio',
          driver: 'web-audio',
        },
        {
          id: 'praat.ios.submit-analysis',
          label: 'Run WAV Praat analysis locally through the bundled Python Parselmouth engine',
          driver: 'python-parselmouth',
        },
        {
          id: 'praat.ios.local-python-analysis',
          label: 'Keep result JSON and run metadata while treating input audio as temporary',
          driver: 'python-parselmouth',
        },
      ],
      android: [
        {
          id: 'praat.android.file-select',
          label: 'Select an audio file through Capacitor FilePicker',
          driver: 'capacitor-file-picker',
        },
        {
          id: 'praat.android.record',
          label: 'Record and save audio through Capacitor AudioRecorder',
          driver: 'capacitor-audio-recorder',
        },
        {
          id: 'praat.android.microphone-permission',
          label: 'Request microphone permission using Android RECORD_AUDIO',
          driver: 'android-manifest',
        },
        {
          id: 'praat.android.decode-segment',
          label: 'Decode native audio and prepare original or split segments through Web Audio',
          driver: 'web-audio',
        },
        {
          id: 'praat.android.submit-analysis',
          label: 'Run WAV Praat analysis locally through the bundled Python Parselmouth engine',
          driver: 'python-parselmouth',
        },
        {
          id: 'praat.android.local-python-analysis',
          label: 'Keep result JSON and run metadata while treating input audio as temporary',
          driver: 'python-parselmouth',
        },
      ],
    },
  },
  externalOpen: {
    category: 'navigation',
    targets: {
      web: true,
      ios: true,
      android: true,
      native: true,
    },
  },
  seoOnly: {
    category: 'build',
    targets: {
      web: true,
      ios: false,
      android: false,
      native: false,
    },
    disabledReason: 'web-only',
  },
}

export function getPlatformAcceptanceChecklist(target, matrix = PLATFORM_FEATURE_MATRIX) {
  const checklist = []

  for (const [featureName, featureConfig] of Object.entries(matrix)) {
    for (const item of featureConfig.acceptance?.[target] || []) {
      checklist.push({
        feature: featureName,
        target,
        ...item,
      })
    }
  }

  return checklist
}

export function resolvePlatformFeatureAvailability(featureName, runtime) {
  const featureConfig = PLATFORM_FEATURE_MATRIX[featureName]

  if (!featureConfig) {
    return { enabled: true, reason: null }
  }

  const family = runtime?.family || 'web'
  const targetEnabled = featureConfig.targets?.[family]

  if (targetEnabled === false) {
    return {
      enabled: false,
      reason: featureConfig.disabledReason || 'platform-disabled',
    }
  }

  return { enabled: true, reason: null }
}

export function getNativeDistPruneManifest() {
  const paths = []
  const globPatterns = []

  for (const featureConfig of Object.values(PLATFORM_FEATURE_MATRIX)) {
    const pruneConfig = featureConfig.nativeDistPrune

    if (!pruneConfig) continue

    paths.push(...(pruneConfig.paths || []))
    globPatterns.push(...(pruneConfig.globPatterns || []))
  }

  return {
    paths,
    globPatterns,
  }
}

function collectDuplicateAssignments(matrix, key, normalizeValue = (value) => value) {
  const ownerByValue = new Map()
  const duplicates = []

  for (const [featureName, featureConfig] of Object.entries(matrix)) {
    const values = featureConfig[key] || []

    for (const rawValue of values) {
      const value = normalizeValue(rawValue)
      const existingOwner = ownerByValue.get(value)

      if (existingOwner) {
        duplicates.push({
          value,
          features: [existingOwner, featureName],
        })
      } else {
        ownerByValue.set(value, featureName)
      }
    }
  }

  return duplicates
}

export function getPlatformFeatureMatrixDiagnostics(matrix = PLATFORM_FEATURE_MATRIX) {
  const missingTargets = []
  const invalidTargets = []
  const prunePathOwnerByValue = new Map()
  const pruneGlobOwnerByValue = new Map()
  const duplicateNativeDistPrunePaths = []
  const duplicateNativeDistPruneGlobPatterns = []

  for (const [featureName, featureConfig] of Object.entries(matrix)) {
    if (!featureConfig.targets) {
      missingTargets.push(featureName)
      continue
    }

    for (const targetKey of Object.keys(featureConfig.targets)) {
      if (!PLATFORM_TARGET_KEYS.includes(targetKey)) {
        invalidTargets.push({ feature: featureName, target: targetKey })
      }
    }

    for (const path of featureConfig.nativeDistPrune?.paths || []) {
      const existingOwner = prunePathOwnerByValue.get(path)

      if (existingOwner) {
        duplicateNativeDistPrunePaths.push({
          value: path,
          features: [existingOwner, featureName],
        })
      } else {
        prunePathOwnerByValue.set(path, featureName)
      }
    }

    for (const pattern of featureConfig.nativeDistPrune?.globPatterns || []) {
      const existingOwner = pruneGlobOwnerByValue.get(pattern)

      if (existingOwner) {
        duplicateNativeDistPruneGlobPatterns.push({
          value: pattern,
          features: [existingOwner, featureName],
        })
      } else {
        pruneGlobOwnerByValue.set(pattern, featureName)
      }
    }
  }

  return {
    missingTargets,
    invalidTargets,
    duplicateRoutes: collectDuplicateAssignments(matrix, 'routes'),
    duplicateTutorials: collectDuplicateAssignments(matrix, 'tutorials'),
    duplicateNativeDistPrunePaths,
    duplicateNativeDistPruneGlobPatterns,
  }
}

export function getPlatformAcceptanceDiagnostics(matrix = PLATFORM_FEATURE_MATRIX) {
  const ownerById = new Map()
  const duplicateIds = []
  const invalidTargets = []
  const missingFields = []

  for (const [featureName, featureConfig] of Object.entries(matrix)) {
    for (const [target, items] of Object.entries(featureConfig.acceptance || {})) {
      if (!PLATFORM_ACCEPTANCE_TARGET_KEYS.includes(target)) {
        invalidTargets.push({ feature: featureName, target })
      }

      if (!Array.isArray(items)) {
        missingFields.push({ feature: featureName, target, field: 'items' })
        continue
      }

      for (const item of items) {
        if (!item?.id) {
          missingFields.push({ feature: featureName, target, field: 'id' })
        }
        if (!item?.label) {
          missingFields.push({ feature: featureName, target, field: 'label' })
        }
        if (!item?.driver) {
          missingFields.push({ feature: featureName, target, field: 'driver' })
        }

        if (!item?.id) continue

        const existingOwner = ownerById.get(item.id)
        if (existingOwner) {
          duplicateIds.push({
            value: item.id,
            features: [existingOwner, featureName],
          })
        } else {
          ownerById.set(item.id, featureName)
        }
      }
    }
  }

  return {
    duplicateIds,
    invalidTargets,
    missingFields,
  }
}

export function isPlatformRouteEnabled(routePath, runtime) {
  const resolvedRuntime = runtime || getCurrentRuntimePlatform()

  for (const [featureName, featureConfig] of Object.entries(PLATFORM_FEATURE_MATRIX)) {
    if (!featureConfig.routes?.includes(routePath)) continue

    return resolvePlatformFeatureAvailability(featureName, resolvedRuntime).enabled
  }

  return true
}

export function isPlatformTutorialEnabled(tutorialKey, runtime) {
  const resolvedRuntime = runtime || getCurrentRuntimePlatform()

  for (const [featureName, featureConfig] of Object.entries(PLATFORM_FEATURE_MATRIX)) {
    if (!featureConfig.tutorials?.includes(tutorialKey)) continue

    return resolvePlatformFeatureAvailability(featureName, resolvedRuntime).enabled
  }

  return true
}
