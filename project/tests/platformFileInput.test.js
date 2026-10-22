import { describe, expect, it, vi } from 'vitest'
import { getPlatformFileService } from '../src/platform/files.js'

describe('platform file input activation', () => {
  it('opens the browser input before returning to the click handler', async () => {
    const input = { click: vi.fn() }
    const service = getPlatformFileService({ globals: {} })
    const selection = service.pickFilesOrOpenInput(input)
    expect(input.click).toHaveBeenCalledOnce()
    await expect(selection).resolves.toBeNull()
  })

  it('does not open a browser dialog when native file selection is cancelled', async () => {
    const input = { click: vi.fn() }
    const service = getPlatformFileService({
      globals: { DialectsNativeBridge: { pickFiles: async () => [] } },
    })
    await expect(service.pickFilesOrOpenInput(input)).resolves.toEqual([])
    expect(input.click).not.toHaveBeenCalled()
  })
})
