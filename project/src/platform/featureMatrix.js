import { getCurrentRuntimePlatform } from './runtime.js'

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
    routes: ['/explore/tools/praat'],
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
