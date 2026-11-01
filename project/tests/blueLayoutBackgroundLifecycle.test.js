import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import Background from '../src/components/common/BlueLayoutBackground.vue'
import { drawBlueLayoutBackground, loadBlueBackgroundResources } from '../src/utils/ui/blueLayoutBackground.js'

vi.mock('../src/utils/ui/blueLayoutBackground.js', () => ({
  drawBlueLayoutBackground: vi.fn(),
  loadBlueBackgroundResources: vi.fn(),
}))

describe('blue background lifecycle', () => {
  let app, host, frames, disconnect
  beforeEach(() => {
    vi.clearAllMocks()
    frames = new Map()
    disconnect = vi.fn()
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect() { disconnect() }
    })
    vi.stubGlobal('requestAnimationFrame', vi.fn(callback => {
      const id = frames.size + 1
      frames.set(id, callback)
      return id
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    host = document.createElement('div')
    document.body.append(host)
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 390, height: 844 })
  })
  afterEach(() => {
    app?.unmount()
    app = null
    host.remove()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('redraws on resize and releases pending frames, observers and resize handlers on unmount', async () => {
    const resources = { geography: {} }
    loadBlueBackgroundResources.mockResolvedValue(resources)
    app = createApp(Background)
    app.mount(host)
    await nextTick()
    await Promise.resolve()
    for (const callback of frames.values()) callback()
    expect(drawBlueLayoutBackground).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), resources, 390, 844, expect.any(Object), 1)
    window.dispatchEvent(new Event('resize'))
    const frameCount = requestAnimationFrame.mock.calls.length
    app.unmount()
    app = null
    expect(disconnect).toHaveBeenCalledOnce()
    expect(cancelAnimationFrame).toHaveBeenCalled()
    window.dispatchEvent(new Event('resize'))
    expect(requestAnimationFrame).toHaveBeenCalledTimes(frameCount)
  })

  it('does not schedule a draw if the layout is left while background resources are loading', async () => {
    let finishLoading
    loadBlueBackgroundResources.mockReturnValue(new Promise(resolve => { finishLoading = resolve }))
    app = createApp(Background)
    app.mount(host)
    app.unmount()
    app = null
    finishLoading({ geography: {} })
    await nextTick()
    await Promise.resolve()
    expect(requestAnimationFrame).not.toHaveBeenCalled()
    expect(drawBlueLayoutBackground).not.toHaveBeenCalled()
  })
})
