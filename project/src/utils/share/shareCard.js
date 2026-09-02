import qrcode from 'qrcode-generator'

const THEME_COLOR_TOKENS = {
  blue: '--color-primary',
  green: '--color-success',
  light: '--text-slate',
  dark: '--text-deep',
}

function readCssToken(tokenName, fallback) {
  if (typeof window === 'undefined') {
    return fallback
  }

  return getComputedStyle(document.documentElement)
    .getPropertyValue(tokenName)
    .trim() || fallback
}

function wrapText(ctx, text, maxWidth) {
  const chars = Array.from(text)
  const lines = []
  let current = ''

  for (const char of chars) {
    const next = current + char
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current)
      current = char
    } else {
      current = next
    }
  }

  if (current) lines.push(current)
  return lines.slice(0, 3)
}

function fitText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) {
    return text
  }

  const suffix = '...'
  let current = ''
  for (const char of Array.from(text)) {
    const next = current + char
    if (ctx.measureText(next + suffix).width > maxWidth) {
      break
    }
    current = next
  }
  return `${current}${suffix}`
}

function drawQrCode(ctx, url, x, y, size, foreground, background) {
  const qr = qrcode(0, 'M')
  qr.addData(url)
  qr.make()

  const moduleCount = qr.getModuleCount()
  const quietModules = 4
  const moduleSize = Math.floor(size / (moduleCount + quietModules * 2))
  const qrSize = moduleSize * (moduleCount + quietModules * 2)
  const offset = Math.floor((size - qrSize) / 2)
  const startX = x + offset + quietModules * moduleSize
  const startY = y + offset + quietModules * moduleSize

  ctx.fillStyle = background
  ctx.fillRect(x, y, size, size)

  ctx.fillStyle = foreground
  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (qr.isDark(row, col)) {
        ctx.fillRect(
          startX + col * moduleSize,
          startY + row * moduleSize,
          moduleSize,
          moduleSize,
        )
      }
    }
  }
}

export function createShareCardDataUrl({
  title,
  description,
  url,
  languageLabel,
  themeLabel,
  colorTheme,
  brandName = '方音图鉴',
  qrHint = '',
}) {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 630
  const ctx = canvas.getContext('2d')
  const accent = readCssToken(THEME_COLOR_TOKENS[colorTheme] || THEME_COLOR_TOKENS.blue, '#2f74c0')
  const panel = readCssToken('--surface-panel-strong', '#f7fbf8')
  const textDeep = readCssToken('--text-deep', '#203026')
  const textSlate = readCssToken('--text-slate', '#637268')

  ctx.fillStyle = panel
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.globalAlpha = 0.08
  ctx.fillStyle = accent
  ctx.fillRect(0, 18, canvas.width, 138)
  ctx.fillRect(80, 500, 710, 2)
  for (let x = 0; x < canvas.width; x += 80) {
    ctx.fillRect(x, 156, 1, canvas.height - 156)
  }
  ctx.globalAlpha = 1

  ctx.fillStyle = accent
  ctx.fillRect(0, 0, canvas.width, 18)
  ctx.fillRect(0, canvas.height - 12, canvas.width, 12)

  ctx.fillStyle = accent
  ctx.fillRect(80, 76, 58, 58)
  ctx.fillStyle = panel
  ctx.font = '600 32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(Array.from(brandName)[0] || '方', 109, 115)
  ctx.textAlign = 'left'

  ctx.fillStyle = textSlate
  ctx.font = '500 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText(fitText(ctx, brandName, 560), 154, 113)

  ctx.fillStyle = textDeep
  ctx.font = '500 54px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText(fitText(ctx, title, 720), 80, 210)

  ctx.font = '400 34px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  const descLines = wrapText(ctx, description, 700)
  descLines.forEach((line, index) => {
    ctx.fillText(line, 80, 280 + index * 48)
  })

  ctx.fillStyle = accent
  ctx.font = '500 30px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText(`${languageLabel} · ${themeLabel}`, 80, 465)

  ctx.fillStyle = textSlate
  ctx.font = '400 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText(fitText(ctx, url, 700), 80, 555)

  drawQrCode(ctx, url, 890, 292, 220, '#17212b', '#ffffff')

  if (qrHint) {
    ctx.fillStyle = textSlate
    ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(fitText(ctx, qrHint, 300), 1000, 550)
    ctx.textAlign = 'left'
  }

  return canvas.toDataURL('image/png')
}
