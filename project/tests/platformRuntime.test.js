import { describe, expect, it } from 'vitest'

import {
  buildPlatformCapabilities,
  detectRuntimePlatform,
  getPlatformStorage,
  getPlatformFeature,
  isFeatureEnabled,
} from '../src/platform/index.js'

describe('platform runtime detection and capabilities', () => {
  it('detects a web runtime by default', () => {
    const runtime = detectRuntimePlatform({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15',
      globals: {},
    })

    expect(runtime).toEqual({
      family: 'web',
      os: 'desktop',
      container: 'browser',
    })
  })

  it('detects native iOS and Android webview bridges before user-agent fallbacks', () => {
    expect(detectRuntimePlatform({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
      globals: { webkit: { messageHandlers: { dialectsNative: {} } } },
    })).toMatchObject({
      family: 'ios',
      os: 'ios',
      container: 'native-webview',
    })

    expect(detectRuntimePlatform({
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36',
      globals: { DialectsAndroidBridge: {} },
    })).toMatchObject({
      family: 'android',
      os: 'android',
      container: 'native-webview',
    })
  })

  it('maps runtime capabilities to behavior-level decisions', () => {
    const webCapabilities = buildPlatformCapabilities({
      family: 'web',
      os: 'desktop',
      container: 'browser',
    })
    const iosCapabilities = buildPlatformCapabilities({
      family: 'ios',
      os: 'ios',
      container: 'native-webview',
    })

    expect(webCapabilities).toMatchObject({
      canUseMapDraw: true,
      storageDriver: 'web-storage',
      fileExportDriver: 'browser-download',
      fileImportDriver: 'browser-file-input',
      fullscreenDriver: 'browser-fullscreen',
    })
    expect(iosCapabilities).toMatchObject({
      canUseMapDraw: false,
      storageDriver: 'web-storage',
      fileExportDriver: 'browser-download',
      fileImportDriver: 'browser-file-input',
      fullscreenDriver: 'css-fullscreen',
    })
  })

  it('resolves feature gates from platform capabilities', () => {
    const webCapabilities = buildPlatformCapabilities({
      family: 'web',
      os: 'desktop',
      container: 'browser',
    })
    const androidCapabilities = buildPlatformCapabilities({
      family: 'android',
      os: 'android',
      container: 'native-webview',
    })

    expect(isFeatureEnabled('mapDraw', webCapabilities)).toBe(true)
    expect(isFeatureEnabled('mapDraw', androidCapabilities)).toBe(false)
    expect(getPlatformFeature('mapDraw', androidCapabilities)).toEqual({
      enabled: false,
      reason: 'web-only',
    })
  })

  it('exposes web-compatible storage through the platform adapter', () => {
    window.localStorage.setItem('platform-local-test', 'ok')
    window.sessionStorage.setItem('platform-session-test', 'ok')

    expect(getPlatformStorage('local').getItem('platform-local-test')).toBe('ok')
    expect(getPlatformStorage('session').getItem('platform-session-test')).toBe('ok')
  })
})
