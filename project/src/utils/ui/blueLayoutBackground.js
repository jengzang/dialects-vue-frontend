// Decorative geography shares one Albers equal-area projection with live survey dots.
const RAD = Math.PI / 180
const N = (Math.sin(25 * RAD) + Math.sin(47 * RAD)) / 2
const C = Math.cos(25 * RAD) ** 2 + 2 * N * Math.sin(25 * RAD)
const ASSET_ROOT = '/backgrounds/blue/'

export function projectBackgroundPoint(lon, lat) {
  const rho = Math.sqrt(C - 2 * N * Math.sin(lat * RAD)) / N
  const theta = N * (lon - 105) * RAD
  return [rho * Math.sin(theta), rho * Math.cos(theta)]
}

function polygonRings(geojson) {
  return (geojson?.features ?? []).flatMap(({ geometry }) => {
    if (geometry?.type === 'MultiPolygon') return geometry.coordinates.flat()
    if (geometry?.type === 'Polygon') return geometry.coordinates
    return []
  })
}

export function createBackgroundMapTransform(country, box) {
  const rings = polygonRings(country)
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const ring of rings) {
    for (const [lon, lat] of ring) {
      const [x, y] = projectBackgroundPoint(lon, lat)
      minX = Math.min(minX, x); maxX = Math.max(maxX, x)
      minY = Math.min(minY, y); maxY = Math.max(maxY, y)
    }
  }
  if (!rings.length) return null
  const scale = Math.min(box.width / (maxX - minX), box.height / (maxY - minY))
  const width = (maxX - minX) * scale, height = (maxY - minY) * scale
  const x = box.x + (box.width - width) / 2, y = box.y + (box.height - height) / 2
  return {
    rings,
    scale,
    bounds: { x, y, width, height },
    point(lon, lat) {
      const [px, py] = projectBackgroundPoint(lon, lat)
      return [x + (px - minX) * scale, y + (py - minY) * scale]
    },
  }
}

export function getSurveyPoints(table) {
  const lonIndex = table?.fields?.indexOf('lon') ?? -1
  const latIndex = table?.fields?.indexOf('lat') ?? -1
  if (lonIndex < 0 || latIndex < 0) return []
  return (table.data ?? []).flatMap(row => {
    const lon = row[lonIndex], lat = row[latIndex]
    return Number.isFinite(lon) && Number.isFinite(lat) && Math.abs(lon) <= 180 && Math.abs(lat) <= 90
      ? [[lon, lat]] : []
  })
}

export function getBackgroundLayout(width, height) {
  const portrait = height >= width
  const box = (x, y, w, h) => ({ x: x * width, y: y * height, width: w * width, height: h * height })
  // Each subject is fitted separately. Unusual aspect ratios crop only decorative edges.
  const bookWidth = Math.min(width * (portrait ? 982 / 1080 : 1197 / 2560), height * (portrait ? .38 : .65) * 1448 / 876)
  const bookHeight = bookWidth * 876 / 1448
  const fontSize = Math.min(width * (portrait ? .09 : .037), height * (portrait ? .048 : .075))
  return {
    portrait,
    book: { x: -bookWidth * (243 / 1448 + .06), y: height - bookHeight * (866 / 876 - .18), width: bookWidth, height: bookHeight },
    quote: { x: width * (portrait ? .71 : .47), y: height * (portrait ? .13 : .19), fontSize, gap: portrait ? 1.23 : 1.4 },
    map: portrait ? box(0, .37, 1, .57) : box(.5, -.02, .5, 1.1),
    mountains: portrait
      ? [ { kind: 'upper', box: box(-.12, .36, .8, .26), opacity: .95 }, { kind: 'lower', box: box(-.12, .84, 1.24, .22), opacity: 1.15 }, { kind: 'upper', box: box(.48, .8, .65, .22), opacity: .85 } ]
      : [ { kind: 'upper', box: box(-.05, .31, .56, .38), opacity: .9 }, { kind: 'lower', box: box(-.08, .77, 1.18, .28), opacity: 1.15 } ],
  }
}

export async function loadBackgroundGeography(fetcher = fetch) {
  const paths = ['gis/china_country.geojson', 'gis/china_provinces.geojson', 'gis/china_rivers_l1.geojson', 'gis/china_rivers_l2.geojson', 'gis/china_rivers_l3.geojson', 'dots.json']
  const results = await Promise.allSettled(paths.map(async path => {
    const response = await fetcher(`/data/${path}`, { cache: 'no-cache' })
    if (!response.ok) throw new Error(`Background geography unavailable: ${path}`)
    return response.json()
  }))
  const values = results.map(result => result.status === 'fulfilled' ? result.value : null)
  return { country: values[0], provinces: values[1], rivers: values.slice(2, 5), dots: values[5] }
}

let resourcesPromise
export function loadBlueBackgroundResources() {
  if (!resourcesPromise) {
    const loadImage = name => new Promise(resolve => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => resolve(null)
      image.src = `${ASSET_ROOT}${name}.webp`
    })
    resourcesPromise = Promise.all([
      loadImage('base'), loadImage('fangyan'), loadImage('quote-landscape'), loadImage('quote-portrait'),
      loadImage('mountains-upper'), loadImage('mountains-lower'), loadBackgroundGeography(),
    ]).then(([base, book, quoteLandscape, quotePortrait, upper, lower, geography]) => {
      const bookMask = document.createElement('canvas')
      if (book) {
        bookMask.width = book.naturalWidth; bookMask.height = book.naturalHeight
        const ctx = bookMask.getContext('2d')
        ctx.drawImage(book, 0, 0)
        const pixels = ctx.getImageData(0, 0, bookMask.width, bookMask.height)
        for (let i = 3; i < pixels.data.length; i += 4) pixels.data[i] = pixels.data[i] ? 255 : 0
        ctx.putImageData(pixels, 0, 0)
      }
      return { base, book, bookMask, quoteLandscape, quotePortrait, upper, lower, geography }
    })
  }
  return resourcesPromise
}

function traceLine(ctx, coordinates, point, close = false) {
  if (!coordinates.length) return
  ctx.moveTo(...point(...coordinates[0]))
  for (let i = 1; i < coordinates.length; i++) ctx.lineTo(...point(...coordinates[i]))
  if (close) ctx.closePath()
}

function drawGeography(ctx, geography, map, layout, colors, width) {
  if (!map) return
  const alpha = layout.portrait ? 88 / 255 : 76 / 255
  const unit = map.bounds.width / 1000
  const countryPath = new Path2D()
  for (const ring of map.rings) traceLine(countryPath, ring, map.point, true)
  ctx.save()
  ctx.fillStyle = colors.country; ctx.globalAlpha = 12 / 255; ctx.fill(countryPath)
  ctx.clip(countryPath)
  ctx.lineWidth = .55 * unit; ctx.strokeStyle = colors.province; ctx.globalAlpha = alpha * .6
  ctx.beginPath()
  for (const ring of polygonRings(geography.provinces)) traceLine(ctx, ring, map.point)
  ctx.stroke()
  for (const level of [2, 1, 0]) {
    ctx.beginPath()
    for (const { geometry } of geography.rivers[level]?.features ?? []) {
      const lines = geometry.type === 'MultiLineString' ? geometry.coordinates : [geometry.coordinates]
      for (const line of lines) traceLine(ctx, line, map.point)
    }
    ctx.strokeStyle = colors.river; ctx.globalAlpha = alpha * [1.05, .78, .52][level]
    ctx.lineWidth = [1.65, 1.1, .75][level] * unit; ctx.stroke()
  }
  ctx.restore()
  ctx.save()
  ctx.lineWidth = 1.3; ctx.strokeStyle = colors.border; ctx.globalAlpha = alpha; ctx.stroke(countryPath)
  ctx.fillStyle = colors.dot; ctx.globalAlpha = alpha * .9
  // Single fill prevents dense survey clusters accumulating extra opacity.
  ctx.beginPath()
  const radius = Math.max(.8, (layout.portrait ? 1080 : 2560) / 2000) * 1.35 * width / (layout.portrait ? 1080 : 2560)
  for (const [lon, lat] of getSurveyPoints(geography.dots)) {
    const [x, y] = map.point(lon, lat)
    ctx.moveTo(x + radius, y); ctx.arc(x, y, radius, 0, Math.PI * 2)
  }
  ctx.fill(); ctx.restore()
}

function drawContained(ctx, image, box) {
  if (!image) return
  const scale = Math.min(box.width / image.naturalWidth, box.height / image.naturalHeight)
  const width = image.naturalWidth * scale, height = image.naturalHeight * scale
  ctx.drawImage(image, box.x + (box.width - width) / 2, box.y + box.height - height, width, height)
}

export function drawBlueLayoutBackground(canvas, resources, width, height, colors, pixelRatio = 1) {
  const ratio = Math.min(pixelRatio, 2, Math.sqrt(8_000_000 / (width * height)))
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio)
  const ctx = canvas.getContext('2d')
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  if (resources.base) {
    const image = resources.base
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
    ctx.drawImage(image, (width - image.naturalWidth * scale) / 2, (height - image.naturalHeight * scale) / 2, image.naturalWidth * scale, image.naturalHeight * scale)
  }
  const layout = getBackgroundLayout(width, height)
  const map = createBackgroundMapTransform(resources.geography.country, layout.map)
  const mountains = document.createElement('canvas'), mask = document.createElement('canvas')
  mountains.width = mask.width = canvas.width; mountains.height = mask.height = canvas.height
  const mountainCtx = mountains.getContext('2d'), maskCtx = mask.getContext('2d')
  mountainCtx.scale(ratio, ratio); maskCtx.scale(ratio, ratio)
  for (const { kind, box, opacity } of layout.mountains) {
    mountainCtx.globalAlpha = Math.min(1, opacity)
    drawContained(mountainCtx, resources[kind], box)
  }
  const { book, quote } = layout
  maskCtx.fillStyle = '#fff'
  if (map) {
    const { x, y, width: mw } = map.bounds
    const parallel = []
    for (let lon = 60; lon <= 150; lon += .25) parallel.push(map.point(lon, 17))
    maskCtx.save(); maskCtx.beginPath(); maskCtx.rect(x, y, mw, height); maskCtx.clip()
    maskCtx.beginPath(); maskCtx.moveTo(x, y); maskCtx.lineTo(x + mw, y)
    for (let i = parallel.length - 1; i >= 0; i--) maskCtx.lineTo(...parallel[i])
    maskCtx.closePath(); maskCtx.fill(); maskCtx.restore()
  }
  if (resources.book) maskCtx.drawImage(resources.bookMask, book.x, book.y, book.width, book.height)
  const fs = quote.fontSize
  maskCtx.fillRect(quote.x - (4 * quote.gap + .85) * fs - 8, quote.y - 8, (4 * quote.gap + 1.85) * fs + 16, fs * 8 + 16)
  mountainCtx.globalAlpha = 1; mountainCtx.globalCompositeOperation = 'destination-out'
  mountainCtx.filter = `blur(${12 * Math.min(width / 1080, 1.5)}px)`
  mountainCtx.drawImage(mask, 0, 0, width, height)
  mountainCtx.filter = 'none'; mountainCtx.drawImage(mask, 0, 0, width, height)
  ctx.drawImage(mountains, 0, 0, width, height)
  drawGeography(ctx, resources.geography, map, layout, colors, width)
  if (resources.book) ctx.drawImage(resources.book, book.x, book.y, book.width, book.height)
  const quoteImage = layout.portrait ? resources.quotePortrait : resources.quoteLandscape
  if (quoteImage) {
    const originalFs = layout.portrait ? 97 : 94
    const offsetX = layout.portrait ? -5.575257732 : -6.246808511
    ctx.drawImage(quoteImage, quote.x + offsetX * fs, quote.y, quoteImage.naturalWidth * fs / originalFs, quoteImage.naturalHeight * fs / originalFs)
  }
}
