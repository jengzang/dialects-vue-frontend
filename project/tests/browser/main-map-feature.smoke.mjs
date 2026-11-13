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
    await page.route('**/api/partitions?*', route => route.fulfill({ json: {
      schema_version: 2, region_mode: new URL(route.request().url()).searchParams.get('region_mode'), nodes: [],
    } }))
    await page.goto(`${process.env.MAP_SMOKE_BASE_URL || 'http://localhost:5173'}/tests/browser/main-map.html`)
    await page.waitForFunction(() => window.mainMap?.isStyleLoaded())
    await page.waitForLoadState('networkidle')
    const ready = async () => {
      await page.locator('.loading-overlay').waitFor({ state: 'hidden' })
      await page.waitForFunction(() => window.mainMap.getSource('map-points-source') && window.mainMap.isSourceLoaded('map-points-source'))
      await page.evaluate(() => new Promise(resolve => { window.mainMap.once('idle', resolve); window.mainMap.triggerRepaint() }))
    }
    for (const label of ['faʔ7', 'tɕʰ ŋ̍ 中文']) {
      await page.evaluate(async label => {
        const { mapStore, nextTick } = window.mainMapSmoke
        mapStore.mode = 'feature'
        mapStore.mergedData = [{ location: '上层地点', feature: '测试', value: label, color: '#ffb366', coordinate: [113, 23], detailContent: [{ value: label, percentage: 0.7 }] }]
        await nextTick()
        window.mainMap.jumpTo({ center: [113, 23], zoom: 10 })
      }, label)
      await ready()
      const point = await page.evaluate(() => {
        const screen = window.mainMap.project([113, 23]); const bounds = window.mainMap.getCanvas().getBoundingClientRect()
        return { x: screen.x + bounds.left, y: screen.y + bounds.top }
      })
      const clip = { x: Math.floor(point.x - 12), y: Math.floor(point.y - 5), width: 24, height: 10 }
      const single = await page.screenshot({ clip })
      await page.evaluate(async () => {
        const { mapStore, nextTick } = window.mainMapSmoke
        const top = mapStore.mergedData[0]
        mapStore.mergedData = [
          { ...top, location: '底层一', value: 'faʔ7-vaː3', coordinate: [113.001, 23.001], color: '#f7b6d2' },
          { ...top, location: '底层二', value: 'ŋ̍a', coordinate: [112.999, 22.999], color: '#a1d5e8' },
          top,
        ]
        await nextTick()
      })
      await ready()
      assert.equal(single.equals(await page.screenshot({ clip })), true, `${label}: lower labels must be fully covered inside the top card`)
      assert.equal(await page.locator('.maplibregl-marker').count(), 0)
      if (touch) await page.touchscreen.tap(point.x, point.y)
      else await page.mouse.click(point.x, point.y)
      await page.locator('.maplibregl-popup-content .map-popup.active').waitFor()
      assert.match(await page.locator('.maplibregl-popup-content').textContent(), /上层地点.*70\.0%/s)
      await page.screenshot({ path: `/tmp/main-map-feature-${touch ? 'portrait' : 'desktop'}-stacking.png` })
      await page.evaluate(() => window.mainMapSmoke.component.value.$.setupState.handleStyleChange())
      await ready()
      assert.equal(await page.locator('.maplibregl-popup').count(), 0)
      await page.locator('.map-point-keyboard-target').focus()
      await page.keyboard.press('Enter')
      await page.locator('.maplibregl-popup-content .map-popup.active').waitFor()
      if (touch) await page.touchscreen.tap(point.x + 120, point.y + 80)
      else await page.mouse.click(point.x + 120, point.y + 80)
      await page.waitForFunction(() => !document.querySelector('.maplibregl-popup'))
    }
    assert.deepEqual(await page.evaluate(() => window.mainMapErrors), [])
    assert.deepEqual(errors, [])
    console.log(`${touch ? 'portrait touch' : 'desktop'}: feature ordinary/combining label occlusion, topmost click, keyboard and style reload passed`)
    await page.close()
  }
} finally { await browser.close() }
