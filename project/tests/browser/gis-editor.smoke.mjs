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
  await page.screenshot({ path: process.env.GIS_SMOKE_SCREENSHOT || '/tmp/gis-editor-smoke.png' })
  assert.deepEqual(errors, [])
  console.log('Real MapLibre/Draw geometry smoke passed:', result)
} finally {
  await browser.close()
}
