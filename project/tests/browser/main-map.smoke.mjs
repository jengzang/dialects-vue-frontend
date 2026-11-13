import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'

const browser = await chromium.launch({
  executablePath: process.env.MAP_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
try {
  for (const touch of [false, true]) {
    const page = await browser.newPage({ viewport: touch ? { width: 390, height: 844 } : { width: 1280, height: 800 }, hasTouch: touch, deviceScaleFactor: touch ? 3 : 1 })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${process.env.MAP_SMOKE_BASE_URL || 'http://localhost:5173'}/tests/browser/main-map.html`)
    await page.waitForFunction(() => window.mainMap?.isStyleLoaded())
    await page.evaluate(async () => {
      const { mapStore, nextTick } = window.mainMapSmoke
      mapStore.mapData = {
        coordinates_locations: [['广州', [113, 23]], ['乙', [113, 23]]],
        region_mappings: { 广州: '甲-乙-丙', 乙: '甲-乙-丁' },
      }
      await nextTick()
      window.mainMap.jumpTo({ center: [113, 23], zoom: 10 })
    })
    await page.waitForFunction(() => window.mainMap.isSourceLoaded('map-points-source') && window.mainMap.queryRenderedFeatures({ layers: ['map-points-layer'] }).length >= 2)
    const point = await page.evaluate(() => {
      const map = window.mainMap
      const screen = map.project([113, 23]); const bounds = map.getCanvas().getBoundingClientRect()
      return { x: screen.x + bounds.left, y: screen.y + bounds.top }
    })
    assert.equal(await page.locator('.maplibregl-marker').count(), 0)
    if (touch) await page.touchscreen.tap(point.x, point.y)
    else await page.mouse.move(point.x, point.y)
    await page.locator('.maplibregl-popup-content').waitFor()
    assert.match(await page.locator('.maplibregl-popup-content').innerText(), /乙.*甲-乙-丁/s)
    await page.evaluate(async () => {
      const { mapStore, nextTick } = window.mainMapSmoke
      mapStore.mode = 'compare'
      mapStore.mergedData = [
        { location: '广州', feature: '测试', color: '#f00', coordinate: [113, 23], status: 'same' },
        { location: '重合点', feature: '测试', color: '#00f', coordinate: [113, 23], status: 'diff' },
      ]
      await nextTick()
    })
    await page.waitForFunction(() => window.mainMap.isSourceLoaded('map-points-source') && window.mainMap.queryRenderedFeatures({ layers: ['map-points-layer'] }).length >= 2)
    await page.mouse.move(0, 0)
    // Separate taps across mode changes from MapLibre's existing double-tap zoom gesture.
    if (touch) await page.waitForTimeout(350)
    if (touch) await page.touchscreen.tap(point.x, point.y)
    else await page.mouse.click(point.x, point.y)
    await page.locator('.maplibregl-popup-content .map-popup.active').waitFor()
    assert.match(await page.locator('.maplibregl-popup-content').textContent(), /重合点/)
    await page.screenshot({ path: `/tmp/main-map-${touch ? 'portrait' : 'desktop'}-popup.png` })
    // Existing popup CSS can cover the point itself; close it using the map background.
    if (touch) await page.touchscreen.tap(point.x + 120, point.y + 80)
    else await page.mouse.click(point.x + 120, point.y + 80)
    await page.waitForFunction(() => !document.querySelector('.maplibregl-popup'))
    await page.screenshot({ path: `/tmp/main-map-${touch ? 'portrait' : 'desktop'}-circles.png` })
    assert.deepEqual(errors, [])
    console.log(`${touch ? 'portrait touch' : 'desktop'}: circle rendering, overlap, popups and toggle passed`)
    await page.close()
  }
} finally { await browser.close() }
