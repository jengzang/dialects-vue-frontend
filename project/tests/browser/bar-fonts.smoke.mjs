import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { compileString } from 'sass'
import { parse } from '@vue/compiler-sfc'
import { chromium } from 'playwright-core'

// Exercise the real bar SCSS and template font bindings without API-dependent page content.
const projectRoot = fileURLToPath(new URL('../../', import.meta.url))
const importers = [{
  findFileUrl(url) {
    return url.startsWith('@/') ? pathToFileURL(resolve(projectRoot, 'src', url.slice(2))) : null
  },
}]
const globalCss = compileString(readFileSync(resolve(projectRoot, 'src/styles/global/_tokens.scss'), 'utf8')).css
const tab = { fontSize: 1.2, mobileFontSize: 0.9 }
const bars = ['NavBar', 'ExploreBar', 'CommonBar'].map(name => {
  const file = resolve(projectRoot, `src/components/bar/${name}.vue`)
  const source = readFileSync(file, 'utf8')
  const { descriptor } = parse(source)
  const css = compileString(descriptor.styles[0].content, { url: pathToFileURL(file), importers }).css
  const fontBindings = [...descriptor.template.content.matchAll(/fontSize:\s*([^\n}]+)/g)]
    .map(match => Function('t', `return (${match[1].trim()})`)(tab))
  // CommonBar also has icon-specific inline sizes in each layout.
  const mobileIndex = name === 'CommonBar' ? 2 : 1
  return { name, css, desktopSize: fontBindings[0], mobileSize: fontBindings[mobileIndex],
    desktopIconSize: name === 'CommonBar' ? fontBindings[1] : '',
    mobileIconSize: name === 'CommonBar' ? fontBindings[3] : '' }
})

const browser = await chromium.launch({
  executablePath: process.env.FONT_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
})

try {
  const page = await browser.newPage()
  // Check both sides of all six breakpoints, including actual rem spacing.
  const widthCases = [
    [299, 1], [300, 0.92], [559, 0.92], [560, 0.94],
    [767, 0.94], [768, 0.96], [1023, 0.96], [1024, 0.98],
    [1279, 0.98], [1280, 1], [1535, 1], [1536, 1.04], [3840, 1.04],
  ]
  const fontSizes = [12, 13, 14, 16, 18, 20, 24, 28, 32, 48]
  for (const [width, scale] of widthCases) {
    await page.setViewportSize({ width, height: Math.max(100, Math.floor(width / 2)) })
    await page.setContent(`<style>${globalCss}</style>${fontSizes.map(size =>
      `<span id="size-${size}" style="font-size:var(--font-size-${size});padding:1rem;margin:1rem">文字</span>`).join('')}`)
    const measured = await page.evaluate(sizes => ({
      root: getComputedStyle(document.documentElement).fontSize,
      sizes: sizes.map(size => {
        const style = getComputedStyle(document.getElementById(`size-${size}`))
        return { font: parseFloat(style.fontSize), padding: style.paddingTop, margin: style.marginTop }
      }),
    }), fontSizes)
    assert.equal(measured.root, '16px', `${width}px: root font must retain the browser default`)
    measured.sizes.forEach((actual, index) => {
      const baseSize = fontSizes[index] === 12 ? 11 : fontSizes[index]
      const expected = Math.max(10, baseSize * scale)
      assert.ok(Math.abs(actual.font - expected) < 0.02, `${width}px: font ${fontSizes[index]} expected ${expected}, received ${actual.font}`)
      assert.equal(actual.padding, '16px', `${width}px: rem padding changed`)
      assert.equal(actual.margin, '16px', `${width}px: rem margin changed`)
    })
    await page.setViewportSize({ width, height: width * 2 })
    const portraitFont = await page.locator('#size-16').evaluate(element => parseFloat(getComputedStyle(element).fontSize))
    assert.ok(Math.abs(portraitFont - 16 * scale) < 0.02, `${width}px: orientation added an unwanted font multiplier`)
  }
  console.log('Six font breakpoints: boundaries, ten tokens (legacy 12 = 11px), orientation independence and unchanged root/rem spacing verified')
  for (const bar of bars) {
    const prefix = bar.name === 'NavBar' ? 'navbar' : bar.name === 'ExploreBar' ? 'explorebar' : 'commonbar'
    const item = bar.name === 'NavBar' ? 'menu-item' : 'tab-item'
    const inner = bar.name === 'NavBar' ? 'menu-inner' : 'tab-inner'
    const fixture = `<style>${globalCss}\n${bar.css}\n* { transition: none !important; }</style>
      <div class="${prefix}">
        <div class="${prefix}-desktop">
          <a class="${item}" style="font-size:${bar.desktopSize}">
            <span class="${inner}"><span class="nav-icon" id="desktop-icon" style="font-size:${bar.desktopIconSize}">⚙️</span><span class="label" id="desktop-label">导航文字</span></span>
          </a>
        </div>
        <div class="${prefix}-mobile navbar-content">
          <a class="${item}" style="font-size:${bar.mobileSize}">
            <span class="tab-icon-label tab-icon-label--stack"><span class="tab-icon-row"><span class="nav-icon" id="mobile-icon" style="font-size:${bar.mobileIconSize}">⚙️</span></span><span class="label label--tiny" id="mobile-label">导航文字</span></span>
          </a>
        </div>
      </div>`
    const measure = async (width, height, root = 16) => {
      await page.setViewportSize({ width, height })
      await page.setContent(fixture)
      await page.evaluate(size => { document.documentElement.style.fontSize = `${size}px` }, root)
      return page.evaluate(() => Object.fromEntries(['desktop-label', 'mobile-label', 'desktop-icon', 'mobile-icon'].map(id => [
        id, parseFloat(getComputedStyle(document.getElementById(id)).fontSize),
      ])))
    }
    const normal = await measure(1440, 900)
    const large = await measure(3840, 2160)
    assert.ok(Math.abs(normal['desktop-label'] - 17.28) < 0.02, `${bar.name}: ordinary desktop size changed`)
    assert.ok(large['desktop-label'] > normal['desktop-label'], `${bar.name}: large-screen font did not grow`)
    assert.ok(Math.abs(large['desktop-label'] - 22.464) < 0.02, `${bar.name}: 2xl font scale incorrect`)
    await page.locator(`.${inner}`).evaluate(element => element.classList.add('active'))
    const activeSize = await page.locator('#desktop-label').evaluate(element => parseFloat(getComputedStyle(element).fontSize))
    assert.ok(Math.abs(activeSize - 27.456) < 0.02, `${bar.name}: active font multiplier changed`)
    for (const viewport of [[390, 844], [768, 1024], [1440, 2560]]) {
      const mobile = await measure(...viewport)
      assert.ok(mobile['mobile-label'] >= 10, `${bar.name}: stacked label below 10px at ${viewport}`)
      if (bar.name === 'CommonBar' && viewport[0] === 390) {
        assert.ok(Math.abs(mobile['mobile-icon'] - 15.8976) < 0.02, 'CommonBar: mobile icon multiplier changed')
      }
    }
    if (bar.name === 'CommonBar') {
      assert.ok(Math.abs(normal['desktop-icon'] - 19.2) < 0.02, 'CommonBar: desktop icon must use desktop config')
    }
    const accessible = await measure(1440, 900, 20)
    assert.ok(accessible['desktop-label'] > normal['desktop-label'], `${bar.name}: root font preference ignored`)
    console.log(`${bar.name}: desktop ${normal['desktop-label']}px → large ${large['desktop-label']}px; portrait minimum and root scaling verified`)
  }
} finally {
  await browser.close()
}
