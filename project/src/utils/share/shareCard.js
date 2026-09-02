import qrcode from 'qrcode-generator'

const CARD_CONFIGS = {
  landscape: {
    width: 1200,
    height: 630,

    brandLogo: {
      x: 80,
      y: 50,
      width: 66,
      height: 66,
    },

    brandTitle: {
      x: 158,
      y: 30,
      width: 300,
      height: 110,
    },

    contentTitle: {
      x: 80,
      y: 210,
      maxWidth: 720,
    },

    description: {
      x: 80,
      y: 280,
      maxWidth: 700,
      lineHeight: 48,
    },

    meta: {
      x: 80,
      y: 465,
    },

    url: {
      x: 80,
      y: 555,
      maxWidth: 800,
    },

    divider: {
      x: 80,
      y: 500,
      width: 710,
    },

    qr: {
      x: 890,
      y: 292,
      size: 220,
    },

    qrHint: {
      x: 1000,
      y: 550,
      maxWidth: 300,
    },
  },


  portrait: {
    width: 630,
    height: 900,

    brandLogo: {
      x: 60,
      y: 50,
      width: 70,
      height: 70,
    },

    brandTitle: {
      x: 150,
      y: 40,
      width: 300,
      height: 100,
    },

    contentTitle: {
      x: 60,
      y: 230,
      maxWidth: 510,
    },

    description: {
      x: 60,
      y: 300,
      maxWidth: 510,
      lineHeight: 48,
    },

    meta: {
      x: 60,
      y: 480,
    },

    url: {
      x: 60,
      y: 840,
      maxWidth: 700,
    },

    divider: {
      x: 60,
      y: 800,
      width: 510,
    },

    qr: {
      x: 205,
      y: 520,
      size: 220,
    },

    qrHint: {
      x: 315,
      y: 780,
      maxWidth: 300,
    },
  },
}


const THEME_COLOR_TOKENS = {
  blue: '--color-primary-hover',
  green: '--color-primary-hover',
  light: '--color-primary-hover',
  dark: '--color-primary-hover',
}


const BRAND_TITLE_SRC = '/brand/title.webp'


const BRAND_LOGO_SRCS = {
  green: '/brand/favicon_green.ico',
  blue: '/brand/favicon.ico',
  light: '/brand/favicon.ico',
  dark: '/brand/favicon.ico',
}


const QR_CENTER_SRCS = {
  green: '/brand/GreenCircle.webp',
  blue: '/brand/BlueCircle.webp',
  light: '/brand/BlueCircle.webp',
  dark: '/brand/BlueCircle.webp',
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

  if (current) {
    lines.push(current)
  }

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

    if (
      ctx.measureText(next + suffix).width > maxWidth
    ) {
      break
    }

    current = next
  }

  return `${current}${suffix}`
}


function loadCanvasImage(src) {
  if (typeof Image === 'undefined') {
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)

    image.src = src
  })
}


function drawContainedImage(
  ctx,
  image,
  x,
  y,
  maxWidth,
  maxHeight,
) {
  if (!image) {
    return false
  }

  const ratio = Math.min(
    maxWidth / image.width,
    maxHeight / image.height,
  )

  const width = image.width * ratio
  const height = image.height * ratio


  ctx.drawImage(
    image,
    x + (maxWidth - width) / 2,
    y + (maxHeight - height) / 2,
    width,
    height,
  )

  return true
}


function drawCircleImage(
  ctx,
  image,
  centerX,
  centerY,
  outerSize,
  imageSize,
  background,
) {
  if (!image) {
    return
  }


  ctx.fillStyle = background

  ctx.beginPath()
  ctx.arc(
    centerX,
    centerY,
    outerSize / 2,
    0,
    Math.PI * 2,
  )
  ctx.fill()


  ctx.save()

  ctx.beginPath()
  ctx.arc(
    centerX,
    centerY,
    imageSize / 2,
    0,
    Math.PI * 2,
  )

  ctx.clip()


  drawContainedImage(
    ctx,
    image,
    centerX - imageSize / 2,
    centerY - imageSize / 2,
    imageSize,
    imageSize,
  )


  ctx.restore()
}
function drawQrCode(
  ctx,
  url,
  x,
  y,
  size,
  foreground,
  background,
  centerImage,
) {
  const qr = qrcode(0, 'H')

  qr.addData(url)
  qr.make()


  const moduleCount = qr.getModuleCount()
  const quietModules = 4

  const moduleSize = Math.floor(
    size / (moduleCount + quietModules * 2),
  )

  const qrSize =
    moduleSize *
    (moduleCount + quietModules * 2)


  const offset = Math.floor(
    (size - qrSize) / 2,
  )


  const startX =
    x +
    offset +
    quietModules * moduleSize

  const startY =
    y +
    offset +
    quietModules * moduleSize


  ctx.fillStyle = background
  ctx.fillRect(
    x,
    y,
    size,
    size,
  )


  ctx.fillStyle = foreground

  for (
    let row = 0;
    row < moduleCount;
    row += 1
  ) {
    for (
      let col = 0;
      col < moduleCount;
      col += 1
    ) {
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


  drawCircleImage(
    ctx,
    centerImage,
    x + size / 2,
    y + size / 2,
    64,
    48,
    background,
  )
}



export async function createShareCardDataUrl({
  title,
  description,
  url,
  statsLabel,
  colorTheme,

  orientation = 'landscape',

  brandName = '方音图鉴',
  qrHint = '',

  brandTitleSrc = BRAND_TITLE_SRC,

  brandLogoSrc =
    BRAND_LOGO_SRCS[colorTheme] ||
    BRAND_LOGO_SRCS.blue,

  qrCenterSrc =
    QR_CENTER_SRCS[colorTheme] ||
    QR_CENTER_SRCS.blue,

  loadImage = loadCanvasImage,
}) {

  const [
    brandTitleImage,
    brandLogoImage,
    qrCenterImage,
  ] = await Promise.all([
    loadImage(brandTitleSrc),
    loadImage(brandLogoSrc),
    loadImage(qrCenterSrc),
  ])



  const config =
    CARD_CONFIGS[orientation] ||
    CARD_CONFIGS.landscape



  const canvas =
    document.createElement('canvas')


  canvas.width = config.width
  canvas.height = config.height


  const ctx =
    canvas.getContext('2d')



  const accent =
    readCssToken(
      THEME_COLOR_TOKENS[colorTheme] ||
      THEME_COLOR_TOKENS.blue,
      '#2f74c0',
    )


  const panel =
    readCssToken(
      '--surface-panel-strong',
      '#f7fbf8',
    )


  const textDeep =
    readCssToken(
      '--text-deep',
      '#203026',
    )


  const textSlate =
    readCssToken(
      '--text-slate',
      '#637268',
    )



  /*
   * background
   */

  ctx.fillStyle = panel

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height,
  )



  /*
   * decorative background
   */

  ctx.globalAlpha = 0.08

  ctx.fillStyle = accent


  ctx.fillRect(
    0,
    18,
    canvas.width,
    138,
  )


  ctx.fillRect(
    config.divider.x,
    config.divider.y,
    config.divider.width,
    2,
  )


  if (orientation === 'landscape') {
    for (
      let x = 0;
      x < canvas.width;
      x += 80
    ) {
      ctx.fillRect(
        x,
        156,
        1,
        canvas.height - 156,
      )
    }

  }


  ctx.globalAlpha = 1



  /*
   * accent bars
   */

  ctx.fillStyle = accent

  ctx.fillRect(
    0,
    0,
    canvas.width,
    18,
  )

  ctx.fillRect(
    0,
    canvas.height - 12,
    canvas.width,
    12,
  )



  /*
   * brand logo
   */

  if (
    !drawContainedImage(
      ctx,
      brandLogoImage,
      config.brandLogo.x,
      config.brandLogo.y,
      config.brandLogo.width,
      config.brandLogo.height,
    )
  ) {

    ctx.fillStyle = accent

    ctx.fillRect(
      config.brandLogo.x,
      config.brandLogo.y + 26,
      58,
      58,
    )


    ctx.fillStyle = panel

    ctx.font =
      '600 32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'


    ctx.textAlign = 'center'


    ctx.fillText(
      Array.from(brandName)[0] || '音',
      config.brandLogo.x +
        config.brandLogo.width / 2,
      config.brandLogo.y +
        config.brandLogo.height / 2 +
        16,
    )


    ctx.textAlign = 'left'
  }



  /*
   * brand title
   */

  if (
    !drawContainedImage(
      ctx,
      brandTitleImage,
      config.brandTitle.x,
      config.brandTitle.y,
      config.brandTitle.width,
      config.brandTitle.height,
    )
  ) {

    ctx.fillStyle = textSlate

    ctx.font =
      '500 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'


    ctx.fillText(
      fitText(
        ctx,
        brandName,
        config.brandTitle.width,
      ),
      config.brandTitle.x,
      config.brandTitle.y +
        config.brandTitle.height / 2 +
        14,
    )
  }


  /*
   * content title
   */

  ctx.fillStyle = textDeep

  ctx.font =
    '500 54px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'


  ctx.fillText(
    fitText(ctx, title, config.contentTitle.maxWidth),
    config.contentTitle.x,
    config.contentTitle.y,
  )



  /*
   * description
   */

  ctx.font =
    '400 32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'


  const descLines =
    wrapText(
      ctx,
      description,
      config.description.maxWidth,
    )


  descLines.forEach((line, index) => {

    ctx.fillText(
      line,
      config.description.x,
      config.description.y + index * config.description.lineHeight,
    )

  })



  /*
   * source stats
   */

  ctx.fillStyle = accent

  ctx.font =
    '500 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'


  ctx.fillText(
    statsLabel,
    config.meta.x,
    config.meta.y,
  )



  /*
   * url
   */

  ctx.fillStyle = textSlate

  ctx.font =
    '400 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'


  ctx.fillText(
    fitText(ctx, url, config.url.maxWidth),
    config.url.x,
    config.url.y,
  )



  /*
   * QR Code
   */

  drawQrCode(
    ctx,
    url,
    config.qr.x,
    config.qr.y,
    config.qr.size,
    '#17212b',
    '#ffffff',
    qrCenterImage,
  )



  /*
   * QR hint
   */

  if (qrHint) {

    ctx.fillStyle = textSlate

    ctx.font =
      '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'


    ctx.textAlign = 'center'


    ctx.fillText(
      fitText(
        ctx,
        qrHint,
        config.qrHint.maxWidth,
      ),
      config.qrHint.x,
      config.qrHint.y,
    )


    ctx.textAlign = 'left'

  }



  return canvas.toDataURL('image/png')
}