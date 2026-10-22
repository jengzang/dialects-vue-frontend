import { describe, expect, it } from 'vitest'
import { getPlatformFullscreenController } from '../src/platform/fullscreen.js'

describe('browser fullscreen state', () => {
  it('does not report fullscreen when the browser has no fullscreen API', async () => {
    const element = {}
    const controller = getPlatformFullscreenController({ globals: {}, document: {} })
    expect(await controller.toggle(element)).toBe(false)
    expect(controller.isFullscreen(element)).toBe(false)
  })

  it('does not report success when a fullscreen request does not change browser state', async () => {
    const element = { requestFullscreen() {} }
    const controller = getPlatformFullscreenController({ globals: {}, document: {} })
    expect(await controller.enter(element)).toBe(false)
  })

  it('preserves fullscreen state if the browser cannot exit', async () => {
    const element = {}
    const controller = getPlatformFullscreenController({
      globals: {}, document: { fullscreenElement: element },
    })
    expect(await controller.toggle(element)).toBe(true)
    expect(controller.isFullscreen(element)).toBe(true)
  })

  it('does not identify a missing map element as fullscreen', () => {
    const controller = getPlatformFullscreenController({ globals: {}, document: {} })
    expect(controller.isFullscreen(null)).toBe(false)
  })

  it('reports the map as exited when a parent remains fullscreen', async () => {
    const element = {}
    const parent = {}
    const documentRef = {
      fullscreenElement: element,
      exitFullscreen() { this.fullscreenElement = parent },
    }
    const controller = getPlatformFullscreenController({ globals: {}, document: documentRef })
    expect(await controller.toggle(element)).toBe(false)
    expect(controller.isFullscreen(element)).toBe(false)
    expect(controller.isFullscreen(parent)).toBe(true)
  })

  it.each([
    ['fullscreenElement', 'requestFullscreen', 'exitFullscreen'],
    ['webkitFullscreenElement', 'webkitRequestFullscreen', 'webkitExitFullscreen'],
    ['mozFullScreenElement', 'mozRequestFullScreen', 'mozCancelFullScreen'],
    ['msFullscreenElement', 'msRequestFullscreen', 'msExitFullscreen'],
  ])('tracks entry and exit with %s', async (stateKey, requestKey, exitKey) => {
    const documentRef = { [stateKey]: null }
    const element = { [requestKey]() { documentRef[stateKey] = element } }
    documentRef[exitKey] = () => { documentRef[stateKey] = null }
    const controller = getPlatformFullscreenController({ globals: {}, document: documentRef })

    expect(await controller.toggle(element)).toBe(true)
    expect(controller.isFullscreen(element)).toBe(true)
    expect(await controller.toggle(element)).toBe(false)
    expect(controller.isFullscreen(element)).toBe(false)
  })

  it('propagates a rejected browser request without reporting fullscreen', async () => {
    const error = new Error('Fullscreen denied')
    const element = { requestFullscreen: async () => { throw error } }
    const controller = getPlatformFullscreenController({ globals: {}, document: {} })
    await expect(controller.toggle(element)).rejects.toBe(error)
    expect(controller.isFullscreen(element)).toBe(false)
  })
})
