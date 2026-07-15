import { describe, expect, it } from 'vitest'

import {
  buildPlatformCapabilities,
  detectRuntimePlatform,
  getPlatformFileService,
  getPlatformFullscreenController,
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

  it('uses an injected native storage bridge when it is available', () => {
    const calls = []
    const storage = getPlatformStorage('local', {
      globals: {
        DialectsNativeStorage: {
          getItem(key) {
            calls.push(['get', key])
            return key === 'native-key' ? 'native-value' : null
          },
          setItem(key, value) {
            calls.push(['set', key, value])
          },
          removeItem(key) {
            calls.push(['remove', key])
          },
        },
      },
    })

    expect(storage.getItem('native-key')).toBe('native-value')
    storage.setItem('native-key', 'next-value')
    storage.removeItem('native-key')
    expect(calls).toEqual([
      ['get', 'native-key'],
      ['set', 'native-key', 'next-value'],
      ['remove', 'native-key'],
    ])
  })

  it('exports files through a native save bridge before falling back to browser downloads', async () => {
    const calls = []
    const fileService = getPlatformFileService({
      globals: {
        DialectsNativeBridge: {
          saveFile(payload) {
            calls.push(payload)
            return true
          },
        },
      },
    })

    await fileService.saveBlob(new Blob(['hello'], { type: 'text/plain' }), 'hello.txt')

    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({
      type: 'saveFile',
      fileName: 'hello.txt',
      mimeType: 'text/plain',
      base64: 'aGVsbG8=',
    })
  })

  it('advertises native file export only when a save bridge is present', () => {
    expect(buildPlatformCapabilities({
      family: 'ios',
      os: 'ios',
      container: 'native-webview',
    })).toMatchObject({
      fileExportDriver: 'browser-download',
    })

    window.DialectsNativeBridge = {
      saveFile() {},
    }

    expect(buildPlatformCapabilities({
      family: 'ios',
      os: 'ios',
      container: 'native-webview',
    })).toMatchObject({
      fileExportDriver: 'native-file-bridge',
    })

    delete window.DialectsNativeBridge
  })

  it('uses CSS fullscreen state in native webviews and browser fullscreen on web', async () => {
    const nativeElement = document.createElement('div')
    const nativeController = getPlatformFullscreenController({
      globals: { webkit: { messageHandlers: { dialectsNative: {} } } },
    })

    await nativeController.enter(nativeElement)
    expect(nativeElement.classList.contains('is-platform-fullscreen')).toBe(true)
    expect(nativeController.isFullscreen(nativeElement)).toBe(true)
    await nativeController.exit(nativeElement)
    expect(nativeElement.classList.contains('is-platform-fullscreen')).toBe(false)

    const webCalls = []
    const webElement = {
      requestFullscreen() {
        webCalls.push('request')
      },
    }
    const webController = getPlatformFullscreenController({ globals: {} })
    await webController.enter(webElement)
    expect(webCalls).toEqual(['request'])
  })
})
