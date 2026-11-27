import { describe, expect, it, vi } from 'vitest'
import { notifyNativeLaunchReady } from '../src/platform/nativeLaunch.js'

describe('native launch handoff', () => {
  it('does nothing in a browser', async () => {
    const hide = vi.fn()
    const ready = vi.fn()
    await notifyNativeLaunchReady({ container: 'browser' }, { hideLaunch: hide }, ready)
    expect(hide).not.toHaveBeenCalled()
    expect(ready).not.toHaveBeenCalled()
  })

  it('dismisses native launch only after the first screen is ready', async () => {
    let resolveReady
    const ready = () => new Promise(resolve => { resolveReady = resolve })
    const hideLaunch = vi.fn().mockResolvedValue(undefined)
    const pending = notifyNativeLaunchReady({ container: 'native-webview' }, { hideLaunch }, ready)
    expect(hideLaunch).not.toHaveBeenCalled()
    resolveReady()
    await pending
    expect(hideLaunch).toHaveBeenCalledOnce()
  })
})
