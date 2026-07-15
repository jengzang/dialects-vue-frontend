const IOS_USER_AGENT_RE = /iPad|iPhone|iPod/i
const ANDROID_USER_AGENT_RE = /Android/i
const MOBILE_USER_AGENT_RE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i

function hasIosNativeBridge(globals) {
  return Boolean(globals?.webkit?.messageHandlers?.dialectsNative)
}

function hasAndroidNativeBridge(globals) {
  return Boolean(globals?.DialectsAndroidBridge)
}

function getCapacitorPlatform(globals) {
  const platform = globals?.Capacitor?.getPlatform?.()

  return typeof platform === 'string' ? platform : ''
}

export function detectRuntimePlatform(options = {}) {
  const globals = options.globals ?? (typeof window === 'undefined' ? {} : window)
  const userAgent = options.userAgent ?? globals?.navigator?.userAgent ?? ''
  const capacitorPlatform = getCapacitorPlatform(globals)

  if (hasIosNativeBridge(globals) || capacitorPlatform === 'ios') {
    return {
      family: 'ios',
      os: 'ios',
      container: 'native-webview',
    }
  }

  if (hasAndroidNativeBridge(globals) || capacitorPlatform === 'android') {
    return {
      family: 'android',
      os: 'android',
      container: 'native-webview',
    }
  }

  if (IOS_USER_AGENT_RE.test(userAgent)) {
    return {
      family: 'web',
      os: 'ios',
      container: 'browser',
    }
  }

  if (ANDROID_USER_AGENT_RE.test(userAgent)) {
    return {
      family: 'web',
      os: 'android',
      container: 'browser',
    }
  }

  return {
    family: 'web',
    os: MOBILE_USER_AGENT_RE.test(userAgent) ? 'mobile' : 'desktop',
    container: 'browser',
  }
}

export function getCurrentRuntimePlatform() {
  return detectRuntimePlatform()
}
