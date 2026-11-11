import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
    const gisPageSource = readSource('src/main/views/explore/GisPage.vue')
    const tutorialManifestSource = readSource('src/main/components/tutorial/tutorialManifest.js')

    expect(gisPageSource).toContain('@/main/composables/gis/')
    expect(mapPageSource).not.toContain("isPlatformFeatureEnabled('mapDraw')")
    expect(mapPageSource).not.toContain("v-if=\"canUseMapDraw\"")
    expect(mapPageSource).not.toContain('MapDrawTab')
    expect(menuBarSource).toContain("import { isPlatformRouteEnabled } from '@/platform/index.js'")
    expect(menuBarSource).toContain("filterPlatformChildPaths")
    expect(menuBarSource).toContain('isPlatformRouteEnabled(path)')
    expect(menuBarSource).not.toContain("isPlatformFeatureEnabled('mapDraw')")
    expect(menuRoutesSource).toContain("path: 'menu/map/:sub(view|divide|custom)'")
    expect(menuRoutesSource).not.toContain("redirectUnsupportedMapDraw")
    expect(menuRoutesSource).not.toContain("isPlatformFeatureEnabled('mapDraw')")
    expect(homePageSource).toContain('<HeroShowcase')
    expect(readSource('src/main/components/HeroShowcase.vue')).toContain("route: '/explore/gis'")
    expect(homePageSource).not.toContain("isPlatformFeatureEnabled('mapDraw')")
    expect(homePageSource).not.toContain('canUseMapDraw')
    expect(tutorialManifestSource).toContain("import { isPlatformTutorialEnabled } from '@/platform/index.js'")
    expect(tutorialManifestSource).toContain('createPlatformPathEntry')
    expect(tutorialManifestSource).not.toContain("isPlatformFeatureEnabled('mapDraw')")
  })

  it('routes shared storage composables through the platform storage service', () => {
    const storageStateSource = readSource('src/composables/core/useStorageState.js')

    expect(storageStateSource).toContain("import { getPlatformStorage } from '@/platform/index.js'")
    expect(storageStateSource).not.toContain('window.sessionStorage : window.localStorage')
  })

  it('routes export downloads through the platform file service', () => {
    const downloadTabularSource = readSource('src/utils/import/downloadTabularSource.js')
    const mergeToolSource = readSource('src/main/views/explore/tools/MergeTool.vue')
    const checkToolSource = readSource('src/main/views/explore/tools/CheckTool.vue')
    const jyutToolSource = readSource('src/main/views/explore/tools/Jyut2IpaTool.vue')

    expect(downloadTabularSource).toContain("import { getPlatformFileService } from '@/platform/index.js'")
    expect(mergeToolSource).toContain("import { getPlatformFileService } from '@/platform/index.js'")
    expect(checkToolSource).toContain("import { getPlatformFileService } from '@/platform/index.js'")
    expect(jyutToolSource).toContain("import { getPlatformFileService } from '@/platform/index.js'")
    expect(downloadTabularSource).not.toContain('createObjectURL')
    expect(mergeToolSource).not.toContain('createObjectURL(blob)')
    expect(checkToolSource).not.toContain('createObjectURL(blob)')
    expect(jyutToolSource).not.toContain('createObjectURL(blob)')
  })

  it('routes primary upload pickers through the platform file service', () => {
    const mergeToolSource = readSource('src/main/views/explore/tools/MergeTool.vue')
    const checkToolSource = readSource('src/main/views/explore/tools/CheckTool.vue')
    const jyutToolSource = readSource('src/main/views/explore/tools/Jyut2IpaTool.vue')

    expect(mergeToolSource).toContain('chooseReferenceFile')
    expect(mergeToolSource).toContain('chooseMergeFiles')
    expect(mergeToolSource).toContain('pickFilesOrOpenInput(refInput.value')
    expect(mergeToolSource).toContain('pickFilesOrOpenInput(filesInput.value')
    expect(checkToolSource).toContain('chooseCheckFile')
    expect(checkToolSource).toContain('pickFilesOrOpenInput(fileInput.value')
    expect(jyutToolSource).toContain('chooseJyutFile')
    expect(jyutToolSource).toContain('pickFilesOrOpenInput(fileInput.value')
  })

  it('routes editable map fullscreen through the platform fullscreen controller', () => {
    const editableMapSource = readSource('src/main/components/map/EditableMapLibre.vue')

    expect(editableMapSource).toContain("import { getPlatformFullscreenController } from '@/platform/index.js'")
    expect(editableMapSource).toContain('fullscreenController.toggle')
    expect(editableMapSource).toContain('is-platform-fullscreen')
    expect(editableMapSource).not.toContain('document.fullscreenElement === mapContainer.value')
  })

  it('keeps native-webview GIS routes available', async () => {
    window.webkit = { messageHandlers: { dialectsNative: {} } }
    vi.resetModules()
    const { isPlatformRouteEnabled } = await import('../src/platform/index.js')

    expect(isPlatformRouteEnabled('/explore/gis')).toBe(true)
  })

  it('keeps supported web GIS routes available', async () => {
    const { isPlatformRouteEnabled } = await import('../src/platform/index.js')

    expect(isPlatformRouteEnabled('/explore/gis')).toBe(true)
  })

  it('keeps map drawing tutorials in native-webview runtimes for GIS', async () => {
    window.webkit = { messageHandlers: { dialectsNative: {} } }
    vi.resetModules()
    const { tutorialManifest: nativeManifest } = await import('../src/main/components/tutorial/tutorialManifest.js')

    expect(nativeManifest.some((entry) => entry.key === 'menu-map-draw')).toBe(true)

    delete window.webkit
    vi.resetModules()
    const { tutorialManifest: webManifest } = await import('../src/main/components/tutorial/tutorialManifest.js')

    expect(webManifest.some((entry) => entry.key === 'menu-map-draw')).toBe(true)
  })
})
