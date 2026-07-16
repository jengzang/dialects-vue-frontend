const NATIVE_BUILD_TARGETS = new Set(['ios', 'android', 'native'])

export function resolveBuildTarget(mode = 'production', env = {}) {
  const explicitTarget = env.VITE_PLATFORM_TARGET || env.PLATFORM_TARGET || ''
  const normalizedTarget = String(explicitTarget || mode || 'web').toLowerCase()

  if (normalizedTarget === 'ios') {
    return {
      target: 'ios',
      family: 'native',
      isNative: true,
      isWeb: false,
    }
  }

  if (normalizedTarget === 'android') {
    return {
      target: 'android',
      family: 'native',
      isNative: true,
      isWeb: false,
    }
  }

  if (normalizedTarget === 'native') {
    return {
      target: 'native',
      family: 'native',
      isNative: true,
      isWeb: false,
    }
  }

  return {
    target: 'web',
    family: 'web',
    isNative: NATIVE_BUILD_TARGETS.has(normalizedTarget),
    isWeb: true,
  }
}
