import { beforeEach, describe, expect, it, vi } from 'vitest'

const platform = vi.hoisted(() => ({
  getCurrentRuntimePlatform: vi.fn(),
  saveBlob: vi.fn(),
}))
vi.mock('@/platform/index.js', () => ({
  getCurrentRuntimePlatform: platform.getCurrentRuntimePlatform,
  getPlatformFileService: () => ({ saveBlob: platform.saveBlob }),
}))
import { downloadText } from '../src/main/utils/export/resultExport.js'

describe('text export dispatch', () => {
  beforeEach(() => vi.clearAllMocks())

  it('awaits native sharing and preserves the exported text and filename', async () => {
    platform.getCurrentRuntimePlatform.mockReturnValue({ container: 'native-webview' })
    platform.saveBlob.mockResolvedValue({ driver: 'capacitor-filesystem-share' })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    await downloadText('方言,😀', '查詢.csv')
    const [blob, filename] = platform.saveBlob.mock.calls[0]
    expect(blob.type).toBe('text/csv;charset=utf-8')
    expect(filename).toBe('查詢.csv')
    const text = await new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsText(blob)
    })
    expect(text).toBe('方言,😀')
    expect(click).not.toHaveBeenCalled()
    click.mockRestore()
  })

  it('keeps browser anchor downloading without invoking native sharing', () => {
    platform.getCurrentRuntimePlatform.mockReturnValue({ container: 'browser' })
    URL.createObjectURL = vi.fn(() => 'blob:export')
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    downloadText('data', 'result.csv')
    expect(click).toHaveBeenCalledOnce()
    expect(platform.saveBlob).not.toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:export')
    click.mockRestore()
  })
})
