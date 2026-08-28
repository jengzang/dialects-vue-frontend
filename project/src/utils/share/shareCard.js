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

export function createShareCardDataUrl({
  title,
  description,
  url,
  languageLabel,
  themeLabel,
  colorTheme,
}) {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 630
  const ctx = canvas.getContext('2d')
  const accent = readCssToken(THEME_COLOR_TOKENS[colorTheme] || THEME_COLOR_TOKENS.blue, '#2f74c0')

  ctx.fillStyle = readCssToken('--surface-panel-strong', '#f7fbf8')
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = accent
  ctx.fillRect(0, 0, canvas.width, 18)

  ctx.fillStyle = readCssToken('--text-deep', '#203026')
  ctx.font = '500 54px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText(fitText(ctx, title, 1040), 80, 160)

  ctx.font = '400 34px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  const descLines = wrapText(ctx, description, 920)
  descLines.forEach((line, index) => {
    ctx.fillText(line, 80, 230 + index * 48)
  })

  ctx.fillStyle = accent
  ctx.font = '500 30px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText(`${languageLabel} · ${themeLabel}`, 80, 450)

  ctx.fillStyle = readCssToken('--text-slate', '#637268')
  ctx.font = '400 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  ctx.fillText('方音图鉴', 80, 530)
  ctx.fillText(fitText(ctx, url, 1040), 80, 570)

  return canvas.toDataURL('image/png')
}
