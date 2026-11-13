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
    // Query results can arrive while the real MapPage is detached in KeepAlive.
    await page.evaluate(async () => {
      const { mapStore, feature, showMap, nextTick } = window.mainMapSmoke
      mapStore.divideMapView = true
      showMap.value = false
      await nextTick()
      mapStore.mode = 'feature'
      feature.value = '中古'
      mapStore.mapData = { coordinates_locations: [['广州', [113, 23]]] }
      mapStore.mergedData = [{ location: '广州', feature: '中古', value: 'a', color: '#ff0', coordinate: [113, 23] }]
      await nextTick()
    })
    assert.deepEqual(await page.evaluate(() => window.mainMapErrors), [])
    await page.evaluate(async () => { window.mainMapSmoke.showMap.value = true; await window.mainMapSmoke.nextTick() })
    await page.waitForFunction(() => window.mainMap.getLayer('map-points-layer') && window.mainMap.queryRenderedFeatures({ layers: ['map-points-layer'] }).some(feature => feature.properties.label === 'a'))
    await page.locator('#base-switch-container').waitFor({ state: 'visible' })
    await page.locator('#base-switch-container label').click()
    await page.waitForFunction(() => window.mainMap.queryRenderedFeatures({ layers: ['map-points-layer'] }).some(feature => feature.properties.label === '广州'))
    await page.locator('#base-switch-container label').click()
    await page.waitForFunction(() => window.mainMap.queryRenderedFeatures({ layers: ['map-points-layer'] }).some(feature => feature.properties.label === 'a'))
    await page.evaluate(async () => {
      const { mapStore, feature, nextTick } = window.mainMapSmoke
      feature.value = '测试'
      mapStore.mode = 'dot'
      mapStore.mergedData = []
      await nextTick()
    })
    await page.evaluate(async () => {
      const { mapStore, nextTick } = window.mainMapSmoke
      mapStore.mapData = {
        coordinates_locations: [['广州', [113, 23]], ['乙', [113, 23]]],
        region_mappings: { 广州: '甲-乙-丙', 乙: '甲-乙-丁' },
      }
      await nextTick()
      window.mainMap.jumpTo({ center: [113, 23], zoom: 10 })
    })
    await page.waitForFunction(() => window.mainMap.getSource('map-points-source') && window.mainMap.isSourceLoaded('map-points-source') && !window.mainMap.isMoving() && window.mainMap.queryRenderedFeatures({ layers: ['map-points-layer'] }).length >= 2)
    await page.evaluate(() => new Promise(resolve => { window.mainMap.once('idle', resolve); window.mainMap.triggerRepaint() }))
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
    await page.waitForFunction(() => window.mainMap.getSource('map-points-source') && window.mainMap.isSourceLoaded('map-points-source') && !window.mainMap.isMoving() && window.mainMap.queryRenderedFeatures({ layers: ['map-points-layer'] }).length >= 2)
    await page.evaluate(() => new Promise(resolve => { window.mainMap.once('idle', resolve); window.mainMap.triggerRepaint() }))
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
    for (const mode of ['base', 'feature']) {
      await page.evaluate(async mode => {
        const { mapStore, nextTick } = window.mainMapSmoke
        mapStore.mode = mode
        mapStore.mapData = { coordinates_locations: [['廣州地名', [113, 23]]] }
        mapStore.mergedData = [{ location: '廣州', feature: '测试', value: 'tɕʰ ŋ̍ 中文', color: '#ffff99', coordinate: [113, 23], detailContent: [{ value: 'tɕʰ', percentage: 0.7 }] }]
        await nextTick()
      }, mode)
      await page.waitForFunction(mode => window.mainMap.getSource('map-points-source') && window.mainMap.queryRenderedFeatures({ layers: ['map-points-layer'] }).some(feature => feature.properties.label === (mode === 'base' ? '廣州地名' : 'tɕʰ ŋ̍ 中文')), mode)
      assert.equal(await page.locator('.maplibregl-marker').count(), 0)
      await page.screenshot({ path: `/tmp/main-map-${touch ? 'portrait' : 'desktop'}-${mode}.png` })
      if (mode === 'feature') {
        if (touch) await page.waitForTimeout(350)
        if (touch) await page.touchscreen.tap(point.x, point.y)
        else await page.mouse.click(point.x, point.y)
        await page.locator('.maplibregl-popup-content .map-popup.active').waitFor()
        assert.match(await page.locator('.maplibregl-popup-content').textContent(), /70\.0%/)
      }
    }
    await page.evaluate(() => window.mainMapSmoke.component.value.$.setupState.handleStyleChange())
    await page.waitForFunction(() => window.mainMap.getSource('map-points-source') && window.mainMap.queryRenderedFeatures({ layers: ['map-points-layer'] }).some(feature => feature.properties.label === 'tɕʰ ŋ̍ 中文'))
    assert.equal(await page.locator('.maplibregl-popup').count(), 0)
    await page.locator('.map-point-keyboard-target').focus()
    await page.keyboard.press('Enter')
    await page.locator('.maplibregl-popup-content .map-popup.active').waitFor()
    await page.locator('.map-point-keyboard-target').focus()
    await page.keyboard.press('Enter')
    assert.equal(await page.locator('.maplibregl-popup').count(), 0)
    const oldFontSize = await page.evaluate(() => window.mainMap.getSource('map-points-source').serialize().data.features[0].properties.fontSize)
    await page.setViewportSize(touch ? { width: 844, height: 390 } : { width: 980, height: 800 })
    await page.waitForFunction(oldSize => {
      const source = window.mainMap.getSource('map-points-source')
      if (!source) return false
      const fontSize = source.serialize().data.features[0].properties.fontSize
      return fontSize !== oldSize && fontSize === window.mainMapSmoke.component.value.$.setupState.getPointLabelStyle('feature').fontSize
    }, oldFontSize)
    for (const mode of ['heatmap', 'isopleth', 'dot']) {
      await page.evaluate(async mode => {
        const { mapStore, nextTick } = window.mainMapSmoke
        mapStore.mode = mode
        mapStore.mapData = { coordinates_locations: [['甲', [113, 23]], ['乙', [113.1, 23.1]]], region_mappings: { 甲: '甲-乙', 乙: '甲-丙' } }
        mapStore.isoplethPayload = { points: [
          { location: '甲', coordinate: [113, 23], unique_syllables: { toneless: 80 } },
          { location: '乙', coordinate: [113.1, 23.1], unique_syllables: { toneless: 120 } },
        ] }
        await nextTick()
      }, mode)
      const layer = mode === 'heatmap' ? 'dot-heatmap-layer' : mode === 'isopleth' ? 'isopleth-fill-layer' : 'map-points-layer'
      await page.waitForFunction(id => !!window.mainMap.getLayer(id), layer)
      assert.equal(await page.locator('.maplibregl-marker').count(), 0)
    }
    assert.deepEqual(await page.evaluate(() => window.mainMapErrors), [])
    assert.deepEqual(errors, [])
    console.log(`${touch ? 'portrait touch' : 'desktop'}: circle/text rendering, overlap, popups, keyboard target and style restoration passed`)
    await page.close()
  }
} finally { await browser.close() }
