import { describe, expect, it, vi } from 'vitest'
import { getPlatformShareUrl, shareNativeImage } from '../src/platform/sharing.js'

describe('native page sharing', () => {
  it('keeps web URLs unchanged and gives native shares a public origin', () => {
    expect(getPlatformShareUrl('https://example.org/zh-CN/explore/tools/praat?q=a', false)).toBe('https://example.org/zh-CN/explore/tools/praat?q=a')
    expect(getPlatformShareUrl('capacitor://localhost/explore/tools/praat?q=a', true)).toBe('https://dialects.yzup.top/explore/tools/praat?q=a')
  })
  it('passes the decoded image and original filename to the native file service', async () => {
    const saveBlob = vi.fn().mockResolvedValue({})
    await shareNativeImage('data:image/png;base64,YWJj', '分享.png', { saveBlob })
    expect(saveBlob).toHaveBeenCalledWith(expect.any(Blob), '分享.png')
    expect(saveBlob.mock.calls[0][0].size).toBe(3)
    expect(saveBlob.mock.calls[0][0].type).toBe('image/png')
  })
})

describe('native share availability', () => {
  it('does not silently download in a WebView without native sharing', async () => {
    const { getPlatformFileService } = await import('../src/platform/files.js')
    const service = getPlatformFileService({
      globals: { Capacitor: { isNativePlatform: () => true, isPluginAvailable: () => false } },
    })
    await expect(service.saveBlob(new Blob(['a']), 'a.txt')).rejects.toMatchObject({
      code: 'NATIVE_SHARE_UNAVAILABLE',
    })
  })
})
