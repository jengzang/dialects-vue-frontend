import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { redirectUnsupportedMapDraw } from '../src/main/router/menuRoutes.js'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

describe('platform integration seams', () => {
  let originalWebkit
  let originalAndroidBridge

  beforeEach(() => {
    originalWebkit = window.webkit
    originalAndroidBridge = window.DialectsAndroidBridge
  })

  afterEach(() => {
    if (originalWebkit === undefined) {
      delete window.webkit
    } else {
      window.webkit = originalWebkit
    }

    if (originalAndroidBridge === undefined) {
      delete window.DialectsAndroidBridge
    } else {
      window.DialectsAndroidBridge = originalAndroidBridge
    }
  })

  it('keeps map drawing behind the shared platform feature gate', () => {
    const mapPageSource = readSource('src/main/views/menu/MapPage.vue')
    const menuBarSource = readSource('src/main/config/BarAndTabs/MenuBarConfig.js')
    const menuRoutesSource = readSource('src/main/router/menuRoutes.js')
    const homePageSource = readSource('src/main/views/HomePage.vue')
    const tutorialManifestSource = readSource('src/main/components/tutorial/tutorialManifest.js')

    expect(mapPageSource).toContain("import { isPlatformFeatureEnabled } from '@/platform/index.js'")
    expect(mapPageSource).toContain("isPlatformFeatureEnabled('mapDraw')")
    expect(mapPageSource).toContain("v-if=\"canUseMapDraw\"")
    expect(menuBarSource).toContain("import { isPlatformFeatureEnabled } from '@/platform/index.js'")
    expect(menuBarSource).toContain("filterPlatformChildPaths")
    expect(menuBarSource).toContain("isPlatformFeatureEnabled('mapDraw')")
    expect(menuRoutesSource).toContain("import { isPlatformFeatureEnabled } from '@/platform/index.js'")
    expect(menuRoutesSource).toContain("redirectUnsupportedMapDraw")
    expect(homePageSource).toContain("import { isPlatformFeatureEnabled } from '@/platform/index.js'")
    expect(homePageSource).toContain('v-if="canUseMapDraw"')
    expect(tutorialManifestSource).toContain("import { isPlatformFeatureEnabled } from '@/platform/index.js'")
    expect(tutorialManifestSource).toContain('createPlatformPathEntry')
  })

  it('routes shared storage composables through the platform storage service', () => {
    const storageStateSource = readSource('src/composables/core/useStorageState.js')

    expect(storageStateSource).toContain("import { getPlatformStorage } from '@/platform/index.js'")
    expect(storageStateSource).not.toContain('window.sessionStorage : window.localStorage')
  })

  it('redirects unsupported native-webview map drawing routes back to map view', () => {
    window.webkit = { messageHandlers: { dialectsNative: {} } }

    expect(redirectUnsupportedMapDraw({
      params: { locale: 'zh-Hant', sub: 'draw' },
      query: { from: 'test' },
      hash: '#top',
    })).toEqual({
      path: '/zh-Hant/menu/map/view',
      query: { from: 'test' },
      hash: '#top',
    })
  })

  it('keeps supported web map drawing routes available', () => {
    expect(redirectUnsupportedMapDraw({
      params: { locale: 'zh-Hant', sub: 'draw' },
      query: {},
      hash: '',
    })).toBe(true)
  })

  it('omits map drawing tutorials in native-webview runtimes only', async () => {
    window.webkit = { messageHandlers: { dialectsNative: {} } }
    vi.resetModules()
    const { tutorialManifest: nativeManifest } = await import('../src/main/components/tutorial/tutorialManifest.js')

    expect(nativeManifest.some((entry) => entry.key === 'menu-map-draw')).toBe(false)

    delete window.webkit
    vi.resetModules()
    const { tutorialManifest: webManifest } = await import('../src/main/components/tutorial/tutorialManifest.js')

    expect(webManifest.some((entry) => entry.key === 'menu-map-draw')).toBe(true)
  })
})
