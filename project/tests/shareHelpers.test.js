import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const html2canvasMock = vi.fn()

vi.mock('html2canvas', () => ({
  default: html2canvasMock,
}))

beforeEach(() => {
  vi.resetModules()
  html2canvasMock.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('page snapshot helper', () => {
  it('returns a compressed data URL from the document body', async () => {
    const canvas = {
      width: 1200,
      height: 300,
      toDataURL: vi.fn().mockReturnValue('data:image/webp;base64,abc'),
    }
    html2canvasMock.mockResolvedValue(canvas)

    const { capturePageSnapshot } = await import('../src/utils/share/pageSnapshot.js')
    const result = await capturePageSnapshot({ maxWidth: 1200, quality: 0.72 })

    expect(result).toBe('data:image/webp;base64,abc')
    expect(html2canvasMock).toHaveBeenCalledWith(document.body, {
      backgroundColor: null,
      height: window.innerHeight,
      ignoreElements: expect.any(Function),
      logging: false,
      scale: 1,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      useCORS: true,
      width: window.innerWidth,
      windowHeight: window.innerHeight,
      windowWidth: window.innerWidth,
      x: window.scrollX,
      y: window.scrollY,
    })
    expect(canvas.toDataURL).toHaveBeenCalledWith('image/webp', 0.72)
  })

  it('caps automatic screenshot capture to the visible viewport height', async () => {
    const drawImageMock = vi.fn()
    const resizedCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage: drawImageMock })),
      toDataURL: vi.fn().mockReturnValue('data:image/webp;base64,resized'),
    }
    const createElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') return resizedCanvas
      return createElement(tagName)
    })

    const canvas = {
      width: 1200,
      height: 800,
      toDataURL: vi.fn().mockReturnValue('data:image/webp;base64,abc'),
    }
    html2canvasMock.mockResolvedValue(canvas)

    const { capturePageSnapshot } = await import('../src/utils/share/pageSnapshot.js')
    await capturePageSnapshot({ maxHeight: 320 })

    expect(html2canvasMock).toHaveBeenCalledWith(
      document.body,
      expect.objectContaining({
        height: 320,
        windowHeight: 320,
      })
    )
    expect(drawImageMock).toHaveBeenCalledWith(canvas, 0, 0, resizedCanvas.width, resizedCanvas.height)
  })

  it('ignores the in-page suggestion form during screenshot capture', async () => {
    const canvas = {
      width: 1200,
      height: 300,
      toDataURL: vi.fn().mockReturnValue('data:image/webp;base64,abc'),
    }
    html2canvasMock.mockResolvedValue(canvas)

    const suggestionForm = document.createElement('form')
    suggestionForm.dataset.aboutSuggestionForm = ''
    const typedField = document.createElement('input')
    suggestionForm.appendChild(typedField)
    document.body.appendChild(suggestionForm)

    const { capturePageSnapshot } = await import('../src/utils/share/pageSnapshot.js')
    await capturePageSnapshot()

    const [, options] = html2canvasMock.mock.calls[0]

    expect(options.ignoreElements(suggestionForm)).toBe(true)
    expect(options.ignoreElements(typedField)).toBe(true)
    expect(options.ignoreElements(document.body)).toBe(false)
  })

  it('lowers webp quality until the screenshot is below the target size', async () => {
    const largeDataUrl = `data:image/webp;base64,${'a'.repeat(1200)}`
    const smallDataUrl = 'data:image/webp;base64,abc'
    const canvas = {
      width: 1200,
      height: 800,
      toDataURL: vi.fn()
        .mockReturnValueOnce(largeDataUrl)
        .mockReturnValueOnce(smallDataUrl),
    }
    html2canvasMock.mockResolvedValue(canvas)

    const { capturePageSnapshot } = await import('../src/utils/share/pageSnapshot.js')
    const result = await capturePageSnapshot({ targetBytes: 100, maxBytes: 1024, quality: 0.8 })

    expect(result).toBe(smallDataUrl)
    expect(canvas.toDataURL).toHaveBeenNthCalledWith(1, 'image/webp', 0.8)
    expect(canvas.toDataURL).toHaveBeenNthCalledWith(2, 'image/webp', 0.72)
  })
})

describe('share card helper', () => {
  it('draws a branded share card and returns a PNG data URL', async () => {
    const calls = []
    const context = {
      fillStyle: '',
      font: '',
      textAlign: '',
      fillRect: (...args) => calls.push(['fillRect', ...args]),
      fillText: (...args) => calls.push(['fillText', ...args]),
      measureText: (text) => ({ width: text.length * 12 }),
    }
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => context,
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,card'),
    }
    const createElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') return canvas
      return createElement(tagName)
    })

    const { createShareCardDataUrl } = await import('../src/utils/share/shareCard.js')
    const result = createShareCardDataUrl({
      title: '查中古',
      description: '按中古地位整理各方言点读音。',
      url: 'https://dialects.yzup.top/menu/query/zhonggu',
      languageLabel: '简体',
      themeLabel: '绿色',
      colorTheme: 'green',
    })

    expect(result).toBe('data:image/png;base64,card')
    expect(canvas.width).toBe(1200)
    expect(canvas.height).toBe(630)
    expect(calls.some(call => call.includes('方音图鉴'))).toBe(true)
    expect(calls.some(call => call.includes('简体 · 绿色'))).toBe(true)
  })

  it('draws localized brand copy and QR blocks on the share card', async () => {
    const calls = []
    const context = {
      fillStyle: '',
      font: '',
      textAlign: '',
      fillRect: (...args) => calls.push(['fillRect', ...args]),
      fillText: (...args) => calls.push(['fillText', ...args]),
      measureText: (text) => ({ width: text.length * 12 }),
    }
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => context,
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,card'),
    }
    const createElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') return canvas
      return createElement(tagName)
    })

    const { createShareCardDataUrl } = await import('../src/utils/share/shareCard.js')
    createShareCardDataUrl({
      title: 'Middle Chinese Query',
      description: 'Organize dialect readings by Middle Chinese categories.',
      url: 'https://dialects.yzup.top/en/menu/query/zhonggu',
      languageLabel: 'English',
      themeLabel: 'Green',
      colorTheme: 'green',
      brandName: 'Chinese Dialect Atlas',
      qrHint: 'Scan to open this page',
    })

    const drawnTexts = calls
      .filter(call => call[0] === 'fillText')
      .map(call => call[1])
    const qrBlocks = calls.filter(call => call[0] === 'fillRect' && call[1] >= 870 && call[2] >= 300)

    expect(drawnTexts).toContain('Chinese Dialect Atlas')
    expect(drawnTexts).toContain('Scan to open this page')
    expect(qrBlocks.length).toBeGreaterThan(80)
  })

  it('truncates oversized share-card title and URL before drawing', async () => {
    const calls = []
    const context = {
      fillStyle: '',
      font: '',
      fillRect: (...args) => calls.push(['fillRect', ...args]),
      fillText: (...args) => calls.push(['fillText', ...args]),
      measureText: (text) => ({ width: text.length * 20 }),
    }
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => context,
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,card'),
    }
    const createElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') return canvas
      return createElement(tagName)
    })

    const longTitle = '查中古'.repeat(80)
    const longUrl = `https://dialects.yzup.top/${'very-long-path/'.repeat(40)}`

    const { createShareCardDataUrl } = await import('../src/utils/share/shareCard.js')
    createShareCardDataUrl({
      title: longTitle,
      description: '按中古地位整理各方言点读音。',
      url: longUrl,
      languageLabel: '简体',
      themeLabel: '绿色',
      colorTheme: 'green',
    })

    const drawnTexts = calls
      .filter(call => call[0] === 'fillText')
      .map(call => call[1])

    expect(drawnTexts).not.toContain(longTitle)
    expect(drawnTexts).not.toContain(longUrl)
    expect(drawnTexts.some(text => text.endsWith('...'))).toBe(true)
  })
})
