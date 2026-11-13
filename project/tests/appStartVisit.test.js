import { describe, expect, it, vi } from 'vitest'
import { reportAppStart } from '../src/platform/appStartVisit.js'

describe('app start reporting', () => {
  it.each(['ios', 'android'])('reports a %s native launch once', async (family) => {
    const send = vi.fn().mockResolvedValue({ ok: true })
    await reportAppStart({ family, container: 'native-webview' }, 'https://example.com', send)
    expect(send).toHaveBeenCalledOnce()
    expect(send).toHaveBeenCalledWith('https://example.com/logs/visits/app-start', expect.objectContaining({
      method: 'POST', body: JSON.stringify({ platform: family }),
    }))
  })

  it('does not report a browser launch and ignores network failures', async () => {
    const send = vi.fn().mockRejectedValue(new Error('offline'))
    await reportAppStart({ family: 'web', container: 'browser' }, '', send)
    expect(send).not.toHaveBeenCalled()
    await expect(reportAppStart({ family: 'ios', container: 'native-webview' }, '', send)).resolves.toBeUndefined()
  })
})
