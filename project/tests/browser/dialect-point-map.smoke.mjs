import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'

const browser = await chromium.launch({
  executablePath: process.env.MAP_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
try {
  for (const portrait of [false, true]) {
    const page = await browser.newPage({ viewport: portrait ? { width: 390, height: 844 } : { width: 1280, height: 800 }, hasTouch: portrait, deviceScaleFactor: portrait ? 3 : 1 })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto((process.env.MAP_SMOKE_BASE_URL || 'http://localhost:5173') + '/tests/browser/dialect-point-map.html')
    await page.waitForFunction(() => window.dialectMap?.isStyleLoaded())
    const ready = async () => {
      await page.waitForFunction(() => window.dialectMap.getSource('home-dialect-points') && window.dialectMap.isSourceLoaded('home-dialect-points'))
      await page.evaluate(() => new Promise(resolve => { window.dialectMap.once('idle', resolve); window.dialectMap.triggerRepaint() }))
    }
    // Every point must render, including points fully behind another label.
    await page.evaluate(async () => {
      const { state, nextTick } = window.dialectSmoke
      state.points = Array.from({ length: 3000 }, (_, i) => ({ longitude: 113, latitude: 23, locationName: '地点' + i, entryCount: i + 1, yindianRegion: '分区' + i % 20 }))
      await nextTick()
      window.dialectMap.jumpTo({ center: [113, 23], zoom: 8 })
    })
    await ready()
    assert.equal(await page.locator('.maplibregl-marker').count(), 0)
    assert.equal(await page.evaluate(() => window.dialectMap.queryRenderedFeatures({ layers: ['home-dialect-labels'] }).length), 3000, 'all coincident labels must remain rendered')
    assert.equal(await page.evaluate(() => window.dialectMap.getLayoutProperty('home-dialect-labels', 'icon-allow-overlap')), true)
    assert.equal(await page.evaluate(() => window.dialectMap.listImages().length), 3000)

    // Compare the full opaque interior, not only a few pixels at the label center.
    for (const name of ['上层广州', 'ŋ̍ 中文']) {
      const clip = await page.evaluate(async name => {
        const { state, nextTick } = window.dialectSmoke
        state.points = [{ longitude: 113, latitude: 23, locationName: name, entryCount: 12345, yindianRegion: '上层分区' }]
        await nextTick()
        window.dialectMap.jumpTo({ center: [113, 23], zoom: 10 })
        const screen = window.dialectMap.project([113, 23])
        const bounds = window.dialectMap.getCanvas().getBoundingClientRect()
        const probe = document.createElement('span')
        probe.className = 'dialect-point-marker__name'
        document.body.append(probe)
        const css = getComputedStyle(probe)
        const context = document.createElement('canvas').getContext('2d')
        context.font = css.fontWeight + ' ' + css.fontSize + ' ' + css.fontFamily
        const width = Math.ceil(context.measureText(name).width) + 14
        probe.remove()
        return { x: Math.ceil(bounds.left + screen.x - width / 2 + 5), y: Math.ceil(bounds.top + screen.y - 35.2 / 2 + 3), width: width - 10, height: 14 }
      }, name)
      await ready()
      const alone = await page.screenshot({ clip })
      await page.evaluate(async () => {
        const { state, nextTick } = window.dialectSmoke
        const top = state.points[0]
        state.points = Array.from({ length: 30 }, (_, i) => ({ ...top, locationName: '不同底层标签' + i, entryCount: i, yindianRegion: '底层' + i % 20 })).concat(top)
        await nextTick()
      })
      await ready()
      assert.equal(alone.equals(await page.screenshot({ clip })), true, 'lower text must not show through the upper badge: ' + name)
      assert.equal(await page.evaluate(() => window.dialectMap.queryRenderedFeatures({ layers: ['home-dialect-labels'] }).length), 31)
    }

    await page.screenshot({ path: '/tmp/dialect-map-' + (portrait ? 'portrait' : 'desktop') + '.png' })
    await page.evaluate(async () => { window.dialectSmoke.state.fullscreen = true; await window.dialectSmoke.nextTick() })
    await ready()
    assert.equal(await page.evaluate(() => window.dialectMap.queryRenderedFeatures({ layers: ['home-dialect-labels'] }).length), 31)
    await page.evaluate(async () => { window.dialectSmoke.state.points = []; await window.dialectSmoke.nextTick() })
    await ready()
    assert.equal(await page.evaluate(() => window.dialectMap.queryRenderedFeatures({ layers: ['home-dialect-labels'] }).length), 0)
    assert.equal(await page.evaluate(() => window.dialectMap.listImages().length), 0)
    assert.deepEqual(await page.evaluate(() => window.mapErrors), [])
    assert.deepEqual(errors, [])
    console.log((portrait ? 'portrait touch' : 'desktop') + ': all 3000 coincident labels rendered, whole-label occlusion, fullscreen and clearing passed')
    await page.close()
  }
} finally { await browser.close() }
