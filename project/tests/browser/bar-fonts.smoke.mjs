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
    assert.ok(large['desktop-label'] <= 21.61, `${bar.name}: large-screen font exceeded its cap`)
    await page.locator(`.${inner}`).evaluate(element => element.classList.add('active'))
    const activeSize = await page.locator('#desktop-label').evaluate(element => parseFloat(getComputedStyle(element).fontSize))
    assert.ok(Math.abs(activeSize - 26.4) < 0.02, `${bar.name}: active font multiplier changed`)
    for (const viewport of [[390, 844], [768, 1024], [1440, 2560]]) {
      const mobile = await measure(...viewport)
      assert.ok(mobile['mobile-label'] >= 12, `${bar.name}: stacked label below 12px at ${viewport}`)
      if (bar.name === 'CommonBar' && viewport[0] === 390) {
        assert.ok(Math.abs(mobile['mobile-icon'] - 17.28) < 0.02, 'CommonBar: mobile icon multiplier changed')
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
