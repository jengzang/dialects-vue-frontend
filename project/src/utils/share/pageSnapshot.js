import html2canvas from 'html2canvas'

const DEFAULT_MAX_WIDTH = 1200
const DEFAULT_MAX_HEIGHT = 900
const DEFAULT_TARGET_BYTES = 600 * 1024
const DEFAULT_MAX_BYTES = 1024 * 1024
const DEFAULT_QUALITY = 0.72
const MIN_QUALITY = 0.42
const QUALITY_STEP = 0.08

export function estimateDataUrlBytes(dataUrl) {
  if (typeof dataUrl !== 'string') return 0
  const base64 = dataUrl.split(',', 2)[1] || ''
  return Math.ceil((base64.length * 3) / 4)
}

function resizeCanvasIfNeeded(canvas, maxWidth, maxHeight) {
  if (
    !canvas ||
    (!maxWidth && !maxHeight) ||
    (!maxWidth || canvas.width <= maxWidth) &&
      (!maxHeight || canvas.height <= maxHeight)
  ) {
    return canvas
  }

  const widthRatio = maxWidth ? maxWidth / canvas.width : 1
  const heightRatio = maxHeight ? maxHeight / canvas.height : 1
  const ratio = Math.min(widthRatio, heightRatio, 1)
  const resizedCanvas = document.createElement('canvas')
  resizedCanvas.width = Math.round(canvas.width * ratio)
  resizedCanvas.height = Math.round(canvas.height * ratio)
  const context = resizedCanvas.getContext('2d')
  if (!context) return canvas

  context.drawImage(canvas, 0, 0, resizedCanvas.width, resizedCanvas.height)

  return resizedCanvas
}

export function encodeCanvasWithinLimit(
  canvas,
  {
    mimeType = 'image/webp',
    quality = DEFAULT_QUALITY,
    targetBytes = DEFAULT_TARGET_BYTES,
    maxBytes = DEFAULT_MAX_BYTES,
  } = {}
) {
  let currentQuality = quality
  let dataUrl = canvas.toDataURL(mimeType, currentQuality)

  while (estimateDataUrlBytes(dataUrl) > targetBytes && currentQuality > MIN_QUALITY) {
    currentQuality = Math.max(MIN_QUALITY, Number((currentQuality - QUALITY_STEP).toFixed(2)))
    dataUrl = canvas.toDataURL(mimeType, currentQuality)
  }

  if (estimateDataUrlBytes(dataUrl) > maxBytes) {
    throw new Error('screenshot_too_large')
  }

  return dataUrl
}

export async function capturePageSnapshot({
  target = document.body,
  maxWidth = DEFAULT_MAX_WIDTH,
  maxHeight = DEFAULT_MAX_HEIGHT,
  quality = DEFAULT_QUALITY,
  targetBytes = DEFAULT_TARGET_BYTES,
  maxBytes = DEFAULT_MAX_BYTES,
} = {}) {
  const captureWidth = window.innerWidth
  const captureHeight = Math.min(window.innerHeight, maxHeight)
  const canvas = await html2canvas(target, {
    backgroundColor: null,
    height: captureHeight,
    ignoreElements: (element) => {
      return Boolean(
        element.closest?.('[data-layout-feedback-modal]') ||
        element.closest?.('[data-about-suggestion-form]') ||
        element.closest?.('[data-page-tutorial-guide]') ||
        element.closest?.('[data-app-footer]') ||
        element.closest?.('.app-modal')
      )
    },
    logging: false,
    scale: 1,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    useCORS: true,
    width: captureWidth,
    windowHeight: captureHeight,
    windowWidth: captureWidth,
    x: window.scrollX,
    y: window.scrollY,
  })

  return encodeCanvasWithinLimit(resizeCanvasIfNeeded(canvas, maxWidth, maxHeight), {
    quality,
    targetBytes,
    maxBytes,
  })
}
