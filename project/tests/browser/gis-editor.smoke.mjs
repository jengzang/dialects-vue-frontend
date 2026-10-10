import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'

const browser = await chromium.launch({
  executablePath: process.env.GIS_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('https://api.maptiler.com/**', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ version: 8, sources: {}, glyphs: 'https://example.com/fonts/{fontstack}/{range}.pbf', layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#ffffff' } }] }),
  }))
  await page.goto(`${process.env.GIS_SMOKE_BASE_URL || 'http://localhost:5173'}/tests/browser/gis-editor.html`)
  await page.waitForFunction(() => window.gisSmoke?.editor.value && window.gisSmokeMap?.getLayer('gl-draw-polygon-fill.cold'))
  const result = await page.evaluate(async () => {
    const smoke = window.gisSmoke
    const feature = { id: 'polygon', type: 'Feature', properties: { name: 'Area' }, geometry: { type: 'Polygon', coordinates: [[[113, 23], [114, 23], [114, 24], [113, 24], [113, 23]]] } }
    await smoke.load([feature])
    smoke.editor.value.selectVertex('polygon', '0.1')
    const rejected = smoke.editor.value.moveVertex('polygon', '0.1', [112.5, 23.5], { snapping: false })
    const preserved = JSON.stringify(smoke.editor.value.getFeatureCollection().features[0].geometry.coordinates) === JSON.stringify(feature.geometry.coordinates)
    await smoke.load([{ ...feature, geometry: { type: 'Polygon', coordinates: [[[113, 23], [114, 24], [113, 24], [114, 23], [113, 23]]] } }])
    const repaired = smoke.editor.value.repairFeatureGeometry('polygon')
    await smoke.nextTick()
    const count = smoke.model.value.features.length
    const undoCount = smoke.history.length
    await smoke.undo()
    const restored = smoke.model.value.features.length
    const unclosed = { ...feature, properties: { name: 'Unclosed', category: 'test' }, geometry: { type: 'Polygon', coordinates: [[[113, 23], [114, 23], [114, 23], [114, 24], [113, 24]]] } }
    await smoke.load([unclosed])
    const closureRepair = smoke.editor.value.repairFeatureGeometry('polygon')
    await smoke.nextTick()
    const retainedSquare = JSON.stringify(smoke.model.value.features[0].geometry.coordinates) === JSON.stringify(feature.geometry.coordinates)
    await smoke.undo()
    const exactUndo = JSON.stringify(smoke.model.value.features[0]) === JSON.stringify(unclosed)
    return { rejected, preserved, repaired, count, undoCount, restored, closureRepair, retainedSquare, exactUndo }
  })
  assert.deepEqual(result, { rejected: false, preserved: true, repaired: true, count: 2, undoCount: 1, restored: 1, closureRepair: true, retainedSquare: true, exactUndo: true })
  await page.evaluate(async () => {
    const smoke = window.gisSmoke
    await smoke.load([], 'LineString')
    smoke.snappingEnabled.value = true
    smoke.allLayers.value = [{ id: 'reference', name: 'Reference', visible: true, locked: true, featureCollection: { type: 'FeatureCollection', features: [{ id: 'reference-point', type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [113, 23] } }] } }]
    await smoke.nextTick()
    smoke.editor.value.setDrawMode('draw_line_string')
  })
  const screen = await page.evaluate(() => {
    const map = window.gisSmokeMap
    const rect = map.getCanvas().getBoundingClientRect()
    return [[113, 23], [114, 24]].map((coordinate) => { const point = map.project(coordinate); return { x: point.x + rect.left, y: point.y + rect.top } })
  })
  await page.mouse.move(screen[0].x + 5, screen[0].y + 3)
  await page.waitForFunction(() => window.gisSmoke.events.some((event) => event.event === 'snap' && event.active && event.source === 'reference'))
  await page.mouse.click(screen[0].x + 5, screen[0].y + 3)
  await page.mouse.click(screen[1].x, screen[1].y)
  await page.evaluate(() => window.gisSmoke.editor.value.setDrawMode('simple_select'))
  const line = await page.evaluate(() => window.gisSmoke.model.value.features[0])
  assert.deepEqual(line.geometry.coordinates[0], [113, 23])
  assert.equal(line.geometry.coordinates.length, 2)
  await page.evaluate(async () => {
    await window.gisSmoke.load([], 'Polygon')
    window.gisSmoke.editor.value.setDrawMode('draw_polygon')
  })
  const ringScreen = await page.evaluate(() => {
    const map = window.gisSmokeMap
    const rect = map.getCanvas().getBoundingClientRect()
    return [[113, 23], [114, 23], [114, 24]].map((coordinate) => { const point = map.project(coordinate); return { x: point.x + rect.left, y: point.y + rect.top } })
  })
  for (const point of ringScreen) await page.mouse.click(point.x, point.y)
  await page.mouse.move(ringScreen[0].x + 6, ringScreen[0].y + 4)
  await page.mouse.click(ringScreen[0].x + 6, ringScreen[0].y + 4)
  await page.waitForFunction(() => window.gisSmoke.model.value.features.length === 1)
  const ring = await page.evaluate(() => window.gisSmoke.model.value.features[0].geometry.coordinates[0])
  assert.equal(ring.length, 4)
  assert.deepEqual(ring[0], ring.at(-1))
  await page.screenshot({ path: process.env.GIS_SMOKE_SCREENSHOT || '/tmp/gis-editor-smoke.png' })
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  mobile.on('pageerror', (error) => errors.push(error.message))
  await mobile.route('https://api.maptiler.com/**', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#ffffff' } }] }) }))
  await mobile.goto(`${process.env.GIS_SMOKE_BASE_URL || 'http://localhost:5173'}/tests/browser/gis-editor.html`)
  await mobile.waitForFunction(() => window.gisSmokeDraw)
  const touchPoint = await mobile.evaluate(async () => {
    const smoke = window.gisSmoke
    await smoke.load([], 'Point')
    smoke.snappingEnabled.value = true
    smoke.allLayers.value = [{ id: 'reference', visible: true, featureCollection: { type: 'FeatureCollection', features: [{ id: 'target', type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [113, 23] } }] } }]
    await smoke.nextTick()
    smoke.editor.value.setDrawMode('draw_point')
    const map = window.gisSmokeMap
    const point = map.project([113, 23])
    const rect = map.getCanvas().getBoundingClientRect()
    return { x: point.x + rect.left + 4, y: point.y + rect.top + 2 }
  })
  await mobile.touchscreen.tap(touchPoint.x, touchPoint.y)
  await mobile.waitForFunction(() => window.gisSmoke.model.value.features.length === 1)
  assert.deepEqual(await mobile.evaluate(() => window.gisSmoke.model.value.features[0].geometry.coordinates), [113, 23])
  await mobile.screenshot({ path: '/tmp/gis-editor-mobile-smoke.png' })
  await mobile.close()
  assert.deepEqual(errors, [])
  console.log('Real MapLibre/Draw geometry, live mouse snapping and mobile touch smoke passed:', result)
} finally {
  await browser.close()
}
