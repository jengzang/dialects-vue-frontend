import { afterEach, expect, it, vi } from 'vitest'
import { initializeNativeDownloadLinks, registerNativeFileService } from '../src/platform/fileExport.js'

afterEach(() => { registerNativeFileService(null); vi.unstubAllGlobals() })

it('shares template downloads with their original filename and consumes the click', async () => {
  const saveBlob = vi.fn()
  registerNativeFileService({ saveBlob })
  const blob = new Blob(['template'])
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, blob: async () => blob }))
  const dispose = initializeNativeDownloadLinks()
  const anchor = document.createElement('a')
  anchor.href = '/data/sample/template.xlsx'
  anchor.download = '詞彙模板.xlsx'
  const icon = document.createElement('span')
  anchor.append(icon)
  document.body.append(anchor)
  const event = new MouseEvent('click', { bubbles: true, cancelable: true })
  icon.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(true)
  await vi.waitFor(() => expect(saveBlob).toHaveBeenCalledWith(blob, '詞彙模板.xlsx'))
  dispose(); anchor.remove()
})

it('leaves ordinary navigation links alone', () => {
  const dispose = initializeNativeDownloadLinks()
  const anchor = document.createElement('a')
  anchor.href = '#test'
  document.body.append(anchor)
  const event = new MouseEvent('click', { bubbles: true, cancelable: true })
  anchor.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(false)
  dispose(); anchor.remove()
})
