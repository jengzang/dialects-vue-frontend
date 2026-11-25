import { describe, expect, it, vi } from 'vitest'

globalThis.__WEB_BASE__ = ''

describe('account deactivation', () => {
  it('treats only native iOS runtimes as sponsor-hidden', async () => {
    const { shouldHideSponsorContent } = await import('../src/platform/sponsorship.js')

    expect(shouldHideSponsorContent({ family: 'ios', container: 'native-webview' })).toBe(true)
    expect(shouldHideSponsorContent({ family: 'ios', container: 'browser' })).toBe(false)
    expect(shouldHideSponsorContent({ family: 'android', container: 'native-webview' })).toBe(false)
    expect(shouldHideSponsorContent({ family: 'web', os: 'ios', container: 'browser' })).toBe(false)
  })

  it('deactivates the current account through the auth API', async () => {
    const apiMock = vi.fn().mockResolvedValue({ status: 'disabled' })
    vi.doMock('../src/api/auth/httpClient.js', () => ({ api: apiMock }))

    const { deactivateAccount } = await import('../src/api/auth/actions.js')
    await expect(deactivateAccount()).resolves.toEqual({ status: 'disabled' })
    expect(apiMock).toHaveBeenCalledWith('/api/auth/account', { method: 'DELETE' })
  })
})
