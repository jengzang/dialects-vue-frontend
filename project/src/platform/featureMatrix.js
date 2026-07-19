import { getCurrentRuntimePlatform } from './runtime.js'

const PLATFORM_TARGET_KEYS = ['web', 'ios', 'android', 'native']

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
      ios: false,
      android: false,
      native: false,
    },
    disabledReason: 'web-only',
    routes: ['/menu/map/draw'],
    tutorials: ['menu-map-draw'],
    nativeDistPrune: {
      paths: [
        'data/国界面.kmz',
      ],
      globPatterns: [
        '^assets/voronoiClip\\.worker-[\\w-]+\\.js$',
      ],
    },
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
    routes: ['/explore/tools/praat'],
    tutorials: [
      'explore-praat-upload',
      'explore-praat-results',
      'explore-praat-vowelspace',
      'explore-praat-pitchtone',
    ],
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
