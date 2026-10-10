import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'

async function verifyCrowdedHitMenu(page, touch = false) {
  const point = await page.evaluate(async () => {
    const smoke = window.gisSmoke
    await smoke.load([])
    smoke.allLayers.value = Array.from({ length: 16 }, (_, index) => ({
      id: `crowded-${index}`, name: `Reference layer ${index}: ${'Long descriptive layer name '.repeat(4)}`,
      visible: true, locked: true,
      featureCollection: { type: 'FeatureCollection', features: [{
        id: `area-${index}`, type: 'Feature', properties: { name: 'Long descriptive area name '.repeat(4) },
        geometry: { type: 'Polygon', coordinates: [[[112, 22], [115, 22], [115, 25], [112, 25], [112, 22]]] },
      }] },
    }))
    await smoke.nextTick()
    const rect = window.gisSmokeMap.getCanvas().getBoundingClientRect()
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  })
  await page.waitForFunction(() => window.gisSmokeMap.isSourceLoaded('readonly-draw-source-crowded-15'))
  if (touch) await page.touchscreen.tap(point.x, point.y)
  else await page.mouse.click(point.x, point.y)
  const menu = page.locator('[data-testid="feature-hit-candidate-menu"]')
  await menu.waitFor()
  assert.equal(await menu.locator('button').count(), 16)
  assert.equal(await page.evaluate(() => window.gisSmoke.events.filter((event) => event.event === 'click').length), 1)
  const layout = await menu.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const shell = element.parentElement.getBoundingClientRect()
    return { bounds: { menu: rect.toJSON(), shell: shell.toJSON() }, contained: rect.left >= shell.left && rect.right <= shell.right && rect.top >= shell.top && rect.bottom <= shell.bottom,
      scrollable: element.scrollHeight > element.clientHeight }
  })
  assert.equal(layout.contained, true, JSON.stringify(layout.bounds))
  assert.equal(layout.scrollable, true)
  assert.equal(await menu.locator('button').last().evaluate((button) => {
    const bounds = button.getBoundingClientRect()
    return [...button.querySelectorAll('span')].every((span) => {
      const rect = span.getBoundingClientRect()
      return rect.top >= bounds.top && rect.bottom <= bounds.bottom && rect.left >= bounds.left && rect.right <= bounds.right
    })
  }), true)
  await menu.locator('button').last().scrollIntoViewIfNeeded()
  await menu.locator('button').last().click()
  assert.equal(await page.evaluate(() => window.gisSmokeMap.getSource('draw-hit-preview-source').serialize().data.features.length), 1)
  await page.screenshot({ path: `/tmp/gis-editor-${touch ? 'mobile' : 'desktop'}-crowded-menu.png` })
}

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
  assert.equal(await page.evaluate(() => window.gisSmoke.editor.value.undoSketchPoint()), true)
  assert.equal(await page.evaluate(() => window.gisSmoke.sketchState.value.pointCount), 1)
  assert.equal(await page.evaluate(() => window.gisSmoke.model.value.features.length), 0)
  assert.equal(await page.evaluate(() => window.gisSmoke.history.length), 0)
  assert.equal(await page.evaluate(() => window.gisSmoke.editor.value.redoSketchPoint()), true)
  assert.equal(await page.evaluate(() => window.gisSmoke.editor.value.finishSketch()), true)
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
  for (const [index, point] of ringScreen.entries()) {
    await page.mouse.click(point.x, point.y)
    await page.waitForFunction((count) => window.gisSmoke.sketchState.value.pointCount === count, index + 1)
  }
  await page.mouse.move(ringScreen[0].x + 6, ringScreen[0].y + 4)
  await page.mouse.click(ringScreen[0].x + 6, ringScreen[0].y + 4)
  await page.waitForFunction(() => window.gisSmoke.model.value.features.length === 1)
  const ring = await page.evaluate(() => window.gisSmoke.model.value.features[0].geometry.coordinates[0])
  assert.equal(ring.length, 4)
  assert.deepEqual(ring[0], ring.at(-1))
  await page.evaluate(async () => {
    await window.gisSmoke.load([], 'Polygon')
    window.gisSmoke.snappingEnabled.value = false
    window.gisSmoke.editor.value.setDrawMode('draw_polygon')
  })
  for (const point of ringScreen) await page.mouse.click(point.x, point.y)
  assert.equal(await page.evaluate(() => window.gisSmoke.sketchState.value.canFinish), true)
  assert.equal(await page.evaluate(() => window.gisSmoke.editor.value.cancelSketch()), true)
  assert.equal(await page.evaluate(() => window.gisSmoke.model.value.features.length), 0)
  assert.equal(await page.evaluate(() => window.gisSmoke.history.length), 0)
  await page.evaluate(() => window.gisSmoke.editor.value.setDrawMode('draw_polygon'))
  for (const point of ringScreen) await page.mouse.click(point.x, point.y)
  await page.evaluate(() => window.gisSmoke.editor.value.setDrawMode('simple_select'))
  assert.equal(await page.evaluate(() => window.gisSmoke.model.value.features.length), 0)
  const hitPoint = await page.evaluate(async () => {
    const smoke = window.gisSmoke
    const feature = (name) => ({ id: 'shared', type: 'Feature', properties: { name }, geometry: { type: 'Polygon', coordinates: [[[113, 23], [114, 23], [114, 24], [113, 24], [113, 23]]] } })
    await smoke.load([feature('Active area')])
    smoke.snappingEnabled.value = false
    smoke.allLayers.value = [
      { ...smoke.activeLayer.value, name: 'Active layer', featureCollection: smoke.model.value },
      { id: 'reference', name: 'Reference layer', visible: true, locked: false, geometryType: 'Polygon', featureCollection: { type: 'FeatureCollection', features: [feature('Reference area')] } },
      { id: 'locked', name: 'Locked layer', visible: true, locked: true, geometryType: 'Polygon', featureCollection: { type: 'FeatureCollection', features: [feature('Locked area')] } },
      { id: 'hidden', name: 'Hidden layer', visible: false, featureCollection: { type: 'FeatureCollection', features: [feature('Hidden area')] } },
    ]
    await smoke.nextTick()
    smoke.editor.value.selectFeatures(['shared'])
    const map = window.gisSmokeMap
    const point = map.project([113.5, 23.5])
    const rect = map.getCanvas().getBoundingClientRect()
    return { x: point.x + rect.left, y: point.y + rect.top }
  })
  await page.waitForFunction(() => window.gisSmokeMap.isSourceLoaded('readonly-draw-source-reference') && window.gisSmokeMap.isSourceLoaded('readonly-draw-source-locked'))
  await page.mouse.click(hitPoint.x, hitPoint.y)
  const candidates = page.locator('[data-testid="feature-hit-candidate-button"]')
  await candidates.first().waitFor()
  assert.equal(await candidates.count(), 3)
  assert.equal(await page.evaluate(() => window.gisSmoke.events.filter((event) => event.event === 'click').length), 1)
  const locked = candidates.filter({ hasText: 'Locked layer' })
  await locked.hover()
  await locked.click()
  assert.equal(await page.evaluate(() => window.gisSmoke.activeLayer.value.id), 'active')
  assert.deepEqual(await page.evaluate(() => window.gisSmokeDraw.getSelectedIds()), ['shared'])
  assert.equal(await page.evaluate(() => {
    const data = window.gisSmokeMap.getSource('draw-hit-preview-source').serialize().data
    return (typeof data === 'string' ? JSON.parse(data) : data).features.length
  }), 1)
  await page.screenshot({ path: '/tmp/gis-editor-selection-smoke.png' })
  await candidates.filter({ hasText: 'Reference layer' }).click()
  await page.waitForFunction(() => window.gisSmoke.activeLayer.value.id === 'reference' && window.gisSmokeDraw.getSelectedIds()[0] === 'shared')
  assert.deepEqual(await page.evaluate(() => window.gisSmokeDraw.get('shared').properties.name), 'Reference area')
  assert.equal(await page.locator('[data-testid="feature-hit-candidate-menu"]').count(), 0)
  await page.evaluate(async () => {
    const smoke = window.gisSmoke
    await smoke.load([{ id: 'small', type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[113, 23], [114, 23], [114, 24], [113, 24], [113, 23]]] } }])
    smoke.snappingEnabled.value = true
    smoke.snapTolerance.value = 60
    smoke.allLayers.value = [{ id: 'snap-reference', visible: true, locked: true, featureCollection: { type: 'FeatureCollection', features: [{ id: 'target', type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [113, 23] } }] } }]
    await smoke.nextTick()
    smoke.editor.value.selectVertex('small', '0.0')
  })
  await page.waitForFunction(() => window.gisSmokeMap.queryRenderedFeatures().some((feature) => feature.properties?.meta === 'midpoint' && feature.properties.coord_path === '0.4'))
  const midpoint = await page.evaluate(() => {
    const map = window.gisSmokeMap
    const feature = map.queryRenderedFeatures().find((item) => item.properties?.meta === 'midpoint' && item.properties.coord_path === '0.4')
    const point = map.project(feature.geometry.coordinates)
    const rect = map.getCanvas().getBoundingClientRect()
    return { x: point.x + rect.left, y: point.y + rect.top }
  })
  await page.mouse.click(midpoint.x, midpoint.y)
  await page.waitForFunction(() => window.gisSmoke.events.some((event) => event.code === 'geometryInvalid'))
  assert.equal(await page.evaluate(() => window.gisSmokeDraw.get('small').geometry.coordinates[0].length), 5)
  assert.equal(await page.evaluate(() => window.gisSmoke.history.length), 0)
  await page.evaluate(async () => {
    window.gisSmoke.snappingEnabled.value = false
    await window.gisSmoke.nextTick()
  })
  const vertex = await page.evaluate(() => {
    const point = window.gisSmokeMap.project([113, 23])
    const rect = window.gisSmokeMap.getCanvas().getBoundingClientRect()
    return { x: point.x + rect.left, y: point.y + rect.top }
  })
  await page.mouse.move(vertex.x, vertex.y)
  await page.mouse.down()
  await page.mouse.move(vertex.x - 25, vertex.y + 25, { steps: 5 })
  await page.mouse.up()
  await page.waitForFunction(() => window.gisSmoke.history.length === 1)
  assert.notDeepEqual(await page.evaluate(() => window.gisSmoke.model.value.features[0].geometry.coordinates[0][0]), [113, 23])
  await page.screenshot({ path: process.env.GIS_SMOKE_SCREENSHOT || '/tmp/gis-editor-smoke.png' })
  const vertexHistory = await page.evaluate(async () => {
    const smoke = window.gisSmoke
    await smoke.load([{ id: 'continuous', type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[113, 23], [114, 23], [114, 24], [113, 24], [113, 23]]] } }])
    smoke.editor.value.selectVertex('continuous', '0.1')
    smoke.commitHistory()
    const deleted = smoke.editor.value.deleteSelected()
    await smoke.nextTick()
    const adjacent = smoke.editor.value.getEditContext()
    const adjacentPoint = window.gisSmokeDraw.getSelectedPoints().features[0]?.geometry.coordinates
    await smoke.undo()
    const undoPoint = window.gisSmokeDraw.getSelectedPoints().features[0]?.geometry.coordinates
    await smoke.redo()
    const redoPoint = window.gisSmokeDraw.getSelectedPoints().features[0]?.geometry.coordinates
    return { deleted, adjacentPath: adjacent.coordPaths[0], adjacentPoint, undoPoint, redoPoint }
  })
  assert.deepEqual(vertexHistory, { deleted: true, adjacentPath: '0.1', adjacentPoint: [114, 24], undoPoint: [114, 23], redoPoint: [114, 24] })
  const adjacentScreen = await page.evaluate(async () => {
    const smoke = window.gisSmoke
    await smoke.load([{ id: 'drag-after-delete', type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[113, 23], [114, 23], [114, 24], [113, 24], [113, 23]]] } }])
    smoke.editor.value.selectVertex('drag-after-delete', '0.1')
    smoke.editor.value.deleteSelected()
    await smoke.nextTick()
    const point = window.gisSmokeMap.project([114, 24])
    const rect = window.gisSmokeMap.getCanvas().getBoundingClientRect()
    return { x: point.x + rect.left, y: point.y + rect.top }
  })
  await page.waitForFunction(() => window.gisSmokeMap.queryRenderedFeatures().some((feature) => feature.properties?.parent === 'drag-after-delete' && feature.properties.coord_path === '0.1'))
  await page.mouse.move(adjacentScreen.x, adjacentScreen.y)
  await page.mouse.down()
  await page.mouse.move(adjacentScreen.x + 20, adjacentScreen.y + 10, { steps: 5 })
  await page.mouse.up()
  assert.notDeepEqual(await page.evaluate(() => window.gisSmoke.model.value.features[0].geometry.coordinates[0][1]), [114, 24])
  await verifyCrowdedHitMenu(page)
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
  await verifyCrowdedHitMenu(mobile, true)
  await mobile.close()
  assert.deepEqual(errors, [])
  console.log('Real MapLibre/Draw geometry, live mouse snapping and mobile touch smoke passed:', result)
} finally {
  await browser.close()
}
