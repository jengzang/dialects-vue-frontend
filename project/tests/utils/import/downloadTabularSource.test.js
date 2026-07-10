import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { downloadTabularSource, isTabularSourceExportable, resolveTabularSourceExport } from '@/utils/import/downloadTabularSource.js'

describe('downloadTabularSource helpers', () => {
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('recognizes direct file sources as exportable', () => {
    const source = {
      file: new File(['demo'], 'demo.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    }

    expect(isTabularSourceExportable(source)).toBe(true)
  })

  it('resolves export payload from resolveFile', async () => {
    const source = {
      fileName: 'preset.xlsx',
      resolveFile: vi.fn(async () => new File(['preset'], 'preset.xlsx'))
    }

    const payload = await resolveTabularSourceExport(source)

    expect(source.resolveFile).toHaveBeenCalledTimes(1)
    expect(payload.fileName).toBe('preset.xlsx')
    expect(payload.blob).toBeInstanceOf(File)
  })

  it('resolves export payload from resolveExport fallback', async () => {
    const source = {
      fileName: 'remote.xlsx',
      resolveExport: vi.fn(async () => ({
        blob: new Blob(['remote']),
        fileName: 'remote.xlsx'
      }))
    }

    const payload = await resolveTabularSourceExport(source)

    expect(source.resolveExport).toHaveBeenCalledTimes(1)
    expect(payload.fileName).toBe('remote.xlsx')
    expect(payload.blob).toBeInstanceOf(Blob)
  })

  it('downloads resolved payload through object url flow', async () => {
    const appendChild = vi.spyOn(document.body, 'appendChild')
    const removeChild = vi.spyOn(document.body, 'removeChild')
    const click = vi.fn()
    const anchor = document.createElement('a')
    vi.spyOn(anchor, 'click').mockImplementation(click)
    const originalCreateElement = document.createElement.bind(document)
    const createElement = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') {
        return anchor
      }
      return originalCreateElement(tagName)
    })

    const source = {
      file: new File(['demo'], 'demo.xlsx')
    }

    const result = await downloadTabularSource(source)

    expect(result.fileName).toBe('demo.xlsx')
    expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1)
    expect(click).toHaveBeenCalledTimes(1)
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    expect(appendChild).toHaveBeenCalledTimes(1)
    expect(removeChild).toHaveBeenCalledTimes(1)
    createElement.mockRestore()
  })
})
